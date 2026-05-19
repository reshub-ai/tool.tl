import { useState, useRef } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

type Base = 'hex' | 'dec' | 'bin';

const i18n: Record<string, Record<string, string>> = {
  en: {
    from_base: 'From', to_base: 'To',
    hex: 'Hexadecimal (HEX)', dec: 'Decimal (DEC)', bin: 'Binary (BIN)',
    opt_upper: 'Uppercase HEX', opt_group: 'Group binary (4 bits)',
    btn_convert: 'Convert', btn_sample: 'Sample', btn_clear: 'Clear', btn_copy: 'Copy', btn_swap: '⇄',
    panel_input: 'Input', panel_output: 'Output',
    input_ph: 'Enter a number…', output_ph: 'Result',
    msg_copied: 'Copied!',
    err_not_dec: 'Invalid decimal number', err_not_hex: 'Invalid hexadecimal number',
    err_not_bin: 'Invalid binary number', err_empty: 'Input is empty',
  },
  'zh-CN': {
    from_base: '源进制', to_base: '目标进制',
    hex: '十六进制 (HEX)', dec: '十进制 (DEC)', bin: '二进制 (BIN)',
    opt_upper: '十六进制大写', opt_group: '二进制分组（每 4 位）',
    btn_convert: '转换', btn_sample: '示例', btn_clear: '清空', btn_copy: '复制', btn_swap: '⇄',
    panel_input: '输入', panel_output: '输出',
    input_ph: '输入数字…', output_ph: '结果',
    msg_copied: '已复制！',
    err_not_dec: '无效的十进制数字', err_not_hex: '无效的十六进制数字',
    err_not_bin: '无效的二进制数字', err_empty: '请输入数字',
  },
  'zh-TW': {
    from_base: '來源進制', to_base: '目標進制',
    hex: '十六進位 (HEX)', dec: '十進位 (DEC)', bin: '二進位 (BIN)',
    opt_upper: '十六進位大寫', opt_group: '二進位分組（每 4 位）',
    btn_convert: '轉換', btn_sample: '範例', btn_clear: '清除', btn_copy: '複製', btn_swap: '⇄',
    panel_input: '輸入', panel_output: '輸出',
    input_ph: '輸入數字…', output_ph: '結果',
    msg_copied: '已複製！',
    err_not_dec: '無效的十進位數字', err_not_hex: '無效的十六進位數字',
    err_not_bin: '無效的二進位數字', err_empty: '請輸入數字',
  },
  ja: {
    from_base: '変換元', to_base: '変換先',
    hex: '16進数 (HEX)', dec: '10進数 (DEC)', bin: '2進数 (BIN)',
    opt_upper: 'HEX 大文字', opt_group: '2進数グループ（4ビット毎）',
    btn_convert: '変換', btn_sample: 'サンプル', btn_clear: 'クリア', btn_copy: 'コピー', btn_swap: '⇄',
    panel_input: '入力', panel_output: '出力',
    input_ph: '数値を入力…', output_ph: '結果',
    msg_copied: 'コピー済み！',
    err_not_dec: '無効な10進数', err_not_hex: '無効な16進数',
    err_not_bin: '無効な2進数', err_empty: '数値を入力してください',
  },
};

function normalizeInput(str: string, base: Base): string {
  let s = (str || '').trim().replace(/_/g, '').replace(/\s+/g, '');
  if (base === 'hex') s = s.replace(/^0x/i, '');
  if (base === 'bin') s = s.replace(/^0b/i, '');
  return s;
}

function toBigInt(val: string, base: Base, t: Record<string, string>): bigint {
  if (val === '') throw new Error(t.err_empty);
  if (base === 'dec') {
    if (!/^[+-]?\d+$/.test(val)) throw new Error(t.err_not_dec);
    return BigInt(val);
  }
  if (base === 'hex') {
    if (!/^[0-9a-fA-F]+$/.test(val)) throw new Error(t.err_not_hex);
    return BigInt('0x' + val);
  }
  if (base === 'bin') {
    if (!/^[01]+$/.test(val)) throw new Error(t.err_not_bin);
    return BigInt('0b' + val);
  }
  throw new Error(t.err_empty);
}

function fromBigInt(n: bigint, base: Base, upper: boolean, group: boolean): string {
  if (base === 'dec') return n.toString(10);
  if (base === 'hex') {
    const s = n.toString(16);
    return upper ? s.toUpperCase() : s.toLowerCase();
  }
  if (base === 'bin') {
    let s = n.toString(2);
    if (group) s = s.replace(/(.{4})(?!$)/g, '$1 ');
    return s;
  }
  return '';
}

const SAMPLES: Array<[Base, Base, string]> = [
  ['dec', 'hex', '2025'],
  ['hex', 'dec', '0x7B'],
  ['bin', 'dec', '0b1111_0000'],
  ['hex', 'bin', '0xDEAD'],
];

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '16px',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '160px',
  padding: '10px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-card-bg)',
  color: 'var(--color-text)',
  fontFamily: 'monospace',
  fontSize: '0.9rem',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '160px',
  padding: '6px 8px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-card-bg)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
};

const pillStyle: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-card-bg)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'background 0.15s, color 0.15s',
};

const primaryPillStyle: React.CSSProperties = {
  ...pillStyle,
  background: 'var(--color-primary)',
  color: '#fff',
  border: '1px solid var(--color-primary)',
};

export default function BaseConverterTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [from, setFrom] = useState<Base>('dec');
  const [to, setTo] = useState<Base>('hex');
  const [upper, setUpper] = useState(false);
  const [group, setGroup] = useState(true);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const sampleIdx = useRef(0);

  const convert = (val = input, fromBase = from, toBase = to) => {
    setError('');
    try {
      const normalized = normalizeInput(val, fromBase);
      const n = toBigInt(normalized, fromBase, t);
      setOutput(fromBigInt(n, toBase, upper, group));
      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setOutput('');
      setError(e.message);
    }
  };

  const handleSwap = () => {
    const newFrom = to;
    const newTo = from;
    setFrom(newFrom);
    setTo(newTo);
    convert(input, newFrom, newTo);
  };

  const handleSample = () => {
    const [sf, st, val] = SAMPLES[sampleIdx.current % SAMPLES.length];
    sampleIdx.current += 1;
    setFrom(sf);
    setTo(st);
    setInput(val);
    convert(val, sf, st);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    convert();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
      {/* Input panel */}
      <form onSubmit={handleConvert} style={cardStyle}>
        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
          {t.panel_input}
        </div>

        {/* From / swap / To row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', minWidth: '60px' }}>{t.from_base}</span>
          <select value={from} onChange={(e) => setFrom(e.target.value as Base)} style={selectStyle}>
            <option value="hex">{t.hex}</option>
            <option value="dec">{t.dec}</option>
            <option value="bin">{t.bin}</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', minWidth: '60px' }}>{t.to_base}</span>
          <select value={to} onChange={(e) => setTo(e.target.value as Base)} style={selectStyle}>
            <option value="hex">{t.hex}</option>
            <option value="dec">{t.dec}</option>
            <option value="bin">{t.bin}</option>
          </select>
          <button type="button" onClick={handleSwap} style={pillStyle} title="Swap">
            {t.btn_swap}
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} />
            {t.opt_upper}
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text)', cursor: 'pointer' }}>
            <input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} />
            {t.opt_group}
          </label>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.input_ph}
          style={textareaStyle}
        />

        {error && (
          <p style={{ margin: '6px 0 0', color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button type="submit" style={primaryPillStyle}>{t.btn_convert}</button>
          <button type="button" onClick={handleSample} style={pillStyle}>{t.btn_sample}</button>
          <button type="button" onClick={() => { setInput(''); setError(''); }} style={pillStyle}>{t.btn_clear}</button>
        </div>
      </form>

      {/* Output panel */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
          {t.panel_output}
        </div>

        <textarea
          readOnly
          value={output}
          placeholder={t.output_ph}
          style={textareaStyle}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', position: 'relative' }}>
          <button type="button" onClick={handleCopy} style={pillStyle}>{t.btn_copy}</button>
          <button type="button" onClick={() => setOutput('')} style={pillStyle}>{t.btn_clear}</button>
          {copied && (
            <span style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: 0,
              background: '#16a34a',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              padding: '3px 10px',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              {t.msg_copied}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
