const fs = require("fs");
const path = require("path");

const versionFile = path.join(__dirname, "..", "lib", "version.ts");
const outputFile = path.join(__dirname, "..", "public", "version.json");

const content = fs.readFileSync(versionFile, "utf8");
const match = content.match(/APP_VERSION\s*=\s*"([^"]+)"/);

if (!match) {
  console.error("Could not find APP_VERSION in lib/version.ts");
  process.exit(1);
}

const version = match[1];
fs.writeFileSync(outputFile, JSON.stringify({ version }));
console.log(`Generated public/version.json → ${version}`);
