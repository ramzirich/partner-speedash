import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // --- Hero (illustration) --------------------------------------------------
  hero: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  // --- Hero backdrop --------------------------------------------------------
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backdropBlob: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '6%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryWash,
  },
  backdropBlobSoft: {
    position: 'absolute',
    left: '-14%',
    top: '34%',
    width: '46%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryWashSoft,
  },
  backdropAccent: {
    position: 'absolute',
    right: '-8%',
    top: '12%',
    width: '32%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
  },

  headlineBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
  },
  subhead: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: '90%',
  },

  // --- Content (proof points + actions) ------------------------------------
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },

  actions: {
    gap: spacing.md,
  },

  // --- Secondary action -----------------------------------------------------
  altActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  altActionPrompt: {
    ...typography.body,
    fontSize: 15,
  },
  altActionHit: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  altActionLink: {
    ...typography.link,
  },
});
