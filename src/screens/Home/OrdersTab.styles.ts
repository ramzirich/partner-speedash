import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/** Styles for <OrdersTab>. Separate file per convention. */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  flatList: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  placeholderText: {
    ...typography.body,
    textAlign: 'center',
  },
});
