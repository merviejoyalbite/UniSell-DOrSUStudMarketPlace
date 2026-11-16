import { Text, View } from 'react-native';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  spacing,
  useTheme,
  type ThemeColors,
} from '../theme';

/**
 * Phase 2 — Design System.
 *
 * The Figma reference page behind Settings → Reference. It documents the five
 * foundations the app actually uses: colours, typography, spacing, elevation
 * and corner radius.
 *
 * Every value comes from the active theme, so the page shows the light palette
 * in light mode and the navy/mint palette in dark mode. The success and danger
 * swatches use our AA-safe tokens rather than Figma's large-text-only values.
 *
 * Figma also has a "Design System / Components / Accessibility" docs nav. Only
 * this page exists in the app, so the nav is omitted rather than shipping
 * links that go nowhere.
 */

interface Swatch {
  name: string;
  value: string;
}

interface TypeSpecimen {
  label: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  muted?: boolean;
}

const SPACING_STEPS = [4, 8, 16, 24, 32, 40] as const;

const ELEVATION_LEVELS = [0, 1, 2] as const;

/**
 * Figma's docs page documents 12 / 18 / 24 / pill. Some components use their
 * own larger radii (cards 22, panels 42), but the reference page keeps the
 * shared foundation scale.
 */
const RADIUS_STEPS = [
  { name: 'Small', radius: 12, label: '12px' },
  { name: 'Medium', radius: 18, label: '18px' },
  { name: 'Large', radius: 24, label: '24px' },
  { name: 'Pill', radius: 999, label: 'Pill' },
] as const;

const TYPE_SPECIMENS: TypeSpecimen[] = [
  {
    label: 'H1 · 28px',
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    fontFamily: fonts.bold,
  },
  {
    label: 'H2 · 22px',
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontFamily: fonts.semibold,
  },
  {
    label: 'H3 · 18px',
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontFamily: fonts.semibold,
  },
  {
    label: 'Body · 16px',
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fonts.regular,
  },
  {
    label: 'Caption · 14px minimum',
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fonts.regular,
    muted: true,
  },
];

function getSwatches(colors: ThemeColors, isDark: boolean): Swatch[] {
  return [
    { name: 'Primary', value: colors.primary },
    { name: 'Accent', value: colors.accent },
    { name: 'Background', value: colors.background },
    // The light card surface is a translucent glass over the page wash. The
    // reference page shows the solid white base; dark mode uses the card navy.
    { name: 'Surface', value: isDark ? colors.surface : colors.white },
    { name: 'Text', value: colors.text },
    { name: 'Muted', value: colors.textMuted },
    { name: 'Success', value: colors.success },
    { name: 'Error', value: colors.danger },
  ];
}

export function DesignSystemScreen({
  navigation,
}: RootStackScreenProps<'DesignSystem'>) {
  const styles = useStyles();
  const { colors, isDark, shadows } = useTheme();
  const swatches = getSwatches(colors, isDark);

  return (
    <ScreenContainer scroll padded={false} maxWidth={layout.maxFormWidth}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <RoundIconButton
            icon="arrow-back"
            size={48}
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.topBarText}>
            <Text accessibilityRole="header" style={styles.title}>
              Design System
            </Text>
            <Text style={styles.subtitle}>
              The visual foundations used by UniSell
            </Text>
          </View>
          <RoundIconButton
            icon="ellipsis-horizontal"
            size={44}
            accessibilityLabel="Open notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Colors
            </Text>
            <View style={styles.swatchGrid}>
              {swatches.map((swatch) => (
                <View key={swatch.name} style={styles.swatchCard}>
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[
                      styles.swatchBlock,
                      { backgroundColor: swatch.value },
                    ]}
                  />
                  <Text style={styles.swatchName}>{swatch.name}</Text>
                  <Text style={styles.swatchValue}>{swatch.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Typography
            </Text>
            <View style={styles.specimens}>
              {TYPE_SPECIMENS.map((specimen) => (
                <Text
                  key={specimen.label}
                  style={[
                    styles.specimen,
                    {
                      fontFamily: specimen.fontFamily,
                      fontSize: specimen.fontSize,
                      lineHeight: specimen.lineHeight,
                    },
                    specimen.muted && styles.specimenMuted,
                  ]}
                >
                  {specimen.label}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Spacing
            </Text>
            <View style={styles.spacingScale}>
              {SPACING_STEPS.map((step) => (
                <View key={step} style={styles.spacingRow}>
                  <View style={[styles.spacingBar, { width: step }]} />
                  <Text style={styles.tokenValue}>{step}px</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Elevation
            </Text>
            <View style={styles.elevationGrid}>
              {ELEVATION_LEVELS.map((level) => (
                <View
                  key={level}
                  style={[
                    styles.elevationCard,
                    level === 0
                      ? styles.elevationFlat
                      : level === 1
                        ? shadows.card
                        : shadows.floating,
                  ]}
                >
                  <Text style={styles.elevationTitle}>Level {level}</Text>
                  <Text style={styles.elevationLabel}>Sample surface</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Border radius
            </Text>
            <View style={styles.radiusGrid}>
              {RADIUS_STEPS.map((step) => (
                <View
                  key={step.name}
                  style={[
                    styles.radiusBox,
                    { borderRadius: step.radius },
                  ]}
                >
                  <Text style={styles.radiusName}>{step.name}</Text>
                  <Text style={styles.tokenValue}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    width: '100%',
    paddingHorizontal: 18,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.sm,
    marginBottom: 2,
  },
  topBarText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  content: {
    gap: spacing.lg,
    marginTop: 10,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 18,
    ...shadows.card,
  },
  sectionTitle: {
    marginBottom: 14,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.text,
  },

  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatchCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 10,
  },
  swatchBlock: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 9,
  },
  swatchName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  swatchValue: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },

  specimens: {
    gap: 10,
  },
  specimen: {
    color: colors.text,
  },
  specimenMuted: {
    color: colors.textMuted,
  },

  spacingScale: {
    gap: 10,
  },
  spacingRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacingBar: {
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  tokenValue: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },

  elevationGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  elevationCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    justifyContent: 'center',
    gap: 5,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    padding: 12,
  },
  elevationFlat: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevationTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  elevationLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },

  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radiusBox: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    padding: 12,
  },
  radiusName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
}));
