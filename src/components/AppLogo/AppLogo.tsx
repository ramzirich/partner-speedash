import React, { memo } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { styles } from './AppLogo.styles';

// Static require → resolved & cached by Metro at bundle time. Declared once at
// module scope so it isn't re-created on every render.
const LOGO_SOURCE = require('../../assets/images/logo.png');

export interface AppLogoProps {
  /** Rendered width & height in dp (the logo is square). Default 96. */
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Reusable brand logo. Use on the landing, splash, sign-in and any other
 * screen that needs the SpeedDash mark — change the asset in one place.
 */
const AppLogoComponent: React.FC<AppLogoProps> = ({ size = 96, style }) => (
  <Image
    source={LOGO_SOURCE}
    resizeMode="contain"
    accessibilityRole="image"
    accessibilityLabel="SpeedDash logo"
    style={[styles.logo, { width: size, height: size }, style]}
  />
);

export const AppLogo = memo(AppLogoComponent);
AppLogo.displayName = 'AppLogo';
