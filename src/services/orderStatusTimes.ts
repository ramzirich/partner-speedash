import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OrderDocument, OrderDocumentStatus } from '../api';

const STORAGE_KEY = 'speedash.orderStatusTimes.v1';

export type OrderStatusTimes = Partial<Record<OrderDocumentStatus, number>>;

interface Entry {
  times: OrderStatusTimes;
  touchedAt: number;
}

const ENTRY_LIMIT = 60;
const ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const TERMINAL: ReadonlySet<string> = new Set([
  'DELIVERED',
  'CANCELED',
  'CANCELLED',
]);

const SECONDS_CEILING = 1e11;

const EMPTY: OrderStatusTimes = Object.freeze({});

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();

const volatileIds = new Set<string>();

const toEpochMs = (
  value: number | string | null | undefined,
): number | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      return undefined;
    }
    return value < SECONDS_CEILING ? value * 1000 : value;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const notify = (orderId: string): void => {
  listeners.get(orderId)?.forEach(listener => listener());
};

const prune = (now: number): void => {
  for (const [orderId, entry] of entries) {
    if (now - entry.touchedAt > ENTRY_TTL_MS) {
      entries.delete(orderId);
      volatileIds.delete(orderId);
    }
  }
  if (entries.size <= ENTRY_LIMIT) {
    return;
  }
  const oldestFirst = [...entries].sort(
    ([, a], [, b]) => a.touchedAt - b.touchedAt,
  );
  for (const [orderId] of oldestFirst.slice(0, entries.size - ENTRY_LIMIT)) {
    entries.delete(orderId);
    volatileIds.delete(orderId);
  }
};

const isTimes = (value: unknown): value is OrderStatusTimes =>
  typeof value === 'object' &&
  value !== null &&
  Object.values(value).every(at => typeof at === 'number' && at > 0);

const adopt = (raw: string | null): void => {
  if (!raw) {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return;
  }
  const now = Date.now();
  for (const [orderId, stored] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    const entry = stored as Partial<Entry> | null;
    if (!entry || !isTimes(entry.times)) {
      continue;
    }
    const touchedAt = toEpochMs(entry.touchedAt) ?? now;
    if (now - touchedAt > ENTRY_TTL_MS) {
      continue;
    }

    const live = entries.get(orderId);
    const times = { ...entry.times, ...(live?.times ?? {}) };
    entries.set(orderId, { times, touchedAt: live?.touchedAt ?? touchedAt });
    notify(orderId);
  }
};

let hydration: Promise<void> | null = null;

export const hydrateOrderStatusTimes = (): Promise<void> => {
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(adopt)
      .catch(() => {
        // A missing or unreadable store just means no history — never fatal.
      });
  }
  return hydration;
};

let writing: Promise<void> = Promise.resolve();

const write = async (): Promise<void> => {
  prune(Date.now());
  const payload: Record<string, Entry> = {};
  for (const [orderId, entry] of entries) {
    if (!volatileIds.has(orderId)) {
      payload[orderId] = entry;
    }
  }
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const flush = (): void => {
  writing = writing
    .then(hydrateOrderStatusTimes)
    .then(write)
    .catch(() => {
      // Losing a write costs one timestamp, not the app.
    });
};

export const recordOrderStatusTime = (
  doc: OrderDocument,
  now: number = Date.now(),
): void => {
  const status = doc.status as OrderDocumentStatus;
  if (!doc._id || !status) {
    return;
  }

  const current = entries.get(doc._id);
  const times: OrderStatusTimes = { ...(current?.times ?? {}) };
  let changed = false;

  const put = (step: OrderDocumentStatus, at: number | undefined): void => {
    if (at == null || times[step] != null) {
      return;
    }
    times[step] = at;
    changed = true;
  };

  put('PENDING', toEpochMs(doc.createdAt));
  put('ASSIGNED', toEpochMs(doc.assignedAt));
  put('DELIVERED', toEpochMs(doc.deliveredAt));
  put(status, toEpochMs(doc.updatedAt) ?? now);

  if (!changed) {
    if (current) {
      current.touchedAt = now;
    }
    return;
  }

  entries.set(doc._id, { times, touchedAt: now });
  notify(doc._id);

  if (TERMINAL.has(status)) {
    volatileIds.add(doc._id);
  }
  flush();
};

export const getOrderStatusTimes = (
  orderId: string | null | undefined,
): OrderStatusTimes =>
  (orderId ? entries.get(orderId)?.times : undefined) ?? EMPTY;

export const subscribeOrderStatusTimes = (
  orderId: string,
  listener: () => void,
): (() => void) => {
  const existing = listeners.get(orderId) ?? new Set<() => void>();
  existing.add(listener);
  listeners.set(orderId, existing);
  return () => {
    existing.delete(listener);
    if (existing.size === 0) {
      listeners.delete(orderId);
    }
  };
};

export const forgetOrderStatusTimes = (orderId: string): void => {
  if (!entries.delete(orderId)) {
    return;
  }
  volatileIds.delete(orderId);
  notify(orderId);
  flush();
};

export const clearOrderStatusTimes = (): void => {
  const known = [...entries.keys()];
  entries.clear();
  volatileIds.clear();
  known.forEach(notify);
  flush();
};
