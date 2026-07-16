import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Reusable text styles. Components spread these (e.g. `...typography.h1`)
 * instead of redefining font sizes/weights ad hoc.
 */
export const typography = Object.freeze({
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.textPrimary,
  } as TextStyle,
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  } as TextStyle,
  link: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.primary,
  } as TextStyle,
});

export type AppTypography = typeof typography;
