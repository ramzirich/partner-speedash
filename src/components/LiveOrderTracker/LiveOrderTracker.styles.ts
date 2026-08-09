import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontSize: 17,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.button,
    fontSize: 15,
    color: colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryWash,
  },
  searchingText: {
    flex: 1,
    gap: 2,
  },
  searchingTitle: {
    ...typography.button,
    fontSize: 14,
    color: colors.primary,
  },
  searchingHint: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  driverBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentWash,
  },
  driverText: {
    flex: 1,
    gap: 2,
  },
  driverLabel: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  driverName: {
    ...typography.button,
    fontSize: 15,
    color: colors.textPrimary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactText: {
    ...typography.button,
    fontSize: 14,
    color: colors.textPrimary,
  },

  detail: {
    gap: 2,
  },
  detailLabel: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  detailValue: {
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

  staleNotice: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.warning,
  },
  errorNotice: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
  },

  pressed: {
    opacity: 0.85,
  },
});
