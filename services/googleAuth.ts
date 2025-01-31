// services/googleAuth.ts
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from 'config/firebase';
WebBrowser.maybeCompleteAuthSession();
export function useGoogleAuth() {
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: '370846716399-n9kmpk4iqar6eedilq006iuesvc9h9ar.apps.googleusercontent.com',
        iosClientId: '370846716399-rvc8uqaq0k0hrruphbtc5nt4sgbvlt5k.apps.googleusercontent.com',
    });
    async function signInWithGoogle() {
        try {
            const result = await promptAsync();

            if (result?.type === 'success') {
                const { id_token } = result.params;

                // Create Firebase credential
                const credential = GoogleAuthProvider.credential(id_token);

                // Sign in to Firebase with credential
                return signInWithCredential(auth, credential);
            }

            return null;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    }
    return {
        signInWithGoogle,
        isLoadingGoogle: !request,
    };
}