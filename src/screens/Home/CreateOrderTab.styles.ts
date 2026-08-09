import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Styles for <CreateOrderTab>. Deliberately the same shape as
 * <SignInScreen.styles> — the brand wash behind a scrolling column of
 * intro → form → actions — so the app reads as one surface either side of the
 * sign-in boundary.
 */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  /** What the fetched history says out loud until the Orders tab is opened. */
  meta: {
    ...typography.caption,
  },
  metaError: {
    color: colors.danger,
  },

  // --- Form -----------------------------------------------------------------
  form: {
    gap: spacing.md,
  },

  // --- Footer ---------------------------------------------------------------
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
