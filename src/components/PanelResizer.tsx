import React from 'react';

interface PanelResizerProps {
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent | React.PointerEvent) => void;
  onDoubleClick?: () => void;
}

export const PanelResizer: React.FC<PanelResizerProps> = React.memo(({
  onMouseDown,
  onDoubleClick,
}) => {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Divisor de paneles redimensionable"
      tabIndex={0}
      title="Arrastra para cambiar el tamaño de los paneles (Doble clic para restablecer)"
      onPointerDown={onMouseDown}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="hidden lg:flex relative w-1.5 shrink-0 z-30 cursor-col-resize items-center justify-center select-none group transition-colors touch-none bg-[#1e2a30] hover:bg-[#00a884]/80 active:bg-[#00a884] [[data-resizing=true]_&]:bg-[#00a884] [[data-resizing=true]_&]:shadow-[0_0_8px_rgba(0,168,132,0.6)]"
    >
      {/* Invisible expanded hit area for effortless clicking and grabbing */}
      <div className="absolute inset-y-0 -left-2 -right-2 z-40 cursor-col-resize" />

      {/* Visual grab handle indicator */}
      <div
        className="w-0.5 h-8 rounded-full transition-all bg-[#8696a0]/50 group-hover:bg-white group-hover:scale-y-110 [[data-resizing=true]_&]:bg-white [[data-resizing=true]_&]:opacity-100 [[data-resizing=true]_&]:scale-y-125"
      />
    </div>
  );
});

