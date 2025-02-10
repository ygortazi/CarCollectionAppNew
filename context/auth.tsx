import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
    Auth,
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
import { createUserDocument, getUserDocument, UserPreferences, setupUserStorage, } from '../services/user';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { updateUserPreferences, updateUserProfile } from '../services/firestone';
import { DEFAULT_SETTINGS } from './settings';

interface User {
    uid: string;
    name: string;
    email: string;
    plan: PlanType;
    collectionCount: number;
    wishlistCount: number;
    subscriptionExpiresAt?: string;
    subscriptionInterval?: SubscriptionInterval;
    preferences?: UserPreferences;
    deleted?: boolean;
    country: string; 
    language: string; 
}


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, userData: {
        name: string;
        country: string;
        language: string;
    }) => Promise<void>;
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
    // Remove useTheme dependency
    
    // Monitor auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const userDoc = await getUserDocument(firebaseUser.uid);
                    
                    if (userDoc) {
                        setUser({
                            uid: firebaseUser.uid,
                            name: userDoc.name,
                            email: userDoc.email,
                            plan: userDoc.plan,
                            collectionCount: userDoc.collectionCount,
                            wishlistCount: userDoc.wishlistCount,
                            preferences: userDoc.preferences,
                            deleted: userDoc.deleted,
                            subscriptionExpiresAt: userDoc.subscriptionExpiresAt?.toDate().toISOString(),
                            subscriptionInterval: userDoc.subscriptionInterval,
                            country: userDoc.country,
                            language: userDoc.language
                        });
                    } else {
                        setUser({
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName || 'User',
                            email: firebaseUser.email || '',
                            plan: 'Free',
                            collectionCount: 0,
                            wishlistCount: 0,
                            deleted: false,
                            country: 'US', // Default
                            language: 'en' // Default
                        });
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
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
                    throw new Error('User account not found');
                case AuthErrorCodes.INVALID_PASSWORD:
                    throw new Error('Invalid password');
                case AuthErrorCodes.EMAIL_EXISTS:
                    throw new Error('This email is already registered');
                case AuthErrorCodes.WEAK_PASSWORD:
                    throw new Error('Password should be at least 6 characters');
                case 'auth/requires-recent-login':
                    throw new Error('Please log in again to perform this action');
                default:
                    // Log the error code for debugging
                    console.error('Firebase error code:', error.code);
                    throw new Error('An error occurred. Please try again.');
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

    const signUp = useCallback(async (email: string, password: string, userData: {
        name: string;
        country: string;
        language: string;
    }) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: userData.name
                });
    
                await createUserDocument({
                    uid: userCredential.user.uid,
                    name: userData.name,
                    email: userCredential.user.email || '',
                    plan: 'Free',
                    country: userData.country,
                    language: userData.language
                 });
    
                // Add this line here
                await updateUserPreferences(userCredential.user.uid, {
                    preferences: {
                        ...DEFAULT_SETTINGS,
                        language: userData.language
                    }
                 });
    
                await setupUserStorage(userCredential.user.uid);
    
                // Update local user state immediately
                setUser({
                    uid: userCredential.user.uid,
                    name: userData.name,
                    email: userCredential.user.email || '',
                    plan: 'Free',
                    collectionCount: 0,
                    wishlistCount: 0,
                    deleted: false,
                    country: userData.country,
                    language: userData.language
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
            const result = await signInWithGoogle();
            
            if (result?.user) {
                // Check if user document exists
                const userDoc = await getUserDocument(result.user.uid);
                
                if (!userDoc) {
                    // Create user document if it doesn't exist
                    await createUserDocument({
                        uid: result.user.uid,
                        name: result.user.displayName || 'User',
                        email: result.user.email || '',
                        plan: 'Free',
                        country: 'US', // Default country
                        language: 'en'  // Default language
                    });
    
                    // Setup storage paths for the new user
                    await setupUserStorage(result.user.uid);
                }
            }
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
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: newUsername
            });
    
            // Update only the users collection document
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userRef, {
                name: newUsername,
                updatedAt: serverTimestamp()
            }, { merge: true });
    
            // Update local user state
            setUser(prev => prev ? {
                ...prev,
                name: newUsername
            } : null);
    
        } catch (error) {
            console.error('Username change error:', error);
            if (error instanceof Error) {
                throw error;
            } else {
                throw new Error('Failed to update username');
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

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