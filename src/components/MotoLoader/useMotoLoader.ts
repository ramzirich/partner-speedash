import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Drives the back-and-forth loader scooter.
 *
 * A single looped clock `track` runs 0 → 2 forever:
 *   - 0 → 1  the scooter drives left → right
 *   - 1 → 2  it has hit the wall, turns, and drives right → left
 * On loop, 2 snaps back to 0 (the left wall) and it sets off again — so it
 * keeps bouncing for as long as it's mounted (i.e. while the API call runs).
 *
 * `translateX` maps the clock to a real pixel distance (measured at runtime so
 * it's responsive). `facing` flips the sprite horizontally at each turn so the
 * scooter always points the way it's travelling.
 *
 * Best-practice notes:
 *  - The clock lives in a ref (survives re-renders, never recreated).
 *  - Everything is `useNativeDriver: true` (transform-only) → runs on the UI
 *    thread, so it stays smooth even while JS is busy awaiting the request.
 *  - The loop is STOPPED on unmount; the loader unmounts the instant the call
 *    finishes, so nothing animates a dead component (memory-leak guard).
 */
export interface MotoLoaderValues {
  translateX: Animated.AnimatedInterpolation<number>;
  facing: Animated.AnimatedInterpolation<number>;
}

export const useMotoLoader = (
  distance: number,
  roundTripMs: number,
): MotoLoaderValues => {
  const track = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track.setValue(0);
    const loop = Animated.loop(
      Animated.timing(track, {
        toValue: 2,
        duration: roundTripMs,
        // Ease in/out so it decelerates into each wall and accelerates away —
        // reads as a real turn rather than a bounce off glass.
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [track, roundTripMs]);

  return useMemo(() => {
    const safeDistance = distance > 0 ? distance : 0;
    return {
      // 0→1 go right, 1→2 come back left.
      translateX: track.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, safeDistance, 0],
      }),
      // Face right on the way out, flip to face left right at the turn (1).
      facing: track.interpolate({
        inputRange: [0, 1, 1.0001, 2],
        outputRange: [1, 1, -1, -1],
      }),
    };
  }, [track, distance]);
};
