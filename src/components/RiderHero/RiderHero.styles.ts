import { StyleSheet } from 'react-native';
import { radius } from '../../theme';

const SHADOW = '#000000';
const LINE = '#C2C6CD';
const DUST = '#CFC9BF';

export const styles = StyleSheet.create({
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spriteWrap: {
    flex: 1,
    width: '100%',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },

  spriteMultiply: {
    mixBlendMode: 'multiply',
  },

  shadow: {
    position: 'absolute',
    bottom: 0,
    width: '52%',
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: SHADOW,
  },

  // --- Speed lines (behind the sprite, trailing off its back) ---------------
  line: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: LINE,
  },
  // Sprite faces left → tail is on the right.
  lineRight1: { right: '1%', top: '40%', width: '15%' },
  lineRight2: { right: '0%', top: '54%', width: '19%' },
  lineRight3: { right: '4%', top: '67%', width: '12%' },
  // Sprite faces right → tail is on the left.
  lineLeft1: { left: '1%', top: '40%', width: '15%' },
  lineLeft2: { left: '0%', top: '54%', width: '19%' },
  lineLeft3: { left: '4%', top: '67%', width: '12%' },

  puff: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: DUST,
  },
  puffRight1: { right: '27%', bottom: '9%' },
  puffRight2: { right: '31%', bottom: '6%' },
  puffRight3: { right: '24%', bottom: '12%' },
  puffLeft1: { left: '27%', bottom: '9%' },
  puffLeft2: { left: '31%', bottom: '6%' },
  puffLeft3: { left: '24%', bottom: '12%' },
});
