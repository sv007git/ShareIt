import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MousePointer, PenTool, Sparkles, X, ShieldAlert, CornerUpLeft } from 'lucide-react';
import { RemoteControlEvent } from '../../signaling/types';

export interface RemoteControlOverlayProps {
  isPresenter: boolean; // Am I the one sharing my screen?
  isController: boolean; // Am I the one who was granted control?
  controllerName: string;
  onSendEvent?: (event: RemoteControlEvent) => void;
  onRevokeControl?: () => void;
  onReleaseControl?: () => void;
  incomingEvent?: RemoteControlEvent | null;
}

interface ClickRipple {
  id: string;
  x: number;
  y: number;
  color: string;
}

export const RemoteControlOverlay: React.FC<RemoteControlOverlayProps> = ({
  isPresenter,
  isController,
  controllerName,
  onSendEvent,
  onRevokeControl,
  onReleaseControl,
  incomingEvent,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Controller tool mode: 'pointer' | 'laser' | 'draw'
  const [mode, setMode] = useState<'pointer' | 'laser' | 'draw'>('pointer');
  const [penColor, setPenColor] = useState<string>('#38bdf8');

  // Presenter side visual state
  const [remotePointerPos, setRemotePointerPos] = useState<{ x: number; y: number } | null>(null);
  const [clickRipples, setClickRipples] = useState<ClickRipple[]>([]);
  const [lastKeyNotice, setLastKeyNotice] = useState<string | null>(null);

  // Keep canvas sized to container
  const updateCanvasDimensions = useCallback(() => {
    if (canvasRef.current && containerRef.current) {
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    }
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  // Handle incoming remote events (on Presenter's side)
  useEffect(() => {
    if (!incomingEvent || !isPresenter) return;

    const { action, x, y, button, key, drawPoint } = incomingEvent;
    setRemotePointerPos({ x, y });

    // Click ripples
    if (action === 'click' || action === 'down') {
      const rippleId = `rip-${Date.now()}-${Math.random()}`;
      setClickRipples((prev) => [...prev, { id: rippleId, x, y, color: drawPoint?.color || '#38bdf8' }]);
      setTimeout(() => {
        setClickRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 700);
    }

    // Key notification toast
    if (action === 'key' && key) {
      setLastKeyNotice(`${controllerName} typed: ${key}`);
      setTimeout(() => setLastKeyNotice(null), 2500);
    }

    // Drawing on canvas
    if ((action === 'draw' || action === 'laser') && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const px = x * canvasRef.current.width;
        const py = y * canvasRef.current.height;
        ctx.fillStyle = drawPoint?.color || '#f43f5e';
        ctx.beginPath();
        ctx.arc(px, py, drawPoint?.size || 4, 0, Math.PI * 2);
        ctx.fill();

        if (action === 'laser') {
          // Fade laser after 1.5s
          setTimeout(() => {
            if (canvasRef.current) {
              const c = canvasRef.current.getContext('2d');
              c?.clearRect(px - 10, py - 10, 20, 20);
            }
          }, 1500);
        }
      }
    }
  }, [incomingEvent, isPresenter, controllerName]);

  // Controller interaction handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isController || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const action = mode === 'laser' ? 'laser' : 'move';
    onSendEvent?.({
      action,
      x,
      y,
      drawPoint: mode === 'laser' ? { color: '#f43f5e', size: 5 } : undefined,
      timestamp: Date.now(),
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isController || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const btn = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';

    onSendEvent?.({
      action: mode === 'draw' ? 'draw' : 'click',
      x,
      y,
      button: btn,
      drawPoint: mode === 'draw' ? { color: penColor, size: 3 } : undefined,
      timestamp: Date.now(),
    });
  };

  const handleClearDrawings = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={isController ? handlePointerMove : undefined}
      onPointerDown={isController ? handlePointerDown : undefined}
      onContextMenu={isController ? (e) => e.preventDefault() : undefined}
      className={`absolute inset-0 z-20 overflow-hidden ${
        isController
          ? mode === 'pointer'
            ? 'cursor-crosshair'
            : mode === 'laser'
            ? 'cursor-none'
            : 'cursor-cell'
          : 'pointer-events-none'
      }`}
    >
      {/* Telestrator Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 pointer-events-none"
      />

      {/* Presenter Side: Remote Pointer Indicator */}
      {isPresenter && remotePointerPos && (
        <div
          style={{
            left: `${remotePointerPos.x * 100}%`,
            top: `${remotePointerPos.y * 100}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 z-30"
        >
          <div className="relative">
            <MousePointer className="w-5 h-5 text-brand-400 drop-shadow-md fill-brand-500" />
            <span className="absolute left-4 top-1 bg-surface-950/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-md border border-brand-500/80 shadow-lg whitespace-nowrap">
              {controllerName}
            </span>
          </div>
        </div>
      )}

      {/* Click Ripples */}
      {clickRipples.map((ripple) => (
        <div
          key={ripple.id}
          style={{
            left: `${ripple.x * 100}%`,
            top: `${ripple.y * 100}%`,
            backgroundColor: ripple.color,
            boxShadow: `0 0 12px ${ripple.color}`,
          }}
          className="remote-click-ripple"
        />
      ))}

      {/* Presenter Key Notification Toast */}
      {isPresenter && lastKeyNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-surface-900/90 text-white text-xs px-3.5 py-1.5 rounded-xl border border-surface-700 shadow-xl backdrop-blur-md animate-fade-in pointer-events-none">
          {lastKeyNotice}
        </div>
      )}

      {/* Controller Top HUD Bar */}
      {isController && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface-950/90 backdrop-blur-xl border border-brand-500/80 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 pointer-events-auto z-40 animate-slide-up text-surface-100">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Remote Control Active</span>
          </div>

          <div className="h-4 w-px bg-surface-800" />

          {/* Mode Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('pointer')}
              className={`p-1.5 rounded-xl transition-colors text-xs flex items-center gap-1 ${
                mode === 'pointer' ? 'bg-brand-500 text-white font-bold' : 'text-surface-300 hover:text-white'
              }`}
              title="Mouse / Cursor Control"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mouse</span>
            </button>

            <button
              onClick={() => setMode('laser')}
              className={`p-1.5 rounded-xl transition-colors text-xs flex items-center gap-1 ${
                mode === 'laser' ? 'bg-rose-500 text-white font-bold' : 'text-surface-300 hover:text-white'
              }`}
              title="Laser Pointer Mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laser</span>
            </button>

            <button
              onClick={() => setMode('draw')}
              className={`p-1.5 rounded-xl transition-colors text-xs flex items-center gap-1 ${
                mode === 'draw' ? 'bg-sky-500 text-white font-bold' : 'text-surface-300 hover:text-white'
              }`}
              title="Pen / Telestrator Annotation"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pen</span>
            </button>

            {mode === 'draw' && (
              <button
                onClick={handleClearDrawings}
                className="p-1.5 text-xs text-surface-400 hover:text-white"
                title="Clear annotations"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-surface-800" />

          {/* Release Control Button */}
          <button
            onClick={onReleaseControl}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent-rose hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Release</span>
          </button>
        </div>
      )}

      {/* Presenter Top Revoke Control Warning Banner */}
      {isPresenter && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface-950/95 backdrop-blur-xl border border-amber-500/80 rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-3 pointer-events-auto z-40 animate-slide-up text-surface-100">
          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              <strong>{controllerName}</strong> is controlling your screen
            </span>
          </div>

          <button
            onClick={onRevokeControl}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-accent-rose hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/30 active:scale-95"
            title="Immediately revoke remote control"
          >
            <X className="w-3.5 h-3.5" />
            <span>Revoke Control</span>
          </button>
        </div>
      )}
    </div>
  );
};
