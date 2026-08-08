import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    maxWidth: '92%',
  },

  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
