import { useState, useCallback, useEffect } from 'react';

/* ─── UUID Generator ──────────────────────────────── */

const uuidI18n: Record<string, Record<string, string>> = {
  en:    { generate: 'Generate', count: 'Count', copyAll: 'Copy All', copy: 'Copy', copied: 'Copied!' },
  'zh-CN': { generate: '生成', count: '数量', copyAll: '复制全部', copy: '复制', copied: '已复制！' },
  'zh-TW': { generate: '產生', count: '數量', copyAll: '複製全部', copy: '複製', copied: '已複製！' },
  ja:    { generate: '生成', count: '件数', copyAll: 'すべてコピー', copy: 'コピー', copied: 'コピー済み！' },
};

function generateV7(): string {
  const ts = Date.now();
  const hex = ts.toString(16).padStart(12, '0');
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${rand.slice(0, 3)}-${(0x80 | (parseInt(rand.slice(3, 5), 16) & 0x3f)).toString(16)}${rand.slice(5, 7)}-${rand.slice(7, 19)}`;
}

function UuidGeneratorUI({ slug, locale }: { slug: string; locale: string }) {
  const t = uuidI18n[locale] || uuidI18n.en;
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback((ver = version, cnt = count) => {
    const results = Array.from({ length: Math.min(cnt, 100) }, () =>
      ver === 'v7' ? generateV7() : crypto.randomUUID()
    );
    setUuids(results);
    (window as any).__trackToolUsed?.(slug);
  }, [version, count, slug]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchVersion = (v: 'v4' | 'v7') => {
    setVersion(v);
    generate(v, count);
  };

  const copyOne = async (uuid: string, i: number) => {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const segBtn = (active: boolean) => ({
    padding: '0.45rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 500 as const,
    cursor: 'pointer' as const,
    border: 'none',
    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-card-bg)',
    color: active ? '#fff' : 'var(--color-text)',
    transition: 'background 0.15s',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {/* Version toggle */}
        <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <button onClick={() => switchVersion('v4')} style={segBtn(version === 'v4')}>UUID v4</button>
          <button onClick={() => switchVersion('v7')} style={{ ...segBtn(version === 'v7'), borderLeft: '1px solid var(--color-border)' }}>UUID v7</button>
        </div>

        {/* Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{t.count}</label>
          <input
            type="number" value={count} min={1} max={100}
            onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
            style={{ width: '64px', padding: '0.45rem 0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.85rem', textAlign: 'center' as const }}
          />
        </div>

        <button onClick={() => generate()} style={{ padding: '0.45rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 as const }}>
          {t.generate}
        </button>

        {uuids.length > 0 && (
          <button onClick={copyAll} style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
            {copiedAll ? t.copied : t.copyAll}
          </button>
        )}
      </div>

      {uuids.length > 0 && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          {uuids.map((uuid, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', borderBottom: i < uuids.length - 1 ? '1px solid var(--color-border)' : undefined }}>
              <code style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text)', letterSpacing: '0.02em' }}>{uuid}</code>
              <button onClick={() => copyOne(uuid, i)} style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                {copiedIndex === i ? t.copied : t.copy}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
  component: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: { input: 'Input', output: 'Output', copy: 'Copy', copied: 'Copied!', clear: 'Clear', swap: 'Swap' },
  'zh-CN': { input: '输入', output: '输出', copy: '复制', copied: '已复制！', clear: '清空', swap: '交换' },
  'zh-TW': { input: '輸入', output: '輸出', copy: '複製', copied: '已複製！', clear: '清空', swap: '交換' },
  ja: { input: '入力', output: '出力', copy: 'コピー', copied: 'コピー済み！', clear: 'クリア', swap: '入替' },
};

export default function TextProcessTool({ slug, locale, component }: Props) {
  if (component === 'UuidGenerator') return <UuidGeneratorUI slug={slug} locale={locale} />;

  const t = i18n[locale] || i18n.en;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const toolConfig = getToolConfig(component);

  const process = useCallback(
    (action?: string) => {
      setError('');
      try {
        const result = toolConfig.process(input, action);
        setOutput(result);
        if (result) (window as any).__trackToolUsed?.(slug);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [input, toolConfig]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const swap = () => {
    setInput(output);
    setOutput('');
  };

  const btnStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer' as const,
    fontSize: '0.85rem',
    fontWeight: 500,
  };

  const primaryBtn = {
    ...btnStyle,
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '180px',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    resize: 'vertical' as const,
  };

  return (
    <div className="tool-text-area">
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {toolConfig.actions.map((action) => (
          <button key={action.key} onClick={() => process(action.key)} style={action.primary ? primaryBtn : btnStyle}>
            {action.labels[locale] || action.labels.en}
          </button>
        ))}
        <button onClick={copy} style={btnStyle}>{copied ? t.copied : t.copy}</button>
        {!toolConfig.hideSwap && <button onClick={swap} style={btnStyle}>{t.swap}</button>}
        <button onClick={clear} style={btnStyle}>{t.clear}</button>
      </div>

      {/* Two-panel layout */}
      <div className="tl-auto-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {t.input}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolConfig.placeholder?.[locale] || toolConfig.placeholder?.en || ''}
            style={textareaStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {t.output}
          </label>
          <textarea value={output} readOnly style={textareaStyle} />
        </div>
      </div>

      {error && <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
    </div>
  );
}

/* ─── Tool-specific logic ───────────────────────────────────── */

interface ActionDef {
  key: string;
  labels: Record<string, string>;
  primary?: boolean;
}

interface ToolConfig {
  actions: ActionDef[];
  process: (input: string, action?: string) => string;
  placeholder?: Record<string, string>;
  hideSwap?: boolean;
}

function getToolConfig(component: string): ToolConfig {
  switch (component) {
    case 'JsonFormatter':
      return {
        actions: [
          { key: 'format', labels: { en: 'Format', 'zh-CN': '格式化', 'zh-TW': '格式化', ja: '整形' }, primary: true },
          { key: 'minify', labels: { en: 'Minify', 'zh-CN': '压缩', 'zh-TW': '壓縮', ja: '圧縮' } },
          { key: 'validate', labels: { en: 'Validate', 'zh-CN': '验证', 'zh-TW': '驗證', ja: '検証' } },
        ],
        process: (input, action) => {
          if (action === 'validate') {
            try { JSON.parse(input); return 'Valid JSON'; } catch (e: any) { return `Invalid: ${e.message}`; }
          }
          const obj = JSON.parse(input);
          return action === 'minify' ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
        },
        placeholder: { en: '{"key": "value"}', 'zh-CN': '{"key": "value"}', 'zh-TW': '{"key": "value"}', ja: '{"key": "value"}' },
      };

    case 'JwtDebugger':
      return {
        actions: [
          { key: 'decode', labels: { en: 'Decode', 'zh-CN': '解码', 'zh-TW': '解碼', ja: 'デコード' }, primary: true },
        ],
        process: (input) => {
          const parts = input.trim().split('.');
          if (parts.length < 2) throw new Error('Invalid JWT: must have at least 2 parts');
          const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return `=== HEADER ===\n${JSON.stringify(header, null, 2)}\n\n=== PAYLOAD ===\n${JSON.stringify(payload, null, 2)}`;
        },
        placeholder: { en: 'eyJhbGciOiJIUzI1NiIs...', 'zh-CN': '粘贴JWT Token...', 'zh-TW': '貼上JWT Token...', ja: 'JWTトークンを貼り付け...' },
      };

    case 'TextCase':
      return {
        actions: [
          { key: 'upper',    labels: { en: 'UPPER',    'zh-CN': '全大写',    'zh-TW': '全大寫',    ja: '大文字' }, primary: true },
          { key: 'lower',    labels: { en: 'lower',    'zh-CN': '全小写',    'zh-TW': '全小寫',    ja: '小文字' } },
          { key: 'sentence', labels: { en: 'Sentence', 'zh-CN': '句首大写',  'zh-TW': '句首大寫',  ja: '文頭大文字' } },
          { key: 'title',    labels: { en: 'Title',    'zh-CN': '词首大写',  'zh-TW': '詞首大寫',  ja: 'タイトル' } },
          { key: 'camel',    labels: { en: 'camelCase',  'zh-CN': 'camelCase',  'zh-TW': 'camelCase',  ja: 'camelCase' } },
          { key: 'pascal',   labels: { en: 'PascalCase', 'zh-CN': 'PascalCase', 'zh-TW': 'PascalCase', ja: 'PascalCase' } },
          { key: 'snake',    labels: { en: 'snake_case', 'zh-CN': 'snake_case', 'zh-TW': 'snake_case', ja: 'snake_case' } },
          { key: 'kebab',    labels: { en: 'kebab-case', 'zh-CN': 'kebab-case', 'zh-TW': 'kebab-case', ja: 'kebab-case' } },
          { key: 'constant', labels: { en: 'CONSTANT',   'zh-CN': 'CONSTANT',   'zh-TW': 'CONSTANT',   ja: 'CONSTANT' } },
          { key: 'dot',      labels: { en: 'dot.case',   'zh-CN': 'dot.case',   'zh-TW': 'dot.case',   ja: 'dot.case' } },
          { key: 'toggle',   labels: { en: 'tOgGlE',     'zh-CN': '反转大小写', 'zh-TW': '反轉大小寫', ja: '大小文字反転' } },
        ],
        hideSwap: true,
        process: (input, action) => {
          const words = input.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-\.]+/g, ' ').split(/\s+/).filter(Boolean);
          switch (action) {
            case 'upper':    return input.toUpperCase();
            case 'lower':    return input.toLowerCase();
            case 'sentence': return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
            case 'title':    return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            case 'camel':    return words.map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
            case 'pascal':   return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
            case 'snake':    return words.map((w) => w.toLowerCase()).join('_');
            case 'kebab':    return words.map((w) => w.toLowerCase()).join('-');
            case 'constant': return words.map((w) => w.toUpperCase()).join('_');
            case 'dot':      return words.map((w) => w.toLowerCase()).join('.');
            case 'toggle':   return input.split('').map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
            default: return input;
          }
        },
      };

    case 'Base64Decoder':
      return {
        actions: [
          { key: 'decode', labels: { en: 'Decode', 'zh-CN': '解码', 'zh-TW': '解碼', ja: 'デコード' }, primary: true },
        ],
        hideSwap: true,
        process: (input) => decodeURIComponent(escape(atob(input.trim()))),
        placeholder: { en: 'SGVsbG8gV29ybGQ=', 'zh-CN': '粘贴Base64...', 'zh-TW': '貼上Base64...', ja: 'Base64を貼り付け...' },
      };

    case 'Base64Encoder':
      return {
        actions: [
          { key: 'encode', labels: { en: 'Encode', 'zh-CN': '编码', 'zh-TW': '編碼', ja: 'エンコード' }, primary: true },
        ],
        hideSwap: true,
        process: (input) => btoa(unescape(encodeURIComponent(input))),
        placeholder: { en: 'Enter text to encode…', 'zh-CN': '输入要编码的文本…', 'zh-TW': '輸入要編碼的文字…', ja: 'エンコードするテキストを入力…' },
      };

    case 'UrlDecoder':
      return {
        actions: [
          { key: 'decode', labels: { en: 'Decode', 'zh-CN': '解码', 'zh-TW': '解碼', ja: 'デコード' }, primary: true },
        ],
        hideSwap: true,
        process: (input) => decodeURIComponent(input.trim()),
        placeholder: { en: 'https%3A%2F%2Fexample.com', 'zh-CN': 'https%3A%2F%2Fexample.com', 'zh-TW': 'https%3A%2F%2Fexample.com', ja: 'https%3A%2F%2Fexample.com' },
      };

    case 'UrlEncoder':
      return {
        actions: [
          { key: 'encode', labels: { en: 'Encode', 'zh-CN': '编码', 'zh-TW': '編碼', ja: 'エンコード' }, primary: true },
        ],
        hideSwap: true,
        process: (input) => encodeURIComponent(input.trim()),
        placeholder: { en: 'https://example.com/path?query=hello world', 'zh-CN': '输入要编码的文本…', 'zh-TW': '輸入要編碼的文字…', ja: 'エンコードするテキストを入力…' },
      };

    case 'UuidGenerator':
      return {
        actions: [
          { key: 'v4', labels: { en: 'UUID v4', 'zh-CN': 'UUID v4', 'zh-TW': 'UUID v4', ja: 'UUID v4' }, primary: true },
          { key: 'v7', labels: { en: 'UUID v7', 'zh-CN': 'UUID v7', 'zh-TW': 'UUID v7', ja: 'UUID v7' } },
        ],
        process: (_input, action) => {
          const count = 5;
          const results: string[] = [];
          for (let i = 0; i < count; i++) {
            if (action === 'v7') {
              const ts = Date.now();
              const hex = ts.toString(16).padStart(12, '0');
              const rand = Array.from(crypto.getRandomValues(new Uint8Array(10)))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
              const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${rand.slice(0, 3)}-${(0x80 | (parseInt(rand.slice(3, 5), 16) & 0x3f)).toString(16)}${rand.slice(5, 7)}-${rand.slice(7, 19)}`;
              results.push(uuid);
            } else {
              results.push(crypto.randomUUID());
            }
          }
          return results.join('\n');
        },
      };

    case 'FileSizeConverter':
      return {
        actions: [
          { key: 'convert', labels: { en: 'Convert', 'zh-CN': '转换', 'zh-TW': '轉換', ja: '変換' }, primary: true },
        ],
        process: (input) => {
          const match = input.trim().match(/^([\d.]+)\s*(b|bit|byte|bytes|kb|mb|gb|tb|pb|kib|mib|gib|tib|pib)$/i);
          if (!match) throw new Error('Format: number + unit (e.g., 1024 KB)');
          const val = parseFloat(match[1]);
          const unit = match[2].toLowerCase();
          const bitsMap: Record<string, number> = { b: 1, bit: 1, byte: 8, bytes: 8, kb: 8000, mb: 8e6, gb: 8e9, tb: 8e12, pb: 8e15, kib: 8192, mib: 8388608, gib: 8589934592, tib: 8796093022208, pib: 9007199254740992 };
          const bits = val * (bitsMap[unit] || 8);
          const lines = [
            `Bits:      ${bits}`,
            `Bytes:     ${(bits / 8).toFixed(2)}`,
            `KB:        ${(bits / 8000).toFixed(4)}`,
            `MB:        ${(bits / 8e6).toFixed(6)}`,
            `GB:        ${(bits / 8e9).toFixed(8)}`,
            `TB:        ${(bits / 8e12).toFixed(10)}`,
            `KiB:       ${(bits / 8192).toFixed(4)}`,
            `MiB:       ${(bits / 8388608).toFixed(6)}`,
            `GiB:       ${(bits / 8589934592).toFixed(8)}`,
          ];
          return lines.join('\n');
        },
        placeholder: { en: '1024 KB', 'zh-CN': '1024 KB', 'zh-TW': '1024 KB', ja: '1024 KB' },
      };

    default:
      return {
        actions: [{ key: 'process', labels: { en: 'Process', 'zh-CN': '处理', 'zh-TW': '處理', ja: '処理' }, primary: true }],
        process: (input) => input,
      };
  }
}
