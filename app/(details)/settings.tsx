import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Bell,
  Globe,
  FileText,
  Lock,
  HelpCircle,
  Mail,
  Share2,
  Smartphone,
  Moon,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNotifications } from '../../context/notifications';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getUserPreferences, updateUserPreferences } from '../../services/firestone';
import { useSettings, DEFAULT_SETTINGS } from '../../context/settings';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  colors: any;
}

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  action?: React.ReactNode;
  onPress?: () => void;
  colors: any;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle, colors }) => (
  <TouchableOpacity
    onPress={() => onToggle(!enabled)}
    style={[
      styles.toggleContainer,
      {
        backgroundColor: enabled ? colors.primary : colors.surface,
      },
    ]}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.toggleHandle,
        {
          transform: [{ translateX: enabled ? 20 : 2 }],
          backgroundColor: enabled ? '#fff' : colors.secondary,
        },
      ]}
    />
  </TouchableOpacity>
);

const SectionHeader = ({ title, colors }: { title: string; colors: any }) => (
  <Text style={[styles.sectionHeader, { 
    color: colors.secondary,
    backgroundColor: colors.surface 
  }]}>{title}</Text>
);

const SettingItem: React.FC<SettingItemProps> = ({ 
  icon: Icon, 
  label, 
  action, 
  onPress,
  colors 
}) => (
  <TouchableOpacity 
    style={[styles.settingItem, { borderBottomColor: colors.border }]} 
    onPress={onPress} 
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={styles.settingItemLeft}>
      <Icon size={20} color={colors.text} />
      <Text style={[styles.settingItemLabel, { color: colors.text }]}>
        {label}
      </Text>
    </View>
    {action || (
      <ChevronRight size={20} color={colors.text} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const { isEnabled: notificationsEnabled, toggleNotifications } = useNotifications();
  const { t } = useTranslation();
  const { settings } = useSettings();

  const handleNotificationsToggle = async () => {
    try {
        if (!user?.uid) return;

        toggleNotifications(!notificationsEnabled);
        
        await updateUserPreferences(user.uid, {
            preferences: {
                ...settings,
                notificationsEnabled: !notificationsEnabled,
                sync: {
                    autoSync: settings.sync.autoSync,
                    wifiOnly: settings.sync.wifiOnly,
                    frequency: settings.sync.frequency,
                    lastSynced: settings.sync.lastSynced
                }
            }
        });
    } catch (error) {
        console.error('Error updating notification preference:', error);
        Alert.alert(
            'Error',
            'Failed to update notification settings. Please try again.'
        );
        toggleNotifications(notificationsEnabled);
    }
};

const handleDarkModeToggle = async () => {
    try {
        if (!user?.uid) return;

        toggleTheme();
        
        await updateUserPreferences(user.uid, {
            preferences: {
                ...settings,
                theme: isDark ? 'light' : 'dark',
                sync: {
                    autoSync: settings.sync.autoSync,
                    wifiOnly: settings.sync.wifiOnly,
                    frequency: settings.sync.frequency,
                    lastSynced: settings.sync.lastSynced
                }
            }
        });
    } catch (error) {
        console.error('Error updating theme preference:', error);
        Alert.alert(
            'Error',
            'Failed to update theme setting. Please try again.'
        );
        toggleTheme();
    }
};

const handleLanguageChange = async (language: string) => {
    try {
        if (!user?.uid) return;

        await i18next.changeLanguage(language);
        
        await updateUserPreferences(user.uid, {
            preferences: {
                ...settings,
                language: language,
                sync: {
                    autoSync: settings.sync.autoSync,
                    wifiOnly: settings.sync.wifiOnly,
                    frequency: settings.sync.frequency,
                    lastSynced: settings.sync.lastSynced
                }
            }
        });
    } catch (error) {
        console.error('Error updating language preference:', error);
        Alert.alert(
            'Error',
            'Failed to update language setting. Please try again.'
        );
    }
};

  useEffect(() => {
    const loadUserPreferences = async () => {
        if (!user?.uid) return;
        
        try {
            const preferences = await getUserPreferences(user.uid);
            if (preferences?.preferences?.notificationsEnabled !== undefined) {
                toggleNotifications(preferences.preferences.notificationsEnabled);
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    };

    loadUserPreferences();
}, [user?.uid]);

  const handleNavigation = (screen: string) => {
    switch(screen) {
      case 'terms-of-service':
      case 'privacy-policy':
      case 'help-support':
      case 'language':
      case 'privacy-settings':
      case 'email-preferences':
      case 'sync-settings':
        router.push(`/(details)/${screen}`);
        break;
      case 'import':
      case 'export':
        router.push(`/(details)/${screen}`);
        break;
      default:
        Alert.alert(
          'Coming Soon',
          'This feature will be available in a future update.',
          [{ text: 'OK' }]
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { 
        borderBottomColor: colors.border,
        backgroundColor: colors.background 
      }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title={t('settings.preferences')} colors={colors} />
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <SettingItem
            icon={Bell}
            label={t('settings.notifications')}
            action={
              <ToggleSwitch
                enabled={notificationsEnabled}
                onToggle={handleNotificationsToggle}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Moon}
            label={t('settings.darkMode')}
            action={
              <ToggleSwitch
                enabled={isDark}
                onToggle={handleDarkModeToggle}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Globe}
            label="Language"
            onPress={() => handleNavigation('language')}
            colors={colors}
          />
        </View>

        <SectionHeader title="DATA" colors={colors} />
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <SettingItem
            icon={Share2}
            label="Import Collection"
            onPress={() => handleNavigation('import')}
            colors={colors}
          />
          <SettingItem
            icon={Share2}
            label="Export Collection"
            onPress={() => handleNavigation('export')}
            colors={colors}
          />
          <SettingItem
            icon={Smartphone}
            label="Sync Settings"
            onPress={() => handleNavigation('sync-settings')}
            colors={colors}
          />
        </View>

        <SectionHeader title="ACCOUNT" colors={colors} />
        <View style={[styles.section, {
          backgroundColor: colors.background,
          borderColor: colors.border
        }]}>
          <SettingItem
            icon={User}
            label="Change Username or Password"
            onPress={() => router.push('/(details)/change-profile')}
            colors={colors}
          />
          <SettingItem
            icon={Mail}
            label="Notifications and Emails"
            onPress={() => handleNavigation('email-preferences')}
            colors={colors}
          />
          <SettingItem
            icon={Lock}
            label="Privacy Settings"
            onPress={() => handleNavigation('privacy-settings')}
            colors={colors}
          />
        </View>

        <SectionHeader title="ABOUT" colors={colors} />
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <SettingItem
            icon={FileText}
            label="Terms of Service"
            onPress={() => handleNavigation('terms-of-service')}
            colors={colors}
          />
          <SettingItem
            icon={FileText}
            label="Privacy Policy"
            onPress={() => handleNavigation('privacy-policy')}
            colors={colors}
          />
          <SettingItem
            icon={HelpCircle}
            label="Help & Support"
            onPress={() => handleNavigation('help-support')}
            colors={colors}
          />
          <View style={[styles.versionContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.secondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? 16 : 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  toggleContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  versionContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});