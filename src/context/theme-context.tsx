import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage";

type ThemeMode = "light" | "dark";

interface AppGradients {
  background: [string, string];
  surface: [string, string];
  primary: [string, string];
}

export interface AppColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  gradients: AppGradients;
  statusBarStyle: 'light' | 'dark';
}

const lightColors: AppColors = {
  background: '#FFF4F4',
  surface: '#FFFFFF',
  text: '#302C3B',
  textMuted: '#817887',
  border: '#EADFE3',
  primary: '#BDB2FF',
  gradients: {
    background: ['#FEF3FF', '#E7DBF7'],
    surface: ['#EEEAFB', '#FFFFFF'],
    primary: ['#BDB2FF', '#9F91F5'],
  },
  statusBarStyle: 'dark',
};

const darkColors: AppColors = {
  background: '#17151F',
  surface: '#24212E',
  text: '#F7F2F5',
  textMuted: '#B5ACBB',
  border: '#3A3545',
  primary: '#BDB2FF',
  gradients: {
    background: ['#17152A', '#292442'],
    surface: ['#2C253C', '#302B3B'],
    primary: ['#BDB2FF', '#9788E8'],
  },
  statusBarStyle: 'light',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: AppColors;
  isReady: boolean;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);

        if (savedMode === 'light' || savedMode === 'dark') {
          setMode(savedMode);
        }
      } catch (error) {
        console.warn('Unable to load theme preference:', error);
      } finally {
        setIsReady(true);
      }
    }

    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light';

    setMode(nextMode);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, nextMode);
    } catch (error) {
      console.warn('Unable to save theme preference:', error);
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      isReady,
      toggleTheme,
    }),
    [isReady, mode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider.');
  }

  return context;
}