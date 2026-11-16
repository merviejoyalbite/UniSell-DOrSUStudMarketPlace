import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Listing } from '../types';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
  useTheme,
} from '../theme';
import { AppButton } from './AppButton';

interface ListingActionsSheetProps {
  listing: Listing | null;
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onMarkSold: () => void;
  onMarkReserved: () => void;
  onMarkAvailable: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Owner-only action sheet shared by Profile > My listings. The same actions
 * are rendered as buttons on Listing Details; both paths call the same context
 * functions, which re-check ownership in the API service layer.
 */
export function ListingActionsSheet({
  listing,
  visible,
  busy = false,
  onClose,
  onMarkSold,
  onMarkReserved,
  onMarkAvailable,
  onEdit,
  onDelete,
}: ListingActionsSheetProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [cancelHovered, setCancelHovered] = useState(false);

  if (!listing) return null;

  const isSold = listing.status === 'sold';
  const isReserved = listing.status === 'reserved';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Close listing actions"
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Manage listing</Text>
              <Text style={styles.title} numberOfLines={2}>
                {listing.title}
              </Text>
            </View>
            {busy ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                accessibilityLabel="Updating listing"
              />
            ) : null}
          </View>

          <View style={styles.actions}>
            {isSold ? (
              <>
                <AppButton
                  label="Delete this sold listing"
                  icon="trash-outline"
                  variant="danger"
                  disabled={busy}
                  onPress={onDelete}
                />
                <AppButton
                  label="Mark as available again"
                  icon="refresh-outline"
                  variant="secondary"
                  disabled={busy}
                  onPress={onMarkAvailable}
                />
              </>
            ) : (
              <>
                <AppButton
                  label="Mark as sold"
                  icon="checkmark-done-outline"
                  variant="success"
                  disabled={busy}
                  onPress={onMarkSold}
                />
                {isReserved ? (
                  <AppButton
                    label="Mark as available"
                    icon="refresh-outline"
                    variant="secondary"
                    disabled={busy}
                    onPress={onMarkAvailable}
                  />
                ) : (
                  <AppButton
                    label="Mark as reserved"
                    icon="time-outline"
                    variant="warning"
                    disabled={busy}
                    onPress={onMarkReserved}
                  />
                )}
                <AppButton
                  label="Edit listing"
                  icon="create-outline"
                  variant="secondary"
                  disabled={busy}
                  onPress={onEdit}
                />
                <AppButton
                  label="Delete listing"
                  icon="trash-outline"
                  variant="danger"
                  disabled={busy}
                  onPress={onDelete}
                />
              </>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel listing actions"
            onPress={onClose}
            onHoverIn={() => setCancelHovered(true)}
            onHoverOut={() => setCancelHovered(false)}
            style={({ pressed }) => [
              styles.cancel,
              cancelHovered && styles.cancelHovered,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={16} color={colors.textMuted} />
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors, shadows) => ({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    ...shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
  },
  cancel: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
  },
  cancelHovered: {
    backgroundColor: colors.surfaceMuted,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.75,
  },
}));
