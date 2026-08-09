import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useIsMounted } from './useIsMounted';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface DriverLocation {
  position: Coords | null;
  error: string | null;
  loading: boolean;
}

/** Ask for the Android runtime location permission. iOS is handled below. */
const requestAndroidPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'PartnerSpeedash needs your location to show you on the map.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * Streams the device's live GPS position via `watchPosition`.
 *
 * Best-practice notes:
 *  - The watch is cleared on unmount (no leaked native listener / callback).
 *  - Every post-async `setState` is guarded by `useIsMounted`.
 *  - Returns the latest fix; the screen decides how to render it.
 */
export const useDriverLocation = (): DriverLocation => {
  const isMounted = useIsMounted();
  const [position, setPosition] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async (): Promise<void> => {
      try {
        const granted = await requestAndroidPermission();
        if (cancelled || !isMounted()) {
          return;
        }
        if (!granted) {
          setError('Location permission denied.');
          setLoading(false);
          return;
        }
        // iOS permission prompt (no-op on Android).
        Geolocation.requestAuthorization?.();

        watchIdRef.current = Geolocation.watchPosition(
          pos => {
            if (!isMounted()) {
              return;
            }
            setPosition({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setError(null);
            setLoading(false);
          },
          err => {
            if (!isMounted()) {
              return;
            }
            setError(err.message || 'Could not get your location.');
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 5,
            interval: 5000,
            fastestInterval: 2000,
          },
        );
      } catch {
        if (isMounted()) {
          setError('Could not start location updates.');
          setLoading(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isMounted]);

  return { position, error, loading };
};
