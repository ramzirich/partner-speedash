import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 64,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  cellActive: {
    borderColor: colors.primary,
  },
  cellError: {
    borderColor: colors.danger,
  },
  cellText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});
