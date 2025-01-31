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
    AlertCircle,
    Download,
    Upload,
    Crown,
    Check,
    X
} from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { generateExcelFile, parseExcelFile } from '../../utils/excel';
import { useAuth } from '../../context/auth';

interface StatusMessageProps {
    status: 'processing' | 'success' | 'error' | null;
    type: 'import' | 'export';
}

const columns = [
    { key: 'name', label: 'Name', required: true },
    { key: 'series', label: 'Series', required: false },
    { key: 'seriesNumber', label: 'Series Number', required: false },
    { key: 'year', label: 'Year', required: false },
    { key: 'yearNumber', label: 'Year Number', required: false },
    { key: 'color', label: 'Color', required: false },
    { key: 'purchaseDate', label: 'Purchase Date', required: false },
    { key: 'purchasePrice', label: 'Purchase Price', required: false },
    { key: 'purchaseStore', label: 'Store', required: false },
    { key: 'notes', label: 'Notes', required: false }
];

const StatusMessage: React.FC<StatusMessageProps> = ({ status, type }) => {
    if (!status) return null;

    const messages = {
        processing: `${type === 'import' ? 'Importing' : 'Exporting'} your collection...`,
        success: `${type === 'import' ? 'Import' : 'Export'} completed successfully!`,
        error: `${type === 'import' ? 'Import' : 'Export'} failed. Please try again.`
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

export default function ImportScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const [importStatus, setImportStatus] = useState<'processing' | 'success' | 'error' | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

    const validateExcelData = (data: any[]) => {
        const errors: string[] = [];

        if (!data || data.length === 0) {
            errors.push('Excel file is empty');
            return errors;
        }

        const headers = Object.keys(data[0]);

        if (!headers.includes('name')) {
            errors.push('Missing required column: Name');
        }

        data.forEach((row, index) => {
            const rowNum = index + 2;

            if (!row.name) {
                errors.push(`Row ${rowNum}: Name is required`);
            }

            if (row.year && row.year !== '') {
                const yearNum = Number(row.year);
                if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
                    errors.push(`Row ${rowNum}: Invalid year value`);
                }
            }

            if (row.purchaseDate && row.purchaseDate !== '') {
                const date = new Date(row.purchaseDate);
                if (isNaN(date.getTime())) {
                    errors.push(`Row ${rowNum}: Invalid purchase date format`);
                }
            }
        });

        return errors;
    };

    const downloadTemplate = async () => {
        try {
            const templateData = [
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

            const success = await generateExcelFile(templateData, "car-collection-template.xlsx");

            if (!success) {
                Alert.alert('Error', 'Failed to generate template. Please try again.');
            }
        } catch (error) {
            console.error('Template download error:', error);
            Alert.alert('Error', 'Failed to download template. Please try again.');
        }
    };

    const handleImport = async () => {
        try {
            setImportStatus('processing');
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel'
                ]
            });

            if (result.canceled) {
                setImportStatus(null);
                return;
            }

            const file = result.assets[0];
            const data = await parseExcelFile(file);
            const errors = validateExcelData(data);

            if (errors.length > 0) {
                setValidationErrors(errors);
                setImportStatus('error');
                return;
            }

            // TODO: Process import data
            console.log('Imported data:', data);

            setValidationErrors([]);
            setImportStatus('success');
        } catch (error) {
            console.error('Import error:', error);
            setValidationErrors(['Failed to read Excel file']);
            setImportStatus('error');
        }
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
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Import Collection</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Upload Section */}
                <View style={[styles.section, { backgroundColor: colors.background }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Import Collection
                            </Text>
                            <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
                                Import your collection from an Excel file
                            </Text>
                        </View>
                        <Upload size={24} color={colors.secondary} />
                    </View>

                    <TouchableOpacity
                        style={[styles.uploadButton, { borderColor: colors.border }]}
                        onPress={handleImport}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.uploadButtonText, { color: colors.secondary }]}>
                            Click to select an Excel file (.xlsx or .xls)
                        </Text>
                    </TouchableOpacity>

                    <StatusMessage status={importStatus} type="import" />

                    {validationErrors.length > 0 && (
                        <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
                            <View style={styles.errorHeader}>
                                <AlertCircle size={16} color="#FF3B30" />
                                <Text style={styles.errorHeaderText}>Import Validation Errors</Text>
                            </View>
                            <View style={styles.errorList}>
                                {validationErrors.map((error, index) => (
                                    <Text key={index} style={styles.errorText}>• {error}</Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Help Section */}
                <View style={[styles.helpSection, { backgroundColor: colors.surface }]}>
                    <View style={styles.helpHeader}>
                        <AlertCircle size={20} color={colors.primary} />
                        <Text style={[styles.helpTitle, { color: colors.text }]}>
                            How to Get Started
                        </Text>
                    </View>

                    <View style={[styles.optionCard, {
                        backgroundColor: colors.background,
                        borderColor: colors.primary
                    }]}>
                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                            Option 1: Use Our Template (Recommended)
                        </Text>
                        <Text style={[styles.optionDescription, { color: colors.secondary }]}>
                            Download our pre-formatted Excel template with examples and instructions:
                        </Text>
                        <TouchableOpacity
                            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                            onPress={downloadTemplate}
                            activeOpacity={0.7}
                        >
                            <Download size={20} color="#fff" />
                            <Text style={styles.downloadButtonText}>
                                Download Excel Template
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.optionCard, {
                        backgroundColor: colors.background,
                        borderColor: colors.border
                    }]}>
                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                            Option 2: Create Your Own File
                        </Text>
                        <Text style={[styles.optionDescription, { color: colors.secondary }]}>
                            You can create your own Excel file with these columns:
                        </Text>
                        <Text style={[styles.columnHeader, { color: colors.primary }]}>
                            Required:
                        </Text>
                        <Text style={[styles.columnText, { color: colors.secondary }]}>
                            • Name (e.g., "2024 Custom '67 Ford Mustang GT500")
                        </Text>
                        <Text style={[styles.columnHeader, { color: colors.primary }]}>
                            Optional:
                        </Text>
                        {columns.filter(col => !col.required).map((col, index) => (
                            <Text key={index} style={[styles.columnText, { color: colors.secondary }]}>
                                • {col.label}
                            </Text>
                        ))}
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
        marginBottom: 16,
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
    uploadButton: {
        width: '100%',
        height: 100,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
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
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
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
    helpSection: {
        padding: 16,
        borderRadius: 12,
        margin: 16,
    },
    helpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    helpTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    optionCard: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    optionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    optionDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 16,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    downloadButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    columnHeader: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginTop: 12,
        marginBottom: 4,
    },
    columnText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginLeft: 8,
        marginBottom: 2,
    },
    errorList: {
        marginTop: 8,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    errorContainer: {
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
    },
    errorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    errorHeaderText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#FF3B30',
    },
});