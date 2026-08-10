import React, { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  Text,
  TextInput,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppTextField, AppTextFieldProps } from '../AppTextField';
import { colors } from '../../theme';
import { Country, getCountry } from '../../data';
import {
  digitsOnly,
  isCompleteNationalNumber,
  toE164,
  toNationalDigits,
} from '../../utils/phone';
import { CountryPicker } from './CountryPicker';
import { styles } from './PhoneField.styles';

const CHEVRON_SIZE = 14;

export interface CompletePhone {
  national: string;
  e164: string;
  country: Country;
}

export interface PhoneFieldProps
  extends Omit<AppTextFieldProps, 'leading' | 'secureTextEntry'> {
  /** ISO 3166-1 alpha-2 code of the selected country. */
  countryCode: string;
  onCountryChange: (country: Country) => void;
  onComplete?: (phone: CompletePhone) => void;
}

/**
 * Phone input with the country's flag and dial code attached to its left.
 *
 * `value` is the **national** number only — the dial code lives in
 * `countryCode`, so the caller joins the two itself (see `toE164`). Keeping
 * them apart means changing the country never has to rewrite what was typed.
 *
 * Country selection opens a searchable sheet; it defaults to Lebanon via
 * `DEFAULT_COUNTRY_CODE` in the country data.
 */
const PhoneFieldComponent = forwardRef<TextInput, PhoneFieldProps>(
  (
    {
      countryCode,
      onCountryChange,
      onComplete,
      value = '',
      onChangeText,
      keyboardType = 'phone-pad',
      autoCapitalize = 'none',
      testID,
      ...rest
    },
    ref,
  ) => {
    const [pickerOpen, setPickerOpen] = useState(false);

    const country = getCountry(countryCode);

    const openPicker = useCallback(() => setPickerOpen(true), []);
    const closePicker = useCallback(() => setPickerOpen(false), []);

    const reportComplete = useCallback(
      (national: string, target: Country) => {
        onComplete?.({
          national: toNationalDigits(national),
          e164: toE164(target.dialCode, national),
          country: target,
        });
      },
      [onComplete],
    );

    const handleChangeText = useCallback(
      (next: string) => {
        onChangeText?.(next);
        if (
          digitsOnly(next) !== digitsOnly(value) &&
          isCompleteNationalNumber(next, country)
        ) {
          reportComplete(next, country);
        }
      },
      [onChangeText, value, country, reportComplete],
    );

    const handleCountrySelect = useCallback(
      (next: Country) => {
        onCountryChange(next);
        if (
          next.code !== country.code &&
          isCompleteNationalNumber(value, next)
        ) {
          reportComplete(value, next);
        }
      },
      [onCountryChange, country, value, reportComplete],
    );

    const triggerStyle = useCallback(
      ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
        styles.trigger,
        pressed && styles.triggerPressed,
      ],
      [],
    );

    // AppTextField is memoized — building this inline would hand it a new
    // element on every keystroke and defeat that.
    const leading = useMemo(
      () => (
        <Pressable
          style={triggerStyle}
          onPress={openPicker}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Country code, ${country.name} ${country.dialCode}`}
          accessibilityState={{ expanded: pickerOpen }}
          testID={testID ? `${testID}-country` : 'phone-field-country'}
        >
          <Text style={styles.triggerFlag}>{country.flag}</Text>
          <Text style={styles.triggerDial}>{country.dialCode}</Text>
          <Ionicons
            name="chevron-down"
            size={CHEVRON_SIZE}
            color={colors.textSecondary}
          />
        </Pressable>
      ),
      [country, pickerOpen, openPicker, triggerStyle, testID],
    );

    return (
      <>
        <AppTextField
          ref={ref}
          leading={leading}
          value={value}
          onChangeText={handleChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          testID={testID}
          {...rest}
        />
        <CountryPicker
          visible={pickerOpen}
          selectedCode={country.code}
          onSelect={handleCountrySelect}
          onClose={closePicker}
          testID={testID ? `${testID}-picker` : undefined}
        />
      </>
    );
  },
);

export const PhoneField = memo(PhoneFieldComponent);
PhoneField.displayName = 'PhoneField';
