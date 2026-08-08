import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme';
import { styles } from './ValueStrip.styles';

const ICON_SIZE = 18;

export interface ValueStripItem {
  key: string;
  icon: string;
  label: string;
}

export interface ValueStripProps {
  items: ValueStripItem[];
}

interface ValueStripCellProps {
  icon: string;
  label: string;
}

const ValueStripCellComponent: React.FC<ValueStripCellProps> = ({
  icon,
  label,
}) => (
  <View style={styles.cell} accessible accessibilityLabel={label}>
    <View style={styles.badge}>
      <Ionicons name={icon} size={ICON_SIZE} color={colors.primary} />
    </View>
    <Text style={styles.label} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const ValueStripCell = memo(ValueStripCellComponent);
ValueStripCell.displayName = 'ValueStripCell';

const ValueStripComponent: React.FC<ValueStripProps> = ({ items }) => (
  <View style={styles.row}>
    {items.map(item => (
      <ValueStripCell key={item.key} icon={item.icon} label={item.label} />
    ))}
  </View>
);

export const ValueStrip = memo(ValueStripComponent);
ValueStrip.displayName = 'ValueStrip';
