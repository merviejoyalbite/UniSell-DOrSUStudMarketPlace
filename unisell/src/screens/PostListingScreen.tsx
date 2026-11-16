import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { FilterChip } from '../components/FilterChip';
import { FormField } from '../components/FormField';
import { LoadingState } from '../components/LoadingState';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SegmentedControl } from '../components/SegmentedControl';
import { SelectField } from '../components/SelectField';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useToast } from '../context/ToastContext';
import { useTabBarBottomInset } from '../navigation/useTabBarBottomInset';
import type { MainTabScreenProps } from '../navigation/types';
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
import {
  CATEGORIES,
  CONDITIONS,
  MEETUP_SPOTS,
  type Category,
  type Condition,
  type ImageSource,
  type Listing,
  type NewListingInput,
  type UpdateListingInput,
} from '../types';
import {
  EDIT_OWNERSHIP_ERROR,
  SOLD_EDIT_ERROR,
  canManageListing,
} from '../utils/permissions';
import {
  validateDescription,
  validatePrice,
  validateRequired,
  validateTitle,
} from '../utils/validators';

interface FormValues {
  title: string;
  price: string;
  category: Category | '';
  condition: Condition | '';
  meetupSpot: string;
  description: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  title: '',
  price: '',
  category: '',
  condition: '',
  meetupSpot: '',
  description: '',
};

const MAX_PHOTOS = 3;
const MAX_IMAGE_WIDTH = 800;
const MAX_PHOTO_BYTES = 300 * 1024;
/** Try the requested quality first, then recompress if the photo is too large. */
const JPEG_QUALITY_STEPS = [0.6, 0.5, 0.4, 0.3] as const;

interface CapturedPhoto {
  /** `data:image/jpeg;base64,...` — the same string sent to the API. */
  uri: string;
  /** Approximate decoded size, used for the “about 300 KB” check. */
  bytes: number;
  source: ImageSource;
  /** True for a seeded sample illustration that is not the seller's photo. */
  isSample?: boolean;
}

interface PhotoNotice {
  message: string;
  showSettings: boolean;
}

class PhotoPrepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoPrepError';
  }
}

/** Explain why the camera is needed before the OS permission prompt appears. */
function explainCameraAccess(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Camera access',
      'UniSell uses your camera only to photograph the item you are selling. ' +
        'Photos are saved with the listing so buyers see the real item.',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Continue',
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });
}

/** Explain why the photo library is needed before the OS permission prompt. */
function explainGalleryAccess(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Photo library access',
      'UniSell opens your photo library only when you choose existing photos ' +
        'of the item you are selling. Photos are saved with the listing so ' +
        'buyers see what they are getting.',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Continue',
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });
}

function formatPhotoSize(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Resize to at most 800px wide, compress to JPEG and return a data URI.
 *
 * `manipulateAsync` decodes through the platform image loader, so EXIF
 * orientation is baked into an upright JPEG before the resize. If quality 0.6
 * is still over about 300KB, the original is recompressed at lower qualities.
 */
async function preparePhoto(
  asset: ImagePicker.ImagePickerAsset,
  source: ImageSource,
): Promise<CapturedPhoto> {
  const actions =
    asset.width > MAX_IMAGE_WIDTH
      ? [{ resize: { width: MAX_IMAGE_WIDTH } }]
      : [];

  let lastBytes = 0;

  try {
    for (const quality of JPEG_QUALITY_STEPS) {
      const manipulated = await manipulateAsync(asset.uri, actions, {
        compress: quality,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!manipulated.base64) {
        throw new PhotoPrepError(
          'The photo did not return image data. Try a different photo.',
        );
      }

      // Base64 is about 4/3 the size of the decoded JPEG bytes.
      const bytes = Math.ceil((manipulated.base64.length * 3) / 4);
      lastBytes = bytes;

      if (bytes <= MAX_PHOTO_BYTES) {
        return {
          uri: `data:image/jpeg;base64,${manipulated.base64}`,
          bytes,
          source,
        };
      }
    }
  } catch (error) {
    if (error instanceof PhotoPrepError) throw error;
    throw new PhotoPrepError(
      'Could not prepare that photo. Try a different one.',
    );
  }

  throw new PhotoPrepError(
    `That photo is still ${formatPhotoSize(
      lastBytes,
    )} after compression. Try a smaller or simpler photo.`,
  );
}

/** Run every field through the shared helpers in `utils/validators.ts`. */
function validateForm(values: FormValues): FieldErrors {
  return {
    title: validateTitle(values.title) ?? undefined,
    price: values.price.trim()
      ? (validatePrice(Number(values.price)) ?? undefined)
      : 'Enter a price.',
    category: values.category ? undefined : 'Choose a category.',
    condition: values.condition ? undefined : 'Choose a condition.',
    meetupSpot: validateRequired(values.meetupSpot, 'Meet-up spot') ?? undefined,
    description: validateDescription(values.description) ?? undefined,
  };
}

/** Turn a saved listing back into the editable form values. */
function toFormValues(listing: Listing): FormValues {
  return {
    title: listing.title,
    price: String(listing.price),
    category: listing.category,
    condition: listing.condition,
    meetupSpot: listing.meetupSpot,
    description: listing.description,
  };
}

/**
 * Turn saved listing photos back into the photo grid model.
 *
 * Seeded sample illustrations are marked `isSample` so the edit screen never
 * presents them as the seller's own camera/gallery photo.
 */
function toCapturedPhotos(listing: Listing): CapturedPhoto[] {
  const images = listing.images?.length
    ? listing.images
    : listing.image
      ? [listing.image]
      : [];

  return images.slice(0, MAX_PHOTOS).map((uri, index) => ({
    uri,
    bytes: 0,
    source:
      listing.imageSources?.[index] ??
      (uri.startsWith('data:image') ? 'camera' : 'gallery'),
    isSample: listing.imageType === 'sample',
  }));
}

/**
 * Phase 4 — Post a listing, reused for editing.
 *
 * Create flow:
 *   validate -> ListingsContext.publishListing -> listingsApi.createListing
 *   -> POST /listings -> ADD_LISTING updates every screen -> silent refresh
 *   -> open the new listing's details screen.
 *
 * Edit flow (route param `listingId`):
 *   prefill from the existing listing -> owner check via canManageListing
 *   -> validate -> ListingsContext.updateListing -> PATCH /listings/:id
 *   -> UPDATE_LISTING updates every screen -> open the listing's details.
 *
 * Layout: the form is capped at 720px and follows the Figma post screen —
 * compact top bar, "Selling as" banner, separate Photos / Item details /
 * Meetup cards, 44px fields and a three-slot photo row.
 */
export function PostListingScreen({
  navigation,
  route,
}: MainTabScreenProps<'Post'>) {
  const tabBarBottomInset = useTabBarBottomInset();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isMobile } = useBreakpoint();
  const {
    listings,
    status: listingsStatus,
    publishListing,
    updateListing,
  } = useListings();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<PhotoNotice | null>(null);
  const [busySource, setBusySource] = useState<ImageSource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const listingId = route.params?.listingId;
  const isEditMode = listingId !== undefined;
  const listing = isEditMode
    ? listings.find((item) => item.id === listingId)
    : undefined;

  // Only prefill once per listing so a silent refresh cannot overwrite edits.
  const prefilledId = useRef<number | null>(null);
  const blockedForId = useRef<number | null>(null);

  const isBusy = busySource !== null;

  useEffect(() => {
    if (listingId === undefined) {
      prefilledId.current = null;
      blockedForId.current = null;
      setBlockedMessage(null);
      return;
    }

    if (!listing || prefilledId.current === listing.id) return;

    prefilledId.current = listing.id;
    setForm(toFormValues(listing));
    setPhotos(toCapturedPhotos(listing));
    setActivePhoto(0);
    setErrors({});
    setFormError(null);
    setPhotoError(null);
    setPhotoNotice(null);
  }, [listing, listingId]);

  useEffect(() => {
    if (listingId === undefined || blockedForId.current === listingId) return;

    // Wait for the feed before deciding a listing is missing.
    if (!listing) {
      if (listingsStatus === 'ready' || listingsStatus === 'error') {
        blockedForId.current = listingId;
        setBlockedMessage('This listing is no longer available.');
      }
      return;
    }

    if (!canManageListing(user, listing)) {
      blockedForId.current = listingId;
      setBlockedMessage(EDIT_OWNERSHIP_ERROR);
      Alert.alert('Cannot edit this listing', EDIT_OWNERSHIP_ERROR, [
        { text: 'Go back', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    if (listing.status === 'sold') {
      blockedForId.current = listingId;
      setBlockedMessage(SOLD_EDIT_ERROR);
      Alert.alert('Sold listing', SOLD_EDIT_ERROR, [
        { text: 'Go back', onPress: () => navigation.goBack() },
      ]);
    }
  }, [listing, listingId, listingsStatus, navigation, user]);

  if (!user) return null;

  if (isEditMode && blockedMessage) {
    return (
      <ScreenContainer>
        <View style={styles.page}>
          <EmptyState
            icon="lock-closed-outline"
            accent={colors.danger}
            title="Cannot edit this listing"
            message={blockedMessage}
            actionLabel="Go back"
            onAction={() => navigation.goBack()}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (isEditMode && !listing) {
    return (
      <ScreenContainer>
        <View style={styles.page}>
          <LoadingState message="Loading your listing…" />
        </View>
      </ScreenContainer>
    );
  }

  const activePhotoIndex = Math.min(
    activePhoto,
    Math.max(photos.length - 1, 0),
  );
  const activePhotoData = photos[activePhotoIndex];
  const hasMissingFields =
    !form.title.trim() ||
    !form.price.trim() ||
    !form.category ||
    !form.condition ||
    !form.meetupSpot ||
    !form.description.trim();
  const formHint =
    photos.length === 0
      ? 'Add at least one photo of your item.'
      : hasMissingFields
        ? 'Complete the remaining item and meetup details.'
        : null;

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (formError) {
      setFormError(null);
    }
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setActivePhoto((current) => {
      if (index < current) return current - 1;
      if (index === current) return Math.max(0, current - 1);
      return current;
    });
    setPhotoError(null);
  }

  function makeCover(index: number) {
    if (index <= 0) return;

    setPhotos((current) => {
      if (index >= current.length) return current;

      const reordered = [...current];
      const [cover] = reordered.splice(index, 1);
      return [cover, ...reordered];
    });
    setActivePhoto(0);
  }

  async function ensureCameraPermission(): Promise<boolean> {
    let permission = await ImagePicker.getCameraPermissionsAsync();

    if (!permission.granted) {
      if (permission.canAskAgain) {
        const shouldAsk = await explainCameraAccess();
        if (!shouldAsk) return false;
        permission = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (!permission.granted) {
        setPhotoNotice({
          message:
            'Camera access is off. UniSell needs the camera to photograph your item. ' +
            'Enable it in Settings, or choose photos from your gallery instead.',
          showSettings: true,
        });
        return false;
      }
    }

    return true;
  }

  async function ensureGalleryPermission(): Promise<boolean> {
    // The system photo picker on Android 13+ and web does not need a media
    // permission, so asking there would only add a confusing prompt.
    if (Platform.OS === 'web') return true;
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) return true;

    let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      if (permission.canAskAgain) {
        const shouldAsk = await explainGalleryAccess();
        if (!shouldAsk) return false;
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permission.granted) {
        setPhotoNotice({
          message:
            'Photo library access is off. UniSell needs it only when you choose ' +
            'photos from your gallery. Enable it in Settings, or take a photo ' +
            'with the camera instead.',
          showSettings: true,
        });
        return false;
      }
    }

    return true;
  }

  /** Take one photo, or retake the photo in `replaceIndex`. */
  async function handleTakePhoto(replaceIndex?: number) {
    const isRetake = replaceIndex !== undefined;
    if (isBusy || (!isRetake && photos.length >= MAX_PHOTOS)) return;

    setPhotoError(null);
    setPhotoNotice(null);

    try {
      const allowed = await ensureCameraPermission();
      if (!allowed) return;

      setBusySource('camera');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
        base64: false,
        cameraType: ImagePicker.CameraType.back,
      });

      if (result.canceled || !result.assets[0]) return;

      const photo = await preparePhoto(result.assets[0], 'camera');

      setPhotos((current) => {
        if (replaceIndex === undefined) return [...current, photo];
        return current.map((item, index) =>
          index === replaceIndex ? photo : item,
        );
      });
    } catch (error) {
      console.warn('[UniSell photo] Could not capture the item photo.', error);

      if (error instanceof PhotoPrepError) {
        setPhotoError(error.message);
      } else {
        setPhotoNotice({
          message:
            'Could not take the photo. Check the camera permission and try again.',
          showSettings: true,
        });
      }
    } finally {
      setBusySource(null);
    }
  }

  /**
   * Pick one or more photos from the gallery. Adding uses the remaining slots;
   * replacing a gallery photo swaps only that slot.
   */
  async function handleChoosePhotos(replaceIndex?: number) {
    const isReplace = replaceIndex !== undefined;
    const remaining = MAX_PHOTOS - photos.length;
    if (isBusy || (!isReplace && remaining <= 0)) return;

    setPhotoError(null);
    setPhotoNotice(null);

    try {
      const allowed = await ensureGalleryPermission();
      if (!allowed) return;

      setBusySource('gallery');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: !isReplace,
        selectionLimit: isReplace ? 1 : remaining,
        orderedSelection: true,
        quality: 1,
        exif: false,
        base64: false,
      });

      if (result.canceled || result.assets.length === 0) return;

      const selected = result.assets.slice(0, isReplace ? 1 : remaining);
      const prepared: CapturedPhoto[] = [];

      for (const asset of selected) {
        prepared.push(await preparePhoto(asset, 'gallery'));
      }

      setPhotos((current) => {
        if (replaceIndex === undefined) {
          return [...current, ...prepared].slice(0, MAX_PHOTOS);
        }

        const replacement = prepared[0];
        if (!replacement) return current;

        return current.map((item, index) =>
          index === replaceIndex ? replacement : item,
        );
      });
    } catch (error) {
      console.warn('[UniSell photo] Could not add gallery photos.', error);

      if (error instanceof PhotoPrepError) {
        setPhotoError(error.message);
      } else {
        setPhotoNotice({
          message:
            'Could not open your gallery. Check the photo permission and try again.',
          showSettings: true,
        });
      }
    } finally {
      setBusySource(null);
    }
  }

  async function handleSubmit() {
    if (isSubmitting || !user) return;

    // Re-check ownership on submit in case the screen went stale while open.
    if (isEditMode) {
      if (!listing) {
        setFormError('This listing is no longer available.');
        return;
      }
      if (!canManageListing(user, listing)) {
        setFormError(EDIT_OWNERSHIP_ERROR);
        return;
      }
      if (listing.status === 'sold') {
        setFormError(SOLD_EDIT_ERROR);
        return;
      }
    }

    setFormError(null);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    const missingPhoto = photos.length === 0;
    setPhotoError(missingPhoto ? 'Add at least 1 photo of your item' : null);

    if (missingPhoto || Object.values(nextErrors).some(Boolean)) return;
    if (!form.category || !form.condition) return;

    const imageUris = photos.map((photo) => photo.uri);
    // Keep the "sample illustration" marker only when every remaining photo is
    // still a seeded sample; a real replacement clears it.
    const imageType = photos.every((photo) => photo.isSample) ? 'sample' : null;

    if (isEditMode && listing) {
      const input: UpdateListingInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        condition: form.condition,
        image: imageUris[0] ?? null,
        images: imageUris,
        imageSources: photos.map((photo) => photo.source),
        meetupSpot: form.meetupSpot,
        imageType,
      };

      setIsSubmitting(true);
      try {
        await updateListing(listing.id, input);
        showToast('Listing updated');
        navigation.setParams({ listingId: undefined });
        navigation.navigate('ListingDetails', { listingId: listing.id });
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Could not save your changes. Please try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const input: NewListingInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      condition: form.condition,
      image: imageUris[0] ?? null,
      images: imageUris,
      imageSources: photos.map((photo) => photo.source),
      sellerId: user.id,
      sellerName: user.name,
      sellerCourse: user.course,
      sellerYearLevel: user.yearLevel,
      meetupSpot: form.meetupSpot,
    };

    setIsSubmitting(true);
    try {
      const created = await publishListing(input);
      setForm(EMPTY_FORM);
      setErrors({});
      setPhotos([]);
      setActivePhoto(0);
      setPhotoError(null);
      setPhotoNotice(null);
      navigation.navigate('ListingDetails', { listingId: created.id });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Could not publish your listing. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancelEdit() {
    Alert.alert('Discard changes?', 'Your edits will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          navigation.setParams({ listingId: undefined });
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScreenContainer
      scroll
      avoidKeyboard
      bottomInset={isMobile ? tabBarBottomInset : 0}
      maxWidth={720}
    >
      <View style={styles.page}>
        <View style={styles.topBar}>
          <RoundIconButton
            icon="arrow-back"
            size={48}
            accessibilityLabel={
              isEditMode ? 'Cancel editing' : 'Go back to home'
            }
            onPress={
              isEditMode ? cancelEdit : () => navigation.navigate('Home')
            }
          />
          <View style={styles.topBarText}>
            <Text accessibilityRole="header" style={styles.title}>
              {isEditMode ? 'Edit listing' : 'Post a listing'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode
                ? 'Update your listing details'
                : 'Share something with campus'}
            </Text>
          </View>
        </View>

        <View style={styles.sellingAs}>
          <View style={styles.sellingCheck}>
            <Ionicons
              name="checkmark"
              size={18}
              color={colors.onSuccess}
            />
          </View>
          <View style={styles.sellingText}>
            <Text style={styles.sellingName} numberOfLines={1}>
              Selling as: {user.name}
            </Text>
            <Text style={styles.sellingMeta}>Verified DOrSU student</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Photos</Text>
            <Text style={styles.cardCount}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>

          <View style={styles.photoGrid}>
            {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
              const photo = photos[index];

              if (!photo) {
                const isMain = index === 0 && photos.length === 0;

                return (
                  <Pressable
                    key={`empty-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel="Add a photo from your gallery"
                    accessibilityState={{ disabled: isBusy }}
                    disabled={isBusy}
                    onPress={() => void handleChoosePhotos()}
                    style={({ pressed }) => [
                      styles.photoSlot,
                      styles.photoSlotEmpty,
                      isMain && styles.photoSlotMain,
                      pressed && styles.photoSlotPressed,
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={isMain ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.photoSlotText,
                        isMain && styles.photoSlotTextMain,
                      ]}
                    >
                      {isMain ? 'Add photo' : 'Add'}
                    </Text>
                  </Pressable>
                );
              }

              const isSelected = index === activePhotoIndex;

              return (
                <Pressable
                  key={`${photo.uri.slice(-24)}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo ${index + 1}${
                    index === 0 ? ', cover photo' : ''
                  }`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActivePhoto(index)}
                  style={({ pressed }) => [
                    styles.photoSlot,
                    styles.photoSlotFilled,
                    isSelected && styles.photoSlotSelected,
                    pressed && styles.photoSlotPressed,
                  ]}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    contentFit="cover"
                    transition={150}
                    style={styles.photoImage}
                    accessibilityIgnoresInvertColors
                  />
                  {index === 0 ? (
                    <View style={styles.coverBadge} pointerEvents="none">
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {activePhotoData ? (
            <View style={styles.photoToolbar}>
              <Text style={styles.photoToolbarLabel} numberOfLines={1}>
                {activePhotoData.isSample
                  ? 'Sample image'
                  : activePhotoIndex === 0
                    ? 'Cover photo'
                    : `Photo ${activePhotoIndex + 1}`}
                {activePhotoData.bytes > 0
                  ? ` · ${formatPhotoSize(activePhotoData.bytes)}`
                  : ''}
              </Text>
              <View style={styles.photoToolbarActions}>
                {activePhotoIndex > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Make this photo the cover"
                    disabled={isBusy}
                    hitSlop={2}
                    onPress={() => makeCover(activePhotoIndex)}
                    style={({ pressed }) => [
                      styles.photoToolAction,
                      pressed && styles.photoToolPressed,
                    ]}
                  >
                    <Ionicons
                      name="arrow-up-circle-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.photoToolText}>Cover</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Replace this photo"
                  disabled={isBusy}
                  hitSlop={2}
                  onPress={() =>
                    activePhotoData.source === 'gallery'
                      ? void handleChoosePhotos(activePhotoIndex)
                      : void handleTakePhoto(activePhotoIndex)
                  }
                  style={({ pressed }) => [
                    styles.photoToolAction,
                    pressed && styles.photoToolPressed,
                  ]}
                >
                  <Ionicons
                    name={
                      activePhotoData.source === 'gallery'
                        ? 'images-outline'
                        : 'camera-outline'
                    }
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.photoToolText}>Replace</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove this photo"
                  disabled={isBusy}
                  hitSlop={2}
                  onPress={() => removePhoto(activePhotoIndex)}
                  style={({ pressed }) => [
                    styles.photoToolAction,
                    styles.photoToolActionDanger,
                    pressed && styles.photoToolPressed,
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.danger}
                  />
                  <Text style={styles.photoToolDangerText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.photoHint}>
              Your first photo will be the cover shown on the feed.
            </Text>
          )}

          {photoNotice ? (
            <View style={styles.photoNotice}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.danger}
              />
              <View style={styles.photoNoticeBody}>
                <Text
                  style={styles.photoNoticeText}
                  accessibilityLiveRegion="polite"
                >
                  {photoNotice.message}
                </Text>
                {photoNotice.showSettings ? (
                  <AppButton
                    label="Open settings"
                    icon="settings-outline"
                    variant="secondary"
                    onPress={() => {
                      void Linking.openSettings();
                    }}
                    style={styles.settingsButton}
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          {photoError ? (
            <Text style={styles.photoError} accessibilityLiveRegion="polite">
              {photoError}
            </Text>
          ) : null}

          {photos.length < MAX_PHOTOS ? (
            <View style={styles.sourceRow}>
              <AppButton
                label="Camera"
                icon="camera-outline"
                variant="secondary"
                size="sm"
                disabled={isBusy}
                loading={busySource === 'camera'}
                onPress={() => void handleTakePhoto()}
                accessibilityHint="Take a photo of the item you are selling"
                style={styles.sourceButton}
              />
              <AppButton
                label="Gallery"
                icon="images-outline"
                variant="secondary"
                size="sm"
                disabled={isBusy}
                loading={busySource === 'gallery'}
                onPress={() => void handleChoosePhotos()}
                accessibilityHint="Choose photos of the item from your library"
                style={styles.sourceButton}
              />
            </View>
          ) : (
            <Text style={styles.photoLimitText}>
              All 3 photos added. Remove one to add a different shot.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Item details</Text>

          <FormField
            compact
            label="Title"
            placeholder="What are you selling?"
            value={form.title}
            onChangeText={(value) => updateField('title', value)}
            error={errors.title}
            maxLength={80}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <SelectField
                compact
                icon={null}
                label="Category"
                value={form.category}
                placeholder="Select"
                options={CATEGORIES}
                onChange={(value) => updateField('category', value as Category)}
                error={errors.category}
              />
            </View>
            <View style={styles.fieldHalf}>
              <FormField
                compact
                label="Price (₱)"
                placeholder="0"
                value={form.price}
                onChangeText={(value) =>
                  updateField('price', value.replace(/[^\d]/g, ''))
                }
                error={errors.price}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.conditionField}>
            <Text style={styles.fieldLabel}>Condition</Text>
            <SegmentedControl
              variant="form"
              options={CONDITIONS.map((condition) => ({
                key: condition,
                label: condition,
              }))}
              value={form.condition || null}
              onChange={(value) => updateField('condition', value)}
              accessibilityLabel="Condition"
            />
            {errors.condition ? (
              <Text style={styles.fieldError}>{errors.condition}</Text>
            ) : null}
          </View>

          <FormField
            compact
            label="Description"
            placeholder="Condition, inclusions, and other helpful details…"
            value={form.description}
            onChangeText={(value) => updateField('description', value)}
            error={errors.description}
            multiline
            numberOfLines={4}
            maxLength={500}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferred meetup spot</Text>
          <Text style={styles.cardHint}>
            Choose the campus spot where buyers can meet you.
          </Text>
          <View style={styles.meetupChips}>
            {MEETUP_SPOTS.map((spot) => (
              <FilterChip
                compact
                key={spot}
                label={spot}
                active={form.meetupSpot === spot}
                onPress={() => updateField('meetupSpot', spot)}
              />
            ))}
          </View>
          {errors.meetupSpot ? (
            <Text style={styles.fieldError}>{errors.meetupSpot}</Text>
          ) : null}
        </View>

        <ErrorBanner message={formError} />

        {formHint ? <Text style={styles.formHint}>{formHint}</Text> : null}

        <AppButton
          label={
            isSubmitting
              ? isEditMode
                ? 'Saving…'
                : 'Posting…'
              : isEditMode
                ? 'Save changes'
                : 'Post item'
          }
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleSubmit}
          fullWidth
          style={styles.submit}
        />

        {isEditMode ? (
          <AppButton
            label="Cancel"
            variant="ghost"
            disabled={isSubmitting}
            onPress={cancelEdit}
          />
        ) : null}

        <View style={styles.safetyNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.safetyText}>
            Meet only at the campus spots listed. Inspect the item before paying.
          </Text>
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
    gap: spacing.md,
    marginBottom: spacing.lg,
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
  sellingAs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 58,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  sellingCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellingText: {
    flex: 1,
    minWidth: 0,
  },
  sellingName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.success,
  },
  sellingMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  cardCount: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  cardHint: {
    marginTop: 2,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  photoSlot: {
    flex: 1,
    height: 96,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  photoSlotEmpty: {
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  photoSlotMain: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  photoSlotFilled: {
    padding: 0,
  },
  photoSlotSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  photoSlotPressed: {
    opacity: 0.86,
  },
  photoSlotText: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  photoSlotTextMain: {
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceMuted,
  },
  coverBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  coverBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs - 2,
    lineHeight: lineHeights.xs - 4,
    color: colors.white,
  },
  photoToolbar: {
    gap: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  photoToolbarLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  photoToolbarActions: {
    flexDirection: 'row',
    gap: 6,
  },
  photoToolAction: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  photoToolActionDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  photoToolPressed: {
    opacity: 0.8,
  },
  photoToolText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  photoToolDangerText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  photoHint: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  photoLimitText: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  photoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  photoNoticeBody: {
    flex: 1,
  },
  photoNoticeText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  settingsButton: {
    marginTop: spacing.sm,
  },
  photoError: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sourceButton: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldHalf: {
    flex: 1,
    minWidth: 0,
  },
  conditionField: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginBottom: 6,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.label,
  },
  fieldError: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  meetupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  formHint: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  submit: {
    minHeight: 50,
    marginTop: 2,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.md,
  },
  safetyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
}));
