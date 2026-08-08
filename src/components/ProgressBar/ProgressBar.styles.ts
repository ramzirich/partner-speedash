import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** Styles for <ProgressBar>. Separate file per convention. */
export const styles = StyleSheet.create({
  track: {
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    borderRadius: radius.pill,
  },
});
