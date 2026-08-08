import React, { memo, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import MapView, { MarkerAnimated, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../../theme';
import { useDriverMarker } from './useDriverMarker';
import { styles } from './DriverMap.styles';

export interface DriverMapProps {
  latitude: number;
  longitude: number;
  /** 1 (world) … 19 (street). Default 14. */
  zoom?: number;
}

/**
 * Native map showing the driver's live position.
 *
 * Android renders through the Google Maps SDK, which needs an API key in the
 * manifest (`GOOGLE_MAPS_API_KEY` in `.env`, injected by `app/build.gradle`).
 * iOS falls back to Apple Maps, which needs no key at all.
 */
const PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

const DEFAULT_ZOOM = 14;

/** Web-mercator zoom level → the latitude span the viewport covers. */
const spanForZoom = (zoom: number): number => 360 / Math.pow(2, zoom);

const DriverMapComponent: React.FC<DriverMapProps> = ({
  latitude,
  longitude,
  zoom = DEFAULT_ZOOM,
}) => {
  const [loading, setLoading] = useState(true);
  const { coordinate, mapRef } = useDriverMarker(latitude, longitude);

  const initialRegion = useRef({
    latitude,
    longitude,
    latitudeDelta: spanForZoom(zoom),
    longitudeDelta: spanForZoom(zoom),
  }).current;

  const handleMapReady = useCallback(() => setLoading(false), []);

  return (
    <>
      <MapView
        ref={mapRef}
        provider={PROVIDER}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        accessibilityLabel="Map showing your current position"
        testID="driver-map">
        <MarkerAnimated
          coordinate={coordinate}
          pinColor={colors.primary}
          anchor={{ x: 0.5, y: 0.5 }}
          // The pin never changes, so stop the map re-rasterising it each frame.
          tracksViewChanges={false}
          accessibilityLabel="Your position"
          testID="driver-map-marker"
        />
      </MapView>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </>
  );
};

export const DriverMap = memo(DriverMapComponent);
DriverMap.displayName = 'DriverMap';
