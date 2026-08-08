import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Track/thumb geometry — the thumb travel in the animation hook matches this. */
const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const TRACK_PADDING = 3;
const THUMB_SIZE = TRACK_HEIGHT - TRACK_PADDING * 2;

/**
 * Fixed label box, sized for the widest word ("Offline") at 12/700 with room to
 * spare. Without it the pill would resize as the status changes and shove the
 * greeting beside it — the switch must stay put while it animates.
 */
const LABEL_WIDTH = 56;

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm + spacing.xs,
    paddingRight: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
    // Neutral in every state — the track and label carry the status colour.
    borderColor: colors.border,
  },
  pending: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },

  label: {
    ...typography.button,
    fontSize: 12,
    lineHeight: 15,
    width: LABEL_WIDTH,
    textAlign: 'center',
    color: colors.danger,
  },
  labelOnline: {
    color: colors.success,
  },
  labelBusy: {
    color: colors.warning,
  },

  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    padding: TRACK_PADDING,
    backgroundColor: colors.danger,
  },
  trackOnline: {
    backgroundColor: colors.success,
  },
  trackBusy: {
    backgroundColor: colors.warning,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
});
