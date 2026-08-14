import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  getOrderStatusTimes,
  hydrateOrderStatusTimes,
  subscribeOrderStatusTimes,
} from '../services/orderStatusTimes';
import type { OrderStatusTimes } from '../services/orderStatusTimes';

const noop = (): void => {};

export const useOrderStatusTimes = (
  orderId: string | null | undefined,
): OrderStatusTimes => {
  useEffect(() => {
    hydrateOrderStatusTimes();
  }, []);

  const subscribe = useCallback(
    (onChange: () => void) =>
      orderId ? subscribeOrderStatusTimes(orderId, onChange) : noop,
    [orderId],
  );

  const snapshot = useCallback(() => getOrderStatusTimes(orderId), [orderId]);

  return useSyncExternalStore(subscribe, snapshot);
};
