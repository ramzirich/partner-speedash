import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const HANDLE_WIDTH = 44;
const HANDLE_HEIGHT = 4;
const EARNINGS_ICON_BOX = 44;


const MAP_MIN_HEIGHT = 150;
const MAP_MAX_HEIGHT = 300;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  mapSection: {
    flex: 1,
    minHeight: MAP_MIN_HEIGHT,
    maxHeight: MAP_MAX_HEIGHT,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  // Sits over the map without stealing its gestures.
  mapOverlay: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
  },

  // --- Summary sheet --------------------------------------------------------
  sheet: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetCompact: {
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },

  // --- Sheet head (date + order count) --------------------------------------
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  overline: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryWash,
  },
  countPillText: {
    ...typography.button,
    fontSize: 12,
    lineHeight: 15,
    color: colors.primary,
  },

  // --- Earnings (the hero line) ---------------------------------------------
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  earningsIconBox: {
    width: EARNINGS_ICON_BOX,
    height: EARNINGS_ICON_BOX,
    borderRadius: radius.md,
    backgroundColor: colors.primaryWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsText: {
    flex: 1,
  },
  earningsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  earningsSub: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  earningsValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  earningsValueCompact: {
    fontSize: 24,
    lineHeight: 30,
  },

  // --- Progress -------------------------------------------------------------
  progressBlock: {
    gap: spacing.sm,
  },
  progressLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  progressPercent: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },

  // --- Breakdown ------------------------------------------------------------
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
