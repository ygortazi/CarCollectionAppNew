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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from 'context/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface FormData {
    email: string;
    password: string;
}

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, handleGoogleSignIn, isLoading } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleButtonPress = (callback: () => void) => {
        return () => {
            Keyboard.dismiss();
            callback();
        };
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

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
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            await signIn(formData.email, formData.password);
            // Navigation is handled by the auth context
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(
                    'Login Failed',
                    error.message,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Login Failed',
                    'An unexpected error occurred. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await handleGoogleSignIn();
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert(
                    'Google Sign-In Failed',
                    error.message,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Google Sign-In Failed',
                    'An unexpected error occurred. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.content}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logo}>
                                <Image
                                    source={require('../../assets/icon.png')}
                                    style={styles.logoImage}
                                />
                            </View>
                            <Text style={styles.welcomeText}>Welcome</Text>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.form}>
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

                            {/* Login Button */}
                                <TouchableOpacity
                                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                                    onPress={handleButtonPress(handleLogin)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Sign In</Text>
                                    )}
                                </TouchableOpacity>

                            {/* Google Login Button */}
                                <TouchableOpacity
                                    style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
                                    onPress={handleButtonPress(handleGoogleLogin)}
                                    disabled={isLoading}
                                >
                                    <Image
                                        source={require('../../assets/google-logo.png')}
                                        style={styles.googleIcon}
                                    />
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </TouchableOpacity>

                                {/* Updated Sign Up Link */}
                                <View style={styles.signupContainer}>
                                    <Text style={styles.signupText}>Don't have an account? </Text>
                                    <TouchableOpacity
                                        onPress={handleButtonPress(() => router.push('/(auth)/register'))}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.signupLink}>Sign Up</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>

            {/* Terms and Privacy */}
            <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                    By continuing, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
            </View>
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
    flex: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#0066ff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    //tintColor: '#fff',//
  },
  welcomeText: {
    marginTop: 16,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2A2A2A',
  },
  form: {
    gap: 16,
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
  loginButton: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#0066FF80',
  },
  loginButtonText: {
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#666666',
    fontFamily: 'Inter-Regular',
  },
  signupLink: {
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
});