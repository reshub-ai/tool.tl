/**
 * Generates Open Graph images:
 *  - /public/og-default.png       (site-wide fallback, 1200×630)
 *  - /public/og/[slug].png        (per-tool image, 1200×630)
 * Run: node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/tools.json'), 'utf8')
);

const ogDir = path.join(__dirname, '../public/og');
if (!fs.existsSync(ogDir)) fs.mkdirSync(ogDir, { recursive: true });

const categoryConfig = {
  pdf:      { label: 'PDF Tools',       color: '#1e40af' },
  image:    { label: 'Image Tools',     color: '#065f46' },
  barcode:  { label: 'Barcode & QR',    color: '#4c1d95' },
  dev:      { label: 'Developer Tools', color: '#312e81' },
  network:  { label: 'Network Tools',   color: '#164e63' },
  email:    { label: 'Email Tools',     color: '#92400e' },
  finance:  { label: 'Finance Tools',   color: '#78350f' },
  password: { label: 'Password Tools',  color: '#7f1d1d' },
  video:    { label: 'Video Tools',     color: '#831843' },
  health:   { label: 'Health Tools',    color: '#134e4a' },
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function titleFontSize(name) {
  if (name.length <= 15) return 68;
  if (name.length <= 22) return 54;
  if (name.length <= 30) return 44;
  return 36;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function makeToolSvg(name, category, description) {
  const cat = categoryConfig[category] || { label: 'Online Tools', color: '#1e40af' };
  const fontSize = titleFontSize(name);
  const safeName = esc(name);
  const safeDesc = esc(truncate(description || '', 68));
  const safeLabel = esc(cat.label);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="1.5" fill="#ffffff" opacity="0.06"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <rect x="0" y="0" width="6" height="630" fill="${cat.color}"/>

  <rect x="80" y="56" width="${safeLabel.length * 11 + 40}" height="40" rx="20" fill="${cat.color}" opacity="0.85"/>
  <text x="${safeLabel.length * 5.5 + 80}" y="76" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="600">${safeLabel}</text>

  <text x="80" y="280" font-family="system-ui,Arial,sans-serif" font-size="${fontSize}" font-weight="800" fill="white" dominant-baseline="middle" letter-spacing="-1">${safeName}</text>

  <text x="80" y="366" font-family="system-ui,Arial,sans-serif" font-size="24" font-weight="400" fill="#94a3b8" dominant-baseline="middle">${safeDesc}</text>

  <line x1="80" y1="445" x2="1120" y2="445" stroke="#334155" stroke-width="1"/>

  <rect x="80" y="466" width="130" height="44" rx="8" fill="url(#accent)" opacity="0.9"/>
  <text x="145" y="488" font-family="system-ui,Arial,sans-serif" font-size="22" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="700">Tool-TL</text>

  <rect x="228" y="466" width="150" height="44" rx="8" fill="#1e293b"/>
  <text x="303" y="488" font-family="system-ui,Arial,sans-serif" font-size="18" fill="#60a5fa" text-anchor="middle" dominant-baseline="middle" font-weight="600">Free · Online</text>

  <text x="1120" y="496" font-family="system-ui,Arial,sans-serif" font-size="22" fill="#64748b" text-anchor="end" font-weight="500">tool.tl</text>

  <circle cx="1100" cy="200" r="220" fill="${cat.color}" opacity="0.04"/>
  <circle cx="1100" cy="200" r="150" fill="#6366f1" opacity="0.05"/>
  <circle cx="1100" cy="200" r="80"  fill="#a855f7" opacity="0.06"/>
</svg>`;
}

// Per-tool OG images
let count = 0;
for (const tool of toolsData.tools) {
  const name = tool.name?.en || tool.slug;
  const desc = tool.description?.en || '';
  const svg = makeToolSvg(name, tool.category, desc);
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, quality: 95 })
    .toFile(path.join(ogDir, `${tool.slug}.png`));
  count++;
}
console.log(`✅ Generated ${count} tool OG images → public/og/`);

// Default site OG image
const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="1.5" fill="#ffffff" opacity="0.06"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>

  <rect x="80" y="210" width="120" height="120" rx="24" fill="url(#accent)"/>
  <text x="140" y="296" font-family="system-ui,Arial,sans-serif" font-size="64" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-2">TL</text>

  <text x="230" y="264" font-family="system-ui,Arial,sans-serif" font-size="58" font-weight="800" fill="white" dominant-baseline="middle" letter-spacing="-1">Tool-TL</text>

  <text x="230" y="314" font-family="system-ui,Arial,sans-serif" font-size="26" font-weight="400" fill="#94a3b8" dominant-baseline="middle">Free Online Tools · Privacy-First · No Installation</text>

  <g transform="translate(80, 390)">
    <rect width="120" height="38" rx="19" fill="#1e40af" opacity="0.7"/>
    <text x="60" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">PDF</text>
  </g>
  <g transform="translate(216, 390)">
    <rect width="130" height="38" rx="19" fill="#065f46" opacity="0.7"/>
    <text x="65" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Image</text>
  </g>
  <g transform="translate(362, 390)">
    <rect width="160" height="38" rx="19" fill="#4c1d95" opacity="0.7"/>
    <text x="80" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Developer</text>
  </g>
  <g transform="translate(538, 390)">
    <rect width="150" height="38" rx="19" fill="#7c2d12" opacity="0.7"/>
    <text x="75" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Finance</text>
  </g>
  <g transform="translate(704, 390)">
    <rect width="140" height="38" rx="19" fill="#164e63" opacity="0.7"/>
    <text x="70" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">Network</text>
  </g>

  <rect x="80" y="460" width="200" height="44" rx="8" fill="#3b82f6" opacity="0.15"/>
  <text x="180" y="482" font-family="system-ui,Arial,sans-serif" font-size="20" fill="#60a5fa" text-anchor="middle" dominant-baseline="middle" font-weight="600">87+ Free Tools</text>

  <text x="1120" y="590" font-family="system-ui,Arial,sans-serif" font-size="22" fill="#64748b" text-anchor="end" font-weight="500">tool.tl</text>

  <circle cx="1100" cy="180" r="200" fill="#3b82f6" opacity="0.04"/>
  <circle cx="1100" cy="180" r="140" fill="#6366f1" opacity="0.05"/>
  <circle cx="1100" cy="180" r="80"  fill="#a855f7" opacity="0.06"/>
</svg>`;

await sharp(Buffer.from(defaultSvg))
  .png({ compressionLevel: 9, quality: 95 })
  .toFile(path.join(__dirname, '../public/og-default.png'));

console.log('✅ OG default image generated: public/og-default.png');
