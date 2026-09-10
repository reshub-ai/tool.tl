# 工具埋点覆盖与使用记录报告

> 由 `node scripts/tool-usage-report.mjs` 自动生成，请勿手工编辑。
> 生成时间：2026-09-10 07:55 UTC（本次跳过接口探测）

## 概览

| 指标 | 数量 |
|---|---|
| 工具总数 | 90 |
| 渲染组件文件数 | 52 |
| 已接入埋点 | 90 |
| **未接入埋点** | **0** |
| **零使用记录** | **40** |
| 有后端接口的工具 | 38 |
| **接口不可达** | **未探测** |
| 路由渲染异常 | 0 |

> 说明：排行接口服务端硬上限 50 条，排名 50 名之外的工具一律显示为 0 次，
> 因此「零使用记录」应理解为「未进入前 50」。埋点对同一浏览器同一工具有 5 分钟去重。

## 未接入埋点的工具（0）

无。

## 接口不可达的工具（未探测）

无。

## 零使用记录的工具（40）

可能原因分三类：页面渲染坏了、后端接口不通、或真实低流量。前两类已在上面两节标出。

| 工具 | 分类 | 渲染组件 | 埋点 | 接口 | 备注 |
|---|---|---|---|---|---|
| `pdf-to-jpg` | pdf | FileUploadTool | ✅ | 未探测 |  |
| `jpg-to-pdf` | pdf | FileUploadTool | ✅ | 未探测 |  |
| `merge-pdf` | pdf | MergePdfTool | ✅ | 未探测 |  |
| `split-pdf` | pdf | SplitPdfTool | ✅ | 未探测 |  |
| `png-to-jpg` | image | FileUploadTool | ✅ | 未探测 |  |
| `svg-to-png` | image | FileUploadTool | ✅ | 纯前端 |  |
| `png-to-svg` | image | FileUploadTool | ✅ | 未探测 |  |
| `barcode-reader` | barcode | FileUploadTool | ✅ | 未探测 |  |
| `barcode-qr-decoder` | barcode | FileUploadTool | ✅ | 未探测 |  |
| `dns` | network | NetworkTool | ✅ | 未探测 |  |
| `whois` | network | NetworkTool | ✅ | 未探测 |  |
| `asn` | network | NetworkTool | ✅ | 未探测 |  |
| `http-header` | network | NetworkTool | ✅ | 未探测 |  |
| `mx-checker` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `dkim-checker` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `dmarc-checker` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `tls-handshake-test` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `dnsbl-checker` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `ptr-lookup` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `email-diagnostics` | email | EmailDiagnosticsTool | ✅ | 未探测 |  |
| `text-case` | dev | TextCaseTool | ✅ | 纯前端 |  |
| `base64-decoder` | dev | TextProcessTool | ✅ | 纯前端 |  |
| `base64-encoder` | dev | TextProcessTool | ✅ | 纯前端 |  |
| `base-converter` | dev | BaseConverterTool | ✅ | 纯前端 |  |
| `hex-arithmetic` | dev | HexArithmeticTool | ✅ | 纯前端 |  |
| `text-stats` | dev | TextStatsTool | ✅ | 纯前端 |  |
| `text-processor` | dev | TextProcessorTool | ✅ | 纯前端 |  |
| `color-converter` | dev | GeneratorTool | ✅ | 纯前端 |  |
| `to-mp4` | video | VideoConverterTool | ✅ | 未探测 |  |
| `wifi-password-generator` | password | GeneratorTool | ✅ | 纯前端 |  |
| `exif-auto-orient` | image | FileUploadTool | ✅ | 未探测 |  |
| `url-encoder` | dev | TextProcessTool | ✅ | 纯前端 |  |
| `url-decoder` | dev | TextProcessTool | ✅ | 纯前端 |  |
| `timestamp-converter` | dev | GeneratorTool | ✅ | 纯前端 |  |
| `regex-tester` | dev | GeneratorTool | ✅ | 纯前端 |  |
| `og-image-generator` | dev | OgImageGeneratorTool | ✅ | 纯前端 |  |
| `base64-decoder-img` | image | Base64DecoderImgTool | ✅ | 纯前端 |  |
| `image-compressor` | image | ImageCompressorTool | ✅ | 纯前端 |  |
| `rsa-encrypt-decrypt` | dev | RsaEncryptDecryptTool | ✅ | 纯前端 |  |
| `ip-blocktest` | network | IpBlockTestTool | ✅ | 未探测 |  |

## 路由渲染异常（0）

无。

## 完整覆盖表

| 分类 | 工具 | component | 渲染组件 | 埋点 | 累计 | 近7天 | 接口 |
|---|---|---|---|---|---:|---:|---|
| barcode | `qrcode` | QrCode | GeneratorTool | ✅ | 51 | 1 | 纯前端 |
| barcode | `text-qrcode` | TextQrcode | TextQrcodeTool | ✅ | 18 | 2 | 纯前端 |
| barcode | `barcode-decoder` | BarcodeDecoder | FileUploadTool | ✅ | 15 | 0 | — |
| barcode | `barcode-generator` | BarcodeGenerator | GeneratorTool | ✅ | 5 | 1 | 纯前端 |
| barcode | `barcode-qr-decoder` | BarcodeDecoder | FileUploadTool | ✅ | 0 | 0 | — |
| barcode | `barcode-reader` | BarcodeDecoder | FileUploadTool | ✅ | 0 | 0 | — |
| dev | `uuid-generator` | UuidGenerator | TextProcessTool | ✅ | 124 | 4 | 纯前端 |
| dev | `crc-calculator` | CrcCalculator | CrcCalculatorTool | ✅ | 32 | 9 | 纯前端 |
| dev | `checksum-calculator` | ChecksumCalculator | ChecksumCalculatorTool | ✅ | 27 | 4 | 纯前端 |
| dev | `jwt-debugger` | JwtDebugger | JwtDebuggerTool | ✅ | 23 | 0 | 纯前端 |
| dev | `chinese-to-pinyin` | ChineseToPinyin | GeneratorTool | ✅ | 21 | 0 | 纯前端 |
| dev | `json-formatter` | JsonFormatter | JsonFormatterTool | ✅ | 20 | 0 | 纯前端 |
| dev | `file-size-converter` | FileSizeConverter | FileSizeConverterTool | ✅ | 16 | 0 | 纯前端 |
| dev | `base-converter` | BaseConverter | BaseConverterTool | ✅ | 0 | 0 | 纯前端 |
| dev | `base64-decoder` | Base64Decoder | TextProcessTool | ✅ | 0 | 0 | 纯前端 |
| dev | `base64-encoder` | Base64Encoder | TextProcessTool | ✅ | 0 | 0 | 纯前端 |
| dev | `color-converter` | ColorConverter | GeneratorTool | ✅ | 0 | 0 | 纯前端 |
| dev | `hex-arithmetic` | HexArithmetic | HexArithmeticTool | ✅ | 0 | 0 | 纯前端 |
| dev | `og-image-generator` | OgImageGenerator | OgImageGeneratorTool | ✅ | 0 | 0 | 纯前端 |
| dev | `regex-tester` | RegexTester | GeneratorTool | ✅ | 0 | 0 | 纯前端 |
| dev | `rsa-encrypt-decrypt` | RsaEncryptDecrypt | RsaEncryptDecryptTool | ✅ | 0 | 0 | 纯前端 |
| dev | `text-case` | TextCase | TextCaseTool | ✅ | 0 | 0 | 纯前端 |
| dev | `text-processor` | TextProcessor | TextProcessorTool | ✅ | 0 | 0 | 纯前端 |
| dev | `text-stats` | TextStats | TextStatsTool | ✅ | 0 | 0 | 纯前端 |
| dev | `timestamp-converter` | TimestampConverter | GeneratorTool | ✅ | 0 | 0 | 纯前端 |
| dev | `url-decoder` | UrlDecoder | TextProcessTool | ✅ | 0 | 0 | 纯前端 |
| dev | `url-encoder` | UrlEncoder | TextProcessTool | ✅ | 0 | 0 | 纯前端 |
| email | `email-port-checker` | EmailPortChecker | EmailDiagnosticsTool | ✅ | 16 | 1 | — |
| email | `spf-checker` | SpfChecker | EmailDiagnosticsTool | ✅ | 13 | 2 | — |
| email | `dkim-checker` | DkimChecker | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| email | `dmarc-checker` | DmarcChecker | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| email | `dnsbl-checker` | DnsblChecker | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| email | `email-diagnostics` | EmailDiagnostics | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| email | `mx-checker` | MxChecker | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| email | `ptr-lookup` | PtrLookup | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| email | `tls-handshake-test` | TlsHandshakeTest | EmailDiagnosticsTool | ✅ | 0 | 0 | — |
| finance | `loan-amortization` | LoanAmortization | LoanAmortizationTool | ✅ | 134 | 2 | 纯前端 |
| finance | `salary-after-tax` | SalaryAfterTax | SalaryAfterTaxTool | ✅ | 118 | 3 | 纯前端 |
| finance | `mortgage-calculator` | MortgageCalculator | MortgageCalculatorTool | ✅ | 94 | 2 | 纯前端 |
| finance | `compound-interest` | CompoundInterest | CompoundInterestTool | ✅ | 92 | 2 | 纯前端 |
| finance | `saas-churn-calculator` | SaasChurn | SaasChurnTool | ✅ | 92 | 2 | 纯前端 |
| finance | `car-insurance-calculator` | CarInsuranceCalculator | CarInsuranceCalculatorTool | ✅ | 83 | 3 | 纯前端 |
| finance | `ltv-calculator` | LtvCalculator | LtvCalculatorTool | ✅ | 83 | 1 | 纯前端 |
| finance | `roi-calculator` | ROICalculator | ROICalculatorTool | ✅ | 83 | 3 | 纯前端 |
| finance | `exchange-rate` | ExchangeRate | ExchangeRateTool | ✅ | 82 | 3 | 纯前端 |
| finance | `tax-bracket-calculator` | TaxBracket | TaxBracketTool | ✅ | 74 | 1 | 纯前端 |
| finance | `break-even-calculator` | BreakEven | BreakEvenTool | ✅ | 73 | 2 | 纯前端 |
| finance | `profit-margin` | ProfitMargin | ProfitMarginTool | ✅ | 63 | 2 | 纯前端 |
| finance | `credit-card-payoff` | CreditCardPayoff | CreditCardPayoffTool | ✅ | 62 | 1 | 纯前端 |
| finance | `invoice-generator` | InvoiceGenerator | InvoiceGeneratorTool | ✅ | 61 | 2 | 纯前端 |
| finance | `retirement-calculator` | RetirementCalculator | RetirementCalculatorTool | ✅ | 50 | 1 | 纯前端 |
| finance | `net-worth-calculator` | NetWorthCalculator | NetWorthCalculatorTool | ✅ | 45 | 1 | 纯前端 |
| health | `bmi-calculator` | BMICalculator | BMICalculatorTool | ✅ | 52 | 3 | 纯前端 |
| image | `gif-split` | GifSplit | GifSplitTool | ✅ | 135 | 20 | — |
| image | `png-to-icns` | PngToIcns | FileUploadTool | ✅ | 31 | 0 | — |
| image | `favicon-inspect` | FaviconInspect | FaviconInspectTool | ✅ | 28 | 3 | — |
| image | `exif-viewer` | ExifViewer | FileUploadTool | ✅ | 23 | 0 | — |
| image | `to-favicon` | ToFavicon | FileUploadTool | ✅ | 18 | 1 | — |
| image | `webp-to` | WebpTo | WebpConverterTool | ✅ | 16 | 0 | — |
| image | `base64-encoder-img` | Base64EncoderImg | Base64EncoderImgTool | ✅ | 12 | 2 | 纯前端 |
| image | `resize-image` | ResizeImage | ResizeImageTool | ✅ | 6 | 1 | 纯前端 |
| image | `base64-decoder-img` | Base64DecoderImg | Base64DecoderImgTool | ✅ | 0 | 0 | 纯前端 |
| image | `exif-auto-orient` | ExifAutoOrient | FileUploadTool | ✅ | 0 | 0 | — |
| image | `image-compressor` | ImageCompressor | ImageCompressorTool | ✅ | 0 | 0 | 纯前端 |
| image | `png-to-jpg` | PngToJpg | FileUploadTool | ✅ | 0 | 0 | — |
| image | `png-to-svg` | PngToSvg | FileUploadTool | ✅ | 0 | 0 | — |
| image | `svg-to-png` | SvgToPng | FileUploadTool | ✅ | 0 | 0 | 纯前端 |
| network | `webrtc-leak-test` | WebRTCLeakTest | WebRTCLeakTestTool | ✅ | 78 | 4 | 纯前端 |
| network | `browser-fingerprint` | BrowserFingerprint | BrowserFingerprintTool | ✅ | 77 | 3 | 纯前端 |
| network | `dns-leak-test` | DnsLeakTest | DnsLeakTestTool | ✅ | 69 | 0 | — |
| network | `portscan` | Portscan | NetworkTool | ✅ | 49 | 9 | — |
| network | `cdncheck` | Cdncheck | NetworkTool | ✅ | 21 | 4 | — |
| network | `traceroute` | Traceroute | NetworkTool | ✅ | 21 | 1 | — |
| network | `ping` | Ping | NetworkTool | ✅ | 17 | 0 | — |
| network | `asn` | Asn | NetworkTool | ✅ | 0 | 0 | — |
| network | `dns` | Dns | NetworkTool | ✅ | 0 | 0 | — |
| network | `http-header` | HttpHeader | NetworkTool | ✅ | 0 | 0 | — |
| network | `ip-blocktest` | IpBlockTest | IpBlockTestTool | ✅ | 0 | 0 | — |
| network | `whois` | Whois | NetworkTool | ✅ | 0 | 0 | — |
| password | `totp-generator` | TotpGenerator | TotpGeneratorTool | ✅ | 129 | 4 | 纯前端 |
| password | `password-generator` | PasswordGenerator | GeneratorTool | ✅ | 52 | 8 | 纯前端 |
| password | `wifi-password-generator` | WifiPasswordGenerator | GeneratorTool | ✅ | 0 | 0 | 纯前端 |
| pdf | `pdf-to-word` | PdfToWord | FileUploadTool | ✅ | 36 | 0 | — |
| pdf | `compress-pdf` | CompressPdf | CompressPdfTool | ✅ | 27 | 1 | — |
| pdf | `image-to-pdf` | ImageToPdf | ImageToPdfTool | ✅ | 3 | 1 | 纯前端 |
| pdf | `jpg-to-pdf` | JpgToPdf | FileUploadTool | ✅ | 0 | 0 | — |
| pdf | `merge-pdf` | MergePdf | MergePdfTool | ✅ | 0 | 0 | — |
| pdf | `pdf-to-jpg` | PdfToJpg | FileUploadTool | ✅ | 0 | 0 | — |
| pdf | `split-pdf` | SplitPdf | SplitPdfTool | ✅ | 0 | 0 | — |
| video | `to-mp4` | ToMp4 | VideoConverterTool | ✅ | 0 | 0 | — |
