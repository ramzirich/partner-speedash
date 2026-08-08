import React, { memo, useCallback, useMemo, useState } from 'react';
import { Animated, LayoutChangeEvent, Text, View } from 'react-native';
import { BrandBackdrop } from '../BrandBackdrop';
import { RiderHero } from '../RiderHero';
import { useMotoLoaderAnimation } from './useMotoLoaderAnimation';
import { styles } from './MotoLoader.styles';

const RIDER_ARTWORK = require('../../assets/images/delivery1.jpg');

const CROSS_MS = 1500;
const RIDER_SIZE = 140;

export interface MotoLoaderProps {
  visible: boolean;
  label?: string;
  /** Side of the square rider, in px. */
  riderSize?: number;
  /** Milliseconds per leg. Lower = a rider in more of a hurry. */
  crossMs?: number;
}

const RiderTrack: React.FC<{ riderSize: number; crossMs: number }> = memo(
  ({ riderSize, crossMs }) => {
    const [trackWidth, setTrackWidth] = useState(0);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
      setTrackWidth(e.nativeEvent.layout.width);
    }, []);

    const trackStyle = useMemo(
      () => [styles.track, { height: riderSize }],
      [riderSize],
    );
    const boxStyle = useMemo(
      () => [styles.riderBox, { width: riderSize, height: riderSize }],
      [riderSize],
    );

    const travelDistance = Math.max(0, (trackWidth - riderSize) / 2);

    return (
      <View
        style={trackStyle}
        onLayout={onLayout}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View style={boxStyle}>
          {trackWidth > 0 ? (
            <RiderHero
              source={RIDER_ARTWORK}
              facing="left"
              travel="bounce"
              travelDistance={travelDistance}
              travelMs={crossMs}
              showSpeedLines
              showDust
              dropWhiteBackground
              showShadow={false}
            />
          ) : null}
        </View>
      </View>
    );
  },
);
RiderTrack.displayName = 'RiderTrack';

const MotoLoaderComponent: React.FC<MotoLoaderProps> = ({
  visible,
  label = 'Loading…',
  riderSize = RIDER_SIZE,
  crossMs = CROSS_MS,
}) => {
  if (!visible) {
    return null;
  }
  // Mounted only while busy, so the entrance runs on a fresh instance.
  return (
    <MotoLoaderOverlay label={label} riderSize={riderSize} crossMs={crossMs} />
  );
};

const MotoLoaderOverlay: React.FC<Required<Omit<MotoLoaderProps, 'visible'>>> =
  memo(({ label, riderSize, crossMs }) => {
    const animated = useMotoLoaderAnimation();

    return (
      <Animated.View
        style={[styles.overlay, animated.scrim]}
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}
        testID="moto-loader"
        pointerEvents="auto">
        <Animated.View style={[styles.cardShadow, animated.card]}>
          <View style={styles.card}>
            <BrandBackdrop />
            <RiderTrack riderSize={riderSize} crossMs={crossMs} />
            <Text style={styles.label}>{label}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    );
  });
MotoLoaderOverlay.displayName = 'MotoLoaderOverlay';

export const MotoLoader = memo(MotoLoaderComponent);
MotoLoader.displayName = 'MotoLoader';
