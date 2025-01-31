import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StyleProp,
    ViewStyle,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    User,
    CreditCard,
    Box,
    Heart,
    Settings,
    LogOut,
    ChevronRight,
    Crown,
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getUserCars, getUserWishlist } from '../../services/firestone';

// Types
interface StatsCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    style?: StyleProp<ViewStyle>;
    colors: any;
    isLoading?: boolean;
}

interface MenuItem {
    id: 'subscription' | 'settings' | 'logout';
    label: string;
    icon: React.ElementType;
    showArrow: boolean;
    isDestructive?: boolean;
    onPress: () => void;
}

interface MenuItemProps extends MenuItem {
    colors: any;
}

interface Stats {
    collectionCount: number;
    wishlistCount: number;
    isLoading: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
    icon: Icon,
    label,
    value,
    style,
    colors,
    isLoading
}) => (
    <View style={[
        styles.statsCard,
        { backgroundColor: colors.background, borderColor: colors.border },
        style
    ]}>
        <View style={styles.statsContent}>
            <Text style={[styles.statsLabel, { color: colors.secondary }]}>{label}</Text>
            {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
            )}
        </View>
        <Icon size={24} color={colors.primary} />
    </View>
);

const MenuItem: React.FC<MenuItemProps> = ({
    label,
    icon: Icon,
    showArrow,
    isDestructive,
    onPress,
    colors
}) => (
    <TouchableOpacity
        style={[
            styles.menuItem,
            { borderBottomColor: colors.border },
            isDestructive && styles.destructiveMenuItem
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.menuItemContent}>
            <Icon
                size={20}
                color={isDestructive ? '#FF3B30' : colors.text}
            />
            <Text
                style={[
                    styles.menuItemLabel,
                    { color: isDestructive ? '#FF3B30' : colors.text }
                ]}
            >
                {label}
            </Text>
        </View>
        {showArrow && (
            <ChevronRight size={20} color={colors.secondary} />
        )}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [stats, setStats] = useState<Stats>({
        collectionCount: 0,
        wishlistCount: 0,
        isLoading: true
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                const [collectionResponse, wishlistResponse] = await Promise.all([
                    getUserCars(user.uid),
                    getUserWishlist(user.uid)
                ]);

                setStats({
                    collectionCount: collectionResponse.cars.length,
                    wishlistCount: wishlistResponse.items.length,
                    isLoading: false
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                setStats(prev => ({ ...prev, isLoading: false }));
                Alert.alert('Error', 'Failed to load user stats');
            }
        };

        fetchStats();
    }, [user]);

    const handleSubscription = () => {
        router.push('/(details)/subscription');
    };

    const handleSettings = () => {
        router.push('/(details)/settings');
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const menuItems: MenuItem[] = [
        {
            id: 'subscription',
            label: 'Subscription',
            icon: CreditCard,
            showArrow: true,
            onPress: handleSubscription,
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            showArrow: true,
            onPress: handleSettings,
        },
        {
            id: 'logout',
            label: 'Sign Out',
            icon: LogOut,
            showArrow: false,
            isDestructive: true,
            onPress: handleLogout,
        },
    ];

    if (!user) return null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <ScrollView bounces={false}>
                {/* Header */}
                <View style={[styles.header, {
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border
                }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                </View>

                {/* User Info Section */}
                <View style={[styles.userSection, {
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border
                }]}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
                            <User size={32} color={colors.primary} />
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                            <Text style={[styles.userEmail, { color: colors.secondary }]}>{user.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Subscription Status */}
                <View style={[styles.subscriptionStatus, {
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border
                }]}>
                    <View style={styles.planInfo}>
                        <Crown size={20} color="#FFD700" />
                        <Text style={[styles.planText, { color: colors.text }]}>{user.plan} Plan</Text>
                    </View>
                    {user.plan === 'Free' && (
                        <TouchableOpacity
                            style={[styles.upgradeButton]}
                            onPress={() => router.push('/(details)/subscription')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Section */}
                <View style={[styles.statsSection, { backgroundColor: colors.background }]}>
                    <StatsCard
                        icon={Box}
                        label="Collection"
                        value={user.plan === 'Free' ?
                            `${stats.collectionCount}/10` :
                            stats.collectionCount.toString()
                        }
                        style={styles.statsCardContainer}
                        colors={colors}
                        isLoading={stats.isLoading}
                    />
                    <StatsCard
                        icon={Heart}
                        label="Wishlist"
                        value={user.plan === 'Free' ?
                            `${stats.wishlistCount}/10` :
                            stats.wishlistCount.toString()
                        }
                        style={styles.statsCardContainer}
                        colors={colors}
                        isLoading={stats.isLoading}
                    />
                </View>

                {/* Menu Section */}
                <View style={[styles.menuSection, { backgroundColor: colors.background }]}>
                    {menuItems.map((item) => (
                        <MenuItem key={item.id} {...item} colors={colors} />
                    ))}
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
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
    },
    userSection: {
        padding: 16,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: {
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    subscriptionStatus: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    planInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    planText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    upgradeButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        opacity: 1,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    statsSection: {
        flexDirection: 'row',
        gap: 16,
        padding: 16,
    },
    statsCardContainer: {
        flex: 1,
    },
    statsCard: {
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    statsContent: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    statsValue: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    menuSection: {
        marginTop: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemLabel: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    destructiveMenuItem: {
        borderBottomWidth: 0,
    },
});