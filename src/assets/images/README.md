# App images

Drop bundled raster assets here.

## Required: `logo.png`

The landing screen (`AppLogo` component) loads **`logo.png`** from this folder.
Save the SpeedDash logo as:

```
src/assets/images/logo.png
```

Optional but recommended for crisp rendering on high-density screens, add
@2x / @3x variants next to it (Metro picks them automatically):

```
logo.png       // 1x  (e.g. 168x168)
logo@2x.png    // 2x  (e.g. 336x336)
logo@3x.png    // 3x  (e.g. 504x504)
```

Until `logo.png` exists, the Metro bundle will fail to resolve it.

## Optional: landing hero photos

The landing carousel (`HeroCarousel`) shows three slides. Slide 1 uses
`logo.png`; slides 2 & 3 currently load **remote placeholder photos** so the
app runs before the brand shoot is ready.

To ship bundled assets instead, drop these here and swap the `image` value in
`src/screens/Landing/LandingScreen.tsx` from `{ uri: '…' }` to `require('…')`:

```
moto.png         // rider on a motorcycle (full-bleed, ~1080px wide)
restaurant.png   // restaurant / kitchen (full-bleed, ~1080px wide)
```

