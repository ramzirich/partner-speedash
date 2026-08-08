import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';


export const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  titleDanger: {
    color: colors.danger,
  },
  titleSuccess: {
    color: colors.success,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
