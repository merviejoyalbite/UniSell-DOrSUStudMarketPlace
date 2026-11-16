import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { FormField } from '../components/FormField';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
} from '../theme';
import { validateSchoolEmail } from '../utils/validators';

/**
 * Forgot-password card.
 *
 * The mock REST API cannot send email, so a valid school email simulates the
 * request and shows the Figma success message inline. No account data is
 * changed; this is a demo-only flow.
 */
export function ForgotPasswordScreen({
  navigation,
}: RootStackScreenProps<'ForgotPassword'>) {
  const styles = useStyles();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const updateEmail = (value: string) => {
    setEmail(value);
    if (error) setError(undefined);
    if (sent) setSent(false);
  };

  function handleSubmit() {
    const nextError = validateSchoolEmail(email) ?? undefined;
    setError(nextError);
    if (nextError) {
      setSent(false);
      return;
    }

    // Demo only: the mock API has no mail service, so show the success state.
    setSent(true);
  }

  return (
    <ScreenContainer scroll avoidKeyboard maxWidth={1040}>
      <View style={styles.layout}>
        <View style={styles.card}>
          <RoundIconButton
            icon="arrow-back"
            accessibilityLabel="Back to login"
            onPress={() => navigation.goBack()}
            size={44}
            style={styles.back}
          />

          <Text accessibilityRole="header" style={styles.title}>
            Reset your password
          </Text>
          <Text style={styles.subtitle}>
            We’ll send instructions to your school email.
          </Text>

          <FormField
            label="School email"
            icon="mail-outline"
            placeholder="name@dorsu.edu.ph"
            value={email}
            onChangeText={updateEmail}
            error={error}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />

          {sent ? (
            <Text
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
              style={styles.success}
            >
              Check your school email for reset instructions.
            </Text>
          ) : null}

          <AppButton
            label="Send reset instructions"
            onPress={handleSubmit}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  layout: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.panel,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    ...shadows.panel,
  },
  back: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  success: {
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.success,
  },
}));
