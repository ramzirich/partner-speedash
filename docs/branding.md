# Branding assets

Every icon in the app is cut from one source file,
[`docs/brand/speeddash-logo.jpg`](brand/speeddash-logo.jpg), by
`scripts/generate-brand-assets.js`. Nothing here is hand-edited — change the
source, re-run the script, and all 40-odd outputs move together.

## Regenerating

The image tools are **not** project dependencies; this runs by hand on a logo
change, not on every install:

```bash
npm i --no-save sharp @material-design-icons/svg
node scripts/generate-brand-assets.js            # uses docs/brand/speeddash-logo.jpg
node scripts/generate-brand-assets.js new.jpg    # or point it at a new source
```

To adopt a new logo, replace `docs/brand/speeddash-logo.jpg` and re-run. If the
new art has a different aspect ratio, re-check the launcher icons — the
percentages in the script are chosen for a landscape mark (see
[Sizing](#sizing-why-these-percentages)).

Android caches launcher icons aggressively. If the old icon lingers after a
rebuild, **uninstall the app and reinstall** rather than chasing it.

## What gets written

| Output | Purpose |
| --- | --- |
| `src/assets/images/logo.png` | The in-app mark, loaded by `<AppLogo>`. Transparent, 394x287. |
| `mipmap-*/ic_launcher.png` | Legacy square launcher icon (pre-Android 8). |
| `mipmap-*/ic_launcher_round.png` | Legacy round launcher icon (pre-Android 8). |
| `mipmap-*/ic_launcher_foreground.png` | Adaptive-icon foreground layer (Android 8+). |
| `mipmap-anydpi-v26/ic_launcher*.xml` | Binds that foreground to the background colour. |
| `drawable-*/ic_notification.png` | Status-bar mark — a **scooter glyph**, not the logo. |
| `drawable-*/ic_notification_large.png` | The logo, as the notification thumbnail. |
| `values/ic_launcher_background.xml` | Adaptive-icon background (white). |
| `values/colors.xml` | `notification_accent` — brand orange. |
| `Images.xcassets/AppIcon.appiconset/*` | iOS app icon set + `Contents.json`. |

## Why the notification uses two different icons

This is the part that most often gets built wrong, so it is worth stating
plainly: **Android throws away the small icon's colour.** It keeps only the
alpha channel, then tints the resulting silhouette with the notification's
`color`. Passing the logo there produces a solid orange blob in the status bar —
which is exactly what the old `smallIcon: 'ic_launcher'` did.

So the two slots carry different art:

- **`smallIcon`** → `ic_notification`, a flat delivery-scooter glyph (Material
  Symbols `delivery_dining`, Apache 2.0). It survives being flattened to a
  silhouette and stays readable at 24dp.
- **`largeIcon`** → `ic_notification_large`, the actual logo on a rounded white
  card. This slot keeps full colour, so it is where the artwork belongs.

The accent `color` is `colors.primary` (`#FF6B00`), which tints both the glyph
and the app name in the shade.

## The same styling on two different paths

`androidNotification()` in `src/services/notifications.ts` styles the
notifications **JS** raises — the socket-driven path, and FCM messages that
arrive while the app is in the foreground.

It cannot reach the third case. When the app is backgrounded or dead, the
Firebase SDK renders the message's `notification` block **natively** and never
calls into JS. That path is branded by manifest defaults instead:

```xml
com.google.firebase.messaging.default_notification_icon    → @drawable/ic_notification
com.google.firebase.messaging.default_notification_color   → @color/notification_accent
com.google.firebase.messaging.default_notification_channel_id → order-status
```

Both halves must be kept in step, or a delivery looks like a different app
depending on whether the phone happened to be awake. Two gotchas live here:

- `react-native-firebase` ships its own defaults for the colour and channel, so
  those two need `tools:replace` in `AndroidManifest.xml` or the manifest merger
  fails the build outright.
- The channel id must match `CHANNEL_ID` in `notifications.ts`. If it doesn't,
  natively-drawn notifications land on a default low-importance channel and
  never appear as a banner.

See [order-notifications.md](order-notifications.md) for which app states each
path actually covers.

## Sizing: why these percentages

The logo is **landscape** (~1.37:1), which is what drives every number in the
script. Fitting a landscape mark into a circular mask costs more margin than a
square one would.

- **Adaptive foreground — 64% of the 108dp canvas.** Only the centre 72dp of
  that canvas is guaranteed visible; the outer ring is cropped for parallax.
  At 64% the art clears the circle, so no launcher mask shape clips it.
- **Round icon — 72%**, for the same reason at a tighter radius.
- **Legacy square — 84%**, the usual margin for a square icon.
- **Notification thumbnail — 86%** on a card rounded to 18%.

The background is **white** everywhere, not brand orange: the artwork's own
orange speed streaks and yellow delivery box lose almost all contrast against
`#FF6B00`. Orange carries the branding through the notification accent instead.

## Extracting the logo from its background

The source is a JPEG on white, so the transparent `logo.png` is cut at build
time. The background is found by flood-filling inward **from the border** —
never by thresholding on whiteness. The `SPEED` lettering and the rider's shoe
are white too; a global threshold punches holes straight through them. Only
white that is reachable from the edge counts as background.

Two constants tune it, and both matter:

- `LUM_BG` / `SAT_BG` — how permissive the flood is about what it will cross.
- `LUM_CLEAR` — the source "white" is a noisy 251-255, not a clean 255. Anything
  above this is forced fully transparent; without it the whole frame stays
  faintly opaque and the auto-trim finds no bounds to cut to.
