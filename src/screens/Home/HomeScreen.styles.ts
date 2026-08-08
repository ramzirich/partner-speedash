import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Circular icon button sitting beside the duty toggle. */
const LOGOUT_BUTTON_SIZE = 40;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },

  // --- Header ---------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    // Clips the wash blobs to the bar.
    overflow: 'hidden',
  },
  // Brand wash carried over from Landing/Sign In so Home doesn't start bare.
  headerBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerBlob: {
    position: 'absolute',
    left: -spacing.xl,
    top: -spacing.xxl,
    width: '52%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryWashSoft,
  },
  headerAccent: {
    position: 'absolute',
    right: -spacing.lg,
    top: -spacing.xl,
    width: '30%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
  },

  headerText: {
    flex: 1,
  },
  greetingLabel: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  greetingName: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
  },

  // Destructive, so it carries the danger wash — but quietly: it's an icon in a
  // soft tint, not a red button competing with the duty toggle next to it.
  logoutButton: {
    width: LOGOUT_BUTTON_SIZE,
    height: LOGOUT_BUTTON_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerWash,
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },

  // Wrapper stays mounted so InlineAlert can play its fade-out; the vertical
  // padding only applies while there is something to show.
  statusAlert: {
    paddingHorizontal: spacing.md,
  },
  statusAlertActive: {
    paddingBottom: spacing.sm,
  },

  // --- Bottom bar -----------------------------------------------------------
  tabBar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
});
