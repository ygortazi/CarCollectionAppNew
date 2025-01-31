import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Platform,
    ActivityIndicator,
    TextInput,
    Alert,
    ViewStyle,
    StyleProp,
    Pressable,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
    Grid,
    List,
    Filter,
    Camera,
    Pencil,
    Trash2,
    ChevronDown,
    Plus,
    Check,
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getUserCars, deleteCar, updateCarImages, uploadImage, generateStoragePath } from '../../services/firestone';
import * as ImagePicker from 'expo-image-picker';
import { useFilterStore } from '../../stores/filterStore';
import { FilterProcessor } from '../../utils/FilterProcessor';
import type { Car } from '../../types/models';

interface SortOption {
    label: string;
    value: 'recent' | 'purchase' | 'name' | 'priceHigh' | 'priceLow';
}

interface ActionButtonsProps {
    onCamera: () => void;
    onEdit: () => void;
    onDelete: () => void;
    style?: StyleProp<ViewStyle>;
    colors: any;
    isSelected?: boolean;
    onSelect?: () => void;
    selectionMode: boolean;
}

interface LoadingStates {
    fetchingCars: boolean;
    refreshing: boolean;
    deleting: boolean;
}

const sortOptions: SortOption[] = [
    { label: 'Recently Added', value: 'recent' },
    { label: 'Purchase Date', value: 'purchase' },
    { label: 'Name A-Z', value: 'name' },
    { label: 'Price High-Low', value: 'priceHigh' },
    { label: 'Price Low-High', value: 'priceLow' }
];

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onCamera,
    onEdit,
    onDelete,
    style,
    colors,
    isSelected,
    onSelect,
    selectionMode
}) => (
    <View style={[styles.actionButtons, style]}>
        {selectionMode ? (
            <TouchableOpacity
                style={[
                    styles.selectButton,
                    { backgroundColor: isSelected ? colors.primary : colors.surface }
                ]}
                onPress={onSelect}
                activeOpacity={0.7}
            >
                <Check size={20} color={isSelected ? '#fff' : colors.text} />
            </TouchableOpacity>
        ) : (
            <>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface }]}
                    onPress={onCamera}
                    activeOpacity={0.7}
                >
                    <Camera size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface }]}
                    onPress={onEdit}
                    activeOpacity={0.7}
                >
                    <Pencil size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface }]}
                    onPress={onDelete}
                    activeOpacity={0.7}
                >
                    <Trash2 size={20} color={colors.text} />
                </TouchableOpacity>
            </>
        )}
    </View>
);

export default function CollectionScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { filters, setFilters } = useFilterStore();

    const [isGridView, setIsGridView] = useState(true);
    const [collection, setCollection] = useState<Car[]>([]);
    const [loading, setLoading] = useState<LoadingStates>({
        fetchingCars: true,
        refreshing: false,
        deleting: false
    });
    const [isSortModalVisible, setIsSortModalVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [longPressAnim] = useState(new Animated.Value(1));

    const totalValue = useMemo(() => {
        return collection.reduce((sum, car) => {
            const price = parseFloat(car.purchasePrice) || 0;
            return sum + price;
        }, 0);
    }, [collection]);

    const toggleItemSelection = useCallback((carId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(carId)) {
                newSet.delete(carId);
                if (newSet.size === 0) {
                    setSelectionMode(false);
                }
            } else {
                newSet.add(carId);
            }
            return newSet;
        });
    }, []);

    const handleLongPress = useCallback((carId: string) => {
        setSelectionMode(true);
        toggleItemSelection(carId);
        Animated.sequence([
            Animated.timing(longPressAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(longPressAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [toggleItemSelection]);

    const handleBatchDelete = async () => {
        if (selectedItems.size === 0) return;

        Alert.alert(
            'Delete Selected Cars',
            `Are you sure you want to delete ${selectedItems.size} cars from your collection?`,
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(prev => ({ ...prev, deleting: true }));
                        try {
                            await Promise.all(
                                Array.from(selectedItems).map(id => deleteCar(id))
                            );
                            await fetchCollection();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete selected cars.');
                        } finally {
                            setLoading(prev => ({ ...prev, deleting: false }));
                        }
                    }
                }
            ]
        );
    };

    const fetchCollection = async (isRefreshing = false) => {
        if (!user) return;

        setLoading(prev => ({
            ...prev,
            [isRefreshing ? 'refreshing' : 'fetchingCars']: true
        }));

        try {
            const response = await getUserCars(user.uid);
            setCollection(response.cars);
            setSelectedItems(new Set());
            setSelectionMode(false);
        } catch (error) {
            console.error('Error fetching collection:', error);
            Alert.alert('Error', 'Failed to load your collection.');
        } finally {
            setLoading(prev => ({
                ...prev,
                [isRefreshing ? 'refreshing' : 'fetchingCars']: false
            }));
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCollection();
        }, [user])
    );

    const handleRefresh = useCallback(() => {
        fetchCollection(true);
    }, [user]);

    const sortedAndFilteredCars = useMemo(() => {
        return FilterProcessor.applyFilters(collection, filters);
    }, [collection, filters]);

    const handleAddPhotos = async (carId: string) => {
        if (!user) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                const filename = `car_${Date.now()}.jpg`;
                const path = generateStoragePath(user.uid, carId, filename);

                const downloadURL = await uploadImage(uri, path);
                await updateCarImages(carId, { uri, downloadURL, path });
                await fetchCollection();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add photos.');
        }
    };

    const handleEdit = useCallback((carId: string) => {
        router.push({
            pathname: '/(details)/edit-car',
            params: { id: carId }
        });
    }, [router]);

    const handleDelete = async (carId: string) => {
        Alert.alert(
            'Delete Car',
            'Are you sure you want to delete this car from your collection?',
            [
                { text: 'Cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(prev => ({ ...prev, deleting: true }));
                        try {
                            await deleteCar(carId);
                            await fetchCollection();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete car.');
                        } finally {
                            setLoading(prev => ({ ...prev, deleting: false }));
                        }
                    }
                }
            ]
        );
    };

    const renderGridItem = useCallback(({ item, index }: { item: Car, index: number }) => (
        <Pressable
            style={[
                styles.gridCard,
                {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    width: '47%',
                    marginRight: index % 2 === 0 ? '3%' : 0,
                },
                selectedItems.has(item.id) && styles.selectedCard
            ]}
            onPress={() => {
                if (selectionMode) {
                    toggleItemSelection(item.id);
                } else {
                    router.push({
                        pathname: '/(details)/car-details',
                        params: { id: item.id }
                    });
                }
            }}
            onLongPress={() => handleLongPress(item.id)}
            delayLongPress={300}
        >
            <Animated.View style={{ transform: [{ scale: longPressAnim }] }}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.images[0]?.downloadURL || '/api/placeholder/400/300' }}
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
                    <View style={[styles.purchaseInfo, { borderTopColor: colors.border }]}>
                        <Text style={[styles.priceText, { color: colors.primary }]}>
                            ${parseFloat(item.purchasePrice || '0').toFixed(2)}
                        </Text>
                        <Text style={[styles.dateText, { color: colors.secondary }]}>
                            {item.purchaseDate}
                        </Text>
                    </View>
                    <ActionButtons
                        style={styles.gridActions}
                        onCamera={() => handleAddPhotos(item.id)}
                        onEdit={() => handleEdit(item.id)}
                        onDelete={() => handleDelete(item.id)}
                        colors={colors}
                        isSelected={selectedItems.has(item.id)}
                        onSelect={() => toggleItemSelection(item.id)}
                        selectionMode={selectionMode}
                    />
                </View>
            </Animated.View>
        </Pressable>
    ), [router, handleAddPhotos, handleEdit, handleDelete, colors, selectedItems, selectionMode, toggleItemSelection]);

    const renderListItem = useCallback(({ item }: { item: Car }) => (
        <Pressable
            style={[
                styles.listCard,
                { backgroundColor: colors.background, borderColor: colors.border },
                selectedItems.has(item.id) && styles.selectedCard
            ]}
            onPress={() => {
                if (selectionMode) {
                    toggleItemSelection(item.id);
                } else {
                    router.push({
                        pathname: '/(details)/car-details',
                        params: { id: item.id }
                    });
                }
            }}
            onLongPress={() => handleLongPress(item.id)}
            delayLongPress={300}
        >
            <Animated.View style={[
                styles.listCardInner,
                { transform: [{ scale: longPressAnim }] }
            ]}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.images[0]?.downloadURL || '/api/placeholder/400/300' }}
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
                    <View style={[styles.purchaseInfo, { borderTopColor: colors.border }]}>
                        <Text style={[styles.priceText, { color: colors.primary }]}>
                            ${parseFloat(item.purchasePrice || '0').toFixed(2)}
                        </Text>
                        <Text style={[styles.dateText, { color: colors.secondary }]}>
                            {item.purchaseDate}
                        </Text>
                    </View>
                </View>
                <ActionButtons
                    style={styles.listActions}
                    onCamera={() => handleAddPhotos(item.id)}
                    onEdit={() => handleEdit(item.id)}
                    onDelete={() => handleDelete(item.id)}
                    colors={colors}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={() => toggleItemSelection(item.id)}
                    selectionMode={selectionMode}
                />
            </Animated.View>
        </Pressable>
    ), [router, handleAddPhotos, handleEdit, handleDelete, colors, selectedItems, selectionMode, toggleItemSelection]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>My Collection</Text>
                    <View style={styles.statsRow}>
                        <Text style={[styles.statsText, { color: colors.secondary }]}>
                            {collection.length}{user?.plan === 'Free' ? '/10' : ''} items
                        </Text>
                        <Text style={[styles.statsText, { color: colors.secondary }]}>•</Text>
                        <Text style={[styles.statsText, { color: colors.secondary }]}>
                            Value: ${totalValue.toFixed(2)}
                        </Text>
                    </View>
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
                            placeholder="Search collection..."
                            style={[styles.searchInput, {
                                backgroundColor: colors.surface,
                                color: colors.text
                            }]}
                            placeholderTextColor={colors.secondary}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sortButton, { backgroundColor: colors.surface }]}
                        onPress={() => setIsSortModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <ChevronDown size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: colors.surface }]}
                        onPress={() => router.push({
                            pathname: '/modals/filter',
                            params: {
                                data: JSON.stringify(collection)  // Stringify the data
                            }
                        })}
                        activeOpacity={0.7}
                    >
                        <Filter size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={sortedAndFilteredCars}
                renderItem={isGridView ? renderGridItem : renderListItem}
                keyExtractor={item => item.id}
                numColumns={isGridView ? 2 : 1}
                key={isGridView ? 'grid' : 'list'}
                contentContainerStyle={styles.listContent}
                onRefresh={handleRefresh}
                refreshing={loading.refreshing}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={[styles.emptyStateText, { color: colors.text }]}>
                            No cars in your collection yet.
                        </Text>
                    </View>
                }
            />

            {selectionMode ? (
                <TouchableOpacity
                    style={styles.batchDeleteButton}
                    onPress={handleBatchDelete}
                    activeOpacity={0.7}
                >
                    <Trash2 size={24} color="#fff" />
                    <Text style={styles.batchDeleteText}>
                        Delete Selected ({selectedItems.size})
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/(details)/add-car')}
                    activeOpacity={0.7}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            )}

            {isSortModalVisible && (
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsSortModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>
                        {sortOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.sortOption, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                    setFilters({ sortBy: option.value });
                                    setIsSortModalVisible(false);
                                }}
                                activeOpacity={0.7}
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
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            gap: 8,
        },
        statsText: {
            fontSize: 12,
            fontFamily: 'Inter-Regular',
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
            marginBottom: 16,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            overflow: 'hidden',
        },
        gridImage: {
            marginTop: 1,
            width: '100%',
            height: 90,
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
        purchaseInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
        },
        priceText: {
            fontSize: 14,
            fontFamily: 'Inter-SemiBold',
        },
        dateText: {
            fontSize: 12,
            fontFamily: 'Inter-Regular',
        },
        actionButtons: {
            flexDirection: 'row',
            gap: 8,
        },
        actionButton: {
            padding: 4,
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
        fab: {
            position: 'absolute',
            right: 16,
            bottom: Platform.OS === 'ios' ? 32 : 16,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
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
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyStateContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
        },
        emptyStateText: {
            fontSize: 16,
            fontFamily: 'Inter-Medium',
            textAlign: 'center',
        },
        selectedCard: {
            backgroundColor: 'rgba(0, 102, 255, 0.1)',
        },
        selectButton: {
            padding: 8,
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
        },
        listCardInner: {
            flexDirection: 'row',
            flex: 1,
        },
        batchDeleteButton: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 32 : 16,
            left: 16,
            right: 16,
            backgroundColor: '#FF3B30',
            padding: 16,
            borderRadius: 28,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
        },
        batchDeleteText: {
            color: '#fff',
            fontSize: 16,
            fontFamily: 'Inter-SemiBold',
        },
    });