import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth';
import { useSettings } from './settings';
import { updateUserPreferences, getUserPreferences } from '../services/firestone';
import { UnifiedSettings } from './settings';
import { Timestamp } from 'firebase/firestore';
import { Text } from 'react-native';

const SYNC_STORAGE_KEY = '@CarCollection:syncSettings';

interface SyncSettings {
  autoSync: boolean;
  wifiOnly: boolean;
  frequency: number;
  lastSynced: Date | null;
}

interface SyncContextType {
  syncSettings: SyncSettings;
  updateSyncSettings: (updates: Partial<SyncSettings>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSync: true,
  wifiOnly: true,
  frequency: 15,
  lastSynced: null
};

const SyncContext = createContext<SyncContextType>({
  syncSettings: DEFAULT_SYNC_SETTINGS,
  updateSyncSettings: async () => {},
  isLoading: true
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    if (user?.uid) {
      loadSyncSettings();
    }
  }, [user?.uid]);

  const loadSyncSettings = async () => {
    try {
      if (user?.uid) {
        const userPrefs = await getUserPreferences(user.uid);
        if (userPrefs?.preferences?.sync) {
          const lastSynced = userPrefs.preferences.sync.lastSynced instanceof Timestamp
            ? userPrefs.preferences.sync.lastSynced.toDate()
            : userPrefs.preferences.sync.lastSynced instanceof Date
              ? userPrefs.preferences.sync.lastSynced
              : null;

          const loadedSettings = {
            ...DEFAULT_SYNC_SETTINGS,
            ...userPrefs.preferences.sync,
            lastSynced
          };

          setSyncSettings(loadedSettings);

          // Store in AsyncStorage with date as ISO string
          await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({
            ...loadedSettings,
            lastSynced: lastSynced?.toISOString()
          }));
          return;
        }
      }

      // Try loading from AsyncStorage
      const storedSettings = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSyncSettings({
          ...DEFAULT_SYNC_SETTINGS,
          ...parsedSettings,
          lastSynced: parsedSettings.lastSynced ? new Date(parsedSettings.lastSynced) : null
        });
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSyncSettings = async (updates: Partial<SyncSettings>) => {
    try {
      const newSyncSettings = {
        ...syncSettings,
        ...updates,
        lastSynced: updates.lastSynced instanceof Date ? updates.lastSynced : syncSettings.lastSynced
      };

      setSyncSettings(newSyncSettings);

      // Save to AsyncStorage with date as ISO string
      await AsyncStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({
        ...newSyncSettings,
        lastSynced: newSyncSettings.lastSynced?.toISOString()
      }));

      // Sync with Firestore if user is logged in
      if (user?.uid) {
        await updateUserPreferences(user.uid, {
          preferences: {
            ...settings,
            sync: {
              ...newSyncSettings,
              lastSynced: newSyncSettings.lastSynced
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating sync settings:', error);
      throw error;
    }
  };

  return (
    <SyncContext.Provider value={{ syncSettings, updateSyncSettings, isLoading }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSyncSettings = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncSettings must be used within a SyncProvider');
  }
  return context;
};