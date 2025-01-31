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
  Gift,
  Bell,
  Tag,
  ShoppingBag,
  Newspaper,
  Shield,
  Activity,
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
  
  const [specialOffers, setSpecialOffers] = useState(true);
  const [newFeatures, setNewFeatures] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newArrivals, setNewArrivals] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [activitySummary, setActivitySummary] = useState(false);

  const handleUnsubscribeAll = () => {
    Alert.alert(
      'Unsubscribe from All',
      'Are you sure you want to unsubscribe from all email notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unsubscribe All',
          style: 'destructive',
          onPress: () => {
            setSpecialOffers(false);
            setNewFeatures(false);
            setPriceAlerts(false);
            setNewArrivals(false);
            setNewsletter(false);
            setSecurityAlerts(false);
            setActivitySummary(false);
          },
        },
      ]
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Email Preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Choose which emails you'd like to receive. You'll still receive important account-related emails.
          </Text>
        </View>

        <SectionHeader title="PROMOTIONS" colors={colors} />
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <SettingItem
            icon={Gift}
            label="Special Offers"
            description="Discounts and promotional offers"
            action={
              <ToggleSwitch
                enabled={specialOffers}
                onToggle={setSpecialOffers}
                colors={colors}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon={Tag}
            label="Price Alerts"
            description="Notifications about price drops"
            action={
              <ToggleSwitch
                enabled={priceAlerts}
                onToggle={setPriceAlerts}
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
                onToggle={setNewFeatures}
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
                onToggle={setNewArrivals}
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
                onToggle={setNewsletter}
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
                onToggle={setSecurityAlerts}
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
                onToggle={setActivitySummary}
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
            Unsubscribe from all emails
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