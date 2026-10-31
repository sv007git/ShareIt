import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Headphones,
  Users,
  MessageSquare,
  FileUp,
  Settings,
  Maximize,
  Minimize,
  PhoneOff,
} from 'lucide-react';
import { detectCapabilities } from '../../utils/deviceDetect';

export interface ControlBarProps {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isAudioOnly: boolean;
  isScreenSharing: boolean;
  unreadChatCount: number;
  participantsCount: number;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isFileShareOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleAudioOnly?: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleFileShare: () => void;
  onOpenSettings: () => void;
  onLeaveMeeting: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isAudioMuted,
  isVideoOff,
  isAudioOnly,
  isScreenSharing,
  unreadChatCount,
  participantsCount,
  isChatOpen,
  isParticipantsOpen,
  isFileShareOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleAudioOnly,
  onToggleChat,
  onToggleParticipants,
  onToggleFileShare,
  onOpenSettings,
  onLeaveMeeting,
}) => {
  const { canShareScreen, isIOS } = detectCapabilities();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="w-full bg-surface-950/90 backdrop-blur-xl border-t border-surface-800/80 px-4 py-3 select-none z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">

        {/* Left Section: Audio & Video Core Media Controls */}
        <div className="flex items-center gap-2">
          {/* Microphone */}
          <button
            onClick={onToggleAudio}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-200 border ${
              isAudioMuted
                ? 'bg-accent-rose text-white border-rose-500 shadow-glow-rose'
                : 'bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700/80'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff className="w-4 sm:w-5 h-4 sm:h-5" /> : <Mic className="w-4 sm:w-5 h-4 sm:h-5 text-brand-400" />}
            <span className="text-[10px] sm:text-xs font-semibold hidden sm:inline">
              {isAudioMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Camera */}
          {!isAudioOnly && (
            <button
              onClick={onToggleVideo}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-200 border ${
                isVideoOff
                  ? 'bg-accent-rose text-white border-rose-500 shadow-glow-rose'
                  : 'bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700/80'
              }`}
              title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
            >
              {isVideoOff ? <VideoOff className="w-4 sm:w-5 h-4 sm:h-5" /> : <Video className="w-4 sm:w-5 h-4 sm:h-5 text-brand-400" />}
              <span className="text-[10px] sm:text-xs font-semibold hidden sm:inline">
                {isVideoOff ? 'Start Cam' : 'Stop Cam'}
              </span>
            </button>
          )}

          {/* Audio-only Mode Indicator */}
          {isAudioOnly && (
            <div className="px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs font-medium flex items-center gap-1.5">
              <Headphones className="w-4 h-4" />
              <span className="hidden sm:inline">Audio Only</span>
            </div>
          )}
        </div>

        {/* Center Section: Screen Share & Collaboration Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Screen Share */}
          {canShareScreen ? (
            <button
              onClick={onToggleScreenShare}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-200 border ${
                isScreenSharing
                  ? 'bg-brand-500 text-white border-brand-400 shadow-glow-brand animate-pulse'
                  : 'bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700/80'
              }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            >
              {isScreenSharing ? <MonitorOff className="w-4 sm:w-5 h-4 sm:h-5" /> : <Monitor className="w-4 sm:w-5 h-4 sm:h-5 text-brand-400" />}
              <span className="text-[10px] sm:text-xs font-semibold hidden sm:inline">
                {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              </span>
            </button>
          ) : (
            isIOS && (
              <div
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-[11px] text-surface-400 cursor-help"
                title="iOS Safari does not permit screen capture due to Apple OS limitations. You can view other participants' shared screens in full HD."
              >
                Viewing Mode
              </div>
            )
          )}

          {/* Participants Toggle */}
          <button
            onClick={onToggleParticipants}
            className={`relative p-2.5 rounded-2xl transition-all duration-200 border ${
              isParticipantsOpen
                ? 'bg-brand-500 text-white border-brand-400'
                : 'bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700/80'
            }`}
            title="Participants"
          >
            <Users className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-brand-600 text-white font-bold text-[9px]">
              {participantsCount}
            </span>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={onToggleChat}
            className={`relative p-2.5 rounded-2xl transition-all duration-200 border ${
              isChatOpen
                ? 'bg-brand-500 text-white border-brand-400'
                : 'bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700/80'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-accent-rose text-white font-bold text-[9px] animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* File Share Toggle */}
          <button
            onClick={onToggleFileShare}
            className={`p-2.5 rounded-2xl transition-all duration-200 border ${
              isFileShareOpen
                ? 'bg-brand-500 text-white border-brand-400'
                : 'bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700/80'
            }`}
            title="P2P File Transfer"
          >
            <FileUp className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        {/* Right Section: Settings, Fullscreen & Leave Call */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl bg-surface-900 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/80 transition-colors"
            title="Meeting Settings"
          >
            <Settings className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-surface-900 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/80 transition-colors hidden sm:inline-flex"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 sm:w-5 h-4 sm:h-5" /> : <Maximize className="w-4 sm:w-5 h-4 sm:h-5" />}
          </button>

          {/* Leave Call */}
          <button
            onClick={onLeaveMeeting}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-accent-rose hover:bg-rose-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-500/25 transition-all duration-200 border border-rose-500 active:scale-95"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

      </div>
    </div>
  );
};
