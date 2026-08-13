import { Platform } from 'react-native';
import { devicesApi } from '../api/devices.api';
import { displayPushNotification, recordNotificationPress } from './notifications';

type MessagingModule = typeof import('@react-native-firebase/messaging');

export interface PushData {
  orderId?: string;
  title?: string;
  body?: string;
}

let messagingModule: MessagingModule | null = null;
let loadAttempted = false;
let available = true;

const loadMessaging = (): MessagingModule | null => {
  if (loadAttempted) {
    return messagingModule;
  }
  loadAttempted = true;
  try {
    messagingModule =
      require('@react-native-firebase/messaging') as MessagingModule;
  } catch {
    messagingModule = null;
    available = false;
  }
  return messagingModule;
};

/** False once the native module is missing — the app is on an old binary. */
export const pushAvailable = (): boolean =>
  available && loadMessaging() !== null;

const currentPlatform = (): 'android' | 'ios' =>
  Platform.OS === 'ios' ? 'ios' : 'android';

let registeredToken: string | null = null;

const sendToken = async (token: string): Promise<void> => {
  if (token === registeredToken) {
    return;
  }
  try {
    await devicesApi.register({ token, platform: currentPlatform() });
    registeredToken = token;
  } catch {
    // The backend will simply not have this device until the next launch.
    // Failing here must never block sign-in or the Home screen.
  }
};

export const registerForPush = async (): Promise<boolean> => {
  const mod = loadMessaging();
  if (!mod) {
    return false;
  }
  try {
    const messaging = mod.getMessaging();
    const status = await mod.requestPermission(messaging);
    const granted =
      status === mod.AuthorizationStatus.AUTHORIZED ||
      status === mod.AuthorizationStatus.PROVISIONAL;
    if (!granted) {
      return false;
    }
    const token = await mod.getToken(messaging);
    if (!token) {
      return false;
    }
    await sendToken(token);
    return true;
  } catch {
    available = false;
    return false;
  }
};

export const unregisterFromPush = async (): Promise<void> => {
  const token = registeredToken;
  registeredToken = null;
  if (!token) {
    return;
  }
  try {
    await devicesApi.unregister({ token });
  } catch {
    // Best effort: the backend prunes tokens FCM reports as unregistered, and
    // a failed sign-out cleanup must not keep the user on the screen.
  }
  const mod = loadMessaging();
  if (!mod) {
    return;
  }
  try {
    // Force a fresh token for the next sign-in, so a token the backend still
    // has on file can't reach the account that replaces this one.
    await mod.deleteToken(mod.getMessaging());
  } catch {
    // Nothing actionable — the backend unregister above is what matters.
  }
};

const orderIdOf = (data: PushData | undefined): string | undefined =>
  typeof data?.orderId === 'string' && data.orderId.length > 0
    ? data.orderId
    : undefined;

let routingStarted = false;

export const startPushRouting = (): void => {
  if (routingStarted) {
    return;
  }
  const mod = loadMessaging();
  if (!mod) {
    return;
  }
  routingStarted = true;
  try {
    const messaging = mod.getMessaging();

    mod.onMessage(messaging, async message => {
      const data = message.data as PushData | undefined;
      const title = message.notification?.title ?? data?.title;
      const body = message.notification?.body ?? data?.body;
      if (!title && !body) {
        return;
      }
      await displayPushNotification({
        orderId: orderIdOf(data),
        title: title ?? 'Order update',
        body: body ?? '',
      });
    });

    mod.onNotificationOpenedApp(messaging, message => {
      recordNotificationPress(orderIdOf(message?.data as PushData | undefined));
    });

    mod
      .getInitialNotification(messaging)
      .then(message => {
        recordNotificationPress(
          orderIdOf(message?.data as PushData | undefined),
        );
      })
      .catch(() => {
        // Nothing launched us; there is no target to route to.
      });

    // A rotated token is only useful once the backend has it.
    mod.onTokenRefresh(messaging, (token: string) => {
      sendToken(token);
    });
  } catch {
    available = false;
  }
};
