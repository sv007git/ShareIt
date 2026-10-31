/**
 * Device and browser capability detection utilities
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canShareScreen: boolean;
  canSwitchAudioOutput: boolean;
  hasWebRTC: boolean;
  browserName: string;
}

export function detectCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      canShareScreen: false,
      canSwitchAudioOutput: false,
      hasWebRTC: false,
      browserName: 'unknown'
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi|Tablet/.test(ua);

  // Check WebRTC support
  const hasWebRTC = !!(
    window.RTCPeerConnection &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );

  // Check Screen Sharing capability
  // getDisplayMedia is generally not supported on mobile Safari or restricted
  const canShareScreen = !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
    !isIOS // iOS Safari does not support getDisplayMedia
  );

  // Check speaker selection support (setSinkId on HTMLMediaElement)
  const canSwitchAudioOutput = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;

  let browserName = 'Browser';
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) browserName = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browserName = 'Safari';
  else if (/Firefox/.test(ua)) browserName = 'Firefox';
  else if (/Edg/.test(ua)) browserName = 'Edge';

  return {
    isMobile,
    isIOS,
    isAndroid,
    canShareScreen,
    canSwitchAudioOutput,
    hasWebRTC,
    browserName
  };
}
