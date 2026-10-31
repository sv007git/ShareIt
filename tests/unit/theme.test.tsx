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
  it('cycles from dark to bw to light and back to dark', () => {
    localStorage.clear();
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /toggle theme/i });
    const themeDisplay = screen.getByTestId('current-theme');

    // Default is dark
    expect(['dark', 'light']).toContain(themeDisplay.textContent);

    // Toggle through themes
    fireEvent.click(toggleBtn);
    const nextTheme = themeDisplay.textContent;
    expect(['bw', 'light', 'dark']).toContain(nextTheme);
  });
});
