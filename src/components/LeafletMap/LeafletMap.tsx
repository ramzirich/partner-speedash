import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme';
import { styles } from './LeafletMap.styles';

export interface LeafletMapProps {
  latitude: number;
  longitude: number;
  /** 1 (world) … 19 (street). Default 14. */
  zoom?: number;
}

/**
 * Free, no-API-key map: Leaflet + OpenStreetMap tiles inside a WebView.
 * Needs internet (loads Leaflet from a CDN + OSM tiles).
 *
 * The HTML is built ONCE from the first coordinates; subsequent position
 * changes are pushed in via `injectJavaScript` (move marker + recenter) so the
 * map never reloads — that's what makes live GPS smooth instead of flickering.
 */
const buildHtml = (lat: number, lng: number, zoom: number): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    var marker = L.marker([${lat}, ${lng}]).addTo(map);
    // Called from React Native to push live position updates.
    window.__setDriver = function (lat, lng) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng]);
    };
  </script>
</body>
</html>`;

const LeafletMapComponent: React.FC<LeafletMapProps> = ({
  latitude,
  longitude,
  zoom = 14,
}) => {
  // `any` ref: react-native-webview's generic WebView class clashes with the
  // React 19 ref typing, so a typed ref breaks JSX overload resolution.
  const webRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Initial coords are frozen so the HTML string (and thus the WebView) is
  // built exactly once.
  const initial = useRef({ latitude, longitude, zoom });
  const html = useMemo(
    () =>
      buildHtml(
        initial.current.latitude,
        initial.current.longitude,
        initial.current.zoom,
      ),
    [],
  );

  // Keep the newest coords so we can re-push them once the page is ready.
  const latest = useRef({ latitude, longitude });
  latest.current = { latitude, longitude };

  const pushPosition = (lat: number, lng: number): void => {
    webRef.current?.injectJavaScript(
      `if (window.__setDriver) { window.__setDriver(${lat}, ${lng}); } true;`,
    );
  };

  // Push every position change after mount.
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    pushPosition(latitude, longitude);
  }, [latitude, longitude]);

  return (
    <>
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html }}
        onLoadEnd={() => {
          setLoading(false);
          // A fix may have arrived before the page loaded — re-push it.
          pushPosition(latest.current.latitude, latest.current.longitude);
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </>
  );
};

export const LeafletMap = memo(LeafletMapComponent);
LeafletMap.displayName = 'LeafletMap';
