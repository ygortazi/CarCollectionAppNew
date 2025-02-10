import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const TermsOfServiceScreen = () => {
 const router = useRouter();
 const { theme } = useTheme();
 const colors = Colors[theme];

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
       <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
     </View>

     <ScrollView style={styles.content}>
       <Text style={[styles.updatedText, { color: colors.secondary }]}>
         Last updated: January 20, 2025
       </Text>

       <View style={styles.section}>
         <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           By accessing and using the Car Collection App, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
         </Text>
       </View>

       <View style={styles.section}>
         <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Subscription Plans</Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           We offer the following subscription plans:
         </Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           • Free Plan: Limited to 10 cars in collection and wishlist{'\n'}
           • Monthly Plan ($0.99): Unlimited items and ad-free experience{'\n'}
           • Yearly Plan ($9.99): Unlimited items and ad-free experience{'\n'}
           • Lifetime Plan ($19.99): Unlimited items, ad-free experience, and all future updates
         </Text>
       </View>

       <View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>3. User Content</Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    When submitting content to the app (including custom images, descriptions, and other information), you grant us a non-exclusive license to use, modify, and display that content within the app.
  </Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    You agree not to submit content that is illegal, offensive, or violates any third-party rights.
  </Text>
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>4. User Submissions and Content Review</Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    New items and custom categories submitted by users will be reviewed by our administrators before being added to the catalog.
  </Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    We reserve the right to reject or modify any user-submitted content that doesn't meet our quality standards.
  </Text>
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Payment and Cancellation</Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    All payments are processed securely through Apple Pay and Google Pay. Subscriptions will automatically renew unless cancelled at least 24 hours before the end of the current period.
  </Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    Refunds are handled according to the respective app store's refund policies.
  </Text>
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Data Export and Backup</Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    Users can export their collection data in CSV format. While we maintain regular backups, users are encouraged to periodically export their data for personal backup purposes.
  </Text>
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Changes to Terms</Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or app notification. Continued use of the app after changes constitutes acceptance of the new terms.
  </Text>
</View>

<View style={styles.section}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Contact Us</Text>
  <Text style={[styles.sectionText, { color: colors.secondary }]}>
    If you have any questions about these Terms of Service, please contact us at hello@carcollectionapp.com.
  </Text>
</View>

  <Text style={[styles.versionText, { color: colors.secondary }]}>Document Version: 1.0</Text>
     </ScrollView>
   </SafeAreaView>
 );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  updatedText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 32,
  },
 });
 
 export default TermsOfServiceScreen;