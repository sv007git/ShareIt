/**
 * Generates unique, memorable IDs for ShareIt rooms and peers
 */

export function generateRoomId(): string {
  // Generates formats like: share-8f2-x9k
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `share-${part1}-${part2}`;
}

export function generatePeerId(): string {
  return `peer-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

export function sanitizeRoomId(input: string): string {
  // Normalize room string to lowercase alphanumeric and hyphens
  return input.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}
