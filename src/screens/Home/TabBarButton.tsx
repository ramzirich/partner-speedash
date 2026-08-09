import React, { memo, useCallback, useMemo } from 'react';
import {
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import type { ContentKey } from './types';
import { styles } from './TabBarButton.styles';

const ICON_SIZE = 22;
/** Anything past this is shown as "9+" so the badge keeps its shape. */
const BADGE_MAX = 9;

export interface TabBarButtonProps {
  tabKey: ContentKey;
  label: string;
  icon: string;
  iconActive: string;
  active: boolean;
  /** Count to badge the icon with. 0 hides it. */
  badge?: number;
  onPress: (key: ContentKey) => void;
}

const TabBarButtonComponent: React.FC<TabBarButtonProps> = ({
  tabKey,
  label,
  icon,
  iconActive,
  active,
  badge = 0,
  onPress,
}) => {
  const handlePress = useCallback(() => onPress(tabKey), [onPress, tabKey]);

  const containerStyle = useMemo(
    () =>
      (state: PressableStateCallbackType): StyleProp<ViewStyle> =>
        [styles.tab, state.pressed && styles.pressed],
    [],
  );

  const labelStyle = useMemo(
    () => [styles.label, active ? styles.labelActive : null],
    [active],
  );

  return (
    <Pressable
      style={containerStyle}
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      accessibilityValue={badge > 0 ? { text: `${badge} pending` } : undefined}
      testID={`tab-${tabKey}`}
    >
      <View style={styles.iconSlot}>
        <View style={styles.iconBox}>
          <Ionicons
            name={active ? iconActive : icon}
            size={ICON_SIZE}
            color={active ? colors.primary : colors.textSecondary}
          />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > BADGE_MAX ? `${BADGE_MAX}+` : badge}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={labelStyle} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

export const TabBarButton = memo(TabBarButtonComponent);
TabBarButton.displayName = 'TabBarButton';
