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
    Download,
    Check,
    X,
    Crown,
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { generateExcelFile } from '../../utils/excel';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/auth';

interface StatusMessageProps {
    status: 'processing' | 'success' | 'error' | null;
    type: 'export';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status, type }) => {
    if (!status) return null;

    const messages = {
        processing: 'Exporting your collection...',
        success: 'Export completed successfully!',
        error: 'Export failed. Please try again.'
    };

    const icons = {
        processing: null,
        success: <Check size={16} color="#22CC88" />,
        error: <X size={16} color="#FF3B30" />
    };

    return (
        <View style={styles.statusContainer}>
            {icons[status]}
            <Text style={[
                styles.statusText,
                status === 'error' && styles.statusTextError
            ]}>
                {messages[status]}
            </Text>
        </View>
    );
};

export default function ExportScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const [exportStatus, setExportStatus] = useState<'processing' | 'success' | 'error' | null>(null);

    // Premium feature gate - show upgrade UI for free users
    if (user?.plan === 'Free') {
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

                {/* Premium Content */}
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                        <Crown size={48} color="#FFD700" />
                    </View>

                    <Text style={[styles.premiumTitle, { color: colors.text }]}>
                        Import/Export is a Premium Feature
                    </Text>

                    <Text style={[styles.premiumDescription, { color: colors.secondary }]}>
                        Upgrade to Premium to unlock powerful import and export capabilities:
                    </Text>

                    <View style={styles.featuresList}>
                        <Text style={[styles.featureText, { color: colors.text }]}>
                            • Import collections from Excel files
                        </Text>
                        <Text style={[styles.featureText, { color: colors.text }]}>
                            • Export your collection into Excel for backup
                        </Text>
                        <Text style={[styles.featureText, { color: colors.text }]}>
                            • Unlimited collection size
                        </Text>
                        <Text style={[styles.featureText, { color: colors.text }]}>
                            • Unlimited wishlist size
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
    }

    const handleExport = async () => {
        try {
            setExportStatus('processing');

            // TODO: Replace with actual collection data
            const sampleData = [
                {
                    name: "2024 Custom '67 Ford Mustang GT500",
                    series: "HW Speed Graphics",
                    seriesNumber: "2/10",
                    year: "2024",
                    yearNumber: "012/250",
                    color: "Metallic Blue",
                    purchaseDate: "2024-01-15",
                    purchasePrice: "4.99",
                    purchaseStore: "Target",
                    notes: "Premium version with rubber tires"
                }
            ];

            const filename = `car-collection-${new Date().toISOString().split('T')[0]}.xlsx`;
            const filePath = `${FileSystem.documentDirectory}${filename}`;

            const success = await generateExcelFile(sampleData, filename);

            if (!success) {
                throw new Error('Failed to generate Excel file');
            }

            // Share the file
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Export Collection',
                    UTI: 'com.microsoft.excel.xlsx'
                });
            }

            setExportStatus('success');
            setTimeout(() => setExportStatus(null), 3000);
        } catch (error) {
            console.error('Export error:', error);
            setExportStatus('error');
            Alert.alert('Export Failed', 'Unable to export your collection. Please try again.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Export Collection</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={[styles.section, { backgroundColor: colors.background }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Export Collection
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
                                Download your collection as an Excel file
                            </Text>
                        </View>
                        <Download size={24} color={colors.secondary} />
                    </View>

                    <TouchableOpacity
                        style={[styles.exportButton, { backgroundColor: colors.primary }]}
                        onPress={handleExport}
                        activeOpacity={0.7}
                    >
                        <Download size={20} color="#fff" />
                        <Text style={styles.exportButtonText}>
                            Download Excel File
                        </Text>
                    </TouchableOpacity>

                    <StatusMessage status={exportStatus} type="export" />

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.infoTitle, { color: colors.text }]}>
                            What's included in the export?
                        </Text>
                        <Text style={[styles.infoText, { color: colors.secondary }]}>
                            • All items in your collection{'\n'}
                            • Item details (name, series, year, etc.){'\n'}
                            • Purchase information{'\n'}
                            • Custom notes{'\n'}
                            • Collection statistics
                        </Text>
                        <Text style={[styles.infoNote, { color: colors.secondary }]}>
                            Note: Custom images are not included in the export file.
                        </Text>
                    </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        paddingTop: Platform.OS === 'android' ? 16 : 16,
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
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        gap: 8,
        marginBottom: 16,
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#666666',
    },
    statusTextError: {
        color: '#FF3B30',
    },
    infoCard: {
        padding: 16,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
        marginBottom: 12,
    },
    infoNote: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
    // Premium screen styles
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    premiumTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    premiumDescription: {
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