import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/auth';
import { ThemeProvider, useTheme } from '../context/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { NotificationsProvider } from '../context/notifications';
import { LanguageProvider } from '../context/language';
import { SettingsProvider } from '../context/settings';
import { SyncProvider } from '../context/sync';
import '../i18n';

SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
        </View>
    );
}

function useProtectedRoute() {
    const segments = useSegments();
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);
}

function Navigation() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    useProtectedRoute();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: colors.background,
                },
                animation: Platform.OS === 'android' ? 'fade' : 'default',
            }}
        >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen 
                name="(details)" 
                options={{ 
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }} 
            />
            <Stack.Screen
                name="modals"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
        </Stack>
    );
}

function Providers({ children }: { children: React.ReactNode }) {
    const { isLoading: authLoading } = useAuth();
    
    if (authLoading) {
        return <LoadingScreen />;
    }

    return (
        <SettingsProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <NotificationsProvider>
                        <SyncProvider>
                            {children}
                        </SyncProvider>
                    </NotificationsProvider>
                </ThemeProvider>
            </LanguageProvider>
        </SettingsProvider>
    );
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
        'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
        'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
        'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return <LoadingScreen />;
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
                <AuthProvider>
                    <SettingsProvider>
                        <LanguageProvider>
                            <ThemeProvider>
                                <NotificationsProvider>
                                    <SyncProvider>
                                        <Navigation />
                                    </SyncProvider>
                                </NotificationsProvider>
                            </ThemeProvider>
                        </LanguageProvider>
                    </SettingsProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});