import { ImageResizeMode, ImageSourcePropType } from 'react-native';

/**
 * A single slide in the <HeroCarousel>.
 *
 * `image` accepts both bundled assets (`require('…')`) and remote URIs
 * (`{ uri: 'https://…' }`) so slides can be swapped without touching the
 * carousel itself.
 */
export interface HeroSlide {
  /** Stable key for list diffing + dot identity. */
  key: string;
  image: ImageSourcePropType;
  /** Headline rendered over the bottom scrim. */
  title: string;
  /** Supporting line under the title. */
  subtitle: string;
  /** Defaults to 'cover' (full-bleed photo). Use 'contain' for logos. */
  resizeMode?: ImageResizeMode;
  /** Backdrop behind a 'contain' image (e.g. brand white for the logo slide). */
  backgroundColor?: string;
}
