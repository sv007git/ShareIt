import { useEffect, useState, useRef } from 'react';

/**
 * Real-time audio amplitude analyser hook using Web Audio API
 * Returns volume (0 - 100) and isSpeaking flag for active speaker highlighting.
 */
export function useAudioLevel(stream: MediaStream | null, enabled: boolean = true) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !enabled || stream.getAudioTracks().length === 0) {
      setAudioLevel(0);
      setIsSpeaking(false);
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack.enabled) {
      setAudioLevel(0);
      setIsSpeaking(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // Handle suspended audio context (browser autoplay policies)
      if (audioCtx.state === 'suspended') {
        const resumeAudio = () => {
          audioCtx.resume();
          window.removeEventListener('click', resumeAudio);
        };
        window.addEventListener('click', resumeAudio);
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let consecutiveSpeakingCount = 0;

      const updateVolume = () => {
        if (!analyserRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }

        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        setAudioLevel(normalized);

        if (normalized > 14) {
          consecutiveSpeakingCount++;
          if (consecutiveSpeakingCount > 2) {
            setIsSpeaking(true);
          }
        } else {
          consecutiveSpeakingCount = 0;
          setIsSpeaking(false);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn('Web Audio API analyser not supported or blocked:', err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, [stream, enabled]);

  return { audioLevel, isSpeaking };
}
