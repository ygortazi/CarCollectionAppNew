import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, ExternalLink } from 'lucide-react-native';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const HelpSupportScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const handleEmailSupport = () => {
    const emailAddress = 'hello@carcollectionapp.com';
    const emailSubject = 'Car Collection App Support';
    const emailBody = 'Hi Car Collection App Team,\n\nI would like to talk about...\n\nThanks,\n[Your Name]';
    
    const emailUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    Linking.openURL(emailUrl);
  };
  
  const handleVisitWebsite = () => {
    const websiteUrl = 'https://www.carcollectionapp.com';
    
    Linking.openURL(websiteUrl);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.header, { 
        borderBottomColor: colors.border,
        backgroundColor: colors.background 
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={[styles.supportItem, { borderBottomColor: colors.border }]} onPress={handleEmailSupport}>
          <Mail size={24} color={colors.primary} />
          <Text style={[styles.supportItemText, { color: colors.primary }]}>Email Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.supportItem, { borderBottomColor: colors.border }]} onPress={handleVisitWebsite}>
          <ExternalLink size={24} color={colors.primary} />
          <Text style={[styles.supportItemText, { color: colors.primary }]}>Visit Website</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>When will you add new cars?</Text>
            <Text style={[styles.faqAnswer, { color: colors.secondary }]}>New cars are added to the catalog at least on a weekly basis. Newer models are added as soon as they become available to our team. If you cannot find a car in our catalog, feel free to create your own within your collection.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>Can I give you feedback to improve the app?</Text>
            <Text style={[styles.faqAnswer, { color: colors.secondary }]}>Yes! All feedback is welcome. We pay careful attention to our users to ensure that the app is constantly improving. If you have any suggestions, please send them to us at hello@carcollectionapp.com</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I add a car to my collection?</Text>
            <Text style={[styles.faqAnswer, { color: colors.secondary }]}>To add a car, go to the Catalog tab, find the car you want to add, and tap the "Add to Collection" button. Or you can manually add a new car to your collection within the Collection menu.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>How can I update my subscription?</Text>
            <Text style={[styles.faqAnswer, { color: colors.secondary }]}>To manage your subscription, go to the Profile tab and tap on the "Subscription" option. From there, you can choose a new plan or cancel your current subscription.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2A2A2A',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  supportItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#0066FF',
    marginLeft: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#404040',
    lineHeight: 20,
  },
});

export default HelpSupportScreen;