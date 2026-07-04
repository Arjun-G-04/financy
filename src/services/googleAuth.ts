import { GoogleSignin, User, statusCodes } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_STORE_KEY = 'financy_auth_session';

export interface AuthSession {
  user: User['user'] | null;
  accessToken: string | null;
}

// Config variables. In a real app, these would come from environment variables.
// The webClientId is crucial because it allows requesting OAuth2 scopes (like Google Sheets)
// and returns idToken / serverAuthCode.
export const GOOGLE_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
};

let isInitialized = false;

export const initGoogleAuth = () => {
  if (isInitialized) return;
  
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.webClientId || undefined,
      iosClientId: GOOGLE_CONFIG.iosClientId || undefined,
      offlineAccess: true,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
    isInitialized = true;
  } catch (error) {
    console.error('Failed to configure Google Sign-In:', error);
  }
};

export const GoogleAuthService = {
  async getStoredSession(): Promise<AuthSession | null> {
    try {
      if (Platform.OS === 'web') {
        const data = localStorage.getItem(SECURE_STORE_KEY);
        if (data) return JSON.parse(data) as AuthSession;
      } else {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          const data = await SecureStore.getItemAsync(SECURE_STORE_KEY);
          if (data) return JSON.parse(data) as AuthSession;
        }
      }
    } catch (error) {
      console.error('Error reading stored auth session:', error);
    }
    return null;
  },

  async saveSession(session: AuthSession): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(SECURE_STORE_KEY, JSON.stringify(session));
      } else {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(session));
        }
      }
    } catch (error) {
      console.error('Error saving auth session:', error);
    }
  },

  async clearSession(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(SECURE_STORE_KEY);
      } else {
        const isAvailable = await SecureStore.isAvailableAsync();
        if (isAvailable) {
          await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
        }
      }
    } catch (error) {
      console.error('Error clearing auth session:', error);
    }
  },

  async signIn(): Promise<AuthSession> {
    initGoogleAuth();
    
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      
      // Get access token for APIs
      const tokens = await GoogleSignin.getTokens();
      
      const session: AuthSession = {
        user: response.data?.user || null,
        accessToken: tokens.accessToken,
      };
      
      await this.saveSession(session);
      return session;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services are not available or outdated');
      } else {
        console.error('Google Sign-In Error details:', error);
        throw new Error(error.message || 'An error occurred during Google Sign-In');
      }
    }
  },
  
  async getFreshAccessToken(): Promise<string> {
    initGoogleAuth();
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.warn('Failed to get cached token, attempting silent sign-in:', error);
      try {
        await GoogleSignin.signInSilently();
        const tokens = await GoogleSignin.getTokens();
        return tokens.accessToken;
      } catch (silentError) {
        console.error('Silent sign-in failed:', silentError);
        throw new Error('Please sign in again to access Google Sheets.');
      }
    }
  },

  async signOut(): Promise<void> {
    await this.clearSession();
    initGoogleAuth();
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  }
};
