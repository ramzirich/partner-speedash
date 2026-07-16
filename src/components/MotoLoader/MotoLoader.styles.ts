import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
    // Soft elevation.
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  track: {
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    height: 2,
    backgroundColor: colors.border,
  },
  mover: {
    alignSelf: 'flex-start',
  },
  spriteClip: {
    overflow: 'hidden',
  },
  spriteInner: {
    position: 'absolute',
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
