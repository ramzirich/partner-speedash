import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export interface HomeTabAnimationStyles {
  map: { opacity: Animated.Value };
  sheet: {
    opacity: Animated.Value;
    transform: { translateY: Animated.Value }[];
  };
}

/** How far the sheet starts below its resting position. */
const SHEET_RISE = 28;

export const useHomeTabAnimation = (): HomeTabAnimationStyles => {
  const mapOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_RISE)).current;

  useEffect(() => {
    const animation = Animated.stagger(120, [
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    return () => animation.stop();
  }, [mapOpacity, sheetOpacity, sheetTranslateY]);

  return useMemo(
    () => ({
      map: { opacity: mapOpacity },
      sheet: {
        opacity: sheetOpacity,
        transform: [{ translateY: sheetTranslateY }],
      },
    }),
    [mapOpacity, sheetOpacity, sheetTranslateY],
  );
};
