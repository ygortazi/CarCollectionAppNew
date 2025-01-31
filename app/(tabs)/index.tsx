import React, { useState, useCallback, useEffect } from 'react';
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
import { getCatalog, addToCollection, addToWishlist } from 'services/firestone';
import type { Car } from 'types/models';

type PaginatedResponse = {
  items: Car[];
  lastDoc: any;
  hasMore: boolean;
};

interface SortOption {
  label: string;
  value: 'newest' | 'oldest' | 'name' | 'series';
}

interface ActionButtonsProps {
  onAddToCollection: () => void;
  onAddToWishlist: () => void;
  style?: StyleProp<ViewStyle>;
}

interface LoadingStates {
  fetchingCars: boolean;
  refreshing: boolean;
  addingToCollection: boolean;
  addingToWishlist: boolean;
}

const sortOptions: SortOption[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Series', value: 'series' }
];

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddToCollection, onAddToWishlist, style }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  return (
    <View style={[styles.actionButtons, style]}>
      <TouchableOpacity style={styles.actionButton} onPress={onAddToCollection}>
        <PlusCircle size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onAddToWishlist}>
        <Heart size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export default function CatalogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption['value']>('newest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [catalog, setCatalog] = useState<Car[]>([]);
  const [loading, setLoading] = useState<LoadingStates>({
    fetchingCars: true,
    refreshing: false, 
    addingToCollection: false,
    addingToWishlist: false
  });

  useEffect(() => {
    fetchCatalog();
  }, []);
  const fetchCatalog = async (isRefreshing = false) => {
    setLoading(prev => ({
      ...prev,
      [isRefreshing ? 'refreshing' : 'fetchingCars']: true
    }));
  
    try {
      const response = await getCatalog();
      setCatalog(response.items); // Just set the items array
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

const handleAddToCollection = async (car: Car) => {
    if (!user) return;

    setLoading(prev => ({ ...prev, addingToCollection: true }));
    try {
      await addToCollection(user.uid, car);  // Use id instead of uid
      Alert.alert('Success', 'Added to collection!');
    } catch (error) {
      console.error('Error adding to collection:', error);
      Alert.alert('Error', 'Failed to add to collection.');
    } finally {
      setLoading(prev => ({ ...prev, addingToCollection: false }));
    }
  };

  const handleAddToWishlist = async (car: Car) => {
    if (!user) return;

    setLoading(prev => ({ ...prev, addingToWishlist: true }));
    try {
      await addToWishlist(user.uid, car);
      Alert.alert('Success', 'Added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Alert.alert('Error', 'Failed to add to wishlist.');
    } finally {
      setLoading(prev => ({ ...prev, addingToWishlist: false }));
    }
  };

  const sortedCatalog = useCallback(() => {
    let sorted = [...catalog];
    switch (sortBy) {
      case 'oldest':
        sorted.reverse();
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'series':
        sorted.sort((a, b) => a.series.localeCompare(b.series));
        break;
      default:
        // newest first is default order
        break;
    }
    return sorted;
  }, [sortBy, catalog]);

  const renderGridItem = useCallback(({ item }: { item: Car }) => (
    <TouchableOpacity 
      style={[styles.gridCard, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => router.push({
        pathname: '/(details)/car-details-catalog',
        params: { id: item.id }
      })}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.images[0]?.downloadURL || '/api/placeholder/400/300' }} 
        style={styles.gridImage} 
      />
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
          onAddToWishlist={() => handleAddToWishlist(item)}
        />
      </View>
    </TouchableOpacity>
  ), [router, handleAddToCollection, handleAddToWishlist, colors]);
  const renderListItem = useCallback(({ item }: { item: Car }) => (
    <TouchableOpacity 
      style={[styles.listCard, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={() => router.push({
        pathname: '/(details)/car-details-catalog',
        params: { id: item.id }
      })}
      activeOpacity={0.7}  
    >
      <Image
        source={{ uri: item.images[0]?.downloadURL || '/api/placeholder/400/300' }}
        style={styles.listImage}
      />
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
        style={styles.listActions} 
        onAddToCollection={() => handleAddToCollection(item)}
        onAddToWishlist={() => handleAddToWishlist(item)}
      />
    </TouchableOpacity>
  ), [router, handleAddToCollection, handleAddToWishlist, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
     {/* Header */}
     <View style={[styles.header, { borderBottomColor: colors.border }]}>
       <View>
         <Text style={[styles.title, { color: colors.text }]}>Catalog</Text>
         <Text style={[styles.statsText, { color: colors.text }]}>{catalog.length} items</Text>
       </View>
       <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
         <TouchableOpacity 
           style={[
             styles.toggleButton, 
             isGridView && [styles.toggleButtonActive, { backgroundColor: colors.background }]
           ]} 
           onPress={() => setIsGridView(true)}
         >
          <Grid size={20} color={isGridView ? colors.primary : colors.secondary} />
         </TouchableOpacity>
         <TouchableOpacity 
           style={[
             styles.toggleButton, 
             !isGridView && [styles.toggleButtonActive, { backgroundColor: colors.background }]
           ]}
           onPress={() => setIsGridView(false)}
         >
           <List size={20} color={!isGridView ? colors.primary : colors.secondary} />
         </TouchableOpacity>
       </View>
     </View>

     {/* Search Bar and Filters */}
     <View style={[styles.searchContainer, { backgroundColor: colors.background,  borderBottomColor: colors.border }]}>
       <View style={styles.searchRow}>
         <View style={styles.searchBarWrapper}>
           <TextInput
             value={searchQuery}
             onChangeText={setSearchQuery}
             placeholder="Search cars..."
             placeholderTextColor={colors.secondary}
             style={[styles.searchInput, { 
               backgroundColor: colors.surface,
               color: colors.text
             }]}
           />
         </View>
         <TouchableOpacity 
           style={[styles.sortButton, { backgroundColor: colors.surface }]}
           onPress={() => setShowSortModal(true)}
         >
           <ChevronDown size={20} color={colors.text} />
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterButton, { backgroundColor: colors.surface }]}
           onPress={() => router.push('/modals/filter')}
         >
           <Filter size={20} color={colors.text} />
         </TouchableOpacity>
       </View>
     </View>

      {/* Content */}
      {loading.fetchingCars ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedCatalog()}
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

      {/* Sort Modal */}
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
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  { color: sortBy === option.value ? colors.primary : colors.text }
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2A2A2A',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2A2A2A',
  },
  sortButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  gridCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
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
    resizeMode: 'cover',
  },
  listImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
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
    color: '#2A2A2A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#404040',
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#666666',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  sortOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sortOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#404040',
  },
  sortOptionSelected: {
    color: '#0066FF',
    fontFamily: 'Inter-Medium',
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
  statsText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666666',
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