/**
 * Generates /public/og-default.png (1200×630) for Open Graph.
 * Run: node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../public/og-default.png');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
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

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle dot-grid pattern -->
  <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="1.5" fill="#ffffff" opacity="0.06"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>

  <!-- Logo card -->
  <rect x="80" y="210" width="120" height="120" rx="24" fill="url(#accent)"/>
  <text x="140" y="296" font-family="system-ui,Arial,sans-serif" font-size="64" font-weight="900" fill="white" text-anchor="middle" letter-spacing="-2">TL</text>

  <!-- Site name -->
  <text x="230" y="264" font-family="system-ui,Arial,sans-serif" font-size="58" font-weight="800" fill="white" dominant-baseline="middle" letter-spacing="-1">Tool-TL</text>

  <!-- Tagline -->
  <text x="230" y="314" font-family="system-ui,Arial,sans-serif" font-size="26" font-weight="400" fill="#94a3b8" dominant-baseline="middle">Free Online Tools · Privacy-First · No Installation</text>

  <!-- Category pills -->
  <g transform="translate(80, 390)">
    <rect width="120" height="38" rx="19" fill="#1e40af" opacity="0.7"/>
    <text x="60" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">📄 PDF</text>
  </g>
  <g transform="translate(216, 390)">
    <rect width="130" height="38" rx="19" fill="#065f46" opacity="0.7"/>
    <text x="65" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">🖼️ Image</text>
  </g>
  <g transform="translate(362, 390)">
    <rect width="160" height="38" rx="19" fill="#4c1d95" opacity="0.7"/>
    <text x="80" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">💻 Developer</text>
  </g>
  <g transform="translate(538, 390)">
    <rect width="150" height="38" rx="19" fill="#7c2d12" opacity="0.7"/>
    <text x="75" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">💰 Finance</text>
  </g>
  <g transform="translate(704, 390)">
    <rect width="140" height="38" rx="19" fill="#164e63" opacity="0.7"/>
    <text x="70" y="19" font-family="system-ui,Arial,sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">🌐 Network</text>
  </g>

  <!-- Tool count badge -->
  <rect x="80" y="460" width="200" height="44" rx="8" fill="#3b82f6" opacity="0.15"/>
  <text x="180" y="482" font-family="system-ui,Arial,sans-serif" font-size="20" fill="#60a5fa" text-anchor="middle" dominant-baseline="middle" font-weight="600">60+ Free Tools</text>

  <!-- URL bottom-right -->
  <text x="1120" y="590" font-family="system-ui,Arial,sans-serif" font-size="22" fill="#64748b" text-anchor="end" font-weight="500">tool.tl</text>

  <!-- Right decorative circle -->
  <circle cx="1100" cy="180" r="200" fill="#3b82f6" opacity="0.04"/>
  <circle cx="1100" cy="180" r="140" fill="#6366f1" opacity="0.05"/>
  <circle cx="1100" cy="180" r="80" fill="#a855f7" opacity="0.06"/>
</svg>`;

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9, quality: 95 })
  .toFile(outPath);

console.log(`✅ OG image generated: ${outPath}`);
