import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext';
import { ThemeToggle } from '../../src/components/common/ThemeToggle';

const ThemeTester = () => {
  const { theme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <ThemeToggle />
    </div>
  );
};

describe('Theme System with B&W Support', () => {
  it('allows selecting dark, bw, and light themes directly', () => {
    localStorage.clear();
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('current-theme');
    const bwButton = screen.getByTitle(/Black & White High-Contrast Theme/i);
    const darkButton = screen.getByTitle(/Dark Theme/i);
    const lightButton = screen.getByTitle(/Light Theme/i);

    // Switch to B&W
    fireEvent.click(bwButton);
    expect(themeDisplay.textContent).toBe('bw');

    // Switch to Light
    fireEvent.click(lightButton);
    expect(themeDisplay.textContent).toBe('light');

    // Switch to Dark
    fireEvent.click(darkButton);
    expect(themeDisplay.textContent).toBe('dark');
  });
});
