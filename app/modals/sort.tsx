import { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import {
  Grid,
  List,
  Filter,
  Camera,
  Pencil,
  Trash2,
  ChevronDown,
  Plus,
} from 'lucide-react-native';
import { SearchBar } from '@rneui/themed';

// Sample collection data
const collection = [
  {
    id: '1',
    name: "2024 Custom '67 Ford Mustang GT500",
    series: "HW Speed Graphics",
    year: 2024,
    yearNumber: "012/250",
    seriesNumber: "2/10",
    color: "Metallic Blue",
    image: "https://via.placeholder.com/200x150",
    purchaseDate: "2024-01-15",
    purchasePrice: 3.99,
    customImages: ["https://via.placeholder.com/200x150"]
  },
  {
    id: '2',
    name: "'70 Dodge Charger R/T Special Edition",
    series: "HW Race Day",
    year: 2024,
    yearNumber: "045/250",
    seriesNumber: "4/10",
    color: "Racing Red",
    image: "https://via.placeholder.com/200x150",
    purchaseDate: "2024-01-20",
    purchasePrice: 4.99,
    customImages: []
  }
];

const sortOptions = [
  { label: 'Recently Added', value: 'recent' },
  { label: 'Purchase Date', value: 'purchase' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Price High-Low', value: 'priceHigh' },
  { label: 'Price Low-High', value: 'priceLow' }
];

const ActionButtons = ({ style }) => (
  <View style={[styles.actionButtons, style]}>
    <TouchableOpacity style={styles.actionButton}>
      <Camera size={20} color="#404040" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionButton}>
      <Pencil size={20} color="#404040" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionButton}>
      <Trash2 size={20} color="#404040" />
    </TouchableOpacity>
  </View>
);

const GridCard = ({ item }) => (
  <View style={styles.gridCard}>
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
      />
      {item.customImages.length > 0 && (
        <View style={styles.customImageIndicator}>
          {item.customImages.map((_, index) => (
            <View key={index} style={styles.indicatorDot} />
          ))}
        </View>
      )}
    </View>
    <View style={styles.gridCardContent}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.series} • {item.seriesNumber}</Text>
      <Text style={styles.cardDetail}>{item.year} • {item.yearNumber}</Text>
      <Text style={styles.cardDetail}>Color: {item.color}</Text>
      <View style={styles.purchaseInfo}>
        <Text style={styles.priceText}>${item.purchasePrice.toFixed(2)}</Text>
        <Text style={styles.dateText}>{item.purchaseDate}</Text>
      </View>
      <ActionButtons style={styles.gridActions} />
    </View>
  </View>
);

const ListCard = ({ item }) => (
  <View style={styles.listCard}>
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.image }}
        style={styles.listImage}
      />
      {item.customImages.length > 0 && (
        <View style={styles.customImageIndicator}>
          {item.customImages.map((_, index) => (
            <View key={index} style={styles.indicatorDot} />
          ))}
        </View>
      )}
    </View>
    <View style={styles.listCardContent}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.series} • {item.seriesNumber}</Text>
      <Text style={styles.cardDetail}>{item.year} • {item.yearNumber}</Text>
      <Text style={styles.cardDetail}>Color: {item.color}</Text>
      <View style={styles.purchaseInfo}>
        <Text style={styles.priceText}>${item.purchasePrice.toFixed(2)}</Text>
        <Text style={styles.dateText}>{item.purchaseDate}</Text>
      </View>
    </View>
    <ActionButtons style={styles.listActions} />
  </View>
);
export default function CollectionScreen() {
    const [isGridView, setIsGridView] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
  
    const totalValue = collection.reduce((sum, item) => sum + item.purchasePrice, 0);
  
    const sortedCollection = useCallback(() => {
      let sorted = [...collection];
      switch (sortBy) {
        case 'purchase':
          sorted.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
          break;
        case 'name':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'priceHigh':
          sorted.sort((a, b) => b.purchasePrice - a.purchasePrice);
          break;
        case 'priceLow':
          sorted.sort((a, b) => a.purchasePrice - b.purchasePrice);
          break;
        default:
          // recently added is default order
          break;
      }
      return sorted;
    }, [sortBy]);
  
    const SortModal = () => (
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Collection</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>2/10 items</Text>
              <Text style={styles.statsText}>•</Text>
              <Text style={styles.statsText}>Value: ${totalValue.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, isGridView && styles.toggleButtonActive]} 
              onPress={() => setIsGridView(true)}
            >
              <Grid size={20} color={isGridView ? '#0066FF' : '#404040'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, !isGridView && styles.toggleButtonActive]}
              onPress={() => setIsGridView(false)}
            >
              <List size={20} color={!isGridView ? '#0066FF' : '#404040'} />
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Search Bar and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchBarWrapper}>
              <SearchBar
                placeholder="Search collection..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                containerStyle={styles.searchBarContainer}
                inputContainerStyle={styles.searchBarInput}
                platform="default"
                lightTheme={true}
              />
            </View>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <ChevronDown size={20} color="#404040" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter size={20} color="#404040" />
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Content */}
        <FlatList
          data={sortedCollection()}
          renderItem={({ item }) => isGridView ? <GridCard item={item} /> : <ListCard item={item} />}
          keyExtractor={item => item.id}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? 'grid' : 'list'}
          contentContainerStyle={styles.listContent}
        />
          {/* Premium Banner */}
          <View style={styles.premiumBanner}>
            <Text style={styles.premiumText}>
              Upgrade to Premium to add unlimited items to your wishlist and remove ads!
            </Text>
          </View>

        {/* FAB */}
        <TouchableOpacity style={styles.fab}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
  
        {/* Modals */}
        <SortModal />
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
      fontWeight: 'bold',
      color: '#2A2A2A',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    statsText: {
      fontSize: 12,
      color: '#666666',
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
    searchBarContainer: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderBottomWidth: 0,
      padding: 0,
      marginVertical: -8,
    },
    searchBarInput: {
      backgroundColor: '#F5F5F5',
      borderRadius: 8,
      height: 40,
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
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#0066FF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
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
      backgroundColor: '#fff',
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
      fontWeight: '600',
      color: '#2A2A2A',
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 12,
      color: '#404040',
      marginBottom: 2,
    },
    cardDetail: {
      fontSize: 11,
      color: '#666666',
    },
    purchaseInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#E8E8E8',
    },
    priceText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0066FF',
    },
    dateText: {
      fontSize: 12,
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
      flex: 1,
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
      fontWeight: '600',
      color: '#2A2A2A',
      marginBottom: 16,
    },
    premiumBanner: {
        backgroundColor: '#0066FF',
        padding: 12,
      },
      premiumText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 14,
      },
    sortOption: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E8E8E8',
    },
    sortOptionText: {
      fontSize: 16,
      color: '#404040',
    },
    sortOptionSelected: {
      color: '#0066FF',
      fontWeight: '500',
    },
  });