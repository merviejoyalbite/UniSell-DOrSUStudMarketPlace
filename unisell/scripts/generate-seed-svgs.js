#!/usr/bin/env node
/**
 * Generate the 18 seeded product illustrations as standalone SVG files.
 *
 * These are original vector illustrations made for the UniSell demo. They are
 * not photos, stock images or traced copyrighted artwork. The `seed-images`
 * script converts them to 800x800 JPEGs for the mock API.
 *
 * Usage: node scripts/generate-seed-svgs.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'seed-illustrations');
const DB_PATH = path.join(ROOT, 'server', 'db.json');

function buttonGrid({ x, y, cols, rows, size, gap, fill = '#DFF2ED', stroke = '#0A4F47', rx = 7 }) {
  let out = '';
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      out += `<rect x="${x + col * (size + gap)}" y="${y + row * (size + gap)}" width="${size}" height="${size}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    }
  }
  return out;
}

function fanBlade(angle) {
  return `<path d="M400 360 C362 314 352 248 400 232 C448 248 438 314 400 360 Z" fill="#168578" opacity="0.9" transform="rotate(${angle} 400 360)"/>`;
}

function breadboardHoles() {
  let out = '';
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      out += `<circle cx="${215 + col * 18}" cy="${505 + row * 14}" r="2.6" fill="#9FC9C0"/>`;
    }
  }
  return out;
}

function spiralBinding(x, y, count, gap) {
  let out = '';
  for (let index = 0; index < count; index += 1) {
    out += `<circle cx="${x}" cy="${y + index * gap}" r="7" fill="#F2994A" stroke="#D97F32" stroke-width="2"/>`;
  }
  return out;
}

function svgWrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" font-family="Segoe UI, Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F8FCFB"/>
      <stop offset="1" stop-color="#E1F1EC"/>
    </linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#168578"/>
      <stop offset="1" stop-color="#0E6A5F"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F6B26B"/>
      <stop offset="1" stop-color="#F2994A"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="400" cy="360" r="275" fill="#FFFFFF" opacity="0.45"/>
  <circle cx="680" cy="130" r="60" fill="#DFF2ED" opacity="0.75"/>
  <circle cx="120" cy="665" r="44" fill="#FDEBDD" opacity="0.85"/>
  <ellipse cx="400" cy="665" rx="235" ry="28" fill="#0E3B33" opacity="0.10" filter="url(#shadow)"/>
  <g stroke-linecap="round" stroke-linejoin="round">
    ${body}
  </g>
</svg>`;
}

const BODIES = {
  1: `
    <g transform="rotate(-4 400 400)">
      <rect x="210" y="520" width="380" height="70" rx="12" fill="#0A4F47"/>
      <rect x="210" y="520" width="20" height="70" rx="10" fill="#DFF2ED" opacity="0.9"/>
      <rect x="190" y="450" width="420" height="78" rx="14" fill="url(#orange)"/>
      <rect x="190" y="450" width="22" height="78" rx="11" fill="#FFF4E8" opacity="0.95"/>
      <rect x="215" y="330" width="370" height="130" rx="16" fill="url(#teal)"/>
      <rect x="215" y="330" width="370" height="130" rx="16" fill="none" stroke="#0A4F47" stroke-width="3" opacity="0.25"/>
      <rect x="245" y="360" width="190" height="10" rx="5" fill="#FFFFFF" opacity="0.85"/>
      <text x="245" y="408" font-size="34" font-weight="700" fill="#FFFFFF">CALCULUS</text>
      <text x="245" y="438" font-size="16" fill="#DFF2ED">EARLY TRANSCENDENTALS · 8TH ED.</text>
      <path d="M520 330 h34 v72 l-17 -13 -17 13z" fill="url(#orange)"/>
      <path d="M590 360 h18 M590 380 h18 M590 400 h18 M590 420 h18" stroke="#DFF2ED" stroke-width="4" opacity="0.7"/>
      <circle cx="520" cy="515" r="20" fill="#FDEBDD"/>
      <text x="520" y="522" text-anchor="middle" font-size="16" font-weight="700" fill="#0E6A5F">8</text>
    </g>
  `,
  2: `
    <g>
      <rect x="245" y="500" width="310" height="120" rx="20" fill="url(#orange)"/>
      <rect x="245" y="500" width="310" height="24" rx="12" fill="#FDEBDD"/>
      <path d="M400 500 v120" stroke="#D97F32" stroke-width="4" opacity="0.5"/>
      <path d="M300 548 h70 M430 548 h70" stroke="#FFF4E8" stroke-width="6" opacity="0.75"/>
      <rect x="225" y="330" width="350" height="190" rx="24" fill="url(#teal)"/>
      <rect x="225" y="330" width="350" height="42" rx="21" fill="#168578"/>
      <path d="M330 330 l70 52 70 -52" fill="#DFF2ED" opacity="0.9"/>
      <path d="M330 330 l70 52 70 -52" fill="none" stroke="#0A4F47" stroke-width="4" opacity="0.35"/>
      <text x="400" y="445" text-anchor="middle" font-size="30" font-weight="700" fill="#FFFFFF">DOrSU PE</text>
      <text x="400" y="477" text-anchor="middle" font-size="17" fill="#DFF2ED">MEDIUM · FOLDED</text>
      <path d="M225 382 q-28 20 -10 48" stroke="#0A4F47" stroke-width="5" fill="none" opacity="0.25"/>
      <path d="M575 382 q28 20 10 48" stroke="#0A4F47" stroke-width="5" fill="none" opacity="0.25"/>
      <rect x="225" y="490" width="350" height="12" fill="url(#orange)"/>
      <rect x="315" y="520" width="170" height="28" rx="14" fill="#FFF4E8"/>
      <text x="400" y="540" text-anchor="middle" font-size="14" font-weight="700" fill="#0E6A5F">PE UNIFORM</text>
    </g>
  `,
  3: `
    <g transform="rotate(-3 400 400)">
      <rect x="225" y="180" width="350" height="460" rx="34" fill="#173033"/>
      <rect x="245" y="200" width="310" height="420" rx="24" fill="#223F42"/>
      <text x="275" y="235" font-size="18" font-weight="700" fill="#DFF2ED">TI-84 Plus CE</text>
      <rect x="275" y="250" width="250" height="150" rx="12" fill="#DFF2ED"/>
      <rect x="275" y="250" width="250" height="150" rx="12" fill="none" stroke="#0A4F47" stroke-width="4" opacity="0.25"/>
      <path d="M300 320 h200 M400 270 v110" stroke="#9FC9C0" stroke-width="2"/>
      <path d="M300 365 Q350 250 400 320 T500 285" fill="none" stroke="#F2994A" stroke-width="5"/>
      <circle cx="500" cy="285" r="5" fill="#F2994A"/>
      ${buttonGrid({ x: 285, y: 435, cols: 5, rows: 4, size: 38, gap: 10 })}
      <rect x="285" y="587" width="88" height="22" rx="11" fill="#F2994A"/>
      <rect x="383" y="587" width="88" height="22" rx="11" fill="#168578"/>
      <rect x="481" y="587" width="58" height="22" rx="11" fill="#DFF2ED"/>
      <circle cx="550" cy="225" r="10" fill="#F2994A"/>
    </g>
  `,
  4: `
    <g>
      <path d="M400 168 v42" stroke="#0E6A5F" stroke-width="8"/>
      <path d="M400 210 L250 300 M400 210 L550 300" stroke="#0E6A5F" stroke-width="8"/>
      <path d="M250 300 q150 -42 300 0" fill="none" stroke="#0E6A5F" stroke-width="8"/>
      <circle cx="400" cy="164" r="11" fill="#F2994A"/>
      <path d="M300 260 L400 300 L500 260 L560 340 L520 370 L520 610 Q400 650 280 610 L280 370 L240 340 Z" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <path d="M300 280 L220 420 L275 450 L340 340" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <path d="M500 280 L580 420 L525 450 L460 340" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <path d="M350 270 L400 330 L450 270" fill="none" stroke="#0E6A5F" stroke-width="6"/>
      <circle cx="400" cy="370" r="6" fill="#0E6A5F"/>
      <circle cx="400" cy="410" r="6" fill="#0E6A5F"/>
      <circle cx="400" cy="450" r="6" fill="#0E6A5F"/>
      <rect x="310" y="500" width="70" height="70" rx="8" fill="#F6FAF9" stroke="#DCEAE6" stroke-width="3"/>
      <rect x="420" y="500" width="70" height="70" rx="8" fill="#F6FAF9" stroke="#DCEAE6" stroke-width="3"/>
      <rect x="325" y="405" width="44" height="18" rx="9" fill="#F2994A"/>
      <text x="347" y="419" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">DOrSU</text>
      <path d="M505 520 h12 v36 h-12z" fill="#0E6A5F" opacity="0.75"/>
    </g>
  `,
  5: `
    <g>
      <path d="M220 420 L400 360 L580 420 L580 610 L400 670 L220 610 Z" fill="#0E6A5F"/>
      <path d="M220 420 L400 480 L580 420" fill="#168578"/>
      <path d="M400 480 L400 670" stroke="#0A4F47" stroke-width="4" opacity="0.3"/>
      <path d="M220 420 L400 360 L580 420 L400 480 Z" fill="url(#orange)"/>
      <rect x="300" y="520" width="200" height="92" rx="14" fill="#FFF4E8"/>
      <text x="400" y="556" text-anchor="middle" font-size="22" font-weight="700" fill="#0E6A5F">BROWNIES</text>
      <text x="400" y="584" text-anchor="middle" font-size="15" fill="#56666A">BOX OF 6 · HOMEMADE</text>
      <g>
        <rect x="270" y="300" width="92" height="72" rx="12" fill="#5A3423"/>
        <rect x="354" y="300" width="92" height="72" rx="12" fill="#5A3423"/>
        <rect x="438" y="300" width="92" height="72" rx="12" fill="#5A3423"/>
        <rect x="312" y="372" width="92" height="72" rx="12" fill="#5A3423"/>
        <rect x="396" y="372" width="92" height="72" rx="12" fill="#5A3423"/>
        <rect x="480" y="372" width="92" height="72" rx="12" fill="#5A3423"/>
        <g fill="#7A4A32">
          <rect x="278" y="306" width="76" height="16" rx="8"/>
          <rect x="362" y="306" width="76" height="16" rx="8"/>
          <rect x="446" y="306" width="76" height="16" rx="8"/>
          <rect x="320" y="378" width="76" height="16" rx="8"/>
          <rect x="404" y="378" width="76" height="16" rx="8"/>
          <rect x="488" y="378" width="76" height="16" rx="8"/>
        </g>
        <g fill="#F2994A" opacity="0.8">
          <circle cx="292" cy="344" r="4"/>
          <circle cx="330" cy="336" r="3"/>
          <circle cx="376" cy="346" r="4"/>
          <circle cx="418" cy="334" r="3"/>
          <circle cx="460" cy="344" r="4"/>
          <circle cx="502" cy="338" r="3"/>
        </g>
      </g>
      <path d="M230 612 Q400 660 570 612" fill="none" stroke="#FDEBDD" stroke-width="8" opacity="0.5"/>
    </g>
  `,
  6: `
    <g>
      <ellipse cx="400" cy="620" rx="120" ry="26" fill="#0A4F47" opacity="0.14" filter="url(#softShadow)"/>
      <rect x="350" y="555" width="100" height="62" rx="20" fill="#0E6A5F"/>
      <ellipse cx="400" cy="555" rx="50" ry="16" fill="#168578"/>
      <rect x="380" y="470" width="40" height="100" rx="16" fill="#0E6A5F"/>
      <circle cx="400" cy="360" r="190" fill="#DFF2ED"/>
      <circle cx="400" cy="360" r="180" fill="#FFFFFF" stroke="#0E6A5F" stroke-width="10"/>
      ${fanBlade(0)}
      ${fanBlade(90)}
      ${fanBlade(180)}
      ${fanBlade(270)}
      <circle cx="400" cy="360" r="28" fill="#F2994A"/>
      <circle cx="400" cy="360" r="12" fill="#FFFFFF" opacity="0.85"/>
      <circle cx="400" cy="360" r="140" fill="none" stroke="#9FC9C0" stroke-width="4"/>
      <circle cx="400" cy="360" r="95" fill="none" stroke="#9FC9C0" stroke-width="4"/>
      <path d="M400 190 L400 530 M230 360 L570 360 M280 240 L520 480 M520 240 L280 480" stroke="#9FC9C0" stroke-width="3" opacity="0.8"/>
      <circle cx="345" cy="585" r="9" fill="#F2994A"/>
      <circle cx="380" cy="585" r="9" fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3"/>
      <circle cx="415" cy="585" r="9" fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3"/>
      <circle cx="450" cy="585" r="9" fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3"/>
      <rect x="300" y="626" width="200" height="26" rx="13" fill="#FFFFFF" opacity="0.9"/>
      <text x="400" y="644" text-anchor="middle" font-size="13" font-weight="700" fill="#0E6A5F">12 INCH · DORM SIZE</text>
    </g>
  `,
  7: `
    <g transform="rotate(4 400 400)">
      <rect x="250" y="210" width="300" height="410" rx="18" fill="#0A4F47"/>
      <rect x="270" y="210" width="280" height="410" rx="14" fill="url(#teal)"/>
      <rect x="270" y="210" width="28" height="410" rx="12" fill="#0A4F47"/>
      <rect x="360" y="300" width="80" height="24" rx="8" fill="#FFFFFF"/>
      <rect x="388" y="272" width="24" height="80" rx="8" fill="#FFFFFF"/>
      <text x="410" y="410" text-anchor="middle" font-size="29" font-weight="700" fill="#FFFFFF">NURSING</text>
      <text x="410" y="444" text-anchor="middle" font-size="15" fill="#DFF2ED">FUNDAMENTALS · 11TH ED.</text>
      <path d="M500 210 h30 v80 l-15 -12 -15 12z" fill="url(#orange)"/>
      <path d="M530 470 h20 M530 490 h20 M530 510 h20 M530 530 h20" stroke="#DFF2ED" stroke-width="4" opacity="0.65"/>
      <rect x="320" y="500" width="160" height="58" rx="12" fill="#FFF4E8"/>
      <text x="400" y="524" text-anchor="middle" font-size="14" font-weight="700" fill="#0E6A5F">STUDENT NURSE</text>
      <text x="400" y="544" text-anchor="middle" font-size="11" fill="#56666A">DOrSU COLLEGE OF NURSING</text>
    </g>
  `,
  8: `
    <g transform="rotate(2 400 400)">
      <rect x="240" y="170" width="320" height="470" rx="30" fill="#173033"/>
      <rect x="260" y="190" width="280" height="430" rx="22" fill="#223F42"/>
      <rect x="290" y="210" width="220" height="50" rx="10" fill="#0A4F47"/>
      <path d="M330 210 v50 M370 210 v50 M410 210 v50 M450 210 v50" stroke="#168578" stroke-width="3"/>
      <rect x="290" y="280" width="220" height="90" rx="10" fill="#DFF2ED"/>
      <text x="305" y="312" font-size="15" font-weight="700" fill="#0A4F47">fx-991EX</text>
      <text x="305" y="348" font-size="24" font-weight="700" fill="#173033">0.7071</text>
      ${buttonGrid({ x: 300, y: 405, cols: 5, rows: 5, size: 30, gap: 9 })}
      <rect x="300" y="585" width="66" height="20" rx="10" fill="#F2994A"/>
      <rect x="375" y="585" width="66" height="20" rx="10" fill="#168578"/>
      <rect x="450" y="585" width="66" height="20" rx="10" fill="#DFF2ED"/>
      <text x="400" y="230" text-anchor="middle" font-size="11" font-weight="700" fill="#DFF2ED">SCIENTIFIC</text>
    </g>
  `,
  9: `
    <g>
      <path d="M300 168 C230 260 230 380 300 470" fill="none" stroke="#0E6A5F" stroke-width="24"/>
      <path d="M500 168 C570 260 570 380 500 470" fill="none" stroke="#0E6A5F" stroke-width="24"/>
      <path d="M300 168 C230 260 230 380 300 470" fill="none" stroke="#F2994A" stroke-width="8" stroke-dasharray="16 18"/>
      <path d="M500 168 C570 260 570 380 500 470" fill="none" stroke="#F2994A" stroke-width="8" stroke-dasharray="16 18"/>
      <rect x="370" y="440" width="60" height="42" rx="10" fill="#173033"/>
      <rect x="385" y="470" width="30" height="20" rx="6" fill="#F2994A"/>
      <rect x="280" y="480" width="240" height="150" rx="20" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <rect x="280" y="480" width="240" height="34" rx="17" fill="#0E6A5F"/>
      <text x="400" y="504" text-anchor="middle" font-size="16" font-weight="700" fill="#FFFFFF">DOrSU</text>
      <circle cx="335" cy="558" r="26" fill="#DFF2ED"/>
      <circle cx="335" cy="550" r="10" fill="#9FC9C0"/>
      <path d="M315 578 q20 -18 40 0" fill="#9FC9C0"/>
      <rect x="375" y="542" width="110" height="8" rx="4" fill="#DCEAE6"/>
      <rect x="375" y="559" width="80" height="8" rx="4" fill="#DCEAE6"/>
      <rect x="375" y="576" width="95" height="8" rx="4" fill="#DCEAE6"/>
      <rect x="280" y="600" width="240" height="30" rx="15" fill="url(#orange)"/>
      <text x="400" y="620" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF">STUDENT ID</text>
    </g>
  `,
  10: `
    <g transform="rotate(-4 400 400)">
      <rect x="230" y="230" width="340" height="420" rx="12" fill="#F6FAF9" stroke="#DCEAE6" stroke-width="3"/>
      <rect x="245" y="215" width="340" height="420" rx="12" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="3"/>
      <rect x="260" y="200" width="340" height="420" rx="12" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <rect x="260" y="200" width="340" height="70" rx="12" fill="#0E6A5F"/>
      <text x="285" y="232" font-size="20" font-weight="700" fill="#FFFFFF">IT FUNDAMENTALS</text>
      <text x="285" y="254" font-size="13" fill="#DFF2ED">REVIEW NOTES · PHOTOCOPY</text>
      <rect x="290" y="300" width="250" height="10" rx="5" fill="#DCEAE6"/>
      <rect x="290" y="325" width="220" height="10" rx="5" fill="#DCEAE6"/>
      <rect x="290" y="350" width="240" height="10" rx="5" fill="#DCEAE6"/>
      <rect x="290" y="385" width="180" height="14" rx="7" fill="#FDEBDD"/>
      <rect x="290" y="415" width="220" height="10" rx="5" fill="#DCEAE6"/>
      <rect x="290" y="440" width="190" height="10" rx="5" fill="#DCEAE6"/>
      <rect x="290" y="465" width="235" height="10" rx="5" fill="#DCEAE6"/>
      <rect x="290" y="490" width="160" height="10" rx="5" fill="#DCEAE6"/>
      <path d="M560 220 v90 q0 20 -20 20 q-20 0 -20 -20 v-70" fill="none" stroke="#F2994A" stroke-width="8"/>
      <text x="490" y="555" font-size="42" font-weight="700" fill="#0E6A5F" opacity="0.25">&lt;/&gt;</text>
    </g>
  `,
  11: `
    <g>
      <ellipse cx="400" cy="625" rx="130" ry="24" fill="#0A4F47" opacity="0.12" filter="url(#softShadow)"/>
      <path d="M250 360 Q250 620 400 620 Q550 620 550 360 Z" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <ellipse cx="400" cy="360" rx="150" ry="45" fill="#DFF2ED"/>
      <ellipse cx="400" cy="360" rx="150" ry="45" fill="none" stroke="#0E6A5F" stroke-width="5"/>
      <path d="M260 350 Q400 270 540 350" fill="url(#teal)"/>
      <path d="M260 350 Q400 270 540 350" fill="none" stroke="#0A4F47" stroke-width="5"/>
      <path d="M300 300 Q400 240 500 300" fill="none" stroke="#F2994A" stroke-width="18"/>
      <rect x="385" y="275" width="30" height="22" rx="8" fill="#F2994A"/>
      <rect x="330" y="470" width="140" height="80" rx="16" fill="#F6FAF9" stroke="#DCEAE6" stroke-width="3"/>
      <text x="400" y="505" text-anchor="middle" font-size="20" font-weight="700" fill="#0E6A5F">1.2L</text>
      <circle cx="365" cy="530" r="10" fill="#F2994A"/>
      <circle cx="400" cy="530" r="10" fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3"/>
      <circle cx="435" cy="530" r="10" fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3"/>
      <rect x="300" y="610" width="40" height="18" rx="9" fill="#0A4F47"/>
      <rect x="460" y="610" width="40" height="18" rx="9" fill="#0A4F47"/>
      <path d="M370 240 q-10 -20 0 -40 M400 230 q-10 -20 0 -40 M430 240 q-10 -20 0 -40" stroke="#9FC9C0" stroke-width="5" fill="none" opacity="0.8"/>
    </g>
  `,
  12: `
    <g>
      <rect x="230" y="220" width="340" height="380" rx="10" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <rect x="250" y="240" width="300" height="180" rx="8" fill="#0E6A5F"/>
      <circle cx="330" cy="310" r="42" fill="#F2994A"/>
      <path d="M270 390 L370 290 L450 390 Z" fill="#DFF2ED" opacity="0.8"/>
      <text x="400" y="470" text-anchor="middle" font-size="28" font-weight="700" fill="#173033">CAMPUS PRINT</text>
      <text x="400" y="500" text-anchor="middle" font-size="16" fill="#56666A">POSTER / TARPAULIN</text>
      <g transform="rotate(-12 400 540)">
        <rect x="250" y="520" width="300" height="90" rx="45" fill="url(#orange)"/>
        <ellipse cx="250" cy="565" rx="18" ry="45" fill="#FDEBDD"/>
        <ellipse cx="550" cy="565" rx="18" ry="45" fill="#D97F32"/>
        <path d="M300 520 v90 M360 520 v90 M420 520 v90 M480 520 v90" stroke="#FDEBDD" stroke-width="6" opacity="0.5"/>
      </g>
      <rect x="590" y="300" width="40" height="180" rx="8" fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3"/>
      <path d="M590 330 h20 M590 360 h14 M590 390 h20 M590 420 h14 M590 450 h20" stroke="#0E6A5F" stroke-width="3"/>
      <text x="610" y="500" text-anchor="middle" font-size="12" font-weight="700" fill="#0E6A5F">SQ FT</text>
    </g>
  `,
  13: `
    <g>
      <g transform="rotate(-8 430 470)">
        <path d="M250 470 Q250 420 310 420 L390 420 Q430 420 460 450 L560 500 Q600 520 600 550 L600 570 Q600 590 580 590 L280 590 Q250 590 250 560 Z" fill="#F6FAF9" stroke="#DCEAE6" stroke-width="4"/>
        <path d="M250 560 Q400 600 600 560 L600 580 Q600 600 580 600 L280 600 Q250 600 250 580 Z" fill="#0E6A5F"/>
        <path d="M330 440 L390 500 M360 430 L420 490" stroke="#F2994A" stroke-width="6"/>
      </g>
      <g transform="rotate(4 400 520)">
        <path d="M220 520 Q220 470 280 470 L360 470 Q400 470 430 500 L530 550 Q570 570 570 600 L570 620 Q570 640 550 640 L250 640 Q220 640 220 610 Z" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
        <path d="M220 610 Q400 650 570 610 L570 630 Q570 650 550 650 L250 650 Q220 650 220 630 Z" fill="#0E6A5F"/>
        <path d="M300 500 L370 570 M330 490 L400 560 M360 480 L430 550" stroke="#F2994A" stroke-width="7"/>
        <circle cx="285" cy="600" r="8" fill="#F2994A"/>
      </g>
    </g>
  `,
  14: `
    <g>
      <ellipse cx="400" cy="625" rx="130" ry="24" fill="#0A4F47" opacity="0.12" filter="url(#softShadow)"/>
      <rect x="300" y="590" width="200" height="40" rx="20" fill="#0E6A5F"/>
      <path d="M400 590 L400 420 L300 300" stroke="#0E6A5F" stroke-width="22" fill="none"/>
      <circle cx="400" cy="420" r="18" fill="#F2994A"/>
      <path d="M300 300 L210 360 L300 420 Z" fill="#0E6A5F"/>
      <path d="M300 300 L210 360 L300 420 Z" fill="none" stroke="#0A4F47" stroke-width="4"/>
      <path d="M210 360 L120 480 L300 480 Z" fill="#FDEBDD" opacity="0.65"/>
      <circle cx="230" cy="360" r="14" fill="#F2994A"/>
      <rect x="360" y="560" width="80" height="26" rx="8" fill="#173033"/>
      <rect x="375" y="568" width="50" height="10" rx="4" fill="#DFF2ED"/>
      <text x="400" y="552" text-anchor="middle" font-size="12" font-weight="700" fill="#DFF2ED">USB</text>
    </g>
  `,
  15: `
    <g>
      <rect x="180" y="470" width="440" height="150" rx="18" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
      <rect x="200" y="490" width="400" height="110" rx="10" fill="#F6FAF9"/>
      ${breadboardHoles()}
      <path d="M200 535 h400" stroke="#DCEAE6" stroke-width="3"/>
      <rect x="250" y="250" width="300" height="200" rx="18" fill="#0E6A5F"/>
      <rect x="270" y="270" width="260" height="160" rx="10" fill="#168578"/>
      <rect x="350" y="320" width="100" height="60" rx="6" fill="#173033"/>
      <text x="400" y="356" text-anchor="middle" font-size="14" font-weight="700" fill="#DFF2ED">UNO</text>
      <g fill="#F2994A">
        <rect x="300" y="270" width="18" height="14" rx="3"/>
        <rect x="330" y="270" width="18" height="14" rx="3"/>
        <rect x="360" y="270" width="18" height="14" rx="3"/>
        <rect x="390" y="270" width="18" height="14" rx="3"/>
        <rect x="420" y="270" width="18" height="14" rx="3"/>
        <rect x="450" y="270" width="18" height="14" rx="3"/>
        <rect x="480" y="270" width="18" height="14" rx="3"/>
      </g>
      <g fill="#F2994A">
        <rect x="300" y="416" width="18" height="14" rx="3"/>
        <rect x="330" y="416" width="18" height="14" rx="3"/>
        <rect x="360" y="416" width="18" height="14" rx="3"/>
        <rect x="390" y="416" width="18" height="14" rx="3"/>
        <rect x="420" y="416" width="18" height="14" rx="3"/>
        <rect x="450" y="416" width="18" height="14" rx="3"/>
        <rect x="480" y="416" width="18" height="14" rx="3"/>
      </g>
      <rect x="250" y="300" width="40" height="50" rx="6" fill="#173033"/>
      <path d="M300 250 C240 180 200 200 180 250" fill="none" stroke="#F2994A" stroke-width="8"/>
      <path d="M350 250 C330 180 280 180 260 230" fill="none" stroke="#DFF2ED" stroke-width="8"/>
      <path d="M450 250 C500 180 550 200 580 260" fill="none" stroke="#F2994A" stroke-width="8"/>
      <path d="M500 250 C540 220 580 230 600 280" fill="none" stroke="#DFF2ED" stroke-width="8"/>
      <circle cx="500" cy="300" r="10" fill="#F2994A"/>
      <rect x="300" y="380" width="40" height="20" rx="4" fill="#DFF2ED"/>
      <rect x="350" y="380" width="24" height="20" rx="4" fill="#F2994A"/>
      <rect x="390" y="380" width="60" height="20" rx="4" fill="#DFF2ED"/>
    </g>
  `,
  16: `
    <g transform="rotate(-4 400 400)">
      <rect x="240" y="210" width="330" height="420" rx="16" fill="#0A4F47"/>
      <rect x="260" y="225" width="330" height="420" rx="12" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="3"/>
      ${spiralBinding(265, 255, 10, 36)}
      <rect x="260" y="225" width="330" height="80" rx="12" fill="#0E6A5F"/>
      <text x="425" y="258" text-anchor="middle" font-size="24" font-weight="700" fill="#FFFFFF">ACCOUNTING</text>
      <text x="425" y="282" text-anchor="middle" font-size="13" fill="#DFF2ED">WORKBOOK · BRAND NEW</text>
      <path d="M300 340 h250 M300 380 h250 M300 420 h250 M300 460 h250 M300 500 h250 M300 540 h250" stroke="#DCEAE6" stroke-width="3"/>
      <path d="M370 320 v250 M450 320 v250 M530 320 v250" stroke="#DCEAE6" stroke-width="3"/>
      <text x="315" y="370" font-size="14" fill="#56666A">1000</text>
      <text x="385" y="370" font-size="14" fill="#56666A">250</text>
      <text x="465" y="370" font-size="14" fill="#56666A">1250</text>
      <text x="315" y="410" font-size="14" fill="#56666A">2000</text>
      <text x="385" y="410" font-size="14" fill="#56666A">500</text>
      <text x="465" y="410" font-size="14" fill="#56666A">2500</text>
      <path d="M540 225 h30 v80 l-15 -12 -15 12z" fill="#F2994A"/>
      <g transform="rotate(20 600 500)">
        <rect x="580" y="420" width="18" height="160" rx="8" fill="#F2994A"/>
        <path d="M580 580 l9 20 9 -20z" fill="#173033"/>
      </g>
    </g>
  `,
  17: `
    <g>
      <path d="M270 260 L530 260 L550 610 Q400 640 250 610 Z" fill="#0E6A5F"/>
      <path d="M270 260 L530 260 L520 300 L280 300 Z" fill="#0A4F47"/>
      <rect x="270" y="240" width="260" height="30" rx="10" fill="url(#orange)"/>
      <path d="M290 255 h220" stroke="#FDEBDD" stroke-width="4" stroke-dasharray="10 8"/>
      <rect x="300" y="340" width="200" height="180" rx="18" fill="#FFF4E8"/>
      <text x="400" y="385" text-anchor="middle" font-size="24" font-weight="700" fill="#0E6A5F">LOCAL ROAST</text>
      <text x="400" y="415" text-anchor="middle" font-size="15" fill="#56666A">ICED COFFEE BEANS</text>
      <text x="400" y="470" text-anchor="middle" font-size="34" font-weight="700" fill="#F2994A">250g</text>
      <ellipse cx="400" cy="505" rx="18" ry="12" fill="#173033" transform="rotate(-20 400 505)"/>
      <path d="M390 500 q10 10 20 0" stroke="#FFF4E8" stroke-width="2" fill="none"/>
      <path d="M290 320 Q300 450 290 590" stroke="#168578" stroke-width="10" opacity="0.5" fill="none"/>
      <g fill="#173033">
        <ellipse cx="220" cy="600" rx="18" ry="12" transform="rotate(-20 220 600)"/>
        <ellipse cx="270" cy="625" rx="16" ry="11" transform="rotate(18 270 625)"/>
        <ellipse cx="580" cy="600" rx="18" ry="12" transform="rotate(25 580 600)"/>
        <ellipse cx="535" cy="630" rx="16" ry="11" transform="rotate(-15 535 630)"/>
      </g>
      <g fill="#7A4A32" opacity="0.7">
        <path d="M212 596 q8 8 16 0" stroke="#FFF4E8" stroke-width="2" fill="none"/>
        <path d="M572 596 q8 8 16 0" stroke="#FFF4E8" stroke-width="2" fill="none"/>
      </g>
    </g>
  `,
  18: `
    <g>
      <path d="M300 390 C260 410 240 450 240 500 C240 560 200 590 170 570 C140 550 150 500 170 470 C180 455 190 445 200 440" fill="none" stroke="#173033" stroke-width="18"/>
      <rect x="150" y="410" width="50" height="50" rx="10" fill="#F2994A"/>
      <path d="M165 410 v-20 M185 410 v-20" stroke="#173033" stroke-width="8"/>
      <g transform="rotate(-8 430 360)">
        <rect x="300" y="270" width="280" height="180" rx="24" fill="#FFFFFF" stroke="#DCEAE6" stroke-width="4"/>
        <rect x="300" y="270" width="280" height="50" rx="24" fill="#0E6A5F"/>
        <text x="440" y="302" text-anchor="middle" font-size="16" font-weight="700" fill="#FFFFFF">4 SOCKETS · 3m</text>
        <g fill="#DFF2ED" stroke="#0E6A5F" stroke-width="3">
          <circle cx="345" cy="370" r="22"/>
          <circle cx="405" cy="370" r="22"/>
          <circle cx="465" cy="370" r="22"/>
          <circle cx="525" cy="370" r="22"/>
        </g>
        <g fill="#173033">
          <circle cx="338" cy="370" r="4"/>
          <circle cx="352" cy="370" r="4"/>
          <circle cx="398" cy="370" r="4"/>
          <circle cx="412" cy="370" r="4"/>
          <circle cx="458" cy="370" r="4"/>
          <circle cx="472" cy="370" r="4"/>
          <circle cx="518" cy="370" r="4"/>
          <circle cx="532" cy="370" r="4"/>
        </g>
        <rect x="480" y="415" width="50" height="20" rx="10" fill="#F2994A"/>
        <circle cx="505" cy="425" r="5" fill="#FFF4E8"/>
      </g>
    </g>
  `,
};

function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const seedListings = db.listings.filter(
    (listing) => typeof listing.image === 'string' && listing.image.startsWith('/images/'),
  );

  if (seedListings.length !== 18) {
    throw new Error(`Expected 18 seeded listings, found ${seedListings.length}.`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const listing of seedListings) {
    const body = BODIES[listing.id];
    if (!body) {
      throw new Error(`No illustration body for listing ${listing.id} (${listing.title}).`);
    }

    const basename = path.basename(listing.image, path.extname(listing.image));
    const outputPath = path.join(OUT_DIR, `${basename}.svg`);
    fs.writeFileSync(outputPath, svgWrap(body), 'utf8');
    console.log(`SVG ${basename}.svg`);
  }

  console.log(`\nWrote ${seedListings.length} seed illustration SVGs to assets/seed-illustrations/.`);
}

main();
