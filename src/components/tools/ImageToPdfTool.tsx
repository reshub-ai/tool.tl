import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    drop: 'Click or drag images here',
    supported: 'Supports JPG, PNG, WebP — all processed in your browser',
    pageSize: 'Page Size',
    fitImg: 'Fit to image size',
    a4: 'A4 (210×297 mm)',
    letter: 'US Letter (8.5×11 in)',
    margin: 'Margin',
    noMargin: 'No margin',
    small: 'Small (10 px)',
    normal: 'Normal (20 px)',
    orientation: 'Image Fit',
    fitPage: 'Fit to page',
    fillPage: 'Fill page (crop)',
    convert: 'Convert to PDF',
    converting: 'Converting…',
    download: 'Download PDF',
    clear: 'Clear All',
    addMore: 'Add More',
    pages: 'pages',
    privacy: 'All processing happens in your browser. Nothing is uploaded.',
    reorder: 'Drag to reorder',
    remove: '✕',
  },
  'zh-CN': {
    drop: '点击或拖拽图片到此处',
    supported: '支持 JPG、PNG、WebP，在浏览器本地处理',
    pageSize: '页面大小',
    fitImg: '适应图片尺寸',
    a4: 'A4（210×297 毫米）',
    letter: 'US Letter（8.5×11 英寸）',
    margin: '页边距',
    noMargin: '无边距',
    small: '小（10 像素）',
    normal: '正常（20 像素）',
    orientation: '图片适配',
    fitPage: '适应页面',
    fillPage: '填充页面（裁剪）',
    convert: '转换为 PDF',
    converting: '转换中…',
    download: '下载 PDF',
    clear: '清除全部',
    addMore: '继续添加',
    pages: '页',
    privacy: '所有处理在浏览器本地完成，不上传任何文件。',
    reorder: '拖动排序',
    remove: '✕',
  },
  'zh-TW': {
    drop: '點擊或拖曳圖片到此處',
    supported: '支援 JPG、PNG、WebP，在瀏覽器本地處理',
    pageSize: '頁面大小',
    fitImg: '適應圖片尺寸',
    a4: 'A4（210×297 公釐）',
    letter: 'US Letter（8.5×11 英吋）',
    margin: '頁邊距',
    noMargin: '無邊距',
    small: '小（10 像素）',
    normal: '正常（20 像素）',
    orientation: '圖片適配',
    fitPage: '適應頁面',
    fillPage: '填充頁面（裁切）',
    convert: '轉換為 PDF',
    converting: '轉換中…',
    download: '下載 PDF',
    clear: '清除全部',
    addMore: '繼續新增',
    pages: '頁',
    privacy: '所有處理在瀏覽器本地完成，不上傳任何檔案。',
    reorder: '拖動排序',
    remove: '✕',
  },
  ja: {
    drop: 'クリックまたは画像をドラッグ',
    supported: 'JPG・PNG・WebP対応、ブラウザ内で完結',
    pageSize: 'ページサイズ',
    fitImg: '画像サイズに合わせる',
    a4: 'A4（210×297 mm）',
    letter: 'US Letter（8.5×11 in）',
    margin: '余白',
    noMargin: '余白なし',
    small: '小（10 px）',
    normal: '通常（20 px）',
    orientation: '画像フィット',
    fitPage: 'ページに合わせる',
    fillPage: 'ページを埋める（トリム）',
    convert: 'PDFに変換',
    converting: '変換中…',
    download: 'PDFダウンロード',
    clear: 'すべてクリア',
    addMore: '追加',
    pages: 'ページ',
    privacy: 'すべての処理はブラウザ内で完結。ファイルはアップロードされません。',
    reorder: 'ドラッグで並び替え',
    remove: '✕',
  },
};

type PageSize = 'fit' | 'a4' | 'letter';
type MarginSize = 0 | 10 | 20;
type FitMode = 'fit' | 'fill';

interface ImgItem { id: string; file: File; url: string; name: string; }

function uid() { return Math.random().toString(36).slice(2); }

function formatBytes(b: number) {
  const u = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(Math.max(b, 1)) / Math.log(1024)), 2);
  return (b / 1024 ** i).toFixed(1) + ' ' + u[i];
}

export default function ImageToPdfTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [items, setItems] = useState<ImgItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [margin, setMargin] = useState<MarginSize>(20);
  const [fitMode, setFitMode] = useState<FitMode>('fit');
  const [converting, setConverting] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedRef = useRef(false);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const newItems: ImgItem[] = arr.map((f) => ({
      id: uid(), file: f, url: URL.createObjectURL(f), name: f.name,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setPdfBlob(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => { const item = prev.find((i) => i.id === id); if (item) URL.revokeObjectURL(item.url); return prev.filter((i) => i.id !== id); });
    setPdfBlob(null);
  };

  const clear = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]); setPdfBlob(null);
  };

  // 拖拽排序
  const dragItem = useRef<string | null>(null);
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

  const convert = useCallback(async () => {
    if (!items.length) return;
    setConverting(true);
    setPdfBlob(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();

      // A4: 595.28 × 841.89 pt, Letter: 612 × 792 pt (1 pt = 1/72 in)
      const PAGE_W: Record<PageSize, number> = { fit: 0, a4: 595.28, letter: 612 };
      const PAGE_H: Record<PageSize, number> = { fit: 0, a4: 841.89, letter: 792 };

      for (const item of items) {
        const arrayBuf = await item.file.arrayBuffer();
        let img;
        const mime = item.file.type;
        if (mime === 'image/jpeg') img = await doc.embedJpg(arrayBuf);
        else {
          // PNG / WebP → canvas → JPEG for pdf-lib compatibility
          const bmp = await createImageBitmap(item.file);
          const c = document.createElement('canvas');
          c.width = bmp.width; c.height = bmp.height;
          const ctx = c.getContext('2d')!;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(bmp, 0, 0); bmp.close();
          const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => b ? res(b) : rej(), 'image/jpeg', 0.92));
          img = await doc.embedJpg(await blob.arrayBuffer());
        }

        const iw = img.width; const ih = img.height;
        let pw: number; let ph: number;
        if (pageSize === 'fit') { pw = iw; ph = ih; }
        else { pw = PAGE_W[pageSize]; ph = PAGE_H[pageSize]; }

        const page = doc.addPage([pw, ph]);
        const inner = { w: pw - margin * 2, h: ph - margin * 2 };
        let dw: number; let dh: number; let dx: number; let dy: number;

        if (fitMode === 'fit') {
          const scale = Math.min(inner.w / iw, inner.h / ih);
          dw = iw * scale; dh = ih * scale;
          dx = margin + (inner.w - dw) / 2; dy = margin + (inner.h - dh) / 2;
        } else {
          const scale = Math.max(inner.w / iw, inner.h / ih);
          dw = iw * scale; dh = ih * scale;
          dx = margin + (inner.w - dw) / 2; dy = margin + (inner.h - dh) / 2;
        }

        page.drawImage(img, { x: dx, y: dy, width: dw, height: dh });
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setPdfBlob(blob);

      if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
    } catch (e) {
      console.error(e);
    } finally {
      setConverting(false);
    }
  }, [items, pageSize, margin, fitMode, slug]);

  const download = () => {
    if (!pdfBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pdfBlob);
    a.download = `images_${items.length}pages.pdf`; a.click();
    URL.revokeObjectURL(a.href);
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const inp: React.CSSProperties = {
    padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', marginBottom: '0.25rem', color: 'var(--color-text-secondary)' };
  const pill: React.CSSProperties = {
    padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.875rem',
  };
  const pillPrimary: React.CSSProperties = { ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600 };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

      {/* 拖拽区 */}
      <div style={card}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-bg)', transition: 'all 0.2s',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{t.drop}</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.supported}</p>
        </div>
      </div>

      {/* 图片列表 */}
      {items.length > 0 && (
        <div style={card}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.reorder} · {items.length} {t.pages}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => onDragStart(item.id)}
                onDragOver={(e) => { e.preventDefault(); onDragOverItem(item.id); }}
                onDrop={(e) => { e.preventDefault(); onDropItem(item.id); }}
                style={{
                  position: 'relative', borderRadius: '8px', overflow: 'hidden', cursor: 'grab',
                  border: dragOver === item.id ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  background: 'var(--color-bg)',
                }}
              >
                <img src={item.url} alt={item.name} style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '0.25rem 0.35rem', fontSize: '0.68rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  style={{
                    position: 'absolute', top: '3px', right: '3px', width: '20px', height: '20px',
                    border: 'none', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: '11px', cursor: 'pointer', lineHeight: 1, padding: 0,
                  }}
                >{t.remove}</button>
              </div>
            ))}
          </div>
          <button onClick={() => inputRef.current?.click()} style={{ ...pill, fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}>{t.addMore}</button>
        </div>
      )}

      {/* 选项 */}
      {items.length > 0 && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>{t.pageSize}</label>
              <select style={inp} value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
                <option value="a4">{t.a4}</option>
                <option value="letter">{t.letter}</option>
                <option value="fit">{t.fitImg}</option>
              </select>
            </div>
            <div>
              <label style={lbl}>{t.margin}</label>
              <select style={inp} value={margin} onChange={(e) => setMargin(Number(e.target.value) as MarginSize)}>
                <option value={0}>{t.noMargin}</option>
                <option value={10}>{t.small}</option>
                <option value={20}>{t.normal}</option>
              </select>
            </div>
            <div>
              <label style={lbl}>{t.orientation}</label>
              <select style={inp} value={fitMode} onChange={(e) => setFitMode(e.target.value as FitMode)}>
                <option value="fit">{t.fitPage}</option>
                <option value="fill">{t.fillPage}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!pdfBlob ? (
              <button onClick={convert} disabled={converting} style={pillPrimary}>
                {converting ? t.converting : t.convert}
              </button>
            ) : (
              <button onClick={download} style={pillPrimary}>{t.download}</button>
            )}
            <button onClick={clear} style={pill}>{t.clear}</button>
          </div>

          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.privacy}</p>
        </div>
      )}
    </div>
  );
}
