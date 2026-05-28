import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { defaultTheme, defaultThemeName, Theme, ThemeName, ThemePreference, themes } from './themes';

const STORAGE_KEY = 'agendia.themePreference';

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  themePreference: ThemePreference;
  setThemePreference: (nextPreference: ThemePreference) => Promise<void>;
  availableThemes: ThemeName[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemePreference = (value: string | null): value is ThemePreference => {
  return value === 'system' || value === 'light' || value === 'dark' || value === 'purple' || value === 'green';
};

const resolveThemeName = (preference: ThemePreference, systemScheme: ReturnType<typeof useColorScheme>): ThemeName => {
  if (preference !== 'system') {
    return preference;
  }

  return systemScheme === 'dark' ? 'dark' : defaultThemeName;
};

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedPreference) => {
        if (isMounted && isThemePreference(storedPreference)) {
          setThemePreferenceState(storedPreference);
        }
      })
      .catch((error) => {
        console.warn('[ThemeProvider] Failed to restore theme preference:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemePreference = useCallback(async (nextPreference: ThemePreference) => {
    setThemePreferenceState(nextPreference);
    await AsyncStorage.setItem(STORAGE_KEY, nextPreference);
  }, []);

  const themeName = resolveThemeName(themePreference, systemScheme);
  const theme = themes[themeName] ?? defaultTheme;

  const value = useMemo(
    () => ({
      theme,
      themeName,
      themePreference,
      setThemePreference,
      availableThemes: Object.keys(themes) as ThemeName[],
    }),
    [setThemePreference, theme, themeName, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

