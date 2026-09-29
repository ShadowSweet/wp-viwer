import React from 'react';
import { MessageSquareDashed, Plus, ShieldCheck } from 'lucide-react';

interface EmptyChatStateProps {
  onAddChat: () => void;
  hasChats: boolean;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  onAddChat,
  hasChats,
}) => {
  return (
    <div className="h-full w-full bg-[#222e35] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background subtle doodle pattern */}
      <div className="absolute inset-0 bg-[#0b141a]/60 pointer-events-none" />

      <div className="relative z-10 max-w-md flex flex-col items-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-[#202c33] border border-neutral-700/60 flex items-center justify-center text-[#00a884] mb-6 shadow-xl">
          <MessageSquareDashed className="w-10 h-10" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#e9edef] mb-2 tracking-tight">
          {hasChats ? 'Selecciona una conversación' : 'Visualizador de Chats de WhatsApp'}
        </h2>

        <p className="text-sm text-[#8696a0] mb-8 leading-relaxed">
          {hasChats
            ? 'Elige un chat de la lista para leer la conversación, ver fotos, stickers y escuchar audios.'
            : 'Carga uno o varios archivos .ZIP exportados desde WhatsApp para reconstruir tus conversaciones con fotos, stickers y audios de forma 100% local y privada.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={onAddChat}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar chat (.ZIP)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-10 text-xs text-neutral-400 bg-[#111b21]/70 px-4 py-2 rounded-full border border-neutral-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tus datos permanecen en tu dispositivo. Nada se sube a internet.</span>
        </div>
      </div>
    </div>
  );
};
