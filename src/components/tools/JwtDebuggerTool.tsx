import { useState, useEffect, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

type Tab = 'decode' | 'encode' | 'verify';
type VerifyResult = { ok: boolean; msg: string; detail: string } | null;

const i18n: Record<string, Record<string, string>> = {
  en: {
    warningTitle: '⚠️ Security Notice',
    warningMsg: 'Do not paste real tokens from production systems. All processing is done locally in your browser.',
    tabDecode: 'Decode', tabEncode: 'Encode', tabVerify: 'Verify',
    panelEncoded: 'Encoded JWT', panelHeader: 'Header', panelPayload: 'Payload',
    panelSignature: 'Signature', panelResult: 'Result',
    labelHeader: 'Header (JSON)', labelPayload: 'Payload (JSON)',
    labelAlgorithm: 'Algorithm & Secret', labelSecret: 'Secret / Public Key',
    inputJwtPlaceholder: 'Paste JWT token here…',
    inputSecretPlaceholder: 'your-secret-key',
    btnClear: 'Clear', btnCopy: 'Copy', btnCopied: 'Copied!',
    btnVerify: 'Verify', btnEncode: 'Encode', btnSample: 'Load Sample',
    infoExpired: '⚠️ Expired —', infoExpiresAt: 'Expires', infoIssuedAt: 'Issued',
    infoNotBefore: '⚠️ Not valid yet —', infoNotBeforeTime: 'Valid from',
    msgDecodeOk: '✓ Decoded successfully', msgInvalidJwt: 'Invalid JWT format',
    msgEncodeOk: '✓ Token generated', msgCopied: 'Copied to clipboard',
    msgSecretRequired: 'Secret is required', msgEmptyJwt: 'Please paste a JWT first',
    msgEmptyHeader: 'Header JSON is required', msgEmptyPayload: 'Payload JSON is required',
    msgInvalidJson: 'Invalid JSON', msgVerifyOk: '✓ Signature is valid',
    msgVerifyFail: '✗ Signature is invalid',
    errorRsa: 'RSA verification requires a public key (PEM format)',
    errorUnsupported: 'Unsupported algorithm: {alg}',
    errorSigMismatch: 'Signature mismatch — check your secret key',
    verifyUsing: 'Algorithm: {alg}',
    helpTitle: 'About JWT',
    helpContent: 'JSON Web Token (JWT) is a compact, URL-safe method for representing claims between parties. A JWT consists of three Base64URL-encoded parts separated by dots: Header, Payload, and Signature.',
  },
  'zh-CN': {
    warningTitle: '⚠️ 安全提示',
    warningMsg: '请勿粘贴生产系统中的真实Token，所有处理均在浏览器本地完成。',
    tabDecode: '解码', tabEncode: '编码', tabVerify: '验证',
    panelEncoded: '编码后的JWT', panelHeader: 'Header（头部）', panelPayload: 'Payload（载荷）',
    panelSignature: '签名验证', panelResult: '结果',
    labelHeader: 'Header（JSON）', labelPayload: 'Payload（JSON）',
    labelAlgorithm: '算法与密钥', labelSecret: '密钥 / 公钥',
    inputJwtPlaceholder: '在此粘贴JWT Token…',
    inputSecretPlaceholder: '你的密钥',
    btnClear: '清空', btnCopy: '复制', btnCopied: '已复制！',
    btnVerify: '验证签名', btnEncode: '生成Token', btnSample: '加载示例',
    infoExpired: '⚠️ 已过期 —', infoExpiresAt: '过期时间', infoIssuedAt: '签发时间',
    infoNotBefore: '⚠️ 尚未生效 —', infoNotBeforeTime: '生效时间',
    msgDecodeOk: '✓ 解码成功', msgInvalidJwt: 'JWT格式无效',
    msgEncodeOk: '✓ Token已生成', msgCopied: '已复制到剪贴板',
    msgSecretRequired: '请输入密钥', msgEmptyJwt: '请先粘贴JWT',
    msgEmptyHeader: '请输入Header JSON', msgEmptyPayload: '请输入Payload JSON',
    msgInvalidJson: 'JSON格式无效', msgVerifyOk: '✓ 签名验证通过',
    msgVerifyFail: '✗ 签名验证失败',
    errorRsa: 'RSA算法验证需要公钥（PEM格式）',
    errorUnsupported: '不支持的算法：{alg}',
    errorSigMismatch: '签名不匹配，请检查密钥是否正确',
    verifyUsing: '使用算法：{alg}',
    helpTitle: '关于 JWT',
    helpContent: 'JSON Web Token（JWT）是一种紧凑、URL安全的声明传递方式，由三个Base64URL编码部分组成：Header（头部）、Payload（载荷）和Signature（签名）。',
  },
  'zh-TW': {
    warningTitle: '⚠️ 安全提示',
    warningMsg: '請勿貼上生產系統中的真實Token，所有處理均在瀏覽器本地完成。',
    tabDecode: '解碼', tabEncode: '編碼', tabVerify: '驗證',
    panelEncoded: '編碼後的JWT', panelHeader: 'Header（標頭）', panelPayload: 'Payload（載荷）',
    panelSignature: '簽章驗證', panelResult: '結果',
    labelHeader: 'Header（JSON）', labelPayload: 'Payload（JSON）',
    labelAlgorithm: '演算法與金鑰', labelSecret: '金鑰 / 公鑰',
    inputJwtPlaceholder: '在此貼上JWT Token…',
    inputSecretPlaceholder: '你的金鑰',
    btnClear: '清除', btnCopy: '複製', btnCopied: '已複製！',
    btnVerify: '驗證簽章', btnEncode: '產生Token', btnSample: '載入範例',
    infoExpired: '⚠️ 已過期 —', infoExpiresAt: '過期時間', infoIssuedAt: '簽發時間',
    infoNotBefore: '⚠️ 尚未生效 —', infoNotBeforeTime: '生效時間',
    msgDecodeOk: '✓ 解碼成功', msgInvalidJwt: 'JWT格式無效',
    msgEncodeOk: '✓ Token已產生', msgCopied: '已複製到剪貼簿',
    msgSecretRequired: '請輸入金鑰', msgEmptyJwt: '請先貼上JWT',
    msgEmptyHeader: '請輸入Header JSON', msgEmptyPayload: '請輸入Payload JSON',
    msgInvalidJson: 'JSON格式無效', msgVerifyOk: '✓ 簽章驗證通過',
    msgVerifyFail: '✗ 簽章驗證失敗',
    errorRsa: 'RSA演算法驗證需要公鑰（PEM格式）',
    errorUnsupported: '不支援的演算法：{alg}',
    errorSigMismatch: '簽章不符，請確認金鑰是否正確',
    verifyUsing: '使用演算法：{alg}',
    helpTitle: '關於 JWT',
    helpContent: 'JSON Web Token（JWT）是一種緊湊、URL安全的聲明傳遞方式，由三個Base64URL編碼部分組成：Header（標頭）、Payload（載荷）和Signature（簽章）。',
  },
  ja: {
    warningTitle: '⚠️ セキュリティ注意',
    warningMsg: '本番システムの実際のトークンは貼り付けないでください。すべての処理はブラウザ内でローカルに行われます。',
    tabDecode: 'デコード', tabEncode: 'エンコード', tabVerify: '検証',
    panelEncoded: 'エンコード済みJWT', panelHeader: 'ヘッダー', panelPayload: 'ペイロード',
    panelSignature: '署名検証', panelResult: '結果',
    labelHeader: 'ヘッダー（JSON）', labelPayload: 'ペイロード（JSON）',
    labelAlgorithm: 'アルゴリズムと秘密鍵', labelSecret: '秘密鍵 / 公開鍵',
    inputJwtPlaceholder: 'JWTトークンをここに貼り付け…',
    inputSecretPlaceholder: '秘密鍵を入力',
    btnClear: 'クリア', btnCopy: 'コピー', btnCopied: 'コピー済み！',
    btnVerify: '署名を検証', btnEncode: 'トークン生成', btnSample: 'サンプル読込',
    infoExpired: '⚠️ 期限切れ —', infoExpiresAt: '有効期限', infoIssuedAt: '発行日時',
    infoNotBefore: '⚠️ まだ有効でない —', infoNotBeforeTime: '有効開始',
    msgDecodeOk: '✓ デコード成功', msgInvalidJwt: 'JWTフォーマットが無効',
    msgEncodeOk: '✓ トークン生成完了', msgCopied: 'クリップボードにコピーしました',
    msgSecretRequired: '秘密鍵を入力してください', msgEmptyJwt: 'まずJWTを貼り付けてください',
    msgEmptyHeader: 'ヘッダーJSONを入力してください', msgEmptyPayload: 'ペイロードJSONを入力してください',
    msgInvalidJson: 'JSONフォーマットが無効', msgVerifyOk: '✓ 署名が有効です',
    msgVerifyFail: '✗ 署名が無効です',
    errorRsa: 'RSA検証には公開鍵（PEM形式）が必要です',
    errorUnsupported: 'サポートされていないアルゴリズム：{alg}',
    errorSigMismatch: '署名が一致しません。秘密鍵を確認してください',
    verifyUsing: '使用アルゴリズム：{alg}',
    helpTitle: 'JWT について',
    helpContent: 'JSON Web Token（JWT）は、ドット区切りの3つのBase64URLエンコード部分（ヘッダー・ペイロード・署名）で構成される、コンパクトでURLセーフなクレーム伝達方式です。',
  },
};

// ── Crypto helpers ──────────────────────────────────────────────

function b64urlDecodeStr(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function b64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function jsonB64url(obj: object): string {
  return b64urlEncode(new TextEncoder().encode(JSON.stringify(obj)));
}

function hashName(alg: string): string {
  return alg === 'HS384' ? 'SHA-384' : alg === 'HS512' ? 'SHA-512' : 'SHA-256';
}

async function hmacSign(alg: string, secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: hashName(alg) }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

async function hmacVerify(alg: string, secret: string, data: string, sigB64: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: hashName(alg) }, false, ['verify']
  );
  const padded = sigB64.replace(/-/g, '+').replace(/_/g, '/');
  const sigBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
}

// ── Component ───────────────────────────────────────────────────

export default function JwtDebuggerTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [tab, setTab] = useState<Tab>('decode');

  // Decode tab
  const [jwtInput, setJwtInput] = useState('');
  const [decHeader, setDecHeader] = useState('');
  const [decPayload, setDecPayload] = useState('');
  const [decodeErr, setDecodeErr] = useState('');
  const [claims, setClaims] = useState<{ html: string } | null>(null);
  const [verSecret, setVerSecret] = useState('');
  const [verResult, setVerResult] = useState<VerifyResult>(null);
  const [copiedH, setCopiedH] = useState(false);
  const [copiedP, setCopiedP] = useState(false);

  // Encode tab
  const [encHeader, setEncHeader] = useState('');
  const [encPayload, setEncPayload] = useState('');
  const [encAlg, setEncAlg] = useState('HS256');
  const [encSecret, setEncSecret] = useState('');
  const [encOutput, setEncOutput] = useState('');
  const [encErr, setEncErr] = useState('');
  const [copiedOut, setCopiedOut] = useState(false);

  // Verify tab
  const [verTabJwt, setVerTabJwt] = useState('');
  const [verTabSecret, setVerTabSecret] = useState('');
  const [verTabResult, setVerTabResult] = useState<VerifyResult>(null);

  // Decode on input change
  useEffect(() => {
    const jwt = jwtInput.trim();
    if (!jwt) { setDecHeader(''); setDecPayload(''); setDecodeErr(''); setClaims(null); return; }
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error(t.msgInvalidJwt);
      const header = JSON.parse(b64urlDecodeStr(parts[0]));
      const payload = JSON.parse(b64urlDecodeStr(parts[1]));
      setDecHeader(JSON.stringify(header, null, 2));
      setDecPayload(JSON.stringify(payload, null, 2));
      setDecodeErr('');
      (window as any).__trackToolUsed?.(slug);

      // Claims
      let html = '';
      if (payload.exp) {
        const d = new Date(payload.exp * 1000);
        const expired = d < new Date();
        html += `<div style="color:${expired ? '#dc2626' : '#059669'}">${expired ? t.infoExpired + ' ' : ''}${t.infoExpiresAt}: ${d.toLocaleString()}</div>`;
      }
      if (payload.iat) {
        html += `<div>${t.infoIssuedAt}: ${new Date(payload.iat * 1000).toLocaleString()}</div>`;
      }
      if (payload.nbf) {
        const d = new Date(payload.nbf * 1000);
        const notYet = d > new Date();
        html += `<div style="color:${notYet ? '#dc2626' : '#059669'}">${notYet ? t.infoNotBefore + ' ' : ''}${t.infoNotBeforeTime}: ${d.toLocaleString()}</div>`;
      }
      setClaims(html ? { html } : null);
      setVerResult(null);
    } catch (e: any) {
      setDecHeader(''); setDecPayload(''); setClaims(null);
      setDecodeErr(e.message || t.msgInvalidJwt);
    }
  }, [jwtInput]);

  const doVerify = useCallback(async () => {
    const jwt = jwtInput.trim();
    if (!jwt) { setVerResult({ ok: false, msg: t.msgEmptyJwt, detail: '' }); return; }
    if (!verSecret) { setVerResult({ ok: false, msg: t.msgSecretRequired, detail: '' }); return; }
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) { setVerResult({ ok: false, msg: t.msgInvalidJwt, detail: '' }); return; }
      const header = JSON.parse(b64urlDecodeStr(parts[0]));
      const alg: string = header.alg || '';
      if (alg.startsWith('RS') || alg.startsWith('ES')) {
        setVerResult({ ok: false, msg: t.msgVerifyFail, detail: t.errorRsa }); return;
      }
      if (!['HS256', 'HS384', 'HS512'].includes(alg)) {
        setVerResult({ ok: false, msg: t.msgVerifyFail, detail: t.errorUnsupported.replace('{alg}', alg) }); return;
      }
      const ok = await hmacVerify(alg, verSecret, `${parts[0]}.${parts[1]}`, parts[2]);
      setVerResult({ ok, msg: ok ? t.msgVerifyOk : t.msgVerifyFail, detail: ok ? t.verifyUsing.replace('{alg}', alg) : t.errorSigMismatch });
    } catch (e: any) {
      setVerResult({ ok: false, msg: t.msgVerifyFail, detail: e.message });
    }
  }, [jwtInput, verSecret, t]);

  const doEncode = useCallback(async () => {
    setEncErr(''); setEncOutput('');
    if (!encHeader.trim()) { setEncErr(t.msgEmptyHeader); return; }
    if (!encPayload.trim()) { setEncErr(t.msgEmptyPayload); return; }
    if (!encSecret.trim()) { setEncErr(t.msgSecretRequired); return; }
    try {
      const hObj = JSON.parse(encHeader);
      const pObj = JSON.parse(encPayload);
      const finalHeader = { alg: encAlg, typ: 'JWT', ...hObj };
      const h64 = jsonB64url(finalHeader);
      const p64 = jsonB64url(pObj);
      const sig = await hmacSign(encAlg, encSecret, `${h64}.${p64}`);
      setEncOutput(`${h64}.${p64}.${sig}`);
    } catch (e: any) {
      setEncErr(`${t.msgInvalidJson}: ${e.message}`);
    }
  }, [encHeader, encPayload, encAlg, encSecret, t]);

  const loadSample = () => {
    setEncHeader(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2));
    setEncPayload(JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: Math.floor(Date.now() / 1000) }, null, 2));
    setEncSecret('your-256-bit-secret');
    setEncErr(''); setEncOutput('');
  };

  const doVerifyTab = useCallback(async () => {
    const jwt = verTabJwt.trim();
    if (!jwt) { setVerTabResult({ ok: false, msg: t.msgEmptyJwt, detail: '' }); return; }
    if (!verTabSecret) { setVerTabResult({ ok: false, msg: t.msgSecretRequired, detail: '' }); return; }
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) { setVerTabResult({ ok: false, msg: t.msgInvalidJwt, detail: '' }); return; }
      const header = JSON.parse(b64urlDecodeStr(parts[0]));
      const alg: string = header.alg || '';
      if (alg.startsWith('RS') || alg.startsWith('ES')) {
        setVerTabResult({ ok: false, msg: t.msgVerifyFail, detail: t.errorRsa }); return;
      }
      if (!['HS256', 'HS384', 'HS512'].includes(alg)) {
        setVerTabResult({ ok: false, msg: t.msgVerifyFail, detail: t.errorUnsupported.replace('{alg}', alg) }); return;
      }
      const ok = await hmacVerify(alg, verTabSecret, `${parts[0]}.${parts[1]}`, parts[2]);
      setVerTabResult({ ok, msg: ok ? t.msgVerifyOk : t.msgVerifyFail, detail: ok ? t.verifyUsing.replace('{alg}', alg) : t.errorSigMismatch });
    } catch (e: any) {
      setVerTabResult({ ok: false, msg: t.msgVerifyFail, detail: e.message });
    }
  }, [verTabJwt, verTabSecret, t]);

  const copy = async (text: string, setCopied: (v: boolean) => void) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Styles ──
  const card: React.CSSProperties = { border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-card-bg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
  const panelHead = (bg: string): React.CSSProperties => ({
    padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.875rem',
    background: bg, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  });
  const ta: React.CSSProperties = {
    flex: 1, border: 'none', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem',
    resize: 'vertical', background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100px',
  };
  const input: React.CSSProperties = {
    flex: 1, padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px',
    background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.875rem',
  };
  const btn: React.CSSProperties = {
    padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)',
    color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' as const,
  };
  const btnSec: React.CSSProperties = { ...btn, background: 'var(--color-card-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' };
  const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', color: '#fff', opacity: 0.85, lineHeight: 1 };
  const verBox = (ok: boolean): React.CSSProperties => ({
    padding: '0.65rem 0.9rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
    background: ok ? '#d1fae5' : '#fee2e2', color: ok ? '#065f46' : '#991b1b',
    border: `1px solid ${ok ? '#34d399' : '#f87171'}`,
  });

  const CopyBtn = ({ text, copied, onCopy }: { text: string; copied: boolean; onCopy: () => void }) => (
    <button style={iconBtn} onClick={onCopy} title={t.btnCopy}>
      {copied ? '✓' : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      )}
    </button>
  );

  const VerifyBox = ({ result }: { result: VerifyResult }) => result ? (
    <div style={verBox(result.ok)}>
      {result.msg}
      {result.detail && <div style={{ fontSize: '0.8rem', fontWeight: 400, marginTop: '0.3rem', opacity: 0.9 }}>{result.detail}</div>}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Warning */}
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px', padding: '0.75rem 1rem', color: '#92400e' }}>
        <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>{t.warningTitle}</strong>
        <span style={{ fontSize: '0.82rem' }}>{t.warningMsg}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)' }}>
        {(['decode', 'encode', 'verify'] as Tab[]).map((id) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '0.65rem 1.4rem', background: 'transparent', border: 'none',
            borderBottom: `3px solid ${tab === id ? 'var(--color-primary)' : 'transparent'}`,
            color: tab === id ? 'var(--color-primary)' : 'var(--color-text)',
            fontWeight: tab === id ? 700 : 400, cursor: 'pointer', fontSize: '0.9rem',
            transition: 'all 0.15s',
          }}>
            {id === 'decode' ? t.tabDecode : id === 'encode' ? t.tabEncode : t.tabVerify}
          </button>
        ))}
      </div>

      {/* ── DECODE TAB ── */}
      {tab === 'decode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* JWT input */}
          <div style={card}>
            <div style={panelHead('var(--color-primary)')}>
              <span>{t.panelEncoded}</span>
              <button style={iconBtn} onClick={() => { setJwtInput(''); setVerResult(null); }} title={t.btnClear}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
            <textarea value={jwtInput} onChange={(e) => setJwtInput(e.target.value)}
              placeholder={t.inputJwtPlaceholder} rows={5} style={{ ...ta, minHeight: '80px' }} />
            {decodeErr && <p style={{ margin: '0 1rem 0.5rem', fontSize: '0.82rem', color: '#ef4444' }}>{decodeErr}</p>}
          </div>

          {/* Header + Payload split */}
          <div className="tl-auto-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
            <div style={card}>
              <div style={panelHead('#fb7185')}>
                <span>{t.panelHeader}</span>
                <CopyBtn text={decHeader} copied={copiedH} onCopy={() => copy(decHeader, setCopiedH)} />
              </div>
              <textarea value={decHeader} readOnly rows={8} style={ta} />
            </div>
            <div style={card}>
              <div style={panelHead('#a78bfa')}>
                <span>{t.panelPayload}</span>
                <CopyBtn text={decPayload} copied={copiedP} onCopy={() => copy(decPayload, setCopiedP)} />
              </div>
              <textarea value={decPayload} readOnly rows={8} style={ta} />
              {claims && (
                <div style={{ padding: '0.65rem 1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}
                  dangerouslySetInnerHTML={{ __html: claims.html }} />
              )}
            </div>
          </div>

          {/* Signature verify */}
          <div style={card}>
            <div style={panelHead('#34d399')}><span>{t.panelSignature}</span></div>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
              <input style={input} type="text" placeholder={t.inputSecretPlaceholder}
                value={verSecret} onChange={(e) => { setVerSecret(e.target.value); setVerResult(null); }} />
              <button style={btn} onClick={doVerify}>{t.btnVerify}</button>
            </div>
            {verResult && <div style={{ margin: '0 1rem 0.75rem' }}><VerifyBox result={verResult} /></div>}
          </div>
        </div>
      )}

      {/* ── ENCODE TAB ── */}
      {tab === 'encode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="tl-auto-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
            <div style={card}>
              <div style={panelHead('#fb7185')}><span>{t.labelHeader}</span></div>
              <textarea value={encHeader} onChange={(e) => setEncHeader(e.target.value)}
                rows={8} placeholder={'{\n  "alg": "HS256",\n  "typ": "JWT"\n}'} style={ta} />
            </div>
            <div style={card}>
              <div style={panelHead('#a78bfa')}><span>{t.labelPayload}</span></div>
              <textarea value={encPayload} onChange={(e) => setEncPayload(e.target.value)}
                rows={8} placeholder={'{\n  "sub": "1234567890",\n  "name": "John Doe"\n}'} style={ta} />
            </div>
          </div>

          <div style={card}>
            <div style={panelHead('var(--color-primary)')}><span>{t.labelAlgorithm}</span></div>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
              <select value={encAlg} onChange={(e) => setEncAlg(e.target.value)}
                style={{ ...input, flex: '0 0 auto', minWidth: '160px' }}>
                <option value="HS256">HS256 — HMAC-SHA256</option>
                <option value="HS384">HS384 — HMAC-SHA384</option>
                <option value="HS512">HS512 — HMAC-SHA512</option>
              </select>
              <input style={input} type="text" placeholder={t.inputSecretPlaceholder}
                value={encSecret} onChange={(e) => setEncSecret(e.target.value)} />
              <button style={btn} onClick={doEncode}>{t.btnEncode}</button>
              <button style={btnSec} onClick={loadSample}>{t.btnSample}</button>
            </div>
            {encErr && <p style={{ margin: '0 1rem 0.5rem', fontSize: '0.82rem', color: '#ef4444' }}>{encErr}</p>}
          </div>

          <div style={card}>
            <div style={panelHead('var(--color-primary)')}>
              <span>{t.panelEncoded}</span>
              <CopyBtn text={encOutput} copied={copiedOut} onCopy={() => copy(encOutput, setCopiedOut)} />
            </div>
            <textarea value={encOutput} readOnly rows={5} style={{ ...ta, minHeight: '70px' }}
              placeholder="Generated JWT will appear here…" />
          </div>
        </div>
      )}

      {/* ── VERIFY TAB ── */}
      {tab === 'verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={card}>
            <div style={panelHead('var(--color-primary)')}><span>{t.panelEncoded}</span></div>
            <textarea value={verTabJwt} onChange={(e) => { setVerTabJwt(e.target.value); setVerTabResult(null); }}
              placeholder={t.inputJwtPlaceholder} rows={5} style={{ ...ta, minHeight: '80px' }} />
          </div>
          <div style={card}>
            <div style={panelHead('#34d399')}><span>{t.labelSecret}</span></div>
            <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
              <input style={input} type="text" placeholder={t.inputSecretPlaceholder}
                value={verTabSecret} onChange={(e) => { setVerTabSecret(e.target.value); setVerTabResult(null); }} />
              <button style={btn} onClick={doVerifyTab}>{t.btnVerify}</button>
            </div>
          </div>
          <div style={card}>
            <div style={panelHead('var(--color-primary)')}><span>{t.panelResult}</span></div>
            <div style={{ padding: '0.75rem 1rem' }}>
              {verTabResult ? <VerifyBox result={verTabResult} /> : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>—</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div style={{ padding: '1rem 1.25rem', background: 'var(--color-bg)', borderRadius: '10px', borderLeft: '4px solid var(--color-primary)' }}>
        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{t.helpTitle}</p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{t.helpContent}</p>
      </div>
    </div>
  );
}
