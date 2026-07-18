import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    drop: 'Click or drag an image here',
    supported: 'Supports JPG, PNG, WebP, GIF, BMP',
    width: 'Width (px)',
    height: 'Height (px)',
    lock: 'Lock aspect ratio',
    format: 'Output Format',
    fmtOriginal: 'Same as input',
    fmtJpg: 'JPEG',
    fmtPng: 'PNG',
    fmtWebp: 'WebP',
    quality: 'Quality',
    resize: 'Resize & Download',
    resizing: 'Processing…',
    original: 'Original',
    output: 'Output',
    changeFile: 'Change',
    privacy: 'All processing happens in your browser. Nothing is uploaded.',
    errorSize: 'Width and height must be greater than 0.',
    preset: 'Presets',
  },
  'zh-CN': {
    drop: '点击或拖拽图片到此处',
    supported: '支持 JPG、PNG、WebP、GIF、BMP',
    width: '宽度（像素）',
    height: '高度（像素）',
    lock: '锁定宽高比',
    format: '输出格式',
    fmtOriginal: '与原格式相同',
    fmtJpg: 'JPEG',
    fmtPng: 'PNG',
    fmtWebp: 'WebP',
    quality: '质量',
    resize: '调整并下载',
    resizing: '处理中…',
    original: '原图',
    output: '输出',
    changeFile: '重新选择',
    privacy: '所有处理在浏览器本地完成，不上传任何文件。',
    errorSize: '宽度和高度必须大于 0。',
    preset: '预设',
  },
  'zh-TW': {
    drop: '點擊或拖曳圖片到此處',
    supported: '支援 JPG、PNG、WebP、GIF、BMP',
    width: '寬度（像素）',
    height: '高度（像素）',
    lock: '鎖定寬高比',
    format: '輸出格式',
    fmtOriginal: '與原格式相同',
    fmtJpg: 'JPEG',
    fmtPng: 'PNG',
    fmtWebp: 'WebP',
    quality: '品質',
    resize: '調整並下載',
    resizing: '處理中…',
    original: '原圖',
    output: '輸出',
    changeFile: '重新選擇',
    privacy: '所有處理在瀏覽器本機完成，不上傳任何檔案。',
    errorSize: '寬度和高度必須大於 0。',
    preset: '預設',
  },
  ja: {
    drop: 'クリックまたは画像をドラッグ',
    supported: 'JPG・PNG・WebP・GIF・BMP対応',
    width: '幅（ピクセル）',
    height: '高さ（ピクセル）',
    lock: 'アスペクト比を固定',
    format: '出力形式',
    fmtOriginal: '元の形式と同じ',
    fmtJpg: 'JPEG',
    fmtPng: 'PNG',
    fmtWebp: 'WebP',
    quality: '品質',
    resize: 'リサイズ＆ダウンロード',
    resizing: '処理中…',
    original: '元画像',
    output: '出力',
    changeFile: '選び直す',
    privacy: 'すべての処理はブラウザ内で完結。ファイルはアップロードされません。',
    errorSize: '幅と高さは0より大きくしてください。',
    preset: 'プリセット',
  },
};

type OutFmt = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';

const PRESETS = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
  { label: '800×600', w: 800, h: 600 },
  { label: '512×512', w: 512, h: 512 },
  { label: '256×256', w: 256, h: 256 },
];

function formatBytes(b: number) {
  if (!b) return '';
  const u = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 2);
  return (b / 1024 ** i).toFixed(1) + ' ' + u[i];
}

function getExt(mime: string) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export default function ResizeImageTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [locked, setLocked] = useState(true);
  const [format, setFormat] = useState<OutFmt>('original');
  const [quality, setQuality] = useState(85);
  const [processing, setProcessing] = useState(false);
  const [resultInfo, setResultInfo] = useState<{ size: number; w: number; h: number } | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedRef = useRef(false);
  const ratio = useRef(1);

  const handleFile = (f: File) => {
    setFile(f); setResultInfo(null); setError('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setOrigW(img.naturalWidth); setOrigH(img.naturalHeight);
      setWidth(String(img.naturalWidth)); setHeight(String(img.naturalHeight));
      ratio.current = img.naturalWidth / img.naturalHeight;
    };
    img.src = url;
  };

  const onWidthChange = (v: string) => {
    setWidth(v);
    if (locked && v && !isNaN(Number(v))) {
      setHeight(String(Math.round(Number(v) / ratio.current)));
    }
  };
  const onHeightChange = (v: string) => {
    setHeight(v);
    if (locked && v && !isNaN(Number(v))) {
      setWidth(String(Math.round(Number(v) * ratio.current)));
    }
  };

  const applyPreset = (w: number, h: number) => {
    if (locked) {
      // fit within preset, preserve ratio
      const scaleW = w / origW;
      const scaleH = h / origH;
      const scale = Math.min(scaleW, scaleH);
      setWidth(String(Math.round(origW * scale)));
      setHeight(String(Math.round(origH * scale)));
    } else {
      setWidth(String(w)); setHeight(String(h));
    }
  };

  const doResize = useCallback(async () => {
    if (!file) return;
    const w = parseInt(width); const h = parseInt(height);
    if (!w || !h || w <= 0 || h <= 0) { setError(t.errorSize); return; }
    setError(''); setProcessing(true);

    try {
      const bmp = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      const mime = format === 'original' ? (file.type || 'image/jpeg') : format;
      if (mime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close();

      const q = mime === 'image/png' ? 1 : quality / 100;
      const blob = await new Promise<Blob>((res, rej) => {
        canvas.toBlob((b) => b ? res(b) : rej(new Error('toBlob failed')), mime, q);
      });

      setResultInfo({ size: blob.size, w, h });

      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ext = getExt(mime);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${baseName}_${w}x${h}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);

      if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
    } catch (e) {
      setError(String(e));
    } finally {
      setProcessing(false);
    }
  }, [file, width, height, format, quality, t.errorSize, slug]);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const inp: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    fontSize: '0.95rem', width: '100%', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)' };
  const pill: React.CSSProperties = {
    padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.82rem',
  };
  const pillPrimary: React.CSSProperties = {
    ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600,
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* 拖拽区 / 已选文件 */}
      {!file ? (
        <div style={card}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f && f.type.startsWith('image/')) handleFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '10px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-bg)', transition: 'all 0.2s',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>{t.drop}</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
          </div>
        </div>
      ) : (
        <div style={card}>
          {/* 文件信息条 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            {previewUrl && (
              <img src={previewUrl} alt={file.name} style={{
                width: '60px', height: '60px', objectFit: 'contain', borderRadius: '6px',
                border: '1px solid var(--color-border)', flexShrink: 0,
                background: 'repeating-conic-gradient(#ccc 0% 25%,transparent 0% 50%) 0 0/12px 12px',
              }} />
            )}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' }}>{file.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {origW}×{origH} · {formatBytes(file.size)}
              </p>
            </div>
            <button onClick={() => inputRef.current?.click()} style={{ ...pill, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
              {t.changeFile}
            </button>
          </div>

          {/* 预设尺寸 */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={lbl}>{t.preset}</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESETS.map((p) => (
                <button key={p.label} style={pill} onClick={() => applyPreset(p.w, p.h)}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* 宽高输入 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'end', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>{t.width}</label>
              <input style={inp} type="number" min="1" value={width} onChange={(e) => onWidthChange(e.target.value)} />
            </div>
            <button
              onClick={() => setLocked(!locked)}
              title={t.lock}
              style={{
                padding: '0.5rem 0.6rem', borderRadius: '6px',
                border: '1px solid var(--color-border)', background: locked ? 'var(--color-primary)' : 'var(--color-card-bg)',
                color: locked ? '#fff' : 'var(--color-text)', cursor: 'pointer', fontSize: '1rem', marginBottom: '0',
              }}
            >
              {locked ? '🔒' : '🔓'}
            </button>
            <div>
              <label style={lbl}>{t.height}</label>
              <input style={inp} type="number" min="1" value={height} onChange={(e) => onHeightChange(e.target.value)} />
            </div>
          </div>

          {/* 格式 & 质量 */}
          <div className="tl-auto-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>{t.format}</label>
              <select style={inp} value={format} onChange={(e) => setFormat(e.target.value as OutFmt)}>
                <option value="original">{t.fmtOriginal}</option>
                <option value="image/jpeg">{t.fmtJpg}</option>
                <option value="image/png">{t.fmtPng}</option>
                <option value="image/webp">{t.fmtWebp}</option>
              </select>
            </div>
            <div>
              <label style={lbl}>{t.quality}: {quality}%</label>
              <input type="range" min="10" max="100" value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={format === 'image/png'}
              />
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>}

          {/* 结果信息 */}
          {resultInfo && (
            <div style={{
              padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg)',
              border: '1px solid var(--color-primary)', marginBottom: '0.75rem',
              display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.output}</span>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{resultInfo.w}×{resultInfo.h}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.output} size</span>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{formatBytes(resultInfo.size)}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={doResize} disabled={processing} style={pillPrimary}>
              {processing ? t.resizing : t.resize}
            </button>
          </div>

          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.privacy}</p>
        </div>
      )}
    </div>
  );
}
