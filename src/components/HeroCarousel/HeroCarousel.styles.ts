import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  slide: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // --- Fake bottom gradient (three bands, light → dark) --------------------
  scrimTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '40%',
    height: '14%',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  scrimMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '24%',
    height: '16%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '24%',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },

  // --- Caption (text inside the image, bottom-aligned) ---------------------
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.textOnPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: '94%',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // --- Pagination dots ------------------------------------------------------
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dotHit: {
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
});
