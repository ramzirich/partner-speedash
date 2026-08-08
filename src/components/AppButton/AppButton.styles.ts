import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Styles for <AppButton>. Kept in a separate file (your "styling in a
 * different file" requirement) — the RN-native equivalent of a .css module.
 */
export const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  // States
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  // Labels
  label: {
    ...typography.button,
  },
  labelPrimary: {
    color: colors.textOnPrimary,
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
  labelOutline: {
    color: colors.primary,
  },
  labelGhost: {
    color: colors.primary,
  },
  labelDanger: {
    color: colors.textOnPrimary,
  },
});
