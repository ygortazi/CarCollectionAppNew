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
  Globe,
  Users,
  Lock,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/auth';
import { useSettings } from '../../context/settings';

interface RadioOptionProps {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  colors: any;
  icon: React.ElementType;
}

const RadioOption: React.FC<RadioOptionProps> = ({ 
  label, 
  description, 
  selected, 
  onSelect, 
  colors,
  icon: Icon 
}) => (
  <TouchableOpacity 
    style={[
      styles.radioOption, 
      { 
        borderBottomColor: colors.border,
        backgroundColor: selected ? colors.surface : colors.background 
      }
    ]} 
    onPress={onSelect}
    activeOpacity={0.7}
  >
    <View style={styles.radioOptionLeft}>
      <Icon size={20} color={selected ? colors.primary : colors.text} />
      <View style={styles.radioOptionText}>
        <Text style={[styles.radioOptionLabel, { 
          color: selected ? colors.primary : colors.text,
          fontFamily: selected ? 'Inter-SemiBold' : 'Inter-Regular'
        }]}>
          {label}
        </Text>
        <Text style={[styles.radioOptionDescription, { color: colors.secondary }]}>
          {description}
        </Text>
      </View>
    </View>
    <View style={[
      styles.radioCircle, 
      { 
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: colors.background
      }
    ]}>
      {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
    </View>
  </TouchableOpacity>
);

export default function ProfileVisibilityScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { settings, updateSettings, isLoading } = useSettings();

  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>(
    settings?.privacy?.profileVisibility ?? 'private'
  );

  const handleVisibilityChange = async (newVisibility: 'public' | 'friends' | 'private') => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to change visibility settings');
      return;
    }
  
    const previousVisibility = visibility;
    try {
      // Update local state
      setVisibility(newVisibility);
  
      // Update both settings context and database
      await updateSettings({
        ...settings,
        privacy: {
          ...settings.privacy,
          profileVisibility: newVisibility
        }
      });
  
    } catch (error) {
      // Revert on error
      setVisibility(previousVisibility);
      console.error('Error updating profile visibility:', error);
      Alert.alert('Error', 'Failed to update visibility settings. Please try again.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Visibility</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: colors.secondary }]}>
          WHO CAN SEE YOUR COLLECTION
        </Text>
        
        <View style={[styles.section, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}>
          <RadioOption
            icon={Globe}
            label="Public"
            description="Anyone can view your collection and profile"
            selected={visibility === 'public'}
            onSelect={() => handleVisibilityChange('public')}
            colors={colors}
          />
          <RadioOption
            icon={Users}
            label="Friends Only"
            description="Only approved friends can view your collection"
            selected={visibility === 'friends'}
            onSelect={() => handleVisibilityChange('friends')}
            colors={colors}
          />
          <RadioOption
            icon={Lock}
            label="Private"
            description="Only you can view your collection"
            selected={visibility === 'private'}
            onSelect={() => handleVisibilityChange('private')}
            colors={colors}
          />
        </View>

        <Text style={[styles.footerText, { color: colors.secondary }]}>
          Changes to visibility settings take effect immediately. Blocked users cannot view your profile 
          regardless of these settings.
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
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  radioOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioOptionText: {
    flex: 1,
  },
  radioOptionLabel: {
    fontSize: 16,
  },
  radioOptionDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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