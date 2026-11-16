import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  lineHeights,
  radii,
  spacing,
} from '../theme';
import { CATEGORIES, CONDITIONS } from '../types';
import type { CategoryFilter, ConditionFilter } from '../utils/listings';
import { getCategoryMeta } from '../utils/categoryMeta';
import { AppButton } from './AppButton';
import { FilterChip } from './FilterChip';

interface SearchFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  condition: ConditionFilter;
  onConditionChange: (value: ConditionFilter) => void;
  showSold: boolean;
  onToggleSold: () => void;
  onReset: () => void;
  /** Live result count shown on the apply button. */
  resultCount: number;
}

const CONDITION_OPTIONS: ConditionFilter[] = ['All', ...CONDITIONS];

/**
 * Search filter sheet.
 *
 * Mirrors the Figma bottom sheet: handle, "Filter results / Find exactly what
 * you need", Reset, category chips, condition chips, a show-sold switch and a
 * live "Show N results" button. Only the filters the app can actually apply are
 * included; Figma's course/year/department/price controls are left out because
 * they are optional Phase 3 filters.
 */
export function SearchFiltersSheet({
  visible,
  onClose,
  category,
  onCategoryChange,
  condition,
  onConditionChange,
  showSold,
  onToggleSold,
  onReset,
  resultCount,
}: SearchFiltersSheetProps) {
  const styles = useStyles();
  const [resetHovered, setResetHovered] = useState(false);

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
          accessibilityLabel="Close filters"
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text accessibilityRole="header" style={styles.title}>
                Filter results
              </Text>
              <Text style={styles.subtitle}>Find exactly what you need</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
              onPress={onReset}
              onHoverIn={() => setResetHovered(true)}
              onHoverOut={() => setResetHovered(false)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.resetButton,
                resetHovered && styles.resetHovered,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldset}>
              <Text style={styles.legend}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <FilterChip
                  compact
                  label="All"
                  active={category === 'All'}
                  onPress={() => onCategoryChange('All')}
                />
                {CATEGORIES.map((item) => (
                  <FilterChip
                    key={item}
                    compact
                    label={item}
                    category={item}
                    icon={getCategoryMeta(item).icon}
                    active={category === item}
                    onPress={() => onCategoryChange(item)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldset}>
              <Text style={styles.legend}>Condition</Text>
              <View style={styles.conditionRow}>
                {CONDITION_OPTIONS.map((item) => (
                  <View key={item} style={styles.conditionChip}>
                    <FilterChip
                      compact
                      label={item === 'All' ? 'Any' : item}
                      active={condition === item}
                      onPress={() => onConditionChange(item)}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Show sold items</Text>
                <Text style={styles.toggleHint}>
                  Include items that are already sold.
                </Text>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Show sold items"
                accessibilityState={{ checked: showSold }}
                aria-checked={showSold}
                onPress={onToggleSold}
                style={[styles.toggle, showSold && styles.toggleOn]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    showSold && styles.toggleThumbOn,
                  ]}
                />
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton
              label={`Show ${resultCount} ${
                resultCount === 1 ? 'result' : 'results'
              }`}
              onPress={onClose}
              fullWidth
            />
          </View>
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
    maxWidth: 560,
    maxHeight: '86%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: spacing.lg,
    ...shadows.floating,
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
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 19,
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
  resetButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
  },
  resetHovered: {
    backgroundColor: colors.surfaceMuted,
  },
  resetText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.primary,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  fieldset: {
    marginBottom: 14,
  },
  legend: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.label,
  },
  chipRow: {
    gap: 7,
    paddingTop: 7,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 7,
  },
  conditionChip: {
    flex: 1,
    minWidth: 0,
  },
  toggleRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  toggleText: {
    flex: 1,
    minWidth: 0,
  },
  toggleTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.text,
  },
  toggleHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    color: colors.textMuted,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: radii.pill,
    padding: 3,
    justifyContent: 'center',
    backgroundColor: colors.borderStrong,
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  footer: {
    paddingTop: spacing.sm,
  },
  pressed: {
    opacity: 0.75,
  },
}));
