import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CountUp } from '../CountUp';
import { styles } from './StatCard.styles';

const ICON_SIZE = 14;

export interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  color: string;
  tint?: string;
  animate?: boolean;
  animationDelayMs?: number;
  testID?: string;
}

const StatCardComponent: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  tint,
  animate = false,
  animationDelayMs = 0,
  testID,
}) => {
  const cardStyle = useMemo(
    () =>
      tint
        ? [styles.card, styles.cardTinted, { backgroundColor: tint }]
        : styles.card,
    [tint],
  );
  const valueStyle = useMemo(() => [styles.value, { color }], [color]);

  return (
    <View
      style={cardStyle}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}`}
      testID={testID}>
      {animate && typeof value === 'number' ? (
        <CountUp
          value={value}
          delayMs={animationDelayMs}
          style={valueStyle}
          numberOfLines={1}
        />
      ) : (
        <Text style={valueStyle} numberOfLines={1}>
          {value}
        </Text>
      )}
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={ICON_SIZE} color={color} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
};

export const StatCard = memo(StatCardComponent);
StatCard.displayName = 'StatCard';
