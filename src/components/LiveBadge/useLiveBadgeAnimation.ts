import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/** One halo expansion — slow enough to read as a heartbeat, not a strobe. */
const PULSE_DURATION_MS = 1800;
const HALO_MAX_SCALE = 2.8;

export interface LiveBadgeAnimatedStyle {
  opacity: Animated.AnimatedInterpolation<number>;
  transform: { scale: Animated.AnimatedInterpolation<number> }[];
}

export const useLiveBadgeAnimation = (
  active: boolean,
): LiveBadgeAnimatedStyle => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: PULSE_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [active, pulse]);

  return useMemo(
    () => ({
      opacity: pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 0],
      }),
      transform: [
        {
          scale: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, HALO_MAX_SCALE],
          }),
        },
      ],
    }),
    [pulse],
  );
};
