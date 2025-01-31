import { FilterState } from '../types/models';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class FilterHistory {
    private static readonly MAX_HISTORY = 10;

    static async saveFilter(filter: FilterState['filters']) {
        const history = await this.getHistory();
        const newHistory = [filter, ...history.slice(0, this.MAX_HISTORY - 1)];
        await AsyncStorage.setItem('filterHistory', JSON.stringify(newHistory));
    }

    static async getHistory(): Promise<FilterState['filters'][]> {
        const history = await AsyncStorage.getItem('filterHistory');
        return history ? JSON.parse(history) : [];
    }
}