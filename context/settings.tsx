import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth';
import * as Localization from 'expo-localization';
import { getUserPreferences, updateUserPreferences } from '../services/firestone';
import { Timestamp } from 'firebase/firestore';

const SETTINGS_STORAGE_KEY = '@CarCollection:settings';

export interface UnifiedSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  defaultCollectionView: 'grid' | 'list';
  defaultCatalogView: 'grid' | 'list';
  showPrices: boolean;
  currency: string;
  privacy: {
    dataCollection: boolean;
    activityHistory: boolean;
    biometricAuth: boolean;
    profileVisibility: 'public' | 'friends' | 'private';
    dataSharing: {
      analytics: boolean;
      marketing: boolean;
      thirdParty: boolean;
    };
  };
  notifications: {
    specialOffers: boolean;
    newFeatures: boolean;
    newArrivals: boolean;
    newsletter: boolean;
    securityAlerts: boolean;
    activitySummary: boolean;
  };
  // Make sync required instead of optional
  sync: {
    autoSync: boolean;
    wifiOnly: boolean;
    frequency: number;
    lastSynced: Date | null;
  };
}

export const DEFAULT_SETTINGS: UnifiedSettings = {
  theme: 'light',
  language: Localization.locale.split('-')[0],
  notificationsEnabled: true,
  emailNotificationsEnabled: true,
  defaultCollectionView: 'grid',
  defaultCatalogView: 'grid',
  showPrices: true,
  currency: 'USD',
  privacy: {
    dataCollection: true,
    activityHistory: true,
    biometricAuth: false,
    profileVisibility: 'private',
    dataSharing: {
      analytics: false,
      marketing: false,
      thirdParty: false
    }
  },
  notifications: {
    specialOffers: true,
    newFeatures: true,
    newArrivals: false,
    newsletter: true,
    securityAlerts: true,
    activitySummary: false
  },
  sync: {
    autoSync: true,
    wifiOnly: true,
    frequency: 15,
    lastSynced: null
  }
};

interface SettingsContextType {
  settings: UnifiedSettings;
  updateSettings: (updates: Partial<UnifiedSettings>) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  isLoading: true
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UnifiedSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.language) {
      loadSettings(user.language);
    } else {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async (initialLanguage?: string) => {
    try {
      if (user?.uid) {
        const userPrefs = await getUserPreferences(user.uid);
        if (userPrefs?.preferences) {
          const syncSettings = userPrefs.preferences.sync ? {
            ...userPrefs.preferences.sync,
            lastSynced: userPrefs.preferences.sync.lastSynced instanceof Timestamp 
              ? userPrefs.preferences.sync.lastSynced.toDate()
              : userPrefs.preferences.sync.lastSynced
          } : undefined;

          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            ...userPrefs.preferences,
            sync: syncSettings || DEFAULT_SETTINGS.sync,
            language: initialLanguage || userPrefs.preferences.language || DEFAULT_SETTINGS.language
          };
          
          setSettings(mergedSettings);
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
          return;
        }
      }

      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        const syncSettings = parsedSettings.sync ? {
          ...parsedSettings.sync,
          lastSynced: parsedSettings.sync.lastSynced ? new Date(parsedSettings.sync.lastSynced) : null
        } : DEFAULT_SETTINGS.sync;

        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          sync: syncSettings,
          language: initialLanguage || parsedSettings.language || DEFAULT_SETTINGS.language
        };
        
        setSettings(mergedSettings);
      } else if (initialLanguage) {
        // If no stored settings but we have an initial language, use it
        const newSettings = {
          ...DEFAULT_SETTINGS,
          language: initialLanguage
        };
        setSettings(newSettings);
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
};

  const updateSettings = async (updates: Partial<UnifiedSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

      if (user) {
        await updateUserPreferences(user.uid, {
          preferences: newSettings
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}