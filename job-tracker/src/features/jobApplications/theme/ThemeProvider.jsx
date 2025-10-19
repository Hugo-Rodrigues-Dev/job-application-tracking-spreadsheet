import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext';

const STORAGE_KEY = 'job-tracker-theme';
const DEFAULT_THEME = 'light';

const resolveInitialTheme = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : DEFAULT_THEME;
};

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.dataset.theme = theme;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setThemeSafe = useCallback((nextTheme) => {
    if (nextTheme === 'light' || nextTheme === 'dark') {
      setTheme(nextTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme: setThemeSafe,
      toggleTheme,
    }),
    [theme, setThemeSafe, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
