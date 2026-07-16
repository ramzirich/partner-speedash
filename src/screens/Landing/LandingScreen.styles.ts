import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Styles for <LandingScreen>, kept in a dedicated file (your "styling of the
 * tags in a different file" requirement). Layout is responsive: it uses flex
 * ratios rather than fixed pixel sizes, so it adapts to any phone height and
 * to landscape.
 */
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // --- Hero (carousel) section ---------------------------------------------
  heroWrapper: {
    flex: 5,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  // --- Content (actions) section -------------------------------------------
  content: {
    flex: 2,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'center',
  },

  actions: {
    gap: spacing.md,
  },
  forgotButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  forgotText: {
    ...typography.link,
  },
});
