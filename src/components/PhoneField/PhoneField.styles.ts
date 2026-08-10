import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Fixed so the picker list can skip measuring — see `getItemLayout`. */
export const COUNTRY_ROW_HEIGHT = 56;

/**
 * Fixed — not a max — so the sheet keeps its size while a search narrows the
 * list instead of collapsing down around the remaining rows.
 */
const SHEET_HEIGHT = '78%';

export const styles = StyleSheet.create({
  // --- Trigger, rendered as the field's `leading` node -----------------------
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.xs,
    paddingRight: spacing.sm,
    marginLeft: -spacing.xs,
    paddingLeft: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  triggerPressed: {
    opacity: 0.6,
  },
  triggerFlag: {
    fontSize: 20,
    lineHeight: 26,
  },
  triggerDial: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // --- Picker sheet ---------------------------------------------------------
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },

  list: {
    flex: 1,
    marginTop: spacing.sm,
  },

  row: {
    height: COUNTRY_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  rowSelected: {
    backgroundColor: colors.primaryWashSoft,
  },
  rowFlag: {
    fontSize: 24,
    lineHeight: 30,
  },
  rowName: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  rowNameSelected: {
    fontWeight: '700',
  },
  rowDial: {
    ...typography.body,
    color: colors.textSecondary,
  },

  empty: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
