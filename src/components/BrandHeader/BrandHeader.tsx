import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { RiderHero } from '../RiderHero';
import { styles } from './BrandHeader.styles';

const RIDER_ARTWORK = require('../../assets/images/delivery1.jpg');

/** Sized to fill the 44×44 tap target without crowding it. */
const BACK_ICON_SIZE = 26;

export interface BrandHeaderProps {
  onBack?: () => void;
  testID?: string;
}

/**
 * Screen header carrying the SpeedDash mark: the landing rider, idling small,
 * beside the wordmark — plus an optional back chevron.
 *
 * The rider keeps bobbing (`travel="none"` still runs the idle loops), which is
 * what makes an inner screen feel like the same app as the animated landing
 * hero rather than a plain form someone bolted on.
 */
const BrandHeaderComponent: React.FC<BrandHeaderProps> = ({
  onBack,
  testID,
}) => (
  <View style={styles.header}>
    {onBack ? (
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
        testID={testID ? `${testID}-back` : undefined}>
        <Ionicons
          name="chevron-back"
          size={BACK_ICON_SIZE}
          color={colors.textPrimary}
        />
      </Pressable>
    ) : null}

    {/* One a11y node on purpose: a reader shouldn't announce the artwork and
        the wordmark as two separate things. */}
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="SpeedDash"
      style={styles.lockup}
      testID={testID}>
      <View style={styles.rider}>
        <RiderHero
          source={RIDER_ARTWORK}
          facing="left"
          travel="none"
          dropWhiteBackground
          showShadow={false}
        />
      </View>
      <Text style={styles.wordmark}>
        Speed<Text style={styles.wordmarkAccent}>Dash</Text>
      </Text>
    </View>
  </View>
);

export const BrandHeader = memo(BrandHeaderComponent);
BrandHeader.displayName = 'BrandHeader';
