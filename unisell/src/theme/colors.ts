import { lightColors } from './palettes';

/**
 * UniSell colour tokens.
 *
 * Kept as a named export for older code and for the `AppColor` type. Screens
 * should prefer `useTheme()` so colours follow the active light/dark palette.
 */
export const colors = lightColors;

export type AppColor = keyof typeof colors;
