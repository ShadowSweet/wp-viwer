import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Attachment } from '../types/chat';

interface MediaModalProps {
  attachment: Attachment | null;
  caption?: string;
  sender?: string;
  dateStr?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  attachment,
  caption,
  sender,
  dateStr,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
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

  const isVideo = attachment.mediaType === 'video' || (attachment.mediaType === 'gif' && attachment.mimeType.includes('video'));
  const isImage = attachment.mediaType === 'image' || attachment.mediaType === 'sticker' || attachment.mediaType === 'gif';

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111b21]/90 border-b border-neutral-800 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-sm font-semibold truncate text-[#e9edef]">{sender || 'WhatsApp Media'}</p>
            <p className="text-xs text-[#8696a0] font-mono">
              {dateStr} {attachment.fileName && `· ${attachment.fileName}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isImage && (
            <div className="flex items-center bg-[#202c33] rounded-lg p-0.5 border border-neutral-700/50 mr-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title="Alejar"
                className="p-1.5 hover:text-white text-neutral-300 disabled:opacity-40 transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Tamaño original"
                className="px-2 py-0.5 text-xs font-mono text-neutral-300 hover:text-white"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                title="Acercar"
                className="p-1.5 hover:text-white text-neutral-300 disabled:opacity-40 transition"
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
            className="p-2 rounded-lg bg-[#202c33] hover:bg-rose-900/60 text-neutral-300 hover:text-white transition ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Navigation Arrows */}
        {hasPrev && onPrev && (
          <button
            type="button"
            onClick={onPrev}
            title="Anterior (Flecha izquierda)"
            className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition active:scale-95 border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {hasNext && onNext && (
          <button
            type="button"
            onClick={onNext}
            title="Siguiente (Flecha derecha)"
            className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition active:scale-95 border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Media Renderer */}
        <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
          {isVideo ? (
            <video
              src={attachment.url}
              controls
              autoPlay
              className="max-h-[82vh] max-w-full rounded shadow-2xl bg-black"
            />
          ) : (
            <img
              src={attachment.url}
              alt={attachment.fileName}
              style={{ transform: `scale(${scale})` }}
              className="max-h-[82vh] max-w-full object-contain transition-transform duration-150 ease-out rounded shadow-2xl"
            />
          )}
        </div>
      </div>

      {/* Caption footer if present */}
      {caption && (
        <div className="py-3 px-6 bg-[#111b21]/90 border-t border-neutral-800 text-center max-w-4xl mx-auto w-full">
          <p className="text-sm text-[#e9edef] whitespace-pre-wrap">{caption}</p>
        </div>
      )}
    </div>
  );
};
