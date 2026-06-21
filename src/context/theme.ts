import { createContext, useContext } from 'react';

export type ThemeName = 'classic' | 'parchment';

export interface ThemeContextType {
  theme: ThemeName;
  toggleTheme: () => void;
  setTheme: (t: ThemeName) => void;
  isParchment: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'classic',
  toggleTheme: () => {},
  setTheme: () => {},
  isParchment: false,
});

export const STORAGE_KEY = 't4c-theme';

export const useTheme = () => useContext(ThemeContext);
