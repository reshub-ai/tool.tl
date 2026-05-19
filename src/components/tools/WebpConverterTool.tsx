import { useState, useRef, useCallback, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; defaultMode?: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    dropHint: 'Click or drag a WebP file here',
    fileChosen: 'Selected:',
    format: 'Output Format',
    quality: 'JPG Quality',
    convert: 'Convert',
    clear: 'Clear',
    result: 'Result',
    download: 'Download',
    downloading: 'Downloading…',
    downloaded: 'Saved!',
    noFile: 'Please select a WebP file first.',
    onlyWebp: 'Only .webp files are supported.',
    converting: 'Converting…',
    error: 'Conversion failed. Please try again.',
  },
  'zh-CN': {
    dropHint: '点击或拖拽 WebP 文件到此处',
    fileChosen: '已选择:',
    format: '输出格式',
    quality: 'JPG 质量',
    convert: '转换',
    clear: '清空',
    result: '转换结果',
    download: '下载',
    downloading: '下载中…',
    downloaded: '已保存！',
    noFile: '请先选择一个 WebP 文件。',
    onlyWebp: '仅支持 .webp 格式文件。',
    converting: '转换中…',
    error: '转换失败，请重试。',
  },
  'zh-TW': {
    dropHint: '點擊或拖曳 WebP 檔到此處',
    fileChosen: '已選擇:',
    format: '輸出格式',
    quality: 'JPG 品質',
    convert: '轉換',
    clear: '清除',
    result: '轉換結果',
    download: '下載',
    downloading: '下載中…',
    downloaded: '已儲存！',
    noFile: '請先選擇一個 WebP 檔案。',
    onlyWebp: '僅支援 .webp 格式檔案。',
    converting: '轉換中…',
    error: '轉換失敗，請重試。',
  },
  ja: {
    dropHint: 'クリックまたは WebP ファイルをドラッグ',
    fileChosen: '選択済み:',
    format: '出力形式',
    quality: 'JPG 品質',
    convert: '変換',
    clear: 'クリア',
    result: '変換結果',
    download: 'ダウンロード',
    downloading: 'ダウンロード中…',
    downloaded: '保存しました！',
    noFile: 'まず WebP ファイルを選択してください。',
    onlyWebp: '.webp ファイルのみ対応しています。',
    converting: '変換中…',
    error: '変換に失敗しました。もう一度お試しください。',
  },
};

function formatBytes(b: number) {
  if (!b) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / 1024 ** i).toFixed(1) + ' ' + u[i];
}

export default function WebpConverterTool({ slug, apiEndpoint, locale, defaultMode }: Props) {
  const t = i18n[locale] || i18n.en;
  const initFmt = (defaultMode === 'png' ? 'png' : 'jpg') as 'jpg' | 'png';

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fmt, setFmt] = useState<'jpg' | 'png'>(initFmt);
  const [quality, setQuality] = useState(95);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [resultName, setResultName] = useState('');
  const [tipState, setTipState] = useState<'hidden' | 'downloading' | 'done'>('hidden');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.webp')) { setError(t.onlyWebp); return; }
    setFile(f);
    setError('');
    setResultUrl('');
    setResultName('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const convert = useCallback(async () => {
    if (!file) { setError(t.noFile); return; }
    setConverting(true); setError(''); setResultUrl(''); setResultName('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fmt', fmt);
      if (fmt === 'jpg') fd.append('quality', String(quality));
      const res = await fetch(`${API_BASE}${apiEndpoint}api`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.msg || 'error');
      // Normalize domain: replace convert.tool.tl with api.tool.tl regardless of server config
      const normalizedUrl = (data.url as string).replace('convert.tool.tl', 'api.tool.tl');
      setResultUrl(normalizedUrl);
      setResultName(data.filename || `converted.${fmt}`);
      (window as any).__trackToolUsed?.(slug);
    } catch {
      setError(t.error);
    } finally {
      setConverting(false);
    }
  }, [file, fmt, quality, apiEndpoint, t]);

  const download = async () => {
    if (!resultUrl) return;
    setTipState('downloading');
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tool.tl-${resultName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setTimeout(() => { setTipState('done'); setTimeout(() => setTipState('hidden'), 1500); }, 300);
    } catch {
      setTipState('hidden');
    }
  };

  const clear = () => {
    setFile(null); setError(''); setResultUrl(''); setResultName('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setTipState('hidden');
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '14px',
  };
  const pill: React.CSSProperties = {
    padding: '0.55rem 1.25rem', borderRadius: '10px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = {
    ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600,
  };
  const ctrl: React.CSSProperties = {
    padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.875rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Hidden input */}
      <input ref={inputRef} type="file" accept=".webp" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Drop zone / compact strip */}
      {!file ? (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-card-bg)',
            transition: 'all 0.2s',
          }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{t.dropHint}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...card }}>
          {previewUrl && (
            <img src={previewUrl} alt={file.name} style={{
              width: '60px', height: '60px', objectFit: 'contain', borderRadius: '6px',
              border: '1px solid var(--color-border)', flexShrink: 0,
              background: 'repeating-conic-gradient(#ccc 0% 25%,transparent 0% 50%) 0 0/12px 12px',
            }} />
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              {formatBytes(file.size)}
            </p>
          </div>
          <button onClick={() => inputRef.current?.click()}
            style={{ ...pill, padding: '0.3rem 0.85rem', fontSize: '0.8rem', flexShrink: 0 }}>
            {t.fileChosen.replace(':', '')}…
          </button>
        </div>
      )}

      {/* Options */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{t.format}</span>
        <select value={fmt} onChange={(e) => setFmt(e.target.value as 'jpg' | 'png')} style={ctrl}>
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
        </select>

        {fmt === 'jpg' && (
          <>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{t.quality}</span>
            <input type="number" min={1} max={100} value={quality}
              onChange={(e) => setQuality(Math.min(100, Math.max(1, Number(e.target.value))))}
              style={{ ...ctrl, width: '70px' }} />
          </>
        )}

        <button style={pillPrimary} onClick={convert} disabled={converting || !file}>
          {converting ? t.converting : t.convert}
        </button>
        <button style={pill} onClick={clear}>{t.clear}</button>
      </div>

      {error && <p style={{ margin: 0, color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

      {/* Result */}
      {resultUrl && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
          <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {resultName}
          </span>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button style={pillPrimary} onClick={download}>
              {tipState === 'downloading' ? t.downloading : tipState === 'done' ? t.downloaded : t.download}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
