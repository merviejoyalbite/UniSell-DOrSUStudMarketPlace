import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { BrandMark } from '../components/BrandMark';
import { BobbingView, PulseRing } from '../components/motion';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { useMessages } from '../context/MessagesContext';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { PostListingScreen } from '../screens/PostListingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  radii,
  spacing,
  useBreakpoint,
  useTheme,
} from '../theme';
import { ANIM_DURATION, ANIM_EASING, useReducedMotion } from '../lib/animations';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabItemConfig {
  name: keyof MainTabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

/**
 * Visible floating-bar order (mobile only). Search stays registered as a
 * hidden tab so the Home search pill and "See all" can still open it.
 */
const FLOATING_ITEMS: readonly TabItemConfig[] = [
  { name: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  {
    name: 'Favorites',
    label: 'Saved',
    icon: 'heart-outline',
    activeIcon: 'heart',
  },
  { name: 'Post', label: 'Sell', icon: 'add', activeIcon: 'add' },
  {
    name: 'Messages',
    label: 'Messages',
    icon: 'chatbubble-outline',
    activeIcon: 'chatbubble',
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

/** Sidebar rows. The Post route is rendered as the prominent CTA instead. */
const SIDEBAR_ITEMS = {
  Home: { label: 'Home', active: 'home', inactive: 'home-outline' },
  Favorites: { label: 'Saved', active: 'heart', inactive: 'heart-outline' },
  Messages: {
    label: 'Messages',
    active: 'chatbubble',
    inactive: 'chatbubble-outline',
  },
  Profile: { label: 'Profile', active: 'person', inactive: 'person-outline' },
} as const;

interface FloatingTabItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  isSell?: boolean;
  /** Unread count shown as a small pill on the icon (Messages). */
  badgeCount?: number;
  onPress: () => void;
}

function FloatingTabItem({
  label,
  icon,
  activeIcon,
  focused,
  isSell = false,
  badgeCount = 0,
  onPress,
}: FloatingTabItemProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);
  const [focusedRing, setFocusedRing] = useState(false);
  const badgeLabel = badgeCount > 9 ? '9+' : String(badgeCount);
  const reduced = useReducedMotion();

  const [iconScale] = useState(new Animated.Value(focused ? 1.1 : 1));
  const [sellPulse] = useState(new Animated.Value(1));
  const sellPulseTriggered = useRef(false);

  useEffect(() => {
    if (reduced) {
      iconScale.setValue(focused ? 1.1 : 1);
      return;
    }
    Animated.timing(iconScale, {
      toValue: focused ? 1.1 : 1,
      duration: ANIM_DURATION.fast,
      easing: ANIM_EASING,
      useNativeDriver: true,
    }).start();
  }, [focused, iconScale, reduced]);

  // Gentle pulse once on first load for the sell button.
  useEffect(() => {
    if (!isSell || sellPulseTriggered.current || reduced) return;
    sellPulseTriggered.current = true;
    Animated.loop(
      Animated.sequence([
        Animated.timing(sellPulse, {
          toValue: 1.05,
          duration: 2000,
          easing: ANIM_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(sellPulse, {
          toValue: 1,
          duration: 2000,
          easing: ANIM_EASING,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isSell, sellPulse, reduced]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        badgeCount > 0 ? `${label}, ${badgeCount} unread` : label
      }
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocusedRing(true)}
      onBlur={() => setFocusedRing(false)}
      style={({ pressed }) => [
        styles.item,
        !isSell && focused && styles.itemActive,
        hovered && styles.itemHovered,
        pressed && styles.itemPressed,
        focusedRing && styles.itemFocused,
      ]}
    >
      {isSell ? (
        <View style={styles.sellWrap}>
          <BobbingView amplitude={4} duration={2500}>
            <Animated.View style={{ transform: [{ scale: sellPulse }] }}>
              <View style={styles.sellCircle}>
                <LinearGradient
                  colors={[colors.accent, colors.accentStrong]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sellGradient}
                />
                <Ionicons name="add" size={28} color={colors.onAccent} />
              </View>
            </Animated.View>
          </BobbingView>
        </View>
      ) : (
        <View style={styles.iconWrap}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <Ionicons
              name={focused ? activeIcon : icon}
              size={22}
              color={focused ? colors.primary : colors.textMuted}
            />
          </Animated.View>
          {badgeCount > 0 ? (
            <View
              style={styles.badge}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
      )}
      <Text
        style={[
          styles.itemLabel,
          focused && !isSell && styles.itemLabelActive,
          isSell && styles.sellLabel,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Floating rounded bottom bar: Home · Saved · Sell (raised orange) · Messages ·
 * Profile. Mobile only.
 */
interface AppTabBarProps extends BottomTabBarProps {
  /** Unread messages shown on the Messages tab. */
  messageUnread: number;
}

function FloatingTabBar({
  state,
  navigation,
  insets,
  messageUnread,
}: AppTabBarProps) {
  const styles = useStyles();

  return (
    <View
      style={[
        styles.floatingBar,
        { bottom: Math.max(insets.bottom, layout.tabBarMargin) },
      ]}
    >
      {FLOATING_ITEMS.map((item) => {
        const route = state.routes.find((entry) => entry.name === item.name);
        if (!route) return null;

        const focused = state.routes[state.index]?.key === route.key;
        const isSell = item.name === 'Post';

        return (
          <FloatingTabItem
            key={item.name}
            label={item.label}
            icon={item.icon}
            activeIcon={item.activeIcon}
            focused={focused}
            isSell={isSell}
            badgeCount={item.name === 'Messages' ? messageUnread : 0}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Left navigation sidebar (desktop): logo, primary tabs, the orange "Post a
 * listing" call to action and the appearance toggle at the bottom.
 *
 * Rendered through `tabBarPosition: 'left'`, so React Navigation places it
 * beside the scrolling content at full viewport height.
 */
interface SidebarProps extends AppTabBarProps {
  /** Icon-only compact variant for tablets. */
  compact?: boolean;
}

function Sidebar({
  state,
  navigation,
  insets,
  messageUnread,
  compact = false,
}: SidebarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const indicatorTop = useRef(new Animated.Value(0)).current;
  const indicatorHeight = useRef(new Animated.Value(44)).current;
  const itemLayouts = useRef<Map<string, { y: number; height: number }>>(new Map());

  const focusedRoute = state.routes[state.index];
  const focusedKey = focusedRoute?.key ?? null;

  const moveIndicator = (key: string | null) => {
    const layout = key ? itemLayouts.current.get(key) : null;
    if (!layout) return;
    Animated.timing(indicatorTop, {
      toValue: layout.y,
      duration: 250,
      easing: ANIM_EASING,
      useNativeDriver: true,
    }).start();
    Animated.timing(indicatorHeight, {
      toValue: layout.height,
      duration: 250,
      easing: ANIM_EASING,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    moveIndicator(focusedKey);
  }, [focusedKey, moveIndicator]);

  return (
    <View
      style={[
        styles.sidebar,
        compact && styles.sidebarCompact,
        {
          paddingTop: insets.top + (compact ? spacing.lg : spacing.xl),
          paddingBottom: insets.bottom + (compact ? spacing.lg : spacing.xl),
        },
      ]}
    >
      <View style={[styles.brandRow, compact && styles.brandRowCompact]}>
        <BrandMark size={compact ? 36 : 40} />
        {compact ? null : <Text style={styles.brandName}>UniSell</Text>}
      </View>

      <View
        style={[styles.sidebarNav, { position: 'relative' }]}
      >
        {focusedKey ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.sidebarIndicator, { top: indicatorTop, height: indicatorHeight }]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const item =
            SIDEBAR_ITEMS[route.name as keyof typeof SIDEBAR_ITEMS];
          if (!item) return null;

          const isFocused = route.key === focusedKey;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isFocused }}
              onLayout={(e) => {
                itemLayouts.current.set(route.key, {
                  y: e.nativeEvent.layout.y,
                  height: e.nativeEvent.layout.height,
                });
                if (route.key === focusedKey) moveIndicator(route.key);
              }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) => [
                styles.sidebarItem,
                isFocused && styles.sidebarItemActive,
                pressed && styles.sidebarItemPressed,
                compact && styles.sidebarItemCompact,
              ]}
            >
              <Ionicons
                name={isFocused ? item.active : item.inactive}
                size={compact ? 22 : 20}
                color={isFocused ? colors.primary : colors.textMuted}
              />
              {compact ? null : (
                <Text
                  style={[
                    styles.sidebarLabel,
                    isFocused && styles.sidebarLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              )}
              {route.name === 'Messages' && messageUnread > 0 ? (
                <View
                  style={[
                    styles.sidebarBadge,
                    compact && styles.sidebarBadgeCompact,
                  ]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text style={styles.sidebarBadgeText}>
                    {messageUnread > 9 ? '9+' : messageUnread}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {compact ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a listing"
          onPress={() => navigation.navigate('Post')}
          style={({ pressed }) => [
            styles.railCta,
            pressed && styles.railCtaPressed,
          ]}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentStrong]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="add" size={24} color={colors.onAccent} />
        </Pressable>
      ) : (
        <View style={styles.sidebarCta}>
          <AppButton
            label="Post a listing"
            variant="accent"
            icon="add"
            fullWidth
            onPress={() => navigation.navigate('Post')}
          />
        </View>
      )}

      {compact ? null : (
        <View style={styles.sidebarFooter}>
          <Text style={styles.sidebarFooterLabel}>Appearance</Text>
          <ThemeSwitch />
        </View>
      )}
    </View>
  );
}

/**
 * Tab shell: Home · Saved · Sell · Messages · Profile.
 *
 * Desktop (>= 1024px): full left sidebar with the tab bar positioned on the
 * left. Tablet (768–1023px): compact icon-only sidebar on the left. Mobile
 * (< 768px): floating rounded bottom bar. Search is a hidden tab, opened from
 * the Home search pill and "See all".
 */
export function MainTabs() {
  const { isMobile, isTablet, sidebarWidth } = useBreakpoint();
  const { unreadCount: messageUnread } = useMessages();

  return (
    <Tab.Navigator
      tabBar={(props) => {
        if (isMobile) {
          return <FloatingTabBar {...props} messageUnread={messageUnread} />;
        }
        return isTablet ? (
          <Sidebar {...props} compact messageUnread={messageUnread} />
        ) : (
          <Sidebar {...props} messageUnread={messageUnread} />
        )
      }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        // Desktop and tablet place the sidebar on the left beside the content.
        tabBarPosition: isMobile ? 'bottom' : 'left',
        tabBarStyle: isMobile ? undefined : { width: sidebarWidth },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarAccessibilityLabel: 'Home feed' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Saved',
          tabBarAccessibilityLabel: 'Saved items',
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostListingScreen}
        options={{
          title: 'Sell',
          tabBarAccessibilityLabel: 'Post a listing',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarAccessibilityLabel: 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarAccessibilityLabel: 'Your profile' }}
      />

      {/* Registered so Home can navigate to it, but never shown in the bar. */}
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarAccessibilityLabel: 'Search listings',
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  floatingBar: {
    position: 'absolute',
    left: layout.tabBarMargin,
    right: layout.tabBarMargin,
    height: layout.tabBarHeight,
    borderRadius: radii.nav,
    borderWidth: 1,
    borderColor: colors.navBorder,
    backgroundColor: colors.navBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    overflow: 'visible',
    ...shadows.floating,
    zIndex: 20,
  },
  item: {
    flex: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: radii.md,
  },
  itemActive: {
    backgroundColor: colors.primaryLight,
  },
  itemHovered: {
    opacity: 0.9,
  },
  itemPressed: {
    transform: [{ scale: 0.96 }],
  },
  itemFocused: {
    borderWidth: 2,
    borderColor: colors.focusRing,
  },
  iconWrap: {
    width: 30,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.unread,
    borderWidth: 1.5,
    borderColor: colors.navBackground,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.white,
  },
  itemLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.textMuted,
  },
  itemLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  sellCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 3,
    borderColor: colors.navBackground,
    overflow: 'hidden',
    ...shadows.floating,
  },
  sellWrap: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  sellGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sellLabel: {
    color: colors.accentStrong,
  },
  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  sidebarCompact: {
    width: layout.sidebarWidthCompact,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    gap: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandRowCompact: {
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  sidebarNav: {
    gap: spacing.xs,
  },
  sidebarIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  sidebarItem: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sidebarItemCompact: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  sidebarItemActive: {
    backgroundColor: colors.primaryLight,
  },
  sidebarItemPressed: {
    opacity: 0.8,
  },
  sidebarLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
  },
  sidebarLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  sidebarBadge: {
    marginLeft: 'auto',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.unread,
  },
  sidebarBadgeCompact: {
    position: 'absolute',
    top: 3,
    right: 10,
    marginLeft: 0,
  },
  sidebarBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 13,
    color: colors.white,
  },
  sidebarCta: {
    marginTop: 'auto',
  },
  railCta: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  railCtaPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  sidebarFooter: {
    gap: spacing.sm,
  },
  sidebarFooterLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
}));
