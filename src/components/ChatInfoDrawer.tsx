import React, { useState } from 'react';
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
} from 'lucide-react';
import { Attachment, ChatMetadata, Message } from '../types/chat';
import { formatBytes } from '../utils/dateUtils';

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
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({
  metadata,
  messages,
  isOpen,
  onClose,
  onSelectMedia,
  onJumpToMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'docs' | 'audio'>('info');

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

  // Compute message counts per participant
  const participantStats = metadata.participants
    .map((name) => {
      const count = messages.filter((m) => !m.isSystem && m.sender === name).length;
      return { name, count };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-[#111b21] border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-15 px-4 bg-[#202c33] flex items-center justify-between border-b border-neutral-800 shrink-0">
        <h3 className="text-base font-semibold text-[#e9edef]">Información del chat</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-[#8696a0] hover:text-white rounded-lg hover:bg-[#2a3942] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 bg-[#111b21] px-2 text-xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`py-3 px-3 border-b-2 transition cursor-pointer ${
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
          className={`py-3 px-3 border-b-2 transition cursor-pointer ${
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
          className={`py-3 px-3 border-b-2 transition cursor-pointer ${
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
          className={`py-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'docs'
              ? 'border-[#00a884] text-[#00a884]'
              : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          Docs ({docMedia.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {activeTab === 'info' && (
          <>
            {/* Chat Profile Hero */}
            <div className="flex flex-col items-center text-center p-4 bg-[#202c33]/40 rounded-xl border border-neutral-800">
              <div className="w-20 h-20 rounded-full bg-[#00a884] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                {metadata.isGroup ? <Users className="w-10 h-10" /> : metadata.title.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-[#e9edef]">{metadata.title}</h2>
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
                <span className="text-lg font-bold text-[#e9edef] font-mono">{metadata.totalMessages}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#202c33]/60 border border-neutral-800">
                <span className="text-[#8696a0] flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> Participantes
                </span>
                <span className="text-lg font-bold text-[#e9edef] font-mono">{metadata.participants.length}</span>
              </div>
            </div>

            {/* Media Breakdown Details */}
            <div className="p-4 rounded-xl bg-[#202c33]/40 border border-neutral-800 space-y-3">
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
            <div className="p-4 rounded-xl bg-[#202c33]/40 border border-neutral-800 space-y-3">
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
                        <span className="font-medium truncate max-w-[200px]">{stat.name}</span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {visualMedia.map((m) => (
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
                            m.sender,
                            `${m.rawDate} ${m.rawTime}`,
                            m.id
                          );
                        }
                      }}
                      className="w-full h-full cursor-pointer overflow-hidden"
                      title="Toca para ver en pantalla completa"
                    >
                      {m.attachment?.mediaType === 'video' ? (
                        <video src={m.attachment.url} className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src={m.attachment?.url}
                          alt=""
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
                        className="px-1.5 py-0.5 rounded bg-[#00a884] hover:bg-[#02906f] text-white text-[10px] font-semibold flex items-center gap-1 transition shadow-sm cursor-pointer active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-2">
            {audioMedia.length === 0 ? (
              <p className="text-center text-xs text-[#8696a0] py-8">No hay audios en este chat.</p>
            ) : (
              audioMedia.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg bg-[#202c33]/70 border border-neutral-800 flex items-center justify-between gap-2.5 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#e9edef] truncate">
                        {m.sender}
                      </p>
                      <p className="text-[11px] text-[#8696a0] truncate font-mono">
                        {m.attachment?.fileName}
                      </p>
                      <p className="text-[10px] text-[#8696a0]/80 font-mono">
                        {m.rawDate} · {m.rawTime}
                      </p>
                    </div>
                  </div>

                  {/* "Ver en el chat" button */}
                  <button
                    type="button"
                    onClick={() => onJumpToMessage(m.id)}
                    title="Ver este audio en la conversación"
                    className="px-2.5 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ver en el chat</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Docs Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            {docMedia.length === 0 ? (
              <p className="text-center text-xs text-[#8696a0] py-8">No hay documentos en este chat.</p>
            ) : (
              docMedia.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg bg-[#202c33]/70 border border-neutral-800 flex items-center justify-between gap-2 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#e9edef] truncate">{m.sender}</p>
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
                      className="px-2.5 py-1.5 rounded-lg bg-[#00a884]/20 hover:bg-[#00a884]/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ver en el chat</span>
                    </button>
                    <a
                      href={m.attachment?.url}
                      download={m.attachment?.fileName}
                      className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-neutral-700/50 transition cursor-pointer"
                      title="Descargar documento"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
