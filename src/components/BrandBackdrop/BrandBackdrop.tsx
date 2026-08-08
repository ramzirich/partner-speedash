import React, { memo } from 'react';
import { View } from 'react-native';
import { styles } from './BrandBackdrop.styles';

const BrandBackdropComponent: React.FC = () => (
  <View pointerEvents="none" style={styles.backdrop}>
    <View style={styles.blob} />
    <View style={styles.blobSoft} />
    <View style={styles.accent} />
  </View>
);

export const BrandBackdrop = memo(BrandBackdropComponent);
BrandBackdrop.displayName = 'BrandBackdrop';
