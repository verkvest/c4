# Aureline

Aureline is an offline four-in-a-line board game for iPhone and Android. Drop a disc in a column, line up four, and play a rival that searches the board on the device. Two people can also pass the same phone, or watch two rivals play.

The rules engine and minimax search come from [c4](https://github.com/kenrick95/c4) by Kenrick, under the MIT license. This app does not open an online match. The legacy `server/` package is unused by the mobile shell.

- Bundle id: `es.verkvest.aureline`
- Display name: Aureline

## Play on the web

```bash
yarn install
yarn dev-browser
```

Open http://localhost:5173/

## Mobile shell

The native projects live in `ios/` and `android/` (Capacitor). Web assets are built from `browser/` into `browser/dist` and copied with `cap sync`.

```bash
yarn install
yarn build:mobile
```

Open `ios/App/App.xcworkspace` in Xcode, or `android/` in Android Studio. Release builds use target SDK 36 on Android.

Themes, rival strength, sound, and on-device records are stored locally. Credits and license notices are in the menu and in `THIRD_PARTY_LICENSES.md`.

## Checks

```bash
yarn lint:ci
yarn workspaces foreach --all run test
```

Phone-sized menu and gameplay screenshots:

```bash
yarn screenshots
```

## Continuous integration

- `Test` lints, tests, and builds.
- `ios-testflight` archives the Capacitor Xcode project on macOS, signs with the App Store Connect API key, and uploads to TestFlight. It skips cleanly when the API key secrets are absent.
- `android-release` builds a release AAB and APK. With keystore secrets it signs the release; otherwise it uploads a debug-signed APK.
