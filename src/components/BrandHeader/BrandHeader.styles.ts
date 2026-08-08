import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

const RIDER_WIDTH = 64;
const RIDER_HEIGHT = 56;

/** Styles for <BrandHeader>. Separate file per the project convention. */
export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // Keeps the lockup on the right whether or not there's a back button.
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
    marginRight: 'auto',
  },

  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rider: {
    width: RIDER_WIDTH,
    height: RIDER_HEIGHT,
  },
  wordmark: {
    ...typography.h2,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  wordmarkAccent: {
    color: colors.primary,
  },
});
