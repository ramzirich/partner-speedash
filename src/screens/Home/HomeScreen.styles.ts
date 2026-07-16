import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  greetingLabel: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  greetingName: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  mapSection: {
    flex: 1,
    overflow: 'hidden',
  },
  belowSection: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bannerLabel: {
    ...typography.button,
    color: colors.textOnPrimary,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bannerSub: {
    ...typography.body,
    color: colors.textOnPrimary,
    opacity: 0.9,
    fontSize: 12,
  },
  bannerValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  earningsIcon: {
    fontSize: 18,
  },
  earningsLabel: {
    ...typography.button,
    fontSize: 13,
    color: colors.textSecondary,
  },
  earningsValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.success,
  },

  // Bottom buttons.
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  // Pending-orders badge on the Orders button.
  tabBadge: {
    position: 'absolute',
    top: -4,
    left: 14,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  tabBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  tabLabel: {
    ...typography.button,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
});
