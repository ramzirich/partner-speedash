import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderLeftWidth: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  containerDanger: {
    backgroundColor: colors.dangerWash,
    borderLeftColor: colors.danger,
  },
  containerWarning: {
    backgroundColor: colors.warningWash,
    borderLeftColor: colors.warning,
  },
  containerSuccess: {
    backgroundColor: colors.successWash,
    borderLeftColor: colors.success,
  },
  message: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  messageDanger: {
    color: colors.danger,
  },
  messageWarning: {
    color: colors.warning,
  },
  messageSuccess: {
    color: colors.success,
  },
});
