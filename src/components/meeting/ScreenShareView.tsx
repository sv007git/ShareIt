import React, { useRef, useEffect, useState } from 'react';
import { Monitor, Square, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../common/Button';
import { FloatingWebcamTile } from './FloatingWebcamTile';

export interface ScreenShareViewProps {
  screenStream: MediaStream | null;
  webcamStream?: MediaStream | null;
  presenterName: string;
  isLocal: boolean;
  onStopSharing?: () => void;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  screenStream,
  webcamStream,
  presenterName,
  isLocal,
  onStopSharing,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-surface-950 overflow-hidden select-none"
    >
      {/* Presentation Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // mute locally to avoid feedback
        className="w-full h-full object-contain max-h-[calc(100vh-140px)]"
      />

      {/* Floating Presenter Webcam Tile */}
      <FloatingWebcamTile
        stream={webcamStream}
        name={presenterName}
      />

      {/* Top Banner Status Bar */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-surface-700/80 shadow-lg">
          <Monitor className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-xs font-semibold text-white">
            {isLocal ? 'You are sharing your screen' : `${presenterName} is sharing their screen`}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1 shrink-0" />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {isLocal && onStopSharing && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={onStopSharing}
              className="shadow-rose-500/30"
            >
              Stop Sharing
            </Button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-surface-900/90 text-surface-200 hover:text-white border border-surface-700/80 backdrop-blur-md transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
