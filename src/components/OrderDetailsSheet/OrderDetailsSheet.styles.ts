import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 4;
const CLOSE_SIZE = 32;

export const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '85%',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    flexShrink: 1,
  },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  closePressed: {
    opacity: 0.6,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  waiting: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  waitingText: {
    ...typography.body,
    textAlign: 'center',
  },
  waitingError: {
    color: colors.danger,
  },
});
