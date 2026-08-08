import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

const MIN_DURATION_MS = 900;
const MAX_DURATION_MS = 1800;
const FULL_SPEED_AT = 200;

export const countUpDurationMs = (value: number): number => {
  const magnitude =
    Math.log10(1 + Math.abs(value)) / Math.log10(1 + FULL_SPEED_AT);
  const ratio = Math.min(1, Math.max(0, magnitude));
  return Math.round(
    MIN_DURATION_MS + (MAX_DURATION_MS - MIN_DURATION_MS) * ratio,
  );
};

export const useCountUp = (
  value: number,
  decimals = 0,
  delayMs = 0,
): string => {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(() => (0).toFixed(decimals));

  useEffect(() => {
    const listenerId = animated.addListener(({ value: frame }) => {
      const next = frame.toFixed(decimals);
      // Same string as last frame → React bails out, no re-render.
      setDisplay(previous => (previous === next ? previous : next));
    });

    const animation = Animated.timing(animated, {
      toValue: value,
      duration: countUpDurationMs(value),
      delay: delayMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    // Cleanup: stop the run *and* drop the listener, or a finished animation
    // keeps a dead component's setState alive (§5).
    return () => {
      animation.stop();
      animated.removeListener(listenerId);
    };
  }, [value, decimals, delayMs, animated]);

  return display;
};
