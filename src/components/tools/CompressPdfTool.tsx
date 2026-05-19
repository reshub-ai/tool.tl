import { useState, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    chooseFile: 'Upload PDF',
    dragDrop: 'Or drag & drop PDF here',
    levelLabel: 'Compression Level',
    levelScreen: 'Minimum size (screen)',
    levelEbook: 'Medium quality (recommended)',
    levelPrinter: 'High quality (print)',
    levelPrepress: 'Maximum quality (prepress)',
    startBtn: 'Start Compression',
    compressing: 'Compressing…',
    onlyPdf: 'Only PDF files are supported.',
    chooseFirst: 'Please select a PDF file first.',
    selected: 'Selected: {name}',
    converting: 'Uploading and compressing…',
    success: 'Compression complete!',
    failed: 'Compression failed. Please try again.',
    download: 'Download Compressed PDF',
    statLabel: 'Result',
    seo1Title: 'Compress PDF online, ideal for email and sharing',
    seo1P: 'This PDF compression tool is perfect for reducing file size before sending email attachments, uploading to forms, or publishing documents. Medium quality is suitable for most daily documents, while print and prepress modes preserve more graphics and typographic details.',
    seo1Li1: 'Reduce file size for email attachments and document uploads.',
    seo1Li2: 'Switch between minimum size, balanced quality, print, and prepress output.',
    seo1Li3: 'Get a smaller PDF instantly without installing desktop software.',
    seo2Title: 'How to choose the right compression level',
    seo2P1: 'If file size is your top priority — for example, sending by email or chat — choose <strong>Minimum size</strong>. For everyday sharing, <strong>Medium quality</strong> is recommended. For office printing, choose <strong>High quality</strong>. If you need to preserve the most colors and typographic details, select <strong>Prepress</strong>.',
    seo2P2: 'If the compressed file is still large, try Medium first, then decide whether to continue compressing to the smallest size. This usually gives the best balance between readability and file size.',
    relatedPdfToJpg: 'PDF to JPG',
    relatedJpgToPdf: 'JPG to PDF',
    relatedFileSize: 'File Size Converter',
  },
  'zh-CN': {
    chooseFile: '上传 PDF',
    dragDrop: '或将 PDF 拖拽到此处',
    levelLabel: '压缩等级',
    levelScreen: '最小体积（屏幕）',
    levelEbook: '中等质量（推荐）',
    levelPrinter: '高质量（打印）',
    levelPrepress: '最高质量（印前）',
    startBtn: '开始压缩',
    compressing: '压缩中…',
    onlyPdf: '仅支持 PDF 文件。',
    chooseFirst: '请先选择一个 PDF 文件。',
    selected: '已选择：{name}',
    converting: '上传并压缩中…',
    success: '压缩完成！',
    failed: '压缩失败，请重试。',
    download: '下载压缩后的 PDF',
    statLabel: '结果',
    seo1Title: '在线压缩 PDF，适合邮件、表单和日常分享',
    seo1P: '这个 PDF 压缩工具适合在发送邮件附件、上传在线表单或发布文档前先减小文件体积。中等质量通常适合大多数日常文档，而打印和印前模式会尽量保留更多图形与排版细节。',
    seo1Li1: '适合缩小邮件附件和各类文档上传场景的文件大小。',
    seo1Li2: '可在更小体积、均衡质量、打印和印前输出之间切换。',
    seo1Li3: '无需安装桌面软件，就能快速得到更小的 PDF 文件。',
    seo2Title: '如何选择合适的压缩等级',
    seo2P1: '如果你最看重文件体积，比如发送邮件或聊天传文件，可以优先选低质量。日常分享通常建议选<strong>中等质量</strong>，办公室打印可选<strong>高质量</strong>，如果你需要保留更多颜色和版式细节，可以选择<strong>印前</strong>。',
    seo2P2: '如果压缩后仍然偏大，建议先用均衡模式试一次，再决定是否继续切到最小体积，这样通常能在可读性和文件大小之间取得更好的平衡。',
    relatedPdfToJpg: 'PDF 转 JPG',
    relatedJpgToPdf: 'JPG 转 PDF',
    relatedFileSize: '文件大小换算',
  },
  'zh-TW': {
    chooseFile: '上傳 PDF',
    dragDrop: '或將 PDF 拖曳到此處',
    levelLabel: '壓縮等級',
    levelScreen: '最小體積（螢幕）',
    levelEbook: '中等品質（推薦）',
    levelPrinter: '高品質（列印）',
    levelPrepress: '最高品質（印前）',
    startBtn: '開始壓縮',
    compressing: '壓縮中…',
    onlyPdf: '僅支援 PDF 檔案。',
    chooseFirst: '請先選擇一個 PDF 檔案。',
    selected: '已選擇：{name}',
    converting: '上傳並壓縮中…',
    success: '壓縮完成！',
    failed: '壓縮失敗，請重試。',
    download: '下載壓縮後的 PDF',
    statLabel: '結果',
    seo1Title: '線上壓縮 PDF，適合郵件、表單和日常分享',
    seo1P: '這個 PDF 壓縮工具適合在發送郵件附件、上傳線上表單或發布文件前先縮小檔案體積。中等品質通常適合大多數日常文件，而列印和印前模式會盡量保留更多圖形與排版細節。',
    seo1Li1: '適合縮小郵件附件和各類文件上傳場景的檔案大小。',
    seo1Li2: '可在更小體積、均衡品質、列印和印前輸出之間切換。',
    seo1Li3: '無需安裝桌面軟體，就能快速得到更小的 PDF 檔案。',
    seo2Title: '如何選擇合適的壓縮等級',
    seo2P1: '如果你最看重檔案體積，比如發送郵件或聊天傳檔，可以優先選低品質。日常分享通常建議選<strong>中等品質</strong>，辦公室列印可選<strong>高品質</strong>，如果你需要保留更多顏色和版式細節，可以選擇<strong>印前</strong>。',
    seo2P2: '如果壓縮後仍然偏大，建議先用均衡模式試一次，再決定是否繼續切到最小體積。',
    relatedPdfToJpg: 'PDF 轉 JPG',
    relatedJpgToPdf: 'JPG 轉 PDF',
    relatedFileSize: '檔案大小換算',
  },
  ja: {
    chooseFile: 'PDF をアップロード',
    dragDrop: 'または PDF をここにドラッグ',
    levelLabel: '圧縮レベル',
    levelScreen: '最小サイズ（スクリーン）',
    levelEbook: '中品質（推奨）',
    levelPrinter: '高品質（印刷）',
    levelPrepress: '最高品質（プリプレス）',
    startBtn: '圧縮開始',
    compressing: '圧縮中…',
    onlyPdf: 'PDF ファイルのみ対応しています。',
    chooseFirst: 'まず PDF ファイルを選択してください。',
    selected: '選択済み：{name}',
    converting: 'アップロードして圧縮中…',
    success: '圧縮完了！',
    failed: '圧縮に失敗しました。もう一度お試しください。',
    download: '圧縮済み PDF をダウンロード',
    statLabel: '結果',
    seo1Title: 'PDF をオンラインで圧縮 — メール・フォーム・共有に最適',
    seo1P: 'このPDF圧縮ツールは、メール添付・フォームアップロード・文書公開の前にファイルサイズを小さくするのに最適です。中品質は日常文書に最適、印刷・プリプレスモードはグラフィックや組版の詳細を最大限保持します。',
    seo1Li1: 'メール添付やドキュメントアップロードのファイルサイズを縮小。',
    seo1Li2: '最小サイズ・バランス・印刷・プリプレスを切り替え可能。',
    seo1Li3: 'デスクトップソフト不要でPDFをすぐに圧縮。',
    seo2Title: '適切な圧縮レベルの選び方',
    seo2P1: 'ファイルサイズを最優先するならメールやチャット向けに<strong>最小サイズ</strong>を選択。日常共有には<strong>中品質</strong>が推奨。オフィス印刷には<strong>高品質</strong>、色や組版の詳細を保持したい場合は<strong>プリプレス</strong>を選んでください。',
    seo2P2: '圧縮後もまだ大きい場合は、まずバランスモードを試してから最小サイズへの切り替えを検討してください。',
    relatedPdfToJpg: 'PDF → JPG',
    relatedJpgToPdf: 'JPG → PDF',
    relatedFileSize: 'ファイルサイズ換算',
  },
};

const RELATED: Record<string, { pdfToJpg: string; jpgToPdf: string; fileSize: string }> = {
  en:      { pdfToJpg: '/pdf-to-jpg',        jpgToPdf: '/jpg-to-pdf',        fileSize: '/file-size-converter' },
  'zh-CN': { pdfToJpg: '/zh-CN/pdf-to-jpg',  jpgToPdf: '/zh-CN/jpg-to-pdf',  fileSize: '/zh-CN/file-size-converter' },
  'zh-TW': { pdfToJpg: '/zh-TW/pdf-to-jpg',  jpgToPdf: '/zh-TW/jpg-to-pdf',  fileSize: '/zh-TW/file-size-converter' },
  ja:      { pdfToJpg: '/ja/pdf-to-jpg',     jpgToPdf: '/ja/jpg-to-pdf',     fileSize: '/ja/file-size-converter' },
};

function fmtSize(mb: string | null) {
  if (!mb) return '';
  const n = parseFloat(mb);
  return isNaN(n) ? '' : n < 1 ? `${(n * 1024).toFixed(0)} KB` : `${n.toFixed(2)} MB`;
}

export default function CompressPdfTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const rel = RELATED[locale] || RELATED.en;

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState('ebook');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; msg: string } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [stats, setStats] = useState<{ orig: string; compressed: string; ratio: string; duration: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setStatus({ type: 'error', msg: t.onlyPdf }); return;
    }
    setFile(f);
    setDownloadUrl(''); setDownloadName(''); setStats(null);
    setStatus({ type: 'info', msg: t.selected.replace('{name}', f.name) });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const compress = async () => {
    if (compressing) return;
    if (!file) { setStatus({ type: 'error', msg: t.chooseFirst }); return; }

    setCompressing(true);
    setDownloadUrl(''); setDownloadName(''); setStats(null);
    setStatus({ type: 'info', msg: t.converting });

    const fd = new FormData();
    fd.append('file', file);
    const originalName = file.name;

    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}api?level=${level}`, {
        method: 'POST', body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setStatus({ type: 'error', msg: err.error || t.failed });
        return;
      }

      const ratio    = res.headers.get('X-Compression-Ratio');
      const duration = res.headers.get('X-Compression-Duration');
      const origMb   = res.headers.get('X-Original-Size');
      const compMb   = res.headers.get('X-Compressed-Size');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const baseName = originalName.replace(/\.pdf$/i, '');
      const dlName = `tool.tl-${baseName}-compressed.pdf`;

      setDownloadUrl(url);
      setDownloadName(dlName);
      (window as any).__trackToolUsed?.(slug);

      if (ratio && duration) {
        setStats({ orig: fmtSize(origMb), compressed: fmtSize(compMb), ratio: `${ratio}%`, duration: `${duration}s` });
      }
      setStatus({ type: 'success', msg: t.success });
    } catch {
      setStatus({ type: 'error', msg: t.failed });
    } finally {
      setCompressing(false);
    }
  };

  const statusColor = { info: 'var(--color-primary)', success: '#16a34a', error: '#dc2626' };
  const card: React.CSSProperties = {
    marginTop: '18px', padding: '18px',
    border: '1px solid var(--color-border)', borderRadius: '12px',
    background: 'var(--color-card-bg)',
  };

  return (
    <div>
      {/* Upload button */}
      <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={compressing}
        style={{
          display: 'inline-block', padding: '10px 20px', borderRadius: '6px',
          background: '#2f80ed', color: '#fff', border: 'none',
          cursor: compressing ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500,
          opacity: compressing ? 0.6 : 1,
        }}
      >
        {t.chooseFile}
      </button>

      {file && (
        <span style={{ marginLeft: '10px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {file.name}
        </span>
      )}

      {/* Drop zone / compact strip after selection */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            marginTop: '12px', padding: '20px',
            border: `2px dashed ${dragging ? '#1c60c6' : '#2f80ed'}`,
            borderRadius: '8px', textAlign: 'center',
            color: dragging ? '#2f80ed' : 'var(--color-text-secondary)',
            fontSize: '14px', cursor: 'pointer',
            background: dragging ? 'rgba(47,128,237,0.06)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          {t.dragDrop}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            marginTop: '12px', padding: '10px 14px',
            border: `2px dashed ${dragging ? '#1c60c6' : 'var(--color-border)'}`,
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            gap: '10px', background: dragging ? 'rgba(47,128,237,0.04)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </span>
          <button
            onClick={() => inputRef.current?.click()}
            style={{ fontSize: '13px', color: '#2f80ed', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {t.chooseFile}
          </button>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--color-border)', margin: '20px 0' }} />

      {/* Level + Button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          disabled={compressing}
          style={{
            padding: '8px 10px', borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-card-bg)', color: 'var(--color-text)',
            fontSize: '14px', cursor: 'pointer',
          }}
        >
          <option value="screen">{t.levelScreen}</option>
          <option value="ebook">{t.levelEbook}</option>
          <option value="printer">{t.levelPrinter}</option>
          <option value="prepress">{t.levelPrepress}</option>
        </select>

        <button
          onClick={compress}
          disabled={compressing}
          style={{
            padding: '10px 20px', borderRadius: '6px', fontSize: '15px', fontWeight: 500,
            border: '1px solid #2f80ed', background: 'transparent', color: '#2f80ed',
            cursor: compressing ? 'not-allowed' : 'pointer',
            opacity: compressing ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!compressing) { (e.target as HTMLButtonElement).style.background = '#2f80ed'; (e.target as HTMLButtonElement).style.color = '#fff'; } }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = '#2f80ed'; }}
        >
          {compressing ? t.compressing : t.startBtn}
        </button>
      </div>

      {/* Status */}
      {status && (
        <p style={{ marginTop: '10px', fontWeight: 500, fontSize: '14px', color: statusColor[status.type] }}>
          {status.msg}
        </p>
      )}

      {/* Stats */}
      {stats && (
        <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {stats.orig} → {stats.compressed} &nbsp;|&nbsp; -{stats.ratio} &nbsp;|&nbsp; {stats.duration}
        </p>
      )}

      {/* Download */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadName}
          style={{
            display: 'inline-block', marginTop: '12px',
            padding: '10px 20px', borderRadius: '6px',
            background: '#16a34a', color: '#fff',
            textDecoration: 'none', fontSize: '14px', fontWeight: 500,
          }}
        >
          {t.download}
        </a>
      )}

      {/* SEO Card 1 */}
      <div style={card}>
        <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--color-text)' }}>{t.seo1Title}</h2>
        <p style={{ margin: '0 0 10px', lineHeight: 1.7, fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.seo1P}</p>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          <li>{t.seo1Li1}</li>
          <li>{t.seo1Li2}</li>
          <li>{t.seo1Li3}</li>
        </ul>
      </div>

      {/* SEO Card 2 */}
      <div style={card}>
        <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--color-text)' }}>{t.seo2Title}</h2>
        <p style={{ margin: '0 0 10px', lineHeight: 1.7, fontSize: '14px', color: 'var(--color-text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: t.seo2P1 }} />
        <p style={{ margin: '0 0 14px', lineHeight: 1.7, fontSize: '14px', color: 'var(--color-text-secondary)' }}>{t.seo2P2}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { href: rel.pdfToJpg, label: t.relatedPdfToJpg },
            { href: rel.jpgToPdf, label: t.relatedJpgToPdf },
            { href: rel.fileSize, label: t.relatedFileSize },
          ].map(({ href, label }) => (
            <a key={href} href={href} style={{
              textDecoration: 'none', padding: '8px 12px',
              borderRadius: '999px', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', background: 'var(--color-card-bg)',
              fontSize: '13px',
            }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
