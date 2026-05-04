import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeName = 'classic' | 'parchment';

interface ThemeContextType {
  theme: ThemeName;
  toggleTheme: () => void;
  setTheme: (t: ThemeName) => void;
  isParchment: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'classic',
  toggleTheme: () => {},
  setTheme: () => {},
  isParchment: false,
});

const STORAGE_KEY = 't4c-theme';

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

export const useTheme = () => useContext(ThemeContext);
