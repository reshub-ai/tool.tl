import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    upload: 'Upload PDF',
    drag: 'Or drag & drop PDF here',
    onlyPdf: 'Only PDF files are supported.',
    totalPages: 'Total pages:',
    pagesLabel: 'Pages to extract',
    pagesPlaceholder: 'e.g. 1-3, 5, 7-9  (leave empty for all pages)',
    allPages: 'All pages',
    rangeHint: 'Ranges like 1-5, individual like 3, combinations like 1-3,5,8-10',
    split: 'Split & Download ZIP',
    splitting: 'Splitting…',
    success: 'Split complete — ZIP downloaded!',
    failed: 'Split failed. Please try again.',
    uploading: 'Uploading and splitting…',
    fetchingInfo: 'Reading PDF…',
    privacy: 'Files are sent to our server for processing and deleted immediately after.',
    changeFile: 'Change',
  },
  'zh-CN': {
    upload: '上传 PDF',
    drag: '或将 PDF 拖拽到此处',
    onlyPdf: '仅支持 PDF 文件。',
    totalPages: '总页数：',
    pagesLabel: '要提取的页码',
    pagesPlaceholder: '如 1-3, 5, 7-9（留空则提取全部页面）',
    allPages: '全部页面',
    rangeHint: '支持范围（1-5）、单页（3）、组合（1-3,5,8-10）',
    split: '拆分并下载 ZIP',
    splitting: '拆分中…',
    success: '拆分完成，ZIP 已下载！',
    failed: '拆分失败，请重试。',
    uploading: '上传并拆分中…',
    fetchingInfo: '正在读取 PDF…',
    privacy: '文件将发送到服务器处理，处理完毕后立即删除。',
    changeFile: '重新选择',
  },
  'zh-TW': {
    upload: '上傳 PDF',
    drag: '或將 PDF 拖曳到此處',
    onlyPdf: '僅支援 PDF 檔案。',
    totalPages: '總頁數：',
    pagesLabel: '要提取的頁碼',
    pagesPlaceholder: '如 1-3, 5, 7-9（留空則提取全部頁面）',
    allPages: '全部頁面',
    rangeHint: '支援範圍（1-5）、單頁（3）、組合（1-3,5,8-10）',
    split: '拆分並下載 ZIP',
    splitting: '拆分中…',
    success: '拆分完成，ZIP 已下載！',
    failed: '拆分失敗，請重試。',
    uploading: '上傳並拆分中…',
    fetchingInfo: '正在讀取 PDF…',
    privacy: '檔案將傳送至伺服器處理，處理完畢後立即刪除。',
    changeFile: '重新選擇',
  },
  ja: {
    upload: 'PDFをアップロード',
    drag: 'またはPDFをここにドラッグ',
    onlyPdf: 'PDFファイルのみ対応しています。',
    totalPages: '総ページ数：',
    pagesLabel: '抽出するページ',
    pagesPlaceholder: '例: 1-3, 5, 7-9（空欄で全ページ）',
    allPages: '全ページ',
    rangeHint: '範囲（1-5）・単一（3）・組み合わせ（1-3,5,8-10）に対応',
    split: '分割してZIPダウンロード',
    splitting: '分割中…',
    success: '分割完了 — ZIPをダウンロードしました！',
    failed: '分割に失敗しました。もう一度お試しください。',
    uploading: 'アップロードして分割中…',
    fetchingInfo: 'PDFを読み込み中…',
    privacy: 'ファイルはサーバーに送信して処理後、即座に削除されます。',
    changeFile: '選び直す',
  },
};

export default function SplitPdfTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pages, setPages] = useState('');
  const [dragging, setDragging] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; msg: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedRef = useRef(false);

  const fetchInfo = async (f: File) => {
    setFetchingInfo(true); setTotalPages(null);
    const fd = new FormData(); fd.append('file', f);
    try {
      const res = await fetch(`${API_BASE}/split-pdf/info`, { method: 'POST', body: fd });
      if (res.ok) { const d = await res.json(); setTotalPages(d.pages); }
    } catch { /* ignore */ }
    setFetchingInfo(false);
  };

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) { setStatus({ type: 'error', msg: t.onlyPdf }); return; }
    setFile(f); setPages(''); setStatus(null);
    fetchInfo(f);
  };

  const split = useCallback(async () => {
    if (!file || splitting) return;
    setSplitting(true);
    setStatus({ type: 'info', msg: t.uploading });

    const fd = new FormData();
    fd.append('file', file);
    if (pages.trim()) fd.append('pages', pages.trim());

    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setStatus({ type: 'error', msg: err.error || t.failed });
        return;
      }
      const blob = await res.blob();
      const expr = pages.trim().replace(/,/g, '_') || 'all';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tool.tl-split_${expr}.zip`; a.click();
      URL.revokeObjectURL(a.href);
      setStatus({ type: 'success', msg: t.success });
      if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
    } catch {
      setStatus({ type: 'error', msg: t.failed });
    } finally {
      setSplitting(false);
    }
  }, [file, pages, splitting, apiEndpoint, t, slug]);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const inp: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.9rem',
    width: '100%', boxSizing: 'border-box',
  };
  const statusColor = { info: 'var(--color-primary)', success: '#16a34a', error: '#dc2626' };

  return (
    <div>
      <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {/* 上传区 */}
      <div style={card}>
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false);
              const f = e.dataTransfer.files[0]; if (f) handleFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-bg)', transition: 'all 0.2s',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>📄 {t.upload}</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.drag}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-bg)' }}>
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{file.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {fetchingInfo ? t.fetchingInfo : totalPages !== null ? `${t.totalPages} ${totalPages}` : ''}
              </p>
            </div>
            <button onClick={() => inputRef.current?.click()} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.82rem', flexShrink: 0 }}>
              {t.changeFile}
            </button>
          </div>
        )}
      </div>

      {/* 页码输入 */}
      {file && (
        <div style={card}>
          <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--color-text-secondary)' }}>{t.pagesLabel}</label>
          <input
            style={inp}
            type="text"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder={t.pagesPlaceholder}
          />
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.rangeHint}</p>

          {/* 页码快速选择（当知道总页数时） */}
          {totalPages && totalPages <= 20 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const existing = pages.split(',').map((s) => s.trim()).filter(Boolean);
                    const pStr = String(p);
                    if (existing.includes(pStr)) {
                      setPages(existing.filter((s) => s !== pStr).join(', '));
                    } else {
                      setPages([...existing, pStr].join(', '));
                    }
                  }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '6px', fontSize: '0.82rem',
                    border: '1px solid var(--color-border)', cursor: 'pointer',
                    background: pages.split(',').map((s) => s.trim()).includes(String(p))
                      ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: pages.split(',').map((s) => s.trim()).includes(String(p))
                      ? '#fff' : 'var(--color-text)',
                  }}
                >{p}</button>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={split}
              disabled={splitting}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: splitting ? 'not-allowed' : 'pointer', opacity: splitting ? 0.7 : 1 }}
            >
              {splitting ? t.splitting : t.split}
            </button>
          </div>

          {status && <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: statusColor[status.type] }}>{status.msg}</p>}
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.privacy}</p>
        </div>
      )}
    </div>
  );
}
