import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Entry animation for <OrderOfferBanner>: drops in from above the header and
 * settles. Re-plays whenever `key` changes, so a second offer arriving while the
 * first banner is still up re-announces itself instead of swapping silently.
 *
 * Only `opacity` + `transform` are animated → `useNativeDriver: true` keeps it on
 * the UI thread, and the effect stops the animation on unmount (§4/§5).
 */
export interface OrderOfferBannerAnimationStyle {
  opacity: Animated.Value;
  transform: (
    | { translateY: Animated.AnimatedInterpolation<number> }
    | { scale: Animated.AnimatedInterpolation<number> }
  )[];
}

const ENTER_MS = 420;

export const useOrderOfferBannerAnimation = (
  key: string | null,
): OrderOfferBannerAnimationStyle => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    if (!key) {
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [key, progress]);

  return useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-32, 0],
          }),
        },
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          }),
        },
      ],
    }),
    [progress],
  );
};
