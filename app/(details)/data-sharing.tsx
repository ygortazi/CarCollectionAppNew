import React, { useState } from 'react';
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
  BarChart,
  Mail,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/auth';
import { useSettings } from '../../context/settings';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  colors: any;
}

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  action?: React.ReactNode;
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

const SettingItem: React.FC<SettingItemProps> = ({ 
  icon: Icon, 
  label, 
  description,
  action, 
  colors 
}) => (
  <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
    <View style={styles.settingItemLeft}>
      <Icon size={20} color={colors.text} />
      <View style={styles.settingItemText}>
        <Text style={[styles.settingItemLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.settingItemDescription, { color: colors.secondary }]}>
          {description}
        </Text>
      </View>
    </View>
    {action}
  </View>
);

export default function DataSharingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { settings, updateSettings, isLoading } = useSettings();

  const [analytics, setAnalytics] = useState(settings?.privacy?.dataSharing?.analytics ?? false);
  const [marketing, setMarketing] = useState(settings?.privacy?.dataSharing?.marketing ?? false);
  const [thirdParty, setThirdParty] = useState(settings?.privacy?.dataSharing?.thirdParty ?? false);

  const handleToggle = async (
    setting: 'analytics' | 'marketing' | 'thirdParty',
    value: boolean
  ) => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to change data sharing settings');
      return;
    }
  
    try {
      // Update local state
      switch (setting) {
        case 'analytics':
          setAnalytics(value);
          break;
        case 'marketing':
          setMarketing(value);
          break;
        case 'thirdParty':
          setThirdParty(value);
          break;
      }
  
      // Update both settings context and database
      await updateSettings({
        ...settings,
        privacy: {
          ...settings.privacy,
          dataSharing: {
            ...settings.privacy.dataSharing,
            [setting]: value
          }
        }
      });
  
    } catch (error) {
      // Revert local state on error
      switch (setting) {
        case 'analytics':
          setAnalytics(!value);
          break;
        case 'marketing':
          setMarketing(!value);
          break;
        case 'thirdParty':
          setThirdParty(!value);
          break;
      }
      
      console.error(`Error updating ${setting}:`, error);
      Alert.alert('Error', 'Failed to update data sharing settings. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Data Sharing</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <SettingItem
            icon={BarChart}
            label="Usage Analytics"
            description="Help us improve the app by sharing anonymous usage data"
            action={
              <ToggleSwitch
                enabled={analytics}
                onToggle={(value) => handleToggle('analytics', value)}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Mail}
            label="Marketing Communications"
            description="Receive updates about new features and promotions"
            action={
              <ToggleSwitch
                enabled={marketing}
                onToggle={(value) => handleToggle('marketing', value)}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Share2}
            label="Third-Party Sharing"
            description="Allow data sharing with trusted partners for improved services"
            action={
              <ToggleSwitch
                enabled={thirdParty}
                onToggle={(value) => handleToggle('thirdParty', value)}
                colors={colors}
              />
            }
            colors={colors}
          />
        </View>

        <Text style={[styles.footerText, { color: colors.secondary }]}>
          We value your privacy. You can change these settings at any time. 
          Review our Privacy Policy to learn more about how we handle your data.
        </Text>
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
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 16,
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
  footerText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    lineHeight: 18,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});