import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const CARD_START_SCALE = 0.94;

export interface MotoLoaderAnimationStyles {
  scrim: { opacity: Animated.Value };
  card: {
    opacity: Animated.Value;
    transform: { scale: Animated.Value }[];
  };
}

export const useMotoLoaderAnimation = (): MotoLoaderAnimationStyles => {
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(CARD_START_SCALE)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    // Cleanup: halt any in-flight animation if the call resolves early.
    return () => animation.stop();
  }, [cardOpacity, cardScale, scrimOpacity]);

  return useMemo(
    () => ({
      scrim: { opacity: scrimOpacity },
      card: {
        opacity: cardOpacity,
        transform: [{ scale: cardScale }],
      },
    }),
    [cardOpacity, cardScale, scrimOpacity],
  );
};
