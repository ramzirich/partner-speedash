/**
 * Helpers for the split phone input: a country dial code on one side, the
 * national number on the other. The gateway wants them joined in E.164.
 */
import type { Country } from '../data';

/** Shortest and longest national number we accept, digits only. */
const MIN_NATIONAL_DIGITS = 6;
const MAX_NATIONAL_DIGITS = 14;

/** Everything that isn't a digit — spaces, dashes, brackets, dots. */
export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * Strips the trunk prefix people type out of habit: "070 123 456" and
 * "70 123 456" are the same subscriber once a country code is in front.
 */
export const toNationalDigits = (value: string): string =>
  digitsOnly(value).replace(/^0+/, '');

/** `("+961", "70 123 456")` → `"+96170123456"`. */
export const toE164 = (dialCode: string, nationalNumber: string): string =>
  `+${digitsOnly(dialCode)}${toNationalDigits(nationalNumber)}`;

/**
 * Validates the national part only — the country code comes from the picker,
 * so it can't be wrong.
 */
export const validateNationalNumber = (
  value: string,
  { required = true }: { required?: boolean } = {},
): string | undefined => {
  const digits = toNationalDigits(value);
  if (!digits) {
    return required ? 'Customer phone is required.' : undefined;
  }
  if (
    digits.length < MIN_NATIONAL_DIGITS ||
    digits.length > MAX_NATIONAL_DIGITS
  ) {
    return 'Enter a valid phone number, e.g. 70 123 456.';
  }
  return undefined;
};

export const isCompleteNationalNumber = (
  value: string,
  country: Country,
): boolean => country.nsnLengths.includes(toNationalDigits(value).length);
