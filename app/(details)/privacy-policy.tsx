import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const PrivacyPolicyScreen = () => {
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
       <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
     </View>

     <ScrollView style={styles.content}>
       <Text style={[styles.updatedText, { color: colors.secondary }]}>Last updated: January 20, 2025</Text>

       <View style={styles.section}>
         <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           When you use the Car Collection App, we may collect certain information, including:
         </Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           • Email address for account creation and communication{'\n'}
           • App usage data to improve user experience{'\n'}  
           • Device information for compatibility and support purposes{'\n'}
           • In-app purchase history for subscription management
         </Text>
       </View>

       {/* Continue updating all sections similarly */}
       {/* Example of one more section: */}
       <View style={styles.section}>  
         <Text style={[styles.sectionTitle, { color: colors.text }]}>2. How We Use Your Information</Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           We use the collected information to:
         </Text>
         <Text style={[styles.sectionText, { color: colors.secondary }]}>
           • Provide and maintain the Car Collection App service{'\n'}
           • Notify you of updates, features, and important information{'\n'}
           • Respond to customer support inquiries{'\n'}
           • Analyze app usage to improve user experience and fix issues{'\n'} 
           • Process and manage your subscription
         </Text>
       </View>

       {/* Update remaining sections accordingly */}

       <Text style={[styles.versionText, { color: colors.secondary }]}>Document Version: 1.0</Text>  
     </ScrollView>
   </SafeAreaView>
 );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  updatedText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#404040',
    lineHeight: 22,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default PrivacyPolicyScreen;