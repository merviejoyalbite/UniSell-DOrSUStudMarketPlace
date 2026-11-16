import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SelectField } from '../components/SelectField';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  spacing,
} from '../theme';
import { COURSES, YEAR_LEVELS } from '../types';
import { validateFullName } from '../utils/validators';

/**
 * Phase 2 — Settings.
 *
 * Matches the Figma settings frame: the compact top bar, an inline Edit profile
 * card (name, read-only school email, course, year level, save + status), and
 * the Appearance card.
 *
 * The theme keeps the app's System / Light / Dark control instead of Figma's
 * single dark-mode switch, so the saved theme preference still works.
 *
 * The Reference card opens the Design System screen. The Demo data card stays
 * deferred until the mock API exposes a bulk reset, so no inert button ships.
 */
export function SettingsScreen({
  navigation,
}: RootStackScreenProps<'Settings'>) {
  const styles = useStyles();
  const { user, updateProfile } = useAuth();
  const { refresh } = useListings();
  const [name, setName] = useState(user?.name ?? '');
  const [course, setCourse] = useState(user?.course ?? '');
  const [yearLevel, setYearLevel] = useState(user?.yearLevel ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const currentUser = user;

  function updateName(value: string) {
    setName(value);
    setNameError(null);
    setSaveError(null);
    setSaved(false);
  }

  function updateCourse(value: string) {
    setCourse(value);
    setSaveError(null);
    setSaved(false);
  }

  function updateYearLevel(value: string) {
    setYearLevel(value);
    setSaveError(null);
    setSaved(false);
  }

  async function handleSave() {
    if (isSaving) return;

    const nextNameError = validateFullName(name);
    setNameError(nextNameError);
    if (nextNameError) return;

    if (!course) {
      setSaveError('Choose your course.');
      return;
    }
    if (!yearLevel) {
      setSaveError('Choose your year level.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const updated = await updateProfile({
        name: name.trim(),
        course,
        yearLevel,
        // The API treats a missing photo as "remove it", so pass the current
        // photo through to keep the avatar set from Edit profile.
        photo: currentUser.photo ?? null,
      });

      // The PATCH refreshes seller snapshots on the student's listings; pull
      // the feed so Home, Search and Listing Details show the new name too.
      await refresh({ silent: true }).catch(() => undefined);

      setName(updated.name);
      setCourse(updated.course);
      setYearLevel(updated.yearLevel);
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Could not save your profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenContainer
      scroll
      padded={false}
      maxWidth={layout.maxFormWidth}
      avoidKeyboard
    >
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
              Settings
            </Text>
            <Text style={styles.subtitle}>
              Prototype and account preferences
            </Text>
          </View>
          <RoundIconButton
            icon="ellipsis-horizontal"
            size={44}
            accessibilityLabel="Open notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit profile</Text>

          {saveError ? <ErrorBanner message={saveError} /> : null}

          <FormField
            compact
            label="Full name"
            value={name}
            onChangeText={updateName}
            error={nameError ?? undefined}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
          />

          <FormField
            compact
            label="School email"
            value={currentUser.email}
            editable={false}
            accessibilityHint="School email cannot be changed"
          />

          <View style={styles.fieldRow}>
            <View style={styles.fieldColumn}>
              <SelectField
                compact
                icon={null}
                label="Course"
                value={course}
                placeholder="Choose your course"
                options={COURSES}
                onChange={updateCourse}
              />
            </View>
            <View style={styles.fieldColumn}>
              <SelectField
                compact
                icon={null}
                label="Year level"
                value={yearLevel}
                placeholder="Choose your year level"
                options={YEAR_LEVELS}
                onChange={updateYearLevel}
              />
            </View>
          </View>

          <AppButton
            label={isSaving ? 'Saving…' : 'Save profile'}
            onPress={() => void handleSave()}
            loading={isSaving}
            fullWidth
          />

          {saved ? (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.success}
            >
              Profile updated everywhere.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appearance</Text>
          <Text style={styles.cardBody}>
            Use the dark navy Marketplace theme.
          </Text>
          <View style={styles.themeSwitch}>
            <ThemeSwitch />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reference</Text>
          <Text style={styles.cardBody}>
            The visual foundations used by UniSell.
          </Text>
          <View style={styles.cardAction}>
            <AppButton
              label="Design System"
              icon="color-palette-outline"
              variant="secondary"
              fullWidth
              onPress={() => navigation.navigate('DesignSystem')}
            />
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
  card: {
    marginTop: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 15,
    ...shadows.card,
  },
  cardTitle: {
    marginBottom: 11,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.textMuted,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldColumn: {
    flex: 1,
    minWidth: 0,
  },
  success: {
    marginTop: 9,
    marginHorizontal: 4,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.success,
  },
  themeSwitch: {
    marginTop: spacing.md,
  },
  cardAction: {
    marginTop: spacing.md,
  },
}));
