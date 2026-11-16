#!/usr/bin/env node
/**
 * Resize the team's real phone photos into the mock API's static folder.
 *
 * Put raw photos in raw-photos/ using the exact file names from
 * docs/PHOTO_SHOT_LIST.md. This script reads the expected names from
 * server/db.json, resizes each match to a maximum width of 800px, writes a
 * JPEG at quality 70 into server/public/images/, and leaves the raw files
 * untouched (raw-photos/ is Git-ignored).
 *
 * Usage:
 *   npm run photos
 */

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'raw-photos');
const OUT_DIR = path.join(ROOT, 'server', 'public', 'images');
const DB_PATH = path.join(ROOT, 'server', 'db.json');

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.tif',
  '.tiff',
]);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function readExpectedFiles() {
  if (!fs.existsSync(DB_PATH)) {
    fail(`Missing ${DB_PATH}. Run this from the unisell project folder.`);
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const listings = Array.isArray(db.listings) ? db.listings : [];

  const expected = listings
    .map((listing) => listing.image)
    .filter(
      (value) =>
        typeof value === 'string' && value.startsWith('/images/'),
    )
    .map((value) => path.basename(value));

  return [...new Set(expected)];
}

function indexRawFiles() {
  const files = fs
    .readdirSync(RAW_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) =>
      SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()),
    );

  const byBaseName = new Map();
  for (const name of files) {
    byBaseName.set(path.parse(name).name.toLowerCase(), name);
  }
  return byBaseName;
}

async function main() {
  const expected = readExpectedFiles();

  if (expected.length === 0) {
    fail(
      'No /images/... paths found in server/db.json. Update the seed listings first.',
    );
  }

  if (!fs.existsSync(RAW_DIR)) {
    fail(
      `Missing ${RAW_DIR}.\n` +
        'Create it and copy the team phone photos there using the names in docs/PHOTO_SHOT_LIST.md.',
    );
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rawByName = indexRawFiles();
  const missing = [];

  for (const targetName of expected) {
    const baseName = path.parse(targetName).name.toLowerCase();
    const rawName = rawByName.get(baseName);

    if (!rawName) {
      missing.push(targetName);
      continue;
    }

    const source = path.join(RAW_DIR, rawName);
    const destination = path.join(OUT_DIR, targetName);

    try {
      await sharp(source)
        .rotate()
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 70, mozjpeg: true })
        .toFile(destination);

      console.log(`OK  ${rawName} -> server/public/images/${targetName}`);
    } catch (error) {
      console.error(
        `ERR ${rawName}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  if (missing.length > 0) {
    console.log(
      `\n${missing.length} expected photo(s) not found in raw-photos/:`,
    );
    for (const name of missing) console.log(`  - ${name}`);
    console.log(
      '\nThe app will show the category icon for those listings until the real photo is added.',
    );
  } else {
    console.log(`\nDone. ${expected.length} photo(s) written to server/public/images/.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
