import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useSettings } from './settings';
import { updateUserPreferences } from '../services/firestone';
import { useAuth } from './auth';

interface NotificationsContextType {
  isEnabled: boolean;
  toggleNotifications: (value: boolean) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  isEnabled: false,
  toggleNotifications: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(settings.notificationsEnabled);

  // Set up notifications when enabled state changes
  useEffect(() => {
    async function updateNotificationSettings() {
      if (isEnabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });
        } else {
          // If permission denied, update settings to reflect this
          setIsEnabled(false);
          if (user?.uid) {
            await updateUserPreferences(user.uid, {
              preferences: {
                currency: settings.currency,
                defaultCatalogView: settings.defaultCatalogView,
                defaultCollectionView: settings.defaultCollectionView,
                emailNotificationsEnabled: false,
                notificationsEnabled: false,
                language: settings.language,
                showPrices: settings.showPrices,
                theme: settings.theme
              }
            });
          }
          await updateSettings({ 
            notificationsEnabled: false,
            emailNotificationsEnabled: false 
          });
        }
      } else {
        await Notifications.setNotificationHandler(null);
      }
    }

    updateNotificationSettings();
  }, [isEnabled, user?.uid]);

 // In notifications.tsx
const toggleNotifications = async (value: boolean) => {
  try {
    setIsEnabled(value);
    
    // Update settings context
    await updateSettings({
      notificationsEnabled: value,
      ...(value === false && { emailNotificationsEnabled: false })
    });
    
    // Update Firebase if user is logged in
    if (user?.uid) {
      await updateUserPreferences(user.uid, {
        preferences: {
          ...settings, // Spread existing settings first
          notificationsEnabled: value,
          emailNotificationsEnabled: value ? settings.emailNotificationsEnabled : false
        }
      });
    }
  } catch (error) {
    console.error('Error toggling notifications:', error);
    // Revert state if update fails
    setIsEnabled(!value);
    await updateSettings({ 
      notificationsEnabled: !value,
      ...(value && { emailNotificationsEnabled: settings.emailNotificationsEnabled })
    });
  }
};

  return (
    <NotificationsContext.Provider value={{
      isEnabled,
      toggleNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);