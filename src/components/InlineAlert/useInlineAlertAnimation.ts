import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useIsMounted } from '../../hooks/useIsMounted';

const ENTER_MS = 240;
const EXIT_MS = 180;
const RISE_PX = 6;

export interface InlineAlertAnimation {
  /** Text to render — outlives `message` for the duration of the fade-out. */
  displayMessage: string;
  animatedStyle: {
    opacity: Animated.Value;
    transform: { translateY: Animated.AnimatedInterpolation<number> }[];
  };
}

export const useInlineAlertAnimation = (
  message: string,
): InlineAlertAnimation => {
  const isMounted = useIsMounted();
  const progress = useRef(new Animated.Value(0)).current;
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
    }
  }, [message]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    if (message) {
      progress.setValue(0);
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
          setDisplayMessage('');
        }
      });
    }
    return () => animation.stop();
  }, [message, progress, isMounted]);

  return useMemo(
    () => ({
      displayMessage,
      animatedStyle: {
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-RISE_PX, 0],
            }),
          },
        ],
      },
    }),
    [displayMessage, progress],
  );
};
