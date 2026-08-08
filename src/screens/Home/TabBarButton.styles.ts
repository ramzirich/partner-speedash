import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Icon slot — sized to breathe around a 22pt glyph. */
const SLOT_WIDTH = 60;
const SLOT_HEIGHT = 30;
const BADGE_SIZE = 18;

/** Styles for <TabBarButton>. Separate file per convention. */
export const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },

  // Sizes the icon's touch area only — the active state is carried by colour
  // alone, no backing shape.
  iconSlot: {
    width: SLOT_WIDTH,
    height: SLOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hugs the glyph so the badge can hang off its real corner.
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
  },

  badge: {
    position: 'absolute',
    top: -spacing.xs - 1,
    right: -spacing.sm - 1,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
});
