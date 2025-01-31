import React, { useState } from 'react';
import {
 View,
 Text,
 StyleSheet,
 TouchableOpacity,
 ScrollView,
 Platform,
 Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
 ChevronLeft,
 Star,
 Infinity,
 Clock,
 Crown,
 Check,
} from 'lucide-react-native';
import { useAuth } from '../../context/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';

interface Plan {
 id: 'free' | 'monthly' | 'yearly' | 'lifetime';
 name: string;
 price: string;
 period?: string;
 icon: React.ElementType;
 features: string[];
 buttonText: string;
 savings?: string;
}

export default function SubscriptionScreen() {
 const router = useRouter();
 const { theme } = useTheme();
 const colors = Colors[theme];
 const { user, upgradeToPremium, cancelSubscription } = useAuth();
 const [selectedPlan, setSelectedPlan] = useState<Plan['id'] | null>(null);
 const [currentPlan, setCurrentPlan] = useState<Plan['id']>(
   user?.plan === 'Premium' 
     ? user?.subscriptionExpiresAt 
       ? user?.subscriptionInterval === 'yearly' ? 'yearly' : 'monthly'
       : 'lifetime'
     : 'free'
 );
 const [isLoading, setIsLoading] = useState(false);

 const plans: Plan[] = [
   {
     id: 'free',
     name: 'Free',
     price: '0',
     icon: Star,
     features: [
       'Up to 10 cars in collection',
       'Up to 10 cars in wishlist',
       'Basic search features',
       'Includes ads'
     ],
     buttonText: 'Switch to Free'
   },
   {
     id: 'monthly',
     name: 'Monthly',
     price: '0.99',
     period: 'month',
     icon: Clock,
     features: [
       'Unlimited collection items',
       'Unlimited wishlist items',
       'Advanced search and filters',
       'No ads'
     ],
     buttonText: 'Subscribe Monthly'
   },
   {
     id: 'yearly',
     name: 'Yearly',
     price: '9.99',
     period: 'year',
     icon: Crown,
     features: [
       'Unlimited collection items',
       'Unlimited wishlist items',
       'Advanced search and filters',
       'No ads'
     ],
     buttonText: 'Subscribe Yearly',
     savings: 'Save ~17%'
   },
   {
     id: 'lifetime',
     name: 'Lifetime',
     price: '19.99',
     icon: Infinity,
     features: [
       'Unlimited collection items',
       'Unlimited wishlist items',
       'Advanced search and filters',
       'No ads',
       'All future updates included',
       'One-time payment'
     ],
     buttonText: 'Get Lifetime Access',
     savings: 'Best value'
   }
 ];

 const handlePlanSelect = (planId: Plan['id']) => {
   if (planId === currentPlan) {
     setSelectedPlan(null);
     return;
   }
   setSelectedPlan(planId);
 };

 const handleSubscribe = async (plan: Plan) => {
   if (!selectedPlan || isLoading) return;

   setIsLoading(true);
   try {
     if (plan.id !== 'free') {
       Alert.alert(
         'Confirm Subscription',
         `You will be charged $${plan.price}${plan.period ? ` per ${plan.period}` : ''}. Continue?`,
         [
           {
             text: 'Cancel',
             style: 'cancel',
             onPress: () => setIsLoading(false)
           },
           {
             text: 'Subscribe',
             onPress: async () => {
               try {
                 await upgradeToPremium(
                   plan.id === 'lifetime' ? 'lifetime' : 
                   plan.id === 'yearly' ? 'yearly' : 'monthly'
                 );
                 setCurrentPlan(plan.id);
                 setSelectedPlan(null);
                 Alert.alert(
                   'Success',
                   'Your subscription has been updated!',
                   [{ text: 'OK', onPress: () => router.back() }]
                 );
               } catch (error) {
                 Alert.alert('Error', 'Failed to process subscription. Please try again.');
               } finally {
                 setIsLoading(false);
               }
             }
           }
         ],
         { cancelable: true }
       );
     } else {
       try {
         await cancelSubscription();
         setCurrentPlan('free');
         setSelectedPlan(null);
         Alert.alert(
           'Plan Changed',
           'You have been switched to the free plan.',
           [{ text: 'OK', onPress: () => router.back() }]
         );
       } catch (error) {
         Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
       } finally {
         setIsLoading(false);
       }
     }
   } catch (error) {
     setIsLoading(false);
     Alert.alert('Error', 'An unexpected error occurred. Please try again.');
   }
 };

 return (
   <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
     <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
     <View style={[styles.header, { 
       borderBottomColor: colors.border,
       backgroundColor: colors.background 
     }]}>
       <TouchableOpacity
         style={styles.backButton}
         onPress={() => router.back()}
         disabled={isLoading}
       >
         <ChevronLeft size={24} color={colors.text} />
       </TouchableOpacity>
       <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription</Text>
     </View>

     <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
       <View style={styles.titleSection}>
         <Text style={[styles.title, { color: colors.text }]}>Choose Your Plan</Text>
         <Text style={[styles.subtitle, { color: colors.secondary }]}>
           Unlock unlimited access to your collection management
         </Text>
       </View>

       <View style={styles.plansContainer}>
         {plans.map((plan) => (
           <TouchableOpacity
             key={plan.id}
             style={[
               styles.planCard,
               { 
                 backgroundColor: colors.background,
                 borderColor: colors.border 
               },
               currentPlan === plan.id && [styles.currentPlanCard, { borderColor: colors.primary }],
               selectedPlan === plan.id && [styles.selectedPlanCard, { borderColor: colors.primary }]
             ]}
             onPress={() => handlePlanSelect(plan.id)}
             disabled={isLoading}
           >
             <View style={styles.planHeader}>
               <View style={styles.planInfo}>
                 <View style={[styles.planIconContainer, { backgroundColor: colors.surface }]}>
                   <plan.icon size={20} 
                     color={
                       currentPlan === plan.id ? '#22CC88' : 
                       selectedPlan === plan.id ? colors.primary : 
                       colors.text
                     } 
                   />
                 </View>
                 <View>
                   <Text style={[
                     styles.planName,
                     { color: colors.text },
                     currentPlan === plan.id && [styles.currentPlanText, { color: '#22CC88' }],
                     selectedPlan === plan.id && [styles.selectedPlanText, { color: colors.primary }]
                   ]}>
                     {plan.name}
                   </Text>
                   {plan.savings && (
                     <Text style={styles.savingsText}>{plan.savings}</Text>
                   )}
                 </View>
               </View>
               <View style={styles.priceContainer}>
                 <Text style={[styles.currency, { color: colors.text }]}>$</Text>
                 <Text style={[styles.price, { color: colors.text }]}>{plan.price}</Text>
                 {plan.period && (
                   <Text style={[styles.period, { color: colors.secondary }]}>/{plan.period}</Text>
                 )}
               </View>
             </View>

             <View style={styles.featuresContainer}>
               {plan.features.map((feature, index) => (
                 <View key={index} style={styles.featureRow}>
                   <Check size={16} color="#22CC88" />
                   <Text style={[styles.featureText, { color: colors.secondary }]}>{feature}</Text>
                 </View>
               ))}
             </View>

             {selectedPlan === plan.id && (
               <TouchableOpacity
                 style={[
                   styles.planButton,
                   { backgroundColor: colors.primary },
                   isLoading && styles.disabledButton
                 ]}
                 onPress={() => handleSubscribe(plan)}
                 disabled={isLoading}
               >
                 <Text style={styles.selectedPlanButtonText}>
                   {currentPlan === 'free' ? plan.buttonText : 'Switch Plan'}
                 </Text>
               </TouchableOpacity>
             )}
           </TouchableOpacity>
         ))}
       </View>

       <Text style={[styles.infoText, { color: colors.secondary }]}>
         All payments are processed securely through Apple Pay and Google Pay.
         You can cancel your subscription at any time.
       </Text>
     </ScrollView>
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
   paddingTop: Platform.OS === 'android' ? 16 : 0,
 },
 backButton: {
   padding: 4,
   marginRight: 8,
 },
 headerTitle: {
   fontSize: 18,
   fontFamily: 'Inter-SemiBold',
 },
 content: {
   flex: 1,
 },
 titleSection: {
   padding: 16,
   alignItems: 'center',
 },
 title: {
   fontSize: 24,
   fontFamily: 'Inter-Bold',
   textAlign: 'center',
 },
 subtitle: {
   fontSize: 14,
   fontFamily: 'Inter-Regular',
   textAlign: 'center',
   marginTop: 8,
 },
 plansContainer: {
   paddingHorizontal: 16,
   paddingBottom: 16,
 },
 planCard: {
   borderRadius: 16,
   padding: 16,
   marginBottom: 16,
   borderWidth: 2,
 },
 selectedPlanCard: {
  borderColor: '#0066FF',
},
currentPlanCard: {
  borderColor: '#22CC88',
},
 planHeader: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'flex-start',
   marginBottom: 16,
 },
 planInfo: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 planIconContainer: {
   width: 40,
   height: 40,
   borderRadius: 20,
   justifyContent: 'center',
   alignItems: 'center',
   marginRight: 12,
 },
 planName: {
   fontSize: 18,
   fontFamily: 'Inter-SemiBold',
 },
selectedPlanText: {
  color: '#0066FF',
},
currentPlanText: {
  color: '#22CC88',
},
 savingsText: {
   fontSize: 12,
   fontFamily: 'Inter-Medium',
   color: '#22CC88',
   marginTop: 2,
 },
 priceContainer: {
   flexDirection: 'row',
   alignItems: 'flex-start',
 },
 currency: {
   fontSize: 16,
   fontFamily: 'Inter-Regular',
   marginTop: 4,
 },
 price: {
   fontSize: 28,
   fontFamily: 'Inter-Bold',
   marginLeft: 1,
 },
 period: {
   fontSize: 14,
   fontFamily: 'Inter-Regular',
   marginTop: 8,
   marginLeft: 1,
 },
 featuresContainer: {
   marginBottom: 16,
 },
 featureRow: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 8,
 },
 featureText: {
   fontSize: 14,
   fontFamily: 'Inter-Regular',
   marginLeft: 8,
   flex: 1,
 },
 planButton: {
   height: 48,
   borderRadius: 8,
   justifyContent: 'center',
   alignItems: 'center',
 },
 disabledButton: {
   opacity: 0.5,
 },
 selectedPlanButtonText: {
   fontSize: 16,
   fontFamily: 'Inter-SemiBold',
   color: '#fff',
 },
 infoText: {
   fontSize: 12,
   fontFamily: 'Inter-Regular',
   textAlign: 'center',
   paddingHorizontal: 32,
   paddingBottom: 16,
   
 },
});