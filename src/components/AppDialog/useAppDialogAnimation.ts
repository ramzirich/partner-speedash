import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useIsMounted } from '../../hooks/useIsMounted';

/**
 * Enter/exit animation for <AppDialog>.
 *
 * Best-practice notes (CLAUDE.md §4/§5):
 *  - A single `progress` Animated.Value (0 → hidden, 1 → shown) lives in a ref
 *    so it survives re-renders without being recreated.
 *  - Only `opacity` + `transform` are animated, so `useNativeDriver: true` keeps
 *    it on the UI thread (60fps, survives a busy JS thread).
 *  - `rendered` keeps the Modal mounted through the fade-OUT, then unmounts once
 *    the exit animation finishes — guarded by `useIsMounted()` so the callback
 *    can't setState on an unmounted screen.
 *  - The effect returns `() => animation.stop()` so no animation outlives it.
 */
export interface AppDialogAnimationStyles {
  rendered: boolean;
  scrimStyle: { opacity: Animated.Value };
  cardStyle: {
    opacity: Animated.Value;
    transform: (
      | { scale: Animated.AnimatedInterpolation<number> }
      | { translateY: Animated.AnimatedInterpolation<number> }
    )[];
  };
}

const ENTER_MS = 220;
const EXIT_MS = 160;

export const useAppDialogAnimation = (
  visible: boolean,
): AppDialogAnimationStyles => {
  const isMounted = useIsMounted();
  const progress = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (visible) {
      setRendered(true);
      animation = Animated.timing(progress, {
        toValue: 1,
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
    } else {
      animation = Animated.timing(progress, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start(({ finished }) => {
        if (finished && isMounted()) {
          setRendered(false);
        }
      });
    }
    return () => animation.stop();
  }, [visible, progress, isMounted]);

  return useMemo(
    () => ({
      rendered,
      scrimStyle: { opacity: progress },
      cardStyle: {
        opacity: progress,
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.92, 1],
            }),
          },
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      },
    }),
    [rendered, progress],
  );
};
