import * as Keychain from 'react-native-keychain';
import type { AuthUser } from './auth.api';

/**
 * Encrypted, on-device home for the signed-in session.
 *
 * The tokens have to outlive the process, not just the React tree: Android
 * reclaims a backgrounded app whenever it needs the memory, and a force-close
 * is the same thing on purpose. Anything kept only in Redux is gone by the next
 * cold start, which is exactly the "why am I signed out again?" the partner
 * sees after leaving the app.
 *
 * Keychain rather than AsyncStorage because a refresh token is a long-lived
 * credential: this hands it to the Android Keystore / iOS Keychain instead of
 * leaving it in plaintext for an app backup or a rooted device to read.
 *
 * Never log anything that passes through here.
 */

/** Namespaces the entry so it can't collide with another credential. */
const SERVICE = 'com.partnerspeedash.session';

const ACCOUNT = 'session';

export interface StoredSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const isStoredSession = (value: unknown): value is StoredSession => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const session = value as Partial<StoredSession>;
  return (
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    typeof session.refreshTokenExpiresAt === 'string' &&
    typeof session.user === 'object' &&
    session.user !== null
  );
};

export const isSessionLive = (session: StoredSession): boolean => {
  const expiresAt = Date.parse(session.refreshTokenExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
};

export const saveSession = async (session: StoredSession): Promise<void> => {
  try {
    await Keychain.setGenericPassword(ACCOUNT, JSON.stringify(session), {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
  } catch {
    // Storage is a convenience, not a precondition: the session still works
    // for this run, it just won't survive the next cold start.
  }
};


export const loadSession = async (): Promise<StoredSession | null> => {
  try {
    const stored = await Keychain.getGenericPassword({ service: SERVICE });
    if (!stored) {
      return null;
    }
    const parsed: unknown = JSON.parse(stored.password);
    if (!isStoredSession(parsed)) {
      await clearSession();
      return null;
    }
    if (!isSessionLive(parsed)) {
      await clearSession();
      return null;
    }
    return parsed;
  } catch {
    // Unreadable or corrupt — treat it as signed out rather than crashing the
    // launch, and don't leave the bad entry behind.
    await clearSession();
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // Nothing to do: there is no fallback store to fall back to.
  }
};
