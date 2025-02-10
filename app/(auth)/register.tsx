import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ChevronLeft, ChevronDown } from 'lucide-react-native';
import { useAuth } from 'context/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from 'i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import PickerModal from '../../components/PickerModal';
import { updateUserPreferences } from '../../services/firestone';
import { DEFAULT_SETTINGS, UnifiedSettings } from '../../context/settings';

// Types
interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    language: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    country?: string;
    language?: string;
    general?: string;
}

interface Country {
    code: string;
    name: string;
}

const COUNTRIES: Country[] = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AU', name: 'Australia' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
    { code: 'CN', name: 'China' },
    { code: 'CD', name: 'DR Congo' },
    { code: 'EG', name: 'Egypt' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KR', name: 'South Korea' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MX', name: 'Mexico' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'RU', name: 'Russia' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'ES', name: 'Spain' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SE', name: 'Sweden' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TR', name: 'Turkey' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'OTHER', name: 'Other' }
];

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' }
];

export default function RegisterScreen() {
    const router = useRouter();
    const { signUp, handleGoogleSignIn, isLoading } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: '',
        language: i18n.language || 'en'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<Country | null>(null);

    const handleButtonPress = (callback: () => void) => {
        return () => {
            Keyboard.dismiss();
            callback();
        };
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Name validation
        if (!formData.name) {
            newErrors.name = 'Name is required';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Inside validateForm()
if (!formData.country) {
    newErrors.country = 'Please select your country';
}

if (!formData.language) {
    newErrors.language = 'Please select your language';
}

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;
    
        try {
            // First sign up the user
            await signUp(formData.email, formData.password, {
                name: formData.name,
                country: formData.country,
                language: formData.language
            });
    
            if (formData.language) {
                await i18n.changeLanguage(formData.language);
            }
       
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(
                    'Registration Failed',
                    error.message,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Registration Failed',
                    'An unexpected error occurred. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await handleGoogleSignIn();
            // Navigation is handled by the auth context
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(
                    'Google Sign-Up Failed',
                    error.message,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Google Sign-Up Failed',
                    'An unexpected error occurred. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                enableOnAndroid
                enableAutomaticScroll
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
                contentContainerStyle={{ paddingBottom: 20 }}
                scrollEnabled={true}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleButtonPress(() => router.back())}
                            disabled={isLoading}
                        >
                            <ChevronLeft size={24} color="#404040" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create Account</Text>
                    </View>
    
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Image
                                source={require('../../assets/icon.png')}
                                style={styles.logoImage}
                            />
                        </View>
                    </View>
    
                    {/* Form Fields */}
                    <View style={styles.form}>
                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Name</Text>
                            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                                <TextInput
                                    value={formData.name}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, name: text }));
                                        if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    placeholder="Enter your name"
                                    style={styles.input}
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.name && (
                                <Text style={styles.errorText}>{errors.name}</Text>
                            )}
                        </View>
    
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                <Mail size={20} color={errors.email ? '#FF3B30' : '#404040'} style={styles.inputIcon} />
                                <TextInput
                                    value={formData.email}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, email: text }));
                                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={styles.input}
                                    editable={!isLoading}
                                />
                            </View>
                            {errors.email && (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            )}
                        </View>
    
                        {/* Country Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Country</Text>
                            <TouchableOpacity
                                style={[styles.pickerButton, errors.country && styles.inputError]}
                                onPress={() => setShowCountryPicker(true)}
                            >
                                <Text style={[styles.pickerButtonText, selectedCountry && styles.pickerButtonTextSelected]}>
                                    {selectedCountry?.name || "Select your country"}
                                </Text>
                                <ChevronDown size={20} color="#404040" />
                            </TouchableOpacity>
                            {errors.country && (
                                <Text style={styles.errorText}>{errors.country}</Text>
                            )}
                        </View>
    
                        {/* Language Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Language</Text>
                            <TouchableOpacity
                                style={[styles.pickerButton, errors.language && styles.inputError]}
                                onPress={() => setShowLanguagePicker(true)}
                            >
                                <Text style={[styles.pickerButtonText, selectedLanguage && styles.pickerButtonTextSelected]}>
                                    {selectedLanguage?.name || "Select your language"}
                                </Text>
                                <ChevronDown size={20} color="#404040" />
                            </TouchableOpacity>
                            {errors.language && (
                                <Text style={styles.errorText}>{errors.language}</Text>
                            )}
                        </View>
    
                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                <Lock size={20} color={errors.password ? '#FF3B30' : '#404040'} style={styles.inputIcon} />
                                <TextInput
                                    value={formData.password}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, password: text }));
                                        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                                    }}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={errors.password ? '#FF3B30' : '#404040'} />
                                    ) : (
                                        <Eye size={20} color={errors.password ? '#FF3B30' : '#404040'} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <Text style={styles.errorText}>{errors.password}</Text>
                            )}
                        </View>
    
                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                                <Lock size={20} color={errors.confirmPassword ? '#FF3B30' : '#404040'} style={styles.inputIcon} />
                                <TextInput
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, confirmPassword: text }));
                                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                    }}
                                    placeholder="Confirm your password"
                                    secureTextEntry={!showConfirmPassword}
                                    style={styles.input}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color={errors.confirmPassword ? '#FF3B30' : '#404040'} />
                                    ) : (
                                        <Eye size={20} color={errors.confirmPassword ? '#FF3B30' : '#404040'} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            )}
                        </View>
    
                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleButtonPress(handleRegister)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.registerButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
    
                        {/* Google Signup Button */}
                        <TouchableOpacity
                            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
                            onPress={handleButtonPress(handleGoogleSignup)}
                            disabled={isLoading}
                        >
                            <Image
                                source={require('../../assets/google-logo.png')}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>
    
                        {/* Sign In Link */}
                        <View style={styles.signinContainer}>
                            <Text style={styles.signinText}>Already have an account? </Text>
                            <TouchableOpacity
                                onPress={handleButtonPress(() => router.back())}
                                disabled={isLoading}
                            >
                                <Text style={styles.signinLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
    
                    {/* Terms and Privacy */}
                    <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                            By continuing, you agree to our{' '}
                            <Text style={styles.termsLink}>Terms of Service</Text>
                            {' '}and{' '}
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                    </View>
                </View>
    
                <PickerModal
                    visible={showCountryPicker}
                    onClose={() => setShowCountryPicker(false)}
                    onSelect={(item: Country) => {
                        setSelectedCountry(item);
                        setFormData(prev => ({ ...prev, country: item.code }));
                        if (errors.country) setErrors(prev => ({ ...prev, country: undefined }));
                    }}
                    items={COUNTRIES}
                    title="Select Country"
                />
    
                <PickerModal
                    visible={showLanguagePicker}
                    onClose={() => setShowLanguagePicker(false)}
                    onSelect={(item: Country) => {
                        setSelectedLanguage(item);
                        setFormData(prev => ({ ...prev, language: item.code }));
                        if (errors.language) setErrors(prev => ({ ...prev, language: undefined }));
                    }}
                    items={LANGUAGES}
                    title="Select Language"
                />
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2A2A2A',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#0066FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    //tintColor: '#fff',//
  },
  form: {
    gap: 16,
    flex: 1,
    position: 'relative',
},
  inputContainer: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2A2A2A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#2A2A2A',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#0066FF80',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  googleButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  googleButtonDisabled: {
    borderColor: '#E8E8E880',
    backgroundColor: '#F5F5F5',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#2A2A2A',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signinText: {
    color: '#666666',
    fontFamily: 'Inter-Regular',
  },
  signinLink: {
    color: '#0066FF',
    fontFamily: 'Inter-SemiBold',
  },
  termsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  termsText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  termsLink: {
    color: '#0066FF',
    fontFamily: 'Inter-Medium',
  },

  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  pickerButtonText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666666',
  },
  pickerButtonTextSelected: {
    color: '#2A2A2A',
  },
});