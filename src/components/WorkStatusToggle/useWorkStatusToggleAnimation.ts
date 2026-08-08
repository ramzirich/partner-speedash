import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const THUMB_TRAVEL = 18;

const DURATION_MS = 220;

export const useWorkStatusToggleAnimation = (
  online: boolean,
): { transform: [{ translateX: Animated.Value }] } => {
  const translateX = useRef(
    new Animated.Value(online ? THUMB_TRAVEL : 0),
  ).current;

  useEffect(() => {
    const anim = Animated.timing(translateX, {
      toValue: online ? THUMB_TRAVEL : 0,
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [online, translateX]);

  return useMemo(() => ({ transform: [{ translateX }] }), [translateX]);
};
