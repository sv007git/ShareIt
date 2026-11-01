import React, { useState, useEffect, useRef } from 'react';
import { Mic, Video, Volume2, Globe, Shield, Bell } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';
import { AudioMeter } from '../prejoin/AudioMeter';
import { useAudioLevel } from '../../hooks/useAudioLevel';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { useSettings } from '../../contexts/SettingsContext';
import { detectCapabilities } from '../../utils/deviceDetect';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraChange?: (deviceId: string) => void;
  onMicChange?: (deviceId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onCameraChange,
  onMicChange,
}) => {
  const { settings, updateSettings } = useSettings();
  const { audioInputs, videoInputs, audioOutputs } = useMediaDevices();
  const { canSwitchAudioOutput } = detectCapabilities();

  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'general' | 'network'>('audio');

  // Audio / Video preview stream for settings testing
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const { audioLevel } = useAudioLevel(testStream, true);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    if (isOpen) {
      navigator.mediaDevices?.getUserMedia({
        audio: settings.audioInputId ? { deviceId: { exact: settings.audioInputId } } : true,
        video: settings.videoInputId ? { deviceId: { exact: settings.videoInputId } } : true,
      }).then((s) => {
        if (active) {
          stream = s;
          setTestStream(s);
          if (testVideoRef.current) {
            testVideoRef.current.srcObject = s;
          }
        } else {
          s.getTracks().forEach(t => t.stop());
        }
      }).catch(err => {
        console.warn('Could not acquire settings test stream', err);
      });
    }

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, settings.audioInputId, settings.videoInputId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Settings"
      description="Configure your audio, video, network and conferencing preferences"
      maxWidth="lg"
    >
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-surface-800 gap-1 mb-5">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'audio'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-surface-400 hover:text-surface-100'
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> Audio
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'video'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-surface-400 hover:text-surface-100'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> Video
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-surface-400 hover:text-surface-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> General
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'network'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-surface-400 hover:text-surface-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Network & ICE
        </button>
      </div>

      {/* Tab: Audio */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-surface-300">Microphone</label>
            <select
              value={settings.audioInputId}
              onChange={(e) => {
                updateSettings({ audioInputId: e.target.value });
                onMicChange?.(e.target.value);
              }}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500"
            >
              {audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Test meter */}
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-surface-300">Microphone Input Level</label>
            <AudioMeter level={audioLevel} />
          </div>

          {canSwitchAudioOutput && audioOutputs.length > 0 && (
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-surface-300">Speaker / Headphones Output</label>
              <select
                value={settings.audioOutputId}
                onChange={(e) => updateSettings({ audioOutputId: e.target.value })}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500"
              >
                {audioOutputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tab: Video */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-surface-300">Camera Source</label>
            <select
              value={settings.videoInputId}
              onChange={(e) => {
                updateSettings({ videoInputId: e.target.value });
                onCameraChange?.(e.target.value);
              }}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500"
            >
              {videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview Box */}
          <div className="relative aspect-video w-full rounded-xl bg-surface-950 border border-surface-800 overflow-hidden">
            <video
              ref={testVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${settings.mirrorSelfVideo ? 'scale-x-[-1]' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-300">Sending Quality</label>
              <select
                value={settings.videoQuality}
                onChange={(e) => updateSettings({ videoQuality: e.target.value as any })}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500"
              >
                <option value="hd">HD (720p 30fps) - Recommended</option>
                <option value="fhd">Full HD (1080p 30fps)</option>
                <option value="sd">SD (480p) - Low Bandwidth</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-950 rounded-xl border border-surface-800 self-end">
              <span className="text-xs font-medium text-surface-200">Mirror My Video</span>
              <input
                type="checkbox"
                checked={settings.mirrorSelfVideo}
                onChange={(e) => updateSettings({ mirrorSelfVideo: e.target.checked })}
                className="w-4 h-4 accent-brand-500 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="space-y-4 text-left">
          <Input
            label="Default Display Name"
            value={settings.displayName}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            placeholder="Alex Hunter"
          />

          {/* Theme / Appearance Selection */}
          <div className="flex items-center justify-between p-3.5 bg-surface-950 rounded-xl border border-surface-800">
            <div>
              <p className="text-xs font-semibold text-surface-200">Theme Appearance</p>
              <p className="text-[11px] text-surface-400">Choose between Classic Dark, B&W Monochrome, or Light</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-surface-950 rounded-xl border border-surface-800">
            <div>
              <p className="text-xs font-semibold text-surface-200">In-meeting Sound Notifications</p>
              <p className="text-[11px] text-surface-400">Play subtle chime when someone sends a message</p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundNotifications}
              onChange={(e) => updateSettings({ soundNotifications: e.target.checked })}
              className="w-4 h-4 accent-brand-500 rounded"
            />
          </div>
        </div>
      )}

      {/* Tab: Network & ICE */}
      {activeTab === 'network' && (
        <div className="space-y-4 text-left">
          <Input
            label="WebSocket Signaling Server URL"
            value={settings.signalingUrl}
            onChange={(e) => updateSettings({ signalingUrl: e.target.value })}
            placeholder="wss://shareit-signaling.workers.dev or ws://localhost:8080"
            helperText="Leave empty to use automatic local broadcast fallback."
          />

          <Input
            label="STUN Servers (Comma-separated)"
            value={settings.customStunServers}
            onChange={(e) => updateSettings({ customStunServers: e.target.value })}
            placeholder="stun:stun.l.google.com:19302"
          />

          <Input
            label="TURN Server URLs (Optional relay)"
            value={settings.customTurnServers}
            onChange={(e) => updateSettings({ customTurnServers: e.target.value })}
            placeholder="turn:turn.example.com:3478"
            helperText="Used to bypass strict symmetric corporate NATs."
          />
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-surface-800 flex justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
};
