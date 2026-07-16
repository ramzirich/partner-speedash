import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Styles for <SignInScreen>. Separate file per the project convention. Layout
 * is responsive: content scrolls and the form grows with the available space.
 */
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

  // --- Header ---------------------------------------------------------------
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

  // --- Intro ----------------------------------------------------------------
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

  // --- Form -----------------------------------------------------------------
  form: {
    gap: spacing.md,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  forgotText: {
    ...typography.link,
  },

  // --- Footer ---------------------------------------------------------------
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
