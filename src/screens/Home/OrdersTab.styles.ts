import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Height of the tally pill riding next to a segment's label. */
const COUNT_SIZE = 20;

/** Styles for <OrdersTab>. Separate file per convention. */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },

  // Open ⇄ delivered switch — a track holding two equal halves, the active one
  // lifted out of it on a white card.
  segments: {
    flexDirection: 'row',
    padding: spacing.xs,
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.background,
  },
  segmentPressed: {
    opacity: 0.6,
  },
  segmentLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentLabelActive: {
    color: colors.primary,
  },
  segmentCount: {
    minWidth: COUNT_SIZE,
    height: COUNT_SIZE,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCountActive: {
    backgroundColor: colors.primary,
  },
  segmentCountText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  segmentCountTextActive: {
    color: colors.textOnPrimary,
  },
  flatList: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  placeholderText: {
    ...typography.body,
    textAlign: 'center',
  },
});
