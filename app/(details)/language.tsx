import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useLanguage } from '../../context/language';
import { LANGUAGES } from '../../constants/Languages';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../context/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function LanguageSettings() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(''); // Track which language is being updated

  const handleLanguageChange = async (code: string) => {
    setLoading(code);
    try {
      await setLanguage(code);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoading('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Language</Text>
        </View>

        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageItem, { borderBottomColor: colors.border }]}
            onPress={() => handleLanguageChange(lang.code)}
            disabled={loading !== ''}
          >
            <Text style={[styles.languageName, { color: colors.text }]}>{lang.name}</Text>
            {loading === lang.code ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              language === lang.code && <Check size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});