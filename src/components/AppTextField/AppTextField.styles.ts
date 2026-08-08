import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const BORDER_WIDTH = 2;

/** Minimum comfortable tap target (iOS HIG / Material both land on 44). */
const TAP_TARGET = 44;

export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.button,
    color: colors.textPrimary,
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.danger,
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  fieldError: {
    borderColor: colors.danger,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  toggle: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  errorText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
