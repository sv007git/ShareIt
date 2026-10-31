import React, { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Video } from 'lucide-react';

export interface FloatingWebcamTileProps {
  stream?: MediaStream | null;
  name: string;
  isMuted?: boolean;
}

export const FloatingWebcamTile: React.FC<FloatingWebcamTileProps> = ({
  stream,
  name,
  isMuted = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 20,
    posY: 20,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 240, dragStartRef.current.posX + deltaX)),
      y: Math.max(10, Math.min(window.innerHeight - 180, dragStartRef.current.posY + deltaY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-30 transition-shadow duration-200 select-none ${
        isMinimized ? 'w-12 h-12' : 'w-52 sm:w-64 aspect-video'
      } bg-surface-900 border-2 border-brand-500/80 rounded-2xl shadow-2xl overflow-hidden cursor-move`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Title / Action bar */}
      <div className="absolute top-1.5 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
        <span className="text-[10px] font-semibold text-white bg-surface-950/80 px-2 py-0.5 rounded-md backdrop-blur-md">
          {name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          className="pointer-events-auto p-1 rounded-md bg-surface-950/80 text-surface-300 hover:text-white transition-colors"
          title={isMinimized ? 'Expand camera' : 'Minimize camera'}
        >
          {isMinimized ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
      </div>

      {!isMinimized ? (
        <div className="w-full h-full relative flex items-center justify-center bg-surface-950">
          {stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-surface-400">
              <Video className="w-5 h-5 text-surface-500" />
              <span className="text-[10px] font-medium">{name}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-brand-600 text-white font-bold text-xs">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
};
