import React from 'react';
import {
  CheckCheck,
  FileText,
  Download,
  AlertTriangle,
  Lock,
  Users,
  Film
} from 'lucide-react';
import { Attachment, Message } from '../types/chat';
import { AudioPlayer } from './AudioPlayer';
import { renderFormattedText } from '../utils/textFormatter';
import { formatBytes } from '../utils/dateUtils';

interface MessageItemProps {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isGroup: boolean;
  searchQuery?: string;
  isSearchResult?: boolean;
  onOpenMedia: (attachment: Attachment, caption?: string, sender?: string, dateStr?: string) => void;
}

// Generate consistent WhatsApp participant colors
const SENDER_COLORS = [
  'text-[#35cd96]', // Emerald / Mint
  'text-[#e542a3]', // Magenta / Pink
  'text-[#91a4fc]', // Periwinkle Blue
  'text-[#ffa97a]', // Coral / Peach
  'text-[#dfa621]', // Gold / Yellow
  'text-[#26c4dc]', // Cyan
  'text-[#c084fc]', // Purple
  'text-[#f87171]', // Coral Red
];

function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFirstInGroup,
  isLastInGroup,
  isGroup,
  searchQuery,
  isSearchResult,
  onOpenMedia,
}) => {
  const isOutgoing = message.isOutgoing;
  const hasAttachment = !!message.attachment;

  // Resilient sticker detection (mediaType === 'sticker' or filename has 'sticker', 'stk-', or is webp)
  const isSticker =
    message.attachment?.mediaType === 'sticker' ||
    (message.attachment?.fileName &&
      (message.attachment.fileName.toLowerCase().includes('sticker') ||
        message.attachment.fileName.toLowerCase().startsWith('stk-') ||
        message.attachment.extension.toLowerCase() === 'webp'));

  const isImage = !isSticker && message.attachment?.mediaType === 'image';
  const isVideo = message.attachment?.mediaType === 'video';
  const isGif = message.attachment?.mediaType === 'gif';
  const isAudioOrVoice = message.attachment?.mediaType === 'audio' || message.attachment?.mediaType === 'voice';
  const isDoc = message.attachment?.mediaType === 'document';

  // System Messages
  if (message.isSystem) {
    return (
      <div id={message.id} className="flex justify-center my-2 px-4 select-none">
        <div className="max-w-lg rounded-lg bg-[#182229]/90 border border-neutral-700/40 px-3 py-1.5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-[12px] text-[#ffd279] font-medium leading-relaxed">
            {message.systemType === 'encryption' && <Lock className="w-3.5 h-3.5 shrink-0 text-[#ffd279]" />}
            {message.systemType?.startsWith('group') && <Users className="w-3.5 h-3.5 shrink-0 text-[#ffd279]" />}
            <span>{renderFormattedText(message.text, searchQuery)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Sticker (WhatsApp renders stickers directly without a solid speech bubble, preserving transparency)
  if (isSticker && hasAttachment && !message.text) {
    return (
      <div
        id={message.id}
        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} my-1.5 px-3 sm:px-5 relative transition-all duration-300 ${
          isSearchResult ? 'ring-2 ring-yellow-400/80 rounded-lg p-1 bg-yellow-400/10' : ''
        }`}
      >
        <div className="relative group max-w-[200px]">
          {/* Sticker Image */}
          <img
            src={message.attachment?.url}
            alt={message.attachment?.fileName || 'Sticker'}
            loading="lazy"
            onClick={() =>
              message.attachment &&
              onOpenMedia(
                message.attachment,
                undefined,
                message.sender,
                `${message.rawDate} ${message.rawTime}`
              )
            }
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain cursor-pointer drop-shadow-md hover:scale-105 active:scale-95 transition-transform"
          />
          {/* WhatsApp time overlay for sticker */}
          <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-white/95 flex items-center gap-1 shadow-xs pointer-events-none">
            <span>{message.rawTime}</span>
            {isOutgoing && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
          </div>
        </div>
      </div>
    );
  }

  // Standard Message Bubble
  return (
    <div
      id={message.id}
      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} ${
        isFirstInGroup ? 'mt-2' : 'mt-0.5'
      } px-2 sm:px-4 group transition-colors`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] lg:max-w-[50%] rounded-lg px-2.5 py-1.5 shadow-xs text-[14.2px] leading-relaxed break-words transition-all duration-300 ${
          isSearchResult ? 'ring-2 ring-yellow-400' : ''
        } ${
          isOutgoing
            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
            : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
        }`}
      >
        {/* Tail indicator for first in group */}
        {isFirstInGroup && (
          <div
            className={`absolute top-0 w-2 h-2 ${
              isOutgoing
                ? '-right-1.5 bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]'
                : '-left-1.5 bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]'
            }`}
          />
        )}

        {/* Sender Name (In group chats for incoming messages) */}
        {!isOutgoing && isGroup && isFirstInGroup && (
          <div className={`text-[12.8px] font-semibold mb-0.5 ${getSenderColor(message.sender)}`}>
            {message.sender}
          </div>
        )}

        {/* Attachment Renderer */}
        {hasAttachment && message.attachment && (
          <div className="mb-1 rounded overflow-hidden">
            {/* Sticker inside bubble (if accompanied by text or grouped) */}
            {isSticker && (
              <div
                className="relative overflow-hidden cursor-pointer flex justify-center py-1 group/sticker"
                onClick={() =>
                  onOpenMedia(
                    message.attachment!,
                    message.text,
                    message.sender,
                    `${message.rawDate} ${message.rawTime}`
                  )
                }
              >
                <img
                  src={message.attachment.url}
                  alt={message.attachment.fileName || 'Sticker'}
                  loading="lazy"
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain hover:scale-105 transition-transform drop-shadow-md"
                />
              </div>
            )}

            {/* Image */}
            {isImage && (
              <div
                className="relative overflow-hidden rounded-md cursor-pointer bg-black/20 group/media"
                onClick={() =>
                  onOpenMedia(
                    message.attachment!,
                    message.text,
                    message.sender,
                    `${message.rawDate} ${message.rawTime}`
                  )
                }
              >
                <img
                  src={message.attachment.url}
                  alt={message.attachment.fileName}
                  loading="lazy"
                  className="w-full max-h-[360px] object-cover hover:scale-[1.01] transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition-colors pointer-events-none" />
              </div>
            )}

            {/* Video */}
            {isVideo && (
              <div className="relative overflow-hidden rounded-md bg-black/40">
                <video
                  src={message.attachment.url}
                  controls
                  preload="metadata"
                  className="w-full max-h-[340px] rounded-md bg-black"
                />
                <div className="flex items-center justify-between text-[11px] text-[#8696a0] px-1 pt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Film className="w-3 h-3" />
                    {message.attachment.fileName}
                  </span>
                  {message.attachment.size && <span>{formatBytes(message.attachment.size)}</span>}
                </div>
              </div>
            )}

            {/* Animated GIF */}
            {isGif && (
              <div
                className="relative overflow-hidden rounded-md cursor-pointer bg-black/30"
                onClick={() =>
                  onOpenMedia(
                    message.attachment!,
                    message.text,
                    message.sender,
                    `${message.rawDate} ${message.rawTime}`
                  )
                }
              >
                {message.attachment.mimeType.includes('video') ? (
                  <video
                    src={message.attachment.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full max-h-[300px] object-cover"
                  />
                ) : (
                  <img
                    src={message.attachment.url}
                    alt="GIF"
                    loading="lazy"
                    className="w-full max-h-[300px] object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold tracking-wider text-white">
                  GIF
                </div>
              </div>
            )}

            {/* Audio / Voice Note */}
            {isAudioOrVoice && (
              <AudioPlayer
                attachment={message.attachment}
                isOutgoing={isOutgoing}
              />
            )}

            {/* Document Card */}
            {isDoc && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-black/25 border border-white/5 hover:bg-black/35 transition">
                <div className="w-10 h-10 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-[#e9edef]" title={message.attachment.fileName}>
                    {message.attachment.fileName}
                  </p>
                  <p className="text-[11px] text-[#8696a0] font-mono mt-0.5">
                    {formatBytes(message.attachment.size)} · {message.attachment.extension.toUpperCase()}
                  </p>
                </div>
                <a
                  href={message.attachment.url}
                  download={message.attachment.fileName}
                  title="Descargar archivo"
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Unmatched media alert if attachment was referenced in text but missing in zip */}
        {message.hasAttachmentError && message.unmatchedAttachmentName && (
          <div className="mb-1 p-2 rounded bg-amber-950/40 border border-amber-600/30 text-[11px] text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <div className="truncate">
              {message.unmatchedAttachmentName.toLowerCase().includes('sticker') ||
              message.unmatchedAttachmentName.toLowerCase().endsWith('.webp')
                ? 'Sticker no encontrado en el ZIP: '
                : 'Archivo no encontrado en el ZIP: '}
              <code className="font-mono">{message.unmatchedAttachmentName}</code>
            </div>
          </div>
        )}

        {/* Message Text */}
        {message.text && (
          <div className="text-[14px] break-words whitespace-pre-wrap select-text pr-14">
            {renderFormattedText(message.text, searchQuery)}
          </div>
        )}

        {/* Message Timestamp & Checkmarks */}
        <div className="float-right ml-2 -mb-0.5 flex items-center gap-1 text-[11px] text-[#8696a0] select-none">
          <span>{message.rawTime}</span>
          {isOutgoing && (
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] ml-0.5 inline-block shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};
