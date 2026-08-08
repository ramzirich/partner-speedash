import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import type { OrderDocument } from './orders.api';

/**
 * Socket.IO transport — the realtime half of the data layer.
 *
 * The REST side (`client.ts`) can't carry order offers: the backend answers
 * `POST /orders` immediately and only *then* runs driver matching, so an
 * assignment never appears in an HTTP response. It arrives here instead.
 *
 * Addressing model (backend contract):
 *  - **Driver notifications** are emitted as a per-driver EVENT NAME
 *    (`notification:driver:<driverId>`), not a room — so a driver only ever
 *    receives its own offers, and no join is required.
 *  - **Order updates** come from a room that must be joined explicitly
 *    (`joinOrderRoom`). Room membership dies with the socket, so every room is
 *    re-joined on reconnect (see the `connect` handler below).
 *
 * One process-wide socket, like `authToken.ts`: hooks subscribe/unsubscribe,
 * they never own the connection.
 */

export type DriverNotificationType =
  | 'NEW_ORDER_OFFER'
  | 'FORCE_ASSIGNED_ORDER'
  | 'ORDER_CANCELED';

export interface DriverNotification {
  orderId: string;
  message: string;
  type: DriverNotificationType;
  /**
   * Seconds the driver has to accept before the backend re-dispatches the order
   * to someone else. Sent with `NEW_ORDER_OFFER` only.
   */
  timeout?: number;
}

export type DriverWorkStatus = 'ONLINE' | 'OFFLINE';
export type DriverDeliveryState = 'AVAILABLE' | 'BUSY';

export interface DriverLocationUpdate {
  driverId: string;
  /** GeoJSON order: [longitude, latitude] — NOT [lat, lng]. */
  coordinates: [number, number];
  /** `OFFLINE` is silently ignored by the backend (no match, no tracking). */
  workStatus: DriverWorkStatus;
  deliveryState: DriverDeliveryState;
}

/** Per-driver notification event name. */
export const driverNotificationEvent = (driverId: string): string =>
  `notification:driver:${driverId}`;

// --- Connection -------------------------------------------------------------

let socket: Socket | null = null;

/** Order rooms joined so far; re-emitted after every reconnect. */
const joinedOrderRooms = new Set<string>();

const handleConnect = (): void => {
  // Rooms are per-socket: a reconnect starts with zero membership, so anything
  // we were tracking has to be re-joined or updates silently stop arriving.
  joinedOrderRooms.forEach(orderId => {
    socket?.emit('joinOrderRoom', { orderId });
  });
  if (__DEV__) {
    console.log('[socket] connected');
  }
};

/**
 * Lazily create the singleton. `transports: ['websocket']` skips the XHR-polling
 * handshake, which is the transport that misbehaves in React Native.
 */
export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(ENV.socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socket.on('connect', handleConnect);
    socket.on('connect_error', (err: Error) => {
      if (__DEV__) {
        console.log(`[socket] connect error: ${err.message}`);
      }
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

/** Full teardown — used on sign-out so the next driver starts clean. */
export const disconnectSocket = (): void => {
  joinedOrderRooms.clear();
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

// --- Payload guards ---------------------------------------------------------
// Socket payloads are untrusted network data (§8): validate before handing them
// to the UI rather than trusting the declared type.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const NOTIFICATION_TYPES: ReadonlySet<string> = new Set<DriverNotificationType>(
  ['NEW_ORDER_OFFER', 'FORCE_ASSIGNED_ORDER', 'ORDER_CANCELED'],
);

const isDriverNotification = (
  value: unknown,
): value is DriverNotification => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.orderId === 'string' &&
    value.orderId.length > 0 &&
    typeof value.type === 'string' &&
    NOTIFICATION_TYPES.has(value.type)
  );
};

const isOrderDocument = (value: unknown): value is OrderDocument =>
  isRecord(value) && typeof value._id === 'string' && value._id.length > 0;

// --- Subscriptions ----------------------------------------------------------

/**
 * Listen for this driver's offers/assignments. Returns the unsubscribe function
 * so callers can release it in an effect cleanup (§5).
 */
export const onDriverNotification = (
  driverId: string,
  handler: (notification: DriverNotification) => void,
): (() => void) => {
  const event = driverNotificationEvent(driverId);
  const listener = (payload: unknown): void => {
    if (isDriverNotification(payload)) {
      handler(payload);
    } else if (__DEV__) {
      console.log('[socket] dropped malformed driver notification');
    }
  };
  const current = connectSocket();
  current.on(event, listener);
  return () => {
    current.off(event, listener);
  };
};

/** Listen for full order documents on any joined order room. */
export const onOrderUpdate = (
  handler: (order: OrderDocument) => void,
): (() => void) => {
  const listener = (payload: unknown): void => {
    if (isOrderDocument(payload)) {
      handler(payload);
    }
  };
  const current = connectSocket();
  current.on('orderUpdate', listener);
  return () => {
    current.off('orderUpdate', listener);
  };
};

/**
 * Subscribe to one order's updates. Note the backend emits its first
 * `orderUpdate` while creating the order — before any client can know the id —
 * so treat the first payload we see as an update, never as initial state.
 */
export const joinOrderRoom = (orderId: string): void => {
  joinedOrderRooms.add(orderId);
  connectSocket().emit('joinOrderRoom', { orderId });
};

/** Stop tracking a room locally (no server-side leave event exists yet). */
export const forgetOrderRoom = (orderId: string): void => {
  joinedOrderRooms.delete(orderId);
};

/**
 * Report the driver's position on whatever connection is already open.
 *
 * Deliberately reads the singleton instead of calling `connectSocket()`: the
 * connection belongs to `useDriverSocket` and exists only while the driver is
 * ONLINE, so an off-duty fix must never be the thing that dials the server.
 *
 * Dropped while disconnected rather than buffered — socket.io would otherwise
 * flush a stale fix on reconnect, and a fresh one is never more than ~30s away.
 */
export const emitDriverLocation = (update: DriverLocationUpdate): void => {
  if (!socket?.connected) {
    return;
  }
  socket.emit('updateLocation', update);
};
