import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
    ChevronLeft,
    Calendar,
    DollarSign,
    Store,
    Info,
    Pencil,
    Trash2,
    ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getCar, deleteCar } from '../../services/firestone';
import type { Car } from '../../types/models';
import ImageGallery from '../../components/ImageGallery';

interface CarDetailsParams extends Record<string, string> {
    id: string;
}

export default function CarDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<CarDetailsParams>();
    const { id } = params;
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [car, setCar] = useState<Car | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchCarDetails = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const carData = await getCar(id as string);
            if (!carData) {
                Alert.alert('Error', 'Car not found');
                router.back();
                return;
            }
            setCar(carData);
        } catch (error) {
            console.error('Error fetching car:', error);
            Alert.alert('Error', 'Failed to load car details');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCarDetails();
        }, [id, refreshTrigger])
    );

    const handleEdit = () => {
        router.push({
            pathname: '/(details)/edit-car',
            params: { id }
        });
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Car',
            'Are you sure you want to delete this car from your collection?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCar(id as string);
                            // Instead of setting params, emit an event that the collection screen can listen to
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete car. Please try again.');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    
    if (isLoading || !car) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, {
                borderBottomColor: colors.border,
                backgroundColor: colors.background
            }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Collection Item</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleEdit}
                            activeOpacity={0.7}
                        >
                            <Pencil size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleDelete}
                            activeOpacity={0.7}
                        >
                            <Trash2 size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <ImageGallery
                    images={car.images}
                    backgroundColor={colors.surface}
                    mode="detail"
                />

                <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
                    {/* Car Information */}
                    <View style={[styles.section, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.carName, { color: colors.text }]}>{car.name}</Text>
                        <View style={styles.carDetails}>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Series: {car.series} • {car.seriesNumber}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Year: {car.year} • {car.yearNumber}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Color: {car.color}
                            </Text>
                        </View>
                    </View>

                    {/* Collection Details */}
                    <View style={[styles.section, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Collection Details</Text>
                        <View style={styles.statsGrid}>
                            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.statsIconContainer}>
                                    <Calendar size={16} color={colors.secondary} />
                                    <Text style={[styles.statsLabel, { color: colors.secondary }]}>Purchased</Text>
                                </View>
                                <Text style={[styles.statsValue, { color: colors.text }]}>
                                    {car.purchaseDate ? new Date(car.purchaseDate + 'T00:00:00').toLocaleDateString() : 'Not set'}
                                </Text>
                            </View>
                            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.statsIconContainer}>
                                    <DollarSign size={16} color={colors.secondary} />
                                    <Text style={[styles.statsLabel, { color: colors.secondary }]}>Price</Text>
                                </View>
                                <Text style={[styles.statsValue, { color: colors.text }]}>
                                    {car.purchasePrice ? `$${Number(car.purchasePrice).toFixed(2)}` : 'Not set'}
                                </Text>
                            </View>
                            <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
                                <View style={styles.statsIconContainer}>
                                    <Store size={16} color={colors.secondary} />
                                    <Text style={[styles.statsLabel, { color: colors.secondary }]}>Store</Text>
                                </View>
                                <Text style={[styles.statsValue, { color: colors.text }]}>
                                    {car.purchaseStore || 'Not set'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Notes Section */}
                    {car.notes && (
                        <View style={styles.section}>
                            <View style={styles.notesHeader}>
                                <Info size={16} color={colors.secondary} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
                            </View>
                            <Text style={[styles.notesText, {
                                color: colors.secondary,
                                backgroundColor: colors.surface
                            }]}>
                                {car.notes}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Premium Banner */}
            {user?.plan === 'Free' && (
                <View style={[styles.premiumBanner, { backgroundColor: colors.primary }]}>
                    <Text style={styles.premiumText}>
                        Upgrade to premium to add unlimited items to your collection and wishlist!
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  section: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  carName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  carDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
  },
  statsIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statsValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  premiumBanner: {
    backgroundColor: '#0066FF',
    padding: 12,
  },
  premiumText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});