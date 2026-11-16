import { Ionicons } from '@expo/vector-icons';
import type { Category } from '../types';

/**
 * Visual identity for each listing category.
 *
 * MVP photos use placeholders, so the category icon and tint do the visual
 * work on cards and the details hero. Keeping the mapping here means a new
 * category only needs one edit.
 */
export interface CategoryMeta {
  icon: keyof typeof Ionicons.glyphMap;
  /** Strong colour for the icon and label. */
  color: string;
  /** Soft background tint. */
  tint: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Textbooks: { icon: 'book-outline', color: '#2F5F9F', tint: '#E8F0FB' },
  Uniforms: { icon: 'shirt-outline', color: '#8A4E1C', tint: '#FDF0E4' },
  Gadgets: { icon: 'hardware-chip-outline', color: '#0E6A5F', tint: '#E4F2EE' },
  'Dorm Items': { icon: 'bed-outline', color: '#6E4BB5', tint: '#F1ECFB' },
  Food: { icon: 'fast-food-outline', color: '#A33A3A', tint: '#FBEAEA' },
  Others: { icon: 'pricetag-outline', color: '#5F6F75', tint: '#EEF2F2' },
};

export function getCategoryMeta(category: Category): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META.Others;
}
