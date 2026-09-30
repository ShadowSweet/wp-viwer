import React, { useRef, useState } from 'react';
import {
  Plus,
  Search,
  Users,
  User,
  MoreVertical,
  Trash2,
  Edit2,
  FolderOpen,
  Image,
  Film,
  Music,
  Smile,
  FileText,
  X,
  FileArchive
} from 'lucide-react';
import { ChatSession } from '../types/chat';
import { formatParticipantName } from '../utils/participantUtils';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  loadingCount: number;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = React.memo(({
  sessions,
  activeSessionId,
  onSelectSession,
  onAddFiles,
  onRenameSession,
  onDeleteSession,
  loadingCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const rawTitle = (session.customTitle || session.title).toLowerCase();
    const formattedTitle = formatParticipantName(session.customTitle || session.title).toLowerCase();
    const titleMatch = rawTitle.includes(query) || formattedTitle.includes(query);
    const participantMatch = session.metadata.participants.some((p) =>
      p.toLowerCase().includes(query) || formatParticipantName(p).toLowerCase().includes(query)
    );
    return titleMatch || participantMatch;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.customTitle || session.title);
    setOpenMenuId(null);
  };

  const submitRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const renderMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'image':
        return <Image className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'video':
        return <Film className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'audio':
      case 'voice':
        return <Music className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
      case 'sticker':
        return <Smile className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'gif':
        return <span className="text-[9px] font-bold text-pink-400 shrink-0">GIF</span>;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <aside
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-full w-full bg-[#111b21] flex flex-col select-none relative transition-colors ${
        isDragOver ? 'ring-2 ring-emerald-500 bg-emerald-950/20' : ''
      }`}
    >
      {/* Hidden file input supporting multiple ZIP files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Sidebar Header */}
      <div className="p-3.5 bg-[#202c33] flex items-center justify-between border-b border-neutral-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00a884]/20 border border-[#00a884]/30 flex items-center justify-center text-[#00a884]">
            <FileArchive className="w-4 h-4" />
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">Chats</h1>
          {sessions.length > 0 && (
            <span className="text-[11px] font-semibold text-[#8696a0] font-mono">
              ({sessions.length})
            </span>
          )}
        </div>

        {/* Action Button: Add Chat */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Agregar uno o varios archivos ZIP de WhatsApp"
          className="py-1.5 px-3 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer touch-manipulation"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Agregar chat</span>
        </button>
      </div>

      {/* Loading banner if parsing multiple files */}
      {loadingCount > 0 && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-3 py-2 flex items-center gap-2 text-xs text-emerald-300 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Procesando {loadingCount} archivo(s) ZIP...</span>
        </div>
      )}

      {/* Search Input for Chats list */}
      <div className="p-2.5 border-b border-neutral-800/80 bg-[#111b21] shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar o empezar un nuevo chat"
            className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-xs rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#00a884] border border-transparent transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-0.5 text-[#8696a0] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40 scrollbar-thin scrollbar-thumb-neutral-700/50">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8696a0] flex flex-col items-center">
            {searchQuery ? (
              <p>No se encontraron chats con "{searchQuery}"</p>
            ) : (
              <div className="space-y-3 max-w-xs">
                <FileArchive className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="font-semibold text-neutral-300">No hay chats cargados aún</p>
                <p className="text-[11px] leading-relaxed">
                  Haz clic en <strong>+ Agregar chat</strong> o arrastra archivos <strong>.ZIP</strong> exportados de WhatsApp aquí.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-white font-medium text-xs transition active:scale-95 shadow-sm"
                >
                  Seleccionar archivo .ZIP
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = session.id === activeSessionId;
            const displayTitle = formatParticipantName(session.customTitle || session.title);
            const initials = displayTitle
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();

            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => {
                  if (!isEditing) onSelectSession(session.id);
                }}
                className={`relative px-3.5 py-3 cursor-pointer transition flex items-center gap-3 group border-l-4 touch-manipulation ${
                  isSelected
                    ? 'bg-[#2a3942] border-[#00a884]'
                    : 'border-transparent hover:bg-[#202c33]/70'
                }`}
              >
                {/* Contact / Group Avatar */}
                <div className="relative shrink-0 w-11 h-11 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                  {session.metadata.isGroup ? (
                    <Users className="w-5 h-5 text-white/90" />
                  ) : initials ? (
                    <span>{initials}</span>
                  ) : (
                    <User className="w-5 h-5 text-white/90" />
                  )}
                </div>

                {/* Chat Details & Last Message Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    {/* Title or Rename Input */}
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => submitRename(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename(session.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#111b21] text-white text-xs font-semibold px-2 py-0.5 rounded border border-[#00a884] focus:outline-none w-full"
                      />
                    ) : (
                      <h3
                        className="text-sm font-semibold truncate text-[#e9edef] group-hover:text-white"
                        title={displayTitle}
                      >
                        {displayTitle}
                      </h3>
                    )}

                    {/* Timestamp */}
                    {session.lastMessagePreview?.time && !isEditing && (
                      <span className="text-[11px] font-mono text-[#8696a0] shrink-0 ml-1">
                        {session.lastMessagePreview.time}
                      </span>
                    )}
                  </div>

                  {/* Last Message Snippet */}
                  <div className="flex items-center gap-1.5 text-xs text-[#8696a0] truncate">
                    {renderMediaIcon(session.lastMessagePreview?.mediaType)}
                    <span className="truncate">
                      {session.lastMessagePreview?.text || (
                        <span className="italic text-neutral-500">
                          {session.metadata.totalMessages} mensajes
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Context Menu Button (Accessible on Mobile Tap) */}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(openMenuId === session.id ? null : session.id)
                    }
                    title="Opciones del chat"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700/50 md:opacity-0 md:group-hover:opacity-100 transition active:scale-95"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === session.id && (
                    <div className="absolute right-0 top-8 z-30 w-44 bg-[#233138] border border-neutral-700 rounded-xl shadow-2xl py-1 text-xs text-[#e9edef] animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(session.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#182229] flex items-center gap-2"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Abrir</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => startRename(session, e)}
                        className="w-full px-3 py-2 text-left hover:bg-[#182229] flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Renombrar</span>
                      </button>

                      <div className="border-t border-neutral-700/60 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          onDeleteSession(session.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-rose-950/60 text-rose-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Eliminar de la sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drag & Drop Overlay Hint */}
      {isDragOver && (
        <div className="absolute inset-0 bg-[#00a884]/20 border-2 border-dashed border-[#00a884] backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-40 pointer-events-none">
          <FileArchive className="w-12 h-12 text-[#00a884] animate-bounce mb-2" />
          <p className="text-sm font-bold text-white">Suelta los archivos .ZIP aquí</p>
          <p className="text-xs text-neutral-300 mt-1">Se agregarán a tu lista de chats</p>
        </div>
      )}
    </aside>
  );
});
