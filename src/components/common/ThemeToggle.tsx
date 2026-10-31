import React from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center ${
        theme === 'bw'
          ? 'bg-black border-white/40 text-white hover:border-white shadow-sm'
          : theme === 'dark'
          ? 'bg-surface-900 border-surface-800 text-amber-400 hover:bg-surface-800'
          : 'bg-surface-100 border-surface-200 text-brand-600 hover:bg-surface-200'
      } ${className || ''}`}
      aria-label="Toggle theme"
      title={`Current: ${theme.toUpperCase()} mode. Click to cycle Dark, B&W, and Light.`}
    >
      {theme === 'bw' ? (
        <Contrast className="w-4 h-4 text-white" />
      ) : theme === 'dark' ? (
        <Moon className="w-4 h-4 text-amber-400" />
      ) : (
        <Sun className="w-4 h-4 text-brand-600" />
      )}
    </button>
  );
};
