import { StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

export const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  blob: {
    position: 'absolute',
    right: '-30%',
    top: '-12%',
    width: '86%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryWash,
  },
  blobSoft: {
    position: 'absolute',
    left: '-28%',
    top: '4%',
    width: '62%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryWashSoft,
  },
  accent: {
    position: 'absolute',
    right: '6%',
    top: '28%',
    width: '26%',
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
  },
});
