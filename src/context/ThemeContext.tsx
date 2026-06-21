import { useState, useEffect, useCallback } from 'react';
import { ThemeContext, STORAGE_KEY, type ThemeName } from './theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'classic' || saved === 'parchment') return saved;
    } catch {/* ignore */}
    return 'classic';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {/* ignore */}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'classic' ? 'parchment' : 'classic'));
  }, []);

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isParchment: theme === 'parchment' }}>
      {children}
    </ThemeContext.Provider>
  );
};
