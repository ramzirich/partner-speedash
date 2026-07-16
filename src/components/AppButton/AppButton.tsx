import React, { memo, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme';
import { styles } from './AppButton.styles';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Optional leading element (e.g. an icon). */
  leading?: React.ReactNode;
  testID?: string;
}

/**
 * Reusable, themeable button.
 *
 * - `memo` so it doesn't re-render when an unrelated parent state changes.
 * - Spinner state is mutually exclusive with the label and blocks presses.
 * - Fully accessible (role, state, disabled hint).
 */
const AppButtonComponent: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  leading,
  testID,
}) => {
  const isInteractive = !disabled && !loading;

  const containerStyle = useMemo(
    () =>
      (state: PressableStateCallbackType): StyleProp<ViewStyle> => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        state.pressed && isInteractive && styles.pressed,
        !isInteractive && styles.disabled,
      ],
    [variant, fullWidth, isInteractive],
  );

  const labelStyle = [
    styles.label,
    variant === 'primary' && styles.labelPrimary,
    variant === 'secondary' && styles.labelSecondary,
    variant === 'ghost' && styles.labelGhost,
    variant === 'danger' && styles.labelDanger,
  ];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!isInteractive}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={containerStyle}>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? colors.textOnPrimary
              : colors.primary
          }
        />
      ) : (
        <>
          {leading ? <View>{leading}</View> : null}
          <Text style={labelStyle} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

export const AppButton = memo(AppButtonComponent);
AppButton.displayName = 'AppButton';
