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
  Gift,
  Bell,
  ShoppingBag,
  Newspaper,
  Shield,
  Activity,
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/auth';
import { useSettings } from '../../context/settings';
import { updateUserPreferences } from '../../services/firestone';
import { UnifiedSettings } from '../../context/settings';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  colors: any;
}

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
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
  description,
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
      <View style={styles.settingItemText}>
        <Text style={[styles.settingItemLabel, { color: colors.text }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.settingItemDescription, { color: colors.secondary }]}>
            {description}
          </Text>
        )}
      </View>
    </View>
    {action}
  </TouchableOpacity>
);

export default function EmailPreferencesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  // Initialize state from settings
const [specialOffers, setSpecialOffers] = useState(settings.notifications?.specialOffers ?? true);
const [newFeatures, setNewFeatures] = useState(settings.notifications?.newFeatures ?? true);
const [newArrivals, setNewArrivals] = useState(settings.notifications?.newArrivals ?? false);
const [newsletter, setNewsletter] = useState(settings.notifications?.newsletter ?? true);
const [securityAlerts, setSecurityAlerts] = useState(settings.notifications?.securityAlerts ?? true);
const [activitySummary, setActivitySummary] = useState(settings.notifications?.activitySummary ?? false);

const handleToggle = async (
  key: string,
  value: boolean,
  setter: (value: boolean) => void
) => {
  if (!user?.uid) return;

  try {
    setter(value);
    
    // Ensure all notifications values are defined
    const currentNotifications = {
      specialOffers: settings.notifications?.specialOffers ?? true,
      newFeatures: settings.notifications?.newFeatures ?? true,
      newArrivals: settings.notifications?.newArrivals ?? false,
      newsletter: settings.notifications?.newsletter ?? true,
      securityAlerts: settings.notifications?.securityAlerts ?? true,
      activitySummary: settings.notifications?.activitySummary ?? false
    };
    
    // Update for settings context
    const settingsUpdate: Partial<UnifiedSettings> = {
      notifications: {
        ...currentNotifications,
        [key]: value
      }
    };

    // Update for user preferences in database
    const userPrefsUpdate = {
      preferences: {
        ...settings,
        notifications: {
          ...currentNotifications,
          [key]: value
        }
      }
    };

    await updateUserPreferences(user.uid, userPrefsUpdate);
    await updateSettings(settingsUpdate);
  } catch (error) {
    console.error('Error updating notification preference:', error);
    setter(!value);
    Alert.alert(
      'Error',
      'Failed to update notification settings. Please try again.'
    );
  }
};

const handleUnsubscribeAll = () => {
  Alert.alert(
    'Disable All Notifications',
    'Are you sure you want to disable all notifications and emails?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Disable All',
        style: 'destructive',
        onPress: async () => {
          if (!user?.uid) return;

          try {
            const allNotificationsOff = {
              specialOffers: false,
              newFeatures: false,
              newArrivals: false,
              newsletter: false,
              securityAlerts: false,
              activitySummary: false
            } as const; // ensure this is a non-optional type

            // Update for settings context
            const settingsUpdate: Partial<UnifiedSettings> = {
              notifications: allNotificationsOff
            };

            // Update for user preferences in database
            const userPrefsUpdate = {
              preferences: {
                ...settings,
                notifications: allNotificationsOff
              }
            };

            await updateUserPreferences(user.uid, userPrefsUpdate);
            await updateSettings(settingsUpdate);

            setSpecialOffers(false);
            setNewFeatures(false);
            setNewArrivals(false);
            setNewsletter(false);
            setSecurityAlerts(false);
            setActivitySummary(false);
          } catch (error) {
            console.error('Error disabling all notifications:', error);
            Alert.alert(
              'Error',
              'Failed to disable all notifications. Please try again.'
            );
          }
        },
      },
    ]
  );
};

    // Load initial preferences
    useEffect(() => {
      if (settings.notifications) {
        setSpecialOffers(settings.notifications.specialOffers ?? true);
        setNewFeatures(settings.notifications.newFeatures ?? true);
        setNewArrivals(settings.notifications.newArrivals ?? false);
        setNewsletter(settings.notifications.newsletter ?? true);
        setSecurityAlerts(settings.notifications.securityAlerts ?? true);
        setActivitySummary(settings.notifications.activitySummary ?? false);
      }
    }, [settings.notifications]);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Preferences</Text>
        </View>
  
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBox}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Manage your notification and email preferences. You'll still receive important account-related messages.
            </Text>
          </View>
  
          <SectionHeader title="PROMOTIONAL" colors={colors} />
          <View style={[styles.section, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
            <SettingItem
              icon={Gift}
              label="Special Offers"
              description="Discounts and promotional notifications"
              action={
                <ToggleSwitch
                  enabled={specialOffers}
                  onToggle={(value) => handleToggle('specialOffers', value, setSpecialOffers)}
                  colors={colors}
                />
              }
              colors={colors}
            />
          </View>
  
          <SectionHeader title="UPDATES" colors={colors} />
          <View style={[styles.section, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
            <SettingItem
              icon={Bell}
              label="New Features"
              description="App updates and new functionality"
              action={
                <ToggleSwitch
                  enabled={newFeatures}
                  onToggle={(value) => handleToggle('newFeatures', value, setNewFeatures)}
                  colors={colors}
                />
              }
              colors={colors}
            />
            <SettingItem
              icon={ShoppingBag}
              label="New Arrivals"
              description="Latest additions to the catalog"
              action={
                <ToggleSwitch
                  enabled={newArrivals}
                  onToggle={(value) => handleToggle('newArrivals', value, setNewArrivals)}
                  colors={colors}
                />
              }
              colors={colors}
            />
          </View>
  
          <SectionHeader title="GENERAL" colors={colors} />
          <View style={[styles.section, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
            <SettingItem
              icon={Newspaper}
              label="Newsletter"
              description="Monthly collecting tips and community highlights"
              action={
                <ToggleSwitch
                  enabled={newsletter}
                  onToggle={(value) => handleToggle('newsletter', value, setNewsletter)}
                  colors={colors}
                />
              }
              colors={colors}
            />
            <SettingItem
              icon={Shield}
              label="Security Alerts"
              description="Important account security notifications"
              action={
                <ToggleSwitch
                  enabled={securityAlerts}
                  onToggle={(value) => handleToggle('securityAlerts', value, setSecurityAlerts)}
                  colors={colors}
                />
              }
              colors={colors}
            />
            <SettingItem
              icon={Activity}
              label="Activity Summary"
              description="Weekly summary of your collection activity"
              action={
                <ToggleSwitch
                  enabled={activitySummary}
                  onToggle={(value) => handleToggle('activitySummary', value, setActivitySummary)}
                  colors={colors}
                />
              }
              colors={colors}
            />
          </View>
  
          <TouchableOpacity 
            style={styles.unsubscribeButton}
            onPress={handleUnsubscribeAll}
          >
            <Text style={[styles.unsubscribeText, { color: colors.primary }]}>
              Disable all notifications
            </Text>
          </TouchableOpacity>
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
  infoBox: {
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  settingItemDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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
  unsubscribeButton: {
    padding: 16,
    alignItems: 'center',
  },
  unsubscribeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});