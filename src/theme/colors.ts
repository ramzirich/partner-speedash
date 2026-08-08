/**
 * Single source of truth for colours. Never hardcode a hex value in a
 * component or style file — reference a token here so re-theming is one edit.
 */
export const colors = Object.freeze({
  primary: '#FF6B00',
  primaryDark: '#E55F00',
  primaryLight: '#FF8C3A',
  accent: '#009688',

  // Neutrals
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textOnPrimary: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  border: '#E5E7EB',

  // Feedback
  danger: '#E53935',
  success: '#2E7D32',
  warning: '#F59E0B',

  /** WhatsApp brand green — icon marks only; too light for text on a light bg. */
  whatsapp: '#25D366',

  // Brand washes — tinted backdrops that stay readable under dark text.
  primaryWash: 'rgba(255, 107, 0, 0.10)',
  primaryWashSoft: 'rgba(255, 107, 0, 0.05)',
  accentWash: 'rgba(0, 150, 136, 0.07)',

  dangerWash: 'rgba(229, 57, 53, 0.10)',
  warningWash: 'rgba(245, 158, 11, 0.12)',
  successWash: 'rgba(46, 125, 50, 0.10)',

  // Overlays
  scrim: 'rgba(17, 17, 17, 0.45)',
  scrimSoft: 'rgba(0, 0, 0, 0.22)',
  onPrimaryWash: 'rgba(255, 255, 255, 0.18)',
  transparent: 'transparent',

  /**
   * Hero scrim ramp — stacked bands that fake a bottom-up gradient over a photo
   * so caption text stays legible whatever the image is. More, shallower steps
   * than a 3-band ramp so the banding isn't visible on an OLED panel.
   */
  heroScrim1: 'rgba(0, 0, 0, 0.08)',
  heroScrim2: 'rgba(0, 0, 0, 0.20)',
  heroScrim3: 'rgba(0, 0, 0, 0.34)',
  heroScrim4: 'rgba(0, 0, 0, 0.48)',
  heroScrim5: 'rgba(0, 0, 0, 0.60)',
  heroScrim6: 'rgba(0, 0, 0, 0.70)',

  /** Top-down ramp that keeps light status-bar icons readable over a photo. */
  statusScrim1: 'rgba(0, 0, 0, 0.30)',
  statusScrim2: 'rgba(0, 0, 0, 0.16)',
  statusScrim3: 'rgba(0, 0, 0, 0.06)',

  // Text/marks drawn on top of imagery
  textOnImage: 'rgba(255, 255, 255, 0.92)',
  textShadowOnImage: 'rgba(0, 0, 0, 0.35)',
  dotIdleOnDark: 'rgba(255, 255, 255, 0.5)',
  dotIdleOnLight: 'rgba(26, 26, 26, 0.22)',
});

export type AppColors = typeof colors;
