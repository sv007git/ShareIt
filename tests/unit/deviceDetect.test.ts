import { describe, it, expect } from 'vitest';
import { detectCapabilities } from '../../src/utils/deviceDetect';

describe('deviceDetect', () => {
  it('returns valid capabilities object in browser environment', () => {
    const caps = detectCapabilities();
    expect(caps).toHaveProperty('isMobile');
    expect(caps).toHaveProperty('isIOS');
    expect(caps).toHaveProperty('isAndroid');
    expect(caps).toHaveProperty('canShareScreen');
    expect(caps).toHaveProperty('canSwitchAudioOutput');
    expect(caps).toHaveProperty('browserName');
  });
});
