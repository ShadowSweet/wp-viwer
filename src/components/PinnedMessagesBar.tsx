import React, { useState } from 'react';
import { Pin, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Message } from '../types/chat';
import { formatParticipantName } from '../utils/participantUtils';

interface PinnedMessagesBarProps {
  pinnedMessages: Message[];
  onJumpToMessage: (messageId: string) => void;
  onUnpinMessage: (messageId: string) => void;
}

export const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({
  pinnedMessages,
  onJumpToMessage,
  onUnpinMessage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  // Ensure current index is within bounds
  const validIndex = Math.min(currentIndex, pinnedMessages.length - 1);
  const currentMsg = pinnedMessages[validIndex];
  if (!currentMsg) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : pinnedMessages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < pinnedMessages.length - 1 ? prev + 1 : 0));
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnpinMessage(currentMsg.id);
    if (currentIndex > 0 && currentIndex >= pinnedMessages.length - 1) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const senderDisplay = formatParticipantName(currentMsg.sender);

  // Content preview
  let previewText = currentMsg.text?.trim() || '';
  if (!previewText && currentMsg.attachment) {
    const type = currentMsg.attachment.mediaType;
    if (type === 'image') previewText = '📷 Foto';
    else if (type === 'video') previewText = '🎥 Video';
    else if (type === 'audio' || type === 'voice') previewText = '🎤 Mensaje de voz / Audio';
    else if (type === 'sticker') previewText = '✨ Sticker';
    else if (type === 'document') previewText = `📄 Documento: ${currentMsg.attachment.originalName || ''}`;
    else if (type === 'gif') previewText = '👾 GIF';
  }

  return (
    <div className="bg-[#182229]/95 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-4 py-2 z-20 flex items-center justify-between gap-2 shadow-sm select-none transition-all">
      {/* Left Icon and Clickable Message Info */}
      <div
        onClick={() => onJumpToMessage(currentMsg.id)}
        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
        title="Pulsar para ver mensaje fijado en el chat"
      >
        <div className="w-7 h-7 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884] shrink-0 group-hover:scale-105 transition-transform">
          <Pin className="w-3.5 h-3.5 fill-[#00a884]/40" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#00a884] truncate">
              {senderDisplay || 'Mensaje fijado'}
            </span>
            {pinnedMessages.length > 1 && (
              <span className="text-[10px] text-[#8696a0] font-mono">
                ({validIndex + 1}/{pinnedMessages.length})
              </span>
            )}
          </div>
          <p className="text-xs text-[#e9edef] truncate font-normal group-hover:text-emerald-300 transition-colors">
            {previewText || 'Mensaje fijado'}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Carousel controls if more than 1 pinned */}
        {pinnedMessages.length > 1 && (
          <div className="flex items-center bg-[#202c33] rounded-lg border border-neutral-700/50 p-0.5 mr-1">
            <button
              type="button"
              onClick={handlePrev}
              title="Mensaje fijado anterior"
              className="p-1 hover:bg-[#2a3942] text-[#8696a0] hover:text-white rounded transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Siguiente mensaje fijado"
              className="p-1 hover:bg-[#2a3942] text-[#8696a0] hover:text-white rounded transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Jump Button */}
        <button
          type="button"
          onClick={() => onJumpToMessage(currentMsg.id)}
          title="Ir al mensaje en el chat"
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] hover:text-emerald-300 text-[11px] font-medium transition cursor-pointer border border-neutral-700/50"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Ver</span>
        </button>

        {/* Unpin Button */}
        <button
          type="button"
          onClick={handleUnpin}
          title="Desfijar este mensaje"
          aria-label="Desfijar mensaje"
          className="p-1.5 rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-[#202c33] active:scale-95 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
