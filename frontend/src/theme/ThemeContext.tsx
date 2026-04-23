import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeColors } from './colors';

type ColorSchemeOverride = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeColors;
  colorScheme: 'light' | 'dark';
  colorSchemeOverride: ColorSchemeOverride;
  setColorScheme: (override: ColorSchemeOverride) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_PREFERENCE_KEY = '@pokercircle_theme_preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [colorSchemeOverride, setColorSchemeOverrideState] = useState<ColorSchemeOverride>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference && ['light', 'dark', 'system'].includes(savedPreference)) {
          setColorSchemeOverrideState(savedPreference as ColorSchemeOverride);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
      setIsLoaded(true);
    };

    loadThemePreference();
  }, []);

  const determineColorScheme = (): 'light' | 'dark' => {
    if (colorSchemeOverride === 'system') {
      const scheme = systemColorScheme || Appearance.getColorScheme();
      return scheme === 'dark' ? 'dark' : 'light';
    }
    return colorSchemeOverride;
  };

  const handleSetColorScheme = async (override: ColorSchemeOverride) => {
    setColorSchemeOverrideState(override);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, override);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const colorScheme = determineColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    colorScheme,
    colorSchemeOverride,
    setColorScheme: handleSetColorScheme,
  };

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
