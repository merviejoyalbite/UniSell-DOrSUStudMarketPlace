import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, spacing } from '../theme';

/**
 * Height reserved at the bottom of tab screens.
 *
 * The tab bar is a floating rounded card on every screen size, so the last
 * card needs enough padding to scroll clear of it.
 */
export function useTabBarBottomInset(): number {
  const insets = useSafeAreaInsets();
  const fallback = useBottomTabBarHeight();

  const floating =
    layout.tabBarHeight + Math.max(insets.bottom, layout.tabBarMargin) + spacing.sm;

  // Keep the larger of the measured navigator height and our floating bar so
  // the layout stays safe if React Navigation changes its default.
  return Math.max(fallback, floating);
}
