import React from 'react';
import { Search, X, ChevronUp, ChevronDown, FileText } from 'lucide-react';

export interface SearchResultItem {
  id: string;
  sender: string;
  rawDate: string;
  rawTime: string;
  text: string;
  fileName?: string;
}

interface SearchBarProps {
  searchQuery: string;
  onChangeQuery: (query: string) => void;
  onClose: () => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  matches: SearchResultItem[];
  onSelectMatch: (messageId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onChangeQuery,
  onClose,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  matches,
  onSelectMatch,
}) => {
  return (
    <div className="bg-[#111b21] border-b border-neutral-800 p-2.5 sm:p-3 select-none animate-in slide-in-from-top-2 duration-150 shadow-lg relative z-30">
      <div className="flex items-center gap-2">
        {/* Search input field */}
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Buscar en la conversación..."
            className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00a884] border border-transparent transition"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onChangeQuery('')}
              className="absolute right-3 p-0.5 rounded text-[#8696a0] hover:text-[#e9edef] cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Match counter and navigation */}
        {searchQuery.trim().length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#202c33] px-2.5 py-1.5 rounded-lg border border-neutral-700/60 text-xs shrink-0">
            <span className="text-[#8696a0] font-mono whitespace-nowrap text-[11px] sm:text-xs">
              {totalMatches > 0
                ? `${currentMatchIndex + 1} de ${totalMatches}`
                : 'Sin coincidencias'}
            </span>
            <button
              type="button"
              onClick={onPrevMatch}
              disabled={totalMatches === 0}
              title="Coincidencia anterior"
              className="p-1 hover:text-white text-[#8696a0] disabled:opacity-30 transition cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMatch}
              disabled={totalMatches === 0}
              title="Siguiente coincidencia"
              className="p-1 hover:text-white text-[#8696a0] disabled:opacity-30 transition cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Close search button */}
        <button
          type="button"
          onClick={onClose}
          title="Cerrar búsqueda"
          className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results Dropdown List when searching */}
      {searchQuery.trim().length > 0 && matches.length > 0 && (
        <div className="mt-2.5 max-h-56 overflow-y-auto rounded-lg bg-[#182229] border border-neutral-700/60 divide-y divide-neutral-800 shadow-xl scrollbar-thin">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider bg-[#202c33]/70 sticky top-0 backdrop-blur-xs flex items-center justify-between">
            <span>Resultados encontrados ({matches.length})</span>
            <span className="text-[10px] normal-case text-emerald-400">Toca para ir al mensaje</span>
          </div>
          {matches.map((item, idx) => {
            const isSelected = idx === currentMatchIndex;
            return (
              <div
                key={item.id}
                onClick={() => onSelectMatch(item.id)}
                className={`p-2.5 sm:px-3 sm:py-2 text-xs cursor-pointer transition flex flex-col gap-0.5 ${
                  isSelected
                    ? 'bg-[#00a884]/20 border-l-3 border-[#00a884]'
                    : 'hover:bg-[#202c33]'
                }`}
              >
                <div className="flex items-center justify-between text-[#8696a0] text-[11px]">
                  <span className="font-semibold text-[#e9edef] truncate max-w-[200px]">
                    {item.sender}
                  </span>
                  <span className="font-mono text-[10px] opacity-80">
                    {item.rawDate} {item.rawTime}
                  </span>
                </div>
                {item.text ? (
                  <p className="text-[#d1d7db] text-[12.5px] truncate line-clamp-1">
                    {highlightQuery(item.text, searchQuery)}
                  </p>
                ) : item.fileName ? (
                  <p className="text-[#8696a0] text-[12px] flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{highlightQuery(item.fileName, searchQuery)}</span>
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim().toLowerCase();
  const textLower = text.toLowerCase();
  const idx = textLower.indexOf(q);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      <span className="bg-yellow-400/90 text-black px-1 py-0.2 rounded font-semibold">
        {match}
      </span>
      {highlightQuery(after, query)}
    </>
  );
}
