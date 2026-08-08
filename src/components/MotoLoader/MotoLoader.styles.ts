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
  cardShadow: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  track: {
    alignSelf: 'stretch',
    // Cancels the card padding so the rider enters and leaves at the card edge.
    marginHorizontal: -spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  riderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
