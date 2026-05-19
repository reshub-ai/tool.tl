import { useState, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    dropHint: 'Click or drag an image file here',
    supported: 'Supports PNG, JPG, GIF, WebP, SVG, BMP…',
    fileChosen: 'Selected:',
    resultLabel: 'Base64 Data URI',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    processing: 'Processing…',
    changeFile: 'Change',
    decoderLink: '→ Base64 Image Decoder',
  },
  'zh-CN': {
    dropHint: '点击或拖拽图片文件到此处',
    supported: '支持 PNG、JPG、GIF、WebP、SVG、BMP…',
    fileChosen: '已选择:',
    resultLabel: 'Base64 数据 URI',
    copy: '复制',
    copied: '已复制！',
    clear: '清空',
    processing: '处理中…',
    changeFile: '重新选择',
    decoderLink: '→ Base64 转图片解码器',
  },
  'zh-TW': {
    dropHint: '點擊或拖曳圖片檔到此處',
    supported: '支援 PNG、JPG、GIF、WebP、SVG、BMP…',
    fileChosen: '已選擇:',
    resultLabel: 'Base64 資料 URI',
    copy: '複製',
    copied: '已複製！',
    clear: '清除',
    processing: '處理中…',
    changeFile: '重新選擇',
    decoderLink: '→ Base64 轉圖片解碼器',
  },
  ja: {
    dropHint: 'クリックまたは画像ファイルをドラッグ',
    supported: 'PNG・JPG・GIF・WebP・SVG・BMP など対応',
    fileChosen: '選択済み:',
    resultLabel: 'Base64 データ URI',
    copy: 'コピー',
    copied: 'コピー済み！',
    clear: 'クリア',
    processing: '処理中…',
    changeFile: '選び直す',
    decoderLink: '→ Base64 画像デコーダー',
  },
};

const DECODER_SLUG: Record<string, string> = {
  en: '/base64-decoder-img',
  'zh-CN': '/zh-CN/base64-decoder-img',
  'zh-TW': '/zh-TW/base64-decoder-img',
  ja: '/ja/base64-decoder-img',
};

function formatBytes(b: number) {
  if (!b) return '';
  const u = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 2);
  return (b / 1024 ** i).toFixed(1) + ' ' + u[i];
}

export default function Base64EncoderImgTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [base64, setBase64] = useState('');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setBase64('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));

    const reader = new FileReader();
    reader.onload = (e) => { setBase64(e.target?.result as string ?? ''); (window as any).__trackToolUsed?.(slug); };
    reader.readAsDataURL(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const copy = async () => {
    if (!base64) return;
    await navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const clear = () => {
    setFile(null); setBase64('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '16px',
  };
  const pill: React.CSSProperties = {
    padding: '0.5rem 1.1rem', borderRadius: '10px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = {
    ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600,
  };

  return (
    <div style={card}>
      {/* Hidden input */}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Drop zone / compact strip */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-bg)',
            transition: 'all 0.2s', marginBottom: '12px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{t.dropHint}</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-bg)' }}>
          {previewUrl && (
            <img src={previewUrl} alt="" style={{
              width: '56px', height: '56px', objectFit: 'contain', borderRadius: '6px',
              border: '1px solid var(--color-border)', flexShrink: 0,
              background: 'repeating-conic-gradient(#ccc 0% 25%,transparent 0% 50%) 0 0/12px 12px',
            }} />
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{formatBytes(file.size)}</p>
          </div>
          <button onClick={() => inputRef.current?.click()} style={{ ...pill, padding: '0.3rem 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}>
            {t.changeFile}
          </button>
        </div>
      )}

      {/* Result textarea */}
      {base64 && (
        <>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            {t.resultLabel} ({(base64.length / 1024).toFixed(1)} KB)
          </label>
          <textarea
            value={base64}
            readOnly
            rows={6}
            style={{
              width: '100%', padding: '10px', border: '1px solid var(--color-border)',
              borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)',
              fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical',
              boxSizing: 'border-box', marginBottom: '10px',
            }}
          />
        </>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {base64 && (
          <button style={pillPrimary} onClick={copy}>
            {copied ? t.copied : t.copy}
          </button>
        )}
        {file && <button style={pill} onClick={clear}>{t.clear}</button>}
      </div>

      {/* Decoder link */}
      <div style={{ marginTop: '10px', fontSize: '0.82rem' }}>
        <a href={DECODER_SLUG[locale] || '/base64-decoder-img'} style={{ color: 'var(--color-primary)' }}>
          {t.decoderLink}
        </a>
      </div>
    </div>
  );
}
