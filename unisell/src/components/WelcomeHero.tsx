import { Ionicons } from '@expo/vector-icons';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useWindowDimensions } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import { FloatingCard } from './motion/FloatingCard';

interface HeroItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint: string;
  border: string;
  iconColor: string;
  badge?: { icon: keyof typeof Ionicons.glyphMap; color: string };
}

const ITEMS: HeroItem[] = [
  {
    icon: 'book-outline',
    label: 'Textbooks',
    tint: 'rgba(31, 122, 114, 0.18)',
    border: '#1F7A72',
    iconColor: '#1F7A72',
    badge: { icon: 'sparkles', color: '#1F7A72' },
  },
  {
    icon: 'shirt-outline',
    label: 'Uniforms',
    tint: 'rgba(244, 162, 97, 0.18)',
    border: '#D97A2B',
    iconColor: '#D97A2B',
  },
  {
    icon: 'bulb-outline',
    label: 'Dorm finds',
    tint: 'rgba(127, 214, 196, 0.22)',
    border: '#4FA99A',
    iconColor: '#4FA99A',
    badge: { icon: 'leaf', color: '#4FA99A' },
  },
];

/**
 * Vector-only welcome artwork.
 *
 * Three category circles (Textbooks, Uniforms, Dorm finds) sit in a single
 * horizontal row above the headline. Each circle floats gently and reacts to
 * the cursor on web. No rotations, no scattered positions.
 */
export function WelcomeHero() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();

  const circleSize =
    width >= 1024 ? 104 : width >= 768 ? 88 : width < 360 ? 64 : 76;

  return (
    <View
      style={styles.stage}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Big faint background circle, centered behind the row. */}
      <View style={styles.bgCircle} pointerEvents="none" />

      <View style={styles.row}>
        {ITEMS.map((item, index) => (
          <FloatingCard
            key={item.label}
            idleAmplitude={6}
            idleDuration={3000 + index * 700}
            idleDelay={index * 250}
            parallaxDepth={1 + index * 0.15}
            swayAmplitude={0}
            hoverLift={-6}
            hoverScale={1.08}
            style={styles.itemWrap}
          >
            <View style={styles.item}>
              <View
                style={[
                  styles.circle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor: item.tint,
                    borderColor: item.border,
                  },
                ]}
              >
                <Ionicons name={item.icon} size={Math.round(circleSize * 0.42)} color={item.iconColor} />
                {item.badge ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: colors.surface,
                        borderColor: item.border,
                      },
                    ]}
                  >
                    <Ionicons name={item.badge.icon} size={12} color={item.badge.color} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          </FloatingCard>
        ))}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  stage: {
    position: 'relative',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    width: '78%',
    aspectRatio: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    opacity: 0.5,
    zIndex: -1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  itemWrap: {
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
  },
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    textAlign: 'center',
  },
}));
