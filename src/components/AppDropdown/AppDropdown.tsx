import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { useAppDropdownAnimation } from './useAppDropdownAnimation';
import { styles } from './AppDropdown.styles';

export type AppDropdownTone = 'default' | 'success' | 'danger';

export interface AppDropdownOption {
  value: string;
  label: string;
  tone?: AppDropdownTone;
  /** Listed for context but not choosable — e.g. the state you are already in. */
  disabled?: boolean;
}

export interface AppDropdownProps {
  options: readonly AppDropdownOption[];
  value?: string | null;
  placeholder: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const CHEVRON_SIZE = 16;

const TONE_LABEL: Record<AppDropdownTone, StyleProp<TextStyle>> = {
  default: null,
  success: styles.optionLabelSuccess,
  danger: styles.optionLabelDanger,
};

const TONE_DOT: Record<AppDropdownTone, StyleProp<ViewStyle>> = {
  default: null,
  success: styles.dotSuccess,
  danger: styles.dotDanger,
};

interface OptionRowProps {
  option: AppDropdownOption;
  selected: boolean;
  first: boolean;
  onPress: (value: string) => void;
  testID?: string;
}

const OptionRowComponent: React.FC<OptionRowProps> = ({
  option,
  selected,
  first,
  onPress,
  testID,
}) => {
  const tone = option.tone ?? 'default';
  const disabled = option.disabled ?? false;

  const handlePress = useCallback(
    () => onPress(option.value),
    [onPress, option.value],
  );

  const rowStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      styles.option,
      !first && styles.optionDivider,
      selected && styles.optionSelected,
      disabled && styles.optionDisabled,
      pressed && styles.pressed,
    ],
    [first, selected, disabled],
  );

  const dotStyle = useMemo(() => [styles.dot, TONE_DOT[tone]], [tone]);
  const labelStyle = useMemo(
    () => [styles.optionLabel, TONE_LABEL[tone]],
    [tone],
  );

  return (
    <Pressable
      style={rowStyle}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="menuitem"
      accessibilityLabel={option.label}
      accessibilityState={{ selected, disabled }}
      hitSlop={4}
      testID={testID}>
      <View style={dotStyle} />
      <Text style={labelStyle}>{option.label}</Text>
      {selected ? (
        <Ionicons
          name="checkmark"
          size={CHEVRON_SIZE}
          color={colors.textSecondary}
        />
      ) : null}
    </Pressable>
  );
};

const OptionRow = memo(OptionRowComponent);
OptionRow.displayName = 'AppDropdownOption';

const AppDropdownComponent: React.FC<AppDropdownProps> = ({
  options,
  value = null,
  placeholder,
  onSelect,
  disabled = false,
  accessibilityLabel,
  testID = 'app-dropdown',
}) => {
  const [open, setOpen] = useState(false);
  const animated = useAppDropdownAnimation(open);

  const selected = useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value],
  );

  const handleToggle = useCallback(() => setOpen(prev => !prev), []);

  const handleSelect = useCallback(
    (next: string) => {
      setOpen(false);
      onSelect(next);
    },
    [onSelect],
  );

  const triggerStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      styles.trigger,
      open && styles.triggerOpen,
      disabled && styles.triggerDisabled,
      pressed && styles.pressed,
    ],
    [open, disabled],
  );

  const triggerLabelStyle = useMemo(
    () => [styles.triggerLabel, selected && styles.triggerLabelSelected],
    [selected],
  );

  const panelStyle = useMemo(
    () => [styles.panel, animated.panel],
    [animated.panel],
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={triggerStyle}
        onPress={handleToggle}
        disabled={disabled}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityState={{ expanded: open, disabled }}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        testID={testID}>
        <Text style={triggerLabelStyle} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Animated.View style={animated.chevron}>
          <Ionicons
            name="chevron-down"
            size={CHEVRON_SIZE}
            color={open ? colors.primary : colors.textSecondary}
          />
        </Animated.View>
      </Pressable>

      {open ? (
        <Animated.View style={panelStyle} accessibilityRole="menu">
          {options.map((option, index) => (
            <OptionRow
              key={option.value}
              option={option}
              selected={option.value === value}
              first={index === 0}
              onPress={handleSelect}
              testID={`${testID}-${option.value}`}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
};

export const AppDropdown = memo(AppDropdownComponent);
AppDropdown.displayName = 'AppDropdown';
