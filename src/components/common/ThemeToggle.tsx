import React from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`flex items-center rounded-xl p-1 border transition-all ${
        theme === 'bw'
          ? 'bg-[#0f0f0f] border-[#27272a]'
          : theme === 'light'
          ? 'bg-slate-100 border-slate-300'
          : 'bg-surface-900 border-surface-700/80'
      } ${className || ''}`}
    >
      {/* Dark Theme Button */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
          theme === 'dark'
            ? 'bg-surface-800 text-amber-400 shadow-sm'
            : 'text-surface-400 hover:text-white'
        }`}
        title="Dark Theme (Classic Blue)"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">Dark</span>
      </button>

      {/* Black & White Monochrome Theme Button */}
      <button
        type="button"
        onClick={() => setTheme('bw')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
          theme === 'bw'
            ? 'bg-white text-black shadow-sm font-bold'
            : 'text-surface-400 hover:text-white'
        }`}
        title="Black & White High-Contrast Theme"
      >
        <Contrast className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">B&W</span>
      </button>

      {/* Light Theme Button */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
          theme === 'light'
            ? 'bg-white text-brand-600 shadow-sm'
            : 'text-surface-400 hover:text-white'
        }`}
        title="Light Theme"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">Light</span>
      </button>
    </div>
  );
};
