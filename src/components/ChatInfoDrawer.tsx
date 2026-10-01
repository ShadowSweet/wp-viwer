import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Users,
  Image,
  Film,
  Music,
  Smile,
  FileText,
  MessageSquare,
  AlertCircle,
  Download,
  Star,
  Pin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Attachment, ChatMetadata, Message } from '../types/chat';
import { formatBytes } from '../utils/dateUtils';
import { getDisplayName } from '../utils/participantUtils';
import { AudioPlayer } from './AudioPlayer';

interface ChatInfoDrawerProps {
  metadata: ChatMetadata;
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (
    attachment: Attachment,
    caption?: string,
    sender?: string,
    dateStr?: string,
    messageId?: string
  ) => void;
  onJumpToMessage: (messageId: string) => void;
  onToggleStar?: (messageId: string) => void;
  onTogglePin?: (messageId: string) => void;
  audioPlaybackRate?: number;
  onChangeAudioRate?: (rate: number) => void;
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({
  metadata,
  messages,
  isOpen,
  onClose,
  onSelectMedia,
  onJumpToMessage,
  onToggleStar,
  onTogglePin,
  audioPlaybackRate = 1,
  onChangeAudioRate,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'docs' | 'audio' | 'starred' | 'pinned'>('info');

  // Independent audio playback state for ChatInfoDrawer
  const [activePlayingAudioId, setActivePlayingAudioId] = useState<string | null>(null);

  // Progressive loading for media tabs to keep UI instantaneous
  const [visibleAudioCount, setVisibleAudioCount] = useState(30);
  const [visibleMediaCount, setVisibleMediaCount] = useState(30);
  const [visibleDocsCount, setVisibleDocsCount] = useState(30);

  // Horizontal tabs scroll & overflow management
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabsOverflow = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  // Stop playback when drawer closes or when active tab changes
  useEffect(() => {
    if (!isOpen) {
      setActivePlayingAudioId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setActivePlayingAudioId(null);
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    checkTabsOverflow();
    const el = tabsContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkTabsOverflow, { passive: true });
    window.addEventListener('resize', checkTabsOverflow);
    return () => {
      el.removeEventListener('scroll', checkTabsOverflow);
      window.removeEventListener('resize', checkTabsOverflow);
    };
  }, [checkTabsOverflow, isOpen]);

  useEffect(() => {
    if (isOpen) {
      checkTabsOverflow();
    }
  }, [activeTab, isOpen, checkTabsOverflow]);

  if (!isOpen) return null;

  // Extract all media items from messages, preserving reference to the original message
  const mediaItems = messages.filter((m) => !!m.attachment);
  const visualMedia = mediaItems.filter(
    (m) =>
      m.attachment?.mediaType === 'image' ||
      m.attachment?.mediaType === 'video' ||
      m.attachment?.mediaType === 'gif'
  );
  const audioMedia = mediaItems.filter(
    (m) => m.attachment?.mediaType === 'audio' || m.attachment?.mediaType === 'voice'
  );
  const docMedia = mediaItems.filter((m) => m.attachment?.mediaType === 'document');
  const starredMessages = messages.filter((m) => m.isStarred);
  const pinnedMessages = messages.filter((m) => m.isPinned);

  // Compute message counts per participant using central getDisplayName
  const participantStats = metadata.participants
    .map((name) => {
      const count = messages.filter((m) => !m.isSystem && m.sender === name).length;
      return { name, displayName: getDisplayName(name), count };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-[#111b21] border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none overflow-hidden pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Header */}
      <div className="h-14 sm:h-15 px-3 sm:px-4 bg-[#202c33] flex items-center justify-between border-b border-neutral-800 shrink-0">
        <h3 className="text-base sm:text-lg font-semibold text-[#e9edef] truncate">
          Información del chat
        </h3>
        <button
          type="button"
          onClick={() => {
            setActivePlayingAudioId(null);
            onClose();
          }}
          aria-label="Cerrar información del chat"
          className="w-10 h-10 min-w-[40px] min-h-[40px] text-[#8696a0] hover:text-white rounded-lg hover:bg-[#2a3942] active:scale-95 transition flex items-center justify-center cursor-pointer touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs (Single line with horizontal scroll & navigation arrows that only show on overflow) */}
      <div className="relative border-b border-neutral-800 bg-[#111b21] flex items-center select-none overflow-hidden shrink-0">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => {
              tabsContainerRef.current?.scrollBy({ left: -140, behavior: 'smooth' });
            }}
            aria-label="Desplazar pestañas hacia la izquierda"
            title="Ver pestañas anteriores"
            className="absolute left-0 top-0 bottom-0 z-20 px-1 bg-gradient-to-r from-[#111b21] via-[#111b21]/95 to-transparent text-[#8696a0] hover:text-white flex items-center justify-center transition cursor-pointer touch-manipulation min-w-[28px]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={tabsContainerRef}
          className="flex w-full overflow-x-auto scrollbar-none px-2 text-xs font-medium shrink-0 scroll-smooth items-center gap-0.5"
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap touch-manipulation min-h-[44px] shrink-0 ${
              activeTab === 'info'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap touch-manipulation min-h-[44px] shrink-0 ${
              activeTab === 'media'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Fotos ({visualMedia.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap touch-manipulation min-h-[44px] shrink-0 ${
              activeTab === 'audio'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Audios ({audioMedia.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap touch-manipulation min-h-[44px] shrink-0 ${
              activeTab === 'docs'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Docs ({docMedia.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('starred')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap touch-manipulation min-h-[44px] shrink-0 flex items-center gap-1.5 ${
              activeTab === 'starred'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Destacados ({starredMessages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pinned')}
            className={`py-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap touch-manipulation min-h-[44px] shrink-0 flex items-center gap-1.5 ${
              activeTab === 'pinned'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Fijados ({pinnedMessages.length})</span>
          </button>
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => {
              tabsContainerRef.current?.scrollBy({ left: 140, behavior: 'smooth' });
            }}
            aria-label="Desplazar pestañas hacia la derecha"
            title="Ver más pestañas"
            className="absolute right-0 top-0 bottom-0 z-20 px-1 bg-gradient-to-l from-[#111b21] via-[#111b21]/95 to-transparent text-[#8696a0] hover:text-white flex items-center justify-center transition cursor-pointer touch-manipulation min-w-[28px]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 sm:space-y-5 scrollbar-thin">
        {activeTab === 'info' && (
          <>
            {/* Chat Profile Hero */}
            <div className="flex flex-col items-center text-center p-4 bg-[#202c33]/40 rounded-xl border border-neutral-800">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#00a884] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                {metadata.isGroup ? <Users className="w-9 h-9 sm:w-10 sm:h-10" /> : metadata.title.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#e9edef]">{metadata.title}</h2>
              <p className="text-xs text-[#8696a0] mt-1 font-mono">
                {metadata.startDate} {metadata.endDate && metadata.startDate !== metadata.endDate ? `— ${metadata.endDate}` : ''}
              </p>
            </div>

            {/* Overall Statistics Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-[#202c33]/60 border border-neutral-800">
                <span className="text-[#8696a0] flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00a884]" /> Total mensajes
                </span>
                <span className="text-base sm:text-lg font-bold text-[#e9edef] font-mono">{metadata.totalMessages}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#202c33]/60 border border-neutral-800">
                <span className="text-[#8696a0] flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> Participantes
                </span>
                <span className="text-base sm:text-lg font-bold text-[#e9edef] font-mono">{metadata.participants.length}</span>
              </div>
            </div>

            {/* Media Breakdown Details */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33]/40 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                Desglose multimedia ({metadata.mediaCounts.total} archivos)
              </h4>
              <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-[#e9edef]">
                  <Image className="w-4 h-4 text-emerald-400" />
                  <span>Fotos: <strong>{metadata.mediaCounts.images}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#e9edef]">
                  <Film className="w-4 h-4 text-sky-400" />
                  <span>Videos: <strong>{metadata.mediaCounts.videos}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#e9edef]">
                  <Music className="w-4 h-4 text-violet-400" />
                  <span>Audios: <strong>{metadata.mediaCounts.audios}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#e9edef]">
                  <Smile className="w-4 h-4 text-amber-400" />
                  <span>Stickers: <strong>{metadata.mediaCounts.stickers}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#e9edef]">
                  <span className="text-[10px] font-bold text-pink-400">GIF</span>
                  <span>GIFs: <strong>{metadata.mediaCounts.gifs}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-[#e9edef]">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Documentos: <strong>{metadata.mediaCounts.documents}</strong></span>
                </div>
              </div>
            </div>

            {/* Participants activity */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#202c33]/40 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                Actividad por participante
              </h4>
              <div className="space-y-2">
                {participantStats.map((stat) => {
                  const percentage =
                    metadata.totalMessages > 0
                      ? Math.round((stat.count / metadata.totalMessages) * 100)
                      : 0;
                  return (
                    <div key={stat.name} className="text-xs space-y-1">
                      <div className="flex justify-between text-[#e9edef]">
                        <span className="font-medium truncate max-w-[200px]">{stat.displayName || stat.name}</span>
                        <span className="font-mono text-[#8696a0]">
                          {stat.count} msgs ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00a884] h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unmatched files warning if any */}
            {metadata.unmatchedFilesCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{metadata.unmatchedFilesCount} archivo(s) no vinculados</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Algunos archivos en el ZIP no fueron mencionados explícitamente en el texto del chat exportado.
                </p>
              </div>
            )}
          </>
        )}

        {/* Media Grid Tab */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            {visualMedia.length === 0 ? (
              <p className="text-center text-xs text-[#8696a0] py-8">No hay imágenes ni videos en este chat.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {visualMedia.slice(0, visibleMediaCount).map((m) => (
                    <div
                      key={m.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-black/40 group border border-white/5 flex flex-col justify-between shadow-sm"
                    >
                      <div
                        onClick={() => {
                          if (m.attachment) {
                            onSelectMedia(
                              m.attachment,
                              m.text,
                              getDisplayName(m.sender),
                              `${m.rawDate} ${m.rawTime}`,
                              m.id
                            );
                          }
                        }}
                        className="w-full h-full cursor-pointer overflow-hidden touch-manipulation"
                        title="Toca para ver en pantalla completa"
                      >
                        {m.attachment?.mediaType === 'video' ? (
                          <video src={m.attachment.url} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={m.attachment?.url}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        )}
                        {m.attachment?.mediaType === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Film className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Bottom overlay with timestamp and "Ver en el chat" button */}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between z-10">
                        <span className="text-[10px] text-white/90 font-mono truncate max-w-[55%]">
                          {m.rawTime}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJumpToMessage(m.id);
                          }}
                          title="Ver en el chat"
                          className="px-2 py-1 rounded bg-[#00a884] hover:bg-[#02906f] text-white text-[10.5px] font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer active:scale-95 touch-manipulation min-h-[30px]"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {visualMedia.length > visibleMediaCount && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleMediaCount((prev) => prev + 30)}
                      className="px-4 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium text-[#00a884] border border-neutral-700/60 transition cursor-pointer active:scale-95"
                    >
                      Cargar más fotos y videos ({visualMedia.length - visibleMediaCount} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Audio Tab: Single Reusable Player + Progressive Loading (High-performance on Android & iOS) */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            {audioMedia.length === 0 ? (
              <p className="text-center text-xs text-[#8696a0] py-8">No hay audios en este chat.</p>
            ) : (
              <>
                {audioMedia.slice(0, visibleAudioCount).map((m) => {
                  if (!m.attachment) return null;

                  const isCurrentPlaying = activePlayingAudioId === m.id;
                  const senderName = getDisplayName(m.sender);

                  return (
                    <div
                      key={m.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-[#202c33]/85 border border-neutral-700/60 shadow-md flex flex-col gap-2.5 transition hover:border-neutral-600"
                    >
                      {/* Top Row: Sender, Date/Time, and "Ver en el chat" button */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-[13px] font-semibold text-[#e9edef] truncate">
                            {senderName}
                          </p>
                          <p className="text-[10.5px] sm:text-[11px] text-[#8696a0] font-mono mt-0.5">
                            {m.rawDate} · {m.rawTime}
                          </p>
                        </div>

                        {/* "Ver en el chat" button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActivePlayingAudioId(null);
                            onJumpToMessage(m.id);
                          }}
                          title="Ver este audio en la conversación"
                          className="px-3 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer active:scale-95 touch-manipulation min-h-[36px]"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ver en el chat</span>
                        </button>
                      </div>

                      {/* Middle: Either active player (if playing) OR lightweight play card */}
                      {isCurrentPlaying ? (
                        <div className="bg-[#111b21]/80 rounded-lg p-2.5 border border-white/5 w-full overflow-hidden">
                          <AudioPlayer
                            messageId={m.id}
                            attachment={m.attachment}
                            isPlaying={true}
                            playbackRate={audioPlaybackRate}
                            onPlay={() => setActivePlayingAudioId(m.id)}
                            onPause={() => {
                              if (activePlayingAudioId === m.id) {
                                setActivePlayingAudioId(null);
                              }
                            }}
                            onEnded={() => {
                              if (activePlayingAudioId === m.id) {
                                setActivePlayingAudioId(null);
                              }
                            }}
                            onChangeRate={onChangeAudioRate}
                            className="w-full max-w-full"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => setActivePlayingAudioId(m.id)}
                          className="bg-[#111b21]/60 hover:bg-[#111b21] rounded-lg p-2.5 border border-white/5 w-full flex items-center gap-3 cursor-pointer transition group"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePlayingAudioId(m.id);
                            }}
                            aria-label="Reproducir audio"
                            className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#02906f] group-hover:scale-105 text-white flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 touch-manipulation"
                          >
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                              <div className="h-full bg-neutral-600 w-0" />
                            </div>
                            <p className="text-[11px] text-[#8696a0] font-mono mt-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1 text-emerald-400/90 font-sans text-xs">
                                <Music className="w-3.5 h-3.5 text-[#00a884]" />
                                <span>Tocar para reproducir</span>
                              </span>
                              {m.attachment.size && <span>{formatBytes(m.attachment.size)}</span>}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Bottom Row: Filename */}
                      <div className="flex items-center justify-between text-[10.5px] text-[#8696a0] font-mono px-0.5">
                        <span className="truncate max-w-[70%]" title={m.attachment.fileName}>
                          {m.attachment.fileName}
                        </span>
                        {m.attachment.size && (
                          <span className="shrink-0 font-medium">
                            {formatBytes(m.attachment.size)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {audioMedia.length > visibleAudioCount && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleAudioCount((prev) => prev + 30)}
                      className="px-4 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium text-[#00a884] border border-neutral-700/60 transition cursor-pointer active:scale-95"
                    >
                      Cargar más audios ({audioMedia.length - visibleAudioCount} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Docs Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            {docMedia.length === 0 ? (
              <p className="text-center text-xs text-[#8696a0] py-8">No hay documentos en este chat.</p>
            ) : (
              <>
                {docMedia.slice(0, visibleDocsCount).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-[#202c33]/70 border border-neutral-800 flex items-center justify-between gap-2 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#e9edef] truncate">{getDisplayName(m.sender)}</p>
                        <p className="text-[11px] text-[#8696a0] truncate font-mono" title={m.attachment?.fileName}>
                          {m.attachment?.fileName}
                        </p>
                        <p className="text-[10px] text-[#8696a0]/80 font-mono">
                          {formatBytes(m.attachment?.size)} · {m.rawDate} {m.rawTime}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onJumpToMessage(m.id)}
                        title="Ver este documento en la conversación"
                        className="px-2.5 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95 touch-manipulation min-h-[36px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver en el chat</span>
                      </button>
                      <a
                        href={m.attachment?.url}
                        download={m.attachment?.fileName}
                        className="p-2 text-neutral-300 hover:text-white rounded hover:bg-neutral-700/50 transition cursor-pointer touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Descargar documento"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}

                {docMedia.length > visibleDocsCount && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleDocsCount((prev) => prev + 30)}
                      className="px-4 py-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium text-[#00a884] border border-neutral-700/60 transition cursor-pointer active:scale-95"
                    >
                      Cargar más documentos ({docMedia.length - visibleDocsCount} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Starred Messages Tab */}
        {activeTab === 'starred' && (
          <div className="space-y-2.5">
            {starredMessages.length === 0 ? (
              <div className="text-center py-12 px-4 text-[#8696a0]">
                <Star className="w-10 h-10 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
                <p className="text-sm font-medium text-[#e9edef]">No hay mensajes destacados</p>
                <p className="text-xs text-[#8696a0] mt-1 leading-relaxed">
                  Destaca cualquier mensaje importante usando el menú (⭐) de un mensaje en el chat.
                </p>
              </div>
            ) : (
              starredMessages.map((m) => {
                const senderName = getDisplayName(m.sender);
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#202c33]/70 border border-neutral-800 space-y-2 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#00a884] truncate max-w-[200px]">
                        {senderName}
                      </span>
                      <span className="text-[11px] text-[#8696a0] font-mono">
                        {m.rawDate} · {m.rawTime}
                      </span>
                    </div>

                    {/* Preview Content */}
                    <div className="text-xs text-[#e9edef] leading-relaxed">
                      {m.attachment && (
                        <div className="mb-1.5 flex items-center gap-2 text-neutral-300">
                          {m.attachment.mediaType === 'image' && (
                            <img
                              src={m.attachment.url}
                              alt="Foto"
                              loading="lazy"
                              className="w-12 h-12 rounded object-cover border border-white/10 shrink-0"
                            />
                          )}
                          {m.attachment.mediaType === 'sticker' && (
                            <img
                              src={m.attachment.url}
                              alt="Sticker"
                              loading="lazy"
                              className="w-10 h-10 object-contain shrink-0"
                            />
                          )}
                          {(m.attachment.mediaType === 'audio' || m.attachment.mediaType === 'voice') && (
                            <span className="flex items-center gap-1.5 text-xs text-sky-400">
                              <Music className="w-4 h-4" /> Audio / Mensaje de voz
                            </span>
                          )}
                          {m.attachment.mediaType === 'document' && (
                            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-mono truncate">
                              <FileText className="w-4 h-4 shrink-0" /> {m.attachment.fileName}
                            </span>
                          )}
                        </div>
                      )}
                      {m.text && <p className="line-clamp-3 select-text">{m.text}</p>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          onJumpToMessage(m.id);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ver en el chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStar?.(m.id)}
                        title="Quitar de destacados"
                        className="px-2 py-1 text-xs text-[#8696a0] hover:text-amber-400 hover:bg-neutral-800 rounded transition cursor-pointer flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pinned Messages Tab */}
        {activeTab === 'pinned' && (
          <div className="space-y-2.5">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-12 px-4 text-[#8696a0]">
                <Pin className="w-10 h-10 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
                <p className="text-sm font-medium text-[#e9edef]">No hay mensajes fijados</p>
                <p className="text-xs text-[#8696a0] mt-1 leading-relaxed">
                  Fija mensajes importantes desde el menú (📌) para mantenerlos accesibles arriba de la conversación.
                </p>
              </div>
            ) : (
              pinnedMessages.map((m) => {
                const senderName = getDisplayName(m.sender);
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#202c33]/70 border border-neutral-800 space-y-2 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#00a884] truncate max-w-[200px]">
                        {senderName}
                      </span>
                      <span className="text-[11px] text-[#8696a0] font-mono">
                        {m.rawDate} · {m.rawTime}
                      </span>
                    </div>

                    {/* Preview Content */}
                    <div className="text-xs text-[#e9edef] leading-relaxed">
                      {m.attachment && (
                        <div className="mb-1.5 flex items-center gap-2 text-neutral-300">
                          {m.attachment.mediaType === 'image' && (
                            <img
                              src={m.attachment.url}
                              alt="Foto"
                              loading="lazy"
                              className="w-12 h-12 rounded object-cover border border-white/10 shrink-0"
                            />
                          )}
                          {m.attachment.mediaType === 'sticker' && (
                            <img
                              src={m.attachment.url}
                              alt="Sticker"
                              loading="lazy"
                              className="w-10 h-10 object-contain shrink-0"
                            />
                          )}
                          {(m.attachment.mediaType === 'audio' || m.attachment.mediaType === 'voice') && (
                            <span className="flex items-center gap-1.5 text-xs text-sky-400">
                              <Music className="w-4 h-4" /> Audio / Mensaje de voz
                            </span>
                          )}
                          {m.attachment.mediaType === 'document' && (
                            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-mono truncate">
                              <FileText className="w-4 h-4 shrink-0" /> {m.attachment.fileName}
                            </span>
                          )}
                        </div>
                      )}
                      {m.text && <p className="line-clamp-3 select-text">{m.text}</p>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          onJumpToMessage(m.id);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ver en el chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onTogglePin?.(m.id)}
                        title="Desfijar este mensaje"
                        className="px-2 py-1 text-xs text-[#8696a0] hover:text-rose-400 hover:bg-neutral-800 rounded transition cursor-pointer flex items-center gap-1"
                      >
                        <Pin className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        <span>Desfijar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
