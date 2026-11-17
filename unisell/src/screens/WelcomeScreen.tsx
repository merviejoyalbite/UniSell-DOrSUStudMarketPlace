import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { BrandMark } from '../components/BrandMark';
import { PesoMascot } from '../components/PesoMascot';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { WelcomeHero } from '../components/WelcomeHero';
import { FloatingShapes } from '../components/motion/FloatingShapes';
import { ShimmerButton } from '../components/motion/ShimmerButton';
import { TiltCard } from '../components/motion/TiltCard';
import { FadeInView } from '../lib/animations';
import { useReducedMotion } from '../lib/animations';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useBreakpoint,
  useTheme,
} from '../theme';

const VALUE_PROPS = [
  {
    icon: 'shield-checkmark-outline',
    label: 'Verified DOrSU students',
  },
  {
    icon: 'location-outline',
    label: 'Meet up on campus',
  },
  {
    icon: 'leaf-outline',
    label: 'Save money, reuse more',
  },
] as const;

/**
 * Value prop pill with staggered entrance + hover lift + icon scale/rotate.
 */
function ValuePropCard({
  item,
  index,
  colors,
  isCompact,
  isDesktop,
}: {
  item: (typeof VALUE_PROPS)[number];
  index: number;
  colors: any;
  isCompact: boolean;
  isDesktop: boolean;
}) {
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);
  const lift = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      lift.setValue(0);
      iconScale.setValue(1);
      iconRotate.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(lift, { toValue: hovered ? -4 : 0, friction: 7, tension: 120, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: hovered ? 1.12 : 1, friction: 7, tension: 120, useNativeDriver: true }),
      Animated.spring(iconRotate, { toValue: hovered ? 8 : 0, friction: 7, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [hovered, reduced, lift, iconScale, iconRotate]);

  return (
    <FadeInView slideUp={20} delay={index * 100} style={{ flex: 1, minWidth: 0 }}>
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.valueProp,
          isDesktop ? { flex: 1 } : { width: '100%' },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Animated.View
          style={[
            styles.valueIcon,
            {
              transform: [{ translateY: lift }, { scale: iconScale }, { rotate: iconRotate.interpolate({ inputRange: [0, 8], outputRange: ['0deg', '8deg'] }) }],
            },
            hovered && { backgroundColor: colors.primaryLight },
          ]}
        >
          <Ionicons name={item.icon} size={17} color={colors.primary} />
        </Animated.View>
        <Text style={styles.valueLabel}>{item.label}</Text>
      </Pressable>
    </FadeInView>
  );
}

/**
 * "I already have an account" button that fills with teal left-to-right on hover.
 */
function FillButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [hovered, setHovered] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      fill.setValue(hovered ? 1 : 0);
      return;
    }
    Animated.timing(fill, {
      toValue: hovered ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hovered, reduced, fill]);

  return (
    <Pressable onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      <View style={styles.fillButton}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fillButtonFill,
            { transform: [{ scaleX: fill }], transformOrigin: 'left' as any },
          ]}
        />
        <Text style={[styles.fillButtonText, hovered && { color: '#FFFFFF' }]}>{'I already have an account'}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Welcome / splash screen.
 */
export function WelcomeScreen({ navigation }: RootStackScreenProps<'Welcome'>) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width, isDesktop } = useBreakpoint();
  const isCompact = width < 360;
  const reduced = useReducedMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [entrance]);

  useEffect(() => {
    const anim = Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: Platform.OS !== 'web',
    });
    anim.start();
    return () => anim.stop();
  }, [logoScale]);

  useEffect(() => {
    const t = setTimeout(() => {
      const anim = Animated.timing(cardEntrance, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      });
      anim.start();
    }, 220);
    return () => clearTimeout(t);
  }, [cardEntrance]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const cardTranslateX = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [isDesktop ? 40 : 0, 0],
  });
  const cardTranslateY = cardEntrance.interpolate({
    inputRange: [0, 1],
    outputRange: [isDesktop ? 0 : 24, 0],
  });

  const navigateFade = useCallback((route: 'SignUp' | 'Login') => {
    navigation.navigate(route);
  }, [navigation]);

  const brandBlock = (
    <View style={styles.brandRow}>
      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <BrandMark size={64} />
      </Animated.View>
      <View style={styles.brandText}>
        <FadeInView slideUp={8} delay={80}>
          <Text style={styles.brandName}>UniSell</Text>
        </FadeInView>
        <FadeInView slideUp={8} delay={160}>
          <Text style={styles.brandTagline}>DOrSU student marketplace</Text>
        </FadeInView>
      </View>
    </View>
  );

  const heroBlock = (
    <View style={styles.hero}>
      <PesoMascot size={72} style={{ alignSelf: 'center', marginBottom: spacing.sm }} />
      <FadeInView slideUp={12} delay={220}>
        <Text
          accessibilityRole="header"
          style={[styles.heading, isCompact && styles.headingCompact]}
        >
          Buy and sell within campus.
        </Text>
      </FadeInView>
      <FadeInView slideUp={12} delay={320}>
        <Text style={styles.body}>
          Give textbooks, uniforms and dorm essentials a second life — with
          verified DOrSU students only.
        </Text>
      </FadeInView>
    </View>
  );

  const valueProps = (
    <View style={[styles.valueProps, isDesktop ? styles.valuePropsDesktop : styles.valuePropsMobile]}>
      {VALUE_PROPS.map((item, index) => (
        <ValuePropCard key={item.label} item={item} index={index} colors={colors} isCompact={isCompact} isDesktop={isDesktop} />
      ))}
    </View>
  );

  const actions = (
    <View style={[styles.actions, isDesktop && styles.actionsDesktop]}>
      <ShimmerButton
        label="Create an account"
        icon="person-add-outline"
        onPress={() => navigateFade('SignUp')}
      />
      <View style={styles.gap} />
      <FillButton onPress={() => navigateFade('Login')} />
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.primaryLight, colors.background]}
      locations={[0, 0.52, 1]}
      style={styles.safeArea}
    >
      <FloatingShapes
        shapes={[
          { size: 220, top: -60, left: -80, color: colors.primaryLight, duration: 26000, driftX: 30, driftY: 22 },
          { size: 180, top: 120, left: 260, color: colors.accentSoft, duration: 30000, driftX: -24, driftY: 18 },
          { size: 140, top: 360, left: 40, color: colors.primaryLight, duration: 22000, driftX: 20, driftY: -16 },
        ]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        parallax={0}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <ResponsiveContainer maxWidth={1040}>
            <Animated.View
              style={[
                styles.content,
                isDesktop && styles.contentDesktop,
                { opacity: entrance, transform: [{ translateY }] },
              ]}
            >
              {isDesktop ? (
                <>
                  <View style={styles.heroColumn}>
                    {brandBlock}
                    <WelcomeHero />
                    {heroBlock}
                    {valueProps}
                  </View>

                  <Animated.View
                    style={[
                      { opacity: cardEntrance, transform: [{ translateX: cardTranslateX }, { translateY: cardTranslateY }] },
                    ]}
                  >
                    <TiltCard maxTilt={4}>
                      <View style={styles.authCard}>
                        <Text style={styles.cardEyebrow}>Join the marketplace</Text>
                        <Text style={styles.cardTitle}>Start buying and selling</Text>
                        <Text style={styles.cardBody}>
                          Create your student account or sign in to pick up where you
                          left off.
                        </Text>
                        {actions}
                        <Text style={styles.footer}>Verified DOrSU students only</Text>
                      </View>
                    </TiltCard>
                  </Animated.View>
                </>
              ) : (
                <>
                  {brandBlock}
                  <WelcomeHero />
                  {heroBlock}
                  {valueProps}
                  <Animated.View
                    style={[
                      { opacity: cardEntrance, transform: [{ translateX: cardTranslateX }, { translateY: cardTranslateY }] },
                    ]}
                  >
                    {actions}
                  </Animated.View>
                  <Text style={styles.footer}>Verified DOrSU students only</Text>
                </>
              )}
            </Animated.View>
          </ResponsiveContainer>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  content: {
    flexGrow: 1,
    width: '100%',
  },
  contentDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxxl,
    paddingVertical: spacing.xxl,
  },
  heroColumn: {
    flex: 1,
    minWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandText: {
    flexShrink: 1,
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.primary,
  },
  brandTagline: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  hero: {
    marginTop: spacing.md,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
    marginBottom: spacing.md,
  },
  headingCompact: {
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
    maxWidth: 420,
  },
  valueProps: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  valuePropsDesktop: {
    flexDirection: 'row',
  },
  valuePropsMobile: {
    flexDirection: 'column',
  },
  valueProp: {
    minWidth: 0,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  valueLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.text,
    textAlign: 'center',
  },
  authCard: {
    width: 480,
    maxWidth: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    ...shadows.floating,
  },
  cardEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  cardTitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.text,
  },
  cardBody: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionsDesktop: {
    marginTop: spacing.lg,
    paddingTop: 0,
    marginBottom: 0,
  },
  gap: {
    height: spacing.sm,
  },
  footer: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fillButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  fillButtonFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    transformOrigin: 'left',
  },
  fillButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: lineHeights.sm,
    color: colors.primary,
    textAlign: 'center',
    zIndex: 1,
  },
}));
