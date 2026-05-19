import { useState, useRef } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    placeholder: 'Paste Base64 image data here (with or without data: prefix)…',
    decode: 'Decode Image',
    clear: 'Clear',
    download: 'Download Image',
    downloading: 'Downloading…',
    downloaded: 'Saved!',
    errEmpty: 'Please paste Base64 image data first.',
    errInvalid: 'Invalid Base64 data. Could not render image.',
    switchText: '→ Decode Base64 text',
  },
  'zh-CN': {
    placeholder: '粘贴 Base64 图片数据（支持带或不带 data: 前缀）…',
    decode: '解码图片',
    clear: '清空',
    download: '下载图片',
    downloading: '下载中…',
    downloaded: '已保存！',
    errEmpty: '请先粘贴 Base64 图片数据。',
    errInvalid: '无效的 Base64 数据，无法渲染图片。',
    switchText: '→ 解码 Base64 文本',
  },
  'zh-TW': {
    placeholder: '貼上 Base64 圖片資料（支援帶或不帶 data: 前綴）…',
    decode: '解碼圖片',
    clear: '清除',
    download: '下載圖片',
    downloading: '下載中…',
    downloaded: '已儲存！',
    errEmpty: '請先貼上 Base64 圖片資料。',
    errInvalid: '無效的 Base64 資料，無法渲染圖片。',
    switchText: '→ 解碼 Base64 文字',
  },
  ja: {
    placeholder: 'Base64画像データを貼り付けてください（data: プレフィックス有無どちらも可）…',
    decode: '画像をデコード',
    clear: 'クリア',
    download: '画像をダウンロード',
    downloading: 'ダウンロード中…',
    downloaded: '保存しました！',
    errEmpty: 'まずBase64画像データを貼り付けてください。',
    errInvalid: '無効なBase64データです。画像を表示できません。',
    switchText: '→ Base64テキストをデコード',
  },
};


function detectExt(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'jpg';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  if (dataUrl.startsWith('data:image/gif')) return 'gif';
  if (dataUrl.startsWith('data:image/svg+xml')) return 'svg';
  return 'png';
}

export default function Base64DecoderImgTool({ locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [input, setInput] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');
  const [tipState, setTipState] = useState<'hidden' | 'downloading' | 'done'>('hidden');
  const imgRef = useRef<HTMLImageElement>(null);

  const decode = () => {
    setError('');
    const val = input.trim();
    if (!val) { setError(t.errEmpty); return; }

    const url = val.startsWith('data:') ? val : `data:image/png;base64,${val}`;
    setDataUrl(url);
    setTipState('hidden');
  };

  const clear = () => {
    setInput('');
    setDataUrl('');
    setError('');
    setTipState('hidden');
  };

  const handleImgError = () => {
    setDataUrl('');
    setError(t.errInvalid);
  };

  const download = () => {
    if (!dataUrl) return;
    setTipState('downloading');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `tool.tl-decoded-image.${detectExt(dataUrl)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      setTipState('done');
      setTimeout(() => setTipState('hidden'), 1500);
    }, 300);
  };

  const pillBase: React.CSSProperties = {
    padding: '0.55rem 1.25rem',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = {
    ...pillBase,
    background: 'var(--color-primary)',
    color: '#fff',
    border: '1px solid var(--color-primary)',
  };

  return (
    <div style={{
      background: 'var(--color-card-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '16px',
    }}>
      {/* Textarea */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t.placeholder}
        style={{
          width: '100%',
          minHeight: '140px',
          padding: '10px',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        <button style={pillPrimary} onClick={decode}>{t.decode}</button>
        <button style={pillBase} onClick={clear}>{t.clear}</button>
      </div>


      {/* Error */}
      {error && (
        <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>
      )}

      {/* Image preview */}
      {dataUrl && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <img
            ref={imgRef}
            src={dataUrl}
            alt="decoded"
            onError={handleImgError}
            style={{
              maxWidth: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
          />
        </div>
      )}

      {/* Download */}
      {dataUrl && (
        <div style={{ marginTop: '12px', textAlign: 'center', position: 'relative', display: 'inline-block', width: '100%' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button style={pillPrimary} onClick={download}>{t.download}</button>
            {tipState !== 'hidden' && (
              <span style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: tipState === 'done' ? '#16a34a' : 'var(--color-primary)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}>
                {tipState === 'done' ? t.downloaded : t.downloading}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
