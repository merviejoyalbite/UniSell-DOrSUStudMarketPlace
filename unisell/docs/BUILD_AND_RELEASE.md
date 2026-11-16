# UniSell — Preview Build and Release Notes

This document covers the Android preview APK, the EAS configuration, and the
limits of the mock API on a standalone build. The app's primary live-demo path
is still **Expo Go + the laptop's json-server**; the APK is a submission and
backup artifact.

> **Current status:** `eas.json` and the app identifiers are prepared, but an APK
> has **not** been built in this workspace. No Expo account is signed in here and
> no Android SDK is installed. Follow the steps below on the team's machine.

---

## 1. What is already configured

- `app.json`
  - Android package: `ph.edu.dorsu.unisell`
  - iOS bundle id: `ph.edu.dorsu.unisell`
  - `android.versionCode: 1`, `ios.buildNumber: "1"`
  - icon, adaptive icon, brand background colour and portrait orientation
  - branded `icon.png`, `android-icon-foreground/background/monochrome.png` and
    `favicon.png` generated from the graduation-cap mark (`npm run app-icons`)
  - `expo-splash-screen` plugin: `assets/splash-unisell.png` on `#EAF6F3`
    (light) and `#0B1030` (dark), `imageWidth: 180`, `resizeMode: contain`
- `eas.json`
  - `preview` profile: internal distribution, **APK** build type
  - `production` profile: store build with automatic version increment
- `npm run build:preview` → `npx eas-cli@latest build --platform android --profile preview`
- `npm run export:web` → static web export check (does not create an APK)

The identifiers are appropriate for a DOrSU academic project. Change them only
if the team has a different institutional namespace.

---

## 2. One-time EAS setup

Requirements: a free Expo account, Node.js 20+, and internet access.

```powershell
cd path\to\unisell
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` links the project to the Expo account and writes an
`extra.eas.projectId` into `app.json`. That project id is account-specific; commit
it only if the team wants the same EAS project for everyone.

When the first Android build starts, let EAS generate and store the keystore if
the team does not already have one. Do not commit keystores or passwords.

---

## 3. Build the preview APK

```powershell
npm run build:preview
```

or directly:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

The terminal prints a build page and, when finished, an APK download link.
Install it by opening the link on the phone or with:

```powershell
adb install -r path\to\unisell-preview.apk
```

The first build takes several minutes. Later builds reuse the cached
dependencies.

### Important: the API URL is baked into the build

`EXPO_PUBLIC_API_URL` is read when the JavaScript bundle is built. A cloud build
cannot reach `localhost` or the laptop's private LAN address unless that address
is explicitly provided at build time.

Choose one of these demo modes:

**A. Expo Go — recommended for the live pitch**

```powershell
# Terminal 1
npm run api

# Terminal 2 (PowerShell, use the laptop's LAN IPv4 address)
$env:EXPO_PUBLIC_API_URL="http://192.168.1.20:3001"
npm start
```

Scan the QR code with Expo Go on the same Wi-Fi network. This keeps the dev
server and API together and supports every flow, including posting.

**B. Preview APK with a LAN API**

For a build that talks to the laptop during a demo, add the demo LAN URL to the
preview profile before building (do not commit a personal IP to a public repo):

```json
"preview": {
  "distribution": "internal",
  "env": {
    "EXPO_PUBLIC_API_URL": "http://192.168.1.20:3001"
  },
  "android": {
    "buildType": "apk"
  }
}
```

Set the IP to the laptop's actual Wi-Fi address and confirm the phone can open
`http://<LAN-IP>:3001/listings` in its browser. Rebuild after changing the URL.

**C. Preview APK without a reachable API**

The app defaults to `localhost:3001`, which on a phone points at the phone
itself. In that case:

- browsing uses the bundled 18 listings and shows the offline banner;
- the four seeded demo accounts can log in through the bundled users;
- sign-up and posting fail with the normal inline error.

That is still useful as a browsing/profile backup, but it is **not** a full
posting demo. Say this plainly instead of presenting the APK as a hosted
backend.

---

## 4. Local build fallback

If the team has Android Studio, the Android SDK and JDK 17 installed:

```powershell
npx eas-cli@latest build --platform android --profile preview --local
```

A local build still needs the same `EXPO_PUBLIC_API_URL` decision. It produces an
APK without uploading source to EAS, but the SDK setup is outside this project.

---

## 5. Before submitting the APK

- [ ] `npm run typecheck` passes.
- [ ] `npm run export:web` completes.
- [ ] Stop json-server before `npm run db:reset`; it restores the clean
      4-user / 18-listing seed without a file-lock warning.
- [ ] The APK opens without a red error screen.
- [ ] Seeded login works in airplane mode (bundled fallback).
- [ ] With the API reachable, Home, Search, Details, Saved and Profile work.
- [ ] Posting writes to the API and the new card appears.
- [ ] The app version and package name match `app.json`.
- [ ] Keep the APK outside the repo; `*.apk` is intentionally ignored.
- [ ] Record the build URL or file name in the submission checklist.

---

## 6. Why the APK is not committed

`*.apk` and `*.aab` are in `.gitignore`. Build artifacts are large, platform
specific and should be downloaded from EAS or attached to the submission drive.
The source, EAS profile and exact commands are the reproducible deliverable.
