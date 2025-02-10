import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth';
import { updateUserPreferences, getUserPreferences } from '../services/firestone';
import { useSettings } from './settings';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@CarCollection:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('light');
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();

  // Load saved theme preference on startup
  useEffect(() => {
    loadThemePreference();
  }, [user?.uid]);

  const loadThemePreference = async () => {
    try {
      // First try to get theme from Firebase if user is logged in
      if (user?.uid) {
        const userPrefs = await getUserPreferences(user.uid);
        if (userPrefs?.preferences?.theme && userPrefs.preferences.theme !== 'system') {
          const firebaseTheme = userPrefs.preferences.theme as ThemeType;
          setTheme(firebaseTheme);
          await updateSettings({ theme: firebaseTheme });
          await AsyncStorage.setItem(THEME_STORAGE_KEY, firebaseTheme);
          return;
        }
      }

      // Fallback to local storage if no Firebase data or user not logged in
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
        await updateSettings({ theme: savedTheme as ThemeType });
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  // In theme.tsx
const toggleTheme = async () => {
  try {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Update local state immediately for UI responsiveness
    setTheme(newTheme);
    
    // Update settings context
    await updateSettings({ theme: newTheme });
    
    // Update local storage
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Update Firebase if user is logged in
    if (user?.uid) {
      await updateUserPreferences(user.uid, {
        preferences: {
          ...settings, // Spread existing settings first
          theme: newTheme
        }
      });
    }
  } catch (error) {
    console.error('Error saving theme preference:', error);
    // Revert to previous theme if there was an error
    setTheme(theme);
    await updateSettings({ theme });
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        toggleTheme,
        isDark: theme === 'dark'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}