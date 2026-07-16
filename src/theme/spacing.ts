/**
 * 4-point spacing scale. Use `spacing.md` instead of magic numbers so layout
 * rhythm stays consistent across every screen.
 */
export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
});

export const radius = Object.freeze({
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
});

export type AppSpacing = typeof spacing;
