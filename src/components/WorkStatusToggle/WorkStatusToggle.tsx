import React, { memo, useCallback } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { isOnline } from '../../api';
import type { WorkStatus } from '../../api';
import { useWorkStatusToggleAnimation } from './useWorkStatusToggleAnimation';
import { styles } from './WorkStatusToggle.styles';

export interface WorkStatusToggleProps {
  status: WorkStatus;
  pending?: boolean;
  onChange: (online: boolean) => void;
  testID?: string;
}

const LABELS: Record<WorkStatus, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
};

const WorkStatusToggleComponent: React.FC<WorkStatusToggleProps> = ({
  status,
  pending = false,
  onChange,
  testID = 'work-status-toggle',
}) => {
  const online = isOnline(status);
  const thumbStyle = useWorkStatusToggleAnimation(online);

  const handlePress = useCallback(() => onChange(!online), [online, onChange]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pending && styles.pending,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={pending}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel="Work status"
      accessibilityValue={{ text: LABELS[status] }}
      accessibilityState={{ checked: online, disabled: pending, busy: pending }}
      testID={testID}
    >
      <Text
        style={[styles.label, online ? styles.labelOnline : styles.labelBusy]}
      >
        {LABELS[status]}
      </Text>
      <Animated.View
        style={[styles.track, online ? styles.trackOnline : styles.trackBusy]}
      >
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

export const WorkStatusToggle = memo(WorkStatusToggleComponent);
WorkStatusToggle.displayName = 'WorkStatusToggle';
