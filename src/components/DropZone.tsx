import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileArchive,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ParseProgress } from '../utils/zipHandler';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  progress: ParseProgress | null;
  error: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  progress,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip')) {
        onFileSelected(file);
      } else {
        alert('Por favor selecciona un archivo comprimido .ZIP exportado desde WhatsApp.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1317] flex flex-col justify-between text-[#e9edef] p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00a884] to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              WhatsViewer
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Local
              </span>
            </h1>
            <p className="text-xs text-[#8696a0]">Visualizador de chats exportados de WhatsApp con multimedia</p>
          </div>
        </div>
      </header>

      {/* Main Center Area */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8 z-10 flex flex-col items-center">
        {/* Progress State */}
        {progress ? (
          <div className="w-full bg-[#111b21] border border-neutral-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 relative">
              <FileCheck className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">{progress.message}</h3>

            <div className="w-full bg-[#202c33] h-2.5 rounded-full overflow-hidden my-4 relative">
              <div
                className="bg-gradient-to-r from-emerald-500 to-[#00a884] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            <div className="flex justify-between w-full text-xs text-[#8696a0] font-mono">
              <span>Procesando en el navegador...</span>
              <span className="font-bold text-emerald-400">{progress.progress}%</span>
            </div>
          </div>
        ) : (
          /* Drag and Drop Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full group cursor-pointer rounded-2xl p-8 sm:p-12 border-2 border-dashed transition-all duration-200 flex flex-col items-center text-center relative ${
              isDragOver
                ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
                : 'border-neutral-700/80 bg-[#111b21]/80 hover:border-emerald-500/60 hover:bg-[#111b21]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="w-20 h-20 rounded-full bg-[#202c33] group-hover:bg-[#2a3942] flex items-center justify-center text-emerald-400 mb-6 transition shadow-inner">
              <UploadCloud className="w-10 h-10 group-hover:scale-110 transition-transform" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Arrastra aquí tu chat exportado de WhatsApp
            </h2>

            <p className="text-sm text-[#8696a0] max-w-md mb-6 leading-relaxed">
              Selecciona el archivo comprimido <span className="text-[#e9edef] font-semibold">.ZIP</span> que incluye el chat y los archivos multimedia (fotos, audios, videos y stickers).
            </p>

            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-white text-sm font-semibold transition shadow-md shadow-emerald-950/60 active:scale-95"
            >
              Seleccionar archivo ZIP
            </button>

            <p className="text-[11px] text-[#8696a0] mt-4 font-mono">
              Formatos soportados: ZIP exportado desde Android o iPhone
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 w-full p-4 rounded-xl bg-rose-950/40 border border-rose-600/30 text-xs text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Error al procesar el archivo</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Privacy badge */}
        <div className="flex items-center gap-2 mt-6 text-xs text-neutral-400 bg-[#111b21]/70 px-4 py-2 rounded-full border border-neutral-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>100% Privado y Local:</strong> Todo se procesa en tu navegador. Tus fotos, audios y chats nunca viajan por internet.
          </span>
        </div>

        {/* How to export collapsible instructions */}
        <div className="w-full mt-6 bg-[#111b21]/60 rounded-xl border border-neutral-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#8696a0] hover:text-[#e9edef] transition"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              ¿Cómo exportar un chat con multimedia desde WhatsApp?
            </span>
            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showInstructions && (
            <div className="p-4 pt-0 text-xs text-[#8696a0] space-y-4 border-t border-neutral-800/60 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#202c33]/40 border border-neutral-800/80">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 mb-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> En Android:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>Abre el chat en WhatsApp.</li>
                    <li>Toca los tres puntos (⋮) arriba a la derecha.</li>
                    <li>Selecciona <strong>Más &gt; Exportar chat</strong>.</li>
                    <li>Elige <strong>"Incluir archivos multimedia"</strong>.</li>
                    <li>Guarda el archivo <strong>.ZIP</strong> resultante.</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg bg-[#202c33]/40 border border-neutral-800/80">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 mb-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" /> En iPhone (iOS):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                    <li>Abre el chat en WhatsApp.</li>
                    <li>Toca el nombre del contacto o grupo en la parte superior.</li>
                    <li>Baja y selecciona <strong>Exportar chat</strong>.</li>
                    <li>Selecciona <strong>"Adjuntar archivos"</strong>.</li>
                    <li>Guarda el archivo <strong>.ZIP</strong> en Archivos o compártelo a tu PC.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[11px] text-[#8696a0] py-2 z-10">
        Inspirado en la estética de mensajería moderna. Sin seguimiento, sin telemetría, totalmente seguro.
      </footer>
    </div>
  );
};
