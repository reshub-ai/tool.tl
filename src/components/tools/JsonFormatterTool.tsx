import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    panelInput: 'Input', panelOutput: 'Output', panelTree: 'JSON Tree View',
    phInput: 'Paste JSON here…', phOutput: 'Result appears here…',
    btnFormat: 'Format', btnMinify: 'Minify', btnValidate: 'Validate',
    btnUnescape: 'Unescape Unicode', btnEscape: 'Escape Unicode',
    btnCopy: 'Copy Output', btnTree: 'Tree View',
    clearInput: 'Clear input', clearOutput: 'Clear output',
    msgValid: '✓ Valid JSON', msgCopied: '✓ Copied!', msgEmpty: 'Please paste JSON first.',
    msgNoOutput: 'Run Format or Minify first.', msgNoTree: 'No formatted output to view.',
    msgUnescape: 'Unicode sequences decoded.', msgEscape: 'Non-ASCII encoded to \\uXXXX.',
    msgInvalid: 'Invalid JSON: {error}',
  },
  'zh-CN': {
    panelInput: '输入', panelOutput: '输出', panelTree: 'JSON 树形视图',
    phInput: '在此粘贴 JSON…', phOutput: '结果将显示在这里…',
    btnFormat: '格式化', btnMinify: '压缩', btnValidate: '验证',
    btnUnescape: '解码 Unicode', btnEscape: '编码 Unicode',
    btnCopy: '复制结果', btnTree: '树形视图',
    clearInput: '清空输入', clearOutput: '清空输出',
    msgValid: '✓ 合法的 JSON', msgCopied: '✓ 已复制！', msgEmpty: '请先粘贴 JSON。',
    msgNoOutput: '请先格式化或压缩。', msgNoTree: '没有可查看的格式化结果。',
    msgUnescape: 'Unicode 转义序列已解码。', msgEscape: '非 ASCII 字符已编码为 \\uXXXX。',
    msgInvalid: 'JSON 无效：{error}',
  },
  'zh-TW': {
    panelInput: '輸入', panelOutput: '輸出', panelTree: 'JSON 樹狀檢視',
    phInput: '在此貼上 JSON…', phOutput: '結果將顯示在這裡…',
    btnFormat: '格式化', btnMinify: '壓縮', btnValidate: '驗證',
    btnUnescape: '解碼 Unicode', btnEscape: '編碼 Unicode',
    btnCopy: '複製結果', btnTree: '樹狀視圖',
    clearInput: '清除輸入', clearOutput: '清除輸出',
    msgValid: '✓ 合法的 JSON', msgCopied: '✓ 已複製！', msgEmpty: '請先貼上 JSON。',
    msgNoOutput: '請先格式化或壓縮。', msgNoTree: '沒有可檢視的格式化結果。',
    msgUnescape: 'Unicode 轉義序列已解碼。', msgEscape: '非 ASCII 字元已編碼為 \\uXXXX。',
    msgInvalid: 'JSON 無效：{error}',
  },
  ja: {
    panelInput: '入力', panelOutput: '出力', panelTree: 'JSONツリー表示',
    phInput: 'JSONをここに貼り付け…', phOutput: '結果がここに表示されます…',
    btnFormat: '整形', btnMinify: '圧縮', btnValidate: '検証',
    btnUnescape: 'Unicodeデコード', btnEscape: 'Unicodeエンコード',
    btnCopy: '出力をコピー', btnTree: 'ツリー表示',
    clearInput: '入力をクリア', clearOutput: '出力をクリア',
    msgValid: '✓ 有効なJSON', msgCopied: '✓ コピーしました！', msgEmpty: 'まずJSONを貼り付けてください。',
    msgNoOutput: '先に整形または圧縮してください。', msgNoTree: '表示する整形済み出力がありません。',
    msgUnescape: 'Unicodeエスケープシーケンスをデコードしました。', msgEscape: '非ASCII文字を\\uXXXXにエンコードしました。',
    msgInvalid: '無効なJSON: {error}',
  },
};

// ── Tree builder ──────────────────────────────────────────────────────────────

function buildTree(obj: unknown): React.ReactNode {
  if (Array.isArray(obj)) {
    return (
      <ul style={{ listStyle: 'none', paddingLeft: '1.2em', margin: 0 }}>
        {obj.map((val, i) => <TreeNode key={i} label={`[${i}]`} value={val} />)}
      </ul>
    );
  }
  if (obj !== null && typeof obj === 'object') {
    return (
      <ul style={{ listStyle: 'none', paddingLeft: '1.2em', margin: 0 }}>
        {Object.entries(obj as Record<string, unknown>).map(([k, v]) => <TreeNode key={k} label={`"${k}"`} value={v} />)}
      </ul>
    );
  }
  return null;
}

function TreeNode({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(true);
  const isObj = value !== null && typeof value === 'object';

  if (isObj) {
    const arr = Array.isArray(value);
    const count = arr ? (value as unknown[]).length : Object.keys(value as object).length;
    return (
      <li style={{ margin: '3px 0', whiteSpace: 'nowrap' }}>
        <span onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', marginRight: '4px', userSelect: 'none', opacity: 0.7 }}>
          {open ? '▼' : '▶'}
        </span>
        <span style={{ color: 'var(--color-primary)' }}>{label}</span>
        {': '}
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8em' }}>
          {arr ? `Array[${count}]` : `Object{${count}}`}
        </span>
        {open && buildTree(value)}
      </li>
    );
  }

  const typeColor = value === null ? '#6b7280' : typeof value === 'string' ? '#16a34a' : typeof value === 'number' ? '#2563eb' : '#d97706';
  return (
    <li style={{ margin: '3px 0', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--color-primary)' }}>{label}</span>
      {': '}
      <span style={{ color: typeColor }}>{JSON.stringify(value)}</span>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8em', marginLeft: '4px' }}>({value === null ? 'null' : typeof value})</span>
    </li>
  );
}

// ── Unicode helpers ───────────────────────────────────────────────────────────

function decodeDeep(val: unknown): unknown {
  if (typeof val === 'string') {
    return val.replace(/\\\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)))
              .replace(/\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)));
  }
  if (Array.isArray(val)) return val.map(decodeDeep);
  if (val !== null && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val as object).map(([k, v]) => [k, decodeDeep(v)]));
  }
  return val;
}

function encodeDeep(val: unknown): unknown {
  if (typeof val === 'string') {
    return val.split('').map(ch => ch.charCodeAt(0) > 127 ? '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0') : ch).join('');
  }
  if (Array.isArray(val)) return val.map(encodeDeep);
  if (val !== null && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val as object).map(([k, v]) => [encodeDeep(k) as string, encodeDeep(v)]));
  }
  return val;
}

function hasUnicodeContent(s: string) {
  return /[一-龥-￿]/.test(s) || /\\u[0-9a-fA-F]{4}/.test(s) || /\\"/.test(s);
}

// ── Component ─────────────────────────────────────────────────────────────────

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconMax = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);
const IconMin = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

export default function JsonFormatterTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [treeObj, setTreeObj] = useState<unknown>(null);
  const [maximized, setMaximized] = useState<'in' | 'out' | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>();

  const flash = (text: string, ok = false) => {
    setMsg(text); setMsgOk(ok);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(''), 3000);
  };

  const tryParse = (src: string): [unknown, null] | [null, string] => {
    try { return [JSON.parse(src), null]; } catch (e: any) { return [null, e.message]; }
  };

  const format = () => {
    if (!input.trim()) return flash(t.msgEmpty);
    const [obj, err] = tryParse(input);
    if (err) return flash(t.msgInvalid.replace('{error}', err));
    setOutput(JSON.stringify(obj, null, 2));
    (window as any).__trackToolUsed?.(slug);
  };

  const minify = () => {
    if (!input.trim()) return flash(t.msgEmpty);
    const [obj, err] = tryParse(input);
    if (err) return flash(t.msgInvalid.replace('{error}', err));
    setOutput(JSON.stringify(obj));
  };

  const validate = () => {
    if (!input.trim()) return flash(t.msgEmpty);
    const [, err] = tryParse(input);
    if (err) flash(t.msgInvalid.replace('{error}', err));
    else flash(t.msgValid, true);
  };

  const copy = async () => {
    if (!output) return flash(t.msgNoOutput);
    await navigator.clipboard.writeText(output);
    flash(t.msgCopied, true);
  };

  const unescape = () => {
    if (!input.trim()) return flash(t.msgEmpty);
    const [obj, err] = tryParse(input);
    if (err) return flash(t.msgInvalid.replace('{error}', err));
    setInput(JSON.stringify(decodeDeep(obj), null, 2));
    flash(t.msgUnescape, true);
  };

  const escape = () => {
    if (!input.trim()) return flash(t.msgEmpty);
    const [obj, err] = tryParse(input);
    if (err) return flash(t.msgInvalid.replace('{error}', err));
    setInput(JSON.stringify(encodeDeep(obj), null, 2));
    flash(t.msgEscape, true);
  };

  const tree = () => {
    if (!output) return flash(t.msgNoTree);
    const [obj, err] = tryParse(output || input);
    if (err) return flash(t.msgInvalid.replace('{error}', err));
    setTreeObj(obj);
    setShowModal(true);
  };

  const canUnescape = hasUnicodeContent(input);

  const panelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column',
    border: '1px solid var(--color-border)', borderRadius: '12px',
    background: 'var(--color-card-bg)', overflow: 'hidden', flex: 1, minHeight: 0,
  };
  const headerStyle: React.CSSProperties = {
    padding: '10px 14px', fontWeight: 600, fontSize: '0.85rem',
    color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const iconBtnStyle: React.CSSProperties = {
    padding: '4px 7px', border: 'none', background: 'transparent', cursor: 'pointer',
    borderRadius: '5px', opacity: 0.65, lineHeight: 0, color: 'var(--color-text)',
    display: 'inline-flex', alignItems: 'center',
  };
  const taStyle: React.CSSProperties = {
    flex: 1, minHeight: '380px', border: 'none', padding: '14px',
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    fontSize: '13px', lineHeight: 1.65, resize: 'none',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', outline: 'none',
  };
  const actionBtn: React.CSSProperties = {
    padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Two panels */}
      <div style={{ display: 'grid', gridTemplateColumns: maximized ? '1fr' : '1fr 1fr', gap: '14px' }}>
        {/* Input */}
        {maximized !== 'out' && (
          <div style={panelStyle}>
            <div style={headerStyle}>
              <span>{t.panelInput}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={iconBtnStyle} title={maximized === 'in' ? '' : ''} onClick={() => setMaximized(maximized === 'in' ? null : 'in')}>
                  {maximized === 'in' ? <IconMin /> : <IconMax />}
                </button>
                <button style={iconBtnStyle} title={t.clearInput} onClick={() => setInput('')}><IconTrash /></button>
              </div>
            </div>
            <textarea style={taStyle} placeholder={t.phInput} value={input} onChange={e => setInput(e.target.value)} />
          </div>
        )}
        {/* Output */}
        {maximized !== 'in' && (
          <div style={panelStyle}>
            <div style={headerStyle}>
              <span>{t.panelOutput}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button style={iconBtnStyle} onClick={() => setMaximized(maximized === 'out' ? null : 'out')}>
                  {maximized === 'out' ? <IconMin /> : <IconMax />}
                </button>
                <button style={iconBtnStyle} title={t.clearOutput} onClick={() => setOutput('')}><IconTrash /></button>
              </div>
            </div>
            <textarea style={taStyle} placeholder={t.phOutput} value={output} readOnly />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          {[
            { label: t.btnFormat, fn: format },
            { label: t.btnMinify, fn: minify },
            { label: t.btnValidate, fn: validate },
          ].map(({ label, fn }) => (
            <button key={label} style={actionBtn} onClick={fn}>{label}</button>
          ))}
          <button
            style={{ ...actionBtn, opacity: canUnescape ? 1 : 0.5, cursor: canUnescape ? 'pointer' : 'not-allowed',
              ...(canUnescape ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' } : {}) }}
            onClick={canUnescape ? unescape : undefined}
          >
            {t.btnUnescape}
          </button>
          <button style={actionBtn} onClick={escape}>{t.btnEscape}</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={actionBtn} onClick={copy}>{t.btnCopy}</button>
          <button style={actionBtn} onClick={tree}>{t.btnTree}</button>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <p style={{ fontSize: '0.85rem', color: msgOk ? '#16a34a' : '#ef4444', margin: 0 }}>{msg}</p>
      )}

      {/* Tree modal */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5vh' }}
        >
          <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '24px', width: '65%', maxWidth: '860px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)' }}>{t.panelTree}</h3>
              <button onClick={() => setShowModal(false)} style={{ ...iconBtnStyle, fontSize: '1.3rem', opacity: 0.6 }}>×</button>
            </div>
            <div style={{ fontFamily: "'SF Mono', Consolas, monospace", fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text)' }}>
              {buildTree(treeObj)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
