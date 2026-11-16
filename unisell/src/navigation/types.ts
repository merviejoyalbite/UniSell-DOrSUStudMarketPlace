import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';

/**
 * Navigation parameter lists.
 *
 * Keeping them typed means a screen cannot navigate to a route that does not
 * exist, and route params are checked at compile time.
 */

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ListingDetails: { listingId: number };
  Reserve: { listingId: number };
  Chat: { chatId: number };
  SellerDashboard: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  /** `listingId` opens the rate-and-review form for a completed sale. */
  Review: { listingId: number };
  Settings: undefined;
  DesignSystem: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  /** `listingId` puts the shared form into edit mode. */
  Post: { listingId?: number } | undefined;
  Favorites: undefined;
  Messages: undefined;
  /** Deep links can open the Profile tab on the shop or My reviews panel. */
  Profile:
    | {
        tab?: 'profile' | 'shop';
        panel?: 'menu' | 'listings' | 'reviews';
        /** Bumped by deep links so the same target can open twice. */
        nonce?: number;
      }
    | undefined;
};

/** Props for screens that live in the root stack. */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/** Props for tab screens that may also push root-level screens. */
export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
