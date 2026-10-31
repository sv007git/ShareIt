import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration, cn } from '../../src/utils/formatters';

describe('formatters', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(5242880)).toBe('5 MB');
  });

  it('formats call duration correctly', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(45)).toBe('00:45');
    expect(formatDuration(75)).toBe('01:15');
    expect(formatDuration(3665)).toBe('01:01:05');
  });

  it('merges class names correctly with cn helper', () => {
    const result = cn('bg-red-500', 'text-white', false && 'hidden', 'p-4');
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-white');
    expect(result).toContain('p-4');
  });
});
