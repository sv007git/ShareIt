import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all duration-200 border ${
        theme === 'dark'
          ? 'bg-surface-900 border-surface-800 text-amber-400 hover:bg-surface-800'
          : 'bg-surface-100 border-surface-200 text-brand-600 hover:bg-surface-200'
      } ${className || ''}`}
      aria-label="Toggle dark/light theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
