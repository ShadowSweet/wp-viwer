import React from 'react';
import {
  Search,
  Calendar,
  ArrowUp,
  Info,
  Users,
  User,
  ArrowLeft,
} from 'lucide-react';
import { ChatMetadata } from '../types/chat';

interface ChatHeaderProps {
  metadata: ChatMetadata;
  displayTitle?: string;
  currentUser: string;
  onChangeCurrentUser: (user: string) => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  onOpenDatePicker: () => void;
  onScrollToTop: () => void;
  onToggleInfo: () => void;
  onBackToSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  metadata,
  displayTitle,
  currentUser,
  onChangeCurrentUser,
  onToggleSearch,
  isSearchOpen,
  onOpenDatePicker,
  onScrollToTop,
  onToggleInfo,
  onBackToSidebar,
}) => {
  const title = displayTitle || metadata.title;

  // Generate avatar initials
  const initials = title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="h-14 sm:h-15 bg-[#111b21] border-b border-neutral-800 flex items-center justify-between px-2 sm:px-4 z-20 select-none shrink-0 shadow-xs">
      {/* Contact / Group Info */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 mr-1">
        {/* Back to sidebar button (prominent on mobile / small screens) */}
        <button
          type="button"
          onClick={onBackToSidebar}
          title="Volver a la lista de chats"
          aria-label="Volver a la lista de chats"
          className="md:hidden p-1.5 -ml-1 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-[#202c33] active:scale-95 transition min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Avatar */}
        <div
          onClick={onToggleInfo}
          className="relative w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0 cursor-pointer hover:ring-2 hover:ring-[#00a884]/40 transition shadow-sm touch-manipulation"
        >
          {metadata.isGroup ? (
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
          ) : initials ? (
            <span>{initials}</span>
          ) : (
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
          )}
        </div>

        {/* Name and subtitle */}
        <div onClick={onToggleInfo} className="min-w-0 flex-1 cursor-pointer group">
          <h2 className="text-xs sm:text-[14.5px] font-semibold text-[#e9edef] truncate group-hover:text-emerald-400 transition-colors leading-tight">
            {title}
          </h2>
          <p className="text-[10.5px] sm:text-[11.5px] text-[#8696a0] truncate font-normal leading-tight mt-0.5">
            {metadata.isGroup ? (
              <span>
                {metadata.participants.length} participantes · {metadata.totalMessages} msgs
              </span>
            ) : (
              <span>
                {metadata.totalMessages} mensajes
                {metadata.startDate && ` · ${metadata.startDate}`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Header Action Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {/* Selector for "Yo" (perspective switcher, hidden on narrow screens) */}
        {metadata.participants.length > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 text-xs bg-[#202c33] px-2 py-1 rounded-lg border border-neutral-700/50 mr-1">
            <span className="text-[#8696a0]">Perspectiva (Tú):</span>
            <select
              value={currentUser}
              onChange={(e) => onChangeCurrentUser(e.target.value)}
              className="bg-transparent text-[#00a884] font-medium focus:outline-none cursor-pointer pr-1"
              title="Cambia quién envía los mensajes verdes"
              aria-label="Seleccionar perspectiva"
            >
              {metadata.participants.map((p) => (
                <option key={p} value={p} className="bg-[#202c33] text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 1. Search text button */}
        <button
          type="button"
          onClick={onToggleSearch}
          title="Buscar texto en mensajes"
          aria-label="Buscar mensajes"
          className={`p-1.5 sm:p-2 rounded-lg transition min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center touch-manipulation ${
            isSearchOpen
              ? 'bg-[#00a884] text-white'
              : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]'
          }`}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 2. Search by Date button */}
        <button
          type="button"
          onClick={onOpenDatePicker}
          title="Buscar mensajes por fecha (Día, Mes, Año)"
          aria-label="Buscar mensajes por fecha"
          className="p-1.5 sm:p-2 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] active:scale-95 transition min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center gap-1 touch-manipulation"
        >
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xl:inline text-xs font-medium">Fecha</span>
        </button>

        {/* 3. Scroll to start of chat button */}
        <button
          type="button"
          onClick={onScrollToTop}
          title="Ir al primer mensaje de la conversación (Inicio)"
          aria-label="Ir al inicio de la conversación"
          className="p-1.5 sm:p-2 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] active:scale-95 transition min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center gap-1 touch-manipulation"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xl:inline text-xs font-medium">Inicio</span>
        </button>

        {/* 4. Info button */}
        <button
          type="button"
          onClick={onToggleInfo}
          title="Información del chat y multimedia"
          aria-label="Información del chat"
          className="p-1.5 sm:p-2 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center touch-manipulation"
        >
          <Info className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
