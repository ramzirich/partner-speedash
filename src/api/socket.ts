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
 *  - **Notifications** are emitted as a per-partner EVENT NAME
 *    (`notification:partner:<partnerId>`), not a room — so a partner only ever
 *    receives its own notifications, and no join is required.
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

export type DriverDeliveryState = 'AVAILABLE' | 'BUSY';

export interface DriverLocationUpdate {
  partnerId: string;
  /** GeoJSON order: [longitude, latitude] — NOT [lat, lng]. */
  coordinates: [number, number];
  deliveryState: DriverDeliveryState;
}

export type DriverNotificationEvent = `notification:partner:${string}`;

export const driverNotificationEvent = (
  partnerId: string,
): DriverNotificationEvent => `notification:partner:${partnerId}`;

export interface ServerToClientEvents {
  orderUpdate: (order: OrderDocument) => void;
  [event: `notification:partner:${string}`]: (
    notification: DriverNotification,
  ) => void;
}

export interface ClientToServerEvents {
  joinOrderRoom: (payload: { orderId: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// --- Connection -------------------------------------------------------------

let socket: AppSocket | null = null;

let subscribers = 0;

/** Order rooms joined so far, by subscriber count; re-emitted on reconnect. */
const joinedOrderRooms = new Map<string, number>();

const statusListeners = new Set<(connected: boolean) => void>();

const publishStatus = (connected: boolean): void => {
  statusListeners.forEach(listener => listener(connected));
};

const handleConnect = (): void => {
  // Rooms are per-socket: a reconnect starts with zero membership, so anything
  // we were tracking has to be re-joined or updates silently stop arriving.
  joinedOrderRooms.forEach((_count, orderId) => {
    socket?.emit('joinOrderRoom', { orderId });
  });
  publishStatus(true);
  if (__DEV__) {
    console.log('[socket] connected');
  }
};

const handleDisconnect = (): void => {
  publishStatus(false);
};

/**
 * Lazily create the singleton. `transports: ['websocket']` skips the XHR-polling
 * handshake, which is the transport that misbehaves in React Native.
 */
export const connectSocket = (): AppSocket => {
  if (!socket) {
    socket = io(ENV.socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
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

export const acquireSocket = (): AppSocket => {
  subscribers += 1;
  return connectSocket();
};

export const releaseSocket = (): void => {
  subscribers = Math.max(0, subscribers - 1);
  if (subscribers === 0) {
    disconnectSocket();
  }
};

export const isSocketConnected = (): boolean => socket?.connected === true;

export const onSocketStatus = (
  handler: (connected: boolean) => void,
): (() => void) => {
  statusListeners.add(handler);
  handler(isSocketConnected());
  return () => {
    statusListeners.delete(handler);
  };
};

export const resyncSocket = (): void => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

/** Full teardown — used on sign-out so the next partner starts clean. */
export const disconnectSocket = (): void => {
  joinedOrderRooms.clear();
  subscribers = 0;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  publishStatus(false);
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

/**
 * The gateway returns order documents bare on some routes and wrapped on
 * others, so accept either rather than silently dropping a wrapped push.
 */
const toOrderDocument = (value: unknown): OrderDocument | null => {
  if (isOrderDocument(value)) {
    return value;
  }
  if (isRecord(value)) {
    const { data, order } = value;
    if (isOrderDocument(data)) {
      return data;
    }
    if (isOrderDocument(order)) {
      return order;
    }
  }
  return null;
};

// --- Subscriptions ----------------------------------------------------------

/**
 * Listen for this partner's order notifications. Returns the unsubscribe
 * function so callers can release it in an effect cleanup (§5).
 */
export const onDriverNotification = (
  partnerId: string,
  handler: (notification: DriverNotification) => void,
): (() => void) => {
  const event = driverNotificationEvent(partnerId);
  const listener = (payload: DriverNotification): void => {
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
  const listener = (payload: OrderDocument): void => {
    const doc = toOrderDocument(payload);
    if (__DEV__) {
      console.log(
        `[socket] orderUpdate ${doc ? `${doc._id} → ${doc.status}` : 'DROPPED'}`,
        doc ? '' : JSON.stringify(payload)?.slice(0, 200),
      );
    }
    if (doc) {
      handler(doc);
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
  joinedOrderRooms.set(orderId, (joinedOrderRooms.get(orderId) ?? 0) + 1);
  connectSocket().emit('joinOrderRoom', { orderId });
  if (__DEV__) {
    console.log(`[socket] joinOrderRoom ${orderId}`);
  }
};

/**
 * Stop tracking a room locally (no server-side leave event exists yet).
 * Refcounted: the room is only dropped once every subscriber has let go, so one
 * screen unmounting can't stop another's updates from being re-joined.
 */
export const forgetOrderRoom = (orderId: string): void => {
  const remaining = (joinedOrderRooms.get(orderId) ?? 0) - 1;
  if (remaining > 0) {
    joinedOrderRooms.set(orderId, remaining);
  } else {
    joinedOrderRooms.delete(orderId);
  }
};

/**
 * Report the signed-in user's position on whatever connection is already open.
 *
 * Deliberately reads the singleton instead of calling `connectSocket()`: the
 * connection belongs to `useDriverSocket` and exists only while a partner is
 * signed in, so a fix must never be the thing that dials the server.
 *
 * Dropped while disconnected rather than buffered — socket.io would otherwise
 * flush a stale fix on reconnect, and a fresh one is never more than ~30s away.
 */
export const emitDriverLocation = (update: DriverLocationUpdate): void => {
  if (!socket?.connected) {
    return;
  }
  const driverChannel = socket as unknown as Socket<
    ServerToClientEvents,
    { updateLocation: (payload: DriverLocationUpdate) => void }
  >;
  driverChannel.emit('updateLocation', update);
};
