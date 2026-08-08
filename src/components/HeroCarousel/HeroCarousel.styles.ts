import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const STATUS_BAND = spacing.xl;

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

  // --- Bottom scrim ramp (six bands, light → dark) --------------------------
  // Only painted on `tone: 'dark'` slides — a pale slide gets dark text instead.
  scrim1: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '52%',
    height: '8%',
    backgroundColor: colors.heroScrim1,
  },
  scrim2: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '44%',
    height: '8%',
    backgroundColor: colors.heroScrim2,
  },
  scrim3: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '35%',
    height: '9%',
    backgroundColor: colors.heroScrim3,
  },
  scrim4: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '25%',
    height: '10%',
    backgroundColor: colors.heroScrim4,
  },
  scrim5: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '13%',
    height: '12%',
    backgroundColor: colors.heroScrim5,
  },
  scrim6: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '13%',
    backgroundColor: colors.heroScrim6,
  },

  // --- Top scrim ramp -------------------------------------------------------
  // The hero runs under a translucent status bar; without this, light icons sit
  // on whatever the photo happens to be and vanish.
  statusScrim1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: STATUS_BAND,
    backgroundColor: colors.statusScrim1,
  },
  statusScrim2: {
    position: 'absolute',
    top: STATUS_BAND,
    left: 0,
    right: 0,
    height: spacing.lg,
    backgroundColor: colors.statusScrim2,
  },
  statusScrim3: {
    position: 'absolute',
    top: STATUS_BAND + spacing.lg,
    left: 0,
    right: 0,
    height: spacing.md,
    backgroundColor: colors.statusScrim3,
  },

  // --- Caption (bottom-aligned, above the dots) -----------------------------
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    ...typography.heroTitle,
    color: colors.textOnPrimary,
    textShadowColor: colors.textShadowOnImage,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...typography.heroSubtitle,
    color: colors.textOnImage,
    maxWidth: '94%',
    textShadowColor: colors.textShadowOnImage,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Light-tone overrides: no photo underneath, so no shadow and dark ink.
  titleLight: {
    color: colors.textPrimary,
    textShadowColor: colors.transparent,
    textShadowRadius: 0,
  },
  subtitleLight: {
    color: colors.textSecondary,
    textShadowColor: colors.transparent,
    textShadowRadius: 0,
  },

  // --- Pagination dots ------------------------------------------------------
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
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
    backgroundColor: colors.dotIdleOnDark,
  },
  dotOnLight: {
    backgroundColor: colors.dotIdleOnLight,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
});
