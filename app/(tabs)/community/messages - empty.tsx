import { Tabs } from 'expo-router';
import { Grid, Box, Heart, User } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: colors.background,
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 12,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Catalog',
            tabBarIcon: ({ color }) => <Grid size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="collection"
          options={{
            title: 'Collection',
            tabBarIcon: ({ color }) => <Box size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}