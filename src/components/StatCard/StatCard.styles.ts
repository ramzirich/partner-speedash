import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Styles for <StatCard>. Separate file per convention. */
export const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTinted: {
    borderColor: colors.transparent,
    shadowOpacity: 0,
    elevation: 0,
  },
  // Number on top — the hero.
  value: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },
  // Icon + word together, beneath the number.
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.button,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
});
