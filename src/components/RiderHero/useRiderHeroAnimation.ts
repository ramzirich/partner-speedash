import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const puffStyle = (
  value: Animated.Value,
  driftX: number,
  riseY: number,
  peak: number,
) => ({
  opacity: value.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0, peak, peak * 0.45, 0],
  }),
  transform: [
    {
      translateX: value.interpolate({
        inputRange: [0, 1],
        outputRange: [0, driftX],
      }),
    },
    {
      translateY: value.interpolate({
        inputRange: [0, 1],
        outputRange: [0, riseY],
      }),
    },
    {
      scale: value.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 1.5],
      }),
    },
  ],
});

/** A speed line: fades in, streaks past, fades out. */
const streakStyle = (
  value: Animated.Value,
  from: number,
  to: number,
  peak: number,
) => ({
  opacity: value.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, peak, peak, 0],
  }),
  transform: [
    {
      translateX: value.interpolate({
        inputRange: [0, 1],
        outputRange: [from, to],
      }),
    },
  ],
});

export type RiderFacing = 'left' | 'right';

export type RiderTravel = 'enter' | 'loop' | 'bounce' | 'none';

/** Default pace of one crossing (`loop`/`bounce`) and of the ride-in (`enter`). */
const LOOP_MS = 4200;
const ENTER_MS = 950;

export interface RiderAnimationOptions {
  facing?: RiderFacing;
  travel?: RiderTravel;
  distance?: number;
  /** Overrides the duration of the active `travel` mode. */
  travelMs?: number;
}

export const useRiderHeroAnimation = ({
  facing = 'left',
  travel = 'enter',
  distance = 320,
  travelMs,
}: RiderAnimationOptions = {}) => {
  const dir = facing === 'left' ? 1 : -1;
  const startX = distance * dir;

  const bob = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const travelX = useRef(new Animated.Value(0)).current;
  const dash1 = useRef(new Animated.Value(0)).current;
  const dash2 = useRef(new Animated.Value(0)).current;
  const dash3 = useRef(new Animated.Value(0)).current;
  const puff1 = useRef(new Animated.Value(0)).current;
  const puff2 = useRef(new Animated.Value(0)).current;
  const puff3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 460,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    // The trailing `delay` holds the line at its end state (opacity 0) before
    // the loop resets it, so each line reappears on its own rhythm.
    const streak = (value: Animated.Value, duration: number, gap: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(gap),
        ]),
      );

    // A slow forward/back sway so the scooter never looks frozen once it has
    // arrived. Small on purpose — any bigger and it reads as sliding on ice.
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const leg = (toValue: number) =>
      Animated.timing(travelX, {
        toValue,
        duration: travelMs ?? LOOP_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });

    // `enter` runs once and stops; `loop` drives across forever; `bounce`
    // drives across, turns around, and comes back.
    const travelAnim =
      travel === 'bounce'
        ? // Ends where it started, so the loop's wrap is invisible.
          Animated.loop(Animated.sequence([leg(1), leg(2)]))
        : travel === 'loop'
        ? Animated.loop(
            Animated.timing(travelX, {
              toValue: 1,
              duration: travelMs ?? LOOP_MS,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          )
        : travel === 'enter'
        ? Animated.timing(travelX, {
            toValue: 1,
            duration: travelMs ?? ENTER_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        : null;

    const animations = [
      bobLoop,
      driftLoop,
      streak(dash1, 620, 180),
      streak(dash2, 780, 90),
      streak(dash3, 540, 260),
      // Same shape as the streaks, but slower and more staggered — dust hangs
      // in the air longer than a speed line does, and puffs shouldn't pulse in
      // time with each other.
      streak(puff1, 900, 160),
      streak(puff2, 1150, 60),
      streak(puff3, 760, 300),
      ...(travelAnim ? [travelAnim] : []),
    ];

    animations.forEach(anim => anim.start());

    return () => animations.forEach(anim => anim.stop());
  }, [
    bob,
    drift,
    travelX,
    dash1,
    dash2,
    dash3,
    puff1,
    puff2,
    puff3,
    travel,
    travelMs,
  ]);

  return useMemo(() => {
    const isBounce = travel === 'bounce';

    // `enter` comes to rest at 0; `loop` carries straight on out the far side;
    // `bounce` runs on a 0 → 1 → 2 clock, out to the far side and back.
    const travelInput = isBounce ? [0, 1, 2] : [0, 1];
    const travelOutput = isBounce
      ? [startX, -startX, startX]
      : travel === 'loop'
      ? [startX, -startX]
      : travel === 'enter'
      ? [startX, 0]
      : [0, 0];

    return {
      sprite: {
        // Two translateX entries compose additively: the ride-in (or traverse)
        // plus the idle sway on top of it.
        transform: [
          {
            translateX: travelX.interpolate({
              inputRange: travelInput,
              outputRange: travelOutput,
            }),
          },
          {
            translateX: drift.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -5 * dir],
            }),
          },
          {
            translateY: bob.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -8],
            }),
          },
          {
            rotate: bob.interpolate({
              inputRange: [0, 1],
              outputRange: ['0.4deg', '-0.9deg'],
            }),
          },
          {
            scaleX: travelX.interpolate({
              inputRange: isBounce ? [0, 1, 1.0001, 2] : [0, 1],
              outputRange: isBounce ? [1, 1, -1, -1] : [1, 1],
            }),
          },
        ],
      },

      // Stays on the ground while the sprite rides.
      shadow: {
        opacity: bob.interpolate({
          inputRange: [0, 1],
          outputRange: [0.18, 0.07],
        }),
        transform: [
          {
            scaleX: bob.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.86],
            }),
          },
        ],
      },

      line1: streakStyle(dash1, -26 * dir, 34 * dir, 0.85),
      line2: streakStyle(dash2, -18 * dir, 42 * dir, 0.65),
      line3: streakStyle(dash3, -22 * dir, 36 * dir, 0.75),

      puff1: puffStyle(puff1, 34 * dir, -16, 0.5),
      puff2: puffStyle(puff2, 46 * dir, -9, 0.38),
      puff3: puffStyle(puff3, 27 * dir, -22, 0.44),
    };
  }, [
    bob,
    drift,
    travelX,
    dash1,
    dash2,
    dash3,
    puff1,
    puff2,
    puff3,
    dir,
    travel,
    startX,
  ]);
};

export type RiderHeroAnimationStyles = ReturnType<typeof useRiderHeroAnimation>;
