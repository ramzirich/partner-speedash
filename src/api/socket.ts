import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';
import type { OrderDocument } from './orders.api';
import { getAccessToken } from './authToken';

export type DriverNotificationType =
  | 'NEW_ORDER_OFFER'
  | 'FORCE_ASSIGNED_ORDER'
  | 'ORDER_CANCELED';

export interface DriverNotification {
  orderId: string;
  message: string;
  type: DriverNotificationType;
  timeout?: number;
}

export type DriverDeliveryState = 'AVAILABLE' | 'BUSY';

export interface DriverLocationUpdate {
  partnerId: string;
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

let socket: AppSocket | null = null;

let subscribers = 0;

const joinedOrderRooms = new Map<string, number>();

const statusListeners = new Set<(connected: boolean) => void>();

const publishStatus = (connected: boolean): void => {
  statusListeners.forEach(listener => listener(connected));
};

const handleConnect = (): void => {
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

export const connectSocket = (): AppSocket => {
  if (!socket) {
    socket = io(ENV.socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: cb => {
        cb({ token: getAccessToken() });
      },
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const NOTIFICATION_TYPES: ReadonlySet<string> = new Set<DriverNotificationType>(
  ['NEW_ORDER_OFFER', 'FORCE_ASSIGNED_ORDER', 'ORDER_CANCELED'],
);

const isDriverNotification = (value: unknown): value is DriverNotification => {
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

export const onOrderUpdate = (
  handler: (order: OrderDocument) => void,
): (() => void) => {
  const listener = (payload: OrderDocument): void => {
    const doc = toOrderDocument(payload);
    if (__DEV__) {
      console.log(
        `[socket] orderUpdate ${
          doc ? `${doc._id} → ${doc.status}` : 'DROPPED'
        }`,
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

export const joinOrderRoom = (orderId: string): void => {
  joinedOrderRooms.set(orderId, (joinedOrderRooms.get(orderId) ?? 0) + 1);
  connectSocket().emit('joinOrderRoom', { orderId });
  if (__DEV__) {
    console.log(`[socket] joinOrderRoom ${orderId}`);
  }
};

export const forgetOrderRoom = (orderId: string): void => {
  const remaining = (joinedOrderRooms.get(orderId) ?? 0) - 1;
  if (remaining > 0) {
    joinedOrderRooms.set(orderId, remaining);
  } else {
    joinedOrderRooms.delete(orderId);
  }
};

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
