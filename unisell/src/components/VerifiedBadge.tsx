import { Ionicons } from '@expo/vector-icons';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';

interface VerifiedPillProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/** Green "✓ Student" pill shown after a seller's name on listing cards. */
export function VerifiedPill({ label = 'Student', style }: VerifiedPillProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.pill, style]}>
      <Ionicons name="checkmark" size={12} color={colors.success} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

interface VerifiedCheckProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Blue verified check badge used on the Profile avatar and message rows. */
export function VerifiedCheck({ size = 20, style }: VerifiedCheckProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.check,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Ionicons
        name="checkmark"
        size={Math.round(size * 0.68)}
        color={colors.verified}
      />
    </View>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.success,
  },
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
}));
