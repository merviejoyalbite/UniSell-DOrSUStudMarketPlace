/**
 * Writes assets/splash-unisell.png.
 *
 * The native splash image mirrors the in-app BrandMark: a rounded teal square
 * with a white graduation cap and an orange check dot. Keeping it as a
 * transparent PNG lets `expo-splash-screen` place it on the light (#EAF6F3) and
 * dark (#0B1030) splash backgrounds without a visible box.
 *
 * Run: node scripts/build-splash-icon.js
 */
const path = require('path');
const sharp = require('sharp');

const PRIMARY = '#1F7A72';
const ACCENT = '#F4A261';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect x="60" y="60" width="904" height="904" rx="253" fill="${PRIMARY}" />
  <polygon points="512,300 715,385 512,470 309,385" fill="#FFFFFF" />
  <path d="M 412 430 L 612 430 L 612 520 Q 612 580 512 580 Q 412 580 412 520 Z" fill="#FFFFFF" />
  <path d="M 715 385 L 715 466" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" />
  <circle cx="715" cy="486" r="18" fill="#FFFFFF" />
  <circle cx="762" cy="742" r="92" fill="${ACCENT}" />
  <path d="M 720 742 L 748 772 L 808 706" stroke="${PRIMARY}" stroke-width="26"
        stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>
`;

const output = path.join(__dirname, '..', 'assets', 'splash-unisell.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(output)
  .then((info) => {
    console.log(`Wrote ${output} (${info.width}x${info.height}, ${info.size} bytes).`);
  })
  .catch((error) => {
    console.error('Could not write the splash image:', error.message);
    process.exitCode = 1;
  });
