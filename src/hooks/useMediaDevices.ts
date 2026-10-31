import { useState, useEffect, useCallback } from 'react';
import { MediaManager } from '../webrtc/mediaManager';

export function useMediaDevices() {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const devices = await MediaManager.getAvailableDevices();
      setAudioInputs(devices.audioInputs);
      setVideoInputs(devices.videoInputs);
      setAudioOutputs(devices.audioOutputs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDevices();

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, [refreshDevices]);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    isLoading,
    refreshDevices
  };
}
