# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Project Setup

- Expo SDK 56 with Expo Router.
- NativeWind v5 preview is installed manually with Tailwind CSS v4 and `react-native-css`.
- EAS Build and EAS Update are configured for project `@rorez/ethos`.
- OTA updates use `runtimeVersion.policy = appVersion` and EAS channels from `eas.json`.
- Dev-client mode is the default local development target.
- Tunnel mode is used by default for native dev server scripts; `@expo/ngrok` is installed locally.

## Common Commands

- `npm run dev` starts the Expo dev server in dev-client mode with tunnel.
- `npm run android` starts dev-client mode with tunnel and opens Android.
- `npm run ios` starts dev-client mode with tunnel and opens iOS.
- `npm run build:android` builds a local Android dev-client APK at `./ethos-dev.apk`.
- `npm run build:android:preview` builds a local Android preview APK at `./ethos-preview.apk`.
- `npm run build:ios` starts an EAS cloud iOS development build.
- `npm run run:android` uses `expo run:android` for local native Android install/run.

## Verification

- Prefer `npx tsc --noEmit` for TypeScript verification.
- Use `npx expo config --json` after app config, EAS, OTA, or plugin changes.
- Use `npx expo export --platform web --output-dir /tmp/ethos-test-build` only as a non-interactive bundling check, not as a web-only assumption.
