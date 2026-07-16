import React, { memo } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';
import { useRiderAnimation } from './useRiderAnimation';
import { styles } from './RiderAnimation.styles';

export interface RiderAnimationProps {
  style?: StyleProp<ViewStyle>;
}

/** A single spinning wheel (tire + cross-spokes + hub). */
const Wheel: React.FC<{
  position: StyleProp<ViewStyle>;
  rotate: Animated.AnimatedInterpolation<string>;
}> = ({ position, rotate }) => (
  <Animated.View style={[styles.wheel, position, { transform: [{ rotate }] }]}>
    <View style={styles.spokeV} />
    <View style={styles.spokeH} />
    <View style={styles.hub} />
  </Animated.View>
);

/**
 * Cute, fully custom delivery-rider animation — no images, no native deps.
 * Built from Views + the Animated API. Reuse anywhere (landing, empty states,
 * loading screens).
 */
const RiderAnimationComponent: React.FC<RiderAnimationProps> = ({ style }) => {
  const a = useRiderAnimation();

  // Each speed-line shares the `dash` clock but travels its own distance and
  // fades in/out so it reads as motion rather than a sliding bar.
  const lineMotion = (from: number, to: number, peak: number) => ({
    opacity: a.dash.interpolate({
      inputRange: [0, 0.25, 0.75, 1],
      outputRange: [0, peak, peak, 0],
    }),
    transform: [
      {
        translateX: a.dash.interpolate({
          inputRange: [0, 1],
          outputRange: [from, to],
        }),
      },
    ],
  });

  return (
    <View style={[styles.art, style]}>
      {/* Ground shadow — squashes as the scooter lifts. */}
      <Animated.View
        style={[
          styles.shadow,
          {
            opacity: a.shadowOpacity,
            transform: [{ scaleX: a.shadowScaleX }],
          },
        ]}
      />

      {/* Speed lines (don't bob with the scooter). */}
      <Animated.View style={[styles.line, styles.line1, lineMotion(28, -28, 0.9)]} />
      <Animated.View style={[styles.line, styles.line2, lineMotion(22, -36, 0.7)]} />
      <Animated.View style={[styles.line, styles.line3, lineMotion(26, -30, 0.8)]} />

      {/* The scooter + rider, gently bobbing as one. */}
      <Animated.View
        style={[styles.group, { transform: [{ translateY: a.translateY }] }]}>
        <Wheel position={styles.wheelBack} rotate={a.rotate} />
        <Wheel position={styles.wheelFront} rotate={a.rotate} />
        <View style={styles.deck} />
        <View style={styles.frontPost} />
        <View style={styles.box} />
        <View style={styles.boxStripe} />
        <View style={styles.seat} />
        <View style={styles.riderBody} />
        <View style={styles.riderArm} />
        <View style={styles.head} />
        <View style={styles.helmet} />
        <View style={styles.handlebar} />
        <View style={styles.headlight} />
      </Animated.View>
    </View>
  );
};

export const RiderAnimation = memo(RiderAnimationComponent);
RiderAnimation.displayName = 'RiderAnimation';
