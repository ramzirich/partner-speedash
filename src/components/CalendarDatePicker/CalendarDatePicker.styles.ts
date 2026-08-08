import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Styles for <CalendarDatePicker>. Separate file per convention. */
export const styles = StyleSheet.create({
  // The tappable date field — brand orange.
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  fieldIcon: {
    fontSize: 16,
  },
  fieldText: {
    flex: 1,
    ...typography.button,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
  fieldChevron: {
    fontSize: 12,
    color: colors.textOnPrimary,
  },

  // Centered modal.
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheetHeader: {
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sheetTitle: {
    ...typography.button,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sheetHint: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
});
