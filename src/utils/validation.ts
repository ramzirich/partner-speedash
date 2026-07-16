/**
 * Tiny, dependency-free validators shared across the auth forms. Centralised so
 * the rules (and their copy) live in one place.
 */

// Pragmatic email shape check — not RFC-perfect, just enough to catch typos
// before we bother the backend.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean =>
  EMAIL_RE.test(value.trim());

/** Returns an error message for an email field, or undefined if it's fine. */
export const validateEmail = (value: string): string | undefined => {
  if (!value.trim()) {
    return 'Email is required.';
  }
  if (!isValidEmail(value)) {
    return 'Enter a valid email address.';
  }
  return undefined;
};


export const validatePassword = (value: string): string | undefined => {
  if (!value) {
    return 'Password is required.';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain at least 1 uppercase letter.';
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must contain at least 1 special character.';
  }
  if (!/(?:\D*\d){2}/.test(value)) {
    return 'Password must contain at least 2 numbers.';
  }
  return undefined;
};
