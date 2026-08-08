import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/** How long the fill takes to glide to a new value. */
const FILL_DURATION_MS = 1000;

export const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export interface ProgressBarAnimatedStyle {
  transform: { translateX: Animated.Value }[];
}

export const useProgressBarAnimation = (
  progress: number,
  trackWidth: number,
  durationMs: number = FILL_DURATION_MS,
): ProgressBarAnimatedStyle => {
  const translateX = useRef(new Animated.Value(0)).current;
  /** False until the first real width lands — that pass seeds the empty state. */
  const seeded = useRef(false);

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }
    if (!seeded.current) {
      seeded.current = true;
      // Start fully hidden so the first render animates in from empty.
      translateX.setValue(-trackWidth);
    }
    const animation = Animated.timing(translateX, {
      toValue: -trackWidth * (1 - clamp01(progress)),
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();

    // Cleanup: never let a running fill fire onto an unmounted bar.
    return () => animation.stop();
  }, [progress, trackWidth, durationMs, translateX]);

  return useMemo(
    () => ({ transform: [{ translateX }] }),
    [translateX],
  );
};
