import React from 'react';
import { Search, X, ChevronUp, ChevronDown, Filter, Image, Film, Music, Smile, FileText } from 'lucide-react';
import { FilterOptions, MediaType } from '../types/chat';

interface SearchBarProps {
  filterOptions: FilterOptions;
  onChangeFilter: (options: FilterOptions) => void;
  onClose: () => void;
  participants: string[];
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filterOptions,
  onChangeFilter,
  onClose,
  participants,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  const mediaTypes: { id: 'all' | MediaType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todos', icon: null },
    { id: 'image', label: 'Fotos', icon: <Image className="w-3.5 h-3.5" /> },
    { id: 'video', label: 'Videos', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'voice', label: 'Audios', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'sticker', label: 'Stickers', icon: <Smile className="w-3.5 h-3.5" /> },
    { id: 'gif', label: 'GIFs', icon: <span className="text-[10px] font-bold">GIF</span> },
    { id: 'document', label: 'Docs', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#111b21] border-b border-neutral-800 p-3 select-none animate-in slide-in-from-top-2 duration-150 shadow-md">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input field */}
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={filterOptions.searchQuery}
            onChange={(e) => onChangeFilter({ ...filterOptions, searchQuery: e.target.value })}
            placeholder="Buscar mensajes, palabras o remitentes..."
            className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884] border border-transparent transition"
            autoFocus
          />
          {filterOptions.searchQuery && (
            <button
              type="button"
              onClick={() => onChangeFilter({ ...filterOptions, searchQuery: '' })}
              className="absolute right-3 p-0.5 rounded text-[#8696a0] hover:text-[#e9edef]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Participant dropdown filter */}
        <div className="flex items-center gap-2">
          {participants.length > 1 && (
            <select
              value={filterOptions.participant}
              onChange={(e) => onChangeFilter({ ...filterOptions, participant: e.target.value })}
              className="bg-[#202c33] text-[#e9edef] text-xs rounded-lg px-2.5 py-2 border border-neutral-700/60 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            >
              <option value="">Todos los participantes</option>
              {participants.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          {/* Match counter and navigation */}
          {filterOptions.searchQuery.trim().length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#202c33] px-2.5 py-1.5 rounded-lg border border-neutral-700/60 text-xs">
              <span className="text-[#8696a0] font-mono whitespace-nowrap">
                {totalMatches > 0 ? `${currentMatchIndex + 1} de ${totalMatches}` : 'Sin coincidencias'}
              </span>
              <button
                type="button"
                onClick={onPrevMatch}
                disabled={totalMatches === 0}
                title="Coincidencia anterior"
                className="p-1 hover:text-white text-[#8696a0] disabled:opacity-30 transition"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextMatch}
                disabled={totalMatches === 0}
                title="Siguiente coincidencia"
                className="p-1 hover:text-white text-[#8696a0] disabled:opacity-30 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Cerrar búsqueda"
            className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition ml-auto sm:ml-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter by media type pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 scrollbar-none text-xs">
        <span className="text-[11px] text-[#8696a0] flex items-center gap-1 mr-1 shrink-0 font-medium">
          <Filter className="w-3 h-3" /> Filtrar:
        </span>
        {mediaTypes.map((item) => {
          const isActive = filterOptions.mediaType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeFilter({ ...filterOptions, mediaType: item.id })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition active:scale-95 ${
                isActive
                  ? 'bg-[#00a884] text-white'
                  : 'bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
