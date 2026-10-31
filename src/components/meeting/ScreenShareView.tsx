import React, { useRef, useEffect, useState } from 'react';
import { Monitor, Square, Maximize2, Minimize2, MousePointer, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { FloatingWebcamTile } from './FloatingWebcamTile';
import { RemoteControlOverlay } from './RemoteControlOverlay';
import { RemoteControlEvent } from '../../signaling/types';

export interface ScreenShareViewProps {
  screenStream: MediaStream | null;
  webcamStream?: MediaStream | null;
  presenterName: string;
  isLocal: boolean;
  onStopSharing?: () => void;
  // Remote Control props
  isControlling?: boolean;
  isBeingControlled?: boolean;
  activeControllerName?: string | null;
  onRequestRemoteControl?: () => void;
  onSendRemoteControlEvent?: (event: RemoteControlEvent) => void;
  onRevokeRemoteControl?: () => void;
  onReleaseRemoteControl?: () => void;
  incomingRemoteControlEvent?: RemoteControlEvent | null;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  screenStream,
  webcamStream,
  presenterName,
  isLocal,
  onStopSharing,
  isControlling = false,
  isBeingControlled = false,
  activeControllerName = null,
  onRequestRemoteControl,
  onSendRemoteControlEvent,
  onRevokeRemoteControl,
  onReleaseRemoteControl,
  incomingRemoteControlEvent,
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

      {/* Remote Control Interactive Overlay */}
      {(isControlling || isBeingControlled) && (
        <RemoteControlOverlay
          isPresenter={isLocal}
          isController={isControlling}
          controllerName={activeControllerName || 'Remote User'}
          onSendEvent={onSendRemoteControlEvent}
          onRevokeControl={onRevokeRemoteControl}
          onReleaseControl={onReleaseRemoteControl}
          incomingEvent={incomingRemoteControlEvent}
        />
      )}

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

          {isBeingControlled && (
            <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              Remote Control Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Request Remote Control Button for Viewers */}
          {!isLocal && !isControlling && onRequestRemoteControl && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<MousePointer className="w-3.5 h-3.5 text-brand-400" />}
              onClick={onRequestRemoteControl}
              className="bg-surface-900/90 hover:bg-surface-800 border-surface-700/80 shadow-md text-xs py-1.5"
            >
              Request Remote Control
            </Button>
          )}

          {/* Controller status badge */}
          {!isLocal && isControlling && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Controlling Screen</span>
            </div>
          )}

          {/* Presenter: Stop Sharing */}
          {isLocal && onStopSharing && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
              onClick={onStopSharing}
              className="shadow-rose-500/30 text-xs py-1.5"
            >
              Stop Sharing
            </Button>
          )}

          {/* Fullscreen toggle */}
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
