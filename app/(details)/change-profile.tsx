import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';

export default function ChangeProfileScreen() {
    const router = useRouter();
    const { user, changeUsername, changePassword } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [isLoading, setIsLoading] = useState(false);
    const [newUsername, setNewUsername] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handleChangeUsername = async () => {
        if (!newUsername.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        setIsLoading(true);
        try {
            await changeUsername(newUsername);
            Alert.alert('Success', 'Username updated successfully', [
                { text: 'OK', onPress: () => router.push('/(tabs)/profile') }
            ]);
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update username');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            Alert.alert('Success', 'Password updated successfully', [
                { text: 'OK', onPress: () => router.push('/(tabs)/profile') }
            ]);
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
            </View>

            <View style={styles.content}>
                {/* Change Username Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Username</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            placeholder="Enter new username"
                            placeholderTextColor={colors.secondary}
                            value={newUsername}
                            onChangeText={setNewUsername}
                            editable={!isLoading}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleChangeUsername}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Update Username</Text>
                    </TouchableOpacity>
                </View>

                {/* Change Password Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            placeholder="Current password"
                            placeholderTextColor={colors.secondary}
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            editable={!isLoading}
                        />
                        <TextInput
                            style={[styles.input, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            placeholder="New password"
                            placeholderTextColor={colors.secondary}
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            editable={!isLoading}
                        />
                        <TextInput
                            style={[styles.input, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            placeholder="Confirm new password"
                            placeholderTextColor={colors.secondary}
                            secureTextEntry
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                            editable={!isLoading}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleChangePassword}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Update Password</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    inputContainer: {
        gap: 12,
        marginBottom: 16,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    button: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});

export function createChangeProfileRoute() {
    return {
        '(details)/change-profile': {
            component: ChangeProfileScreen,
        },
    };
}