// context/language.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import i18n from '../i18n';
import { LANGUAGES } from '../constants/Languages';
import { useSettings } from './settings';
import { useAuth } from './auth';
import { updateUserPreferences } from '../services/firestone';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => Promise<void>; // Make this async
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [language, setLanguageState] = useState(settings.language || Localization.locale.split('-')[0]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);

  const setLanguage = async (code: string) => {
    try {
      // Update i18n
      i18n.changeLanguage(code);
      
      // Update local state
      setLanguageState(code);
      
      // Update settings context
      await updateSettings({ language: code });

      // Update Firebase if user is logged in
      if (user?.uid) {
        await updateUserPreferences(user.uid, {
          preferences: {
            ...settings,
            language: code
          }
        });
      }
    } catch (error) {
      console.error('Error updating language:', error);
      // Revert changes on error
      i18n.changeLanguage(language);
      setLanguageState(language);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);