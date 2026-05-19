import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

/** File accept types per tool slug */
const ACCEPT_MAP: Record<string, string> = {
  'pdf-to-word': '.pdf',
  'pdf-to-jpg': '.pdf',
  'compress-pdf': '.pdf',
  'jpg-to-pdf': '.jpg,.jpeg,.png,.webp,.bmp',
  'png-to-jpg': '.png',
  'png-to-svg': '.png,.jpg,.jpeg,.bmp',
  'png-to-icns': '.png',
  'svg-to-png': '.svg',
  'gif-split': '.gif',
  'webp-to': '.webp',
  'to-favicon': '.png,.jpg,.jpeg,.svg',
  'favicon-inspect': '.ico',
  'barcode-decoder': '.png,.jpg,.jpeg,.gif,.bmp,.webp',
  'barcode-reader': '.png,.jpg,.jpeg,.gif,.bmp,.webp',
  'barcode-qr-decoder': '.png,.jpg,.jpeg,.gif,.bmp,.webp',
  'to-mp4': '.mp4,.avi,.mov,.mkv,.webm,.flv',
  'exif-viewer': '.jpg,.jpeg,.png,.tiff,.webp',
  'exif-auto-orient': '.jpg,.jpeg',
  'qrcode': '',
  'chinese-to-pinyin': '',
  'color-converter': '',
};

/** Whether a tool supports multiple file upload */
const MULTI_MAP: Record<string, boolean> = {
  'jpg-to-pdf': true,
};

/** Output file name hint */
const OUTPUT_NAME: Record<string, string> = {
  'pdf-to-word': 'tool.tl-converted.docx',
  'pdf-to-jpg': 'tool.tl-pages.zip',
  'compress-pdf': 'tool.tl-compressed.pdf',
  'jpg-to-pdf': 'tool.tl-merged.pdf',
  'png-to-jpg': 'tool.tl-converted.jpg',
  'png-to-svg': 'tool.tl-traced.svg',
  'png-to-icns': 'tool.tl-icon.icns',
  'svg-to-png': 'tool.tl-converted.png',
  'gif-split': 'tool.tl-frames.zip',
  'webp-to': 'tool.tl-converted',
  'to-favicon': 'tool.tl-favicon.ico',
  'favicon-inspect': 'tool.tl-layers.zip',
  'barcode-decoder': 'tool.tl-decoded.txt',
  'barcode-reader': 'tool.tl-decoded.txt',
  'barcode-qr-decoder': 'tool.tl-decoded.txt',
  'to-mp4': 'tool.tl-video.mp4',
  'exif-viewer': 'tool.tl-exif.json',
  'exif-auto-orient': 'tool.tl-fixed.jpg',
};

const i18n: Record<string, Record<string, string>> = {
  en: { dropHint: 'Drag & drop files here, or click to select', convert: 'Convert', download: 'Download', uploading: 'Processing...', success: 'Done!', error: 'Error', selectFile: 'Choose File', downloadZip: 'Download ZIP (with 512×512 PNG)', downloadZipShort: 'Download ZIP', zipping: 'Generating ZIP...', downloadLayers: 'Download All Layers (ZIP)', modeLabel: 'Mode', modeFast: 'Fast', modeFastDesc: 'Quick conversion, basic formatting', modeAccurate: 'Accurate', modeAccurateDesc: 'Slower, preserves layout (LibreOffice)', modeA4: 'A4 Default Scale', modeA4Desc: 'Fit images to A4 page size', modeOriginal: 'Original Size', modeOriginalDesc: 'Keep original image dimensions' },
  'zh-CN': { dropHint: '拖拽文件到此处，或点击选择', convert: '转换', download: '下载', uploading: '处理中...', success: '完成！', error: '出错', selectFile: '选择文件', downloadZip: '下载 ZIP（含 512×512 PNG）', downloadZipShort: '下载 ZIP', zipping: '生成 ZIP 中...', downloadLayers: '下载所有图层（ZIP）', modeLabel: '转换模式', modeFast: '快速', modeFastDesc: '快速转换，基础排版', modeAccurate: '精确', modeAccurateDesc: '较慢，保留排版（LibreOffice）', modeA4: 'A4 默认缩放', modeA4Desc: '将图片缩放适配 A4 页面', modeOriginal: '原图大小', modeOriginalDesc: '保留原始图片尺寸' },
  'zh-TW': { dropHint: '拖曳檔案到此處，或點擊選擇', convert: '轉換', download: '下載', uploading: '處理中...', success: '完成！', error: '錯誤', selectFile: '選擇檔案', downloadZip: '下載 ZIP（含 512×512 PNG）', downloadZipShort: '下載 ZIP', zipping: '產生 ZIP 中...', downloadLayers: '下載所有圖層（ZIP）', modeLabel: '轉換模式', modeFast: '快速', modeFastDesc: '快速轉換，基礎排版', modeAccurate: '精確', modeAccurateDesc: '較慢，保留排版（LibreOffice）', modeA4: 'A4 默認縮放', modeA4Desc: '將圖片縮放適配 A4 頁面', modeOriginal: '原圖大小', modeOriginalDesc: '保留原始圖片尺寸' },
  ja: { dropHint: 'ファイルをドラッグ＆ドロップ、またはクリックして選択', convert: '変換', download: 'ダウンロード', uploading: '処理中...', success: '完了！', error: 'エラー', selectFile: 'ファイルを選択', downloadZip: 'ZIP ダウンロード（512×512 PNG 含む）', downloadZipShort: 'ZIP ダウンロード', zipping: 'ZIP 生成中...', downloadLayers: '全レイヤーをダウンロード（ZIP）', modeLabel: '変換モード', modeFast: '高速', modeFastDesc: '高速変換、基本的なレイアウト', modeAccurate: '高精度', modeAccurateDesc: '遅め、レイアウト保持（LibreOffice）', modeA4: 'A4 デフォルト', modeA4Desc: 'A4 サイズに合わせてリサイズ', modeOriginal: '元のサイズ', modeOriginalDesc: '元の画像サイズを保持' },
};

const SCALE_LABELS: Record<string, string> = {
  en: 'Scale',
  'zh-CN': '缩放',
  'zh-TW': '縮放',
  ja: 'スケール',
};

type BarcodeDecodeResult = {
  data: string;
  type?: string;
};

const BARCODE_RESULT_I18N: Record<string, Record<string, string>> = {
  en: { copy: 'Copy', copied: 'Copied', qr: 'QR Code', code: 'Code' },
  'zh-CN': { copy: '复制', copied: '已复制', qr: '二维码', code: '编码' },
  'zh-TW': { copy: '複製', copied: '已複製', qr: 'QR Code', code: '編碼' },
  ja: { copy: 'コピー', copied: 'コピー済み', qr: 'QRコード', code: 'コード' },
};

/** Detailed info panel content per slug × locale */
const TOOL_INFO: Record<string, Record<string, { title: string; items: string[] }>> = {
  'to-favicon': {
    en: {
      title: 'How to use',
      items: [
        'Supported input: PNG, JPG / JPEG, SVG',
        'Output: favicon.ico containing 6 sizes (16×16, 32×32, 48×48, 64×64, 128×128, 256×256)',
        'SVG is rendered at high resolution internally to ensure crisp downscaling',
        'Square images work best; non-square images are padded automatically',
        'Files are processed on the server and not stored',
      ],
    },
    'zh-CN': {
      title: '使用说明',
      items: [
        '支持输入格式：PNG、JPG / JPEG、SVG',
        '输出：favicon.ico，包含 6 种尺寸（16×16、32×32、48×48、64×64、128×128、256×256）',
        'ICO 格式最大支持 256×256，如需 512×512 PNG 请使用"下载 ZIP"',
        '建议使用正方形图片；非正方形会自动补边',
        '文件在服务器处理后不会被保存',
      ],
    },
    'zh-TW': {
      title: '使用說明',
      items: [
        '支援輸入格式：PNG、JPG / JPEG、SVG',
        '輸出：favicon.ico，包含 6 種尺寸（16×16、32×32、48×48、64×64、128×128、256×256）',
        'ICO 格式最大支援 256×256，如需 512×512 PNG 請使用「下載 ZIP」',
        '建議使用正方形圖片；非正方形會自動補邊',
        '檔案在伺服器處理後不會被儲存',
      ],
    },
    ja: {
      title: '使い方',
      items: [
        '対応入力形式：PNG、JPG / JPEG、SVG',
        '出力：favicon.ico（16×16〜256×256 の 6 サイズ入り）',
        'ICO の最大サイズは 256×256。512×512 PNG が必要な場合は「ZIP ダウンロード」を使用',
        '正方形画像を推奨。非正方形は自動でパディング',
        'ファイルはサーバー処理後に保存されません',
      ],
    },
  },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const resultLabels = BARCODE_RESULT_I18N[locale] || BARCODE_RESULT_I18N.en;
  const scaleLabel = SCALE_LABELS[locale] || SCALE_LABELS.en;
  const [files, setFiles] = useState<File[]>([]);
  const [scale, setScale] = useState(2);
  const [pdfMode, setPdfMode] = useState<'basic' | 'accurate'>('basic');
  const [jpgPdfMode, setJpgPdfMode] = useState<'a4' | 'original'>('a4');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [resultText, setResultText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewSize, setPreviewSize] = useState(0);
  const [zipUrl, setZipUrl] = useState('');
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState('');
  const [faviconPreviews, setFaviconPreviews] = useState<{ data: string; size: string }[]>([]);
  const [faviconZip, setFaviconZip] = useState('');
  const [barcodeResults, setBarcodeResults] = useState<BarcodeDecodeResult[]>([]);
  const [copiedBarcodeIndex, setCopiedBarcodeIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ACCEPT_MAP[slug] ?? '';
  const multi = MULTI_MAP[slug] ?? false;
  const outputName = OUTPUT_NAME[slug] ?? 'output';
  const toolInfo = TOOL_INFO[slug]?.[locale] || TOOL_INFO[slug]?.en;

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const selected = multi ? Array.from(fileList) : [fileList[0]];
    setFiles(selected);
    setStatus('idle');
    setMessage('');
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setDownloadName('');
    setResultText('');
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setZipUrl('');
    setZipError('');
    setFaviconPreviews([]);
    setFaviconZip('');
    setBarcodeResults([]);

    // Update preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const first = selected[0];
    if (first && first.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(first));
      setPreviewName(first.name);
      setPreviewSize(first.size);
    } else {
      setPreviewUrl('');
      setPreviewName('');
      setPreviewSize(0);
    }
  }, [downloadUrl, multi, previewUrl]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const upload = async () => {
    if (files.length === 0) return;
    setStatus('uploading');
    setMessage(t.uploading);

    try {
      if (slug === 'svg-to-png') {
        const file = files[0];
        const svg = await file.text();
        const pngBlob = await convertSvgToPng(svg, scale);
        const url = URL.createObjectURL(pngBlob);

        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(url);
        setDownloadName('tool.tl-' + (file.name.replace(/\.svg$/i, '.png') || 'converted.png'));
        setStatus('done');
        setMessage(t.success);
        (window as any).__trackToolUsed?.(slug);
        return;
      }

      const formData = new FormData();
      if (multi) {
        files.forEach((f) => formData.append('file', f));
      } else {
        formData.append('file', files[0]);
      }

      const endpoint = slug === 'pdf-to-word'
        ? `${apiEndpoint}/${pdfMode}`
        : slug === 'jpg-to-pdf'
        ? `${apiEndpoint}${jpgPdfMode}`
        : apiEndpoint;
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (slug === 'favicon-inspect' && data.previews) {
          setFaviconPreviews(data.previews);
          setFaviconZip(data.zip || '');
        } else if (slug === 'barcode-decoder' || slug === 'barcode-reader' || slug === 'barcode-qr-decoder') {
          const results = Array.isArray(data.results) ? data.results : [];
          setBarcodeResults(results.map((item: any) => ({
            data: String(item.data ?? item.text ?? ''),
            type: item.type ? String(item.type) : undefined,
          })).filter((item: BarcodeDecodeResult) => item.data));
          setResultText('');
        } else {
          setResultText(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        }
        setStatus('done');
        setMessage(t.success);
        (window as any).__trackToolUsed?.(slug);
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(url);
        setDownloadName(outputName);
        setStatus('done');
        setMessage(t.success);
        (window as any).__trackToolUsed?.(slug);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(`${t.error}: ${err.message}`);
    }
  };

  const copyBarcodeValue = async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopiedBarcodeIndex(index);
    setTimeout(() => setCopiedBarcodeIndex(null), 2000);
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setZipping(true);
    setZipError('');
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setZipUrl('');

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch(`${API_BASE}/to-favicon/zip/`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setZipUrl(url);
    } catch (err: any) {
      setZipError(`${t.error}: ${err.message}`);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="tool-upload-area">
      {/* Tool info panel */}
      {toolInfo && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card-bg)',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)', fontSize: '0.9rem' }}>
            {toolInfo.title}
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {toolInfo.items.map((item, i) => (
              <li key={i} style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden file input — always in DOM so clicking Change still works */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multi}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      {files.length === 0 ? (
        /* Full drop zone — shown only when nothing selected */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'var(--color-card-bg)',
            transition: 'border-color 0.2s',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{t.dropHint}</p>
        </div>
      ) : (
        /* Compact strip — shown when files are selected */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0.6rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card-bg)',
          }}
        >
          <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {files.map((f) => f.name).join(', ')}
          </span>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              flexShrink: 0,
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {t.selectFile}
          </button>
        </div>
      )}

      {/* Image preview */}
      {previewUrl && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <img
            src={previewUrl}
            alt={previewName}
            style={{
              width: '72px',
              height: '72px',
              objectFit: 'contain',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0 0 / 12px 12px',
              flexShrink: 0,
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {previewName}
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              {formatBytes(previewSize)}
            </p>
          </div>
        </div>
      )}

      {slug === 'svg-to-png' && (
        <label
          style={{
            display: 'grid',
            gap: '0.4rem',
            marginTop: '1rem',
            maxWidth: '180px',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {scaleLabel}
          <input
            type="number"
            min={1}
            max={10}
            value={scale}
            onChange={(e) => setScale(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-card-bg)',
              color: 'var(--color-text)',
            }}
          />
        </label>
      )}

      {slug === 'pdf-to-word' && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {t.modeLabel}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {([
              { value: 'basic', name: t.modeFast, desc: t.modeFastDesc },
              { value: 'accurate', name: t.modeAccurate, desc: t.modeAccurateDesc },
            ] as const).map((opt) => {
              const active = pdfMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPdfMode(opt.value)}
                  style={{
                    flex: '1 1 200px',
                    textAlign: 'left',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: active ? 'rgba(59,130,246,0.08)' : 'var(--color-card-bg)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {opt.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {slug === 'jpg-to-pdf' && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {([
              { value: 'a4', name: t.modeA4, desc: t.modeA4Desc },
              { value: 'original', name: t.modeOriginal, desc: t.modeOriginalDesc },
            ] as const).map((opt) => {
              const active = jpgPdfMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJpgPdfMode(opt.value)}
                  style={{
                    flex: '1 1 160px',
                    textAlign: 'left',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: active ? 'rgba(59,130,246,0.08)' : 'var(--color-card-bg)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: active ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    {opt.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={upload}
          disabled={files.length === 0 || status === 'uploading'}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            cursor: files.length === 0 || status === 'uploading' ? 'not-allowed' : 'pointer',
            opacity: files.length === 0 || status === 'uploading' ? 0.5 : 1,
            fontWeight: 600,
          }}
        >
          {status === 'uploading' ? t.uploading : t.convert}
        </button>

        {slug === 'to-favicon' && (
          <button
            onClick={handleDownloadZip}
            disabled={files.length === 0 || zipping}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--color-primary)',
              backgroundColor: 'transparent',
              color: 'var(--color-primary)',
              cursor: files.length === 0 || zipping ? 'not-allowed' : 'pointer',
              opacity: files.length === 0 || zipping ? 0.5 : 1,
              fontWeight: 600,
            }}
          >
            {zipping ? t.zipping : t.downloadZip}
          </button>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName || outputName}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {t.download}
          </a>
        )}

        {zipUrl && (
          <a
            href={zipUrl}
            download="tool.tl-favicons.zip"
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #22c55e',
              color: '#22c55e',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ↓ favicons.zip
          </a>
        )}
      </div>

      {/* Status message */}
      {message && (
        <p
          style={{
            marginTop: '0.75rem',
            color: status === 'error' ? '#ef4444' : status === 'done' ? '#22c55e' : 'var(--color-text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          {message}
        </p>
      )}

      {zipError && (
        <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
          {zipError}
        </p>
      )}

      {/* favicon-inspect: image preview grid */}
      {faviconPreviews.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {faviconPreviews.map((p) => (
              <div
                key={p.size}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-card-bg)',
                }}
              >
                <img
                  src={p.data}
                  alt={p.size}
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    background: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0 0 / 10px 10px',
                    borderRadius: '4px',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{p.size}</span>
                <a
                  href={p.data}
                  download={`tool.tl-favicon-${p.size}.png`}
                  style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  ↓ PNG
                </a>
              </div>
            ))}
          </div>
          {faviconZip && (
            <a
              href={faviconZip}
              download="tool.tl-favicon-layers.zip"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              ↓ {t.downloadLayers}
            </a>
          )}
        </div>
      )}

      {barcodeResults.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          {barcodeResults.map((item, index) => (
            <div
              key={`${item.type || 'code'}-${index}`}
              style={{
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card-bg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                  {item.type === 'QRCODE' ? resultLabels.qr : item.type || resultLabels.code}
                </span>
                <button
                  type="button"
                  onClick={() => copyBarcodeValue(item.data, index)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: copiedBarcodeIndex === index ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: copiedBarcodeIndex === index ? '#fff' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  {copiedBarcodeIndex === index ? resultLabels.copied : resultLabels.copy}
                </button>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  wordBreak: 'break-all',
                }}
              >
                {item.data}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JSON/text result display */}
      {resultText && (
        <pre
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {resultText}
        </pre>
      )}
    </div>
  );
}

function readSvgSize(svgText: string) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error('Invalid SVG file');

  const svg = doc.documentElement;
  const width = parseSvgLength(svg.getAttribute('width'));
  const height = parseSvgLength(svg.getAttribute('height'));
  const viewBox = svg.getAttribute('viewBox')?.trim().split(/\s+/).map(Number);

  return {
    width: width || (viewBox?.length === 4 ? viewBox[2] : 0),
    height: height || (viewBox?.length === 4 ? viewBox[3] : 0),
  };
}

function parseSvgLength(value: string | null) {
  if (!value) return 0;
  const match = value.trim().match(/^([\d.]+)/);
  return match ? Number(match[1]) : 0;
}

async function convertSvgToPng(svgText: string, scale: number) {
  if (!svgText.trim()) throw new Error('Empty SVG file');

  const size = readSvgSize(svgText);
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = svgUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to load SVG image'));
    });

    // Prefer viewBox/explicit dimensions over browser-rendered naturalWidth
    // (browsers default SVG without width/height to 300px)
    const sourceWidth = (size.width > 0 ? size.width : null) ?? (image.naturalWidth > 0 ? image.naturalWidth : 1024);
    const sourceHeight = (size.height > 0 ? size.height : null) ?? (image.naturalHeight > 0 ? image.naturalHeight : 1024);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG export failed'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
