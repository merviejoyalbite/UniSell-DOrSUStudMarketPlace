import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  spacing,
  useTheme,
} from '../theme';

/**
 * Shown for the brief moment while AuthContext restores the saved session.
 * This prevents a flash of the Welcome screen for already signed-in students.
 */
export function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <BrandMark size={72} />
        <Text style={styles.brand}>UniSell</Text>
        <Text style={styles.tagline}>DOrSU student marketplace</Text>
        <ActivityIndicator
          color={colors.primary}
          size="small"
          style={styles.spinner}
        />
      </View>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    marginTop: spacing.md,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  spinner: {
    marginTop: spacing.xl,
  },
}));
