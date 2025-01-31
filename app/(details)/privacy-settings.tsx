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
  UserCircle2,
  History,
  Share,
  Database,
  Fingerprint,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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
    {action || (
      <ChevronRight size={20} color={colors.text} />
    )}
  </TouchableOpacity>
);
export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [dataCollection, setDataCollection] = useState(true);
  const [activityHistory, setActivityHistory] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleNavigation = (screen: string) => {
    Alert.alert(
      'Coming Soon',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <SettingItem
            icon={UserCircle2}
            label="Profile Visibility"
            description="Control who can see your collection"
            onPress={() => handleNavigation('profile-visibility')}
            colors={colors}
          />
          <SettingItem
            icon={Database}
            label="Data Collection"
            description="Improve app experience with usage data"
            action={
              <ToggleSwitch
                enabled={dataCollection}
                onToggle={setDataCollection}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={History}
            label="Activity History"
            description="Save your browsing history"
            action={
              <ToggleSwitch
                enabled={activityHistory}
                onToggle={setActivityHistory}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Fingerprint}
            label="Biometric Authentication"
            description="Use Face ID or fingerprint to secure your account"
            action={
              <ToggleSwitch
                enabled={biometricAuth}
                onToggle={setBiometricAuth}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Share}
            label="Data Sharing"
            description="Manage third-party data sharing preferences"
            onPress={() => handleNavigation('data-sharing')}
            colors={colors}
          />
        </View>

        <Text style={[styles.footerText, { color: colors.secondary }]}>
          Your privacy is important to us. We never sell your personal data to third parties.
          Review our Privacy Policy for more information about how we protect your data.
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
});