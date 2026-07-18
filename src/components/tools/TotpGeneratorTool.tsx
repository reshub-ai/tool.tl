import { useState, useEffect, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    securityNotice: '🔒 All computation runs locally in your browser. Your secret key is never uploaded to any server.',
    panelSettings: 'Settings',
    panelOutput: 'Token',
    labelSecret: 'Secret Key (Base32)',
    placeholderSecret: 'JBSWY3DPEHPK3PXP',
    labelDigits: 'Digits',
    labelPeriod: 'Period',
    labelAlgorithm: 'Algorithm',
    labelIssuer: 'Issuer',
    placeholderIssuer: 'e.g. GitHub',
    labelAccount: 'Account',
    placeholderAccount: 'user@example.com',
    btnStart: 'Generate',
    btnSample: 'Load Sample',
    btnStop: 'Stop',
    btnCopyToken: 'Copy Code',
    btnCopyUri: 'Copy URI',
    btnClear: 'Clear',
    panelUri: 'OTP Auth URI',
    placeholderUri: 'otpauth:// URI will appear here…',
    countdownPrefix: 'Refreshes in',
    msgCopied: 'Copied!',
    msgSecretRequired: 'Secret key is required.',
    msgInvalidSecret: 'Invalid Base32 secret key.',
    msgError: 'Error: {error}',
  },
  'zh-CN': {
    securityNotice: '🔒 所有计算均在您的浏览器本地完成，密钥不会上传到任何服务器。',
    panelSettings: '参数设置',
    panelOutput: '动态口令',
    labelSecret: '密钥（Base32）',
    placeholderSecret: 'JBSWY3DPEHPK3PXP',
    labelDigits: '位数',
    labelPeriod: '周期',
    labelAlgorithm: '算法',
    labelIssuer: '签发方',
    placeholderIssuer: '例如 GitHub',
    labelAccount: '账号',
    placeholderAccount: 'user@example.com',
    btnStart: '生成',
    btnSample: '加载示例',
    btnStop: '停止',
    btnCopyToken: '复制口令',
    btnCopyUri: '复制 URI',
    btnClear: '清空',
    panelUri: 'OTP Auth URI',
    placeholderUri: 'otpauth:// URI 将显示于此…',
    countdownPrefix: '剩余',
    msgCopied: '已复制！',
    msgSecretRequired: '请输入密钥。',
    msgInvalidSecret: '无效的 Base32 密钥。',
    msgError: '错误：{error}',
  },
  'zh-TW': {
    securityNotice: '🔒 所有運算均在您的瀏覽器本地完成，金鑰不會上傳至任何伺服器。',
    panelSettings: '參數設定',
    panelOutput: '動態密碼',
    labelSecret: '金鑰（Base32）',
    placeholderSecret: 'JBSWY3DPEHPK3PXP',
    labelDigits: '位數',
    labelPeriod: '週期',
    labelAlgorithm: '演算法',
    labelIssuer: '簽發方',
    placeholderIssuer: '例如 GitHub',
    labelAccount: '帳號',
    placeholderAccount: 'user@example.com',
    btnStart: '產生',
    btnSample: '載入範例',
    btnStop: '停止',
    btnCopyToken: '複製密碼',
    btnCopyUri: '複製 URI',
    btnClear: '清除',
    panelUri: 'OTP Auth URI',
    placeholderUri: 'otpauth:// URI 將顯示於此…',
    countdownPrefix: '剩餘',
    msgCopied: '已複製！',
    msgSecretRequired: '請輸入金鑰。',
    msgInvalidSecret: '無效的 Base32 金鑰。',
    msgError: '錯誤：{error}',
  },
  ja: {
    securityNotice: '🔒 すべての処理はブラウザ内でローカルに実行されます。秘密鍵はサーバーに送信されません。',
    panelSettings: '設定',
    panelOutput: 'ワンタイムパスワード',
    labelSecret: '秘密鍵（Base32）',
    placeholderSecret: 'JBSWY3DPEHPK3PXP',
    labelDigits: '桁数',
    labelPeriod: '有効期間',
    labelAlgorithm: 'アルゴリズム',
    labelIssuer: '発行者',
    placeholderIssuer: '例: GitHub',
    labelAccount: 'アカウント',
    placeholderAccount: 'user@example.com',
    btnStart: '生成',
    btnSample: 'サンプル',
    btnStop: '停止',
    btnCopyToken: 'コードをコピー',
    btnCopyUri: 'URI をコピー',
    btnClear: 'クリア',
    panelUri: 'OTP Auth URI',
    placeholderUri: 'otpauth:// URI がここに表示されます…',
    countdownPrefix: '残り',
    msgCopied: 'コピーしました！',
    msgSecretRequired: '秘密鍵を入力してください。',
    msgInvalidSecret: '無効な Base32 秘密鍵です。',
    msgError: 'エラー：{error}',
  },
};

// ── TOTP helpers ─────────────────────────────────────────────────────────────

function base32ToBytes(str: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = (str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  if (!cleaned) return new Uint8Array([]);
  let bits = '';
  for (const ch of cleaned) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

function generateBase32(len = 16): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let s = '';
  for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

async function computeTotp(key: CryptoKey, period: number, digits: number): Promise<{ code: string; remaining: number }> {
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, counter, false);
  const hmac = await crypto.subtle.sign('HMAC', key, buf);
  const bytes = new Uint8Array(hmac);
  const offset = bytes[bytes.length - 1] & 0x0f;
  const binCode =
    ((bytes[offset] & 0x7f) << 24) |
    ((bytes[offset + 1] & 0xff) << 16) |
    ((bytes[offset + 2] & 0xff) << 8) |
    (bytes[offset + 3] & 0xff);
  const code = (binCode % 10 ** digits).toString().padStart(digits, '0');
  return { code, remaining: period - (now % period) };
}

function buildUri(secret: string, issuer: string, account: string, algo: string, digits: number, period: number): string {
  const esc = encodeURIComponent;
  let label = esc(account || 'user');
  if (issuer) label = esc(issuer) + ':' + label;
  let uri = `otpauth://totp/${label}?secret=${esc(secret)}&digits=${digits}&period=${period}&algorithm=${esc(algo)}`;
  if (issuer) uri += `&issuer=${esc(issuer)}`;
  return uri;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TotpGeneratorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;

  const [secret, setSecret] = useState('');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [code, setCode] = useState('------');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [running, setRunning] = useState(false);

  const keyRef = useRef<CryptoKey | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paramsRef = useRef({ period: 30, digits: 6 });

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const tick = useCallback(async () => {
    if (!keyRef.current) return;
    try {
      const res = await computeTotp(keyRef.current, paramsRef.current.period, paramsRef.current.digits);
      setCode(res.code);
      setRemaining(res.remaining);
    } catch (e: any) {
      setError(t.msgError.replace('{error}', e.message));
      stopTimer();
      setRunning(false);
    }
  }, [t]);

  const start = useCallback(async (
    sec = secret, dg = digits, pd = period, alg = 'SHA-1', iss = issuer, acc = account
  ) => {
    setError('');
    if (!sec.trim()) { setError(t.msgSecretRequired); return; }
    const secretBytes = base32ToBytes(sec.trim());
    if (!secretBytes.length) { setError(t.msgInvalidSecret); return; }
    try {
      const key = await crypto.subtle.importKey(
        'raw', secretBytes, { name: 'HMAC', hash: { name: alg } }, false, ['sign']
      );
      keyRef.current = key;
      paramsRef.current = { period: pd, digits: dg };
      setUri(buildUri(sec.trim(), iss, acc, alg, dg, pd));
      stopTimer();
      await tick();
      timerRef.current = setInterval(tick, 1000);
      setRunning(true);
    } catch (e: any) {
      setError(t.msgError.replace('{error}', e.message));
    }
  }, [secret, digits, period, issuer, account, t, tick]);

  const stop = () => { stopTimer(); setRunning(false); };

  const loadSample = () => {
    const s = 'JBSWY3DPEHPK3PXP';
    setSecret(s); setIssuer('tool.tl'); setAccount('demo@example.com');
    setDigits(6); setPeriod(30);
    start(s, 6, 30, 'SHA-1', 'tool.tl', 'demo@example.com');
  };

  const clearAll = () => {
    stop();
    setSecret(''); setIssuer(''); setAccount('');
    setCode('------'); setRemaining(null); setUri(''); setError('');
  };

  const copy = async (text: string, setCopied: (v: boolean) => void) => {
    if (!text || text === '------') return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Auto-generate secret and start on mount
  useEffect(() => {
    const s = generateBase32(16);
    setSecret(s);
    start(s, 6, 30, 'SHA-1', '', '');
    (window as any).__trackToolUsed?.(slug);
    return stopTimer;
  }, []);

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
    color: 'var(--color-text)', fontSize: '14px',
  };
  const pill: React.CSSProperties = {
    padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = { ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none' };
  const pillGreen: React.CSSProperties = { ...pill, background: '#16a34a', color: '#fff', border: 'none' };
  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '14px', padding: '18px',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' };

  // Progress bar width
  const maxPeriod = period;
  const progressPct = remaining !== null ? (remaining / maxPeriod) * 100 : 0;
  const isLow = remaining !== null && remaining <= 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Security notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.3)',
        fontSize: '0.82rem', color: 'var(--color-text)',
      }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔒</span>
        <span style={{ lineHeight: 1.55 }}>{t.securityNotice.replace('🔒 ', '')}</span>
      </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>

      {/* ── Left panel: Settings ── */}
      <div style={card}>
        <p style={{ margin: '0 0 14px', fontWeight: 600, fontSize: '15px', color: 'var(--color-text)' }}>{t.panelSettings}</p>

        <label style={lbl}>{t.labelSecret}</label>
        <input style={{ ...inp, marginBottom: '14px', fontFamily: 'monospace' }}
          type="text" value={secret} placeholder={t.placeholderSecret}
          onChange={(e) => setSecret(e.target.value)} />

        <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>{t.labelDigits}</label>
            <select style={inp} value={digits} onChange={(e) => setDigits(Number(e.target.value))}>
              <option value={6}>6</option>
              <option value={8}>8</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>{t.labelPeriod}</label>
            <select style={inp} value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </div>
        </div>

        <label style={lbl}>{t.labelAlgorithm}</label>
        <select style={{ ...inp, marginBottom: '14px' }} disabled>
          <option>SHA-1</option>
        </select>

        <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>{t.labelIssuer}</label>
            <input style={inp} type="text" value={issuer} placeholder={t.placeholderIssuer}
              onChange={(e) => setIssuer(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>{t.labelAccount}</label>
            <input style={inp} type="text" value={account} placeholder={t.placeholderAccount}
              onChange={(e) => setAccount(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={pillPrimary} onClick={() => start()}>{t.btnStart}</button>
          <button style={pill} onClick={loadSample}>{t.btnSample}</button>
          <button style={pill} onClick={stop}>{t.btnStop}</button>
        </div>

        {error && <p style={{ marginTop: '10px', fontSize: '14px', color: '#e11d48' }}>{error}</p>}
      </div>

      {/* ── Right panel: Token + URI ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={card}>
          <p style={{ margin: '0 0 14px', fontWeight: 600, fontSize: '15px', color: 'var(--color-text)' }}>{t.panelOutput}</p>

          {/* Code display */}
          <div style={{
            fontFamily: 'monospace', fontSize: '42px', letterSpacing: '8px', fontWeight: 700,
            textAlign: 'center', padding: '16px 12px',
            borderRadius: '14px', border: '1px dashed var(--color-border)',
            background: 'var(--color-bg)', color: isLow ? '#dc2626' : 'var(--color-text)',
            transition: 'color 0.3s',
          }}>
            {code}
          </div>

          {/* Progress bar */}
          {remaining !== null && (
            <div style={{ margin: '10px 0 0', height: '4px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: isLow ? '#dc2626' : 'var(--color-primary)',
                transition: 'width 1s linear, background 0.3s',
              }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            {remaining !== null && (
              <span style={{ fontSize: '14px', color: isLow ? '#dc2626' : 'var(--color-text-secondary)' }}>
                {t.countdownPrefix} {remaining}s
              </span>
            )}
            <button style={copiedToken ? pillGreen : pill} onClick={() => copy(code, setCopiedToken)}>
              {copiedToken ? t.msgCopied : t.btnCopyToken}
            </button>
          </div>
        </div>

        <div style={card}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '15px', color: 'var(--color-text)' }}>{t.panelUri}</p>
          <textarea
            value={uri} readOnly placeholder={t.placeholderUri}
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--color-border)',
              borderRadius: '10px', background: 'var(--color-bg)', color: 'var(--color-text)',
              resize: 'vertical', fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.6,
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button style={copiedUri ? pillGreen : pillPrimary} onClick={() => copy(uri, setCopiedUri)}>
              {copiedUri ? t.msgCopied : t.btnCopyUri}
            </button>
            <button style={pill} onClick={clearAll}>{t.btnClear}</button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .totp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
    </div>
  );
}
