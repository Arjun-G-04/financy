import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { Svg, Path, Circle, Rect } from 'react-native-svg';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  const isDark = scheme === 'dark' || scheme === 'unspecified';

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await login();
    } catch (e: any) {
      console.warn('Google sign-in error:', e);
      setErrorMsg(e.message || 'Google Sign-In failed');
      Alert.alert(
        'Connection Info',
        'Google OAuth requires setting up Client IDs. Please configure your .env file with Client IDs.',
        [{ text: 'Got it' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          
          {/* Decorative Top Accent Glow */}
          <View style={[styles.glow, { backgroundColor: isDark ? '#10B981' : '#A7F3D0' }]} />

          {/* Logo & Brand Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.backgroundElement }]}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                {/* Abstract Finance safe/wallet icon */}
                <Rect x="2" y="5" width="20" height="14" rx="3" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
                <Circle cx="7" cy="12" r="2" fill="#10B981" />
                <Path d="M16 12H22" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                <Path d="M12 9V15" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>financy</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Your spreadsheets, structured. Your wealth, simplified.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#3B1A1A' : '#FEE2E2' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#EF4444' }]}>
                {errorMsg}
              </Text>
            </View>
          )}

          {/* Interactive Login Area */}
          <View style={styles.loginActions}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Securing connection...
                </Text>
              </View>
            ) : (
              <View style={styles.buttonStack}>
                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.text }]}
                  onPress={handleGoogleLogin}
                  activeOpacity={0.9}
                >
                  <View style={styles.buttonContent}>
                    {/* Google standard flat color G symbol */}
                    <Svg width={20} height={20} viewBox="0 0 24 24" style={styles.googleIcon}>
                      <Path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <Path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <Path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <Path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </Svg>
                    <Text style={[styles.primaryButtonText, { color: colors.background }]}>
                      Sign in with Google
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Syncs natively with your personal Google Sheets. No third-party servers store your banking credentials.
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.six,
    width: '100%',
  },
  glow: {
    position: 'absolute',
    top: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.12,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.six,
    gap: Spacing.two,
    width: '100%',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
    lineHeight: 22,
  },
  errorBox: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: 12,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginActions: {
    width: '100%',
    justifyContent: 'center',
    marginVertical: Spacing.five,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonStack: {
    width: '100%',
    gap: Spacing.three,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  googleIcon: {
    marginRight: Spacing.one,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  footer: {
    width: '100%',
    paddingHorizontal: Spacing.three,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
});
