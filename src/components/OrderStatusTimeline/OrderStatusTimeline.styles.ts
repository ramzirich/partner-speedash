import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const MARKER_SIZE = 22;
export const RAIL_HEIGHT = 22;
const RAIL_WIDTH = 2;

export const styles = StyleSheet.create({
  container: {
    gap: 0,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  markerColumn: {
    alignItems: 'center',
    width: MARKER_SIZE,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  markerDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  markerCurrent: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  markerUpcoming: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  markerCanceled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  markerPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  rail: {
    width: RAIL_WIDTH,
    height: RAIL_HEIGHT,
    backgroundColor: colors.border,
  },
  railDone: {
    backgroundColor: colors.success,
  },

  labelBlock: {
    flex: 1,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  label: {
    ...typography.button,
    fontSize: 14,
    color: colors.textPrimary,
  },
  labelUpcoming: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelCanceled: {
    color: colors.textSecondary,
  },
  timestamp: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  bannerDelivered: {
    backgroundColor: colors.successWash,
    borderColor: colors.success,
  },
  bannerCanceled: {
    backgroundColor: colors.dangerWash,
    borderColor: colors.danger,
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    ...typography.button,
    fontSize: 15,
  },
  bannerTitleDelivered: {
    color: colors.success,
  },
  bannerTitleCanceled: {
    color: colors.danger,
  },
  bannerMessage: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
