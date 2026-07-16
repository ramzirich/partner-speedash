/**
 * Non-React bridge between Redux and the API layer.
 *
 * `apiRequest` (a plain module function) can't read Redux via hooks, so the
 * current tokens are mirrored here in module variables. Redux (`authSlice`)
 * stays the source of truth — `src/store/index.ts` subscribes to the store and
 * pushes every change into these setters, and registers the two handlers below
 * so the refresh-on-401 flow can write rotated tokens back into Redux without
 * the API layer importing the store (which would create an import cycle).
 *
 * Never log any of these values (see CLAUDE.md §8).
 */

/** Shape returned by POST /api/refresh — the rotated session (minus `user`). */
export interface RefreshedSession {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getRefreshToken = (): string | null => refreshToken;
export const setRefreshToken = (token: string | null): void => {
  refreshToken = token;
};

// --- App-registered handlers (wired once in src/store/index.ts) -------------

let sessionRefreshedHandler: ((session: RefreshedSession) => void) | null = null;
let authClearedHandler: (() => void) | null = null;

/** Register how a successful refresh is persisted (dispatch `sessionRefreshed`). */
export const setSessionRefreshedHandler = (
  handler: (session: RefreshedSession) => void,
): void => {
  sessionRefreshedHandler = handler;
};

/** Register how a failed refresh ends the session (dispatch `logout`). */
export const setAuthClearedHandler = (handler: () => void): void => {
  authClearedHandler = handler;
};

export const notifySessionRefreshed = (session: RefreshedSession): void => {
  sessionRefreshedHandler?.(session);
};

export const notifyAuthCleared = (): void => {
  authClearedHandler?.();
};
