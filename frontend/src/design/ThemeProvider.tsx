import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('phishyou-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const setTheme = (next: Theme) => { setThemeState(next); localStorage.setItem('phishyou-theme', next); };
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useTheme must be used inside ThemeProvider'); return value; }
