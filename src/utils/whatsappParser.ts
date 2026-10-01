import { Attachment, Message, MediaType } from '../types/chat';

// Common regex patterns for WhatsApp timestamps
// Matches:
// - Android: "29/09/2026, 14:35 - " or "29/09/26, 2:35 p. m. - " or "9/29/26, 2:35 PM - "
// - iOS: "[29/09/2026, 14:35:22] " or "[29/09/26, 2:35:22 p. m.] "
const ANDROID_START_REGEX = /^(\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F\u00A0]*[aApP]\.?[\s\u202F\u00A0]*[mM]\.?)?)\s*[-–—]\s*(.*)$/;
const IOS_START_REGEX = /^\[(\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F\u00A0]*[aApP]\.?[\s\u202F\u00A0]*[mM]\.?)?)\]\s*(.*)$/;

// Regex to clean invisible Unicode marks & formatting chars that WhatsApp inserts
const INVISIBLE_CHARS_REGEX = /[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF\u00A0\u202F\u200B\u200C\u200D]/g;

// Detect attached filenames in messages
// Examples:
// <adjunto: 00004479-STICKER-2026-09-04-13-47-36.webp>
// <adjunto: IMG-20260929-WA0001.jpg>
// <attached: 00000001-PHOTO-2026-09-29.jpg>
// 00004479-STICKER-2026-09-04-13-47-36.webp (archivo adjunto)
// IMG-20260929-WA0001.jpg (file attached)
// IMG-20260929-WA0001.jpg <archivo adjunto>
const ATTACHMENT_PATTERNS = [
  /<(?:adjunto|attached|anexo|pièce jointe|angehängt|allegato):\s*([^>]+)>/i,
  /([a-zA-Z0-9_\-\.\s()]+\.(?:jpg|jpeg|png|webp|gif|mp4|mov|opus|ogg|mp3|m4a|aac|wav|pdf|docx|xlsx|zip|txt))\s*(?:\((?:archivo adjunto|file attached|fichier attaché|angehängte datei|allegato)\)|<(?:archivo adjunto|file attached)>)/i,
  /([a-zA-Z0-9_\-]+\.(?:jpg|jpeg|png|webp|gif|mp4|mov|opus|ogg|mp3|m4a|aac|wav|pdf|docx|xlsx|zip|txt))/i,
];

// Omitted media indicator phrases
const OMITTED_MEDIA_REGEX = /<(?:archivo omitido|media omitted|medien ausgeschlossen|fichier omis|audio omitido|imagen omitida|video omitido|sticker omitido)>/i;

// WhatsApp edited message patterns
const EDITED_TAG_REGEX = /[\s\n]*<(?:Se editó este mensaje|This message was edited|Ce message a été modifié|Diese Nachricht wurde bearbeitet)\.?>/gi;
const EDITED_PAREN_REGEX = /[\s\n]*\((?:Se editó este mensaje|This message was edited)\.?\)/gi;

// WhatsApp forwarded message patterns
const FORWARDED_REGEX = /^(?:Mensaje reenviado|Reenviado|Forwarded message|Forwarded|Transféré|Weitergeleitete Nachricht):\s*\n?/i;

// WhatsApp status / story reply patterns
const STORY_REPLY_REGEX = /^(?:Respondió a tu estado|Respondió a tu historia|Respondió a un estado|Respondió al estado de\s+([^:\n]+)|Replied to your status|Replied to your story|Replied to status):\s*\n?/i;

export interface RawParsedMessage {
  rawDate: string;
  rawTime: string;
  sender: string;
  content: string;
  isSystem: boolean;
}

export function cleanText(str: string): string {
  if (!str) return '';
  return str.replace(INVISIBLE_CHARS_REGEX, '').trim();
}

/**
 * Parses timestamp into numeric epoch for reliable sorting,
 * handling both DD/MM/YYYY and MM/DD/YYYY variants without breaking on different locales.
 */
export function parseDateToEpoch(dateStr: string, timeStr: string): number {
  try {
    const cleanDate = cleanText(dateStr);
    const cleanTime = cleanText(timeStr).replace(/[\u202F\u00A0]/g, ' ');

    const dateParts = cleanDate.split(/[/.-]/).map(p => parseInt(p, 10));
    let day = 1;
    let month = 1;
    let year = 2026;

    if (dateParts.length === 3) {
      if (dateParts[0] > 1000) {
        // YYYY-MM-DD
        year = dateParts[0];
        month = dateParts[1];
        day = dateParts[2];
      } else if (dateParts[2] > 1000 || dateParts[2] < 100) {
        // DD/MM/YY or MM/DD/YY
        year = dateParts[2] < 100 ? (dateParts[2] > 70 ? 1900 + dateParts[2] : 2000 + dateParts[2]) : dateParts[2];
        if (dateParts[0] > 12) {
          // Definitely DD/MM/YY
          day = dateParts[0];
          month = dateParts[1];
        } else {
          // Standard Latin / EU format DD/MM
          day = dateParts[0];
          month = dateParts[1];
        }
      }
    }

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    const isPM = /[pP]\.?\s*[mM]\.?/.test(cleanTime);
    const isAM = /[aA]\.?\s*[mM]\.?/.test(cleanTime);

    const timeNumbers = cleanTime.replace(/[aApP]\.?\s*[mM]\.?/g, '').trim().split(':').map(p => parseInt(p, 10));
    if (timeNumbers.length >= 2) {
      hours = timeNumbers[0] || 0;
      minutes = timeNumbers[1] || 0;
      seconds = timeNumbers[2] || 0;

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }

    return new Date(year, (month || 1) - 1, day || 1, hours, minutes, seconds).getTime();
  } catch {
    return Date.now();
  }
}

/**
 * Detect media type from filename extension or convention.
 * Note: Stickers in WhatsApp export often have STICKER, STK-, or .webp!
 */
export function detectMediaType(fileName: string): MediaType {
  const lower = fileName.toLowerCase().trim();
  const ext = lower.split('.').pop() || '';

  if (lower.includes('sticker') || lower.startsWith('stk-') || ext === 'webp') {
    return 'sticker';
  }
  if (['jpg', 'jpeg', 'png', 'heic', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (['mp4', 'mov', 'm4v', '3gp', 'webm'].includes(ext)) {
    if (lower.includes('gif') || ext === 'gif') {
      return 'gif';
    }
    return 'video';
  }
  if (ext === 'gif') {
    return 'gif';
  }
  if (['opus', 'ogg', 'mp3', 'm4a', 'aac', 'wav'].includes(ext)) {
    if (lower.startsWith('ptt-') || lower.includes('audio') || lower.includes('voice')) {
      return 'voice';
    }
    return 'audio';
  }
  return 'document';
}

/**
 * Extracts possible attached media filename and caption from a message line
 */
export function extractAttachmentInfo(content: string): {
  fileName?: string;
  caption?: string;
  isOmitted?: boolean;
  isViewOnce?: boolean;
} {
  const cleaned = cleanText(content);

  // Check view-once photo or video specifically
  if (
    /^<?(?:imagen omitida|image omitted|Foto para ver una sola vez|foto de una sola vez)>?$/i.test(cleaned)
  ) {
    return { isViewOnce: true, caption: 'Foto para ver una sola vez' };
  }

  if (
    /^<?(?:Video para ver una sola vez|video de una sola vez)>?$/i.test(cleaned)
  ) {
    return { isViewOnce: true, caption: 'Video para ver una sola vez' };
  }

  // Check omitted media placeholder
  if (OMITTED_MEDIA_REGEX.test(cleaned)) {
    return { isOmitted: true };
  }

  for (const pattern of ATTACHMENT_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const fileName = cleanText(match[1]).trim();
      // Remove match from content to find caption
      let caption = cleaned.replace(match[0], '').trim();
      // Remove leftovers like "(archivo adjunto)", dashes or colon
      caption = caption
        .replace(/^[:\s\-–—]+/, '')
        .replace(/^(?:\(archivo adjunto\)|\(file attached\)|\(anexo\)|\(fichier attaché\)|\(allegato\)|\(angehängte datei\))\s*/i, '')
        .trim();
      return { fileName, caption };
    }
  }

  return {};
}

/**
 * Splits lines and groups multiline messages
 */
export function parseChatRawLines(rawText: string): RawParsedMessage[] {
  const lines = rawText.split(/\r?\n/);
  const parsedMessages: RawParsedMessage[] = [];
  let currentMsg: RawParsedMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line && !currentMsg) continue;

    const cleanedLine = cleanText(line);

    // Try Android match
    let match = cleanedLine.match(ANDROID_START_REGEX);

    // Try iOS match if not matched
    if (!match) {
      match = cleanedLine.match(IOS_START_REGEX);
    }

    if (match) {
      if (currentMsg) {
        parsedMessages.push(currentMsg);
      }

      const rawDate = match[1];
      const rawTime = match[2];
      const remainder = match[3] || '';

      // Check if remainder contains sender name: "Sender: Message"
      const colonIndex = remainder.indexOf(':');
      if (colonIndex !== -1) {
        const potentialSender = remainder.substring(0, colonIndex).trim();
        const content = remainder.substring(colonIndex + 1).trim();

        currentMsg = {
          rawDate,
          rawTime,
          sender: potentialSender,
          content,
          isSystem: false,
        };
      } else {
        // System message (e.g. "Messages and calls are end-to-end encrypted")
        currentMsg = {
          rawDate,
          rawTime,
          sender: 'Sistema',
          content: remainder,
          isSystem: true,
        };
      }
    } else {
      // Continuation of previous message (multiline message)
      if (currentMsg) {
        currentMsg.content += '\n' + line;
      }
    }
  }

  if (currentMsg) {
    parsedMessages.push(currentMsg);
  }

  return parsedMessages;
}

/**
 * Associates extracted messages with available media attachments from the ZIP
 */
export function buildMessagesWithAttachments(
  rawMessages: RawParsedMessage[],
  mediaMap: Map<string, Attachment> // normalized filename -> Attachment
): { messages: Message[]; unmatchedMedia: string[] } {
  const messages: Message[] = [];
  const usedMediaKeys = new Set<string>();

  // Helper for matching filenames (case insensitive, trimmed, without path, matching iOS sequence numbers)
  const findAttachment = (requestedName: string): Attachment | undefined => {
    const rawReq = cleanText(requestedName);
    const cleanRequested = rawReq.toLowerCase().trim();
    // Remove any path like "subfolder/filename.webp"
    const baseName = cleanRequested.split(/[/|\\]/).pop() || cleanRequested;
    const baseWithoutExt = baseName.substring(0, baseName.lastIndexOf('.')) || baseName;

    // 1. Direct match in mediaMap
    if (mediaMap.has(baseName)) {
      usedMediaKeys.add(baseName);
      return mediaMap.get(baseName);
    }

    // 2. Exact match checking keys
    for (const [key, att] of mediaMap.entries()) {
      const keyBase = key.split(/[/|\\]/).pop() || key;
      if (keyBase === baseName) {
        usedMediaKeys.add(key);
        return att;
      }
    }

    // 3. Strip leading sequence numbers like "00004479-STICKER..." vs "STICKER..."
    const stripSeq = (s: string) => s.replace(/^\d{4,10}-/, '');
    const strippedRequested = stripSeq(baseName);

    for (const [key, att] of mediaMap.entries()) {
      const keyBase = key.split(/[/|\\]/).pop() || key;
      const strippedKey = stripSeq(keyBase);
      if (
        strippedKey === strippedRequested ||
        keyBase === strippedRequested ||
        strippedKey === baseName
      ) {
        usedMediaKeys.add(key);
        return att;
      }
    }

    // 4. Substring / contains match for timestamp or unique identifier
    for (const [key, att] of mediaMap.entries()) {
      const keyBase = key.split(/[/|\\]/).pop() || key;
      if (baseWithoutExt.length > 8 && keyBase.includes(baseWithoutExt)) {
        usedMediaKeys.add(key);
        return att;
      }
      const keyWithoutExt = keyBase.substring(0, keyBase.lastIndexOf('.')) || keyBase;
      if (keyWithoutExt.length > 8 && baseName.includes(keyWithoutExt)) {
        usedMediaKeys.add(key);
        return att;
      }
    }

    // 5. Match standard WhatsApp prefix ID (IMG-2026..., STK-2026..., etc.)
    const matchPrefix = baseName.match(/(?:IMG|VID|AUD|PTT|STK|STICKER|PHOTO)-\d{4,8}[^.]*/i);
    if (matchPrefix) {
      const id = matchPrefix[0].toLowerCase();
      for (const [key, att] of mediaMap.entries()) {
        if (key.toLowerCase().includes(id)) {
          usedMediaKeys.add(key);
          return att;
        }
      }
    }

    return undefined;
  };

  for (let idx = 0; idx < rawMessages.length; idx++) {
    const raw = rawMessages[idx];

    // Check if message is a pure standalone "<Se editó este mensaje.>"
    const rawTrimmed = raw.content.trim();
    const isPureEdit =
      /^<(?:Se editó este mensaje|This message was edited|Ce message a été modifié|Diese Nachricht wurde bearbeitet)\.?>$/i.test(rawTrimmed) ||
      /^\((?:Se editó este mensaje|This message was edited)\.?\)$/i.test(rawTrimmed);

    if (isPureEdit) {
      if (messages.length > 0 && messages[messages.length - 1].sender === raw.sender) {
        messages[messages.length - 1].isEdited = true;
        continue;
      }
    }

    const timestamp = parseDateToEpoch(raw.rawDate, raw.rawTime);
    const { fileName, caption, isViewOnce } = extractAttachmentInfo(raw.content);

    let attachment: Attachment | undefined = undefined;
    // If an attachment tag was matched, caption contains any remaining text (or empty string "")
    // If NO attachment was in the message, text remains raw.content
    let text = isViewOnce ? 'Foto para ver una sola vez' : caption !== undefined ? caption : raw.content;
    let unmatchedAttachmentName: string | undefined = undefined;

    if (fileName) {
      attachment = findAttachment(fileName);
      if (!attachment) {
        unmatchedAttachmentName = fileName;
      }
    }

    // Check if edited
    let isEdited = false;
    if (
      EDITED_TAG_REGEX.test(text) ||
      EDITED_PAREN_REGEX.test(text) ||
      EDITED_TAG_REGEX.test(raw.content) ||
      EDITED_PAREN_REGEX.test(raw.content)
    ) {
      isEdited = true;
      text = text.replace(EDITED_TAG_REGEX, '').replace(EDITED_PAREN_REGEX, '').trim();
    }

    // Check if forwarded
    let isForwarded = false;
    if (FORWARDED_REGEX.test(raw.content) || FORWARDED_REGEX.test(text)) {
      isForwarded = true;
      text = text.replace(FORWARDED_REGEX, '').trim();
    }

    // Check if story / status reply
    let storyReply: Message['storyReply'] = undefined;
    const storyMatch = raw.content.match(STORY_REPLY_REGEX) || text.match(STORY_REPLY_REGEX);
    if (storyMatch) {
      let storyTitle = 'Tu estado';
      if (storyMatch[1] && storyMatch[1].trim()) {
        storyTitle = `Estado de ${cleanText(storyMatch[1]).trim()}`;
      } else if (
        raw.content.toLowerCase().startsWith('respondió a un estado') ||
        raw.content.toLowerCase().startsWith('replied to status')
      ) {
        storyTitle = 'Estado';
      }

      text = text.replace(STORY_REPLY_REGEX, '').trim();

      // If an image/video was included in the message, use it as thumbnail
      let thumbnailUrl: string | undefined = undefined;
      if (attachment && (attachment.mediaType === 'image' || attachment.mediaType === 'video')) {
        thumbnailUrl = attachment.url;
      }

      storyReply = {
        storyTitle,
        thumbnailUrl,
      };
    }

    // System message categorization
    let systemType: Message['systemType'] = undefined;
    if (raw.isSystem) {
      const lower = raw.content.toLowerCase();
      if (lower.includes('cifrado') || lower.includes('encrypt')) {
        systemType = 'encryption';
      } else if (lower.includes('creó el grupo') || lower.includes('created group')) {
        systemType = 'group_created';
      } else if (lower.includes('cambió') || lower.includes('changed')) {
        systemType = 'group_changed';
      } else if (lower.includes('unió') || lower.includes('joined') || lower.includes('añadió') || lower.includes('added')) {
        systemType = 'user_joined';
      } else if (lower.includes('salió') || lower.includes('left') || lower.includes('eliminó') || lower.includes('removed')) {
        systemType = 'user_left';
      } else {
        systemType = 'general';
      }
    }

    const msg: Message = {
      id: `msg-${idx}-${timestamp}`,
      rawDate: raw.rawDate,
      rawTime: raw.rawTime,
      timestamp,
      sender: raw.sender,
      text: text,
      isSystem: raw.isSystem,
      systemType,
      attachment,
      unmatchedAttachmentName,
      hasAttachmentError: !!unmatchedAttachmentName,
      isViewOnce: !!isViewOnce,
      isEdited,
      isForwarded,
      storyReply,
    };

    messages.push(msg);
  }

  // Calculate unused media files from ZIP
  const unmatchedMedia: string[] = [];
  for (const [key] of mediaMap.entries()) {
    if (!usedMediaKeys.has(key)) {
      unmatchedMedia.push(key);
    }
  }

  return { messages, unmatchedMedia };
}
