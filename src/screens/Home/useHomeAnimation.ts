import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export interface HomeAnimationStyles {
  header: {
    opacity: Animated.Value;
    transform: { translateY: Animated.Value }[];
  };
  tabBar: {
    opacity: Animated.Value;
    transform: { translateY: Animated.Value }[];
  };
}

const HEADER_DROP = -12;
const TAB_BAR_RISE = 16;

export const useHomeAnimation = (): HomeAnimationStyles => {
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(HEADER_DROP)).current;
  const tabBarOpacity = useRef(new Animated.Value(0)).current;
  const tabBarTranslateY = useRef(new Animated.Value(TAB_BAR_RISE)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(headerTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(tabBarOpacity, {
        toValue: 1,
        duration: 520,
        delay: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(tabBarTranslateY, {
        toValue: 0,
        friction: 9,
        tension: 65,
        delay: 120,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [headerOpacity, headerTranslateY, tabBarOpacity, tabBarTranslateY]);

  return useMemo(
    () => ({
      header: {
        opacity: headerOpacity,
        transform: [{ translateY: headerTranslateY }],
      },
      tabBar: {
        opacity: tabBarOpacity,
        transform: [{ translateY: tabBarTranslateY }],
      },
    }),
    [headerOpacity, headerTranslateY, tabBarOpacity, tabBarTranslateY],
  );
};
