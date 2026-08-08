import React, { memo, useMemo } from 'react';
import { Animated, Text } from 'react-native';
import { useInlineAlertAnimation } from './useInlineAlertAnimation';
import { styles } from './InlineAlert.styles';

export type InlineAlertTone = 'danger' | 'warning' | 'success';

export interface InlineAlertProps {
  message?: string;
  tone?: InlineAlertTone;
  testID?: string;
}

const InlineAlertComponent: React.FC<InlineAlertProps> = ({
  message = '',
  tone = 'danger',
  testID,
}) => {
  const { displayMessage, animatedStyle } = useInlineAlertAnimation(message);

  const containerStyle = useMemo(
    () => [
      styles.container,
      tone === 'danger' && styles.containerDanger,
      tone === 'warning' && styles.containerWarning,
      tone === 'success' && styles.containerSuccess,
      animatedStyle,
    ],
    [tone, animatedStyle],
  );

  const messageStyle = useMemo(
    () => [
      styles.message,
      tone === 'danger' && styles.messageDanger,
      tone === 'warning' && styles.messageWarning,
      tone === 'success' && styles.messageSuccess,
    ],
    [tone],
  );

  if (!displayMessage) {
    return null;
  }

  return (
    <Animated.View
      style={containerStyle}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID={testID}>
      <Text style={messageStyle}>{displayMessage}</Text>
    </Animated.View>
  );
};

export const InlineAlert = memo(InlineAlertComponent);
InlineAlert.displayName = 'InlineAlert';
