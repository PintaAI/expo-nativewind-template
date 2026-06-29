#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

const root = path.resolve(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toScheme(value) {
  return toSlug(value).replace(/-/g, "");
}

function toPackageName(value) {
  return toSlug(value).replace(/-/g, "_");
}

function toBundleId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function ask(rl, label, defaultValue) {
  const answer = await rl.question(`${label}${defaultValue ? ` (${defaultValue})` : ""}: `);
  return answer.trim() || defaultValue;
}

function updatePackageJson({ packageName, slug }) {
  const packageJson = readJson("package.json");
  packageJson.name = packageName;
  packageJson.scripts["build:android"] = `eas build --profile development --platform android --local --output ./${slug}-dev.apk`;
  packageJson.scripts["build:android:preview"] = `eas build --profile preview --platform android --local --output ./${slug}-preview.apk`;
  delete packageJson.scripts["init-template"];
  writeJson("package.json", packageJson);
}

function updatePackageLock({ packageName }) {
  const lockPath = path.join(root, "package-lock.json");
  if (!fs.existsSync(lockPath)) {
    return;
  }

  const packageLock = readJson("package-lock.json");
  packageLock.name = packageName;
  if (packageLock.packages && packageLock.packages[""]) {
    packageLock.packages[""].name = packageName;
  }
  writeJson("package-lock.json", packageLock);
}

function updateAppJson({ appName, slug, scheme, bundleId, owner, easProjectId }) {
  const appJson = readJson("app.json");
  const expo = appJson.expo;

  expo.name = appName;
  expo.slug = slug;
  expo.scheme = scheme;
  expo.ios.bundleIdentifier = bundleId;
  expo.android.package = bundleId;

  if (owner) {
    expo.owner = owner;
  } else {
    delete expo.owner;
  }

  expo.extra = expo.extra || {};
  expo.extra.router = expo.extra.router || {};

  if (easProjectId) {
    expo.extra.eas = { projectId: easProjectId };
    expo.updates = { url: `https://u.expo.dev/${easProjectId}` };
  } else {
    delete expo.extra.eas;
    delete expo.updates;
  }

  writeJson("app.json", appJson);
}

function updateAppMetadata({ appName }) {
  const file = path.join(root, "src", "config", "app.ts");
  fs.writeFileSync(
    file,
    `export const APP_NAME = ${JSON.stringify(appName)};\nexport const APP_VERSION = "1.0.0";\n`,
  );
}

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const appName = await ask(rl, "App display name", "My App");
    const slug = toSlug(await ask(rl, "Expo slug", toSlug(appName)));
    const packageName = toPackageName(await ask(rl, "npm package name", slug));
    const scheme = toScheme(await ask(rl, "URL scheme", slug));
    const bundleId = toBundleId(await ask(rl, "iOS/Android bundle ID", `com.example.${scheme}`));
    const owner = await ask(rl, "Expo owner (blank to skip)", "");
    const easProjectId = await ask(rl, "EAS project ID (blank to skip)", "");

    updatePackageJson({ packageName, slug });
    updatePackageLock({ packageName });
    updateAppJson({ appName, slug, scheme, bundleId, owner, easProjectId });
    updateAppMetadata({ appName });

    console.log("\nTemplate initialized.");
    console.log("Next steps:");
    console.log("1. Replace app icons and splash assets in assets/.");
    console.log("2. Run npm install if package-lock.json changed unexpectedly.");
    console.log("3. Run npx expo config --json to verify app config.");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
