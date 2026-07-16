import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from './OtpInput.styles';

export interface OtpInputProps {
  value: string;
  onChangeText: (next: string) => void;
  length: number;
  onComplete?: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
  testID?: string;
}

const OtpInputComponent: React.FC<OtpInputProps> = ({
  value,
  onChangeText,
  length,
  onComplete,
  error = false,
  autoFocus = false,
  testID,
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, length);
      onChangeText(digits);
      if (digits.length === length) {
        onComplete?.(digits);
      }
    },
    [length, onChangeText, onComplete],
  );

  const focus = useCallback(() => inputRef.current?.focus(), []);

  const cells = useMemo(
    () => Array.from({ length }, (_, i) => i),
    [length],
  );

  return (
    <Pressable style={styles.wrapper} onPress={focus} accessibilityRole="none">
      <View style={styles.row}>
        {cells.map(i => {
          const char = value[i] ?? '';
          const isActive = i === value.length;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                char !== '' && styles.cellFilled,
                isActive && styles.cellActive,
                error && styles.cellError,
              ]}>
              <Text style={styles.cellText}>{char}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        accessibilityLabel="One-time code"
        testID={testID}
      />
    </Pressable>
  );
};

export const OtpInput = memo(OtpInputComponent);
OtpInput.displayName = 'OtpInput';
