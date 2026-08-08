import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Circular icon badge — composed from the 4-pt scale, not a magic number. */
const BADGE_SIZE = spacing.xl + spacing.sm;

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
  },
});
