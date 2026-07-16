import React, { memo, useCallback, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { RiderAnimation } from '../RiderAnimation';
import { useMotoLoader } from './useMotoLoader';
import { styles } from './MotoLoader.styles';

// The RiderAnimation art is authored in a fixed 240 x 150 box.
const ART_W = 240;
const ART_H = 150;

export interface MotoLoaderProps {
  visible: boolean;
  label?: string;
  motoWidth?: number;
  roundTripMs?: number;
}

const MotoSprite: React.FC<{ width: number; style?: StyleProp<ViewStyle> }> =
  memo(({ width, style }) => {
    const scale = width / ART_W;
    const height = ART_H * scale;
    return (
      <View style={[styles.spriteClip, { width, height }, style]}>
        <View
          style={[
            styles.spriteInner,
            {
              width: ART_W,
              height: ART_H,
              left: -((ART_W / 2) * (1 - scale)),
              top: -((ART_H / 2) * (1 - scale)),
              transform: [{ scale }],
            },
          ]}>
          <RiderAnimation />
        </View>
      </View>
    );
  });
MotoSprite.displayName = 'MotoSprite';

const MotoTrack: React.FC<{ motoWidth: number; roundTripMs: number }> = memo(
  ({ motoWidth, roundTripMs }) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const scale = motoWidth / ART_W;
    const motoHeight = ART_H * scale;

    const onLayout = useCallback((e: LayoutChangeEvent) => {
      setTrackWidth(e.nativeEvent.layout.width);
    }, []);

    const distance = Math.max(0, trackWidth - motoWidth);
    const { translateX, facing } = useMotoLoader(distance, roundTripMs);

    return (
      <View style={[styles.track, { height: motoHeight + 12 }]} onLayout={onLayout}>
        <View style={styles.road} />
        <Animated.View
          style={[
            styles.mover,
            { transform: [{ translateX }, { scaleX: facing }] },
          ]}>
          <MotoSprite width={motoWidth} />
        </Animated.View>
      </View>
    );
  },
);
MotoTrack.displayName = 'MotoTrack';

const MotoLoaderComponent: React.FC<MotoLoaderProps> = ({
  visible,
  label = 'Loading…',
  motoWidth = 96,
  roundTripMs = 2400,
}) => {
  if (!visible) {
    return null;
  }
  return (
    <View
      style={styles.overlay}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      pointerEvents="auto">
      <View style={styles.card}>
        <MotoTrack motoWidth={motoWidth} roundTripMs={roundTripMs} />
        <Animated.Text style={styles.label}>{label}</Animated.Text>
      </View>
    </View>
  );
};

export const MotoLoader = memo(MotoLoaderComponent);
MotoLoader.displayName = 'MotoLoader';
