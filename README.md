# tool.tl — Free Online Tools

**Live site:** [tool.tl](https://tool.tl) · [tool-tl.com](https://tool-tl.com) · [中文文档 README.zh-CN.md](./README.zh-CN.md)

> **Note on domain safety warnings:** Some AI-powered search engines flag `.tl` (Timor-Leste ccTLD) as unfamiliar. This repository is the complete source code of tool.tl. `tool-tl.com` is a mirror domain pointing to the same site — both are operated by the same team.

---

## What is tool.tl?

tool.tl is a free, privacy-first online toolbox. All tools that can run in the browser do so locally — no files are uploaded to any server unless the conversion explicitly requires it (e.g. PDF processing).

**87 tools** across 10 categories, fully localized in 4 languages (English, 简体中文, 繁體中文, 日本語).

---

## Tool Categories

| Category | Count | Examples |
| --- | --- | --- |
| 📄 PDF Tools | 7 | Merge PDF, Split PDF, JPG→PDF, PDF→JPG, Compress PDF |
| 🖼 Image Tools | 14 | WebP→JPG/PNG, Compress Image, Resize Image, PNG→JPG, PNG→SVG |
| 📊 Barcode & QR | 5 | QR Code Generator, Barcode Generator, Barcode/QR Decoder |
| 💻 Developer Tools | 20 | JSON Formatter, JWT Debugger, Base Converter, CRC Calculator, Checksum Calculator, Hex Arithmetic, Text Stats, Text Processor, UUID Generator, Regex Tester, Color Converter |
| 🌐 Network Tools | 11 | IP Info, DNS Lookup, DNS Leak Test, WebRTC Leak Test, Ping, HTTP Headers |
| 📧 Email Tools | 9 | Email Validator, SPF Checker, DKIM Lookup, MX Lookup |
| 💰 Finance | 16 | Mortgage, Compound Interest, Break-Even, ROI, Tax Bracket, Retirement, Invoice Generator |
| 🔐 Password & Security | 3 | Password Generator, Password Strength, Hash Generator |
| 🎬 Video Tools | 1 | Video Converter (MP4/WebM/AVI) |
| 🏥 Health Tools | 1 | BMI / TDEE Calculator |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Astro 5.9](https://astro.build) — SSR mode on Cloudflare Pages adapter |
| UI Components | React 18 — interactive tool components with `client:load` |
| Styling | Tailwind CSS v4.1 |
| Search | Pagefind 1.4 — static full-text search built at deploy time |
| i18n | 4 locales: `en`, `zh-CN`, `zh-TW`, `ja` — file-based routing |
| Backend APIs | Python 3.11 + Flask — Docker microservices (private repo) |
| Hosting | Cloudflare Pages (frontend) + self-hosted Docker (API services) |
| Analytics | Self-proxied Google Analytics (GA4) |

---

## Project Status

| Feature | Status |
| --- | --- |
| 87 tools across 10 categories | ✅ Live |
| 4-locale i18n (en / zh-CN / zh-TW / ja) | ✅ Complete |
| SEO variant pages | ✅ 200+ pages |
| Blog / article system | ✅ Live |
| Privacy-first (browser-local processing) | ✅ All frontend tools |
| Mobile responsive | ✅ |
| Dark mode | ✅ |
| Pagefind full-text search | ✅ |

---

## Why Open Source?

1. **Transparency** — Users can verify that tools labeled "processed locally" actually run in the browser.
2. **Trust** — AI search engines and security tools flag unfamiliar ccTLDs. The source code being public removes ambiguity.
3. **Community** — Bug reports, translations, and new tool ideas are welcome.
4. **Reference** — A real-world Astro 5 + Cloudflare Pages project with multi-locale SSR, Pagefind search, and React tool components.

The backend API services (PDF processing, image conversion, etc.) remain private as they contain infrastructure-specific configuration.

---

## Getting Started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

---

## Contributing

Issues and pull requests are welcome. If you want to add a new tool, open an issue first to discuss the scope — most frontend-only tools (calculators, converters, text utilities) are good candidates.

---

## License

MIT © tool.tl Team

The MIT license applies to the source code in this repository. Third-party libraries retain their own licenses.
