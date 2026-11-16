#!/usr/bin/env node
/**
 * Convert the seeded product illustrations in assets/seed-illustrations/ to
 * 800x800 JPEGs served by json-server from server/public/images/.
 *
 * Usage: npm run seed-images
 */

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets', 'seed-illustrations');
const OUTPUT_DIR = path.join(ROOT, 'server', 'public', 'images');

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Missing source folder: ${SOURCE_DIR}`);
  }

  const svgFiles = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => file.toLowerCase().endsWith('.svg'))
    .sort();

  if (svgFiles.length === 0) {
    throw new Error('No SVG illustrations found in assets/seed-illustrations/.');
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const svgFile of svgFiles) {
    const basename = path.basename(svgFile, path.extname(svgFile));
    const sourcePath = path.join(SOURCE_DIR, svgFile);
    const outputPath = path.join(OUTPUT_DIR, `${basename}.jpg`);

    await sharp(sourcePath)
      .resize(800, 800, { fit: 'cover' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outputPath);

    console.log(`JPG ${basename}.jpg`);
  }

  console.log(`\nConverted ${svgFiles.length} illustrations to ${OUTPUT_DIR}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
