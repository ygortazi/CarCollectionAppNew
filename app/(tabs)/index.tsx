import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Platform,
    StyleProp,
    ViewStyle,
    Alert,
    ActivityIndicator,
    Pressable,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Grid,
    List,
    Filter,
    PlusCircle,
    Heart,
    ChevronDown,
} from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from 'context/auth';
import { useTheme } from 'context/theme';
import { Colors } from 'constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from 'config/firebase';
import { getCatalog, addToCollection, addToWishlist, removeFromWishlist } from 'services/firestone';
import { useFilterStore } from '../../stores/filterStore';
import { FilterProcessor } from '../../utils/FilterProcessor';
import type { CatalogCar } from 'types/models';

function getImageSource(images: Array<{ downloadURL?: string }>) {
    if (!images || !images[0] || !images[0].downloadURL) {
        return require('assets/placeholder-image.png');
    }
    return { uri: images[0].downloadURL };
}

type PaginatedResponse = {
    items: CatalogCar[];
    lastDoc: any;
    hasMore: boolean;
};

interface SortOption {
    label: string;
    value: 'recent' | 'purchase' | 'name' | 'priceHigh' | 'priceLow';
}

interface ActionButtonsProps {
    onAddToCollection: () => void;
    onAddToWishlist: () => void;
    style?: StyleProp<ViewStyle>;
    isInWishlist: boolean;
    isInCollection: boolean;
    isProcessing: boolean;
}

interface LoadingStates {
    fetchingCars: boolean;
    refreshing: boolean;
    addingToCollection: boolean;
    addingToWishlist: boolean;
}

const sortOptions: SortOption[] = [
    { label: 'Recently Added', value: 'recent' },
    { label: 'Purchase Date', value: 'purchase' },
    { label: 'Name A-Z', value: 'name' },
    { label: 'Price High-Low', value: 'priceHigh' },
    { label: 'Price Low-High', value: 'priceLow' }
];

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onAddToCollection,
    onAddToWishlist,
    style,
    isInWishlist,
    isInCollection,
    isProcessing
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.actionButtons, style]}>
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    {
                        backgroundColor: isInCollection ? colors.success : colors.surface
                    }
                ]}
                onPress={onAddToCollection}
                activeOpacity={0.7}
            >
                <PlusCircle size={20} color={isInCollection ? '#fff' : colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    {
                        backgroundColor: isInWishlist ? colors.primary : colors.surface
                    }
                ]}
                onPress={onAddToWishlist}
                disabled={isProcessing}
                activeOpacity={0.7}
            >
                {isProcessing ? (
                    <ActivityIndicator size="small" color={isInWishlist ? '#fff' : colors.primary} />
                ) : (
                    <Heart
                        size={20}
                        color={isInWishlist ? '#fff' : colors.text}
                        fill={isInWishlist ? '#fff' : 'none'}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};
export default function CatalogScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { filters, setFilters } = useFilterStore();

    const [isGridView, setIsGridView] = useState(true);
    const [showSortModal, setShowSortModal] = useState(false);
    const [catalog, setCatalog] = useState<CatalogCar[]>([]);
    const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
    const[collectionItems, setCollectionItems] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<LoadingStates>({
        fetchingCars: true,
        refreshing: false,
        addingToCollection: false,
        addingToWishlist: false
    });

    useEffect(() => {
        if (!user) return;

        // Create a query for the wishlist
        const wishlistQuery = query(
            collection(db, 'wishlist'),
            where('userId', '==', user.uid),
            where('deleted', '==', false)
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(wishlistQuery, (snapshot) => {
            const wishlistToyNumbers = new Set(
                snapshot.docs.map(doc => doc.data().toyNumber)
            );
            setWishlistItems(wishlistToyNumbers);
        }, (error) => {
            Alert.alert('Error', 'Failed to sync wishlist status.');
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [user]);

    const fetchCollectionStatus = async () => {
        if (!user) return;

        try {
            const collectionQuery = query(
                collection(db, 'cars'),
                where('userId', '==', user.uid),
                where('deleted', '==', false)
            );
            const snapshot = await getDocs(collectionQuery);
            const collectionToyNumbers = new Set(
                snapshot.docs.map(doc => doc.data().toyNumber)
            );
            setCollectionItems(collectionToyNumbers);
        } catch (error) {
            console.error('Error fetching collection status:', error);
        }
    };

    useEffect(() => {
        fetchCatalog();
        fetchCollectionStatus();
    }, [user]);

    const fetchCatalog = async (isRefreshing = false) => {
        setLoading(prev => ({
            ...prev,
            [isRefreshing ? 'refreshing' : 'fetchingCars']: true
        }));

        try {
            const response = await getCatalog();
            setCatalog(response.items);
        } catch (error) {
            console.error('Error fetching catalog:', error);
            Alert.alert('Error', 'Failed to load catalog.');
        } finally {
            setLoading(prev => ({
                ...prev,
                [isRefreshing ? 'refreshing' : 'fetchingCars']: false
            }));
        }
    };

    const handleAddToCollection = async (car: CatalogCar) => {
        if (!user) return;

        setLoading(prev => ({ ...prev, addingToCollection: true }));
        try {
            await addToCollection(user.uid, car);
            setCollectionItems(prev => new Set([...prev, car.toyNumber]));
            Alert.alert('Success', 'Added to collection!');
        } catch (error) {
            console.error('Error adding to collection:', error);
            Alert.alert('Error', 'Failed to add to collection.');
        } finally {
            setLoading(prev => ({ ...prev, addingToCollection: false }));
        }
    };

    const handleWishlistAction = async (car: CatalogCar) => {
        if (!user) return;

        setLoading(prev => ({ ...prev, addingToWishlist: true }));
        try {
            if (wishlistItems.has(car.toyNumber)) {
                // Find the wishlist item ID
                const wishlistQuery = query(
                    collection(db, 'wishlist'),
                    where('userId', '==', user.uid),
                    where('toyNumber', '==', car.toyNumber),
                    where('deleted', '==', false)
                );
                const snapshot = await getDocs(wishlistQuery);
                if (!snapshot.empty) {
                    await removeFromWishlist(snapshot.docs[0].id);
                    setWishlistItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(car.toyNumber);
                        return newSet;
                    });
                }
            } else {
                await addToWishlist(user.uid, car);
                setWishlistItems(prev => new Set([...prev, car.toyNumber]));
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'This item is already in your wishlist') {
                Alert.alert('Note', error.message);
            } else {
                console.error('Error managing wishlist:', error);
                Alert.alert('Error', 'Failed to manage wishlist.');
            }
        } finally {
            setLoading(prev => ({ ...prev, addingToWishlist: false }));
        }
    };

    const sortedAndFilteredCars = useMemo(() => {
        return FilterProcessor.applyFilters(catalog as any, filters);
    }, [catalog, filters]);

    const renderGridItem = useCallback(({ item }: { item: CatalogCar }) => (
        <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.push({
                pathname: '/(details)/car-details-catalog',
                params: { id: item.toyNumber }
            })}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={getImageSource(item.images)}
                    style={styles.gridImage}
                />
                {item.images.length > 1 && (
                    <View style={styles.customImageIndicator}>
                        {item.images.map((_, index) => (
                            <View key={index} style={styles.indicatorDot} />
                        ))}
                    </View>
                )}
            </View>
            <View style={styles.gridCardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.secondary }]}>
                    {item.series} • {item.seriesNumber}
                </Text>
                <Text style={[styles.cardDetail, { color: colors.secondary }]}>
                    {item.year} • {item.yearNumber}
                </Text>
                <Text style={[styles.cardDetail, { color: colors.secondary }]}>
                    Color: {item.color}
                </Text>
                <ActionButtons
                    style={styles.gridActions}
                    onAddToCollection={() => handleAddToCollection(item)}
                    onAddToWishlist={() => handleWishlistAction(item)}
                    isInWishlist={wishlistItems.has(item.toyNumber)}
                    isInCollection={collectionItems.has(item.toyNumber)}
                    isProcessing={loading.addingToWishlist}
                />
            </View>
        </TouchableOpacity>
    ), [router, handleAddToCollection, handleWishlistAction, colors, wishlistItems, loading]);

    const renderListItem = useCallback(({ item }: { item: CatalogCar }) => (
        <TouchableOpacity
            style={[styles.listCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.push({
                pathname: '/(details)/car-details-catalog',
                params: { id: item.toyNumber }
            })}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={getImageSource(item.images)}
                    style={styles.listImage}
                />
                {item.images.length > 1 && (
                    <View style={styles.customImageIndicator}>
                        {item.images.map((_, index) => (
                            <View key={index} style={styles.indicatorDot} />
                        ))}
                    </View>
                )}
            </View>
            <View style={styles.listCardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.secondary }]}>
                    {item.series} • {item.seriesNumber}
                </Text>
                <Text style={[styles.cardDetail, { color: colors.secondary }]}>
                    {item.year} • {item.yearNumber}
                </Text>
                <Text style={[styles.cardDetail, { color: colors.secondary }]}>
                    Color: {item.color}
                </Text>
            </View>
            <ActionButtons
                style={styles.gridActions}
                onAddToCollection={() => handleAddToCollection(item)}
                onAddToWishlist={() => handleWishlistAction(item)}
                isInWishlist={wishlistItems.has(item.toyNumber)}
                isInCollection={collectionItems.has(item.toyNumber)}
                isProcessing={loading.addingToWishlist}
            />
        </TouchableOpacity>
    ), [router, handleAddToCollection, handleWishlistAction, colors, wishlistItems, loading]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>Catalog</Text>
                    <Text style={[styles.statsText, { color: colors.secondary }]}>
                        {catalog.length} items
                    </Text>
                </View>
                <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            isGridView && [styles.toggleButtonActive, { backgroundColor: colors.background }]
                        ]}
                        onPress={() => setIsGridView(true)}
                        activeOpacity={0.7}
                    >
                        <Grid size={20} color={isGridView ? colors.primary : colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            !isGridView && [styles.toggleButtonActive, { backgroundColor: colors.background }]
                        ]}
                        onPress={() => setIsGridView(false)}
                        activeOpacity={0.7}
                    >
                        <List size={20} color={!isGridView ? colors.primary : colors.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.searchContainer, {
                backgroundColor: colors.background,
                borderBottomColor: colors.border
            }]}>
                <View style={styles.searchRow}>
                    <View style={styles.searchBarWrapper}>
                        <TextInput
                            value={filters.searchQuery}
                            onChangeText={(text) => setFilters({ searchQuery: text })}
                            placeholder="Search catalog..."
                            style={[styles.searchInput, {
                                backgroundColor: colors.surface,
                                color: colors.text
                            }]}
                            placeholderTextColor={colors.secondary}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sortButton, { backgroundColor: colors.surface }]}
                        onPress={() => setShowSortModal(true)}
                        activeOpacity={0.7}
                    >
                        <ChevronDown size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: colors.surface }]}
                        onPress={() => router.push({
                            pathname: '/modals/filter',
                            params: {
                                data: JSON.stringify(catalog)
                            }
                        })}
                        activeOpacity={0.7}
                    >
                        <Filter size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading.fetchingCars ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={sortedAndFilteredCars}
                    renderItem={isGridView ? renderGridItem : renderListItem}
                    keyExtractor={item => item.id}
                    numColumns={isGridView ? 2 : 1}
                    key={isGridView ? 'grid' : 'list'}
                    contentContainerStyle={[
                        styles.listContent,
                        catalog.length === 0 && styles.emptyListContent
                    ]}
                    onRefresh={() => fetchCatalog(true)}
                    refreshing={loading.refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyStateContainer}>
                            <Text style={[styles.emptyStateText, { color: colors.text }]}>
                                No cars available
                            </Text>
                            <Text style={[styles.emptyStateSubtext, { color: colors.secondary }]}>
                                Please check back later for new additions
                            </Text>
                        </View>
                    }
                />
            )}

            {user?.plan === 'Free' && (
                <View style={[styles.premiumBanner, { backgroundColor: colors.primary }]}>
                    <Text style={styles.premiumText}>
                        Upgrade to premium to add unlimited items to your collection and wishlist!
                    </Text>
                </View>
            )}

            {showSortModal && (
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSortModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>
                        {sortOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.sortOption, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                    setFilters({ sortBy: option.value });
                                    setShowSortModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.sortOptionText,
                                    { color: filters.sortBy === option.value ? colors.primary : colors.text }
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
    },
    viewToggle: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        padding: 8,
        borderRadius: 6,
    },
    toggleButtonActive: {},
    searchContainer: {
        padding: 16,
        borderBottomWidth: 1,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchBarWrapper: {
        flex: 1,
    },
    searchInput: {
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    sortButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    imageContainer: {
        position: 'relative',
    },
    customImageIndicator: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        gap: 4,
    },
    indicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    gridCard: {
        flex: 1,
        margin: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    listCard: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    gridImage: {
        width: '100%',
        height: 150,
        resizeMode: 'contain',
    },
    listImage: {
        width: 100,
        height: 140,
        resizeMode: 'contain',
    },
    gridCardContent: {
        padding: 12,
    },
    listCardContent: {
        flex: 1,
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    cardDetail: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridActions: {
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    listActions: {
        flexDirection: 'column',
        padding: 8,
        justifyContent: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    sortOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    sortOptionText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    premiumBanner: {
        padding: 12,
    },
    premiumText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    statsText: {
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'Inter-Regular',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyListContent: {
        flexGrow: 1,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyStateText: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
});