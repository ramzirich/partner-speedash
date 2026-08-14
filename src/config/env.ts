import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  ASSET_BASE_URL,
  SOCKET_URL,
} from '@env';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const apiBaseUrl = API_BASE_URL ?? 'http://10.0.2.2:3000';

export const ENV = Object.freeze({
  apiBaseUrl,
  apiTimeoutMs: toNumber(API_TIMEOUT_MS, 15000),
  assetBaseUrl: ASSET_BASE_URL ?? 'https://images.unsplash.com',
  socketUrl: SOCKET_URL ?? apiBaseUrl,
});

export type AppEnv = typeof ENV;
