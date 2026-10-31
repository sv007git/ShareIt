import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { AudioMeter } from '../../src/components/prejoin/AudioMeter';

describe('Common Components', () => {
  it('renders Button with text and handles loading state', () => {
    const { rerender } = render(<Button>Start Sharing</Button>);
    expect(screen.getByText('Start Sharing')).toBeTruthy();

    rerender(<Button isLoading>Start Sharing</Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('renders Badge with correct variant', () => {
    render(<Badge variant="brand">Encrypted P2P</Badge>);
    expect(screen.getByText('Encrypted P2P')).toBeTruthy();
  });

  it('renders AudioMeter with visual bars and level display', () => {
    const { rerender } = render(<AudioMeter level={45} />);
    expect(screen.getByText('45%')).toBeTruthy();

    rerender(<AudioMeter level={0} isMuted={true} />);
    expect(screen.getByText('Muted')).toBeTruthy();
  });
});
