import { useState, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    dropHint: 'Click or drag a favicon.ico file here',
    supported: 'Only .ico files supported',
    processing: 'Extracting frames…',
    frameCount: '{n} sizes extracted',
    format: 'Format',
    download: 'Download',
    downloadAll: 'Download All (ZIP)',
    clear: 'Clear',
    error: 'Failed to process ICO file. Please try again.',
    onlyIco: 'Only .ico files are supported.',
    noFrames: 'No frames found in this ICO file.',
  },
  'zh-CN': {
    dropHint: '点击或拖拽 favicon.ico 文件到此处',
    supported: '仅支持 .ico 文件',
    processing: '解析中…',
    frameCount: '已提取 {n} 个尺寸',
    format: '格式',
    download: '下载',
    downloadAll: '全部下载（ZIP）',
    clear: '清空',
    error: '文件处理失败，请重试。',
    onlyIco: '仅支持 .ico 格式文件。',
    noFrames: '该 ICO 文件中未找到有效帧。',
  },
  'zh-TW': {
    dropHint: '點擊或拖曳 favicon.ico 檔到此處',
    supported: '僅支援 .ico 檔案',
    processing: '解析中…',
    frameCount: '已擷取 {n} 個尺寸',
    format: '格式',
    download: '下載',
    downloadAll: '全部下載（ZIP）',
    clear: '清除',
    error: '檔案處理失敗，請重試。',
    onlyIco: '僅支援 .ico 格式檔案。',
    noFrames: '此 ICO 檔中未找到有效影格。',
  },
  ja: {
    dropHint: 'クリックまたは favicon.ico をドラッグ',
    supported: '.ico ファイルのみ対応',
    processing: '解析中…',
    frameCount: '{n} サイズを抽出しました',
    format: 'フォーマット',
    download: 'ダウンロード',
    downloadAll: '全サイズDL（ZIP）',
    clear: 'クリア',
    error: 'ファイルの処理に失敗しました。',
    onlyIco: '.ico ファイルのみ対応しています。',
    noFrames: 'このICOファイルにフレームが見つかりません。',
  },
};

interface Preview {
  size: string;
  data: string; // data:image/png;base64,...
}

type Format = 'png' | 'jpg';

function dataUriToBlob(dataUri: string): Blob {
  const [header, b64] = dataUri.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function pngDataUriToJpgBlob(dataUri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/jpeg', 0.95);
    };
    img.onerror = reject;
    img.src = dataUri;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FaviconInspectTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [zipDataUri, setZipDataUri] = useState('');
  const [format, setFormat] = useState<Format>('png');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (f: File) => {
    setFile(f);
    setStatus('loading');
    setError('');
    setPreviews([]);
    setZipDataUri('');

    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.previews?.length) throw new Error(t.noFrames);
      setPreviews(data.previews);
      setZipDataUri(data.zip || '');
      setStatus('done');
      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setError(e.message || t.error);
      setStatus('error');
    }
  };

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.ico') && f.type !== 'image/x-icon' && f.type !== 'image/vnd.microsoft.icon') {
      setError(t.onlyIco);
      return;
    }
    upload(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const downloadFrame = async (preview: Preview) => {
    const sizePart = preview.size.replace('x', '_');
    if (format === 'png') {
      downloadBlob(dataUriToBlob(preview.data), `favicon_${sizePart}.png`);
    } else {
      const blob = await pngDataUriToJpgBlob(preview.data);
      downloadBlob(blob, `favicon_${sizePart}.jpg`);
    }
  };

  const downloadAll = () => {
    if (!zipDataUri) return;
    const blob = dataUriToBlob(zipDataUri);
    downloadBlob(blob, 'favicons.zip');
  };

  const clear = () => {
    setFile(null);
    setPreviews([]);
    setZipDataUri('');
    setStatus('idle');
    setError('');
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '14px',
  };
  const pill: React.CSSProperties = {
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = {
    ...pill,
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <input ref={inputRef} type="file" accept=".ico,image/x-icon,image/vnd.microsoft.icon"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Drop zone */}
      {(status === 'idle' || status === 'error') && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '12px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-card-bg)',
            transition: 'all 0.2s',
          }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{t.dropHint}</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
          {error && <p style={{ margin: '10px 0 0', color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>}
        </div>
      )}

      {/* File info bar */}
      {(status === 'loading' || status === 'done') && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{file?.name}</p>
            {status === 'done' && previews.length > 0 && (
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {t.frameCount.replace('{n}', String(previews.length))}
              </p>
            )}
            {status === 'loading' && (
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--color-primary)' }}>{t.processing}</p>
            )}
          </div>
          <button style={pill} onClick={clear}>{t.clear}</button>
        </div>
      )}

      {/* Results */}
      {status === 'done' && previews.length > 0 && (
        <div style={card}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            {/* Format toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.format}:</span>
              {(['png', 'jpg'] as Format[]).map((f) => (
                <button key={f} onClick={() => setFormat(f)} style={{
                  ...pill,
                  background: format === f ? 'var(--color-primary)' : 'var(--color-card-bg)',
                  color: format === f ? '#fff' : 'var(--color-text)',
                  border: format === f ? 'none' : '1px solid var(--color-border)',
                  padding: '0.3rem 0.8rem',
                }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            {zipDataUri && (
              <button style={pillPrimary} onClick={downloadAll}>{t.downloadAll}</button>
            )}
          </div>

          {/* Frame grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
            {previews.map((preview) => (
              <div key={preview.size} style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--color-bg)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Preview area with checkerboard background for transparency */}
                <div style={{
                  position: 'relative', aspectRatio: '1', overflow: 'hidden',
                  background: 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0 0/12px 12px',
                }}>
                  <img
                    src={preview.data}
                    alt={`favicon ${preview.size}`}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                  />
                </div>
                {/* Size label */}
                <div style={{
                  padding: '5px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                }}>
                  {preview.size}
                </div>
                {/* Download button */}
                <button
                  onClick={() => downloadFrame(preview)}
                  style={{ ...pill, margin: '0 6px 6px', padding: '0.25rem 0', textAlign: 'center', fontSize: '0.75rem' }}>
                  {t.download} {format.toUpperCase()}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
