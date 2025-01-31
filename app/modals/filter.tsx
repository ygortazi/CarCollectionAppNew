import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { useFilterStore } from '../../stores/filterStore';
import { FilterHistory } from '../../services/FilterHistory';
import type { FilterState, Car } from '../../types/models';

interface FilterSection {
    id: keyof FilterState['filters'];
    title: string;
    items: string[];
}

interface FilterSectionProps {
    title: string;
    items: string[];
    selected: string[];
    onSelect: (items: string[]) => void;
    expanded: boolean;
    onToggle: () => void;
    colors: any;
}

const FilterSection: React.FC<FilterSectionProps> = ({
    title,
    items,
    selected,
    onSelect,
    expanded,
    onToggle,
    colors,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const toggleAll = () => {
        if (selected.length === items.length) {
            onSelect([]);
        } else {
            onSelect([...items]);
        }
    };

    const toggleItem = (item: string) => {
        if (selected.includes(item)) {
            onSelect(selected.filter(i => i !== item));
        } else {
            onSelect([...selected, item]);
        }
    };

    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                    <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={toggleAll}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: colors.border },
                            selected.length === items.length && [styles.checkboxSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                        ]} />
                    </TouchableOpacity>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                    {selected.length > 0 && (
                        <TouchableOpacity
                            onPress={() => onSelect([])}
                            style={styles.clearButton}
                        >
                            <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.expandButton} onPress={onToggle}>
                    {expanded ? (
                        <ChevronUp size={20} color={colors.text} />
                    ) : (
                        <ChevronDown size={20} color={colors.text} />
                    )}
                </TouchableOpacity>
            </View>

            {expanded && (
                <View style={styles.sectionContent}>
                    <TextInput
                        style={[styles.searchInput, {
                            backgroundColor: colors.surface,
                            color: colors.text
                        }]}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.secondary}
                    />
                    <View style={styles.itemsGrid}>
                        {filteredItems.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.itemButton}
                                onPress={() => toggleItem(item)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    { borderColor: colors.border },
                                    selected.includes(item) && [styles.checkboxSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                                ]} />
                                <Text style={[
                                    styles.itemText,
                                    { color: colors.text },
                                    selected.includes(item) && [styles.itemTextSelected, { color: colors.primary }]
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};


export default function FilterModal() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { filters, setFilters, resetFilters } = useFilterStore();

    const data: Car[] = useMemo(() => {
        if (!params.data) return [];
        return JSON.parse(params.data as string);
    }, [params.data]);

    const generateFilterData = useCallback(() => {
        const years = new Set<string>();
        const series = new Set<string>();
        const colors = new Set<string>();
        const stores = new Set<string>();

        data.forEach(car => {
            if (car.year) years.add(car.year);
            if (car.series) series.add(car.series);
            if (car.color) colors.add(car.color);
            if (car.purchaseStore) stores.add(car.purchaseStore);
        });

        return [
            {
                id: 'years',
                title: 'Year',
                items: Array.from(years).sort((a, b) => Number(b) - Number(a))
            },
            {
                id: 'series',
                title: 'Series',
                items: Array.from(series).sort()
            },
            {
                id: 'colors',
                title: 'Color',
                items: Array.from(colors).sort()
            },
            {
                id: 'stores',
                title: 'Store',
                items: Array.from(stores).sort()
            }
        ] as FilterSection[];
    }, [data]);

    const filterData = generateFilterData();

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
        Object.fromEntries(filterData.map(section => [section.id, false]))
    );

    const handleSectionToggle = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleSelectionChange = (sectionId: keyof FilterState['filters'], selectedItems: string[]) => {
        setFilters({ [sectionId]: selectedItems });
    };

    const getActiveFilterCount = () => {
        return Object.values(filters).reduce(
            (count, selections) => count + (Array.isArray(selections) ? selections.length : 0),
            0
        );
    };

    const handleApplyFilters = async () => {
        await FilterHistory.saveFilter(filters);
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <View style={[styles.header, {
                borderBottomColor: colors.border,
                backgroundColor: colors.background
            }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
                    {getActiveFilterCount() > 0 && (
                        <TouchableOpacity
                            onPress={resetFilters}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear all</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {filterData.map((section) => (
                    <FilterSection
                        key={section.id}
                        title={section.title}
                        items={section.items}
                        selected={filters[section.id] as string[] || []}
                        onSelect={(selectedItems) => handleSelectionChange(section.id, selectedItems)}
                        expanded={expandedSections[section.id]}
                        onToggle={() => handleSectionToggle(section.id)}
                        colors={colors}
                    />
                ))}
            </ScrollView>

            <View style={[styles.footer, {
                borderTopColor: colors.border,
                backgroundColor: colors.background
            }]}>
                <TouchableOpacity
                    style={[
                        styles.applyButton,
                        { backgroundColor: colors.primary },
                        getActiveFilterCount() === 0 && { opacity: 0.5 }
                    ]}
                    onPress={handleApplyFilters}
                    disabled={getActiveFilterCount() === 0}
                    activeOpacity={0.7}
                >
                    <Text style={styles.applyButtonText}>
                        Apply Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    closeButton: { padding: 4 },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    clearAllText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    content: { flex: 1 },
    filterSection: { borderBottomWidth: 1 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectAllButton: { marginRight: 12 },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
    },
    checkboxSelected: { borderWidth: 0 },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    clearButton: { marginLeft: 12 },
    clearButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    expandButton: { padding: 4 },
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchInput: {
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    itemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        width: '48%',
    },
    itemText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    itemTextSelected: { fontFamily: 'Inter-Medium' },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    applyButton: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});