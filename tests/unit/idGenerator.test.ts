import { describe, it, expect } from 'vitest';
import { generateRoomId, generatePeerId, sanitizeRoomId } from '../../src/utils/idGenerator';

describe('idGenerator', () => {
  it('generates room ID matching share-xxx-yyy pattern', () => {
    const roomId = generateRoomId();
    expect(roomId).toMatch(/^share-[a-z0-9]{3}-[a-z0-9]{3}$/);
  });

  it('generates unique peer IDs', () => {
    const id1 = generatePeerId();
    const id2 = generatePeerId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^peer-/);
  });

  it('sanitizes input room names properly', () => {
    expect(sanitizeRoomId('  ROOM-123! ')).toBe('room-123');
    expect(sanitizeRoomId('My Meeting Room #4')).toBe('mymeetingroom4');
    expect(sanitizeRoomId('share-abc-def')).toBe('share-abc-def');
  });
});
