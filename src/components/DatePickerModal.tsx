import React, { useState, useMemo } from 'react';
import { Calendar, X, ArrowRight, AlertCircle, Compass } from 'lucide-react';
import { Message } from '../types/chat';
import {
  findClosestDate,
  formatDateSeparator,
  formatYMDToSpanish,
  normalizeDateToYMD,
} from '../utils/dateUtils';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onNavigateToDate: (targetYMD: string) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  messages,
  onNavigateToDate,
}) => {
  // Collect all unique available YMD dates in the chat
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    for (const msg of messages) {
      const ymd = normalizeDateToYMD(msg.rawDate);
      if (ymd) {
        datesSet.add(ymd);
      }
    }
    return Array.from(datesSet).sort();
  }, [messages]);

  const minDate = availableDates[0] || '';
  const maxDate = availableDates[availableDates.length - 1] || '';

  // Default selected date to latest or today
  const [selectedYMD, setSelectedYMD] = useState<string>(() => {
    return maxDate || normalizeDateToYMD(new Date().toISOString().split('T')[0]);
  });

  const [hasSearched, setHasSearched] = useState(false);
  const [noExactMatch, setNoExactMatch] = useState(false);
  const [closestYMD, setClosestYMD] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchDate = () => {
    if (!selectedYMD) return;

    setHasSearched(true);
    if (availableDates.includes(selectedYMD)) {
      setNoExactMatch(false);
      onNavigateToDate(selectedYMD);
      onClose();
    } else {
      // Find closest date
      const closest = findClosestDate(selectedYMD, availableDates);
      setClosestYMD(closest);
      setNoExactMatch(true);
    }
  };

  const handleGoToClosest = () => {
    if (closestYMD) {
      onNavigateToDate(closestYMD);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-[#111b21] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#202c33] flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Calendar className="w-4 h-4 text-[#00a884]" />
            <span>Buscar por fecha</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
              Selecciona el día, mes y año:
            </label>
            <input
              type="date"
              value={selectedYMD}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                setSelectedYMD(e.target.value);
                setNoExactMatch(false);
                setHasSearched(false);
              }}
              className="w-full bg-[#202c33] text-white border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] font-mono cursor-pointer"
            />
            {minDate && maxDate && (
              <p className="text-[11px] text-[#8696a0] mt-1.5 font-mono">
                Rango del chat: {minDate.split('-').reverse().join('/')} a {maxDate.split('-').reverse().join('/')}
              </p>
            )}
          </div>

          {/* No exact match warning & closest date offer */}
          {noExactMatch && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>No hay mensajes en esta fecha.</span>
              </div>
              {closestYMD && (
                <div className="space-y-2">
                  <p className="text-[11.5px] text-amber-200/90 leading-relaxed">
                    La fecha con mensajes más cercana es:{' '}
                    <strong className="text-white font-semibold">
                      {formatYMDToSpanish(closestYMD)} ({closestYMD.split('-').reverse().join('/')})
                    </strong>
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToClosest}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white font-medium flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Ir a la fecha más cercana</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSearchDate}
              disabled={!selectedYMD}
              className="flex-1 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 active:scale-95 cursor-pointer"
            >
              <span>Ir a fecha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
