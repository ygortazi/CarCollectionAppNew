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
import { getCar, addToCollection, addToWishlist, removeFromWishlist, isInWishlist } from '../../services/firestone';
import type { CatalogCar } from '../../types/models';
import ImageGallery from '../../components/ImageGallery';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from 'config/firebase';

export default function CarDetailsCatalogScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [car, setCar] = useState<CatalogCar | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [addingToCollection, setAddingToCollection] = useState(false);
    const [addingToWishlist, setAddingToWishlist] = useState(false);
    const [isInUserWishlist, setIsInUserWishlist] = useState(false);
    const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);

    const fetchCarDetails = async () => {
        if (!id) return;

        try {
            const carData = await getCar(id as string, 'catalog');
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

    useEffect(() => {
        fetchCarDetails();
    }, [id]);

    useEffect(() => {
        const checkWishlistStatus = async () => {
            if (!user || !car) return;
            const inWishlist = await isInWishlist(user.uid, car.toyNumber);
            setIsInUserWishlist(inWishlist);

            if (inWishlist) {
                const wishlistQuery = query(
                    collection(db, 'wishlist'),
                    where('userId', '==', user.uid),
                    where('toyNumber', '==', car.toyNumber),
                    where('deleted', '==', false)
                );
                const snapshot = await getDocs(wishlistQuery);
                if (!snapshot.empty) {
                    setWishlistItemId(snapshot.docs[0].id);
                }
            }
        };

        checkWishlistStatus();
    }, [user, car]);

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

    const handleWishlistAction = async () => {
        if (!user || !car) return;

        setAddingToWishlist(true);
        try {
            if (isInUserWishlist && wishlistItemId) {
                await removeFromWishlist(wishlistItemId);
                setIsInUserWishlist(false);
                setWishlistItemId(null);
                Alert.alert('Success', 'Removed from wishlist!');
            } else {
                await addToWishlist(user.uid, car);
                setIsInUserWishlist(true);
                Alert.alert('Success', 'Added to wishlist!');
            }
            router.back();
        } catch (error) {
            if (error instanceof Error && error.message === 'This item is already in your wishlist') {
                Alert.alert('Note', error.message);
            } else {
                console.error('Error managing wishlist:', error);
                Alert.alert('Error', 'Failed to manage wishlist.');
            }
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
                    <View style={styles.section}>
                        <Text style={[styles.carName, { color: colors.text }]}>{car.name}</Text>

                        <View style={styles.carDetails}>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Toy #: {car.toyNumber}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Series: {car.series} • {car.seriesNumber}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Year: {car.year} • {car.yearNumber}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Color: {car.color}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Tampo: {car.tampo}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Base Color: {car.baseColor}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Window Color: {car.windowColor}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Interior Color: {car.interiorColor}
                            </Text>
                            <Text style={[styles.detailText, { color: colors.secondary }]}>
                                Wheel Type: {car.wheelType}
                            </Text>
                        </View>
                    </View>

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
                            style={[styles.wishlistButton, {
                                borderColor: colors.border,
                                backgroundColor: isInUserWishlist ? colors.primary : 'transparent'
                            }]}
                            onPress={handleWishlistAction}
                            disabled={addingToWishlist}
                            activeOpacity={0.7}
                        >
                            {addingToWishlist ? (
                                <ActivityIndicator color={isInUserWishlist ? '#fff' : colors.primary} size="small" />
                            ) : (
                                <Heart
                                    size={20}
                                    color={isInUserWishlist ? '#fff' : colors.text}
                                    fill={isInUserWishlist ? '#fff' : 'none'}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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