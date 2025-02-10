import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';

export default function DetailsLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
        presentation: 'card',
      }}>
      <Stack.Screen name="car-details" options={{ title: 'Car Details' }} />
      <Stack.Screen name="edit-car" options={{ title: 'Edit Car' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="import-export" options={{ title: 'Import/Export' }} />
      <Stack.Screen name="terms-of-service" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="help-support" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="notification-settings" options={{ title: 'Notifications' }} />
      <Stack.Screen name="language-settings" options={{ title: 'Language' }} />
      <Stack.Screen name="sync-settings" options={{ title: 'Sync Settings' }} />
      <Stack.Screen name="email-preferences" options={{ title: 'Email Preferences' }} />
      <Stack.Screen name="privacy-settings" options={{ title: 'Privacy Settings' }} />
    </Stack>
  );
}