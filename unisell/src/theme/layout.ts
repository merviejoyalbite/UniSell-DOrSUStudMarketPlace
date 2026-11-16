import { useWindowDimensions } from 'react-native';

/**
 * Responsive layout tokens.
 *
 * The floating bottom tab bar is used on every screen size; these breakpoints
 * only control how the page content adapts to the window width.
 *
 * Screens should use `useBreakpoint()` instead of checking `Dimensions.get()`
 * directly so every screen switches at the same width.
 */
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** Window widths where listing grids gain a column (2 / 3 / 4 / 5). */
export const columnBreakpoints = {
  two: 768,
  three: 1024,
  four: 1440,
} as const;

export function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Adaptive listing-grid column count: 2 columns on phones (under 768px),
 * 3 from 768px, 4 from 1024px and 5 from 1440px.
 */
export function getGridColumns(width: number): number {
  if (width >= columnBreakpoints.four) return 5;
  if (width >= columnBreakpoints.three) return 4;
  if (width >= columnBreakpoints.two) return 3;
  return 2;
}

export const layout = {
  /** Widest the marketplace content may grow on a large monitor. */
  maxContentWidth: 1200,
  /** Long forms stay readable instead of spanning the whole window. */
  maxFormWidth: 720,
  /** Auth cards stay compact; the hero sits beside them on desktop. */
  maxAuthWidth: 480,
  /** Listing details use a wider two-column canvas. */
  maxDetailsWidth: 1120,
  /** Legacy two-column profile cap; Profile now uses `maxFormWidth`. */
  maxProfileWidth: 1120,
  /** Full left navigation sidebar width on desktop. */
  sidebarWidth: 260,
  /** Compact icon-only sidebar width on tablets. */
  sidebarWidthCompact: 76,
  /** Floating bottom navigation bar (mobile only). */
  tabBarHeight: 76,
  /** Gap between the floating bar and the screen edge. */
  tabBarMargin: 16,
  /** Horizontal page padding per breakpoint. */
  pagePadding: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
  },
  /** Gap between cards in the product grid. */
  gridGap: {
    mobile: 12,
    tablet: 16,
    desktop: 20,
  },
} as const;

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Width of the left navigation sidebar; 0 when it is hidden (phones). */
  sidebarWidth: number;
  /** Product grid columns for the current width. */
  columns: number;
  /** Horizontal page padding for the current width. */
  pagePadding: number;
  /** Gap between grid cards. */
  gridGap: number;
}

export function useBreakpoint(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  const sidebarWidth =
    breakpoint === 'desktop'
      ? layout.sidebarWidth
      : breakpoint === 'tablet'
        ? layout.sidebarWidthCompact
        : 0;

  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    sidebarWidth,
    columns: getGridColumns(width),
    pagePadding: layout.pagePadding[breakpoint],
    gridGap: layout.gridGap[breakpoint],
  };
}
