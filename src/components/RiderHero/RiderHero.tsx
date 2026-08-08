import React, { memo, useMemo } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {
  RiderFacing,
  RiderTravel,
  useRiderHeroAnimation,
} from './useRiderHeroAnimation';
import { styles } from './RiderHero.styles';

/** Speed-line placement, mirrored to sit behind the sprite either way. */
const LINE_STYLES: Record<
  RiderFacing,
  [ViewStyle, ViewStyle, ViewStyle]
> = {
  left: [styles.lineRight1, styles.lineRight2, styles.lineRight3],
  right: [styles.lineLeft1, styles.lineLeft2, styles.lineLeft3],
};

/** Dust-puff placement, mirrored onto whichever side the back wheel is. */
const PUFF_STYLES: Record<
  RiderFacing,
  [ViewStyle, ViewStyle, ViewStyle]
> = {
  left: [styles.puffRight1, styles.puffRight2, styles.puffRight3],
  right: [styles.puffLeft1, styles.puffLeft2, styles.puffLeft3],
};

export interface RiderHeroProps {
  /** Bundled artwork, e.g. `require('../../assets/images/rider.png')`. */
  source: ImageSourcePropType;
  /**
   * Which way the scooter points. Decides which side the speed lines trail on
   * and which way they travel. Defaults to 'left'.
   */
  facing?: RiderFacing;
  /**
   * How the sprite travels: `enter` rides in once from off-stage (default),
   * `loop` drives across and repeats, `bounce` drives across and comes back
   * (flipping to face the way it's going), `none` holds position. In every
   * mode it keeps bobbing and swaying, so it's never completely still.
   */
  travel?: RiderTravel;
  travelDistance?: number;
  travelMs?: number;

  showSpeedLines?: boolean;
  showDust?: boolean;
  dropWhiteBackground?: boolean;
  showShadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

const RiderHeroComponent: React.FC<RiderHeroProps> = ({
  source,
  facing = 'left',
  travel = 'enter',
  travelDistance,
  travelMs,
  showSpeedLines = false,
  showDust = false,
  dropWhiteBackground = false,
  showShadow = true,
  style,
}) => {
  // Read live (not a captured Dimensions call) so the ride-in still starts
  // fully off-stage after a rotation.
  const { width } = useWindowDimensions();

  const a = useRiderHeroAnimation({
    facing,
    travel,
    distance: travelDistance ?? width,
    travelMs,
  });

  const stageStyle = useMemo(() => [styles.stage, style], [style]);
  const lines = LINE_STYLES[facing];
  const puffs = PUFF_STYLES[facing];

  const wrapStyle = useMemo(
    () =>
      dropWhiteBackground
        ? [styles.spriteWrap, styles.spriteMultiply, a.sprite]
        : [styles.spriteWrap, a.sprite],
    [dropWhiteBackground, a.sprite],
  );

  return (
    <View
      style={stageStyle}
      accessibilityRole="image"
      accessibilityLabel="A delivery rider on a scooter">
      {showShadow ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.shadow, a.shadow]}
        />
      ) : null}

      <Animated.View style={wrapStyle}>
        {showSpeedLines ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[styles.line, lines[0], a.line1]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.line, lines[1], a.line2]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.line, lines[2], a.line3]}
            />
          </>
        ) : null}

        {showDust ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[styles.puff, puffs[0], a.puff1]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.puff, puffs[1], a.puff2]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.puff, puffs[2], a.puff3]}
            />
          </>
        ) : null}

        <Image source={source} resizeMode="contain" style={styles.sprite} />
      </Animated.View>
    </View>
  );
};

export const RiderHero = memo(RiderHeroComponent);
RiderHero.displayName = 'RiderHero';
