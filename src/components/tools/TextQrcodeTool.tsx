import { useState, useCallback, useRef } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';
const MAX_LENGTH = 3000;

type Lang = 'en' | 'zh-CN' | 'zh-TW' | 'ja';

const i18n: Record<Lang, Record<string, string>> = {
  en: {
    label: 'Enter the text to convert',
    placeholder: 'Text, links, Wi-Fi passwords… any text works',
    generate: 'Generate QR Code',
    generating: 'Generating…',
    emptyError: 'Please enter some text before generating the QR code',
    passwordLabel: 'Access password (optional)',
    passwordPlaceholder: 'If set, viewers must enter it to see the content',
    randomPw: 'Random',
    scanHint: 'Scan with your phone → view the content and copy it in one tap',
    ttl: 'Link valid for',
    ttlValue: '2 hours',
    copyContent: 'Copy content',
    copyLink: 'Copy share link',
    copiedContent: '✓ Content copied',
    copiedLink: '✓ Link copied',
    copyOk: 'Copied to clipboard',
    copyFail: 'Auto-copy failed, please select and copy manually',
    genFail: 'Generation failed',
  },
  'zh-CN': {
    label: '输入要转换的内容',
    placeholder: '文字、链接、WiFi 密码… 任意文本皆可',
    generate: '生成二维码',
    generating: '生成中…',
    emptyError: '请先输入内容再生成二维码',
    passwordLabel: '访问密码（可选）',
    passwordPlaceholder: '设置后，扫码需输入此密码才能查看',
    randomPw: '随机生成',
    scanHint: '用手机扫一扫 → 查看内容并一键复制',
    ttl: '链接有效期',
    ttlValue: '2 小时',
    copyContent: '一键复制内容',
    copyLink: '复制分享链接',
    copiedContent: '✓ 已复制内容',
    copiedLink: '✓ 已复制链接',
    copyOk: '已成功复制到剪贴板',
    copyFail: '自动复制失败，请手动选中文本复制',
    genFail: '生成失败',
  },
  'zh-TW': {
    label: '輸入要轉換的內容',
    placeholder: '文字、連結、WiFi 密碼… 任意文字皆可',
    generate: '產生二維碼',
    generating: '產生中…',
    emptyError: '請先輸入內容再產生二維碼',
    passwordLabel: '存取密碼（可選）',
    passwordPlaceholder: '設定後，掃碼需輸入此密碼才能查看',
    randomPw: '隨機產生',
    scanHint: '用手機掃一掃 → 查看內容並一鍵複製',
    ttl: '連結有效期',
    ttlValue: '2 小時',
    copyContent: '一鍵複製內容',
    copyLink: '複製分享連結',
    copiedContent: '✓ 已複製內容',
    copiedLink: '✓ 已複製連結',
    copyOk: '已成功複製到剪貼簿',
    copyFail: '自動複製失敗，請手動選取文字複製',
    genFail: '產生失敗',
  },
  ja: {
    label: '変換する内容を入力',
    placeholder: 'テキスト、リンク、WiFiパスワード… どんなテキストでもOK',
    generate: 'QRコードを生成',
    generating: '生成中…',
    emptyError: 'QRコードを生成する前に内容を入力してください',
    passwordLabel: 'アクセスパスワード（任意）',
    passwordPlaceholder: '設定すると、閲覧時にこのパスワードが必要です',
    randomPw: 'ランダム生成',
    scanHint: 'スマホでスキャン → 内容を確認してワンタップでコピー',
    ttl: 'リンクの有効期限',
    ttlValue: '2時間',
    copyContent: '内容をコピー',
    copyLink: '共有リンクをコピー',
    copiedContent: '✓ 内容をコピーしました',
    copiedLink: '✓ リンクをコピーしました',
    copyOk: 'クリップボードにコピーしました',
    copyFail: '自動コピーに失敗しました。手動で選択してコピーしてください',
    genFail: '生成に失敗しました',
  },
};

export default function TextQrcodeTool({ slug, locale }: Props) {
  const t = i18n[(locale as Lang)] || i18n.en;

  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'ok' | 'err'>('ok');
  const [copied, setCopied] = useState<'content' | 'link' | null>(null);
  const qrObjectUrl = useRef<string>('');

  const generate = useCallback(async () => {
    setError('');
    const text = content.trim();
    if (!text) {
      setError(t.emptyError);
      return;
    }
    setLoading(true);
    try {
      // 1) 存储文本，换取短链接
      const createRes = await fetch(`${API_BASE}/qrcode/share/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, lang: locale, password: password.trim() }),
      });
      const data = await createRes.json();
      if (!createRes.ok || data.status !== 'success') {
        throw new Error(data.message || t.genFail);
      }
      setShareUrl(data.url);

      // 2) 用短链接生成二维码图片（复用现有 /qrcode/api）
      const formData = new FormData();
      formData.append('text', data.url);
      formData.append('size', '300');
      const qrRes = await fetch(`${API_BASE}/qrcode/api`, { method: 'POST', body: formData });
      if (!qrRes.ok) throw new Error(t.genFail);
      const blob = await qrRes.blob();
      if (qrObjectUrl.current) URL.revokeObjectURL(qrObjectUrl.current);
      qrObjectUrl.current = URL.createObjectURL(blob);
      setQrUrl(qrObjectUrl.current);

      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setError(e.message || t.genFail);
    } finally {
      setLoading(false);
    }
  }, [content, password, locale, slug, t]);

  const randomizePassword = () => {
    // 去掉易混淆字符（0/O、1/l/I）
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const arr = new Uint32Array(10);
    crypto.getRandomValues(arr);
    let pw = '';
    for (let i = 0; i < arr.length; i++) pw += chars[arr[i] % chars.length];
    setPassword(pw);
  };

  const handleCopy = useCallback(
    async (type: 'content' | 'link') => {
      const text = type === 'link' ? shareUrl : content;
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          ok = true;
        } else {
          throw new Error('insecure');
        }
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          ok = document.execCommand('copy');
        } catch (_2) {
          ok = false;
        }
        document.body.removeChild(ta);
      }
      if (ok) {
        setCopied(type);
        setFeedback(t.copyOk);
        setFeedbackType('ok');
        setTimeout(() => {
          setCopied(null);
          setFeedback('');
        }, 2000);
      } else {
        setFeedback(t.copyFail);
        setFeedbackType('err');
      }
    },
    [shareUrl, content, t]
  );

  const cardStyle: React.CSSProperties = {
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  };

  const secondaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text)',
    fontWeight: 500,
    fontSize: '0.9rem',
    cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: '480px' }}>
      {/* 输入卡片 */}
      <div style={cardStyle}>
        <label
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.6rem',
            color: 'var(--color-text)',
          }}
        >
          {t.label}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          placeholder={t.placeholder}
          rows={5}
          style={{
            width: '100%',
            resize: 'vertical',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            padding: '0.75rem',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            minHeight: '120px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
            {content.length} / {MAX_LENGTH}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '0.3rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            🔒 {t.passwordLabel}
          </label>
          <button
            type="button"
            onClick={randomizePassword}
            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
          >
            🎲 {t.randomPw}
          </button>
        </div>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.passwordPlaceholder}
          autoComplete="off"
          style={{
            width: '100%',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            padding: '0.6rem 0.75rem',
            fontSize: '0.85rem',
            boxSizing: 'border-box',
          }}
        />
        <button onClick={generate} disabled={loading} style={{ ...primaryBtn, marginTop: '0.6rem' }}>
          {loading ? t.generating : t.generate}
        </button>
      </div>

      {error && (
        <p
          style={{
            marginTop: '0.75rem',
            padding: '0.7rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}

      {/* 结果卡片 */}
      {qrUrl && (
        <div style={{ ...cardStyle, marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
              }}
            >
              <img src={qrUrl} alt="QR Code" style={{ display: 'block', width: '220px', height: '220px' }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 500 }}>{t.scanHint}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {t.ttl} <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{t.ttlValue}</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button onClick={() => handleCopy('content')} style={primaryBtn}>
              {copied === 'content' ? t.copiedContent : t.copyContent}
            </button>
            <button onClick={() => handleCopy('link')} style={secondaryBtn}>
              {copied === 'link' ? t.copiedLink : t.copyLink}
            </button>
          </div>

          {feedback && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                marginTop: '0.75rem',
                color: feedbackType === 'ok' ? '#10b981' : '#ef4444',
              }}
            >
              {feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
