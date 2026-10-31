import { describe, it, expect } from 'vitest';
import { getDefaultIceConfiguration } from '../../src/webrtc/iceConfig';

describe('iceConfig', () => {
  it('returns valid RTCConfiguration with Google STUN servers', () => {
    const config = getDefaultIceConfiguration();
    expect(config.iceServers).toBeDefined();
    expect(config.iceServers?.length).toBeGreaterThan(0);
    const hasGoogleStun = config.iceServers?.some(server =>
      Array.isArray(server.urls)
        ? server.urls.some(u => u.includes('stun.l.google.com'))
        : typeof server.urls === 'string' && server.urls.includes('stun.l.google.com')
    );
    expect(hasGoogleStun).toBe(true);
  });

  it('incorporates custom TURN servers if provided', () => {
    const config = getDefaultIceConfiguration({
      turnServers: ['turn:custom.turn.server:3478'],
      turnUsername: 'testuser',
      turnCredential: 'testpassword'
    });

    const turnServer = config.iceServers?.find(s =>
      Array.isArray(s.urls)
        ? s.urls.some(u => u.includes('custom.turn.server'))
        : s.urls === 'turn:custom.turn.server:3478'
    );

    expect(turnServer).toBeDefined();
    expect(turnServer?.username).toBe('testuser');
    expect(turnServer?.credential).toBe('testpassword');
  });
});
