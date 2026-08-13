import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerMeta: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.h2,
    fontSize: 18,
    color: colors.primary,
  },
  label: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  orderId: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    ...typography.button,
    fontSize: 11,
  },

  place: {
    gap: 2,
  },
  location: {
    ...typography.button,
    fontSize: 14,
    color: colors.textPrimary,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryWash,
  },
  navigateText: {
    flex: 1,
    gap: 2,
  },
  navigateValue: {
    ...typography.button,
    fontSize: 14,
    color: colors.textPrimary,
  },

  note: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  contactLabel: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.xs,
  },
  contactName: {
    ...typography.button,
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  contactValue: {
    ...typography.button,
    fontSize: 14,
    color: colors.textPrimary,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  customerLabel: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  customerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.xs,
  },
  customerPhone: {
    ...typography.button,
    fontSize: 14,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.sm,
  },

  pressed: {
    opacity: 0.85,
  },
});
