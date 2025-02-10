import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Wifi,
  Battery,
  Cloud,
  RefreshCw,
  Database,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { useSyncSettings } from '../../context/sync';
import { Timestamp } from 'firebase/firestore';

interface SyncState {
  lastSynced: Date | null;
  isSyncing: boolean;
  error: string | null;
  storage: number;
  frequency: number;
  batteryUsage: 'Low' | 'Medium' | 'High';
  batteryImpact: number;
  storageDetails: {
    images: number;
    metadata: number;
    total: number;
  };
}

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  colors: any;
}

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  value?: string;
  action?: React.ReactNode;
  onPress?: () => void;
  colors: any;
}

interface ApiError {
  message: string;
}

const api = {
  syncCollection: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    return Promise.resolve();
  },
  getSyncStorageStats: async () => {
    return Promise.resolve({
      images: 5242880, // 5MB
      metadata: 1048576, // 1MB
      total: 6291456 // 6MB
    });
  },
  getSyncBatteryImpact: async () => {
    return Promise.resolve(3); // Low impact
  },
  clearSyncData: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  }
};

const formatRelativeTime = (date: Date | null): string => {
  if (!date) return 'Not synced yet';
  
  const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle, colors }) => (
  <TouchableOpacity
    onPress={() => onToggle(!enabled)}
    style={[styles.toggleContainer, { backgroundColor: enabled ? colors.primary : colors.surface }]}
    activeOpacity={0.7}
  >
    <View style={[styles.toggleHandle, {
      transform: [{ translateX: enabled ? 20 : 2 }],
      backgroundColor: enabled ? '#fff' : colors.secondary,
    }]} />
  </TouchableOpacity>
);

const SectionHeader = ({ title, colors }: { title: string; colors: any }) => (
  <Text style={[styles.sectionHeader, { color: colors.secondary, backgroundColor: colors.surface }]}>
    {title}
  </Text>
);

const SettingItem: React.FC<SettingItemProps> = ({ 
  icon: Icon, 
  label, 
  description,
  value,
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
        <Text style={[styles.settingItemLabel, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingItemDescription, { color: colors.secondary }]}>
            {description}
          </Text>
        )}
      </View>
    </View>
    {value ? (
      <Text style={[styles.settingItemValue, { color: colors.secondary }]}>{value}</Text>
    ) : action}
  </TouchableOpacity>
);

const isConnectedToWifi = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.type === NetInfoStateType.wifi;
};

export default function SyncSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { t } = useTranslation();
  
  const { syncSettings, updateSyncSettings } = useSyncSettings();
  const [syncState, setSyncState] = useState<SyncState>({
    lastSynced: syncSettings.lastSynced instanceof Timestamp 
      ? syncSettings.lastSynced.toDate() 
      : syncSettings.lastSynced instanceof Date
        ? syncSettings.lastSynced
        : null,
    isSyncing: false,
    error: null,
    storage: 0,
    frequency: syncSettings.frequency,
    batteryUsage: 'Low',
    batteryImpact: 0,
    storageDetails: {
      images: 0,
      metadata: 0,
      total: 0
    }
  });

  // Update the toggle handlers
  const handleAutoSyncToggle = async (value: boolean) => {
    try {
      await updateSyncSettings({ autoSync: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-sync setting');
    }
  };

  const handleWifiOnlyToggle = async (value: boolean) => {
    try {
      await updateSyncSettings({ wifiOnly: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update WiFi-only setting');
    }
  };

  // Update the sync function
  const syncCollection = async () => {
    if (syncSettings.wifiOnly) {
      const isWifi = await isConnectedToWifi();
      if (!isWifi) {
        Alert.alert(t('errors.wifiRequired'), t('errors.pleaseConnectWifi'));
        return;
      }
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      await api.syncCollection();
      const now = new Date();
      await updateSyncSettings({ lastSynced: now });
      setSyncState(prev => ({ ...prev, lastSynced: now, isSyncing: false }));
    } catch (error) {
      const apiError = error as ApiError;
      setSyncState(prev => ({ ...prev, error: apiError.message, isSyncing: false }));
      Alert.alert(t('errors.syncFailed'), apiError.message);
    }
  };

  const resetSync = async () => {
    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      await api.clearSyncData();
      
      // Reset state
      setSyncState({
        lastSynced: null,
        isSyncing: false,
        error: null,
        storage: 0,
        frequency: syncSettings.frequency,
        batteryUsage: 'Low',
        batteryImpact: 0,
        storageDetails: {
          images: 0,
          metadata: 0,
          total: 0
        }
      });

      // Reset sync settings
      await updateSyncSettings({
        lastSynced: null
      });

      // Perform new sync
      await syncCollection();
    } catch (error) {
      const apiError = error as ApiError;
      setSyncState(prev => ({ ...prev, error: apiError.message, isSyncing: false }));
      Alert.alert(t('errors.resetFailed'), apiError.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Sync Settings')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusRow}>
            <CheckCircle2 size={20} color={syncState.error ? '#FF4444' : colors.primary} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {syncState.lastSynced ? `Last synced: ${formatRelativeTime(syncState.lastSynced)}` : 'Not synced yet'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: colors.primary }]}
            onPress={syncCollection}
            disabled={syncState.isSyncing}
          >
            {syncState.isSyncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <RefreshCw size={16} color="#fff" />
                <Text style={styles.syncButtonText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <SectionHeader title="SYNC OPTIONS" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <SettingItem
      icon={Cloud}
      label="Auto-Sync"
      description="Automatically sync collection changes"
      action={
        <ToggleSwitch 
          enabled={syncSettings.autoSync} 
          onToggle={handleAutoSyncToggle} 
          colors={colors} 
        />
      }
      colors={colors}
    />
    <SettingItem
      icon={Wifi}
      label="Sync on Wi-Fi Only"
      description="Save mobile data by syncing only on Wi-Fi"
      action={
        <ToggleSwitch 
          enabled={syncSettings.wifiOnly} 
          onToggle={handleWifiOnlyToggle} 
          colors={colors} 
        />
      }
      colors={colors}
    />
        </View>

        <SectionHeader title="SYNC DETAILS" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <SettingItem
            icon={Database}
            label="Storage Used"
            value={`${(syncState.storage / 1024 / 1024).toFixed(1)} MB`}
            colors={colors}
          />
          <SettingItem
            icon={Clock}
            label="Sync Frequency"
            value={`Every ${syncState.frequency} minutes`}
            colors={colors}
          />
          <SettingItem
            icon={Battery}
            label="Battery Usage"
            value={syncState.batteryUsage}
            colors={colors}
          />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={() => {
          Alert.alert(
            'Reset Sync',
            'This will clear all synced data and perform a full sync. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetSync },
            ]
          );
        }}>
          <Text style={[styles.resetButtonText, { color: colors.primary }]}>Reset Sync Data</Text>
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
  statusCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
  settingItemValue: {
    fontSize: 14,
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
  resetButton: {
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  
});