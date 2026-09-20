/**
 * Memastikan seluruh sumber metadata rilis DuitQu memakai versi yang sama.
 * Script validasi ini sengaja memakai CommonJS agar dapat dijalankan Node.js.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const packageVersion = require(path.join(root, "package.json")).version;
const versionSource = fs.readFileSync(path.join(root, "lib", "version.ts"), "utf8");
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
const generated = JSON.parse(fs.readFileSync(path.join(root, "public", "version.json"), "utf8"));

const appVersion = versionSource.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const changelogVersion = changelog.match(/^## \[([^\]]+)\]/m)?.[1];
const versions = {
  "package.json": packageVersion,
  "lib/version.ts": appVersion,
  "CHANGELOG.md": changelogVersion,
  "public/version.json": generated.version,
};

const mismatches = Object.entries(versions).filter(([, version]) => version !== packageVersion);
if (mismatches.length > 0) {
  console.error("Release versions are not synchronized:");
  for (const [source, version] of Object.entries(versions)) {
    console.error(`- ${source}: ${version ?? "missing"}`);
  }
  process.exit(1);
}

console.log(`Release versions synchronized at ${packageVersion}`);
