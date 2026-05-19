import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    dropHint: 'Click or drag a GIF file here',
    supported: 'Only .gif files supported',
    uploading: 'Uploading…',
    processing: 'Extracting frames…',
    frameCount: '{n} frames extracted',
    size: 'Size',
    delay: 'Delay',
    ms: 'ms',
    download: 'Download',
    downloadAll: 'Download All (ZIP)',
    zipping: 'Packaging…',
    clear: 'Clear',
    error: 'Failed to process GIF. Please try again.',
    onlyGif: 'Only .gif files are supported.',
  },
  'zh-CN': {
    dropHint: '点击或拖拽 GIF 文件到此处',
    supported: '仅支持 .gif 文件',
    uploading: '上传中…',
    processing: '提取帧中…',
    frameCount: '已提取 {n} 帧',
    size: '尺寸',
    delay: '延迟',
    ms: '毫秒',
    download: '下载',
    downloadAll: '全部下载（ZIP）',
    zipping: '打包中…',
    clear: '清空',
    error: 'GIF 处理失败，请重试。',
    onlyGif: '仅支持 .gif 格式文件。',
  },
  'zh-TW': {
    dropHint: '點擊或拖曳 GIF 檔到此處',
    supported: '僅支援 .gif 檔案',
    uploading: '上傳中…',
    processing: '擷取影格中…',
    frameCount: '已擷取 {n} 個影格',
    size: '尺寸',
    delay: '延遲',
    ms: '毫秒',
    download: '下載',
    downloadAll: '全部下載（ZIP）',
    zipping: '打包中…',
    clear: '清除',
    error: 'GIF 處理失敗，請重試。',
    onlyGif: '僅支援 .gif 格式檔案。',
  },
  ja: {
    dropHint: 'クリックまたは GIF ファイルをドラッグ',
    supported: '.gif ファイルのみ対応',
    uploading: 'アップロード中…',
    processing: 'フレーム抽出中…',
    frameCount: '{n} フレームを抽出しました',
    size: 'サイズ',
    delay: '遅延',
    ms: 'ms',
    download: 'ダウンロード',
    downloadAll: '全フレームDL（ZIP）',
    zipping: 'パッケージ中…',
    clear: 'クリア',
    error: 'GIF の処理に失敗しました。',
    onlyGif: '.gif ファイルのみ対応しています。',
  },
};

interface FrameInfo {
  index: number;
  filename: string;
  thumb_filename: string;
  delay: number;
  width: number;
  height: number;
}

interface GifResult {
  session_id: string;
  width: number;
  height: number;
  frame_count: number;
  frames: FrameInfo[];
}

export default function GifSplitTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<GifResult | null>(null);
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const frameUrl = useCallback((sessionId: string, filename: string) =>
    `${API_BASE}${apiEndpoint}frame/${sessionId}/${filename}`,
    [apiEndpoint]);

  const downloadUrl = useCallback((sessionId: string, filename: string) =>
    `${API_BASE}${apiEndpoint}download/${sessionId}/${filename}`,
    [apiEndpoint]);

  const upload = async (f: File) => {
    setFile(f);
    setStatus('uploading');
    setError('');
    setResult(null);

    const fd = new FormData();
    fd.append('file', f);
    try {
      setStatus('uploading');
      const res = await fetch(`${API_BASE}${apiEndpoint}upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      setStatus('done');
      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setError(e.message || t.error);
      setStatus('error');
    }
  };

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.gif')) { setError(t.onlyGif); return; }
    upload(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const downloadFrame = async (sessionId: string, filename: string, idx: number) => {
    const url = downloadUrl(sessionId, filename);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tool.tl-frame-${String(idx + 1).padStart(3, '0')}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadAll = async () => {
    if (!result) return;
    setZipping(true);
    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}download-all/${result.session_id}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tool.tl-gif-frames.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  const clear = () => {
    if (result) fetch(`${API_BASE}${apiEndpoint}session/${result.session_id}`, { method: 'DELETE' }).catch(() => {});
    setFile(null); setResult(null); setStatus('idle'); setError('');
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '14px',
  };
  const pill: React.CSSProperties = {
    padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = { ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <input ref={inputRef} type="file" accept=".gif" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Drop zone / status */}
      {status === 'idle' || status === 'error' ? (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '12px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-card-bg)', transition: 'all 0.2s',
          }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{t.dropHint}</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
          {error && <p style={{ margin: '10px 0 0', color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>}
        </div>
      ) : (status === 'uploading' || status === 'done') && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{file?.name}</p>
            {result && (
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                {t.frameCount.replace('{n}', String(result.frame_count))} · {result.width}×{result.height}
              </p>
            )}
            {status === 'uploading' && (
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--color-primary)' }}>{t.processing}</p>
            )}
          </div>
          <button style={pill} onClick={clear}>{t.clear}</button>
        </div>
      )}

      {/* Frame grid */}
      {result && result.frames.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
              {t.frameCount.replace('{n}', String(result.frame_count))}
            </span>
            <button style={pillPrimary} onClick={downloadAll} disabled={zipping}>
              {zipping ? t.zipping : t.downloadAll}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {result.frames.map((frame) => (
              <div key={frame.index} style={{
                border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden',
                background: 'var(--color-bg)', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'repeating-conic-gradient(#ccc 0% 25%,transparent 0% 50%) 0 0/12px 12px' }}>
                  <img
                    src={frameUrl(result.session_id, frame.filename)}
                    alt={`Frame ${frame.index + 1}`}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <span style={{
                    position: 'absolute', top: '4px', left: '4px',
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: '0.7rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                  }}>#{frame.index + 1}</span>
                </div>
                <div style={{ padding: '6px 8px', fontSize: '0.72rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  <div>{frame.delay} {t.ms}</div>
                  <div>{frame.width}×{frame.height}</div>
                </div>
                <button
                  onClick={() => downloadFrame(result.session_id, frame.filename, frame.index)}
                  style={{ ...pill, margin: '0 6px 6px', padding: '0.25rem 0', textAlign: 'center', fontSize: '0.75rem' }}>
                  {t.download}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
