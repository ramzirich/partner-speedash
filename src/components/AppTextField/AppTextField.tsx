import React, { forwardRef, memo, useCallback, useState } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { styles } from './AppTextField.styles';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

const TOGGLE_ICON_SIZE = 20;

export interface AppTextFieldProps
  extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
  leading?: React.ReactNode;
}

/**
 * Reusable form input used by every auth screen (email, password, etc.).
 *
 * - `memo` + `forwardRef` so parents can focus the next field on submit without
 *   forcing re-renders.
 * - Focus state is local; it never bubbles up to the screen, so typing in one
 *   field doesn't re-render siblings.
 * - Manages its own password show/hide so screens stay declarative.
 * - Autofill semantics (`autoComplete`, `textContentType`,
 *   `importantForAutofill`) are declared by the **call site**, not defaulted
 *   here: only the screen knows whether a field is an email, a current
 *   password, or a one-time code. Defaulting them off app-wide silently broke
 *   Keychain/Google autofill on every auth screen. Likewise the paste menu
 *   stays enabled (RN default) so password-manager users can paste — pass
 *   `contextMenuHidden` explicitly on the rare field that must block it.
 */
const AppTextFieldComponent = forwardRef<TextInput, AppTextFieldProps>(
  (
    {
      label,
      error,
      secureTextEntry = false,
      leading,
      onFocus,
      onBlur,
      autoCorrect = false,
      spellCheck = false,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(secureTextEntry);

    const handleFocus = useCallback<FocusHandler>(
      e => {
        setFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback<BlurHandler>(
      e => {
        setFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    const toggleHidden = useCallback(() => setHidden(prev => !prev), []);

    const hasError = Boolean(error);

    return (
      <View style={styles.container}>
        <Text
          style={[
            styles.label,
            focused && styles.labelFocused,
            hasError && styles.labelError,
          ]}>
          {label}
        </Text>
        <View
          style={[
            styles.field,
            focused && styles.fieldFocused,
            hasError && styles.fieldError,
          ]}>
          {leading}
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={hidden}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={label}
            autoCorrect={autoCorrect}
            spellCheck={spellCheck}
            {...rest}
          />
          {secureTextEntry ? (
            <TouchableOpacity
              onPress={toggleHidden}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              style={styles.toggle}>
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={TOGGLE_ICON_SIZE}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  },
);

export const AppTextField = memo(AppTextFieldComponent);
AppTextField.displayName = 'AppTextField';
