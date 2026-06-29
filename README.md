# Expo NativeWind Starter

Reusable Expo SDK 56 starter with Expo Router, NativeWind v5 preview, Tailwind CSS v4, EAS profiles, typed routes, React Compiler, themed native tabs, drawer navigation, and a settings example using `@expo/ui`.

## Use This Template

1. Create a new repository from this GitHub template.
2. Install dependencies:

```bash
npm install
```

3. Initialize app-specific identity:

```bash
npm run init-template
```

4. Verify Expo config:

```bash
npx expo config --json
```

5. Start local development:

```bash
npm run dev
```

## Included

- Expo SDK 56, React 19.2.3, React Native 0.85.3, TypeScript 6.0.
- Expo Router with typed routes and React Compiler enabled.
- NativeWind v5 preview with Tailwind CSS v4 and `react-native-css`.
- CSS theme variables in `src/global.css` and runtime theme switching through NativeWind variables.
- Native tabs, drawer navigation, nested stack routes, and settings/detail examples.
- EAS build profiles for `development`, `preview`, and `production` channels.
- Dev-client-first scripts using tunnel mode.

## Commands

- `npm run dev` starts the Expo dev server in dev-client mode with tunnel and cache clear.
- `npm run start` starts the Expo dev server in dev-client mode with tunnel.
- `npm run android` starts dev-client mode with tunnel and opens Android.
- `npm run ios` starts dev-client mode with tunnel and opens iOS.
- `npm run run:android` uses `expo run:android` for local native Android install/run.
- `npm run build:android` builds a local Android development APK.
- `npm run build:android:preview` builds a local Android preview APK.
- `npm run build:ios` starts an EAS cloud iOS development build.
- `npm run web` starts the web-only Expo dev server.
- `npm run lint` runs `expo lint`.

## Template Initialization

`npm run init-template` updates:

- `package.json` and `package-lock.json` package names.
- Android local build output filenames.
- `app.json` display name, slug, URL scheme, bundle identifiers, owner, and optional EAS update URL.
- `src/config/app.ts` display metadata used by starter screens.

If you skip the EAS project ID, the script removes `updates.url` and `extra.eas.projectId` from `app.json`. You can add them later with `eas init` or by rerunning equivalent config changes manually.

## Project Structure

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── (home)/
│   │   ├── _layout.tsx
│   │   └── index/
│   │       ├── _layout.tsx
│   │       └── index.tsx
│   └── settings/
│       ├── _layout.tsx
│       ├── detail.tsx
│       └── index.tsx
├── components/
│   ├── AppTabs.tsx
│   ├── ThemeContext.tsx
│   ├── ThemeProvider.tsx
│   └── useNativeTheme.ts
├── config/
│   └── app.ts
└── global.css
```

## Verification

Prefer these checks after template changes:

```bash
npx tsc --noEmit
npx expo config --json
```

Use this bundling check when needed:

```bash
npx expo export --platform web --output-dir /tmp/expo-template-test-build
```
