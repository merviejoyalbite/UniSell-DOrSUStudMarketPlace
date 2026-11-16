/**
 * Writes the branded app icons from the same mark used by the splash screen:
 * a teal field with a white graduation cap and an orange check dot.
 *
 * Outputs:
 *   assets/icon.png                     1024x1024 iOS / store icon (opaque)
 *   assets/android-icon-foreground.png  1024x1024 adaptive foreground (safe zone)
 *   assets/android-icon-background.png  1024x1024 adaptive background (teal)
 *   assets/android-icon-monochrome.png  1024x1024 themed-icon silhouette
 *   assets/favicon.png                  64x64 web favicon (rounded)
 *
 * Run: node scripts/build-app-icons.js
 */
const path = require('path');
const sharp = require('sharp');

const PRIMARY = '#1F7A72';
const ACCENT = '#F4A261';
const LIGHT_BACKGROUND = '#EAF6F3';

/** Cap + check-dot mark drawn in a 1024x1024 coordinate space. */
function mark({
  scale = 1,
  capFill = '#FFFFFF',
  dotFill = ACCENT,
  checkColor = PRIMARY,
  showDot = true,
  showCheck = true,
}) {
  return `
    <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
      <polygon points="512,300 715,385 512,470 309,385" fill="${capFill}" />
      <path d="M 412 430 L 612 430 L 612 520 Q 612 580 512 580 Q 412 580 412 520 Z" fill="${capFill}" />
      <path d="M 715 385 L 715 466" stroke="${capFill}" stroke-width="16" stroke-linecap="round" />
      <circle cx="715" cy="486" r="18" fill="${capFill}" />
      ${showDot ? `<circle cx="762" cy="742" r="92" fill="${dotFill}" />` : ''}
      ${showCheck
        ? `<path d="M 720 742 L 748 772 L 808 706" stroke="${checkColor}" stroke-width="26"
             stroke-linecap="round" stroke-linejoin="round" fill="none" />`
        : ''}
    </g>`;
}

function svg({ background = null, radius = 0, showMark = true, ...markOptions }) {
  const bg = background
    ? `<rect x="0" y="0" width="1024" height="1024"${radius ? ` rx="${radius}"` : ''} fill="${background}" />`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}${showMark ? mark(markOptions) : ''}</svg>`;
}

const assets = path.join(__dirname, '..', 'assets');

const targets = [
  {
    file: 'icon.png',
    size: 1024,
    // Full-bleed: iOS masks the corners itself, so no rounded rectangle here.
    svg: svg({ background: PRIMARY, scale: 1.1 }),
  },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    // 0.62 keeps the mark inside the adaptive-icon safe zone.
    svg: svg({ scale: 0.62 }),
  },
  {
    file: 'android-icon-background.png',
    size: 1024,
    // Solid colour only: the foreground layer draws the mark.
    svg: svg({ background: PRIMARY, showMark: false }),
  },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    // One alpha shape: no orange dot or check, the launcher supplies the tint.
    svg: svg({ scale: 0.62, capFill: '#FFFFFF', showDot: false, showCheck: false }),
  },
  {
    file: 'favicon.png',
    size: 64,
    svg: svg({ background: PRIMARY, radius: 232, scale: 1.05 }),
  },
];

(async () => {
  for (const target of targets) {
    const output = path.join(assets, target.file);
    const info = await sharp(Buffer.from(target.svg))
      .resize(target.size, target.size)
      .png()
      .toFile(output);
    console.log(`Wrote ${target.file} (${info.width}x${info.height}, ${info.size} bytes).`);
  }
  console.log(`Splash background colours: light ${LIGHT_BACKGROUND}, dark #0B1030.`);
})().catch((error) => {
  console.error('Could not write the app icons:', error.message);
  process.exitCode = 1;
});
