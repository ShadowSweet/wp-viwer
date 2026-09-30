import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCheck,
  FileText,
  Download,
  AlertTriangle,
  Lock,
  Users,
  Film,
  CornerUpRight,
  CircleDashed,
  Star,
  Pin,
  ChevronDown,
} from 'lucide-react';
import { Attachment, Message } from '../types/chat';
import { AudioPlayer } from './AudioPlayer';
import { renderFormattedText } from '../utils/textFormatter';
import { formatBytes } from '../utils/dateUtils';
import { formatParticipantName } from '../utils/participantUtils';

interface MessageItemProps {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isGroup: boolean;
  searchQuery?: string;
  isSearchResult?: boolean;
  isHighlighted?: boolean;
  onOpenMedia: (
    attachment: Attachment,
    caption?: string,
    sender?: string,
    dateStr?: string,
    messageId?: string
  ) => void;
  onJumpToMessage?: (messageId: string) => void;
  onToggleStar?: (messageId: string) => void;
  onTogglePin?: (messageId: string) => void;
  // Audio playback coordination props
  isPlayingAudio?: boolean;
  audioPlaybackRate?: number;
  onPlayAudio?: () => void;
  onPauseAudio?: () => void;
  onAudioEnded?: () => void;
  onChangeAudioRate?: (rate: number) => void;
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

export const MessageItem: React.FC<MessageItemProps> = React.memo(({
  message,
  isFirstInGroup,
  isLastInGroup: _isLastInGroup,
  isGroup: _isGroup,
  searchQuery,
  isSearchResult,
  isHighlighted = false,
  onOpenMedia,
  onJumpToMessage,
  onToggleStar,
  onTogglePin,
  isPlayingAudio = false,
  audioPlaybackRate = 1,
  onPlayAudio,
  onPauseAudio,
  onAudioEnded,
  onChangeAudioRate,
}) => {
  const isOutgoing = message.isOutgoing;
  const hasAttachment = !!message.attachment;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showMenu]);

  // View-once photo detection (Foto para ver una sola vez)
  const isViewOnce = message.isViewOnce || message.text === 'Foto para ver una sola vez';

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
      <div id={message.id} className="flex justify-center my-2 px-2 sm:px-4 select-none">
        <div className="max-w-lg rounded-lg bg-[#182229]/90 border border-neutral-700/40 px-3 py-1.5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-[11.5px] sm:text-[12px] text-[#ffd279] font-medium leading-relaxed">
            {message.systemType === 'encryption' && <Lock className="w-3.5 h-3.5 shrink-0 text-[#ffd279]" />}
            {message.systemType?.startsWith('group') && <Users className="w-3.5 h-3.5 shrink-0 text-[#ffd279]" />}
            <span>{renderFormattedText(message.text, searchQuery)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Header showing sender name on the FIRST bubble of consecutive messages
  const formattedSender = formatParticipantName(message.sender);
  const senderHeader = isFirstInGroup && formattedSender ? (
    <div
      className={`mb-1 px-1 select-none flex items-center ${
        isOutgoing ? 'justify-end' : 'justify-start'
      }`}
    >
      <span
        className={`text-[12.5px] font-semibold tracking-wide ${getSenderColor(
          message.sender
        )}`}
      >
        {formattedSender}
      </span>
    </div>
  ) : null;

  // View-Once Photo Message (Foto para ver una sola vez)
  if (isViewOnce) {
    return (
      <div id={message.id} className="px-2 sm:px-4">
        {senderHeader}
        <div
          className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} ${
            isFirstInGroup ? 'mt-1' : 'mt-0.5'
          } group transition-colors`}
        >
          <div
            className={`relative max-w-[88%] sm:max-w-[70%] md:max-w-[55%] rounded-lg px-3 py-2 shadow-xs leading-relaxed transition-all duration-300 ${
              isHighlighted
                ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-[#0b141a] brightness-110 shadow-lg'
                : ''
            } ${
              isOutgoing
                ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
                : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
            }`}
          >
            {isFirstInGroup && (
              <div
                className={`absolute top-0 w-2 h-2 ${
                  isOutgoing
                    ? '-right-1.5 bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]'
                    : '-left-1.5 bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]'
                }`}
              />
            )}

            <div className="flex items-center gap-2.5 py-0.5 pr-14 select-none">
              {/* View-once Icon (Circle 1) */}
              <div className="w-6 h-6 rounded-full border border-dashed border-[#53bdeb] text-[#53bdeb] flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <span className="text-[13.5px] font-medium text-[#e9edef] flex items-center gap-1.5">
                <span>Foto para ver una sola vez</span>
              </span>
            </div>

            <div className="float-right ml-3 -mb-0.5 flex items-center gap-1.5 text-[11px] text-[#8696a0] select-none">
              {message.isEdited && (
                <span className="text-[10px] text-[#8696a0] italic font-normal">editado</span>
              )}
              <span>{message.rawTime}</span>
              {isOutgoing && (
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] ml-0.5 inline-block shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Sticker (WhatsApp renders stickers directly without a solid speech bubble, preserving transparency)
  if (isSticker && hasAttachment && !message.text) {
    return (
      <div id={message.id} className="px-2 sm:px-5">
        {senderHeader}
        <div
          className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} my-1 relative transition-all duration-300 ${
            isHighlighted
              ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-[#0b141a] rounded-xl p-1 bg-emerald-500/15 scale-105 shadow-xl'
              : isSearchResult
              ? 'ring-2 ring-yellow-400/80 rounded-lg p-1 bg-yellow-400/10'
              : ''
          }`}
        >
          <div className="relative group max-w-[160px] sm:max-w-[200px]">
            {/* Options menu trigger for stickers */}
            <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="p-1 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition cursor-pointer shadow-md"
                title="Opciones del sticker"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showMenu && (
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute ${isOutgoing ? 'right-0' : 'left-0'} top-7 z-50 min-w-[195px] bg-[#233138] border border-neutral-700/80 rounded-xl shadow-2xl py-1 text-xs text-[#e9edef] animate-in fade-in zoom-in-95 duration-100 select-none`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onToggleStar?.(message.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-[#182229] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 shrink-0 ${
                        message.isStarred ? 'text-[#ffc107] fill-[#ffc107]' : 'text-[#8696a0]'
                      }`}
                    />
                    <span>{message.isStarred ? 'Quitar de destacados' : '⭐ Destacar mensaje'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePin?.(message.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-[#182229] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Pin
                      className={`w-4 h-4 shrink-0 ${
                        message.isPinned ? 'text-[#00a884] fill-[#00a884]' : 'text-[#8696a0]'
                      }`}
                    />
                    <span>{message.isPinned ? 'Desfijar mensaje' : '📌 Fijar mensaje'}</span>
                  </button>
                </div>
              )}
            </div>

            {message.isForwarded && (
              <div className="flex items-center gap-1 text-[11px] text-[#8696a0] italic mb-1 select-none font-normal">
                <CornerUpRight className="w-3 h-3 text-[#8696a0]" />
                <span>Reenviado</span>
              </div>
            )}
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
                  `${message.rawDate} ${message.rawTime}`,
                  message.id
                )
              }
              className="w-32 h-32 sm:w-44 sm:h-44 object-contain cursor-pointer drop-shadow-md hover:scale-105 active:scale-95 transition-transform"
            />
            {/* WhatsApp time overlay for sticker */}
            <div className="absolute bottom-1 right-2 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-white/95 flex items-center gap-1.5 shadow-xs pointer-events-none">
              {message.isStarred && (
                <Star className="w-2.5 h-2.5 text-[#ffc107] fill-[#ffc107] shrink-0" />
              )}
              {message.isPinned && (
                <Pin className="w-2.5 h-2.5 text-[#00a884] fill-[#00a884] shrink-0" />
              )}
              {message.isEdited && <span className="text-[9.5px] opacity-80 italic">editado</span>}
              <span>{message.rawTime}</span>
              {isOutgoing && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Message Bubble
  return (
    <div id={message.id} className="px-1.5 sm:px-4">
      {senderHeader}
      <div
        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} ${
          isFirstInGroup ? 'mt-1' : 'mt-0.5'
        } group transition-colors`}
      >
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu(true);
          }}
          className={`relative max-w-[88%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] rounded-lg px-2.5 py-1.5 shadow-xs text-[14px] leading-relaxed break-words overflow-visible transition-all duration-300 group/bubble ${
            isHighlighted
              ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-[#0b141a] scale-[1.01] shadow-2xl brightness-110'
              : isSearchResult
              ? 'ring-2 ring-yellow-400'
              : ''
          } ${
            isOutgoing
              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-xs'
              : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
          }`}
        >
          {/* Action Menu (⭐ Destacar, 📌 Fijar) */}
          <div className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              title="Opciones del mensaje"
              aria-label="Opciones del mensaje"
              className="p-1 rounded-full bg-black/40 hover:bg-black/70 text-[#8696a0] hover:text-white transition shadow-sm cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className={`absolute ${isOutgoing ? 'right-0' : 'left-0'} top-7 z-50 min-w-[195px] bg-[#233138] border border-neutral-700/80 rounded-xl shadow-2xl py-1 text-xs text-[#e9edef] animate-in fade-in zoom-in-95 duration-100 select-none`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onToggleStar?.(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#182229] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-4 h-4 shrink-0 ${
                      message.isStarred ? 'text-[#ffc107] fill-[#ffc107]' : 'text-[#8696a0]'
                    }`}
                  />
                  <span>{message.isStarred ? 'Quitar de destacados' : '⭐ Destacar mensaje'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePin?.(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#182229] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Pin
                    className={`w-4 h-4 shrink-0 ${
                      message.isPinned ? 'text-[#00a884] fill-[#00a884]' : 'text-[#8696a0]'
                    }`}
                  />
                  <span>{message.isPinned ? 'Desfijar mensaje' : '📌 Fijar mensaje'}</span>
                </button>
              </div>
            )}
          </div>

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

          {/* Forwarded Indicator */}
          {message.isForwarded && (
            <div className="flex items-center gap-1 text-[11px] text-[#8696a0] italic mb-1.5 select-none font-normal">
              <CornerUpRight className="w-3.5 h-3.5 text-[#8696a0] stroke-[2.2]" />
              <span>Reenviado</span>
            </div>
          )}

          {/* Quoted Message / Reply Reference (Citas / quotes) */}
          {message.replyTo && (
            <div
              className={`mb-2 rounded bg-black/25 border-l-[3.5px] border-[#00a884] p-1.5 sm:p-2 overflow-hidden select-none ${
                message.replyTo.targetMessageId && onJumpToMessage
                  ? 'cursor-pointer hover:bg-black/35 active:scale-[0.99] transition'
                  : ''
              }`}
              onClick={(e) => {
                if (message.replyTo?.targetMessageId && onJumpToMessage) {
                  e.stopPropagation();
                  onJumpToMessage(message.replyTo.targetMessageId);
                }
              }}
              title={message.replyTo.targetMessageId ? 'Ver mensaje original citado' : undefined}
            >
              <div className="text-[11.5px] font-semibold text-[#00a884] truncate">
                {formatParticipantName(message.replyTo.sender || '') || 'Mensaje citado'}
              </div>
              <p className="text-[11px] text-[#8696a0] truncate font-normal">
                {message.replyTo.text}
              </p>
            </div>
          )}

          {/* Story / Status Reply Reference Card */}
          {message.storyReply && (
            <div className="mb-2 rounded bg-black/25 border-l-[3.5px] border-[#00a884] p-1.5 sm:p-2 flex items-center justify-between gap-2 overflow-hidden select-none">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[#00a884] text-[11px] font-semibold mb-0.5">
                  <CircleDashed className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{message.storyReply.storyTitle || 'Estado'}</span>
                </div>
                <p className="text-[11px] text-[#8696a0] truncate font-normal">
                  {message.storyReply.storyText || 'Respuesta a estado'}
                </p>
              </div>

              {message.storyReply.thumbnailUrl && (
                <div
                  className="w-10 h-10 rounded overflow-hidden shrink-0 bg-black/40 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (message.attachment) {
                      onOpenMedia(
                        message.attachment,
                        message.text,
                        message.sender,
                        `${message.rawDate} ${message.rawTime}`,
                        message.id
                      );
                    }
                  }}
                  title="Ver imagen del estado"
                >
                  <img
                    src={message.storyReply.thumbnailUrl}
                    alt="Estado"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}
            </div>
          )}

          {/* Attachment Renderer */}
          {hasAttachment && message.attachment && (
            <div className="mb-1 rounded overflow-hidden max-w-full">
              {/* Sticker inside bubble (if accompanied by text or grouped) */}
              {isSticker && (
                <div
                  className="relative overflow-hidden cursor-pointer flex justify-center py-1 group/sticker"
                  onClick={() =>
                    onOpenMedia(
                      message.attachment!,
                      message.text,
                      message.sender,
                      `${message.rawDate} ${message.rawTime}`,
                      message.id
                    )
                  }
                >
                  <img
                    src={message.attachment.url}
                    alt={message.attachment.fileName || 'Sticker'}
                    loading="lazy"
                    className="w-32 h-32 sm:w-44 sm:h-44 object-contain hover:scale-105 transition-transform drop-shadow-md"
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
                      `${message.rawDate} ${message.rawTime}`,
                      message.id
                    )
                  }
                >
                  <img
                    src={message.attachment.url}
                    alt={message.attachment.fileName}
                    loading="lazy"
                    className="w-full max-h-[280px] sm:max-h-[360px] object-cover hover:scale-[1.01] transition-transform duration-200"
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
                    className="w-full max-h-[260px] sm:max-h-[340px] rounded-md bg-black"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#8696a0] px-1 pt-1">
                    <span className="flex items-center gap-1 font-mono truncate">
                      <Film className="w-3 h-3 shrink-0" />
                      <span className="truncate">{message.attachment.fileName}</span>
                    </span>
                    {message.attachment.size && <span className="shrink-0 ml-1">{formatBytes(message.attachment.size)}</span>}
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
                      `${message.rawDate} ${message.rawTime}`,
                      message.id
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
                      className="w-full max-h-[260px] sm:max-h-[300px] object-cover"
                    />
                  ) : (
                    <img
                      src={message.attachment.url}
                      alt="GIF"
                      loading="lazy"
                      className="w-full max-h-[260px] sm:max-h-[300px] object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold tracking-wider text-white">
                    GIF
                  </div>
                </div>
              )}

              {/* Audio / Voice Note with autoplay chain coordination */}
              {isAudioOrVoice && (
                <AudioPlayer
                  messageId={message.id}
                  attachment={message.attachment}
                  isOutgoing={isOutgoing}
                  isPlaying={isPlayingAudio}
                  playbackRate={audioPlaybackRate}
                  onPlay={onPlayAudio}
                  onPause={onPauseAudio}
                  onEnded={onAudioEnded}
                  onChangeRate={onChangeAudioRate}
                />
              )}

              {/* Document Card */}
              {isDoc && (
                <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-black/25 border border-white/5 hover:bg-black/35 transition">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[#e9edef]" title={message.attachment.fileName}>
                      {message.attachment.fileName}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-[#8696a0] font-mono mt-0.5">
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

          {/* Message Text with normal formatted links */}
          {message.text && (
            <div className="text-[13.8px] sm:text-[14.2px] break-words whitespace-pre-wrap select-text pr-12 overflow-hidden">
              {renderFormattedText(message.text, searchQuery)}
            </div>
          )}

          {/* Message Timestamp & Checkmarks */}
          <div className="float-right ml-2.5 -mb-0.5 flex items-center gap-1.5 text-[11px] text-[#8696a0] select-none">
            {message.isStarred && (
              <span title="Mensaje destacado">
                <Star className="w-3 h-3 text-[#ffc107] fill-[#ffc107] inline-block shrink-0" />
              </span>
            )}
            {message.isPinned && (
              <span title="Mensaje fijado">
                <Pin className="w-3 h-3 text-[#00a884] fill-[#00a884] inline-block shrink-0" />
              </span>
            )}
            {message.isEdited && (
              <span className="text-[10px] text-[#8696a0] italic font-normal tracking-tight">
                editado
              </span>
            )}
            <span>{message.rawTime}</span>
            {isOutgoing && (
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] ml-0.5 inline-block shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
