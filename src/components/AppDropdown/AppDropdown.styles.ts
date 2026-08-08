import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Styles for <AppDropdown>. Separate file per convention. */
export const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerOpen: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryWashSoft,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerLabel: {
    ...typography.button,
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  triggerLabelSelected: {
    color: colors.textPrimary,
  },
  panel: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.surface,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionLabel: {
    ...typography.button,
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionLabelSuccess: {
    color: colors.success,
  },
  optionLabelDanger: {
    color: colors.danger,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  dotSuccess: {
    backgroundColor: colors.success,
  },
  dotDanger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
});
