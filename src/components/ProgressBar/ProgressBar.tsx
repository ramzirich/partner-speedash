import React, { memo, useCallback, useMemo, useState } from 'react';
import { Animated, LayoutChangeEvent, View } from 'react-native';
import { colors } from '../../theme';
import { clamp01, useProgressBarAnimation } from './useProgressBarAnimation';
import { styles } from './ProgressBar.styles';

export interface ProgressBarProps {
  progress: number;
  color?: string;
  /** Override the fill duration so it lands with a counter alongside it. */
  durationMs?: number;
  accessibilityLabel?: string;
  testID?: string;
}

const ProgressBarComponent: React.FC<ProgressBarProps> = ({
  progress,
  color = colors.primary,
  durationMs,
  accessibilityLabel,
  testID = 'progress-bar',
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedStyle = useProgressBarAnimation(
    progress,
    trackWidth,
    durationMs,
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width),
    [],
  );

  const fillStyle = useMemo(
    () => [styles.fill, { backgroundColor: color }, animatedStyle],
    [color, animatedStyle],
  );

  const percent = Math.round(clamp01(progress) * 100);

  return (
    <View
      style={styles.track}
      onLayout={handleLayout}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      testID={testID}>
      {trackWidth > 0 ? <Animated.View style={fillStyle} /> : null}
    </View>
  );
};

export const ProgressBar = memo(ProgressBarComponent);
ProgressBar.displayName = 'ProgressBar';
