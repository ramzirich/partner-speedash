import React, { memo } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useCountUp } from './useCountUp';

export interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delayMs?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
  testID?: string;
}

const CountUpComponent: React.FC<CountUpProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  delayMs = 0,
  style,
  numberOfLines,
  accessibilityLabel,
  testID,
}) => {
  const display = useCountUp(value, decimals, delayMs);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
      testID={testID}>
      {`${prefix}${display}${suffix}`}
    </Text>
  );
};

export const CountUp = memo(CountUpComponent);
CountUp.displayName = 'CountUp';
