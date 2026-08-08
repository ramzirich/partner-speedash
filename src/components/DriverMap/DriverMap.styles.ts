import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

/** Styles for <DriverMap>. Separate file per convention. */
export const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
