import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  ASSET_BASE_URL,
  SOCKET_URL,
  USE_MOCK_API,
} from '@env';

/**
 * Centralised, typed access to environment variables.
 *
 * Everything funnels through here so the rest of the app never reads `@env`
 * directly. That gives us: a single place for fallbacks/validation, easy
 * mocking in tests, and no crashes if a variable is missing from `.env`.
 */

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

const apiBaseUrl = API_BASE_URL ?? 'http://10.0.2.2:3000';

export const ENV = Object.freeze({
  apiBaseUrl,
  apiTimeoutMs: toNumber(API_TIMEOUT_MS, 15000),
  useMockApi: toBoolean(USE_MOCK_API, true),
  assetBaseUrl: ASSET_BASE_URL ?? 'https://images.unsplash.com',
  socketUrl: SOCKET_URL ?? apiBaseUrl,
});

export type AppEnv = typeof ENV;
