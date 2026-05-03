import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeName = 'classic' | 'parchment';

interface ThemeContextType {
  theme: ThemeName;
  toggleTheme: () => void;
  isParchment: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'classic',
  toggleTheme: () => {},
  isParchment: false,
});

const STORAGE_KEY = 't4c-theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'classic' || saved === 'parchment') return saved;
    } catch {}
    return 'classic';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'classic' ? 'parchment' : 'classic'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isParchment: theme === 'parchment' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
