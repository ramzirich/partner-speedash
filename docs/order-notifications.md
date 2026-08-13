# Order notifications

How the partner app announces an order reaching `DELIVERED`, and which app
states each mechanism actually covers.

There are **two** paths, and they cover different things. Neither replaces the
other.

| | Transport | Covers | Setup needed |
| --- | --- | --- | --- |
| **A. Foreground service** | Socket.IO, held open by an Android foreground service | Foreground, backgrounded, screen off | None — works on a plain build |
| **B. FCM push** | Firebase → Google Play services | All of the above, **plus** swiped away, force-stopped, post-reboot | `google-services.json` + backend sending |

Path A is live today. Path B is written and wired but dormant — it degrades to a
no-op until the config file is added (see [Enabling FCM](#enabling-fcm)).

## Why the socket alone wasn't enough

`src/api/socket.ts` delivers `orderUpdate` over socket.io. That only reaches the
app while this JS process is running, and Android freezes a backgrounded process
within seconds: the websocket is torn down, timers stop, and an order that moves
goes unannounced.

Path A buys back the *backgrounded* case. Path B is the only thing that reaches a
process that isn't running at all.

## Path A — foreground service

`src/services/backgroundOrders.ts` holds a foreground service open while the
partner has an order in flight. While that service holds its (mandatory,
user-visible) notification, the app sits in the foreground app-standby bucket —
not frozen, not Doze-restricted — so the socket stays connected and
`orderUpdate` keeps arriving.

| Concern | Where |
| --- | --- |
| Service lifetime, socket subscription, announce dedupe | `src/services/backgroundOrders.ts` |
| Start/stop on live-order edges | `src/screens/Home/HomeScreen.tsx` |
| Notification drawing + press queue | `src/services/notifications.ts` |
| `FOREGROUND_SERVICE_DATA_SYNC`, service type `dataSync\|location` | `android/app/src/main/AndroidManifest.xml` |

### What it covers

- **Backgrounded** (home button, screen off, another app) — ✅
- **Swiped from recents** — ❌ the OS destroys the task and the service with it
- **Force-stopped, or post-reboot with the app unopened** — ❌ nothing runs
- **iOS** — ❌ no foreground-service equivalent; apps are suspended ~30s after
  backgrounding and only APNs can wake them. Everything in this path is gated to
  Android and no-ops elsewhere.

### Design notes

**Scoped to live orders, not the whole session.** The service starts on the
first open order and stops when the last one settles, taking its persistent
notification with it. Two reasons: a permanent notification that says nothing
useful is noise, and Android 15+ budgets `dataSync` foreground services to **~6
hours per 24h app-wide**. Per-delivery bursts never approach that; a service
held open all day would hit the wall and be stopped by the system.

**That failure is silent.** `startBackgroundOrderNotifications` swallows a
refused service start (permission denied, or budget spent) so the app doesn't
crash — notifications then quietly revert to foreground-only. Worth logging if
you ever see field reports of missed deliveries.

**Dedupe is process-wide.** `announceOrderStatus` holds the "already announced"
map at module scope because two subscriptions see every message: the background
one and `HomeScreen`'s own. A per-subscriber map would notify twice per
transition when the app is foregrounded.

**Aggressive OEMs still win.** Samsung/Xiaomi/Huawei battery managers can freeze
the process despite the foreground service unless the app is set to
"Unrestricted" — the same caveat `hooks/useBackgroundLocation.ts` documents.

## Path B — FCM push

FCM inverts the addressing: the backend sends to the *device*, Google Play
services holds the message, and Android draws it without the app running. This
is the only path that survives a swipe-away.

### Client pieces (already implemented)

All shared between platforms — only the native config differs.

| Concern | Where |
| --- | --- |
| Register / release the device token | `src/api/devices.api.ts` |
| Permission, token, foreground display, press routing | `src/services/push.ts` |
| Background / quit-state data-message handler | `index.js` |
| Notification drawing + press queue | `src/services/notifications.ts` |
| Android Gradle plugin wiring | `android/build.gradle`, `android/app/build.gradle` |
| iOS Firebase init, background mode, APNs entitlement | `ios/PartnerSpeedash/AppDelegate.swift`, `Info.plist`, `PartnerSpeedash.entitlements` |

Both platforms are wired so that a **missing config file degrades instead of
breaking**: Android only applies the google-services plugin when
`google-services.json` is present, and `AppDelegate` only calls
`FirebaseApp.configure()` when `GoogleService-Info.plist` is present. Without
them the app builds and runs on Path A alone; add them and push starts working
on the next build.

### Enabling FCM

Create a Firebase project (or reuse an existing one), then do the per-platform
steps below. Finally, for the backend, create a **service account key** in
*Project settings → Service accounts* and use the Firebase Admin SDK.

Rebuilding natively is required either way — Firebase is a native module, so a
JS reload will not pick it up.

#### Android

1. In the Firebase console, **Add app → Android**, package name
   `com.partnerspeedash` (must match `applicationId` exactly).
2. Leave the debug SHA-1 blank — that is only needed for Google Sign-In and
   Dynamic Links, not FCM.
3. Download `google-services.json` → `android/app/google-services.json`.
4. `npx react-native run-android`

#### iOS

Requires a Mac with Xcode and a **paid Apple Developer account** — APNs is not
available on a free personal team, so push cannot be tested without one. On iOS
this is the *only* background path; Path A does not apply.

1. **Set a real bundle identifier first.** The project still carries the React
   Native template default, `org.reactjs.native.example.PartnerSpeedash`. Apple
   will not issue a push entitlement for it and it cannot be shipped. Change
   `PRODUCT_BUNDLE_IDENTIFIER` in Xcode (target → Signing & Capabilities) to
   something you own, e.g. `com.partnerspeedash`, *before* registering the app
   with Firebase — the Firebase iOS app and the bundle id must match.
2. In the Firebase console, **Add app → iOS** with that same bundle id.
3. Download `GoogleService-Info.plist` and add it to the Xcode project: drag it
   into the `PartnerSpeedash` group, tick **Copy items if needed** and the
   `PartnerSpeedash` target. It must be added through Xcode — dropping it in
   the folder alone leaves it out of the app bundle, and
   `AppDelegate` will then skip Firebase init entirely.
4. Create an **APNs auth key**: [developer.apple.com](https://developer.apple.com)
   → Certificates, Identifiers & Profiles → Keys → **+** → enable *Apple Push
   Notifications service (APNs)* → download the `.p8` (**you can only download
   it once**). Note the Key ID and your Team ID.
5. Upload it to Firebase: *Project settings → Cloud Messaging → Apple app
   configuration → APNs Authentication Key*. Without this step the backend can
   hold a valid token and every send still silently fails.
6. In Xcode, target → **Signing & Capabilities**, confirm **Push Notifications**
   is listed. The entitlements file and `CODE_SIGN_ENTITLEMENTS` are already
   committed, so it should appear on its own; if not, click **+ Capability** and
   add it.
7. `cd ios && pod install`, then `npx react-native run-ios` — **on a physical
   device**. The iOS Simulator has no APNs, so `getToken()` fails there and no
   push will ever arrive.

## Backend contract

Only Path B needs backend work. Path A rides the `orderUpdate` socket event that
already exists.

### 1. Store device tokens

Both endpoints are authenticated with the normal `Authorization: Bearer
<accessToken>`. Tie the token to the caller's identity from that bearer token —
never to an id in the body.

```
POST /api/devices
{ "token": "<fcm registration token>", "platform": "android" | "ios" }
→ 200 { "success": true }
```

Upsert on `token`. The same token arriving again is a re-registration, not a
duplicate — the client calls this on every entry to Home because FCM rotates
tokens on reinstall, restore-to-new-phone, and app-data clear. If the token
already exists against a *different* partner, reassign it: that means the phone
changed hands.

```
POST /api/devices/unregister
{ "token": "<fcm registration token>" }
→ 200 { "success": true }
```

Called at sign-out, before the session is cleared.

### 2. Send on order events

Wherever you currently emit the `orderUpdate` socket event, also send an FCM
message to every token belonging to that partner.

Send `notification` **and** `data` together. The `notification` block is what
lets Android draw it with the app dead; the `data` block is the only part still
readable when the partner presses it, which is how the app knows which order to
open.

```jsonc
{
  "tokens": ["<partner's tokens>"],          // sendEachForMulticast
  "notification": {
    "title": "Order #a1b2c3",
    "body": "Your order has been delivered."
  },
  "data": {
    "orderId": "68f0...",                    // required — drives press routing
    "title": "Order #a1b2c3",                // mirrored for the data-only path
    "body": "Your order has been delivered."
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "order-status",           // must match services/notifications.ts
      "sound": "default"
    }
  },
  "apns": {
    "payload": { "aps": { "sound": "default", "contentAvailable": true } }
  }
}
```

`data` values must all be strings — FCM rejects nested objects and numbers.

`channelId` has to be exactly `order-status`. The app creates that channel at
HIGH importance; a message naming a channel that doesn't exist lands silently
in the tray instead of as a banner.

Sending both paths at once does **not** produce two notifications: the FCM path
and the socket path both use the order id as the notification id, so the second
replaces the first in place rather than stacking.

### 3. Prune dead tokens

`sendEachForMulticast` returns a per-token result. On
`messaging/registration-token-not-registered` (or `invalid-argument`), delete
that row. Uninstalls never call the unregister endpoint, so without pruning the
token table only grows.

## Testing it

### Path A (no setup required)

1. Sign in and create an order.
2. Confirm the persistent "Tracking your order" notification appears while the
   order is open.
3. Press **home** — do not swipe the app away.
4. Move the order to `DELIVERED` from the backend.
5. The delivery notification should appear; pressing it should open the app on
   the Orders tab with that order focused.
6. Swipe the app from recents and repeat — nothing should arrive. That is the
   expected boundary, and the gap Path B fills.

### Path B

1. Sign in, then confirm the backend received a token for the partner.
2. Swipe the app away from recents.
3. Send a test message to that token with the Admin SDK (the Firebase console's
   *Cloud Messaging → Send test message* also works).
4. The notification should appear with the app closed.

## Troubleshooting

**Nothing arrives while backgrounded (Path A)** — check the persistent
notification is actually showing; if it isn't, the service never started. Likely
causes: `POST_NOTIFICATIONS` denied, the Android 15+ `dataSync` budget spent, or
the device's battery manager freezing the app (set it to "Unrestricted" on
Samsung/Xiaomi/Huawei).

**Nothing arrives on Android (Path B)** — check `google-services.json` is
present and matches the package name, that notification permission was granted
(Android 13+ needs the runtime grant), and that the device isn't in
battery-saver doze with the app "restricted".

**Nothing arrives on iOS** — confirm you are on a physical device (the simulator
has no APNs), that the APNs key is uploaded in *Cloud Messaging*, that the
bundle id matches the Firebase iOS app, and that `GoogleService-Info.plist` is
in the **target**, not just the folder — in Xcode, select it and check the
Target Membership box in the file inspector.
