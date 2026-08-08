import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/** Styles for <OtpScreen>. Separate file per the project convention. */
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  intro: {
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    maxWidth: '94%',
  },
  emailHighlight: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  form: {
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  // "Didn't get a code? Resend" row.
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  resendHint: {
    ...typography.body,
    fontSize: 14,
  },
  resendLink: {
    ...typography.link,
    fontSize: 14,
  },
  resendDisabled: {
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
