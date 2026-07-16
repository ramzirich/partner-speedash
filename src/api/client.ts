import { ENV } from '../config/env';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  notifySessionRefreshed,
  notifyAuthCleared,
} from './authToken';
import { ApiError, NetworkError, TimeoutError } from './errors';
import type { RefreshResponse } from './auth.api';

/**
 * Thin fetch wrapper shared by every `*.api.ts` module.
 *
 * Responsibilities:
 *  - prefix the configured base URL
 *  - enforce a hard timeout via AbortController (no hung requests / leaks)
 *  - attach `Authorization: Bearer <accessToken>` (unless `skipAuth`)
 *  - on a 401, refresh the token once (single-flight) and retry the request
 *  - normalise every failure into a typed `ApiError`
 *
 * Business logic still lives in the feature API modules; only the token
 * lifecycle (a cross-cutting concern for every request) lives here. See the
 * "Auth & token lifecycle" contract in CLAUDE.md §9.
 */

interface RequestOptions extends Omit<RequestInit, 'signal'> {
  /** Overrides ENV.apiTimeoutMs for this single call. */
  timeoutMs?: number;
  /**
   * Skip Bearer attachment AND the refresh-on-401 retry. Set by the
   * unauthenticated / auth-bootstrapping calls themselves — login (a 401 there
   * means bad credentials, not an expired token) and the refresh call (which
   * would otherwise recurse into itself).
   */
  skipAuth?: boolean;
}

const buildUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const base = ENV.apiBaseUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

const mapStatusToError = async (response: Response): Promise<ApiError> => {
  let userMessage = 'Something went wrong. Please try again.';
  if (response.status === 401 || response.status === 403) {
    return new ApiError('UNAUTHORIZED', 'Unauthorized', {
      status: response.status,
      userMessage: 'Your email or password is incorrect.',
    });
  }
  if (response.status === 404) {
    return new ApiError('NOT_FOUND', 'Not found', {
      status: response.status,
      userMessage: 'We could not find what you were looking for.',
    });
  }
  if (response.status >= 500) {
    userMessage = 'Our servers are having trouble. Please try again shortly.';
    return new ApiError('SERVER', `Server error ${response.status}`, {
      status: response.status,
      userMessage,
    });
  }
  return new ApiError('UNKNOWN', `HTTP ${response.status}`, {
    status: response.status,
    userMessage,
  });
};

/**
 * At most one refresh runs at a time. When several requests 401 together they
 * all await the same in-flight promise instead of stampeding /api/refresh.
 */
let refreshInFlight: Promise<void> | null = null;

const runRefresh = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('UNAUTHORIZED', 'No refresh token', {
      status: 401,
      userMessage: 'Your session has expired. Please sign in again.',
    });
  }
  // `skipAuth` here is what stops the refresh call recursing: its own 401 (a
  // dead/rotated refresh token) is thrown, not retried.
  const tokens = await apiRequest<RefreshResponse>('/api/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
  });
  // Update the holders first so the retried request sees the new access token,
  // then let the app persist the rotated pair into Redux.
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
  notifySessionRefreshed(tokens);
};

const refreshAccessToken = (): Promise<void> => {
  if (!refreshInFlight) {
    refreshInFlight = runRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const {
    timeoutMs = ENV.apiTimeoutMs,
    headers,
    skipAuth = false,
    ...rest
  } = options;

  let didRefresh = false;

  // Loop so one 401 can trigger a single refresh + retry. `didRefresh` caps it
  // at exactly one extra attempt; every other path returns/throws.
  for (;;) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const accessToken = skipAuth ? null : getAccessToken();
    const authHeader = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;

    try {
      const response = await fetch(buildUrl(path), {
        ...rest,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...authHeader,
          ...headers,
        },
      });

      // Access token expired → refresh once, then retry the original request.
      if (
        response.status === 401 &&
        !skipAuth &&
        !didRefresh &&
        getRefreshToken()
      ) {
        clearTimeout(timeoutId);
        try {
          await refreshAccessToken();
        } catch {
          // Refresh failed (refresh token expired/revoked) → end the session.
          notifyAuthCleared();
          throw new ApiError('UNAUTHORIZED', 'Session expired', {
            status: 401,
            userMessage: 'Your session has expired. Please sign in again.',
          });
        }
        didRefresh = true;
        continue;
      }

      if (!response.ok) {
        throw await mapStatusToError(response);
      }

      // 204 No Content guard.
      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // AbortController fires a DOMException named 'AbortError' on timeout.
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(timeoutMs);
      }
      throw new NetworkError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
