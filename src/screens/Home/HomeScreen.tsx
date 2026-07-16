import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenProps } from '../../navigation';
import { styles } from './HomeScreen.styles';

const HomeScreenComponent: React.FC<ScreenProps<'Home'>> = () => (
  <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
    <View style={styles.content}>
      <Text>home</Text>
    </View>
  </SafeAreaView>
);

export const HomeScreen = React.memo(HomeScreenComponent);
HomeScreen.displayName = 'HomeScreen';
