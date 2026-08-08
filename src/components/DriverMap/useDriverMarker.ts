import { useEffect, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import type MapView from 'react-native-maps';

/** How long the marker + camera take to glide to a new fix. */
const TRANSITION_MS = 900;

export interface DriverMarkerController {
  /** Feed straight to <MarkerAnimated coordinate={...} />. */
  coordinate: { latitude: Animated.Value; longitude: Animated.Value };
  /** Attach to <MapView ref={...} /> so the camera can follow. */
  mapRef: React.RefObject<MapView | null>;
}

export const useDriverMarker = (
  latitude: number,
  longitude: number,
): DriverMarkerController => {
  const mapRef = useRef<MapView | null>(null);

  const lat = useRef(new Animated.Value(latitude)).current;
  const lng = useRef(new Animated.Value(longitude)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(lat, {
        toValue: latitude,
        duration: TRANSITION_MS,
        useNativeDriver: false,
      }),
      Animated.timing(lng, {
        toValue: longitude,
        duration: TRANSITION_MS,
        useNativeDriver: false,
      }),
    ]);
    animation.start();

    // Keep the driver centred, matching the previous map's behaviour.
    mapRef.current?.animateCamera(
      { center: { latitude, longitude } },
      { duration: TRANSITION_MS },
    );

    return () => animation.stop();
  }, [lat, lng, latitude, longitude]);

  const coordinate = useMemo(
    () => ({ latitude: lat, longitude: lng }),
    [lat, lng],
  );

  return { coordinate, mapRef };
};
