import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { GoogleAuthService, AuthSession } from '@/services/googleAuth';

interface AuthContextType {
  user: AuthSession['user'] | null;
  accessToken: AuthSession['accessToken'] | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Load stored session on start
  useEffect(() => {
    async function loadSession() {
      try {
        const stored = await GoogleAuthService.getStoredSession();
        if (stored) {
          setSession(stored);
        }
      } catch (e) {
        console.error('Failed to load stored auth session', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  // Protect routes reactively based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(app)';
    const isAuthenticated = !!session;

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if trying to access protected screens
      router.replace('/');
    } else if (isAuthenticated && !inAuthGroup) {
      // Redirect to dashboard if logged in and on login screen
      router.replace('/dashboard');
    }
  }, [session, isLoading, segments]);

  const login = async () => {
    setIsLoading(true);
    try {
      const newSession = await GoogleAuthService.signIn();
      setSession(newSession);
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    setIsLoading(true);
    try {
      await GoogleAuthService.signOut();
      setSession(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        accessToken: session?.accessToken || null,
        isLoading,
        login,
        logout,
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
