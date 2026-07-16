import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Drives the delivery-scooter scene with three looping animations:
 *  - `bob`  : the whole scooter floats up/down
 *  - `spin` : the wheels rotate (linear, seamless loop)
 *  - `dash` : the speed-lines streak past
 *
 * Best-practice notes:
 *  - Animated.Values live in refs so they survive re-renders.
 *  - Everything uses `useNativeDriver: true` (transforms + opacity only) → the
 *    loops run on the UI thread and keep going even if JS is busy.
 *  - All loops are STOPPED on unmount so nothing animates a dead component
 *    (memory-leak guard).
 */
export interface RiderAnimationValues {
  translateY: Animated.AnimatedInterpolation<number>;
  rotate: Animated.AnimatedInterpolation<string>;
  shadowScaleX: Animated.AnimatedInterpolation<number>;
  shadowOpacity: Animated.AnimatedInterpolation<number>;
  dash: Animated.Value;
}

export const useRiderAnimation = (): RiderAnimationValues => {
  const bob = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const dash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const dashLoop = Animated.loop(
      Animated.timing(dash, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    bobLoop.start();
    spinLoop.start();
    dashLoop.start();

    return () => {
      bobLoop.stop();
      spinLoop.stop();
      dashLoop.stop();
    };
  }, [bob, spin, dash]);

  return useMemo(
    () => ({
      translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }),
      rotate: spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
      shadowScaleX: bob.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.85],
      }),
      shadowOpacity: bob.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.1],
      }),
      dash,
    }),
    [bob, spin, dash],
  );
};
