import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Styles for <OrderCard>. Separate file per convention. */
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
  headerText: {
    flex: 1,
  },
  partnerName: {
    ...typography.h2,
    fontSize: 17,
    marginTop: 2,
  },
  label: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  contactPhone: {
    ...typography.button,
    fontSize: 13,
    color: colors.textPrimary,
  },
  // Route.
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
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  navigateText: {
    flex: 1,
  },
  navigateLabel: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.onPrimaryWash,
  },
  navigateValue: {
    ...typography.button,
    fontSize: 14,
    color: colors.textOnPrimary,
    marginTop: 2,
  },
  note: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  // Status tag.
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
    // Not the WhatsApp green: at this size it fails contrast on `surface`, so
    // the brand colour stays on the icon beside it.
    color: colors.textPrimary,
  },
  // Bottom row: order id ↔ delivery fee.
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    flex: 1,
  },
  footerFee: {
    alignItems: 'flex-end',
  },
  orderId: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    ...typography.h2,
    fontSize: 18,
    color: colors.primary,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
});
