import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  GeolocationError,
  GeolocationResponse,
} from '@react-native-community/geolocation';
import BackgroundService from 'react-native-background-actions';
import { emitDriverLocation, locationApi } from '../api';
import { colors } from '../theme';
import { useIsMounted } from './useIsMounted';
import type { Coords } from './useDriverLocation';

/** Report cadence: POST at most once per 30s, foreground and backgrounded. */
const REPORT_INTERVAL_MS = 30_000;

/**
 * Free background-location stack (no paid SDK / license):
 *  - `react-native-background-actions` holds a foreground service (persistent
 *    notification) so the OS keeps our process alive + grants the Android 14+
 *    `location` foreground-service type while backgrounded.
 *  - `@react-native-community/geolocation` `watchPosition` supplies each fix.
 *
 * Why a native watch, not a JS `setTimeout` loop: Android throttles/suspends JS
 * timers once the app is backgrounded, so a `setTimeout`-driven poll silently
 * stalls (no fix, no error). `watchPosition` registers a *native* location
 * listener — the OS pushes fixes into JS on its own schedule, which keeps
 * arriving in the background under the foreground service. This is the piece
 * that makes background reporting work in production, not just in the fg.
 *
 * The service is a process-wide singleton, so its driver id, map callback and
 * watch id live at module scope and are swapped on each mount — remounts stay
 * live without restarting the service.
 */
let currentDriverId: string | null = null;

let onFix: ((coords: Coords) => void) | null = null;
let watchId: number | null = null;
/** Wall-clock of the last successful POST, for the 30s throttle. */
let lastReportAt = 0;

const toCoords = (pos: GeolocationResponse): Coords => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
});

/**
 * Publish the fix. Two channels, on purpose:
 *  - **Socket `updateLocation`** — what the dispatcher matches on. Without it the
 *    driver is invisible to `findAndAssignDriver` and no offer ever arrives; it
 *    also drives the server-side geofencing of an in-progress delivery.
 *  - **REST `locationApi.report`** — the persisted trail (Bearer + refresh-on-401
 *    handled by `apiRequest`).
 *
 * Coordinates are never logged (PII, §8). Fires in every build (dev + prod) —
 * only the debug console logs are gated.
 */
const report = (coords: Coords): void => {
  if (!currentDriverId) {
    return;
  }
  emitDriverLocation({
    driverId: currentDriverId,
    // GeoJSON order: [longitude, latitude].
    coordinates: [coords.longitude, coords.latitude],
    // server's pickup/drop-off geofencing (AT_PICKUP / DELIVERED transitions).
    deliveryState: 'AVAILABLE',
  });
  locationApi.report({ driverId: currentDriverId, ...coords }).catch(() => {
    if (__DEV__) {
      console.log('[location] report failed');
    }
  });
};

/**
 * Native-watch callback. Runs on every OS fix (foreground and background):
 * updates the map immediately, and POSTs on the throttled 30s cadence.
 */
const handleFix = (pos: GeolocationResponse): void => {
  const coords = toCoords(pos);
  onFix?.(coords); // Map: follow the fix.
  const now = Date.now();
  if (now - lastReportAt >= REPORT_INTERVAL_MS) {
    lastReportAt = now;
    report(coords); // API: every 30s.
    // TEMP DEBUG (violates §8 — remove before shipping): log on the 30s cadence.
    if (__DEV__) {
      console.log(`[location] fix ${coords.latitude}, ${coords.longitude}`);
    }
  }
};

const handleWatchError = (err: GeolocationError): void => {
  if (__DEV__) {
    console.log(`[location] watch error code=${err.code} msg=${err.message}`);
  }
};

/**
 * Keeps the foreground service alive. The library shows the notification while
 * this promise is pending; it never resolves — `BackgroundService.stop()` tears
 * the service down. The actual work is done by the native `watchPosition`, not
 * here, so this task does no polling.
 */
const keepAliveTask = async (): Promise<void> => {
  await new Promise<void>(() => {});
};

const taskOptions = {
  taskName: 'DriverLocation',
  taskTitle: 'PartnerSpeedash',
  taskDesc: 'Sharing your location while you deliver.',
  taskIcon: { name: 'ic_launcher', type: 'mipmap' },
  color: colors.primary,
  // Android 14+ requires the service type; the manifest declares the matching
  // `location` type + FOREGROUND_SERVICE_LOCATION permission.
  foregroundServiceType: ['location'] as ['location'],
};

/**
 * Ask for the runtime permissions the foreground service needs. Returns false
 * only when FINE location is denied (without it we can't track at all); the
 * notification + background grants are best-effort.
 */
const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    Geolocation.requestAuthorization?.();
    return true;
  }
  const fine = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message:
        'PartnerSpeedash needs your location to share your position on deliveries.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  if (fine !== PermissionsAndroid.RESULTS.GRANTED) {
    return false;
  }
  // Android 13+: the foreground-service notification needs POST_NOTIFICATIONS.
  if (Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  // Android 10+: "Allow all the time" is a separate prompt, requested after
  // FINE. Without it the OS stops delivering fixes once fully backgrounded.
  if (Platform.Version >= 29) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    );
  }
  return true;
};

/** Start the native location watch once. */
const startWatch = (): void => {
  if (watchId !== null) {
    return;
  }
  watchId = Geolocation.watchPosition(handleFix, handleWatchError, {
    enableHighAccuracy: true,
    // Emit on the Play Services fused provider every ~30s regardless of
    // movement so a stationary driver still reports. distanceFilter 0 = no
    // distance gate; the report cadence is enforced by the throttle above.
    distanceFilter: 0,
    interval: REPORT_INTERVAL_MS,
    fastestInterval: REPORT_INTERVAL_MS,
  });
};

const clearWatch = (): void => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
};

/** Idempotent: starts the foreground service + native watch once. */
const start = async (): Promise<void> => {
  const granted = await requestPermissions();
  if (!granted) {
    return;
  }
  // Use the fused (Play Services) provider: it's the only path that honours the
  // `interval` option, so GPS samples every ~30s instead of the LocationManager
  // path's hardcoded 1s poll (a big battery win). Linked via
  // play-services-location; available on any device with Google Play Services.
  Geolocation.setRNConfiguration({
    skipPermissionRequests: true,
    authorizationLevel: 'always',
    locationProvider: 'playServices',
    enableBackgroundLocationUpdates: true,
  });
  if (!BackgroundService.isRunning()) {
    await BackgroundService.start(keepAliveTask, taskOptions);
  }
  startWatch();
};

const stop = async (): Promise<void> => {
  clearWatch();
  if (BackgroundService.isRunning()) {
    await BackgroundService.stop();
  }
};

export interface BackgroundLocation {
  position: Coords | null;
}

/**
 * Background driver-location tracking on the free stack (foreground service +
 * community geolocation `watchPosition`). Reports the driver's position to the
 * backend every ~30s in the foreground AND while backgrounded, and returns the
 * latest fix for the map.
 *
 * Runs only for a signed-in driver — signing out stops the watch and the
 * foreground service, so no position leaves the device once the session ends.
 * Tracking also stops if the driver kills the app — resuming after a kill needs
 * persisted tokens (in-memory only for now, see CLAUDE.md §13).
 *
 * Note: on aggressive OEMs (Samsung/Xiaomi/Huawei) the app must also be exempt
 * from battery optimization ("Unrestricted") or the OS may freeze the process
 * and suspend delivery despite the foreground service.
 */
export const useBackgroundLocation = (
  driverId: string | undefined,
): BackgroundLocation => {
  const isMounted = useIsMounted();
  const [position, setPosition] = useState<Coords | null>(null);

  useEffect(() => {
    if (!driverId) {
      return;
    }
    currentDriverId = driverId;
    onFix = coords => {
      if (isMounted()) {
        setPosition(coords);
      }
    };
    start();

    // Sign-out: the watch and the foreground service both stop, so nothing is
    // sampled, emitted or POSTed once the session ends. `position` is
    // deliberately left alone — the map keeps showing the last known fix
    // instead of snapping back to the default region.
    return () => {
      onFix = null;
      stop();
    };
  }, [driverId, isMounted]);

  return { position };
};
