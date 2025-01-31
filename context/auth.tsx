import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    AuthErrorCodes,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { subscriptionService, PlanType, SubscriptionInterval } from '../services/subscription';
import { useGoogleAuth } from '../services/googleAuth';
import LoadingScreen from '../components/LoadingScreen';

interface User {
    uid: string;
    name: string;
    email: string;
    plan: PlanType;
    subscriptionExpiresAt?: string;
    subscriptionInterval?: SubscriptionInterval;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    handleGoogleSignIn: () => Promise<void>;
    changeUsername: (newUsername: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    upgradeToPremium: (interval: SubscriptionInterval) => Promise<void>;
    cancelSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { signInWithGoogle, isLoadingGoogle } = useGoogleAuth();

    // Monitor auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userData: User = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    plan: 'Free'
                };
                setUser(userData);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helper to handle Firebase auth errors
    const handleAuthError = (error: unknown) => {
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case AuthErrorCodes.INVALID_EMAIL:
                    throw new Error('Invalid email address');
                case AuthErrorCodes.USER_DISABLED:
                    throw new Error('This account has been disabled');
                case AuthErrorCodes.USER_DELETED:
                case AuthErrorCodes.INVALID_PASSWORD:
                    throw new Error('Invalid email or password');
                case AuthErrorCodes.EMAIL_EXISTS:
                    throw new Error('This email is already registered');
                case AuthErrorCodes.WEAK_PASSWORD:
                    throw new Error('Password should be at least 6 characters');
                default:
                    throw new Error('Password did not match. Please try again.');
            }
        }
        throw error;
    };

    const signIn = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // User state will be updated by the auth state observer
        } catch (error) {
            handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with name if provided and wait for it to complete
            if (displayName && userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });

                // Manually update the user state after profile update
                setUser({
                    uid: userCredential.user.uid,
                    name: displayName,
                    email: userCredential.user.email || '',
                    plan: 'Free'
                });
            }
        } catch (error) {
            handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleGoogleSignIn = useCallback(async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [signInWithGoogle]);

    const signOut = useCallback(async () => {
        setIsLoading(true);
        try {
            await firebaseSignOut(auth);
            // User state will be updated by the auth state observer
        } catch (error) {
            console.error('Sign out error:', error);
            throw new Error('Failed to sign out. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const changeUsername = useCallback(async (newUsername: string) => {
        if (!auth.currentUser) throw new Error('No user logged in');

        setIsLoading(true);
        try {
            await updateProfile(auth.currentUser, {
                displayName: newUsername
            });

            // Update local user state
            setUser(prev => prev ? {
                ...prev,
                name: newUsername
            } : null);

        } catch (error) {
            handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        if (!auth.currentUser || !auth.currentUser.email) {
            throw new Error('No user logged in');
        }

        setIsLoading(true);
        try {
            // First reauthenticate
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Then update password
            await updatePassword(auth.currentUser, newPassword);
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case AuthErrorCodes.INVALID_PASSWORD:
                        throw new Error('Current password is incorrect');
                    case AuthErrorCodes.WEAK_PASSWORD:
                        throw new Error('New password is too weak');
                    default:
                        handleAuthError(error);
                }
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const upgradeToPremium = useCallback(async (interval: SubscriptionInterval) => {
        if (!user) throw new Error('No user logged in');

        setIsLoading(true);
        try {
            const response = await subscriptionService.subscribeToPlan(
                user.uid,
                interval === 'lifetime' ? 'lifetime' : 'premium',
                interval
            );

            if (!response.success) {
                throw new Error(response.error || 'Subscription failed');
            }

            const updatedUser = {
                ...user,
                plan: response.plan,
                subscriptionExpiresAt: response.expiresAt,
                subscriptionInterval: interval
            };

            setUser(updatedUser);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const cancelSubscription = useCallback(async () => {
        if (!user) throw new Error('No user logged in');

        setIsLoading(true);
        try {
            const response = await subscriptionService.cancelSubscription(user.uid);

            if (!response.success) {
                throw new Error(response.error || 'Cancellation failed');
            }

            const updatedUser = {
                ...user,
                plan: response.plan,
                subscriptionExpiresAt: undefined,
                subscriptionInterval: undefined
            };

            setUser(updatedUser);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    if (isLoading || isLoadingGoogle) {
        return <LoadingScreen />;
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signIn,
                signOut,
                signUp,
                handleGoogleSignIn,
                changeUsername,
                changePassword,
                upgradeToPremium,
                cancelSubscription
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}