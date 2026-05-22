export interface ChangelogItem {
  date: string;
  lines: Partial<Record<'en' | 'zh-CN' | 'zh-TW' | 'ja', string[]>>;
}

export const CHANGELOG: ChangelogItem[] = [
  {
    date: '2026-05-21',
    lines: {
      en: [
        '✅ New tool: ICO to PNG / JPG — upload a favicon.ico, extract all embedded sizes (16×16 up to 256×256) as PNG or JPG, download individually or as a ZIP. Checkerboard preview shows transparency. Files saved with tool.tl- prefix.',
      ],
      'zh-CN': [
        '✅ 新增工具：ICO 转 PNG/JPG —— 上传 favicon.ico，提取其中所有尺寸（16×16 至 256×256），支持导出为 PNG 或 JPG，可单独下载或打包为 ZIP。棋盘格预览透明通道，下载文件带 tool.tl- 前缀。',
      ],
      'zh-TW': [
        '✅ 新增工具：ICO 轉 PNG/JPG —— 上傳 favicon.ico，提取所有內嵌尺寸，支援匯出 PNG 或 JPG，可單獨或打包下載。',
      ],
      ja: [
        '✅ 新ツール：ICO → PNG/JPG 変換 —— favicon.icoをアップロードして全サイズを抽出。PNGまたはJPGで個別またはZIPでダウンロード可能。',
      ],
    },
  },
  {
    date: '2026-05-18',
    lines: {
      en: [
        '✅ New tool: Checksum Calculator — CRC16 (MODBUS / CCITT / IBM) and 8/16-bit cumulative checksum for ASCII text or HEX bytes; shows big/little endian and high/low byte breakdown.',
        '✅ New tool: CRC Calculator — all-in-one CRC tool covering 16 algorithms: CRC-8, CRC-8/MAXIM, CRC-16/IBM, CRC-16/MODBUS, CRC-16/USB, CRC-16/MAXIM, CRC-16/CCITT-0, CRC-16/CCITT-FALSE, CRC-16/XMODEM, CRC-16/KERMIT, CRC-16/DNP, CRC-16/EN-13757, CRC-16/BUYPASS, CRC-16/DDS-110, CRC-32, CRC-32/MPEG-2.',
        '✅ New tool: Hex Arithmetic — add, subtract, multiply and divide hexadecimal numbers with configurable 8/16/32/64-bit result width.',
        '✅ New tool: Text Statistics — real-time count of characters, words, lines, sentences, paragraphs, UTF-8 bytes, UTF-16 bytes, and unique words.',
        '✅ New tool: Text Processor — split by delimiter, join lines, word wrap, add prefix/suffix to each line, and clean/deduplicate lines.',
        '✅ Fix: WebP→JPG/PNG converter rewritten with Pillow — JPEG quality now correctly uses 0-100 scale (FFmpeg q=95 was actually very low quality), alpha channel flattened to white background for JPG, PNG retains transparency.',
        '✅ Fix: Barcode/QR decoder now uses zxing-cpp as primary engine (higher recognition rate), with pyzbar as fallback; multi-encoding detection (UTF-8 → GBK → Shift-JIS) resolves garbled Chinese QR codes.',
        '✅ Fix: Nav header now full-width with centered content via CSS variable max-width, resolving long-standing layout centering issue.',
      ],
      'zh-CN': [
        '✅ 新增工具：校验和计算器 —— 计算 ASCII 文本或十六进制字节的 CRC16（MODBUS/CCITT/IBM）及 8/16 位累加和，显示大小端序和高低字节拆分。',
        '✅ 新增工具：CRC 计算器 —— 一键计算 16 种 CRC 算法：CRC-8、CRC-8/MAXIM、CRC-16/IBM、CRC-16/MODBUS、CRC-16/USB、CRC-16/MAXIM、CRC-16/CCITT-0、CRC-16/CCITT-FALSE、CRC-16/XMODEM、CRC-16/KERMIT、CRC-16/DNP、CRC-16/EN-13757、CRC-16/BUYPASS、CRC-16/DDS-110、CRC-32、CRC-32/MPEG-2。',
        '✅ 新增工具：十六进制计算器 —— 支持十六进制加减乘除，可配置 8/16/32/64 位结果位宽。',
        '✅ 新增工具：文本统计 —— 实时统计字符数、单词数、行数、句子数、段落数、UTF-8 字节数、UTF-16 字节数及不重复单词数。',
        '✅ 新增工具：文本处理工具 —— 拆分（逗号/分号/换行/制表符）、合并行、自动换行、批量添加前后缀、去除空行和重复行。',
        '✅ 修复：WebP 转换器改用 Pillow 重写 —— JPEG 质量参数恢复正常 0-100 标准（原 FFmpeg q=95 实为极低画质），JPG 输出将透明通道合并为白色背景，PNG 保留透明通道。',
        '✅ 修复：条码/二维码解析器改用 zxing-cpp 作为主引擎（识别率更高），pyzbar 保留为 fallback；增加多编码自动检测（UTF-8→GBK→Shift-JIS），解决中文二维码乱码问题。',
        '✅ 修复：导航栏改为全宽布局，内容区通过 CSS 变量 max-width 居中，解决导航未居中问题。',
      ],
      'zh-TW': [
        '✅ 新增工具：校驗和計算器、CRC 計算器（16種演算法）、十六進位計算器、文字統計、文字處理工具。',
        '✅ 修復：WebP 轉換器改用 Pillow 重寫，JPEG 畫質大幅提升，PNG 保留透明通道。',
        '✅ 修復：條碼/QR 解析器改用 zxing-cpp，識別率提升，中文 QR 碼亂碼問題修復。',
        '✅ 修復：導覽列全寬居中顯示問題。',
      ],
      ja: [
        '✅ 新ツール：チェックサム計算機、CRC計算機（16アルゴリズム対応）、16進数計算機、テキスト統計、テキスト処理ツール。',
        '✅ 修正：WebP変換をPillowで書き直し、JPEG画質が大幅向上。PNG出力は透明チャンネルを保持。',
        '✅ 修正：バーコード/QRコードデコーダーをzxing-cppに変更し認識率向上、文字化け問題も解消。',
        '✅ 修正：ナビゲーションバーの中央揃えレイアウトを修正。',
      ],
    },
  },
  {
    date: '2026-05-12',
    lines: {
      en: [
        '✅ New tool: Retirement Calculator — projects savings at retirement using compound growth on current balance + monthly contributions, shows monthly income at 4% withdrawal rate vs target expenses, surplus/shortfall indicator, and contribution vs growth bar chart. Locale defaults: en 65yr/7%/$50K, zh-CN 60yr/4%/¥200K, zh-TW 65yr/4%/NT$1M, ja 65yr/3%/¥5M.',
        '✅ New tool: Net Worth Calculator — assets (liquid, investments, retirement accounts, real estate) minus liabilities (credit cards, mortgage, loans), with debt-to-asset ratio gauge and category breakdown.',
        '✅ New tool: BMI / TDEE Calculator — two-tab tool: BMI with Asian-population cut-offs (overweight ≥23, obese ≥27.5 for zh-CN/zh-TW/ja), visual BMI scale; TDEE tab uses Mifflin-St Jeor BMR with 5 activity multipliers and macro split (protein 30% / carbs 45% / fat 25%). Metric/imperial toggle for en locale.',
        '✅ New tool: Invoice Generator — dynamic line items, locale-aware tax label and default rate (zh-CN 13% VAT, zh-TW 5% 營業稅, ja 10% 消費税, en 0%), live preview with blue-theme template, print/PDF export via window.print().',
        '✅ Financial tools fully localized for 4 regions: all calculators now show locale-appropriate defaults, currency symbols, and country-specific logic (CN/TW/JP tax systems, insurance types, housing loan rates).',
        '✅ Tool pages auto-redirect to browser locale: visiting /jpg-to-pdf with a zh-CN browser now redirects to /zh-CN/jpg-to-pdf once per session; manual locale switch clears the redirect flag.',
        '✅ Fix: article view counts now tracked client-side, bypassing CDN cache — counts update correctly on every real page visit.',
        '✅ Fix: TaxBracketTool SSR crash for zh-TW (stdDed undefined when tw result shape differs from cn).',
        '✅ Fix: CreditCardPayoffTool — show red warning when fixed payment is below initial minimum; display "interest extra" (red) instead of "interest saved" (green) when fixed plan costs more than minimum-only.',
      ],
      'zh-CN': [
        '✅ 新增工具：退休计划计算器 —— 基于当前储蓄+每月定投，复利预测退休时总资产，按4%提取率换算月收入，与目标月支出对比显示盈余/缺口，柱状图展示本金 vs 投资收益。各地区默认值：大陆60岁/4%/¥200K，台湾65岁/4%/NT$1M，日本65岁/3%/¥5M。',
        '✅ 新增工具：净资产计算器 —— 录入资产（流动、投资、退休账户、房产）和负债（信用卡、房贷、其他贷款），计算净资产和负债率，分类明细展示。',
        '✅ 新增工具：BMI / 每日热量计算器 —— 双标签页：BMI标签含亚洲标准（超重≥23、肥胖≥27.5，适用简体/繁体/日语），可视化刻度尺；TDEE标签使用Mifflin-St Jeor公式+5档活动系数，输出三大营养素分配比。英语版提供公英制切换。',
        '✅ 新增工具：发票生成器 —— 动态行项目，税种按地区自动切换（大陆13%增值税、台湾5%营业税、日本10%消费税、英语0%），实时预览专业模板，支持打印/PDF导出。',
        '✅ 全部金融工具完成多地区本地化：各计算器已适配中国大陆/台湾/日本/欧美的默认参数、货币符号和税制逻辑。',
        '✅ 工具页面语言自动跳转：中文浏览器访问 /jpg-to-pdf 等工具页面，自动跳转到 /zh-CN/ 对应页，手动切换语言后不再强制跳转。',
        '✅ 修复：博客文章查看数改为客户端上报，绕过CDN缓存，查看数现在可以正常累计。',
        '✅ 修复：TaxBracketTool在台湾地区的SSR崩溃（tw税务结果结构与cn不同导致stdDed未定义）。',
        '✅ 修复：信用卡还清工具 —— 固定还款低于最低还款额时显示橙色警告；利息差为负时改显红色"需多付利息"而非绿色"节省利息"。',
      ],
      'zh-TW': [
        '✅ 新增工具：退休計劃計算器、淨資產計算器、BMI／每日熱量計算器、發票生成器。',
        '✅ 全部金融工具完成多地區本地化，台灣版採用勞退、健保、綜合所得稅等台灣制度預設值。',
        '✅ 工具頁面依瀏覽器語言自動跳轉至對應語言版本。',
        '✅ 修復：博客文章瀏覽數改為客戶端上報，數字可正常累計。',
        '✅ 修復：稅率計算器台灣版 SSR 崩潰問題；信用卡還款工具負利息差顯示邏輯。',
      ],
      ja: [
        '✅ 新ツール：退職計算機、純資産計算機、BMI／TDEE計算機、請求書ジェネレーター。',
        '✅ 全金融ツールを4地域対応に更新：日本版は所得税・住民税・社会保険を反映したデフォルト値を採用。',
        '✅ ツールページがブラウザ言語に基づいて自動リダイレクト（/ja/ へ）。',
        '✅ 修正：ブログ記事の閲覧数をクライアントサイドで記録するよう変更、CDNキャッシュ問題を解消。',
      ],
    },
  },
  {
    date: '2026-05-11',
    lines: {
      en: [
        '✅ New tool: LTV Calculator — computes Customer Lifetime Value, CAC, LTV:CAC ratio, and payback period. Locale defaults for zh-CN/zh-TW/ja/en.',
        '✅ New tool: SaaS Churn Calculator — calculates monthly/annual churn rate, MRR churn, revenue impact, and customer half-life.',
        '✅ New tool: WebRTC Leak Test — detects real IP addresses exposed through WebRTC even behind a VPN, comparing local vs public IPs.',
        '✅ New tool: Resize Image — scale images by pixel dimensions or percentage, with aspect ratio lock. Browser-local processing.',
        '✅ New tool: Image Compressor — canvas-based browser-local compression for JPG/PNG/WEBP with quality slider and before/after size display.',
        '✅ New tool: Image to PDF — convert JPG/PNG/WEBP images to A4 PDF, multi-image to multi-page, drag & drop, browser-local.',
        '✅ New tool: OG Image Generator — create Open Graph preview cards (1200×630) for social media with custom text, colors, and layout.',
        '✅ New tool: Car Insurance Calculator — locale-aware: zh-CN (交强险+NCD+商业险), zh-TW (強制險+任意险), ja (自賠責+任意保険), en (liability/collision/comprehensive).',
        '✅ New tool: Loan Amortization Calculator — full amortization schedule with per-period principal/interest breakdown, three repayment methods (equal payment, equal principal, interest-only).',
        '✅ New tool: Browser Fingerprint — displays Canvas, WebGL, audio fingerprint hash, font list, screen specs, and timezone.',
        '✅ New tool: Merge PDF — combine multiple PDF files into one, drag to reorder pages, browser-local processing.',
        '✅ New tool: Split PDF — extract any page range from a PDF, download as new file.',
        '✅ New tool: DNS Leak Test — checks which DNS servers are handling your queries and whether they bypass your VPN tunnel.',
        '✅ New tool: Compound Interest Calculator — calculates future value with optional monthly contributions, configurable compounding frequency, and withholding tax support for zh-CN/zh-TW/ja.',
        '✅ New tool: Credit Card Payoff Calculator — compares fixed monthly payment vs minimum-only strategy; locale defaults for zh-CN (18% APR), zh-TW (15%), ja (15%), en (24%).',
        '✅ New tool: Tax Bracket Calculator — real progressive tax systems for zh-CN (7-bracket IIT), zh-TW (5-bracket 綜所稅), ja (所得税+住民税+復興税), en (US federal).',
        '✅ Programmatic SEO: added 30 keyword-targeted variant pages across 7 tools (~120 new pages across 4 locales) to capture long-tail search traffic.',
      ],
      'zh-CN': [
        '✅ 新增工具：LTV 计算器 —— 计算客户终生价值、CAC、LTV:CAC 比值和回本周期，支持四地区默认参数。',
        '✅ 新增工具：SaaS 流失率计算器 —— 计算月度/年度用户流失率、MRR 流失、营收影响和客户半衰期。',
        '✅ 新增工具：WebRTC 泄漏检测 —— 检测 VPN 下仍被暴露的真实 IP，对比本地 IP 与公网 IP。',
        '✅ 新增工具：图片尺寸调整 —— 按像素或百分比缩放，支持锁定宽高比，浏览器本地处理。',
        '✅ 新增工具：图片压缩 —— Canvas 本地压缩 JPG/PNG/WEBP，质量滑块调节，显示压缩前后大小对比。',
        '✅ 新增工具：图片转 PDF —— 多张 JPG/PNG 转 A4 多页 PDF，支持拖拽，浏览器本地处理。',
        '✅ 新增工具：OG 图片生成器 —— 生成 1200×630 Open Graph 社交预览图，自定义文字/颜色/布局。',
        '✅ 新增工具：车险计算器 —— 多地区本地化：大陆（交强险+NCD折扣+商业险）、台湾（強制險+任意険）、日本（自賠責+任意保険）。',
        '✅ 新增工具：贷款摊销计算器 —— 生成完整还款计划表，支持等额本息、等额本金、只还利息三种还款方式。',
        '✅ 新增工具：浏览器指纹 —— 显示 Canvas、WebGL、音频指纹哈希、字体列表、屏幕规格、时区等信息。',
        '✅ 新增工具：PDF 合并 —— 合并多个 PDF 为一个文件，可拖拽调整页面顺序，浏览器本地处理。',
        '✅ 新增工具：PDF 拆分 —— 按页码范围提取 PDF 页面，下载为新文件。',
        '✅ 新增工具：DNS 泄漏检测 —— 检查 DNS 请求是否绕过 VPN 隧道，显示实际使用的 DNS 服务器。',
        '✅ 新增工具：复利计算器 —— 支持每月定投、可配置计息频率，中/台/日地区支持预扣税设置。',
        '✅ 新增工具：信用卡还清计算器 —— 对比固定还款 vs 只还最低额，各地区默认利率（大陆18%、台湾15%、日本15%、美国24%）。',
        '✅ 新增工具：税档计算器 —— 真实累进税率：大陆IIT七档、台湾五档综所税、日本所得税+住民税+复兴税、美国联邦税。',
        '✅ SEO 优化：为 7 个工具新增 30 个长尾关键词变体页面（4 语言共 ~120 个新页面）。',
      ],
      'zh-TW': [
        '✅ 新增工具：LTV 計算器、SaaS 流失率計算器、WebRTC 洩漏檢測、圖片尺寸調整、圖片壓縮、圖片轉 PDF、OG 圖片生成器、車險計算器、貸款攤銷計算器、瀏覽器指紋、PDF 合併、PDF 拆分、DNS 洩漏檢測、複利計算器、信用卡還清計算器、稅率計算器。',
        '✅ SEO：為 7 個工具新增 30 個長尾關鍵詞變體頁面（4 語言共約 120 個新頁面）。',
      ],
      ja: [
        '✅ 新ツール16本追加：LTV計算機、SaaSチャーン計算機、WebRTCリークテスト、画像リサイズ、画像圧縮、画像→PDF、OG画像ジェネレーター、自動車保険計算機、ローン償還計算機、ブラウザフィンガープリント、PDF結合、PDF分割、DNSリークテスト、複利計算機、クレジットカード返済計算機、税率計算機。',
        '✅ SEO：7ツールに長尾キーワード対応の変体ページを30件追加（4言語合計約120ページ）。',
      ],
    },
  },
  {
    date: '2026-05-07',
    lines: {
      en: [
        '✅ Mortgage Calculator (mortgage-calculator): new finance tool — calculates monthly payment, total interest, and total cost with full year-by-year amortization schedule. Pure browser computation, no backend.',
        '✅ TextCaseTool rewrite: 11 case modes in 2 groups (Letter Case / Code Naming), all results shown simultaneously, each with localized label + description + copy button. Removed old tab UI.',
        '✅ CompressPdfTool UI rewrite: full redesign matching reference site — drag-drop upload, level selector (screen/ebook/printer/prepress), live compression stats from response headers.',
        '✅ GifSplitTool: new dedicated component replacing generic uploader — session-based API, lazy-load thumbnail grid, per-frame download, ZIP download, server-side DELETE on clear.',
        '✅ TotpGeneratorTool rewrite: 2-column layout, auto-generates random Base32 secret, countdown progress bar (turns red ≤5s), browser-local security notice, Web Crypto HMAC-SHA1.',
        '✅ EmailDiagnosticsTool: DKIM structured display, selector input field, DNSBL green/red badge summary (checked/listed count).',
        '✅ Base64 tools simplified: each tool now does one job only — decoder decodes, encoder encodes. Removed swap/exchange mode.',
        '✅ Topics article pages: created [category]/[slug].astro for all 4 locales, fixing 404 on /topics/cat/article URLs.',
        '✅ png-to-icns: fixed API 404 (added root route + strict_slashes=False) and download filename (.zip → .icns).',
        '✅ Home subtitle: tool count now reads live from tools.json instead of hardcoded "40+".',
        '✅ VideoConverterTool: new dedicated UI for to-mp4 with codec/CRF/preset/audio/resolution/FPS options, XHR upload progress bar, async job polling, and blob-fetch download with tool.tl- prefix.',
        '✅ JwtDebuggerTool: full rewrite with Decode/Encode/Verify tabs, colored panels, exp/iat/nbf claim display, Web Crypto API signing (no external lib), i18n x4.',
        '✅ FileSizeConverter: fixed source input disappearing after typing (React 18 batch state update).',
        '✅ ExchangeRateTool: updated API URL from api.frankfurter.app to api.frankfurter.dev/v1 (301 CORS redirect fix).',
        '✅ jpg-to-pdf API: added root /jpg-to-pdf/ route, fixed file field name (file vs files), in-memory BytesIO processing.',
      ],
      'zh-CN': [
        '✅ 新增工具：房贷计算器（mortgage-calculator），浏览器端计算月还款、总利息、总还款，并生成完整的逐年摊还表。',
        '✅ 英文大小写转换重构：11种格式同时显示（大小写转换5种 + 编程命名格式6种），每项带本地化说明与独立复制按钮，移除旧Tab UI。',
        '✅ 压缩PDF UI重构：完全复刻参考设计，支持拖拽上传、4档压缩等级选择，响应头实时显示压缩率统计。',
        '✅ GIF分解工具：全新专用组件，会话式API、懒加载缩略图网格、逐帧下载、ZIP打包下载、清空时服务端删除会话。',
        '✅ TOTP生成器重构：双栏布局，自动生成随机Base32密钥，倒计时进度条（≤5秒变红），浏览器本地安全说明，Web Crypto HMAC-SHA1实现。',
        '✅ 邮件诊断工具：DKIM结果结构化展示、selector输入框、DNSBL检测数量绿/红徽章汇总。',
        '✅ Base64工具精简：每个工具各司其职，解码只解码，编码只编码，移除换向/交换功能。',
        '✅ 文章详情页：为全4种语言创建[category]/[slug].astro，修复topics文章页404。',
        '✅ png-to-icns：修复API 404（新增根路由+strict_slashes=False）及下载文件名（.zip→.icns）。',
        '✅ 首页工具数量：从硬编码"40+"改为从tools.json动态读取实际数量。',
        '✅ 视频转MP4工具：全新专用UI，支持编码/CRF/预设/音频/分辨率/帧率，XHR上传进度条，大文件异步轮询，blob下载。',
        '✅ JWT调试工具：完全重构，含解码/编码/验证三标签页，彩色面板，Web Crypto API签名，四语言i18n。',
        '✅ 文件大小换算：修复输入数值后消失的问题（React 18批量状态更新导致）。',
        '✅ 汇率换算：修复API地址 301 跨域重定向导致的CORS失败。',
        '✅ jpg-to-pdf接口：新增根路由，修复文件字段名，改用内存处理。',
      ],
    },
  },
  {
    date: '2026-03-18',
    lines: {
      en: [
        '✅ JSON Formatter Major Upgrade: Introduced a global immersive full-screen maximization mode. Enjoy an absolutely boundless, ultra-wide viewport experience for complex JSON trees, seamlessly adapted for both desktop and mobile.',
        '✅ Core Engine Refactoring: Deeply resolved sitemap generation logic and cross-site site_id leakage bugs, comprehensively eliminating web crawler blind spots and phantom 404 errors.',
        '✅ Monetization Infrastructure Enhancement: Systematically implemented highly customized Open Graph (OG) and Twitter Card metadata across the entire stack, significantly amplifying organic traffic presentation and overarching SEO health scores.',
      ],
      'zh-CN': [
        '✅ JSON 格式化工具大版本升级：新增全局深度沉浸式全屏最大化模式，完美双端适配，极大提升超长代码编辑与比对体验。',
        '✅ 核心引擎底盘重构：深度修复 Sitemap 生成逻辑及 site_id 串台泄漏等 Bug，全面扫清爬虫死角与 404 隐患。',
        '✅ 流量变现基建增强：全栈补齐高度定制化的 Open Graph (OG) 与 Twitter Card 社交分享元数据，进一步拉升全网引流展现率与 SEO 评分。',
      ],
    },
  },
  {
    date: '2026-03-11',
    lines: {
      en: [
        '✅ Network Diagnostic Toolkit Expanded: Introduced 8 robust and streamlined diagnostic probes, including Ping, Traceroute, and Port Scan, tailored for optimal performance.',
        '✅ Comprehensive Long-tail SEO Enhancements: Injected profound context covering "Principles", "Technical Breakdown", and "Troubleshooting Scenarios" across all 8 probe templates, massively boosting content density.',
        '✅ Complete Form i18n Refactoring: Eradicated cumbersome hard-coded bilingual texts, replacing them with dynamic rendering isolated entirely by translation files for seamless linguistic switches.',
        '✅ Smart Brand Title Suffix: Refined backend Python routing to intelligently append " - tool.tl" securely without risking duplicate suffixes, stabilizing SERP visibility.',
      ],
      'zh-CN': [
        '✅ 网络探针工具箱扩列：通过镜像与精简，承接展示了涵盖 Ping、Traceroute、Port Scan 等 8 款极简但硬核的诊断探针。',
        '✅ 全景长尾 SEO 科普嵌入：为以上 8 款底层模板分类注入"原理解析"、"技术拆解"与"排障实战"文本，拉升内容密度以回击 AdSense 低价值制裁。',
        '✅ 多语言表单国际化 (i18n)：完全清理了所有 HTML 模板中原有的中英生硬拼接硬编码，利用语言包实现按钮与输入框双轨纯血独立渲染。',
        '✅ 动态品牌名兜底：修正后端通过 Jinja 下发的 page_title 变量拼接，实现防冗余的智能"- tool.tl"后缀附着，巩固 SERP 收录。',
      ],
    },
  },
  {
    date: '2026-03-07',
    lines: {
      en: [
        'New feature: Email Diagnostics Toolkit — launched a comprehensive suite of email testing tools including MX Record Lookup, SPF Check, DMARC Parse, and SMTP TLS connection tests.',
        'Architecture upgrade: Implemented "Focus Mode" landing pages for individual email tools and a cross-navigation system ("Related Tools") to improve user experience and discoverability.',
        'Engine optimization: Rebuilt the underlying TLS probe logic to automatically resolve MX records for secure handshakes, permanently fixing connection timeout issues and addressing API parsing errors.',
        'Cross-platform support: Synchronized rendering engine upgrades across both Desktop and Mobile environments.',
      ],
      'zh-CN': [
        '新增工具：邮件诊断工具箱 —— 上线了一套完整的邮件测试工具，包含 MX 记录查询、SPF 检测、DMARC 解析以及 SMTP/TLS 连接等核心功能。',
        '架构重构：为单项邮件工具推出了"聚焦模式"承载页，并加入了"相关工具"交叉导航系统，大幅提升用户查阅体验与功能的被发现率。',
        '底层优化：深度重写了 TLS 探测逻辑，现已支持自动识别 MX 记录并进行安全握手，彻底解决连接超时痛点并修复了 API 字段解析报错。',
        '全端流式展示：完成了 PC 面板与移动端架构的可视化展示引擎同步升级，保证全平台信息同步闭环。',
      ],
    },
  },
  {
    date: '2026-03-06',
    lines: {
      en: [
        'New tool: PNG/JPG to SVG — upload bitmap images and convert them into high-quality scalable vector graphics using the vtracer engine.',
        'Backend-powered conversion: Moved from browser-side JS tracing to a dedicated Python microservice running the Rust-based vtracer library for dramatically improved output quality and performance.',
        'Anti-aliasing pipeline: 2x Lanczos upsampling + Alpha channel threshold binarization before tracing, virtually eliminating jagged edges on icons and logos.',
        'Smart format support: Accepts PNG, JPG, BMP, WebP, ICO, and GIF (first frame). All inputs are pre-processed via Pillow for maximum compatibility.',
        'Three tracing modes available: Spline (smooth curves), Polygon (sharp edges), and None (pixel-level). Supports both desktop and mobile with dark/light mode.',
      ],
      'zh-CN': [
        '新增工具：PNG/JPG 转 SVG —— 上传位图图片，通过 vtracer 引擎在线转换为高质量可缩放矢量图。',
        '后端算力重构：从纯浏览器端 JS 追踪方案全面迁移至专用 Python 微服务，底层运行基于 Rust 的 vtracer 库，输出画质与性能大幅提升。',
        '三层抗锯齿管线：2x Lanczos 超采样 + Alpha 通道阈值二值化预处理，在追踪前消除图标和 Logo 的边缘锯齿。',
        '智能格式兼容：支持 PNG、JPG、BMP、WebP、ICO、GIF（取首帧）等格式上传，所有输入均经 Pillow 预处理确保最大兼容性。',
        '提供三种追踪模式：Spline（平滑曲线）、Polygon（锐利边缘）、None（像素级）。适配桌面端与移动端，支持深色/浅色模式。',
      ],
    },
  },
  {
    date: '2026-03-04',
    lines: {
      en: [
        'Core SEO & Client-side Overhaul for PNG to JPG, UUID Generator, and PNG to Favicon converters.',
        'PNG to JPG: 100% Client-side Processing. Added lightning-fast, privacy-first local batch conversion using HTML5 Canvas. Introduced a quality adjustment slider.',
        'UUID Generator: Set the time-ordered UUIDv7 as the default option to capture developer niche traffic and optimize database indexing.',
        'PNG to Favicon: Rewrote workflow to perfectly target ICO generation, enabling multi-resolution packaged downloads for extreme compatibility.',
        'UX & Structure Updates: Enhanced SEO content layouts and repositioned native AdSense slots under the fold to protect Core Web Vitals.',
      ],
      'zh-CN': [
        '核心工具前端重构与长尾词 SEO 突围升级。PNG to JPG (PNG转JPG)、UUID Generator、PNG to Favicon 全面改版。',
        'PNG to JPG：纯前端批量处理，彻底移除后端的网络等待。新增 10%-100% 画质调节，支持本地极速秒转。',
        'UUID Generator：极客化重构，默认支持具有时间顺序特征的 UUIDv7 选项，提升数据库主键友好度。',
        'PNG to Favicon：精准升级工具流程，新增多尺寸打包，帮助网站生成完美兼容的 .ico 格式图标。',
        '全站体验优化：重新设计工具核心排版与 SEO 导读板块，在保证首屏零广告打扰的前提下提升交互流畅度。',
      ],
    },
  },
  {
    date: '2026-01-22',
    lines: {
      en: [
        'New tool: PNG to ICNS (png-to-icns) — convert PNG images to macOS application icon format.',
        'Automatically generates multiple sizes (16×16, 32×32, 64×64, 128×128, 256×256, 512×512, 1024×1024) including @2x retina versions.',
        'Recommended to upload high-resolution square images (at least 1024×1024 pixels), system auto-scales to generate all sizes.',
        'Perfect for Xcode development and macOS app packaging. Supports desktop and mobile interfaces with dark/light mode.',
      ],
      'zh-CN': [
        '新增工具：PNG 转 ICNS（png-to-icns），将 PNG 图片转换为 macOS 应用图标格式。',
        '自动生成多种尺寸（16×16、32×32、64×64、128×128、256×256、512×512、1024×1024），包含 @2x 高清版本。',
        '建议上传至少 1024×1024 像素的高分辨率方形图片，系统自动缩放生成所有尺寸。',
        '适用于 Xcode 开发、macOS 应用打包，支持桌面端和移动端，适配深色/浅色模式。',
      ],
    },
  },
  {
    date: '2026-01-20',
    lines: {
      en: [
        'New tool: Barcode / QR Code Decoder (barcode-decoder) — upload images to automatically detect and decode barcodes or QR codes.',
        'Supports QR Code, EAN-13, UPC-A, Code 128, Code 39, Data Matrix, PDF417 and more. Can recognize multiple codes in one image.',
        'New tool: Text Case Converter (text-case) — convert text between 8 common case formats: UPPERCASE, lowercase, Title, camelCase, PascalCase, snake_case, kebab-case, CONSTANT.',
        'GIF Frame Extractor upgraded: server-side Pillow processing, 100% lossless quality, thumbnail previews, metadata display.',
      ],
      'zh-CN': [
        '新增工具：条形码/二维码解码器（barcode-decoder），上传图片自动识别并解码条形码或二维码。',
        '支持 QR Code、EAN-13、UPC-A、Code 128、Code 39、Data Matrix、PDF417 等多种格式，可同时识别多个码。',
        '新增工具：英文大小写转换（text-case），支持 UPPERCASE、lowercase、Title、camelCase、PascalCase、snake_case、kebab-case、CONSTANT 等 8 种格式。',
        'GIF 图片分解工具升级：切换到服务端 Pillow 处理，图片质量提升到100%无损，新增缩略图预览，显示 GIF 详细元信息。',
      ],
    },
  },
  {
    date: '2026-01-16',
    lines: {
      en: [
        'New tool: JWT Debugger (jwt-debugger) — decode, encode, and verify JSON Web Tokens online.',
        'Supports HMAC algorithms (HS256/HS384/HS512) and RSA algorithms (RS256/RS384/RS512).',
        'Three feature tabs: Decode (real-time parsing of Header/Payload/Signature), Encode (custom JWT generation), and Verify (signature verification).',
        'All operations performed locally in your browser — no data uploaded to any server, keeping your secrets safe.',
      ],
      'zh-CN': [
        '新增工具：JWT 调试工具（jwt-debugger），支持在线 JWT 解码、编码和签名验证。',
        '支持 HMAC 算法（HS256/HS384/HS512）和 RSA 算法（RS256/RS384/RS512）。',
        '提供三个功能标签页：解码（实时解析 Header/Payload/Signature）、编码（自定义生成 JWT）、验证（签名验证）。',
        '所有操作在浏览器本地完成，不上传任何数据到服务器，保护您的密钥安全。',
      ],
    },
  },
  {
    date: '2025-11-20',
    lines: {
      en: [
        'New tool: TOTP Token Generator (totp-generator) — generate time-based OTP codes from Base32 secrets.',
        'Supports SHA-1 algorithm, 6-digit / 8-digit codes, and 30s / 60s refresh cycles.',
        'Automatically generates otpauth:// URLs compatible with Google Authenticator, Authy, and other TOTP apps.',
        'One-click copy for both the token and the URI, fully responsive with dark/light mode support.',
      ],
      'zh-CN': [
        '新增工具：TOTP 动态口令生成器（totp-generator），支持基于 Base32 密钥生成动态验证码。',
        '支持 SHA-1 算法、6 位/8 位验证码、30s/60s 刷新周期等参数配置。',
        '自动生成 otpauth:// URL，可直接用于 Google Authenticator、Authy 等应用。',
        '支持一键复制验证码与 URI，兼容亮色/暗色模式，适配移动端布局。',
      ],
    },
  },
  {
    date: '2025-09-25',
    lines: {
      en: [
        'New tool: SVG to PNG converter with drag & drop upload, multi-size export, DPR scaling, and random file naming for downloads.',
        'Improved multilingual support: All alerts, validation, and preview texts now use language packs.',
      ],
      'zh-CN': [
        '新增工具：SVG 转 PNG，支持拖拽上传、多尺寸导出、DPR 倍数选择，导出文件自动生成随机文件名。',
        '优化多语言支持：所有提示信息（上传错误、尺寸校验、预览信息等）已改为通过语言包加载。',
      ],
    },
  },
  {
    date: '2025-09-24',
    lines: {
      en: [
        'New tool: Color Converter — supports conversion between Hex, RGB, and HSL formats. Color preview, one-click copy, dark/light mode.',
        'New tool: WebP Converter — convert WebP images to JPG or PNG. Adjustable JPG quality, one-click download, dark/light mode.',
      ],
      'zh-CN': [
        '新增工具：色值转换（Color Converter），支持 Hex / RGB / HSL 三种格式互转。支持色块预览，结果可一键复制，适配暗黑与亮色模式。',
        '新增工具：WebP 转换，支持将 WebP 图片转换为 JPG 或 PNG。可自定义 JPG 输出质量，支持一键下载，适配暗黑/亮色模式。',
      ],
    },
  },
  {
    date: '2025-09-23',
    lines: {
      en: [
        'New tool: Chinese to Pinyin — instantly convert Chinese text into Pinyin with tone marks and capitalization options.',
        'New tool: Favicon Generator (to-favicon)',
        'New tool: Favicon Inspector (favicon-inspect)',
        'New tool: Video to MP4 (to-mp4) — supports WMV, AVI, MOV, MKV, FLV, WebM, 3GP and more.',
      ],
      'zh-CN': [
        '新增工具：中文转拼音，支持输入中文快速转换为拼音，提供是否输出音调、是否每个字首字母大写选项。',
        '新增工具：Favicon 生成器（to-favicon）',
        '新增工具：Favicon 解包工具（favicon-inspect）',
        '新增工具：视频转 MP4（to-mp4），支持 WMV、AVI、MOV、MKV、FLV、WebM、3GP 等格式。',
      ],
    },
  },
  {
    date: '2025-09-22',
    lines: {
      en: [
        'New tool: File Size Converter (Bit / Byte / KB / MB / GB / TB bidirectional conversion, decimal/binary base).',
        'New tool: EXIF Auto-Orient — upload images to auto-detect and correct EXIF Orientation tags.',
        'New tool: EXIF Viewer — parse and display full EXIF metadata in JSON format with highlighting.',
        'New tool: UUID Generator (v4 and v7), Base Converter (HEX/DEC/BIN), Regex Tester.',
        'Improved tool grouping with Developer Tools and Other Tools categories.',
      ],
      'zh-CN': [
        '新增工具：文件大小换算（Bit / Byte / KB / MB / GB / TB 双向转换，支持十进制/二进制进制切换）。',
        '新增 EXIF 自动旋转工具：上传图片后自动检测并修正 EXIF Orientation 标签，修正方向错误的照片。',
        '新增 EXIF 信息查看器：解析并显示完整 EXIF 元数据，JSON 高亮显示。',
        '新增 UUID 生成器（v4/v7）、进制转换（HEX/DEC/BIN）、正则测试器。',
        '优化工具分组，增加开发工具和其他工具分类。',
      ],
    },
  },
  {
    date: '2025-09-21',
    lines: {
      en: [
        'New tool: Password Generator — customizable length, character sets (numbers, uppercase, lowercase, symbols), copy individually or all at once.',
        'New tool: URL Decoder — decode %xx sequences and plus (+) to space.',
        'New tool: URL Encoder — safely encode input text into URL-compatible strings.',
        'New tool: Timestamp Converter — convert between Unix timestamps and human-readable dates (seconds & milliseconds).',
      ],
      'zh-CN': [
        '新增随机密码生成器：支持自定义密码长度与生成数量，字符类型可选（数字、大写字母、小写字母、特殊符号），生成结果可逐条复制或一键复制全部。',
        '新增 URL 解码器：支持标准 %xx 和加号（+）转空格的解码规则，提供输入区、解码按钮、结果区和复制功能。',
        '新增 URL 编码器：支持安全编码输入文本为 URL 兼容字符串。',
        '新增时间戳转换工具：支持 Unix 时间戳与日期双向转换，提供秒（10 位）和毫秒（13 位）精度选项。',
      ],
    },
  },
  {
    date: '2025-09-19',
    lines: {
      en: [
        'New tool: Base64 Text Decoder — decode Base64 strings to UTF-8 text.',
        'New tool: Base64 Text Encoder — encode text into Base64 strings with one-click copy.',
        'New tool: Base64 Image Decoder — paste Base64 image strings, preview and download.',
        'New tool: Base64 Image Encoder — upload images and convert to Base64 strings.',
        'All four Base64 tools support desktop & mobile, dark mode, and floating tooltips.',
      ],
      'zh-CN': [
        '新增 Base64 文本解码器：支持将 Base64 字符串解码为 UTF-8 文本。',
        '新增 Base64 文本编码器：支持将文本编码为 Base64 字符串，提供一键复制与示例。',
        '新增 Base64 图片解码器：支持粘贴或输入 Base64 图片字符串，实时预览与下载图片。',
        '新增 Base64 图片编码器：支持上传图片文件并转换为 Base64 字符串，提供复制功能。',
        '四个 Base64 工具均适配桌面端与移动端，支持深色模式与浮动提示。',
      ],
    },
  },
  {
    date: '2025-09-05',
    lines: {
      en: [
        'New tool: JPG to PDF — merge multiple JPG images into a single A4 PDF with auto-scaling. Drag & drop upload.',
        'New tool: PDF to JPG — single page, page range, or full document conversion to ZIP.',
        'New tool: Compress PDF — Ghostscript compression with multiple levels (screen, ebook, printer, prepress).',
        'Improved PDF to Word tool: added Basic (pdf2docx) and Accurate (LibreOffice) conversion modes.',
      ],
      'zh-CN': [
        '新增 JPG 转 PDF 工具：支持多张 JPG 图片合并为单个 A4 PDF，自动缩放适配页面，支持拖拽上传。',
        '新增 PDF 转 JPG 工具：支持单页转换、区间转换以及整本 PDF 转换为 ZIP 包。',
        '新增压缩 PDF 工具：支持 Ghostscript 多等级压缩（screen、ebook、printer、prepress）。',
        '优化 PDF 转 Word 工具：新增基础模式（pdf2docx）和高保真模式（LibreOffice）两种转换方式。',
      ],
    },
  },
  {
    date: '2025-09-03',
    lines: {
      en: [
        'JSON Formatter: improved Unicode escape/unescape handling, moved Unicode tools into the main action button group.',
        'JSON Formatter Tool completed: beautify, minify, validate, tree view, and Unicode conversion.',
      ],
      'zh-CN': [
        'JSON 格式化工具：改进 Unicode Escape/Unescape 处理，将 Unicode 工具移至主操作按钮组。',
        'JSON 格式化工具完成，支持 JSON 数据的美化、压缩、校验、树形查看与 Unicode 转换。',
      ],
    },
  },
  {
    date: '2025-09-01',
    lines: {
      en: ['Initial framework setup completed.'],
      'zh-CN': ['主框架搭建完成。'],
    },
  },
];

export function getChangelogLines(item: ChangelogItem, locale: string): string[] {
  if (locale === 'zh-CN' || locale === 'zh-TW') {
    return item.lines['zh-CN'] || item.lines.en || [];
  }
  return item.lines.en || [];
}

export const changelogI18n: Record<string, { title: string; intro: string; empty: string }> = {
  en: {
    title: 'Changelog',
    intro: 'A record of major updates and improvements to tool.tl.',
    empty: 'No updates available.',
  },
  'zh-CN': {
    title: '更新日志',
    intro: '记录 tool.tl 的重要更新与改进。',
    empty: '暂无更新记录。',
  },
  'zh-TW': {
    title: '更新日誌',
    intro: '記錄 tool.tl 的重要更新與改進。',
    empty: '暫無更新記錄。',
  },
  ja: {
    title: '更新履歴',
    intro: 'tool.tl の主要なアップデートと改善の記録。',
    empty: '更新情報はありません。',
  },
};
