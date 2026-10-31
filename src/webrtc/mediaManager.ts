/**
 * Media Stream Manager for ShareIt
 * Handles camera, microphone, device enumeration, hot-swapping,
 * and high-definition screen sharing with audio and fallback handling.
 */

export interface MediaConstraintsOptions {
  audioDeviceId?: string;
  videoDeviceId?: string;
  isAudioOnly?: boolean;
  facingMode?: 'user' | 'environment';
  videoQuality?: 'hd' | 'fhd' | 'sd';
}

export class MediaManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private cameraStreamBackup: MediaStream | null = null;
  private isScreenSharing: boolean = false;
  private onScreenShareEndedCallbacks: Array<() => void> = [];

  /**
   * Acquire local camera and microphone stream
   */
  public async getLocalMedia(options: MediaConstraintsOptions = {}): Promise<MediaStream> {
    const {
      audioDeviceId,
      videoDeviceId,
      isAudioOnly = false,
      facingMode = 'user',
      videoQuality = 'hd'
    } = options;

    const audioConstraints: boolean | MediaTrackConstraints = audioDeviceId
      ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

    let videoConstraints: boolean | MediaTrackConstraints = false;

    if (!isAudioOnly) {
      const resolution = {
        sd: { width: 640, height: 480 },
        hd: { width: 1280, height: 720 },
        fhd: { width: 1920, height: 1080 }
      }[videoQuality] || { width: 1280, height: 720 };

      if (videoDeviceId) {
        videoConstraints = {
          deviceId: { exact: videoDeviceId },
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
          frameRate: { ideal: 30 }
        };
      } else {
        videoConstraints = {
          facingMode: { ideal: facingMode },
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
          frameRate: { ideal: 30 }
        };
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints
      });

      this.localStream = stream;
      if (!isAudioOnly) {
        this.cameraStreamBackup = stream.clone();
      }
      return stream;
    } catch (err: any) {
      console.warn('Initial getUserMedia failed, attempting fallback audio-only or relaxed constraints', err);
      // Fallback: relaxed audio + video
      try {
        const relaxedStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: !isAudioOnly
        });
        this.localStream = relaxedStream;
        return relaxedStream;
      } catch (fallbackErr: any) {
        // If still failing, try audio only
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.localStream = audioOnlyStream;
        return audioOnlyStream;
      }
    }
  }

  /**
   * Acquire Screen Sharing stream with optional system/tab audio
   */
  public async startScreenShare(withAudio: boolean = true): Promise<{ screenStream: MediaStream; hasAudio: boolean }> {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      throw new Error('Screen sharing is not supported by your current browser or operating system.');
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
          cursor: 'always'
        } as any,
        audio: withAudio ? {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } : false
      });

      this.screenStream = displayStream;
      this.isScreenSharing = true;

      const videoTrack = displayStream.getVideoTracks()[0];
      const audioTracks = displayStream.getAudioTracks();

      // Listen for when user clicks native "Stop sharing" browser button
      videoTrack.addEventListener('ended', () => {
        this.stopScreenShare();
      });

      return {
        screenStream: displayStream,
        hasAudio: audioTracks.length > 0
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Screen sharing permission was cancelled or denied.');
      }
      throw err;
    }
  }

  /**
   * Stop screen sharing and notify callbacks
   */
  public stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    // Trigger registered callbacks (e.g. restoring camera track in WebRTC peers)
    this.onScreenShareEndedCallbacks.forEach(cb => cb());
  }

  public onScreenShareEnded(cb: () => void): () => void {
    this.onScreenShareEndedCallbacks.push(cb);
    return () => {
      this.onScreenShareEndedCallbacks = this.onScreenShareEndedCallbacks.filter(c => c !== cb);
    };
  }

  public getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Toggle Audio Mute / Unmute
   */
  public toggleAudio(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;

    const newState = enabled !== undefined ? enabled : !audioTrack.enabled;
    audioTrack.enabled = newState;
    return newState;
  }

  /**
   * Toggle Camera Video On / Off
   */
  public toggleVideo(enabled?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    const newState = enabled !== undefined ? enabled : !videoTrack.enabled;
    videoTrack.enabled = newState;
    return newState;
  }

  /**
   * Switch audio input device
   */
  public async switchAudioDevice(deviceId: string): Promise<MediaStreamTrack | null> {
    if (!this.localStream) return null;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      const newTrack = newStream.getAudioTracks()[0];
      const oldTrack = this.localStream.getAudioTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);
      return newTrack;
    } catch (err) {
      console.error('Failed to switch audio input device', err);
      return null;
    }
  }

  /**
   * Switch video camera device
   */
  public async switchVideoDevice(deviceId: string): Promise<MediaStreamTrack | null> {
    if (!this.localStream) return null;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const newTrack = newStream.getVideoTracks()[0];
      const oldTrack = this.localStream.getVideoTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);
      return newTrack;
    } catch (err) {
      console.error('Failed to switch video camera device', err);
      return null;
    }
  }

  /**
   * Enumerate available media devices
   */
  public static async getAvailableDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter(d => d.kind === 'audioinput'),
        videoInputs: devices.filter(d => d.kind === 'videoinput'),
        audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
      };
    } catch (err) {
      console.error('Failed to enumerate devices', err);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }

  /**
   * Clean up all media tracks
   */
  public destroy(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      this.screenStream = null;
    }
    if (this.cameraStreamBackup) {
      this.cameraStreamBackup.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      this.cameraStreamBackup = null;
    }
    this.onScreenShareEndedCallbacks = [];
  }
}
