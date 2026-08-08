import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const STAGGER_MS = 110;
const RISE_DISTANCE = 20;
const BRAND_START_SCALE = 1.06;

interface RiseGroup {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export interface FadeRiseStyle {
  opacity: Animated.Value;
  transform: { translateY: Animated.Value }[];
}

export interface FadeScaleStyle {
  opacity: Animated.Value;
  transform: { scale: Animated.Value }[];
}

export interface EntranceAnimation {
  /** For the brand header — fades in and settles from slightly oversized. */
  brand: FadeScaleStyle;
  /** One fade-and-rise style per content group, in stagger order. */
  groups: FadeRiseStyle[];
}

const createRiseGroup = (): RiseGroup => ({
  opacity: new Animated.Value(0),
  translateY: new Animated.Value(RISE_DISTANCE),
});

const riseIn = (group: RiseGroup): Animated.CompositeAnimation =>
  Animated.parallel([
    Animated.timing(group.opacity, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.spring(group.translateY, {
      toValue: 0,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }),
  ]);

/**
 * @param groupCount how many content groups stagger in after the brand mark.
 *   Constant per screen — the returned `groups` array is in stagger order.
 */
export const useEntranceAnimation = (
  groupCount: number,
): EntranceAnimation => {
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(BRAND_START_SCALE)).current;

  // Lazily built once and kept in a ref: recreating the values on a re-render
  // would restart the entrance mid-typing.
  const groupsRef = useRef<RiseGroup[]>([]);
  if (groupsRef.current.length !== groupCount) {
    groupsRef.current = Array.from(
      { length: groupCount },
      (_, index) => groupsRef.current[index] ?? createRiseGroup(),
    );
  }
  const groups = groupsRef.current;

  useEffect(() => {
    const animation = Animated.stagger(STAGGER_MS, [
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      ...groups.map(riseIn),
    ]);

    animation.start();

    // Cleanup: halt any in-flight animation if the screen unmounts early.
    return () => animation.stop();
  }, [brandOpacity, brandScale, groups]);

  return useMemo(
    () => ({
      brand: {
        opacity: brandOpacity,
        transform: [{ scale: brandScale }],
      },
      groups: groups.map(group => ({
        opacity: group.opacity,
        transform: [{ translateY: group.translateY }],
      })),
    }),
    [brandOpacity, brandScale, groups],
  );
};
