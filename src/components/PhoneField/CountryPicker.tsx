import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { COUNTRIES, Country, searchCountries } from '../../data';
import { COUNTRY_ROW_HEIGHT, styles } from './PhoneField.styles';

const ICON_SIZE = 18;

/** Makes the sheet a responder so a tap inside it never reaches the scrim. */
const swallowPress = (): void => {};

interface CountryRowProps {
  country: Country;
  selected: boolean;
  onPress: (country: Country) => void;
  testID?: string;
}

const CountryRowComponent: React.FC<CountryRowProps> = ({
  country,
  selected,
  onPress,
  testID,
}) => {
  const handlePress = useCallback(() => onPress(country), [onPress, country]);

  const rowStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      styles.row,
      selected && styles.rowSelected,
      pressed && styles.rowPressed,
    ],
    [selected],
  );

  return (
    <Pressable
      style={rowStyle}
      onPress={handlePress}
      accessibilityRole="menuitem"
      accessibilityLabel={`${country.name} ${country.dialCode}`}
      accessibilityState={{ selected }}
      testID={testID}>
      <Text style={styles.rowFlag}>{country.flag}</Text>
      <Text
        style={selected ? [styles.rowName, styles.rowNameSelected] : styles.rowName}
        numberOfLines={1}>
        {country.name}
      </Text>
      <Text style={styles.rowDial}>{country.dialCode}</Text>
      {selected ? (
        <Ionicons name="checkmark" size={ICON_SIZE} color={colors.primary} />
      ) : null}
    </Pressable>
  );
};

const CountryRow = memo(CountryRowComponent);
CountryRow.displayName = 'CountryRow';

export interface CountryPickerProps {
  visible: boolean;
  /** ISO code of the country currently on the field. */
  selectedCode: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
  testID?: string;
}

/**
 * Bottom-sheet country picker with an autocomplete box on top: type a name, an
 * ISO code or a dial code and the list narrows as you go.
 */
const CountryPickerComponent: React.FC<CountryPickerProps> = ({
  visible,
  selectedCode,
  onSelect,
  onClose,
  testID = 'country-picker',
}) => {
  const [query, setQuery] = useState('');

  // A reopened sheet starts from the full list, not from the last search.
  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const results = useMemo(
    () => (query ? searchCountries(query) : COUNTRIES),
    [query],
  );

  const handleSelect = useCallback(
    (country: Country) => {
      onSelect(country);
      onClose();
    },
    [onSelect, onClose],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Country>) => (
      <CountryRow
        country={item}
        selected={item.code === selectedCode}
        onPress={handleSelect}
        testID={`${testID}-${item.code}`}
      />
    ),
    [selectedCode, handleSelect, testID],
  );

  const keyExtractor = useCallback((item: Country) => item.code, []);

  // Rows are a fixed height, so the list can place them without measuring —
  // this is what keeps scrolling ~240 rows smooth on a low-end Android.
  const getItemLayout = useCallback(
    (_: ArrayLike<Country> | null | undefined, index: number) => ({
      length: COUNTRY_ROW_HEIGHT,
      offset: COUNTRY_ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const clearQuery = useCallback(() => setQuery(''), []);

  const data = useMemo(() => results as Country[], [results]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Tapping the dimmed area behind the sheet dismisses it. */}
      <Pressable style={styles.scrim} onPress={onClose} accessible={false}>
        <Pressable
          style={styles.sheet}
          accessibilityViewIsModal
          testID={testID}
          onPress={swallowPress}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Select country</Text>

          <View style={styles.search}>
            <Ionicons
              name="search"
              size={ICON_SIZE}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Country or code"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search countries"
              testID={`${testID}-search`}
            />
            {query ? (
              <Pressable
                onPress={clearQuery}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <Ionicons
                  name="close-circle"
                  size={ICON_SIZE}
                  color={colors.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            style={styles.list}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            windowSize={9}
            ListEmptyComponent={
              <Text style={styles.empty}>No country matches "{query}".</Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const CountryPicker = memo(CountryPickerComponent);
CountryPicker.displayName = 'CountryPicker';
