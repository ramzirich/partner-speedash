import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import {
  acquireSocket,
  forgetOrderRoom,
  fromOrderDocument,
  isSocketConnected,
  joinOrderRoom,
  mergeOrderDocument,
  onOrderUpdate,
  onSocketStatus,
  ordersApi,
  releaseSocket,
  resyncSocket,
  toApiError,
} from '../api';
import type { OrderDocument, OrderDocumentStatus } from '../api';
import type { Order, OrderProgress } from '../components/OrderCard';
import { recordOrderStatusTime } from '../services/orderStatusTimes';
import type { OrderStatusTimes } from '../services/orderStatusTimes';
import { useIsMounted } from './useIsMounted';
import { useOrderStatusTimes } from './useOrderStatusTimes';

export const ORDER_STEPS: readonly OrderProgress[] = [
  'PENDING',
  'ASSIGNED',
  'HEADING_TO_PARTNER',
  'AT_PICKUP',
  'HEADING_TO_CUSTOMER',
  'DELIVERED',
] as const;

const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  'DELIVERED',
  'CANCELED',
]);

export const isTerminalStatus = (status: string | null | undefined): boolean =>
  status != null && TERMINAL_STATUSES.has(status);

const supersedes = (
  next: OrderDocument,
  current: OrderDocument | null,
): boolean => {
  if (!current) {
    return true;
  }
  const nextAt = Date.parse(next.updatedAt ?? '');
  const currentAt = Date.parse(current.updatedAt ?? '');
  if (!Number.isFinite(nextAt) || !Number.isFinite(currentAt)) {
    return true;
  }
  return nextAt > currentAt;
};

export interface OrderTracking {
  order: OrderDocument | null;
  status: OrderDocumentStatus | null;
  isConnected: boolean;
  error: string | null;
  card: Order | null;
  isTerminal: boolean;
  times: OrderStatusTimes;
  refresh: () => void;
}

export interface UseOrderTrackingOptions {
  seed?: OrderDocument | null;
  onStatusChange?: (status: OrderDocumentStatus, order: OrderDocument) => void;
}

export const useOrderTracking = (
  orderId: string | null | undefined,
  { seed = null, onStatusChange }: UseOrderTrackingOptions = {},
): OrderTracking => {
  const isMounted = useIsMounted();
  const [order, setOrder] = useState<OrderDocument | null>(null);
  const [isConnected, setIsConnected] = useState(isSocketConnected);
  const [error, setError] = useState<string | null>(null);

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const lastStatusRef = useRef<string | null>(null);

  const orderRef = useRef<OrderDocument | null>(null);

  const apply = useCallback((next: OrderDocument): void => {
    recordOrderStatusTime(next);
    setOrder(current =>
      supersedes(next, current) ? mergeOrderDocument(next, current) : current,
    );
  }, []);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    setOrder(null);
    setError(null);
    lastStatusRef.current = null;
  }, [orderId]);

  useEffect(() => {
    if (seed) {
      apply(seed);
    }
  }, [seed, apply]);

  const refresh = useCallback((): void => {
    if (!orderId) {
      return;
    }
    ordersApi
      .getById(orderId)
      .then(doc => {
        if (!isMounted()) {
          return;
        }
        if (doc) {
          setError(null);
          apply(doc);
          return;
        }
        if (!orderRef.current) {
          setError('We could not find this order.');
        }
      })
      .catch(err => {
        if (isMounted()) {
          setError(toApiError(err).userMessage);
        }
      });
  }, [orderId, apply, isMounted]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    acquireSocket();

    const offStatus = onSocketStatus(connected => {
      setIsConnected(connected);
    });

    const offUpdate = onOrderUpdate(doc => {
      if (doc._id !== orderId) {
        return;
      }
      apply(doc);
    });

    joinOrderRoom(orderId);

    refresh();

    return () => {
      offUpdate();
      offStatus();
      forgetOrderRoom(orderId);
      releaseSocket();
    };
  }, [orderId, apply, refresh]);

  useEffect(() => {
    if (!orderId) {
      return;
    }
    const handleAppState = (state: AppStateStatus): void => {
      if (state !== 'active') {
        return;
      }
      resyncSocket();
      setIsConnected(isSocketConnected());
      refresh();
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [orderId, refresh]);

  const status = (order?.status ?? null) as OrderDocumentStatus | null;

  useEffect(() => {
    if (!order || !status || status === lastStatusRef.current) {
      return;
    }
    const isFirst = lastStatusRef.current === null;
    lastStatusRef.current = status;
    if (!isFirst) {
      onStatusChangeRef.current?.(status, order);
    }
  }, [status, order]);

  const card = useMemo(
    () => (order ? fromOrderDocument(order) : null),
    [order],
  );

  const times = useOrderStatusTimes(orderId);

  return {
    order,
    status,
    isConnected,
    error,
    card,
    isTerminal: isTerminalStatus(status),
    times,
    refresh,
  };
};
