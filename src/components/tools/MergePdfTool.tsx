import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    drop: 'Click or drag PDF files here',
    supported: 'Upload multiple PDF files — they will be merged in order',
    addMore: 'Add More PDFs',
    merge: 'Merge PDFs',
    merging: 'Merging…',
    download: 'Download Merged PDF',
    clear: 'Clear All',
    reorder: 'Drag to reorder',
    pages: 'pages',
    files: 'files',
    remove: '✕',
    onlyPdf: 'Only PDF files are supported.',
    success: 'Merge complete!',
    failed: 'Merge failed. Please try again.',
    uploading: 'Uploading and merging…',
    maxFiles: 'Maximum 30 PDF files.',
    privacy: 'Files are sent to our server for processing and deleted immediately after.',
  },
  'zh-CN': {
    drop: '点击或拖拽 PDF 文件到此处',
    supported: '上传多个 PDF 文件，将按顺序合并',
    addMore: '继续添加 PDF',
    merge: '合并 PDF',
    merging: '合并中…',
    download: '下载合并后的 PDF',
    clear: '清除全部',
    reorder: '拖动排序',
    pages: '页',
    files: '个文件',
    remove: '✕',
    onlyPdf: '仅支持 PDF 文件。',
    success: '合并完成！',
    failed: '合并失败，请重试。',
    uploading: '上传并合并中…',
    maxFiles: '最多支持 30 个 PDF 文件。',
    privacy: '文件将发送到服务器处理，处理完毕后立即删除。',
  },
  'zh-TW': {
    drop: '點擊或拖曳 PDF 檔案到此處',
    supported: '上傳多個 PDF 檔案，將按順序合併',
    addMore: '繼續新增 PDF',
    merge: '合併 PDF',
    merging: '合併中…',
    download: '下載合併後的 PDF',
    clear: '清除全部',
    reorder: '拖動排序',
    pages: '頁',
    files: '個檔案',
    remove: '✕',
    onlyPdf: '僅支援 PDF 檔案。',
    success: '合併完成！',
    failed: '合併失敗，請重試。',
    uploading: '上傳並合併中…',
    maxFiles: '最多支援 30 個 PDF 檔案。',
    privacy: '檔案將傳送至伺服器處理，處理完畢後立即刪除。',
  },
  ja: {
    drop: 'クリックまたはPDFをドラッグ',
    supported: '複数のPDFをアップロード — 順番に結合されます',
    addMore: 'さらにPDFを追加',
    merge: 'PDFを結合',
    merging: '結合中…',
    download: '結合済みPDFをダウンロード',
    clear: 'すべてクリア',
    reorder: 'ドラッグで並び替え',
    pages: 'ページ',
    files: '件',
    remove: '✕',
    onlyPdf: 'PDFファイルのみ対応しています。',
    success: '結合完了！',
    failed: '結合に失敗しました。もう一度お試しください。',
    uploading: 'アップロードして結合中…',
    maxFiles: '最大30件のPDFファイルまで。',
    privacy: 'ファイルはサーバーに送信して処理後、即座に削除されます。',
  },
};

interface PdfItem { id: string; file: File; name: string; }

function uid() { return Math.random().toString(36).slice(2); }
function fmtSize(b: number) {
  const u = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(Math.max(b, 1)) / Math.log(1024)), 2);
  return (b / 1024 ** i).toFixed(1) + ' ' + u[i];
}

export default function MergePdfTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [items, setItems] = useState<PdfItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; msg: string } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<string | null>(null);
  const trackedRef = useRef(false);

  const addFiles = (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) { setStatus({ type: 'error', msg: t.onlyPdf }); return; }
    if (items.length + pdfs.length > 30) { setStatus({ type: 'error', msg: t.maxFiles }); return; }
    setItems((prev) => [...prev, ...pdfs.map((f) => ({ id: uid(), file: f, name: f.name }))]);
    setDownloadUrl(''); setStatus(null);
  };

  const removeItem = (id: string) => { setItems((prev) => prev.filter((i) => i.id !== id)); setDownloadUrl(''); };
  const clear = () => { setItems([]); setDownloadUrl(''); setStatus(null); };

  const onDragStart = (id: string) => { dragItem.current = id; };
  const onDragOverItem = (id: string) => { if (dragItem.current && dragItem.current !== id) setDragOver(id); };
  const onDropItem = (id: string) => {
    if (!dragItem.current || dragItem.current === id) { setDragOver(null); return; }
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === dragItem.current);
      const to = prev.findIndex((i) => i.id === id);
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragOver(null); dragItem.current = null;
  };

  const merge = useCallback(async () => {
    if (!items.length || merging) return;
    setMerging(true); setDownloadUrl('');
    setStatus({ type: 'info', msg: t.uploading });

    const fd = new FormData();
    items.forEach((item) => fd.append('files', item.file));

    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setStatus({ type: 'error', msg: err.error || t.failed });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus({ type: 'success', msg: t.success });
      if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
    } catch {
      setStatus({ type: 'error', msg: t.failed });
    } finally {
      setMerging(false);
    }
  }, [items, merging, apiEndpoint, t, slug]);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const statusColor = { info: 'var(--color-primary)', success: '#16a34a', error: '#dc2626' };

  return (
    <div>
      <input ref={inputRef} type="file" accept="application/pdf" multiple style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

      {/* 拖拽区 */}
      <div style={card}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-bg)', transition: 'all 0.2s',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>📄 {t.drop}</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
        </div>
      </div>

      {/* 文件列表 */}
      {items.length > 0 && (
        <div style={card}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            {t.reorder} · {items.length} {t.files}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => onDragStart(item.id)}
                onDragOver={(e) => { e.preventDefault(); onDragOverItem(item.id); }}
                onDrop={(e) => { e.preventDefault(); onDropItem(item.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'grab',
                  border: dragOver === item.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', minWidth: '24px' }}>{idx + 1}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{item.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>{fmtSize(item.file.size)}</span>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>{t.remove}</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => inputRef.current?.click()} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>{t.addMore}</button>
            <button onClick={merge} disabled={merging} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: merging ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: merging ? 0.7 : 1 }}>
              {merging ? t.merging : t.merge}
            </button>
            <button onClick={clear} style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>{t.clear}</button>
          </div>

          {status && <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: statusColor[status.type] }}>{status.msg}</p>}
          {downloadUrl && (
            <a href={downloadUrl} download="tool.tl-merged.pdf" style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#16a34a', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              {t.download}
            </a>
          )}
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.privacy}</p>
        </div>
      )}
    </div>
  );
}
