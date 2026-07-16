import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  identity: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.xs,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  name: {
    ...typography.h2,
  },
  email: {
    ...typography.body,
  },
  roleChip: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: {
    ...typography.button,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
