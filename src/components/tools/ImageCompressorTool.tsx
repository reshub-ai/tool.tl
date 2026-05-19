import { useState, useRef, useCallback, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    drop: 'Click or drag images here', supported: 'Supports JPG, PNG, WebP — processed in your browser',
    quality: 'Quality', qualityHint: 'Lower = smaller file, higher = better quality',
    format: 'Output Format', fmtOriginal: 'Same as input', fmtJpg: 'JPEG', fmtPng: 'PNG', fmtWebp: 'WebP',
    compress: 'Compress', compressing: 'Compressing…',
    original: 'Original', compressed: 'Compressed', saved: 'Saved',
    download: 'Download', downloadAll: 'Download All', clear: 'Clear All',
    noReduction: 'No reduction', increased: 'Increased', onlyGif: 'GIF not supported — use GIF Split tool',
    privacy: 'All compression happens in your browser. No files are uploaded.',
    addMore: 'Add more images',
  },
  'zh-CN': {
    drop: '点击或拖拽图片到此处', supported: '支持 JPG、PNG、WebP，在浏览器本地处理',
    quality: '压缩质量', qualityHint: '越低文件越小，越高画质越好',
    format: '输出格式', fmtOriginal: '与原格式相同', fmtJpg: 'JPEG', fmtPng: 'PNG', fmtWebp: 'WebP',
    compress: '压缩', compressing: '压缩中…',
    original: '原始', compressed: '压缩后', saved: '节省',
    download: '下载', downloadAll: '全部下载', clear: '清除全部',
    noReduction: '未减小', increased: '增大', onlyGif: 'GIF 不支持，请使用 GIF 分解工具',
    privacy: '所有压缩在浏览器本地完成，不上传任何文件。',
    addMore: '继续添加图片',
  },
  'zh-TW': {
    drop: '點擊或拖曳圖片到此處', supported: '支援 JPG、PNG、WebP，在瀏覽器本地處理',
    quality: '壓縮品質', qualityHint: '越低檔案越小，越高畫質越好',
    format: '輸出格式', fmtOriginal: '與原格式相同', fmtJpg: 'JPEG', fmtPng: 'PNG', fmtWebp: 'WebP',
    compress: '壓縮', compressing: '壓縮中…',
    original: '原始', compressed: '壓縮後', saved: '節省',
    download: '下載', downloadAll: '全部下載', clear: '清除全部',
    noReduction: '未縮小', increased: '增大', onlyGif: 'GIF 不支援，請使用 GIF 分解工具',
    privacy: '所有壓縮在瀏覽器本地完成，不上傳任何檔案。',
    addMore: '繼續新增圖片',
  },
  ja: {
    drop: 'クリックまたは画像をドラッグ', supported: 'JPG・PNG・WebP 対応 — ブラウザでローカル処理',
    quality: '圧縮品質', qualityHint: '低いほどファイルが小さく、高いほど画質が良い',
    format: '出力形式', fmtOriginal: '入力と同じ', fmtJpg: 'JPEG', fmtPng: 'PNG', fmtWebp: 'WebP',
    compress: '圧縮する', compressing: '圧縮中…',
    original: '元のサイズ', compressed: '圧縮後', saved: '削減',
    download: 'ダウンロード', downloadAll: '全てDL', clear: '全てクリア',
    noReduction: '削減なし', increased: '増加', onlyGif: 'GIF は非対応 — GIF分解ツールをご利用ください',
    privacy: '全ての圧縮はブラウザ内で完結。ファイルはアップロードされません。',
    addMore: '画像を追加',
  },
};

type OutFmt = 'original' | 'image/jpeg' | 'image/png' | 'image/webp';

interface CompressResult {
  id: string;
  file: File;
  originalSize: number;
  compressedSize: number;
  compressedBlob: Blob;
  compressedUrl: string;
  previewUrl: string;
  ext: string;
  noReduction: boolean;
}

function fmtBytes(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(2) + ' MB';
}

async function compressImage(file: File, quality: number, outFmt: OutFmt): Promise<CompressResult> {
  const mime = outFmt === 'original' ? (file.type || 'image/jpeg') : outFmt;
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

  const bmp = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d')!;

  // White background for JPEG (no transparency)
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bmp, 0, 0);
  bmp.close();

  const q = mime === 'image/png' ? 1 : quality / 100;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('canvas toBlob failed')), mime, q);
  });

  // 若压缩后反而变大，回退到原文件（常见于 PNG→PNG）
  const noReduction = blob.size >= file.size;
  const finalBlob = noReduction ? file : blob;
  const finalExt = noReduction ? (file.name.split('.').pop() || ext) : ext;

  return {
    id: Math.random().toString(36).slice(2),
    file,
    originalSize: file.size,
    compressedSize: finalBlob.size,
    compressedBlob: finalBlob,
    compressedUrl: URL.createObjectURL(finalBlob),
    previewUrl: URL.createObjectURL(finalBlob),
    ext: finalExt,
    noReduction,
  };
}

export default function ImageCompressorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [quality, setQuality] = useState(80);
  const [outFmt, setOutFmt] = useState<OutFmt>('original');
  const [results, setResults] = useState<CompressResult[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (results.length > 0 && !trackedRef.current) {
      trackedRef.current = true;
      (window as any).__trackToolUsed?.(slug);
    }
  }, [results, slug]);

  // Cleanup URLs on unmount
  useEffect(() => () => { results.forEach(r => { URL.revokeObjectURL(r.compressedUrl); URL.revokeObjectURL(r.previewUrl); }); }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid = arr.filter(f => f.type.startsWith('image/') && f.type !== 'image/gif');
    const gifs = arr.filter(f => f.type === 'image/gif');
    const errs: string[] = gifs.map(() => t.onlyGif);
    setErrors(errs);
    if (!valid.length) return;

    setCompressing(true);
    try {
      const compressed = await Promise.all(valid.map(f => compressImage(f, quality, outFmt)));
      setResults(prev => [...prev, ...compressed]);
    } finally {
      setCompressing(false);
    }
  }, [quality, outFmt, t]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const download = (r: CompressResult) => {
    const a = document.createElement('a');
    a.href = r.compressedUrl;
    a.download = `tool.tl-${r.file.name.replace(/\.[^.]+$/, '')}.${r.ext}`;
    a.click();
  };

  const downloadAll = async () => {
    const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1' as any);
    const zip = new JSZip();
    results.forEach(r => zip.file(`tool.tl-${r.file.name.replace(/\.[^.]+$/, '')}.${r.ext}`, r.compressedBlob));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tool.tl-compressed.zip'; a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    results.forEach(r => { URL.revokeObjectURL(r.compressedUrl); URL.revokeObjectURL(r.previewUrl); });
    setResults([]); setErrors([]);
    trackedRef.current = false;
  };

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalCompressed = results.reduce((s, r) => s + r.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' };
  const pill: React.CSSProperties = { padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 };
  const pillPrimary: React.CSSProperties = { ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none' };
  const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.85rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Settings row */}
      <div style={{ ...card, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            <span>{t.quality}</span><strong style={{ color: 'var(--color-primary)' }}>{quality}%</strong>
          </div>
          <input type="range" min={10} max={100} step={5} value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>{t.qualityHint}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>{t.format}</div>
          <select style={{ ...inp, cursor: 'pointer' }} value={outFmt} onChange={e => setOutFmt(e.target.value as OutFmt)}>
            <option value="original">{t.fmtOriginal}</option>
            <option value="image/jpeg">{t.fmtJpg}</option>
            <option value="image/png">{t.fmtPng}</option>
            <option value="image/webp">{t.fmtWebp}</option>
          </select>
        </div>
        {results.length > 0 && (
          <button style={pillPrimary} onClick={() => { clear(); setTimeout(() => inputRef.current?.click(), 50); }}>{t.addMore}</button>
        )}
      </div>

      {/* Drop zone */}
      {results.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: '12px', padding: '3rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-card-bg)', transition: 'all 0.2s' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🖼️</div>
          <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--color-text)' }}>{compressing ? t.compressing : t.drop}</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
          {errors.map((e, i) => <p key={i} style={{ margin: '8px 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{e}</p>)}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.length) { processFiles(e.target.files); e.target.value = ''; } }} />

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Summary bar */}
          <div style={{ ...card, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.original}</span><br /><strong style={{ color: 'var(--color-text)' }}>{fmtBytes(totalOriginal)}</strong></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.compressed}</span><br /><strong style={{ color: 'var(--color-primary)' }}>{fmtBytes(totalCompressed)}</strong></div>
              <div><span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.saved}</span><br /><strong style={{ color: '#10b981' }}>{totalSaved > 0 ? '-' + fmtBytes(totalSaved) + ' (' + Math.round((totalSaved / totalOriginal) * 100) + '%)' : t.noReduction}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {results.length > 1 && <button style={pillPrimary} onClick={downloadAll}>{t.downloadAll} ({results.length})</button>}
              <button style={pill} onClick={() => inputRef.current?.click()}>{t.addMore}</button>
              <button style={pill} onClick={clear}>{t.clear}</button>
            </div>
          </div>

          {/* Image grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {results.map((r) => {
              const saved = r.originalSize - r.compressedSize;
              const savedPct = Math.round((saved / r.originalSize) * 100);
              return (
                <div key={r.id} style={{ ...card, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <img src={r.previewUrl} alt={r.file.name} loading="lazy"
                    style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', background: 'repeating-conic-gradient(#ccc 0% 25%,transparent 0% 50%) 0 0/16px 16px' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>{r.file.name}</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t.original}: {fmtBytes(r.originalSize)}</span>
                    <span>→</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{fmtBytes(r.compressedSize)}</span>
                    <span style={{ color: saved > 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {saved > 0 ? `-${savedPct}%` : saved < 0 ? `+${Math.abs(savedPct)}%` : '0%'}
                    </span>
                  </div>
                  {/* Size bar */}
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-border)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (r.compressedSize / r.originalSize) * 100)}%`, height: '100%', background: saved > 0 ? '#10b981' : '#ef4444', transition: 'width 0.4s' }} />
                  </div>
                  {r.noReduction
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>⚠ {t.noReduction}</span>
                        <button style={{ ...pill, padding: '0.3rem 0.7rem', fontSize: '0.75rem' }} onClick={() => download(r)}>{t.download}</button>
                      </div>
                    : <button style={pillPrimary} onClick={() => download(r)}>{t.download}</button>
                  }
                </div>
              );
            })}
          </div>
        </>
      )}

      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>🔒 {t.privacy}</p>
    </div>
  );
}
