import React, { useState, useEffect } from 'react';
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
import {
    ChevronLeft,
    Heart,
    Plus,
    ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getCar, addToCollection, addToWishlist } from '../../services/firestone';
import type { Car } from '../../types/models';
import ImageGallery from '../../components/ImageGallery';

export default function CarDetailsCatalogScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [car, setCar] = useState<Car | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addingToCollection, setAddingToCollection] = useState(false);
    const [addingToWishlist, setAddingToWishlist] = useState(false);

    useEffect(() => {
        fetchCarDetails();
    }, [id]);

    const fetchCarDetails = async () => {
        if (!id) return;

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

    const handleAddToCollection = async () => {
        if (!user || !car) return;

        setAddingToCollection(true);
        try {
            await addToCollection(user.uid, car);
            Alert.alert('Success', 'Added to collection!');
            router.back();
        } catch (error) {
            console.error('Error adding to collection:', error);
            Alert.alert('Error', 'Failed to add to collection.');
        } finally {
            setAddingToCollection(false);
        }
    };

    const handleAddToWishlist = async () => {
        if (!user || !car) return;

        setAddingToWishlist(true);
        try {
            await addToWishlist(user.uid, car);
            Alert.alert('Success', 'Added to wishlist!');
            router.back();
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            Alert.alert('Error', 'Failed to add to wishlist.');
        } finally {
            setAddingToWishlist(false);
        }
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Car Details</Text>
                <View style={styles.headerRight} />
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
                    <View style={styles.section}>
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

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={handleAddToCollection}
                            disabled={addingToCollection}
                            activeOpacity={0.7}
                        >
                            {addingToCollection ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Plus size={20} color="#fff" />
                                    <Text style={styles.addButtonText}>Add to Collection</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.wishlistButton, { borderColor: colors.border }]}
                            onPress={handleAddToWishlist}
                            disabled={addingToWishlist}
                            activeOpacity={0.7}
                        >
                            {addingToWishlist ? (
                                <ActivityIndicator color={colors.primary} size="small" />
                            ) : (
                                <Heart size={20} color={colors.text} />
                            )}
                        </TouchableOpacity>
                    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  headerRight: {
    width: 32, // Maintains header title center alignment
  },
  content: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  wishlistButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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