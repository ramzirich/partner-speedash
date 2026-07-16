import { StyleSheet } from 'react-native';

/**
 * Flat-design delivery scooter, drawn entirely from Views and positioned
 * absolutely inside a fixed 240x150 art box (so it looks identical on every
 * screen width). Kept in a separate file per the project convention.
 */

// Illustration palette (local to the art — not theme tokens).
const RED = '#E53935';
const RED_DARK = '#C62828';
const ORANGE = '#FF6B00';
const ORANGE_DARK = '#D65A00';
const BLUE = '#1E5FA8';
const SKIN = '#F3C49B';
const TIRE = '#2B2B33';
const HUB = '#EDEFF2';
const SPOKE = '#9AA0AB';
const DARK = '#37373C';
const YELLOW = '#FFD15A';
const LINE = '#C2C6CD';

export const styles = StyleSheet.create({
  art: {
    width: 240,
    height: 150,
    alignSelf: 'center',
  },
  group: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },

  // --- Ground shadow (sits outside the bobbing group) ----------------------
  shadow: {
    position: 'absolute',
    left: 48,
    top: 136,
    width: 150,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000000',
  },

  // --- Wheels ---------------------------------------------------------------
  wheel: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: TIRE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelBack: { left: 36, top: 82 },
  wheelFront: { left: 150, top: 82 },
  hub: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: HUB,
  },
  spokeV: {
    position: 'absolute',
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: SPOKE,
  },
  spokeH: {
    position: 'absolute',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: SPOKE,
  },

  // --- Scooter body ---------------------------------------------------------
  deck: {
    position: 'absolute',
    left: 48,
    top: 88,
    width: 128,
    height: 18,
    borderRadius: 9,
    backgroundColor: RED,
  },
  frontPost: {
    position: 'absolute',
    left: 150,
    top: 50,
    width: 12,
    height: 46,
    borderRadius: 6,
    backgroundColor: RED,
  },
  seat: {
    position: 'absolute',
    left: 44,
    top: 62,
    width: 92,
    height: 40,
    borderRadius: 18,
    backgroundColor: RED,
  },
  handlebar: {
    position: 'absolute',
    left: 150,
    top: 40,
    width: 34,
    height: 9,
    borderRadius: 4,
    backgroundColor: DARK,
  },
  headlight: {
    position: 'absolute',
    left: 178,
    top: 74,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: YELLOW,
  },

  // --- Delivery box ---------------------------------------------------------
  box: {
    position: 'absolute',
    left: 28,
    top: 40,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: ORANGE,
  },
  boxStripe: {
    position: 'absolute',
    left: 28,
    top: 57,
    width: 44,
    height: 8,
    backgroundColor: ORANGE_DARK,
  },

  // --- Rider ----------------------------------------------------------------
  riderBody: {
    position: 'absolute',
    left: 82,
    top: 48,
    width: 36,
    height: 46,
    borderRadius: 15,
    backgroundColor: BLUE,
  },
  riderArm: {
    position: 'absolute',
    left: 108,
    top: 58,
    width: 54,
    height: 11,
    borderRadius: 6,
    backgroundColor: BLUE,
    transform: [{ rotate: '-12deg' }],
  },
  head: {
    position: 'absolute',
    left: 100,
    top: 22,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SKIN,
  },
  helmet: {
    position: 'absolute',
    left: 97,
    top: 16,
    width: 34,
    height: 19,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: RED_DARK,
  },

  // --- Speed lines ----------------------------------------------------------
  line: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: LINE,
  },
  line1: { left: 4, top: 60, width: 34 },
  line2: { left: 0, top: 92, width: 40 },
  line3: { left: 10, top: 112, width: 28 },
});
