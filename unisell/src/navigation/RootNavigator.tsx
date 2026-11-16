import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatScreen } from '../screens/ChatScreen';
import { DesignSystemScreen } from '../screens/DesignSystemScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ListingDetailsScreen } from '../screens/ListingDetailsScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ReserveScreen } from '../screens/ReserveScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { SellerDashboardScreen } from '../screens/SellerDashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { useTheme } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigation tree, driven by the auth state.
 *
 *   loading   -> branded loading screen (session restore)
 *   signedIn  -> Main tabs + Listing details
 *   signedOut -> Welcome + Login + Sign Up
 *
 * Because the screen groups are conditional, signing in or out swaps the
 * stack automatically - no manual navigation call is needed.
 */
export function RootNavigator() {
  const { status } = useAuth();
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [colors, isDark]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        {status === 'signedIn' ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
            <Stack.Screen name="Reserve" component={ReserveScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen
              name="SellerDashboard"
              component={SellerDashboardScreen}
            />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="DesignSystem" component={DesignSystemScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
