import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Settings, Copy, Check, Users, Shield, Headphones } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { AudioMeter } from './AudioMeter';
import { DeviceSelector } from './DeviceSelector';
import { useAudioLevel } from '../../hooks/useAudioLevel';
import { useSettings } from '../../contexts/SettingsContext';

export interface GreenRoomProps {
  roomId: string;
  onJoin: (options: {
    displayName: string;
    isAudioOnly: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => void;
  onCancel: () => void;
}

export const GreenRoom: React.FC<GreenRoomProps> = ({ roomId, onJoin, onCancel }) => {
  const { settings, updateSettings } = useSettings();
  const [displayName, setDisplayName] = useState(settings.displayName || '');
  const [isAudioOnly, setIsAudioOnly] = useState(settings.isAudioOnlyDefault || false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Preview MediaStream
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { audioLevel } = useAudioLevel(previewStream, !isMicMuted);

  // Acquire local preview stream
  useEffect(() => {
    let active = true;
    let streamInstance: MediaStream | null = null;

    async function initPreview() {
      setDeviceError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: settings.audioInputId ? { deviceId: { exact: settings.audioInputId } } : true,
          video: !isAudioOnly
            ? (settings.videoInputId ? { deviceId: { exact: settings.videoInputId } } : true)
            : false,
        });

        if (active) {
          streamInstance = stream;
          setPreviewStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else {
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (err: any) {
        if (active) {
          console.warn('Could not acquire green room preview', err);
          setDeviceError('Camera or microphone permission was not granted. You can still join in audio-only or listen mode.');
        }
      }
    }

    initPreview();

    return () => {
      active = false;
      if (streamInstance) {
        streamInstance.getTracks().forEach(t => t.stop());
      }
    };
  }, [isAudioOnly, settings.audioInputId, settings.videoInputId]);

  // Toggle mic
  const handleToggleMic = () => {
    if (previewStream) {
      const audioTrack = previewStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMicMuted;
        setIsMicMuted(!isMicMuted);
      }
    }
  };

  // Toggle camera
  const handleToggleVideo = () => {
    if (previewStream && !isAudioOnly) {
      const videoTrack = previewStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoMuted;
        setIsVideoMuted(!isVideoMuted);
      }
    }
  };

  const handleCopyLink = () => {
    const inviteUrl = window.location.href;
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      updateSettings({ displayName: displayName.trim() });
    }
    // Stop local preview stream tracks before joining the room (room manager will acquire call stream)
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop());
    }

    onJoin({
      displayName: displayName.trim() || `User-${Math.floor(1000 + Math.random() * 9000)}`,
      isAudioOnly,
      audioDeviceId: settings.audioInputId || undefined,
      videoDeviceId: settings.videoInputId || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4 sm:p-6 text-surface-100">
      <div className="w-full max-w-4xl bg-surface-900 border border-surface-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Ready to join?</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-surface-400">Room:</span>
                <span className="text-xs font-mono font-semibold text-brand-400">{roomId}</span>
                <Badge variant="brand" size="sm">
                  <Shield className="w-3 h-3 text-brand-400" />
                  <span>Encrypted P2P</span>
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyLink}
            >
              {isCopied ? 'Link Copied!' : 'Copy Invite Link'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Exit
            </Button>
          </div>
        </div>

        {/* Green room body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">

          {/* Left Column: Video Preview and Floating Controls */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-video w-full rounded-2xl bg-surface-950 border border-surface-800 overflow-hidden flex items-center justify-center shadow-inner group">
              {!isAudioOnly && !isVideoMuted && previewStream?.getVideoTracks()[0]?.enabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${settings.mirrorSelfVideo ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-surface-400">
                  <div className="w-20 h-20 rounded-full bg-surface-800/80 border border-surface-700/60 flex items-center justify-center shadow-lg">
                    {isAudioOnly ? (
                      <Headphones className="w-8 h-8 text-brand-400 animate-pulse" />
                    ) : (
                      <VideoOff className="w-8 h-8 text-surface-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-surface-300">
                    {isAudioOnly ? 'Audio-Only Mode Enabled' : 'Camera is Turned Off'}
                  </p>
                </div>
              )}

              {/* In-Preview bottom bar */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none">
                {/* Audio visualizer */}
                <div className="pointer-events-auto">
                  <AudioMeter level={audioLevel} isMuted={isMicMuted} />
                </div>

                {/* Quick Toggle Controls */}
                <div className="flex items-center gap-2 pointer-events-auto bg-surface-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-surface-800">
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isMicMuted
                        ? 'bg-accent-rose text-white hover:bg-rose-600'
                        : 'bg-surface-800 text-surface-200 hover:text-white hover:bg-surface-700'
                    }`}
                    title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {!isAudioOnly && (
                    <button
                      type="button"
                      onClick={handleToggleVideo}
                      className={`p-2.5 rounded-xl transition-colors ${
                        isVideoMuted
                          ? 'bg-accent-rose text-white hover:bg-rose-600'
                          : 'bg-surface-800 text-surface-200 hover:text-white hover:bg-surface-700'
                      }`}
                      title={isVideoMuted ? 'Start camera' : 'Stop camera'}
                    >
                      {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2.5 rounded-xl transition-colors ${
                      showSettings
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface-800 text-surface-200 hover:text-white hover:bg-surface-700'
                    }`}
                    title="Audio and video device settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {deviceError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                {deviceError}
              </div>
            )}
          </div>

          {/* Right Column: Name, Audio-only preference, Device settings, Join Action */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Your Name / Display Name"
                placeholder="e.g. Alex Hunter"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                required
                helperText="Other participants in this room will see this name."
              />

              {/* Mode switch */}
              <div className="p-4 bg-surface-950/60 rounded-2xl border border-surface-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-semibold text-surface-200">Audio-Only Call</span>
                    <p className="text-[11px] text-surface-400">Join without camera to save bandwidth and CPU</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAudioOnly}
                    onChange={(e) => setIsAudioOnly(e.target.checked)}
                    className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Device Selector Expandable Area */}
              {showSettings && (
                <div className="p-4 bg-surface-950/90 rounded-2xl border border-brand-500/30 animate-fade-in">
                  <h4 className="text-xs font-bold text-surface-200 mb-3 uppercase tracking-wider">Device Settings</h4>
                  <DeviceSelector
                    selectedAudioInput={settings.audioInputId}
                    selectedVideoInput={settings.videoInputId}
                    selectedAudioOutput={settings.audioOutputId}
                    onAudioInputChange={(id) => updateSettings({ audioInputId: id })}
                    onVideoInputChange={(id) => updateSettings({ videoInputId: id })}
                    onAudioOutputChange={(id) => updateSettings({ audioOutputId: id })}
                    isAudioOnly={isAudioOnly}
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-semibold py-3.5 shadow-brand-500/30 shadow-xl"
                >
                  Join Meeting Now
                </Button>
              </div>
            </form>

            <div className="text-center text-xs text-surface-500 border-t border-surface-800/80 pt-4">
              By joining, you agree to grant browser permissions for microphone and camera when in use. No registration or installation required.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
