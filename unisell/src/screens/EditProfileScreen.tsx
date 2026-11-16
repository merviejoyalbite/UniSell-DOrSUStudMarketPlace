import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { ScreenContainer } from '../components/ScreenContainer';
import { SelectField } from '../components/SelectField';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useToast } from '../context/ToastContext';
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
import { getInitials } from '../utils/formatters';
import { validateFullName, validateNewPassword } from '../utils/validators';

interface ProfileForm {
  name: string;
  course: string;
  yearLevel: string;
  photo: string | null;
}

type ProfileField = 'name' | 'course' | 'yearLevel';
type ProfileErrors = Partial<Record<ProfileField, string>>;

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';
type PasswordErrors = Partial<Record<PasswordField, string>>;

const EMPTY_PASSWORDS = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

/** Width limit for the profile photo, as requested in the brief. */
const PROFILE_PHOTO_WIDTH = 400;

interface LockedFieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

/** Read-only account field with a lock, used for email and student ID. */
function LockedField({ icon, label, value }: LockedFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.lockedRow}>
      <View style={styles.lockedIcon}>
        <Ionicons name={icon} size={17} color={colors.textMuted} />
      </View>
      <View style={styles.lockedText}>
        <Text style={styles.lockedLabel}>{label}</Text>
        <Text style={styles.lockedValue}>{value}</Text>
      </View>
      <Ionicons name="lock-closed" size={15} color={colors.textMuted} />
    </View>
  );
}

/**
 * Edit profile.
 *
 * The screen only edits the signed-in user: the id comes from AuthContext, not
 * from route params, and authApi re-checks the persisted session before PATCH.
 * Saving also refreshes the denormalized seller name/course/year on the user's
 * existing listings, so feed cards and details stay self-contained.
 *
 * The form is capped at 720px; course and year level share a row on
 * tablet/desktop and stack on phones.
 */
export function EditProfileScreen({
  navigation,
}: RootStackScreenProps<'EditProfile'>) {
  const { user, updateProfile, changePassword } = useAuth();
  const { refresh } = useListings();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isMobile } = useBreakpoint();

  const [form, setForm] = useState<ProfileForm>(() => ({
    name: user?.name ?? '',
    course: user?.course ?? '',
    yearLevel: user?.yearLevel ?? '',
    photo: user?.photo ?? null,
  }));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<'camera' | 'gallery' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const allowLeave = useRef(false);

  const hasChanges = Boolean(
    user &&
      (form.name.trim() !== user.name.trim() ||
        form.course !== user.course ||
        form.yearLevel !== user.yearLevel ||
        (form.photo ?? null) !== (user.photo ?? null)),
  );

  // Intercept the header back button, Android back and gesture-back while
  // there are unsaved edits.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeave.current || !hasChanges || isSaving) return;

      event.preventDefault();
      Alert.alert(
        'Discard changes?',
        'Your profile changes will not be saved.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              allowLeave.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [hasChanges, isSaving, navigation]);

  if (!user) return null;

  function updateField(field: ProfileField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (saveError) setSaveError(null);
  }

  function updatePhoto(photo: string | null) {
    setForm((current) => ({ ...current, photo }));
    if (saveError) setSaveError(null);
  }

  async function requestPermission(
    source: 'camera' | 'gallery',
  ): Promise<boolean> {
    // The Android 13+ system picker and web do not need a media permission.
    if (
      source === 'gallery' &&
      (Platform.OS === 'web' ||
        (Platform.OS === 'android' && Number(Platform.Version) >= 33))
    ) {
      return true;
    }

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.granted) return true;

    Alert.alert(
      source === 'camera' ? 'Camera access needed' : 'Photo access needed',
      source === 'camera'
        ? 'UniSell uses the camera only for your profile photo. Enable it in Settings or choose a gallery photo instead.'
        : 'UniSell needs access to your photo library only when you choose a profile photo.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Open settings',
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ],
    );
    return false;
  }

  async function handlePickPhoto(source: 'camera' | 'gallery') {
    if (photoBusy) return;

    setPhotoError(null);

    try {
      const allowed = await requestPermission(source);
      if (!allowed) return;

      setPhotoBusy(source);

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
              exif: false,
              cameraType: ImagePicker.CameraType.front,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
              exif: false,
            });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      // Only downscale when the source is larger than the 400px limit.
      const actions =
        asset.width && asset.width > PROFILE_PHOTO_WIDTH
          ? [{ resize: { width: PROFILE_PHOTO_WIDTH } }]
          : [];

      const prepared = await manipulateAsync(asset.uri, actions, {
        compress: 0.6,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!prepared.base64) {
        throw new Error('The photo did not return image data.');
      }

      updatePhoto(`data:image/jpeg;base64,${prepared.base64}`);
    } catch (error) {
      console.warn('[UniSell profile] Could not prepare the photo.', error);
      setPhotoError(
        error instanceof Error
          ? error.message
          : 'Could not use that photo. Try another one.',
      );
    } finally {
      setPhotoBusy(null);
    }
  }

  function removePhoto() {
    updatePhoto(null);
    setPhotoError(null);
  }

  function validateProfile(): ProfileErrors {
    return {
      name: validateFullName(form.name) ?? undefined,
      course: form.course ? undefined : 'Choose your course.',
      yearLevel: form.yearLevel ? undefined : 'Choose your year level.',
    };
  }

  async function handleSave() {
    if (isSaving || !hasChanges) return;

    const nextErrors = validateProfile();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateProfile({
        name: form.name.trim(),
        course: form.course,
        yearLevel: form.yearLevel,
        photo: form.photo,
      });

      // The PATCH also updated seller snapshots on the user's listings. Pull
      // the feed again so Home/Search/Details show the new name immediately.
      await refresh({ silent: true }).catch(() => undefined);

      allowLeave.current = true;
      showToast('Profile updated');
      navigation.goBack();
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

  function updatePasswordField(field: PasswordField, value: string) {
    setPasswords((current) => ({ ...current, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (passwordError) setPasswordError(null);
  }

  function validatePasswords(): PasswordErrors {
    return {
      currentPassword: passwords.currentPassword
        ? undefined
        : 'Enter your current password.',
      newPassword:
        validateNewPassword(
          passwords.newPassword,
          passwords.currentPassword,
        ) ?? undefined,
      confirmPassword:
        passwords.confirmPassword === passwords.newPassword
          ? undefined
          : 'Passwords do not match.',
    };
  }

  async function handleChangePassword() {
    if (isChangingPassword) return;

    const nextErrors = validatePasswords();
    setPasswordErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsChangingPassword(true);
    setPasswordError(null);

    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords(EMPTY_PASSWORDS);
      setPasswordErrors({});
      setPasswordOpen(false);
      showToast('Password changed');
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : 'Could not change your password. Please try again.',
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <ScreenContainer scroll avoidKeyboard maxWidth={720}>
      <View style={styles.page}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Edit profile
          </Text>
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.subtitle}>
          Keep your student details current so buyers know who they are meeting.
        </Text>

        {saveError ? (
          <ErrorBanner message={saveError} onRetry={() => void handleSave()} />
        ) : null}

        <View style={styles.card}>
          <View style={styles.photoSection}>
            <View style={styles.photoWrap}>
              {form.photo ? (
                <Image
                  source={{ uri: form.photo }}
                  contentFit="cover"
                  transition={150}
                  style={styles.photo}
                  accessibilityLabel="Your profile photo"
                />
              ) : (
                <View style={styles.photoFallback}>
                  <Text style={styles.photoInitials}>
                    {getInitials(form.name || user.name)}
                  </Text>
                </View>
              )}
              {photoBusy ? (
                <View style={styles.photoBusy}>
                  <ActivityIndicator
                    size="small"
                    color={colors.textOnPrimary}
                    accessibilityLabel="Preparing photo"
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.photoActions}>
              {Platform.OS !== 'web' ? (
                <AppButton
                  label="Take photo"
                  icon="camera-outline"
                  variant="secondary"
                  disabled={photoBusy !== null}
                  loading={photoBusy === 'camera'}
                  onPress={() => void handlePickPhoto('camera')}
                  style={styles.photoButton}
                />
              ) : null}
              <AppButton
                label="Choose from gallery"
                icon="images-outline"
                variant="secondary"
                disabled={photoBusy !== null}
                loading={photoBusy === 'gallery'}
                onPress={() => void handlePickPhoto('gallery')}
                style={styles.photoButton}
              />
              {form.photo ? (
                <AppButton
                  label="Remove photo"
                  icon="trash-outline"
                  variant="dangerOutline"
                  disabled={photoBusy !== null}
                  onPress={removePhoto}
                  style={styles.photoButton}
                />
              ) : null}
            </View>

            <Text style={styles.photoHint}>
              Photos are resized to {PROFILE_PHOTO_WIDTH}px and compressed. If
              you remove your photo, your initials are shown instead.
            </Text>
            {photoError ? (
              <Text style={styles.photoError} accessibilityLiveRegion="polite">
                {photoError}
              </Text>
            ) : null}
          </View>

          <FormField
            label="Full name"
            icon="person-outline"
            placeholder="e.g. Mika Santos"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            error={errors.name}
            autoCapitalize="words"
            maxLength={60}
            returnKeyType="next"
          />

          <View style={[styles.fieldRow, isMobile && styles.fieldColumn]}>
            <View style={styles.fieldHalf}>
              <SelectField
                label="Course"
                value={form.course}
                placeholder="Choose your course"
                options={COURSES}
                onChange={(value) => updateField('course', value)}
                error={errors.course}
                icon="school-outline"
              />
            </View>
            <View style={styles.fieldHalf}>
              <SelectField
                label="Year level"
                value={form.yearLevel}
                placeholder="Choose your year level"
                options={YEAR_LEVELS}
                onChange={(value) => updateField('yearLevel', value)}
                error={errors.yearLevel}
                icon="calendar-outline"
              />
            </View>
          </View>

          <View style={styles.lockedGroup}>
            <LockedField
              icon="mail-outline"
              label="School email"
              value={user.email}
            />
            <LockedField
              icon="id-card-outline"
              label="Student ID"
              value={user.studentId ?? 'Not on file'}
            />
            <Text style={styles.lockedHelper}>
              Contact your school office to change this
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: passwordOpen }}
            onPress={() => setPasswordOpen((current) => !current)}
            style={({ pressed }) => [
              styles.passwordHeader,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.passwordHeaderIcon}>
              <Ionicons
                name="key-outline"
                size={19}
                color={colors.primary}
              />
            </View>
            <View style={styles.passwordHeaderText}>
              <Text style={styles.sectionTitle}>Change password</Text>
              <Text style={styles.sectionHint}>
                Optional. Leave this closed to keep your current password.
              </Text>
            </View>
            <Ionicons
              name={passwordOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>

          {passwordOpen ? (
            <View style={styles.passwordBody}>
              <FormField
                label="Current password"
                icon="lock-closed-outline"
                placeholder="Enter your current password"
                value={passwords.currentPassword}
                onChangeText={(value) =>
                  updatePasswordField('currentPassword', value)
                }
                error={passwordErrors.currentPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="next"
              />
              <FormField
                label="New password"
                icon="key-outline"
                placeholder="At least 8 characters"
                value={passwords.newPassword}
                onChangeText={(value) =>
                  updatePasswordField('newPassword', value)
                }
                error={passwordErrors.newPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="next"
              />
              <FormField
                label="Confirm new password"
                icon="checkmark-circle-outline"
                placeholder="Repeat the new password"
                value={passwords.confirmPassword}
                onChangeText={(value) =>
                  updatePasswordField('confirmPassword', value)
                }
                error={passwordErrors.confirmPassword}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
              />

              {passwordError ? (
                <ErrorBanner message={passwordError} />
              ) : null}

              <AppButton
                label={
                  isChangingPassword ? 'Updating password…' : 'Update password'
                }
                icon="shield-checkmark-outline"
                variant="secondary"
                loading={isChangingPassword}
                disabled={isChangingPassword}
                onPress={handleChangePassword}
                fullWidth
              />

              <Text style={styles.passwordNote}>
                Prototype only: the mock API stores passwords as plain text.
                A real backend must hash them.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <AppButton
            label={isSaving ? 'Saving…' : 'Save changes'}
            icon="save-outline"
            variant="accent"
            loading={isSaving}
            disabled={!hasChanges || isSaving}
            onPress={handleSave}
            fullWidth
          />
          <AppButton
            label="Cancel"
            variant="ghost"
            disabled={isSaving}
            onPress={() => navigation.goBack()}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  topBarSpacer: {
    width: 44,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    color: colors.text,
  },
  subtitle: {
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.primary,
  },
  photoBusy: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  photoActions: {
    marginTop: spacing.md,
    width: '100%',
    gap: spacing.sm,
  },
  photoButton: {
    width: '100%',
  },
  photoHint: {
    marginTop: spacing.sm,
    maxWidth: 360,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  photoError: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.danger,
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldColumn: {
    flexDirection: 'column',
    gap: 0,
  },
  fieldHalf: {
    flex: 1,
    minWidth: 0,
  },
  lockedGroup: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  lockedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    flex: 1,
  },
  lockedLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  lockedValue: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  lockedHelper: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  passwordHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.text,
  },
  sectionHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  passwordBody: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  passwordNote: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
}));
