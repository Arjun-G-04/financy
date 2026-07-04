import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(app)" />
        </Stack>
        <Toast />
      </ThemeProvider>
    </AuthProvider>
  );
}
