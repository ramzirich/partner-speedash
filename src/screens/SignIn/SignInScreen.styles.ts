import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Styles for <SignInScreen>. Separate file per the project convention. Layout
 * is responsive: content scrolls and the form grows with the available space.
 *
 * The brand furniture at the top lives in <BrandBackdrop> and <BrandHeader> —
 * shared with the other post-landing screens so they stay in step.
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

  // --- Intro ----------------------------------------------------------------
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
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
