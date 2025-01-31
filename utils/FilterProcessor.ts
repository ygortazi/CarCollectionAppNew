import { Car, FilterState } from '../types/models';

export class FilterProcessor {
    static applyFilters(items: Car[], filters: FilterState['filters']) {
        return items.filter(item => {
            const matchesSearch = !filters.searchQuery ||
                item.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                item.series.toLowerCase().includes(filters.searchQuery.toLowerCase());

            const matchesYear = filters.years.length === 0 ||
                filters.years.includes(item.year);

            const matchesSeries = filters.series.length === 0 ||
                filters.series.includes(item.series);

            const matchesColor = filters.colors.length === 0 ||
                filters.colors.includes(item.color);

            const matchesPrice = !filters.priceRange ||
                (Number(item.purchasePrice) >= filters.priceRange.min &&
                    Number(item.purchasePrice) <= filters.priceRange.max);

            return matchesSearch && matchesYear && matchesSeries &&
                matchesColor && matchesPrice;
        }).sort((a, b) => {
            switch (filters.sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'purchase': return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
                case 'priceHigh': return Number(b.purchasePrice) - Number(a.purchasePrice);
                case 'priceLow': return Number(a.purchasePrice) - Number(b.purchasePrice);
                default: return b.createdAt.getTime() - a.createdAt.getTime(); // 'recent' case
            }
        });
    }
}