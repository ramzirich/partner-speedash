import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Circular badge holding a row's leading glyph. */
const BADGE_SIZE = 28;
const DOT_SIZE = 7;

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  statusText: {
    ...typography.button,
    fontSize: 12,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  orderId: {
    ...typography.button,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },

  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  rowAccent: {
    backgroundColor: colors.primaryWash,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  label: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  value: {
    ...typography.button,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
  },

  note: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
    marginTop: spacing.xs / 2,
  },
  noteText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.xs / 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  amount: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 24,
    color: colors.primary,
  },

  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs / 2,
  },

  pressed: {
    opacity: 0.7,
  },
});
