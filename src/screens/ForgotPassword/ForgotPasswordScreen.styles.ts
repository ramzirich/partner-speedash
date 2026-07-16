import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/** Styles for <ForgotPasswordScreen>. Separate file per project convention. */
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.textPrimary,
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
  form: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
