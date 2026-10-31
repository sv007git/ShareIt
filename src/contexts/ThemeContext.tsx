import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'bw';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('shareit_theme') as Theme;
    if (saved === 'dark' || saved === 'light' || saved === 'bw') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'theme-bw');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'bw') {
      root.classList.add('dark', 'theme-bw');
    } else {
      root.classList.add('light');
    }
    localStorage.setItem('shareit_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'bw';
      if (prev === 'bw') return 'light';
      return 'dark';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
