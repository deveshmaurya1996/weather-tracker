import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { saveItem, getItem } from '../utils/storage';
import Colors from '../constants/Colors';

const THEME_KEY = 'APP_THEME';

type ThemeType = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeType;
  colors: typeof Colors.light;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: Colors.light,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    (async () => {
      const stored = await getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') setTheme(stored);
      else setTheme(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    })();
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await saveItem(THEME_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: Colors[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 