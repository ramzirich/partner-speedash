# App images

Drop bundled raster assets here.

## Required: `logo.png`

The `AppLogo` component loads **`logo.png`** from this folder — the SpeedDash
scooter mark over the `SPEEDDASH` wordmark, **394x287 with a transparent
background**, so it drops onto any screen colour. `AppLogo` gives it a square
box and `resizeMode: 'contain'`, so the landscape art letterboxes inside that
box: at `size={112}` it draws 112x82.

The master it was cut from is a JPEG on white. The background was removed by
flood-filling inward **from the border only** — a plain "delete white pixels"
pass punches holes through the white `SPEED` lettering and the rider's shoe,
because those are white too but aren't connected to the edge.

The same master feeds the launcher icons and the notification icons; see
[docs/branding.md](../../../docs/branding.md) for the full set and how to
regenerate it after a logo change.

## In use: `delivery1.jpg` (illustrated landing hero)

`RiderHero` (`src/components/RiderHero/`) animates a delivery-rider sprite —
it bobs and tilts on its suspension, with an optional ground shadow and
optional trailing speed lines. It sizes itself from the space its parent gives
it and uses `resizeMode: 'contain'`, so any aspect ratio works: a short phone
shrinks the sprite rather than pushing the headline off-screen.

The landing screen loads **`delivery1.jpg`** — the red side-view cartoon.
Because it's a **JPEG it carries no alpha**, so its solid white background is
real pixels; the hero's `backgroundColor` is therefore `colors.background`
(white) rather than `colors.surface`, or the artwork would sit in a visible
box. It also has a shadow baked in, so it's rendered with
`showShadow={false}`.

### `delivery.jpg` — do not use as-is

The orange 3D render was saved as a **JPEG from a transparent source**, so the
transparency checkerboard was flattened into the image as actual grey/white
pixels. Dropped into the app it renders a checkerboard rectangle.

It's the better artwork (3/4 view, and its orange matches
`colors.primary` `#FF6B00`) — to use it, re-export the original with
transparency as **`rider.png`**. Then the hero can go back to
`colors.surface`, and pass `showSpeedLines={false}` since lines read wrong on a
view facing the camera.

### Notes on artwork generally

- **Transparent PNG beats JPEG** for any cut-out subject, for the reason above.
- **View angle** decides `showSpeedLines`: a true side view supports trailing
  lines; a 3/4 view facing the camera does not.
- **`facing`** must match the sprite: lines trail on the opposite side to the
  way the scooter points.
- **Separate layers** if you ever want the wheels to turn. A flat bitmap can't
  be decomposed, so `RiderHero` deliberately has no wheel spin. Body + wheel as
  separate PNGs would let us add one.
- Check the licence before shipping.

## Unused: `HeroCarousel`

`src/components/HeroCarousel/` is no longer on the landing screen but is kept
for a future first-run onboarding flow, where a user-driven (not
auto-advancing) sequence of slides actually earns its place. It takes remote
`{ uri: '…' }` or bundled `require('…')` images.

