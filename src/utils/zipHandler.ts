import JSZip from 'jszip';
import { Attachment, ChatMetadata, ChatSession, MediaType, Message } from '../types/chat';
import { buildMessagesWithAttachments, cleanText, detectMediaType, parseChatRawLines } from './whatsappParser';

export interface ParseProgress {
  step: 'reading' | 'unzipping' | 'detecting' | 'processing_media' | 'parsing_chat' | 'complete' | 'error';
  progress: number; // 0 to 100
  message: string;
}

// Registry to track created Object URLs for memory cleanup
const allCreatedObjectUrls: string[] = [];

export function revokeChatObjectUrls(urls: string[]) {
  for (const url of urls) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
      const idx = allCreatedObjectUrls.indexOf(url);
      if (idx !== -1) {
        allCreatedObjectUrls.splice(idx, 1);
      }
    }
  }
}

export function revokeAllObjectUrls() {
  while (allCreatedObjectUrls.length > 0) {
    const url = allCreatedObjectUrls.pop();
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
    }
  }
}

/**
 * Get accurate MIME type for a given filename
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'opus':
      return 'audio/ogg; codecs=opus';
    case 'ogg':
      return 'audio/ogg';
    case 'mp3':
      return 'audio/mpeg';
    case 'm4a':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    case 'wav':
      return 'audio/wav';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'webm':
      return 'video/webm';
    case '3gp':
      return 'video/3gpp';
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Clean a string from WhatsApp export prefixes
 */
function cleanWhatsAppPrefix(str: string): string {
  return str
    .replace(/^WhatsApp Chat -\s*/i, '')
    .replace(/^WhatsApp Chat with\s*/i, '')
    .replace(/^Chat de WhatsApp con\s*/i, '')
    .replace(/^Chat de WhatsApp -\s*/i, '')
    .replace(/^_chat$/i, '')
    .trim();
}

/**
 * Derives a clean chat title according to requested priority:
 * 1. Name identifiable in the export (TXT file title or system group name)
 * 2. Name of the ZIP file
 * 3. Derived from participants
 */
export function deriveChatTitle(
  txtFileName: string,
  zipFileName?: string,
  systemGroupName?: string,
  participants: string[] = []
): string {
  // 1. Group name detected from system messages
  if (systemGroupName && systemGroupName.trim()) {
    return systemGroupName.trim();
  }

  // 2. Name from TXT file name if specific (not generic "_chat")
  const baseTxt = txtFileName.replace(/\.txt$/i, '');
  const cleanFromTxt = cleanWhatsAppPrefix(baseTxt);
  if (cleanFromTxt && cleanFromTxt.toLowerCase() !== '_chat') {
    return cleanFromTxt;
  }

  // 3. Name from ZIP file name if provided
  if (zipFileName) {
    const baseZip = zipFileName.replace(/\.zip$/i, '');
    const cleanFromZip = cleanWhatsAppPrefix(baseZip);
    if (cleanFromZip && cleanFromZip.toLowerCase() !== '_chat') {
      return cleanFromZip;
    }
  }

  // 4. Derive from participants (exclude "Tú", "You", "Sistema")
  const otherParticipants = participants.filter((p) => {
    const lower = p.toLowerCase();
    return lower !== 'tú' && lower !== 'you' && lower !== 'sistema';
  });

  if (otherParticipants.length === 1) {
    return otherParticipants[0];
  } else if (otherParticipants.length > 1 && otherParticipants.length <= 3) {
    return otherParticipants.join(', ');
  } else if (otherParticipants.length > 3) {
    return `${otherParticipants[0]}, ${otherParticipants[1]} y ${otherParticipants.length - 2} más`;
  }

  return 'Chat de WhatsApp';
}

/**
 * Parses a ZIP file in the browser completely client-side
 */
export async function parseWhatsAppZip(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<{
  messages: Message[];
  metadata: ChatMetadata;
  objectUrls: string[];
}> {
  const currentChatObjectUrls: string[] = [];

  onProgress?.({
    step: 'reading',
    progress: 10,
    message: `Leyendo ${file.name}...`,
  });

  const zip = new JSZip();
  let zipContent: JSZip;
  try {
    zipContent = await zip.loadAsync(file);
  } catch (err) {
    throw new Error(`No se pudo abrir ${file.name}. Asegúrate de que sea un archivo ZIP válido.`);
  }

  onProgress?.({
    step: 'unzipping',
    progress: 30,
    message: 'Examinando archivos del chat y multimedia...',
  });

  // Collect all files excluding macOS metadata
  const fileEntries: JSZip.JSZipObject[] = [];
  zipContent.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.includes('__MACOSX/') && !relativePath.startsWith('._')) {
      fileEntries.push(zipEntry);
    }
  });

  if (fileEntries.length === 0) {
    throw new Error(`El archivo ${file.name} está vacío.`);
  }

  // Find the chat text file (.txt)
  const txtFiles = fileEntries.filter((entry) => entry.name.toLowerCase().endsWith('.txt'));
  if (txtFiles.length === 0) {
    throw new Error(`No se encontró ningún archivo de texto (.txt) del chat de WhatsApp en ${file.name}.`);
  }

  // Choose the most likely chat file:
  // Prefer "_chat.txt" (iOS) or "Chat de WhatsApp con..." (Android) or largest .txt
  let targetTxtFile = txtFiles.find((f) => {
    const lower = f.name.toLowerCase();
    return lower.endsWith('_chat.txt') || lower.includes('chat de whatsapp') || lower.includes('whatsapp chat');
  });

  if (!targetTxtFile) {
    targetTxtFile = txtFiles[0];
  }

  onProgress?.({
    step: 'detecting',
    progress: 45,
    message: `Leyendo conversación (${targetTxtFile.name})...`,
  });

  const rawChatText = await targetTxtFile.async('text');

  // Process and index all media files
  onProgress?.({
    step: 'processing_media',
    progress: 60,
    message: 'Extrayendo imágenes, notas de voz, videos y stickers...',
  });

  const mediaMap = new Map<string, Attachment>();
  const nonTxtFiles = fileEntries.filter(
    (f) => f !== targetTxtFile && !f.name.toLowerCase().endsWith('.txt')
  );

  let processedCount = 0;
  for (const entry of nonTxtFiles) {
    const rawFileName = entry.name;
    const baseName = rawFileName.split(/[/|\\]/).pop() || rawFileName;
    const cleanBase = cleanText(baseName);
    const mimeType = getMimeType(cleanBase);
    const mediaType = detectMediaType(cleanBase);

    try {
      const blob = await entry.async('blob');
      // Create specific blob with known mime type
      const typedBlob = new Blob([blob], { type: mimeType });
      const objectUrl = URL.createObjectURL(typedBlob);
      currentChatObjectUrls.push(objectUrl);
      allCreatedObjectUrls.push(objectUrl);

      const attachment: Attachment = {
        fileName: cleanBase,
        originalName: rawFileName,
        extension: cleanBase.split('.').pop() || '',
        mimeType,
        mediaType,
        blob: typedBlob,
        url: objectUrl,
        size: blob.size,
      };

      // Store in media map with lower-case key for resilient lookup
      const lower = cleanBase.toLowerCase();
      mediaMap.set(lower, attachment);
      try {
        const decoded = decodeURIComponent(lower);
        if (decoded !== lower) {
          mediaMap.set(decoded, attachment);
        }
      } catch {
        // Ignore URI decode errors
      }

      // If fileName has prefix sequence numbers like "00004479-STICKER...", also store stripped key
      const stripped = lower.replace(/^\d{4,10}-/, '');
      if (stripped !== lower) {
        mediaMap.set(stripped, attachment);
      }
    } catch (err) {
      console.warn(`No se pudo procesar el archivo ${rawFileName}:`, err);
    }

    processedCount++;
    if (processedCount % 5 === 0 || processedCount === nonTxtFiles.length) {
      const mediaProgress = 60 + Math.floor((processedCount / nonTxtFiles.length) * 25);
      onProgress?.({
        step: 'processing_media',
        progress: mediaProgress,
        message: `Extrayendo archivos multimedia (${processedCount} de ${nonTxtFiles.length})...`,
      });
    }
  }

  onProgress?.({
    step: 'parsing_chat',
    progress: 90,
    message: 'Reconstruyendo cronología de mensajes y asociando contenido...',
  });

  const rawMessages = parseChatRawLines(rawChatText);
  if (rawMessages.length === 0) {
    throw new Error('No se encontraron mensajes válidos de WhatsApp en el archivo de texto.');
  }

  const { messages, unmatchedMedia } = buildMessagesWithAttachments(rawMessages, mediaMap);

  // Compute metadata
  const participantSet = new Set<string>();
  let groupNameDetected: string | undefined = undefined;

  let imagesCount = 0;
  let videosCount = 0;
  let audiosCount = 0;
  let stickersCount = 0;
  let gifsCount = 0;
  let documentsCount = 0;

  for (const msg of messages) {
    if (!msg.isSystem && msg.sender) {
      participantSet.add(msg.sender);
    } else if (msg.isSystem && msg.systemType === 'group_created') {
      const match = msg.text.match(/["'](.*?)["']/);
      if (match) groupNameDetected = match[1];
    }

    if (msg.attachment) {
      switch (msg.attachment.mediaType) {
        case 'image':
          imagesCount++;
          break;
        case 'video':
          videosCount++;
          break;
        case 'audio':
        case 'voice':
          audiosCount++;
          break;
        case 'sticker':
          stickersCount++;
          break;
        case 'gif':
          gifsCount++;
          break;
        case 'document':
          documentsCount++;
          break;
      }
    }
  }

  const participants = Array.from(participantSet);
  const isGroup = participants.length > 2 || !!groupNameDetected;
  const title = deriveChatTitle(targetTxtFile.name, file.name, groupNameDetected, participants);

  const startDate = messages.length > 0 ? messages[0].rawDate : undefined;
  const endDate = messages.length > 0 ? messages[messages.length - 1].rawDate : undefined;

  const metadata: ChatMetadata = {
    title,
    isGroup,
    participants,
    totalMessages: messages.length,
    startDate,
    endDate,
    mediaCounts: {
      images: imagesCount,
      videos: videosCount,
      audios: audiosCount,
      stickers: stickersCount,
      gifs: gifsCount,
      documents: documentsCount,
      total: imagesCount + videosCount + audiosCount + stickersCount + gifsCount + documentsCount,
    },
    unmatchedFilesCount: unmatchedMedia.length,
    unmatchedFiles: unmatchedMedia,
  };

  onProgress?.({
    step: 'complete',
    progress: 100,
    message: '¡Chat reconstruido exitosamente!',
  });

  return { messages, metadata, objectUrls: currentChatObjectUrls };
}

export function createChatSessionFromData(
  id: string,
  title: string,
  messages: Message[],
  metadata: ChatMetadata,
  objectUrls: string[],
  zipFileName?: string
): ChatSession {
  const selfNamed = metadata.participants.find(
    (p) => p.toLowerCase() === 'tú' || p.toLowerCase() === 'you'
  );
  const currentUser = selfNamed || metadata.participants[0] || 'Tú';

  // Last non-system message for preview
  const lastMsg =
    [...messages].reverse().find((m) => !m.isSystem) || messages[messages.length - 1];

  let previewText = '';
  let mediaType: MediaType | undefined = undefined;

  if (lastMsg) {
    if (lastMsg.attachment) {
      mediaType = lastMsg.attachment.mediaType;
      if (lastMsg.attachment.mediaType === 'image') previewText = '[Foto]';
      else if (lastMsg.attachment.mediaType === 'video') previewText = '[Video]';
      else if (
        lastMsg.attachment.mediaType === 'audio' ||
        lastMsg.attachment.mediaType === 'voice'
      )
        previewText = '[Audio]';
      else if (lastMsg.attachment.mediaType === 'sticker') previewText = '[Sticker]';
      else if (lastMsg.attachment.mediaType === 'gif') previewText = '[GIF]';
      else if (lastMsg.attachment.mediaType === 'document') previewText = '[Documento]';
      if (lastMsg.text) {
        previewText += ` ${lastMsg.text}`;
      }
    } else {
      previewText = lastMsg.text || '';
    }
  }

  return {
    id,
    title,
    zipFileName,
    metadata,
    messages,
    currentUser,
    objectUrls,
    lastMessagePreview: lastMsg
      ? {
          sender: lastMsg.sender,
          text: previewText,
          time: lastMsg.rawTime,
          date: lastMsg.rawDate,
          mediaType,
        }
      : undefined,
  };
}
