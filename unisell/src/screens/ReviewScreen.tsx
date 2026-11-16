import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { ListingImage } from '../components/ListingImage';
import { RoundIconButton } from '../components/RoundIconButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useReviews } from '../context/ReviewsContext';
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
import type { ReviewTag, ReviewTarget } from '../types';
import { REVIEW_TAGS } from '../types';
import { getReviewTarget, REVIEW_COMMENT_MAX } from '../api/reviewsApi';
import { getInitials } from '../utils/formatters';

type LoadStatus = 'loading' | 'ready' | 'error';

const RATING_LABELS = [
  '',
  'Poor',
  'Fair',
  'Good',
  'Very good',
  'Excellent',
] as const;

/**
 * Phase 3 — Rate and review.
 *
 * Mirrors the Figma "Rate your meetup / Share your experience" screen: a
 * completed-sale summary, the other student, a 1–5 star picker, the four
 * Figma tags, an optional 200-character comment and a submit button. Both the
 * buyer and the seller can review the other party once the listing is sold.
 *
 * Eligibility and the reviewee come from `getReviewTarget`, which re-checks the
 * session and the completed sale; the screen never guesses either.
 */
export function ReviewScreen({
  navigation,
  route,
}: RootStackScreenProps<'Review'>) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { addReview } = useReviews();
  const { listingId } = route.params;

  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const loadTarget = useCallback(async () => {
    setStatus('loading');
    setLoadError(null);

    try {
      const nextTarget = await getReviewTarget(listingId);
      setTarget(nextTarget);
      setAlreadyReviewed(nextTarget.alreadyReviewed);
      setDone(nextTarget.alreadyReviewed);
      setStatus('ready');
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Could not open this review. Please try again.',
      );
      setStatus('error');
    }
  }, [listingId]);

  useEffect(() => {
    void loadTarget();
  }, [loadTarget]);

  function toggleTag(tag: ReviewTag) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    );
  }

  async function handleSubmit() {
    if (!target || submitting) return;

    if (rating < 1) {
      setFormError('Choose a star rating before submitting your review.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await addReview({
        listingId: target.listing.id,
        reservationId: target.reservation.id,
        rating,
        tags,
        comment,
      });
      setAlreadyReviewed(false);
      setDone(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Could not save your review. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
    <View style={styles.header}>
      <RoundIconButton
        icon="arrow-back"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        size={44}
      />
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Rate your meetup
        </Text>
        <Text style={styles.subtitle}>Share your experience</Text>
      </View>
    </View>
  );

  if (status === 'loading') {
    return (
      <ScreenContainer padded={false} maxWidth={layout.maxFormWidth}>
        <View style={styles.page}>
          {header}
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
              accessibilityLabel="Loading review"
            />
            <Text style={styles.loadingText}>Opening your review…</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (status === 'error' || !target) {
    return (
      <ScreenContainer padded={false} maxWidth={layout.maxFormWidth}>
        <View style={styles.page}>
          {header}
          <ErrorBanner
            message={loadError ?? 'Could not open this review.'}
            onRetry={() => {
              void loadTarget();
            }}
          />
          <AppButton
            label="Go back"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.errorAction}
          />
        </View>
      </ScreenContainer>
    );
  }

  if (done) {
    return (
      <ScreenContainer padded={false} maxWidth={layout.maxFormWidth}>
        <View style={styles.page}>
          {header}
          <View style={styles.thanksCard}>
            <View style={styles.thanksIcon}>
              <Ionicons name="checkmark" size={40} color={colors.onSuccess} />
            </View>
            <Text style={styles.thanksTitle}>Thank you for your review!</Text>
            <Text style={styles.thanksBody}>
              {alreadyReviewed
                ? 'You already reviewed this completed sale.'
                : 'Your feedback helps keep the DOrSU student marketplace trusted and friendly.'}
            </Text>
            <AppButton
              label="Return to previous screen"
              onPress={() => navigation.goBack()}
              style={styles.thanksAction}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      avoidKeyboard
      padded={false}
      maxWidth={layout.maxFormWidth}
    >
      <View style={styles.page}>
        {header}

        <View style={styles.summaryCard}>
          <ListingImage listing={target.listing} style={styles.summaryImage} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryEyebrow}>Completed sale</Text>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {target.listing.title}
            </Text>
            <Text style={styles.summaryMeta}>Listing #{target.listing.id}</Text>
          </View>
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>Sold</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.person}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(target.revieweeName)}
              </Text>
            </View>
            <Text style={styles.personTitle}>
              How was your experience with {target.revieweeName}?
            </Text>
            <Text style={styles.personBody}>
              Your review will appear on their profile.
            </Text>
          </View>

          <View
            style={styles.starPicker}
            accessibilityRole="radiogroup"
            accessibilityLabel={
              rating > 0 ? `${rating} out of 5 stars` : 'Star rating'
            }
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const active = rating >= value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${value} ${
                    value === 1 ? 'star' : 'stars'
                  }`}
                  accessibilityState={{ selected: rating === value }}
                  onPress={() => {
                    setRating(value);
                    setFormError(null);
                  }}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.starButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={active ? 'star' : 'star-outline'}
                    size={32}
                    color={active ? colors.rating : colors.placeholder}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.ratingLabel}>
            {rating > 0 ? RATING_LABELS[rating] : 'Tap to rate'}
          </Text>

          <Text style={styles.sectionTitle}>What stood out?</Text>
          <View style={styles.tagGrid}>
            {REVIEW_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  accessibilityRole="checkbox"
                  accessibilityLabel={tag}
                  accessibilityState={{ checked: active }}
                  onPress={() => toggleTag(tag)}
                  style={({ pressed }) => [
                    styles.tag,
                    active && styles.tagActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[styles.tagText, active && styles.tagTextActive]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FormField
            compact
            label="Leave a comment"
            labelHint={`Optional · ${comment.length}/${REVIEW_COMMENT_MAX}`}
            placeholder="Tell other students about your experience…"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={REVIEW_COMMENT_MAX}
            autoCapitalize="sentences"
          />

          {formError ? (
            <Text accessibilityRole="alert" style={styles.formError}>
              {formError}
            </Text>
          ) : null}

          <AppButton
            label="Submit review"
            icon="star-outline"
            disabled={rating < 1}
            loading={submitting}
            onPress={() => {
              void handleSubmit();
            }}
            fullWidth
            style={styles.submit}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  page: {
    flex: 1,
    paddingHorizontal: 17,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  errorAction: {
    marginTop: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 12,
    ...shadows.card,
  },
  summaryImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  summaryInfo: {
    flex: 1,
    minWidth: 0,
  },
  summaryEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.success,
  },
  summaryTitle: {
    marginTop: 3,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  summaryMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  soldBadge: {
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  soldBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.success,
  },
  formCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 12,
    ...shadows.card,
  },
  person: {
    alignItems: 'center',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.onPrimary,
  },
  personTitle: {
    marginTop: 10,
    marginBottom: 3,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
    textAlign: 'center',
  },
  personBody: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  starPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 12,
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingLabel: {
    minHeight: 20,
    marginTop: 2,
    marginBottom: 12,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 8,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: spacing.md,
  },
  tag: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
  },
  tagActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tagText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  tagTextActive: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  formError: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.danger,
  },
  submit: {
    marginTop: spacing.md,
  },
  thanksCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  thanksIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    ...shadows.card,
  },
  thanksTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    color: colors.text,
    textAlign: 'center',
  },
  thanksBody: {
    marginTop: 8,
    maxWidth: 340,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  thanksAction: {
    marginTop: spacing.lg,
    minWidth: 240,
  },
  pressed: {
    opacity: 0.75,
  },
}));
