import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

/** Styles for <OrderOfferBanner>. Separate file per convention. */
export const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingRight: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  wrapperDanger: {
    backgroundColor: colors.danger,
  },
  pressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onPrimaryWash,
  },
  body: {
    flex: 1,
  },
  title: {
    ...typography.button,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
  message: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textOnPrimary,
    opacity: 0.92,
  },
  hint: {
    ...typography.button,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.textOnPrimary,
    opacity: 0.75,
    marginTop: 2,
  },
  countdown: {
    minWidth: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.scrimSoft,
  },
  countdownText: {
    ...typography.button,
    fontSize: 12,
    color: colors.textOnPrimary,
  },
  close: {
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});
