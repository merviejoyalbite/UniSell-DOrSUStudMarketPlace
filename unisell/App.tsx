import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ListingsProvider } from './src/context/ListingsContext';
import { MessagesProvider } from './src/context/MessagesContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { ReservationsProvider } from './src/context/ReservationsContext';
import { ReviewsProvider } from './src/context/ReviewsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GlobalWebStyles } from './src/components/GlobalWebStyles';

/**
 * App entry point.
 *
 * Responsibilities:
 *  1. Load the Poppins font family used by the Figma design.
 *  2. Restore the saved light/dark preference before the first app render.
 *  3. Mount the global providers (safe area, auth, listings, toasts).
 *  4. Hand control to the root navigator.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  return (
    <ThemeProvider>
      <AppShell fontsReady={fontsLoaded || Boolean(fontError)} />
    </ThemeProvider>
  );
}

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { ready, colors, isDark } = useTheme();

  // Wait for both the fonts and the stored theme so there is no flash of the
  // wrong palette on startup.
  if (!fontsReady || !ready) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]} />;
  }

  return (
    <SafeAreaProvider>
      <GlobalWebStyles />
      <AuthProvider>
        <ListingsProvider>
          <ReservationsProvider>
            <NotificationsProvider>
              <MessagesProvider>
                <ReviewsProvider>
                  <ToastProvider>
                    <StatusBar style={isDark ? 'light' : 'dark'} />
                    <RootNavigator />
                  </ToastProvider>
                </ReviewsProvider>
              </MessagesProvider>
            </NotificationsProvider>
          </ReservationsProvider>
        </ListingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
});
