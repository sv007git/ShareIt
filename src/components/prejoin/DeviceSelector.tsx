import React from 'react';
import { Mic, Video, Volume2 } from 'lucide-react';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { detectCapabilities } from '../../utils/deviceDetect';

export interface DeviceSelectorProps {
  selectedAudioInput: string;
  selectedVideoInput: string;
  selectedAudioOutput: string;
  onAudioInputChange: (id: string) => void;
  onVideoInputChange: (id: string) => void;
  onAudioOutputChange: (id: string) => void;
  isAudioOnly?: boolean;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  selectedAudioInput,
  selectedVideoInput,
  selectedAudioOutput,
  onAudioInputChange,
  onVideoInputChange,
  onAudioOutputChange,
  isAudioOnly = false,
}) => {
  const { audioInputs, videoInputs, audioOutputs } = useMediaDevices();
  const { canSwitchAudioOutput } = detectCapabilities();

  return (
    <div className="space-y-3 text-left">
      {/* Microphone Selection */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300">
          <Mic className="w-3.5 h-3.5 text-brand-400" />
          <span>Microphone</span>
        </label>
        <select
          value={selectedAudioInput}
          onChange={(e) => onAudioInputChange(e.target.value)}
          className="w-full bg-surface-900 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          {audioInputs.length === 0 ? (
            <option value="">Default Microphone</option>
          ) : (
            audioInputs.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Microphone ${idx + 1}`}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Camera Selection */}
      {!isAudioOnly && (
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300">
            <Video className="w-3.5 h-3.5 text-brand-400" />
            <span>Camera</span>
          </label>
          <select
            value={selectedVideoInput}
            onChange={(e) => onVideoInputChange(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {videoInputs.length === 0 ? (
              <option value="">Default Camera</option>
            ) : (
              videoInputs.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Speaker Output Selection */}
      {canSwitchAudioOutput && audioOutputs.length > 0 && (
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-surface-300">
            <Volume2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Speakers / Headphones</span>
          </label>
          <select
            value={selectedAudioOutput}
            onChange={(e) => onAudioOutputChange(e.target.value)}
            className="w-full bg-surface-900 border border-surface-700/80 rounded-xl px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {audioOutputs.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Speaker ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
