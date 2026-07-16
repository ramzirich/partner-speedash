/**
 * Single source of truth for colours. Never hardcode a hex value in a
 * component or style file — reference a token here so re-theming is one edit.
 */
export const colors = Object.freeze({
  primary: '#FF6B00',
  primaryDark: '#E55F00',
  primaryLight: '#FF8C3A',
  accent: '#009688',

  // Neutrals
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E5E7EB',

  // Feedback
  danger: '#E53935',
  success: '#2E7D32',
  warning: '#F59E0B',

  // Overlays
  scrim: 'rgba(17, 17, 17, 0.45)',
  transparent: 'transparent',
});

export type AppColors = typeof colors;
