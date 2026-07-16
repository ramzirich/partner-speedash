import React, { forwardRef, memo, useCallback, useState } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme';
import { styles } from './AppTextField.styles';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

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
      autoComplete = 'off',
      importantForAutofill = 'no',
      textContentType = 'none',
      autoCorrect = false,
      spellCheck = false,
      contextMenuHidden = true,
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
        <Text style={styles.label}>{label}</Text>
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
            autoComplete={autoComplete}
            importantForAutofill={importantForAutofill}
            textContentType={textContentType}
            autoCorrect={autoCorrect}
            spellCheck={spellCheck}
            contextMenuHidden={contextMenuHidden}
            {...rest}
          />
          {secureTextEntry ? (
            <TouchableOpacity
              onPress={toggleHidden}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              style={styles.toggle}>
              <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
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
