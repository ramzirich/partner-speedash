import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Entrance animation for the landing screen.
 *
 * Best-practice notes:
 *  - Animated.Value lives in a ref so it survives re-renders without being
 *    recreated.
 *  - `useNativeDriver: true` runs the animation on the UI thread (60fps, no
 *    JS-bridge jank).
 *  - The animation is STOPPED on unmount so it can't fire a callback after the
 *    component is gone (memory-leak / "setState on unmounted" guard).
 */
export interface LandingAnimationStyles {
  hero: { opacity: Animated.Value; transform: { scale: Animated.Value }[] };
  content: {
    opacity: Animated.Value;
    transform: { translateY: Animated.Value }[];
  };
}

export const useLandingAnimation = (): LandingAnimationStyles => {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1.08)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const animation = Animated.stagger(140, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    // Cleanup: halt any in-flight animation if the screen unmounts early.
    return () => animation.stop();
  }, [contentOpacity, contentTranslateY, heroOpacity, heroScale]);

  return useMemo(
    () => ({
      hero: {
        opacity: heroOpacity,
        transform: [{ scale: heroScale }],
      },
      content: {
        opacity: contentOpacity,
        transform: [{ translateY: contentTranslateY }],
      },
    }),
    [contentOpacity, contentTranslateY, heroOpacity, heroScale],
  );
};
