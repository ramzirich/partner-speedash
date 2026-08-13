/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import {
  displayPushNotification,
  recordNotificationPress,
} from './src/services/notifications';

try {
  const notifee = require('@notifee/react-native');
  notifee.default.onBackgroundEvent(async ({ type, detail }) => {
    if (type === notifee.EventType.PRESS) {
      recordNotificationPress(detail.notification?.id);
    }
  });
} catch {
  // No Notifee in this binary — the app still runs, just without notifications.
}

try {
  const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
  setBackgroundMessageHandler(getMessaging(), async message => {
    const data = message?.data ?? {};
    const title = message?.notification?.title ?? data.title;
    const body = message?.notification?.body ?? data.body;
    if (!title && !body) {
      return;
    }
    await displayPushNotification({
      orderId: typeof data.orderId === 'string' ? data.orderId : undefined,
      title: title ?? 'Order update',
      body: body ?? '',
    });
  });
} catch {
  // No Firebase in this binary — in-app socket updates still work.
}

AppRegistry.registerComponent(appName, () => App);
