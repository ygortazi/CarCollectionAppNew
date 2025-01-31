import React from 'react';
import { useAuth } from '../../context/auth';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const PremiumFeatureScreen = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, {
                borderBottomColor: colors.border,
                backgroundColor: colors.background
            }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Premium Feature</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                    <Crown size={48} color="#FFD700" />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>
                    Import/Export is a Premium Feature
                </Text>

                <Text style={[styles.description, { color: colors.secondary }]}>
                    Upgrade to Premium to unlock powerful import and export capabilities:
                </Text>

                <View style={styles.featuresList}>
                    <Text style={[styles.featureText, { color: colors.text }]}>
                        • Import collections from Excel files
                    </Text>
                    <Text style={[styles.featureText, { color: colors.text }]}>
                        • Export your collection for backup
                    </Text>
                    <Text style={[styles.featureText, { color: colors.text }]}>
                        • Unlimited collection size
                    </Text>
                    <Text style={[styles.featureText, { color: colors.text }]}>
                        • Ad-free experience
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/(details)/subscription')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginBottom: 32,
    },
    featuresList: {
        width: '100%',
        marginBottom: 32,
    },
    featureText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginBottom: 12,
        paddingLeft: 8,
    },
    upgradeButton: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});

export default PremiumFeatureScreen;