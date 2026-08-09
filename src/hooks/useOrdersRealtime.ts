import { useEffect, useRef } from 'react';
import {
  forgetOrderRoom,
  fromOrderDocument,
  joinOrderRoom,
  onOrderUpdate,
} from '../api';
import type { OrderDocument } from '../api';
import type { Order } from '../components/OrderCard';

export type OrdersRealtimeHandler = (
  order: Order,
  document: OrderDocument,
) => void;

/**
 * Keep a list of orders live.
 *
 * Order updates are room-scoped, so every order on screen has to be joined
 * individually — there is no "all my orders" channel. Rooms are refcounted in
 * the socket layer, so joining one already tracked elsewhere is safe.
 */
export const useOrdersRealtime = (
  orderIds: readonly string[],
  onOrderChanged: OrdersRealtimeHandler,
): void => {
  const handlerRef = useRef(onOrderChanged);
  handlerRef.current = onOrderChanged;

  // The array identity changes on every refetch; its contents are what matter.
  const key = orderIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) {
      return;
    }
    ids.forEach(joinOrderRoom);
    const off = onOrderUpdate(doc => {
      handlerRef.current(fromOrderDocument(doc), doc);
    });
    return () => {
      off();
      ids.forEach(forgetOrderRoom);
    };
  }, [key]);
};
