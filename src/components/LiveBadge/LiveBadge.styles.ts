import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const DOT_SIZE = 8;

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  dotWrap: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
  },
  halo: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.pill,
  },
  dotLive: {
    backgroundColor: colors.success,
  },
  dotIdle: {
    backgroundColor: colors.warning,
  },

  label: {
    ...typography.caption,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  labelLive: {
    color: colors.success,
  },
  labelIdle: {
    color: colors.warning,
  },
});
