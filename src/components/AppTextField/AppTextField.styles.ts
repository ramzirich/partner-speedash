import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.button,
    color: colors.textPrimary,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: 1.5,
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
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  toggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  toggleText: {
    ...typography.link,
    fontSize: 13,
  },
  errorText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
