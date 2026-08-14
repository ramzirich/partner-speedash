#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-bitwise -- unpacking pixel buffers is inherently bitwise */
/**
 * Regenerates every SpeedDash brand asset from the one source logo:
 * the in-app logo, the Android launcher icons (legacy, round and adaptive),
 * the notification icons, and the iOS app icon set.
 *
 * The tools are deliberately not project dependencies — this runs by hand on a
 * logo change, not on install:
 *
 *   npm i --no-save sharp @material-design-icons/svg
 *   node scripts/generate-brand-assets.js [path/to/logo.jpg]
 *
 * See docs/branding.md for what each output is for and why it's sized that way.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2] || path.join(ROOT, 'docs/brand/speeddash-logo.jpg');
const RES = path.join(ROOT, 'android/app/src/main/res');
const IOS = path.join(ROOT, 'ios/PartnerSpeedash/Images.xcassets/AppIcon.appiconset');
const GLYPH = require.resolve('@material-design-icons/svg/filled/delivery_dining.svg');

/** theme/colors.ts → colors.primary. Keep the two in step. */
const BRAND_ORANGE = '#FF6B00';
/** The logo art is drawn for a light backdrop; anything darker muddies it. */
const ICON_BG = '#FFFFFF';

/** Android density buckets as multiples of the mdpi (1x) baseline. */
const DPI = [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]];

const write = (p, buf) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
  console.log('  ' + path.relative(ROOT, p).replace(/\\/g, '/'));
};

/**
 * Lift the logo off its white JPEG backdrop, returning trimmed RGBA.
 *
 * The background is found by flooding inward **from the border**, not by
 * thresholding on whiteness: the `SPEED` lettering and the rider's shoe are
 * white too, and a global threshold punches holes straight through them. Only
 * white that is reachable from the edge is background.
 */
async function buildMaster() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const lum = new Float32Array(W * H);
  const sat = new Float32Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const i = p * C;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
    sat[p] = Math.max(r, g, b) - Math.min(r, g, b);
  }

  const LUM_BG = 200, SAT_BG = 26;
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (bg[p] || !(lum[p] > LUM_BG && sat[p] < SAT_BG)) continue;
    bg[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }

  // Ramp alpha across the real content edge to keep it anti-aliased. The source
  // white is a noisy 251-255 rather than a clean 255, so everything above
  // LUM_CLEAR is forced fully clear — otherwise the whole frame stays faintly
  // opaque and the trim below finds nothing to cut to.
  const LUM_CLEAR = 235;
  const rgba = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const i = p * C;
    rgba[p * 4] = data[i];
    rgba[p * 4 + 1] = data[i + 1];
    rgba[p * 4 + 2] = data[i + 2];
    rgba[p * 4 + 3] = bg[p]
      ? Math.round(Math.min(1, Math.max(0, (LUM_CLEAR - lum[p]) / (LUM_CLEAR - LUM_BG))) * 255)
      : 255;
  }

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rgba[(y * W + x) * 4 + 3] > 16) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const from = ((y + minY) * W + minX) * 4;
    rgba.copy(out, y * w * 4, from, from + w * 4);
  }
  return { buf: out, w, h };
}

const svgMask = (size, inner) =>
  Buffer.from(`<svg width="${size}" height="${size}">${inner}</svg>`);

(async () => {
  const { buf, w, h } = await buildMaster();
  const RATIO = w / h;
  const masterPng = await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png().toBuffer();
  console.log(`\nMaster: ${w}x${h} (ratio ${RATIO.toFixed(3)}) from ${path.relative(ROOT, SRC)}`);

  /** Centre the logo on a square canvas at `widthPct` of its width. */
  const onSquare = async (size, widthPct, bg) => {
    const lw = Math.round(size * widthPct);
    const lh = Math.round(lw / RATIO);
    const logo = await sharp(masterPng).resize(lw, lh, { fit: 'fill' }).png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: bg || '#00000000' } })
      .composite([{ input: logo, left: Math.round((size - lw) / 2), top: Math.round((size - lh) / 2) }])
      .png().toBuffer();
  };

  console.log('\nIn-app logo:');
  write(path.join(ROOT, 'src/assets/images/logo.png'), masterPng);

  // Legacy square + round icons cover pre-Android-8. The adaptive foreground
  // covers 8+; at 64% of the 108dp canvas the art clears the 72dp visible
  // circle, so no launcher mask shape can clip it.
  console.log('\nLauncher icons:');
  for (const [bucket, scale] of DPI) {
    const s = Math.round(48 * scale);
    write(`${RES}/mipmap-${bucket}/ic_launcher.png`, await onSquare(s, 0.84, ICON_BG));
    write(`${RES}/mipmap-${bucket}/ic_launcher_round.png`, await sharp(await onSquare(s, 0.72, ICON_BG))
      .composite([{ input: svgMask(s, `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/>`), blend: 'dest-in' }])
      .png().toBuffer());
    write(`${RES}/mipmap-${bucket}/ic_launcher_foreground.png`, await onSquare(Math.round(108 * scale), 0.64, null));
  }

  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
  write(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, Buffer.from(adaptive));
  write(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, Buffer.from(adaptive));

  // Android keeps only the small icon's alpha and tints the silhouette, so the
  // logo can't go here — it flattens to a solid blob. A scooter glyph carries
  // the same idea and stays legible at 24dp.
  console.log('\nNotification small icon (scooter glyph, tinted by the OS):');
  const glyph = fs.readFileSync(GLYPH, 'utf8').replace(/<path(?![^>]*fill)/g, '<path fill="#FFFFFF"');
  for (const [bucket, scale] of DPI) {
    const s = Math.round(24 * scale);
    const raw = await sharp(Buffer.from(glyph), { density: 384 })
      .resize(s, s, { fit: 'contain', background: '#00000000' })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < raw.data.length; i += 4) {
      raw.data[i] = raw.data[i + 1] = raw.data[i + 2] = 255; // alpha is kept
    }
    write(`${RES}/drawable-${bucket}/ic_notification.png`,
      await sharp(raw.data, { raw: { width: s, height: s, channels: 4 } }).png().toBuffer());
  }

  // The logo itself, as the full-colour thumbnail on the right of the row.
  // Rounded so it reads as a card on both the light and dark shade.
  console.log('\nNotification large icon (the logo):');
  for (const [bucket, scale] of DPI) {
    const s = Math.round(64 * scale);
    write(`${RES}/drawable-${bucket}/ic_notification_large.png`,
      await sharp(await onSquare(s, 0.86, ICON_BG))
        .composite([{ input: svgMask(s, `<rect width="${s}" height="${s}" rx="${s * 0.18}" ry="${s * 0.18}" fill="#fff"/>`), blend: 'dest-in' }])
        .png().toBuffer());
  }

  console.log('\nColours:');
  write(`${RES}/values/ic_launcher_background.xml`, Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${ICON_BG}</color>
</resources>
`));
  write(`${RES}/values/colors.xml`, Buffer.from(`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Brand orange (theme/colors.ts → colors.primary). Tints the notification
         small icon and the app name in the shade. Referenced from
         AndroidManifest.xml for the notifications Android draws itself. -->
    <color name="notification_accent">${BRAND_ORANGE}</color>
</resources>
`));

  // iOS rejects app icons that carry an alpha channel, so these are flattened.
  console.log('\niOS app icon:');
  const IOS_ICONS = [
    ['iphone', '20x20', '2x', 40], ['iphone', '20x20', '3x', 60],
    ['iphone', '29x29', '2x', 58], ['iphone', '29x29', '3x', 87],
    ['iphone', '40x40', '2x', 80], ['iphone', '40x40', '3x', 120],
    ['iphone', '60x60', '2x', 120], ['iphone', '60x60', '3x', 180],
    ['ios-marketing', '1024x1024', '1x', 1024],
  ].map(([idiom, size, scale, px]) => ({
    idiom, size, scale, px, filename: `AppIcon-${size.split('x')[0]}@${scale}.png`,
  }));
  for (const i of IOS_ICONS) {
    write(`${IOS}/${i.filename}`, await sharp(await onSquare(i.px, 0.84, ICON_BG))
      .flatten({ background: ICON_BG }).png({ palette: false }).toBuffer());
  }
  write(`${IOS}/Contents.json`, Buffer.from(JSON.stringify({
    images: IOS_ICONS.map(({ filename, idiom, scale, size }) => ({ filename, idiom, scale, size })),
    info: { author: 'xcode', version: 1 },
  }, null, 2) + '\n'));

  console.log('\nDone. Android caches launcher icons — reinstall rather than' +
    ' just rebuilding if the old icon lingers.');
})();
