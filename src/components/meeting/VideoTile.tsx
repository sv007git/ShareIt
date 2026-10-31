import React, { useEffect, useRef, useState } from 'react';
import { MicOff, Maximize2, MoreVertical, Shield, UserX, VolumeX } from 'lucide-react';
import { useAudioLevel } from '../../hooks/useAudioLevel';

export interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isHost?: boolean;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  mirror?: boolean;
  canHostControl?: boolean;
  onMuteParticipant?: () => void;
  onKickParticipant?: () => void;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  isLocal = false,
  isHost = false,
  isAudioMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  mirror = false,
  canHostControl = false,
  onMuteParticipant,
  onKickParticipant,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active speaker detection
  const { isSpeaking } = useAudioLevel(stream || null, !isAudioMuted);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled && !isVideoOff;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[160px] bg-surface-900 rounded-2xl overflow-hidden border transition-all duration-200 select-none flex items-center justify-center group ${
        isSpeaking
          ? 'border-brand-500 shadow-glow-brand ring-2 ring-brand-500/40'
          : 'border-surface-800 hover:border-surface-700'
      }`}
    >
      {/* Video Element */}
      {hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // always mute local audio element to prevent feedback loop
          className={`w-full h-full object-cover ${mirror && isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Video Off Avatar Placeholder */
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-600/40 to-surface-800 border border-surface-700 flex items-center justify-center text-lg sm:text-2xl font-bold text-white shadow-lg">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-surface-400 font-medium">Camera off</span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-1.5">
          {isHost && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" /> Host
            </span>
          )}
          {isScreenSharing && (
            <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-semibold">
              Screen
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-surface-950/70 text-surface-300 hover:text-white hover:bg-surface-800 backdrop-blur-md transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {canHostControl && !isLocal && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg bg-surface-950/70 text-surface-300 hover:text-white hover:bg-surface-800 backdrop-blur-md transition-colors"
                title="Participant actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 w-44 bg-surface-900 border border-surface-700 rounded-xl p-1 shadow-xl z-20 text-xs animate-scale-in">
                  <button
                    onClick={() => {
                      onMuteParticipant?.();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-800 text-surface-200 text-left transition-colors"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mute for all</span>
                  </button>
                  <button
                    onClick={() => {
                      onKickParticipant?.();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-800 text-accent-rose text-left transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Remove from room</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom info pill */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-surface-950/70 backdrop-blur-md border border-surface-800/80 text-xs text-white max-w-[85%] z-10">
        <span className="truncate font-medium">
          {name} {isLocal && '(You)'}
        </span>
        {isAudioMuted ? (
          <MicOff className="w-3.5 h-3.5 text-accent-rose shrink-0" />
        ) : isSpeaking ? (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
        ) : null}
      </div>
    </div>
  );
};
