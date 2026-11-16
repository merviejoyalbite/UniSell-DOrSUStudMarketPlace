import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { ErrorState } from '../components/ErrorState';
import { FormField } from '../components/FormField';
import { ListingImage } from '../components/ListingImage';
import { LoadingState } from '../components/LoadingState';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { useReservations } from '../context/ReservationsContext';
import type { RootStackScreenProps } from '../navigation/types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  layout,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import { formatPeso } from '../utils/formatters';
import { canManageListing } from '../utils/permissions';

const TIME_SLOTS = [
  { label: '12:00 PM', value: '12:00' },
  { label: '2:00 PM', value: '14:00' },
  { label: '4:00 PM', value: '16:00' },
] as const;

interface DateOption {
  key: string;
  dayLabel: string;
  dateLabel: string;
}

/** Local calendar key, avoiding the UTC day-shift of toISOString(). */
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateOptions(count = 7): DateOption[] {
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index,
    );

    return {
      key: toDateKey(date),
      dayLabel:
        index === 0
          ? 'Today'
          : index === 1
            ? 'Tomorrow'
            : date.toLocaleDateString(undefined, { weekday: 'short' }),
      dateLabel: date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    };
  });
}

/** Combine a local date key and "HH:mm" slot into an ISO timestamp. */
function combineDateAndTime(dateKey: string, timeValue: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

/**
 * Buyer reserve flow (Phase 3).
 *
 * Matches the Figma "Reserve request / Set your meetup" screen: the item
 * preview, a glass sheet, meetup spot, date and time-slot pickers, an optional
 * note, the cash-at-meetup notice and a "Send reserve request" button.
 *
 * Quantity is intentionally absent: our listings are single items and the
 * project decided not to add a quantity model. The request is stored in the
 * new `reservations` resource and the seller accepts or declines it from the
 * dashboard (next Phase 3 item).
 */
export function ReserveScreen({
  navigation,
  route,
}: RootStackScreenProps<'Reserve'>) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { listings, status, error, refresh } = useListings();
  const { reservations, createReservation } = useReservations();

  const [chosenSpot, setChosenSpot] = useState<string | null>(null);
  const [dateOptions] = useState(buildDateOptions);
  const [dateKey, setDateKey] = useState(dateOptions[0].key);
  const [timeValue, setTimeValue] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const listing = listings.find((item) => item.id === route.params.listingId);
  const selectedSpot = chosenSpot ?? listing?.meetupSpot ?? '';
  const activeReservation = user
    ? reservations.find(
        (reservation) =>
          reservation.listingId === route.params.listingId &&
          reservation.buyerId === user.id &&
          (reservation.status === 'pending' ||
            reservation.status === 'accepted'),
      )
    : undefined;

  if (!listing) {
    const body =
      status === 'loading' || status === 'idle' ? (
        <LoadingState message="Loading listing…" />
      ) : status === 'error' ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : (
        <EmptyState
          icon="alert-circle-outline"
          title="This listing is no longer available"
          message="The seller may have deleted it. Head back to the feed for more finds."
          actionLabel="Back to feed"
          onAction={() => navigation.navigate('Main', { screen: 'Home' })}
        />
      );

    return (
      <ScreenContainer scroll maxWidth={layout.maxFormWidth}>
        <View style={styles.stateWrap}>{body}</View>
      </ScreenContainer>
    );
  }

  if (canManageListing(user, listing)) {
    return (
      <ScreenContainer scroll maxWidth={layout.maxFormWidth}>
        <EmptyState
          icon="storefront-outline"
          title="This is your listing"
          message="You cannot reserve your own item."
          actionLabel="Back to item"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  // Checked before the "already sent" guard: sending a request adds it to the
  // shared list, so without this order the confirmation would be replaced by
  // the "Request already sent" empty state on the same render.
  if (sent) {
    return (
      <ScreenContainer scroll maxWidth={layout.maxFormWidth}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark"
              size={34}
              color={colors.onSuccess}
            />
          </View>
          <Text accessibilityRole="header" style={styles.successTitle}>
            Request sent.
          </Text>
          <Text style={styles.successBody}>
            We’ll notify you when the seller responds.
          </Text>
          <AppButton
            label="Back to home"
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            fullWidth
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="View item details"
            onPress={() => navigation.goBack()}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>View item details</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // Only reached when this screen is opened without sending in this session,
  // e.g. from a stale link. Declined and cancelled requests do not match.
  if (activeReservation) {
    return (
      <ScreenContainer scroll maxWidth={layout.maxFormWidth}>
        <EmptyState
          icon="time-outline"
          title="Request already sent"
          message="You already have a pending or accepted request for this item."
          actionLabel="View item details"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  if (listing.status !== 'available') {
    return (
      <ScreenContainer scroll maxWidth={layout.maxFormWidth}>
        <EmptyState
          icon="lock-closed-outline"
          title="This item is not available"
          message="The seller has reserved or sold it. Browse the feed for another find."
          actionLabel="Back to item"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  // The early returns above narrow `listing`; keep a local alias so the
  // submit closure is not widened back to `Listing | undefined`.
  const reserveListing = listing;

  function submit() {
    if (!selectedSpot || !timeValue) {
      setFormError('Choose a meetup spot, date, and time.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    void (async () => {
      try {
        await createReservation(reserveListing.id, {
          meetupSpot: selectedSpot,
          meetupAt: combineDateAndTime(dateKey, timeValue),
          note,
        });
        setSent(true);
      } catch (reserveError) {
        setFormError(
          reserveError instanceof Error
            ? reserveError.message
            : 'Could not send your reserve request. Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
    })();
  }

  return (
    <ScreenContainer
      scroll
      avoidKeyboard
      padded={false}
      maxWidth={layout.maxFormWidth}
    >
      <View style={styles.page}>
        <View style={styles.previewWrap}>
          <ListingImage
            listing={listing}
            variant="detail"
            style={styles.preview}
          />
        </View>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Reserve request</Text>
              <Text accessibilityRole="header" style={styles.title}>
                Set your meetup
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close reserve request"
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={21} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.itemRow}>
            <ListingImage listing={listing} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {listing.title}
              </Text>
              <Text style={styles.itemMeta}>
                {listing.sellerName} · {listing.condition}
              </Text>
            </View>
            <Text style={styles.itemPrice}>{formatPeso(listing.price)}</Text>
          </View>

          <View style={styles.fieldset}>
            <Text style={styles.legend}>Meetup spot</Text>
            <View style={styles.chipRow}>
              {[listing.meetupSpot].map((spot) => {
                const active = selectedSpot === spot;
                return (
                  <Pressable
                    key={spot}
                    accessibilityRole="radio"
                    accessibilityLabel={spot}
                    accessibilityState={{ selected: active }}
                    onPress={() => setChosenSpot(spot)}
                    style={[
                      styles.optionChip,
                      active && styles.optionChipActive,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color={active ? colors.chipTextActive : colors.chipText}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {spot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldset}>
            <Text style={styles.legend}>Meetup date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateRow}
            >
              {dateOptions.map((option) => {
                const active = dateKey === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityLabel={`${option.dayLabel}, ${option.dateLabel}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setDateKey(option.key)}
                    style={[
                      styles.dateChip,
                      active && styles.dateChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        active && styles.dateDayActive,
                      ]}
                    >
                      {option.dayLabel}
                    </Text>
                    <Text
                      style={[
                        styles.dateValue,
                        active && styles.dateValueActive,
                      ]}
                    >
                      {option.dateLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.fieldset}>
            <Text style={styles.legend}>Time slot</Text>
            <View style={styles.timeRow}>
              {TIME_SLOTS.map((slot) => {
                const active = timeValue === slot.value;
                return (
                  <Pressable
                    key={slot.value}
                    accessibilityRole="radio"
                    accessibilityLabel={slot.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => setTimeValue(slot.value)}
                    style={[
                      styles.timeChip,
                      active && styles.timeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        active && styles.timeTextActive,
                      ]}
                    >
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.scheduleNote}>
            Available Monday–Friday, 11:30 AM–4:30 PM
          </Text>

          <FormField
            label="Note to seller (Optional)"
            placeholder="Add a quick message about your meetup..."
            value={note}
            onChangeText={setNote}
            multiline
            compact
          />

          <View style={styles.cashNotice}>
            <View style={styles.cashIcon}>
              <Text style={styles.cashSymbol}>₱</Text>
            </View>
            <View style={styles.cashText}>
              <Text style={styles.cashTitle}>Pay cash at meetup</Text>
              <Text style={styles.cashBody}>
                No online payment or checkout required.
              </Text>
            </View>
          </View>

          {formError ? (
            <ErrorBanner message={formError} />
          ) : null}

          <AppButton
            label={submitting ? 'Sending request...' : 'Send reserve request'}
            loading={submitting}
            disabled={submitting}
            onPress={submit}
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  previewWrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  preview: {
    width: '100%',
    height: 190,
  },
  sheet: {
    marginTop: -22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.xxl,
    ...shadows.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: radii.sm,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  itemMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  fieldset: {
    marginBottom: spacing.md,
  },
  legend: {
    marginBottom: 7,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.label,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  optionChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
  },
  optionChipActive: {
    borderColor: colors.chipActive,
    backgroundColor: colors.chipActive,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.chipText,
  },
  optionTextActive: {
    fontFamily: fonts.semibold,
    color: colors.chipTextActive,
  },
  dateRow: {
    gap: 7,
    paddingBottom: 2,
  },
  dateChip: {
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
  },
  dateChipActive: {
    borderColor: colors.chipActive,
    backgroundColor: colors.chipActive,
  },
  dateDay: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.chipText,
  },
  dateDayActive: {
    color: colors.chipTextActive,
  },
  dateValue: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.chipText,
  },
  dateValueActive: {
    color: colors.chipTextActive,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 7,
  },
  timeChip: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.chip,
  },
  timeChipActive: {
    borderColor: colors.chipActive,
    backgroundColor: colors.chipActive,
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.chipText,
  },
  timeTextActive: {
    fontFamily: fonts.semibold,
    color: colors.chipTextActive,
  },
  scheduleNote: {
    marginTop: -2,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.textMuted,
  },
  cashNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cashIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cashSymbol: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  cashText: {
    flex: 1,
    minWidth: 0,
  },
  cashTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  cashBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    color: colors.primary,
  },
  successCard: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadows.card,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
    textAlign: 'center',
  },
  successBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  linkButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  pressed: {
    opacity: 0.75,
  },
}));
