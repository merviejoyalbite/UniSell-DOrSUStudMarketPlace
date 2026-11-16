import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { BrandMark } from '../components/BrandMark';
import { ErrorBanner } from '../components/ErrorBanner';
import { PesoMascot } from '../components/PesoMascot';
import { FormField } from '../components/FormField';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { WelcomeHero } from '../components/WelcomeHero';
import { useAuth } from '../context/AuthContext';
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
import { validatePassword, validateSchoolEmail } from '../utils/validators';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

/**
 * Verified student login.
 *
 * Submit flow:
 *   validate fields -> AuthContext.signIn -> authApi.loginWithEmail
 *   -> save session -> AuthContext status becomes "signedIn"
 *   -> RootNavigator swaps to the Main tabs automatically.
 */
export function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isDesktop } = useBreakpoint();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateEmail = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
  };

  async function handleSubmit() {
    if (isSubmitting) return;

    setFormError(null);

    const nextErrors: FieldErrors = {
      email: validateSchoolEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const brandBlock = (
    <View style={styles.brandBlock}>
      <BrandMark size={58} />
      <Text style={styles.brandName}>UniSell</Text>
      <Text style={styles.brandTagline}>DOrSU student marketplace</Text>
    </View>
  );

  return (
    <ScreenContainer scroll avoidKeyboard maxWidth={1040}>
      <View style={styles.topBar}>
        <RoundIconButton
          icon="arrow-back"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          size={44}
        />
      </View>

      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
        {isDesktop ? (
          <View style={styles.heroColumn}>
            {brandBlock}
            <PesoMascot size={72} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <WelcomeHero />
            <Text style={styles.heroText}>
              Pick up right where you left off and keep campus finds moving.
            </Text>
          </View>
        ) : null}

        <View style={styles.authColumn}>
          {!isDesktop ? brandBlock : null}

          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>
              Welcome back
            </Text>
            <Text style={styles.subtitle}>
              Sign in to discover great finds on campus.
            </Text>

            <ErrorBanner message={formError} />

            <FormField
              label="School email"
              icon="mail-outline"
              placeholder="name@dorsu.edu.ph"
              value={email}
              onChangeText={updateEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <FormField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              value={password}
              onChangeText={updatePassword}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              labelAction={{
                label: 'Forgot password?',
                onPress: () => navigation.navigate('ForgotPassword'),
              }}
            />

            <AppButton
              label={isSubmitting ? 'Logging in…' : 'Log in'}
              rightIcon="arrow-forward"
              loading={isSubmitting}
              onPress={handleSubmit}
              fullWidth
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>New to UniSell?</Text>
              <View style={styles.line} />
            </View>

            <AppButton
              label="Sign up with school email"
              variant="secondary"
              onPress={() => navigation.navigate('SignUp')}
              fullWidth
            />
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.footerText}>Verified DOrSU students only</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  topBar: {
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  layout: {
    flex: 1,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
    paddingVertical: spacing.xxl,
  },
  heroColumn: {
    flex: 1,
    minWidth: 0,
    maxWidth: 440,
  },
  heroText: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  authColumn: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandName: {
    marginTop: spacing.sm,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.primary,
  },
  brandTagline: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    ...shadows.panel,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
}));
