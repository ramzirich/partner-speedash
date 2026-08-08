import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const DURATION_MS = 220;
const PANEL_OFFSET = -8;

export interface AppDropdownAnimation {
  panel: { opacity: Animated.Value; transform: { translateY: Animated.AnimatedInterpolation<number> }[] };
  chevron: { transform: { rotate: Animated.AnimatedInterpolation<string> }[] };
}

export const useAppDropdownAnimation = (open: boolean): AppDropdownAnimation => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, progress]);

  return useMemo(
    () => ({
      panel: {
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [PANEL_OFFSET, 0],
            }),
          },
        ],
      },
      chevron: {
        transform: [
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            }),
          },
        ],
      },
    }),
    [progress],
  );
};
