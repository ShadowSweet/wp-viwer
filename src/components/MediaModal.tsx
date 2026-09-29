import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Attachment } from '../types/chat';

interface MediaModalProps {
  attachment: Attachment | null;
  caption?: string;
  sender?: string;
  dateStr?: string;
  messageId?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onJumpToMessage?: (messageId: string) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  attachment,
  caption,
  sender,
  dateStr,
  messageId,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onJumpToMessage,
}) => {
  const [scale, setScale] = useState(1);

  // Keyboard navigation & ESC
  useEffect(() => {
    if (!attachment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNext && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev && hasPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attachment, onClose, onNext, onPrev, hasNext, hasPrev]);

  // Reset zoom on attachment change
  useEffect(() => {
    setScale(1);
  }, [attachment?.url]);

  if (!attachment) return null;

  const isVideo =
    attachment.mediaType === 'video' ||
    (attachment.mediaType === 'gif' && attachment.mimeType.includes('video'));
  const isImage =
    attachment.mediaType === 'image' ||
    attachment.mediaType === 'sticker' ||
    attachment.mediaType === 'gif';

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  /**
   * Handles clicking outside the photo on desktop/PC.
   * If on PC/mouse, clicking the backdrop overlay closes the image.
   * On mobile/touch, does not trigger to keep touch gesture experience safe.
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply click-outside-to-close on PC/desktop with mouse pointer
    const isDesktopPointer =
      typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

    // Check that click occurred directly on the backdrop container, not on controls or content
    if (isDesktopPointer && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white animate-in fade-in duration-200 select-none cursor-default"
    >
      {/* Top Bar (controls protected from bubbling) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between px-3 sm:px-4 py-3 bg-[#111b21]/90 border-b border-neutral-800 backdrop-blur-sm z-10 cursor-auto"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-sm font-semibold truncate text-[#e9edef]">{sender || 'WhatsApp Media'}</p>
            <p className="text-xs text-[#8696a0] font-mono">
              {dateStr} {attachment.fileName && `· ${attachment.fileName}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* "Ver en el chat" button */}
          {messageId && onJumpToMessage && (
            <button
              type="button"
              onClick={() => onJumpToMessage(messageId)}
              title="Ir a la posición exacta de este mensaje en el chat"
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ver en el chat</span>
            </button>
          )}

          {isImage && (
            <div className="hidden sm:flex items-center bg-[#202c33] rounded-lg p-0.5 border border-neutral-700/50 mr-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title="Alejar"
                className="p-1.5 hover:text-white text-neutral-300 disabled:opacity-40 transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Tamaño original"
                className="px-2 py-0.5 text-xs font-mono text-neutral-300 hover:text-white cursor-pointer"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="Acercar"
                className="p-1.5 hover:text-white text-neutral-300 disabled:opacity-40 transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href={attachment.url}
            download={attachment.fileName}
            title="Descargar archivo"
            className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-neutral-200 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar (Esc)"
            className="p-2 rounded-lg bg-[#202c33] hover:bg-rose-900/60 text-neutral-300 hover:text-white transition ml-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area (Overlay backdrop) */}
      <div
        onClick={handleOverlayClick}
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
      >
        {/* Navigation Arrows (protected from closing modal) */}
        {hasPrev && onPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            title="Anterior (Flecha izquierda)"
            className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition active:scale-95 border border-white/10 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {hasNext && onNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            title="Siguiente (Flecha derecha)"
            className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition active:scale-95 border border-white/10 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Media Container & Content (clicking directly on photo stops propagation so it remains open) */}
        <div
          onClick={handleOverlayClick}
          className="max-w-full max-h-full flex items-center justify-center overflow-auto p-2"
        >
          {isVideo ? (
            <video
              src={attachment.url}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82vh] max-w-full rounded shadow-2xl bg-black cursor-auto"
            />
          ) : (
            <img
              src={attachment.url}
              alt={attachment.fileName}
              style={{ transform: `scale(${scale})` }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[82vh] max-w-full object-contain transition-transform duration-150 ease-out rounded shadow-2xl cursor-default"
            />
          )}
        </div>
      </div>

      {/* Caption footer if present (protected from closing) */}
      {caption && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="py-3 px-6 bg-[#111b21]/90 border-t border-neutral-800 text-center max-w-4xl mx-auto w-full cursor-auto"
        >
          <p className="text-sm text-[#e9edef] whitespace-pre-wrap">{caption}</p>
        </div>
      )}
    </div>
  );
};
