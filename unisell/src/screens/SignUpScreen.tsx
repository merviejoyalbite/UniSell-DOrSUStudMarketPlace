import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { BrandMark } from '../components/BrandMark';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SelectField } from '../components/SelectField';
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
import { COURSES, YEAR_LEVELS } from '../types';
import {
  validatePassword,
  validateRequired,
  validateSchoolEmail,
} from '../utils/validators';

type FormKey =
  | 'email'
  | 'name'
  | 'studentId'
  | 'course'
  | 'yearLevel'
  | 'password'
  | 'confirmPassword';

type FieldErrors = Partial<Record<FormKey, string>>;

const EMPTY_FORM = {
  email: '',
  name: '',
  studentId: '',
  course: '',
  yearLevel: '',
  password: '',
  confirmPassword: '',
};

/**
 * Account creation.
 * Every field is validated before AuthContext.signUp runs; successful sign-up
 * also logs the student in, so the navigator switches straight to the tabs.
 */
export function SignUpScreen({ navigation }: RootStackScreenProps<'SignUp'>) {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isDesktop } = useBreakpoint();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: FormKey) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  function validate(): boolean {
    const next: FieldErrors = {
      email: validateSchoolEmail(form.email) ?? undefined,
      password: validatePassword(form.password) ?? undefined,
      studentId: validateRequired(form.studentId, 'Student ID') ?? undefined,
    };

    if (!form.name.trim()) {
      next.name = 'Enter your full name.';
    } else if (form.name.trim().length < 2) {
      next.name = 'Name is too short.';
    }

    if (!form.course) next.course = 'Select your course.';
    if (!form.yearLevel) next.yearLevel = 'Select your year level.';

    if (!form.confirmPassword) {
      next.confirmPassword = 'Confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match.';
    }

    setErrors(next);
    // Check the values, not just the keys: `next` always contains the keys
    // email/password/studentId, even when their values are undefined.
    return Object.values(next).every((message) => !message);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signUp({
        email: form.email,
        name: form.name,
        studentId: form.studentId,
        course: form.course,
        yearLevel: form.yearLevel,
        password: form.password,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Could not create your account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const heroColumn = (
    <View style={styles.heroColumn}>
      <View style={styles.brandBlock}>
        <BrandMark size={58} />
        <Text style={styles.brandName}>UniSell</Text>
        <Text style={styles.brandTagline}>DOrSU student marketplace</Text>
      </View>
      <WelcomeHero />
      <Text style={styles.heroText}>
        Join a marketplace that keeps campus finds affordable and in circulation.
      </Text>
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
        {isDesktop ? heroColumn : null}

        <View style={styles.authColumn}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                Join UniSell
              </Text>
              <Text style={styles.subtitle}>
                Create your verified student account.
              </Text>
            </View>

            <FormField
              label="School email"
              icon="mail-outline"
              placeholder="name@dorsu.edu.ph"
              value={form.email}
              onChangeText={update('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />

            <FormField
              label="Full name"
              icon="person-outline"
              placeholder="Juan Dela Cruz"
              value={form.name}
              onChangeText={update('name')}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />

            <FormField
              label="Student ID"
              icon="id-card-outline"
              placeholder="2022-0417"
              value={form.studentId}
              onChangeText={update('studentId')}
              error={errors.studentId}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <SelectField
              label="Course"
              icon="school-outline"
              placeholder="Select your course"
              value={form.course}
              options={COURSES}
              onChange={update('course')}
              error={errors.course}
            />

            <SelectField
              label="Year level"
              icon="calendar-outline"
              placeholder="Select your year level"
              value={form.yearLevel}
              options={YEAR_LEVELS}
              onChange={update('yearLevel')}
              error={errors.yearLevel}
            />

            <FormField
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 8 characters"
              value={form.password}
              onChangeText={update('password')}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
            />

            <FormField
              label="Confirm password"
              icon="lock-closed-outline"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChangeText={update('confirmPassword')}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={handleSubmit}
            />

            <ErrorBanner message={formError} />

            <View style={styles.note}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.noteText}>
                Only official DOrSU school emails are accepted.
              </Text>
            </View>

            <AppButton
              label={
                isSubmitting ? 'Creating account…' : 'Verify my student account'
              }
              loading={isSubmitting}
              onPress={handleSubmit}
              fullWidth
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already registered?</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Log in"
                onPress={() => navigation.navigate('Login')}
                hitSlop={8}
              >
                <Text style={styles.loginLink}>Log in</Text>
              </Pressable>
            </View>
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
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
  header: {
    marginBottom: spacing.lg,
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
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  loginText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  loginLink: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
}));
