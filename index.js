/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { recordNotificationPress } from './src/services/notifications';

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

AppRegistry.registerComponent(appName, () => App);
