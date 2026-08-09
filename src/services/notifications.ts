import { Platform } from 'react-native';
import type { OrderDocument, OrderDocumentStatus } from '../api';

/**
 * System notifications for order progress — the heads-up kind, like a chat app.
 *
 * Notifee is loaded lazily and defensively, never as a static import. Its
 * module constructor reaches for the native module immediately
 * (`new NativeEventEmitter(this.native)`) and throws "Notifee native module not
 * found." when the running binary predates `npm install @notifee/react-native`.
 * A top-level import would therefore take the whole app down at startup on a
 * stale build — before any try/catch inside a function could run.
 */

type NotifeeModule = typeof import('@notifee/react-native');

const CHANNEL_ID = 'order-status';
const CHANNEL_NAME = 'Order updates';

let notifeeModule: NotifeeModule | null = null;
let loadAttempted = false;
let ready = false;
let available = true;

const loadNotifee = (): NotifeeModule | null => {
  if (loadAttempted) {
    return notifeeModule;
  }
  loadAttempted = true;
  try {
    notifeeModule = require('@notifee/react-native') as NotifeeModule;
  } catch {
    notifeeModule = null;
    available = false;
  }
  return notifeeModule;
};

/** False once the native module is missing — the app is on an old binary. */
export const notificationsAvailable = (): boolean =>
  available && loadNotifee() !== null;

/**
 * Ask for permission and create the channel. Safe to call repeatedly; the work
 * happens once. Android 13+ (targetSdk 36 here) needs the runtime grant, and
 * without a HIGH-importance channel Android shows the notification silently in
 * the tray rather than as a banner.
 */
export const initOrderNotifications = async (): Promise<boolean> => {
  if (ready) {
    return true;
  }
  const mod = loadNotifee();
  if (!mod) {
    return false;
  }
  try {
    const settings = await mod.default.requestPermission();
    const granted =
      settings.authorizationStatus === mod.AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === mod.AuthorizationStatus.PROVISIONAL;
    if (Platform.OS === 'android') {
      await mod.default.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME,
        importance: mod.AndroidImportance.HIGH,
      });
    }
    ready = granted;
    return granted;
  } catch {
    available = false;
    return false;
  }
};

const shortId = (orderId: string): string => `#${orderId.slice(-6)}`;

/**
 * Only delivery is worth a notification. The intermediate steps are visible in
 * the app and on the card; interrupting for each one would be noise.
 */
const STATUS_MESSAGE: Partial<Record<OrderDocumentStatus, string>> = {
  DELIVERED: 'Your order has been delivered.',
};

export const orderStatusMessage = (
  status: OrderDocumentStatus,
): string | undefined => STATUS_MESSAGE[status];

/**
 * Raise (or replace) the notification for one order. The notification id is the
 * order id, so a moving order updates its existing entry instead of stacking a
 * new one per transition — the same way a chat thread updates in place. That id
 * is also what the press handler reads back to know which order to open.
 */
export const notifyOrderStatus = async (
  order: OrderDocument,
  status: OrderDocumentStatus,
): Promise<void> => {
  const body = orderStatusMessage(status);
  if (!body) {
    return;
  }
  const mod = loadNotifee();
  if (!mod) {
    return;
  }
  try {
    if (!ready && !(await initOrderNotifications())) {
      return;
    }
    await mod.default.displayNotification({
      id: order._id,
      title: `Order ${shortId(order._id)}`,
      body,
      android: {
        channelId: CHANNEL_ID,
        importance: mod.AndroidImportance.HIGH,
        // `launchActivity: 'default'` is what brings the app to the front from
        // outside it — without it a press dismisses and nothing opens.
        pressAction: { id: 'default', launchActivity: 'default' },
        autoCancel: true,
        smallIcon: 'ic_launcher',
      },
    });
  } catch {
    available = false;
  }
};

// --- Press routing ----------------------------------------------------------

/**
 * Where a notification press should take the user, held until something can
 * act on it.
 *
 * A press can arrive long before any screen is listening: from a cold start the
 * notification is delivered while React is still mounting, and while signed out
 * the Orders tab doesn't exist yet. So the target is parked here and handed to
 * the first subscriber that turns up, rather than fired into an empty room.
 */
let pendingOrderId: string | null = null;
const pressListeners = new Set<(orderId: string) => void>();

/**
 * Record a press. Exported because the background/quit-state handler lives in
 * `index.js` — Notifee requires it registered outside the component tree.
 */
export const recordNotificationPress = (orderId: string | undefined): void => {
  if (!orderId) {
    return;
  }
  if (pressListeners.size === 0) {
    pendingOrderId = orderId;
    return;
  }
  pressListeners.forEach(listener => listener(orderId));
};

/**
 * Subscribe to notification presses. Fires immediately with a target that
 * arrived before this subscriber existed, which is the usual case on a cold
 * start.
 */
export const onOrderNotificationPress = (
  handler: (orderId: string) => void,
): (() => void) => {
  pressListeners.add(handler);
  if (pendingOrderId !== null) {
    const orderId = pendingOrderId;
    pendingOrderId = null;
    handler(orderId);
  }
  return () => {
    pressListeners.delete(handler);
  };
};

let pressRoutingStarted = false;

/**
 * Wire the two paths this process can learn about a press: the foreground
 * event, and the notification that launched the app from a quit state. The
 * background path is registered in `index.js`.
 */
export const startNotificationPressRouting = (): void => {
  if (pressRoutingStarted) {
    return;
  }
  const mod = loadNotifee();
  if (!mod) {
    return;
  }
  pressRoutingStarted = true;
  try {
    mod.default.onForegroundEvent(({ type, detail }) => {
      if (type === mod.EventType.PRESS) {
        recordNotificationPress(detail.notification?.id);
      }
    });
    mod.default
      .getInitialNotification()
      .then(initial => {
        recordNotificationPress(initial?.notification?.id);
      })
      .catch(() => {
        // Nothing launched us; there is no target to route to.
      });
  } catch {
    available = false;
  }
};

/** Clear an order's notification — used when its tracker is dismissed. */
export const clearOrderNotification = async (
  orderId: string,
): Promise<void> => {
  const mod = loadNotifee();
  if (!mod) {
    return;
  }
  try {
    await mod.default.cancelNotification(orderId);
  } catch {
    available = false;
  }
};
