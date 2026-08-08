import React, { memo, useMemo } from 'react';
import { Animated, Text, View } from 'react-native';
import { useLiveBadgeAnimation } from './useLiveBadgeAnimation';
import { styles } from './LiveBadge.styles';

export interface LiveBadgeProps {
  active: boolean;
  activeLabel?: string;
  idleLabel?: string;
  testID?: string;
}

const LiveBadgeComponent: React.FC<LiveBadgeProps> = ({
  active,
  activeLabel = 'Live',
  idleLabel = 'Locating…',
  testID = 'live-badge',
}) => {
  const haloAnimatedStyle = useLiveBadgeAnimation(active);
  const label = active ? activeLabel : idleLabel;

  const dotStyle = useMemo(
    () => [styles.dot, active ? styles.dotLive : styles.dotIdle],
    [active],
  );
  const haloStyle = useMemo(
    () => [styles.halo, styles.dotLive, haloAnimatedStyle],
    [haloAnimatedStyle],
  );
  const labelStyle = useMemo(
    () => [styles.label, active ? styles.labelLive : styles.labelIdle],
    [active],
  );

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      testID={testID}>
      <View style={styles.dotWrap}>
        {active ? <Animated.View style={haloStyle} /> : null}
        <View style={dotStyle} />
      </View>
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

export const LiveBadge = memo(LiveBadgeComponent);
LiveBadge.displayName = 'LiveBadge';
