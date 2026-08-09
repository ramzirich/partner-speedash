import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  forgetOrderRoom,
  fromOrderDocument,
  joinOrderRoom,
  onDriverNotification,
  onOrderUpdate,
} from '../api';
import type { DriverNotification, OrderDocument } from '../api';
import type { Order, OrderStatus } from '../components/OrderCard';

/**
 * Live order offers pushed to this driver over Socket.IO.
 *
 * The backend addresses drivers by a per-driver EVENT NAME
 * (`notification:driver:<driverId>`), so this hook only ever sees offers meant
 * for the signed-in driver — no filtering on our side, and no room to join.
 *
 * What arrives is just `{ orderId, message, type, timeout }` — no pickup /
 * drop-off / fee. So each offer starts as a card built from the notification
 * itself and is hydrated the moment the order's room pushes a full document
 * (`joinOrderRoom` → `orderUpdate`).
 *
 * `NEW_ORDER_OFFER` carries a `timeout` (seconds): the backend re-dispatches the
 * order to another driver once it lapses, so the card is pruned at the same
 * moment rather than left on screen as a dead action.
 */

/** The banner-worthy notification, with the deadline resolved to wall-clock. */
export interface DriverAlert {
  notification: DriverNotification;
  /** Epoch ms when the offer lapses, or null when it doesn't expire. */
  expiresAt: number | null;
}

interface OfferEntry {
  order: Order;
  expiresAt: number | null;
}

export interface DriverOffers {
  /** Offer/assignment cards, newest first. */
  offers: Order[];
  /** Ids in `offers` — lets the screen route accept/decline to the offer flow. */
  offerIds: ReadonlySet<string>;
  /** Latest notification awaiting acknowledgement (drives the banner). */
  alert: DriverAlert | null;
  dismissAlert: () => void;
  /**
   * Bumped once per notification received, including dismissed/canceled ones.
   * A screen showing the order list watches this to refetch — the socket says
   * *something* changed, but only `GET /api/orders` has the full picture.
   */
  notificationSeq: number;
}

/** Statuses that mean the order is off this driver's plate. */
const CLOSED_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'done',
  'rejected',
]);

const offerCard = (
  notification: DriverNotification,
  status: OrderStatus,
): Order => ({
  id: notification.orderId,
  // Unknown until the order room pushes a document — see the note above.
  pickup: '—',
  dropoff: '—',
  status,
  currency: 'USD',
  note: notification.message,
});

export const useDriverOffers = (
  driverId: string | undefined,
): DriverOffers => {
  const [entries, setEntries] = useState<OfferEntry[]>([]);
  const [alert, setAlert] = useState<DriverAlert | null>(null);
  const [notificationSeq, setNotificationSeq] = useState(0);
  /** One prune timer per expiring offer; all cleared on unmount (§5). */
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((orderId: string): void => {
    const timer = timers.current.get(orderId);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(orderId);
    }
  }, []);

  const drop = useCallback(
    (orderId: string): void => {
      clearTimer(orderId);
      forgetOrderRoom(orderId);
      setEntries(prev => prev.filter(entry => entry.order.id !== orderId));
      setAlert(prev =>
        prev?.notification.orderId === orderId ? null : prev,
      );
    },
    [clearTimer],
  );

  /**
   * Signing out retires whatever is on screen. The prune timers die with the
   * subscription below, so cards left up here would be stranded there
   * permanently — and an offer the driver can no longer be given is not
   * something to keep showing.
   */
  useEffect(() => {
    if (driverId) {
      return;
    }
    setEntries(prev => (prev.length > 0 ? [] : prev));
    setAlert(null);
  }, [driverId]);

  useEffect(() => {
    if (!driverId) {
      return;
    }
    // The Map instance is created once by useRef, so capturing it here is safe
    // and gives the cleanup a stable reference (react-hooks/exhaustive-deps).
    const pendingTimers = timers.current;

    const handleNotification = (notification: DriverNotification): void => {
      const { orderId, type } = notification;

      // Signal every arrival — offer, assignment or cancellation all mean the
      // driver's order list is now stale.
      setNotificationSeq(seq => seq + 1);

      if (type === 'ORDER_CANCELED') {
        clearTimer(orderId);
        forgetOrderRoom(orderId);
        setEntries(prev => prev.filter(entry => entry.order.id !== orderId));
        // Still surface it: the driver needs to know a live order died.
        setAlert({ notification, expiresAt: null });
        return;
      }

      // A forced assignment isn't an offer — it's already the driver's order, so
      // it shows as on-delivery (no accept/decline) rather than pending.
      const status: OrderStatus =
        type === 'FORCE_ASSIGNED_ORDER' ? 'on_delivery' : 'pending';
      const expiresAt =
        typeof notification.timeout === 'number' && notification.timeout > 0
          ? Date.now() + notification.timeout * 1000
          : null;

      setEntries(prev => {
        const card = offerCard(notification, status);
        const existing = prev.find(entry => entry.order.id === orderId);
        const next: OfferEntry = {
          // Keep anything already hydrated from the order room.
          order: existing ? { ...existing.order, status } : card,
          expiresAt,
        };
        return [next, ...prev.filter(entry => entry.order.id !== orderId)];
      });
      setAlert({ notification, expiresAt });

      // Hydrate the card (and follow its status) from the order's room.
      joinOrderRoom(orderId);

      clearTimer(orderId);
      if (expiresAt !== null) {
        pendingTimers.set(
          orderId,
          setTimeout(() => drop(orderId), expiresAt - Date.now()),
        );
      }
    };

    const handleOrderUpdate = (doc: OrderDocument): void => {
      const order = fromOrderDocument(doc);
      if (CLOSED_STATUSES.has(order.status)) {
        drop(order.id);
        return;
      }
      setEntries(prev =>
        prev.map(entry =>
          entry.order.id === order.id
            ? // Keep the offer message; the document has no equivalent field.
              { ...entry, order: { ...order, note: entry.order.note } }
            : entry,
        ),
      );
    };

    const offNotification = onDriverNotification(driverId, handleNotification);
    const offOrderUpdate = onOrderUpdate(handleOrderUpdate);

    return () => {
      offNotification();
      offOrderUpdate();
      pendingTimers.forEach(timer => clearTimeout(timer));
      pendingTimers.clear();
      // The connection itself is not ours to close — `useDriverSocket` owns it,
      // and signing out is what tears it down.
    };
  }, [driverId, clearTimer, drop]);

  const dismissAlert = useCallback(() => setAlert(null), []);

  const offers = useMemo(() => entries.map(entry => entry.order), [entries]);
  const offerIds = useMemo(
    () => new Set(entries.map(entry => entry.order.id)),
    [entries],
  );

  return { offers, offerIds, alert, dismissAlert, notificationSeq };
};
