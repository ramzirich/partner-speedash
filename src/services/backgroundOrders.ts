import { AppState, Platform } from 'react-native';
import type { NativeEventSubscription } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import { acquireSocket, onOrderUpdate, releaseSocket, resyncSocket } from '../api';
import type { OrderDocument, OrderDocumentStatus } from '../api';
import { colors } from '../theme';
import {
  initOrderNotifications,
  notifyOrderStatus,
  orderStatusMessage,
} from './notifications';

const TASK_NAME = 'OrderUpdates';

const announced = new Map<string, OrderDocumentStatus>();

const ANNOUNCED_LIMIT = 200;

const rememberAnnounced = (
  orderId: string,
  status: OrderDocumentStatus,
): void => {
  announced.set(orderId, status);
  while (announced.size > ANNOUNCED_LIMIT) {
    const oldest = announced.keys().next();
    if (oldest.done) {
      return;
    }
    announced.delete(oldest.value);
  }
};

export const announceOrderStatus = (order: OrderDocument): void => {
  const status = order.status as OrderDocumentStatus;
  if (announced.get(order._id) === status) {
    return;
  }
  rememberAnnounced(order._id, status);
  if (orderStatusMessage(status)) {
    notifyOrderStatus(order, status);
  }
};

const keepAliveTask = async (): Promise<void> => {
  await new Promise<void>(() => {});
};

const taskOptions = {
  taskName: TASK_NAME,
  taskTitle: 'Tracking your order',
  taskDesc: "We'll let you know when it's delivered.",
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: colors.primary,
  foregroundServiceType: ['dataSync'] as ['dataSync'],
};

let offOrderUpdate: (() => void) | null = null;
let appStateSub: NativeEventSubscription | null = null;
let running = false;

const handleAppStateChange = (state: string): void => {
  if (state === 'active') {
    resyncSocket();
  }
};

export const startBackgroundOrderNotifications = async (): Promise<void> => {
  if (running || Platform.OS !== 'android') {
    return;
  }
  running = true;
  await initOrderNotifications();

  acquireSocket();
  offOrderUpdate = onOrderUpdate(announceOrderStatus);
  appStateSub = AppState.addEventListener('change', handleAppStateChange);

  try {
    if (!BackgroundService.isRunning()) {
      await BackgroundService.start(keepAliveTask, taskOptions);
    }
  } catch {
    // A refused foreground service (permission denied, or the Android 15+
    // dataSync budget spent) must not take the app down. The listener above
    // stays wired, so notifications still work for as long as the OS keeps this
    // process alive — which in the foreground is always.
  }
};

export const stopBackgroundOrderNotifications = async (): Promise<void> => {
  if (!running) {
    return;
  }
  running = false;
  offOrderUpdate?.();
  offOrderUpdate = null;
  appStateSub?.remove();
  appStateSub = null;
  releaseSocket();
  announced.clear();
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
  } catch {
    // Nothing actionable — the service dies with the process regardless.
  }
};
