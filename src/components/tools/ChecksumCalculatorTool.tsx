import { useState } from 'react';

interface Props {
  slug: string;
  locale: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    input_label: 'Input',
    mode_ascii: 'ASCII Text',
    mode_hex: 'HEX Bytes',
    mode_hint_ascii: 'Enter any text — each character\'s ASCII value is used',
    mode_hint_hex: 'Enter hex bytes separated by spaces (e.g. 01 02 FF A3)',
    btn_calc: 'Calculate',
    btn_sample: 'Sample',
    btn_clear: 'Clear',
    btn_copy: 'Copy',
    results: 'Results',
    crc16_modbus: 'CRC16 / MODBUS',
    crc16_ccitt: 'CRC16 / CCITT (XModem)',
    crc16_ibm: 'CRC16 / IBM',
    sum8: 'Checksum 8-bit (累加和)',
    sum16: 'Checksum 16-bit (累加和)',
    hi: 'Hi',
    lo: 'Lo',
    be: 'Big-Endian',
    le: 'Little-Endian',
    bytes_parsed: 'Bytes parsed',
    err_empty: 'Input is empty',
    err_hex: 'Invalid HEX — each byte must be two hex digits (00–FF)',
    copied: 'Copied!',
  },
  'zh-CN': {
    input_label: '输入',
    mode_ascii: 'ASCII 文本',
    mode_hex: '十六进制字节',
    mode_hint_ascii: '输入任意文本，使用每个字符的 ASCII 值',
    mode_hint_hex: '输入十六进制字节，用空格分隔（如 01 02 FF A3）',
    btn_calc: '计算',
    btn_sample: '示例',
    btn_clear: '清空',
    btn_copy: '复制',
    results: '结果',
    crc16_modbus: 'CRC16 / MODBUS',
    crc16_ccitt: 'CRC16 / CCITT (XModem)',
    crc16_ibm: 'CRC16 / IBM',
    sum8: '8位校验和（累加和）',
    sum16: '16位校验和（累加和）',
    hi: '高字节',
    lo: '低字节',
    be: '大端序',
    le: '小端序',
    bytes_parsed: '解析字节数',
    err_empty: '请输入内容',
    err_hex: '十六进制格式错误，每个字节必须是两位十六进制（00–FF）',
    copied: '已复制！',
  },
  'zh-TW': {
    input_label: '輸入',
    mode_ascii: 'ASCII 文字',
    mode_hex: '十六進位位元組',
    mode_hint_ascii: '輸入任意文字，使用每個字元的 ASCII 值',
    mode_hint_hex: '輸入十六進位位元組，用空格分隔（如 01 02 FF A3）',
    btn_calc: '計算',
    btn_sample: '範例',
    btn_clear: '清除',
    btn_copy: '複製',
    results: '結果',
    crc16_modbus: 'CRC16 / MODBUS',
    crc16_ccitt: 'CRC16 / CCITT (XModem)',
    crc16_ibm: 'CRC16 / IBM',
    sum8: '8位元校驗和（累加和）',
    sum16: '16位元校驗和（累加和）',
    hi: '高位元組',
    lo: '低位元組',
    be: '大端序',
    le: '小端序',
    bytes_parsed: '解析位元組數',
    err_empty: '請輸入內容',
    err_hex: '十六進位格式錯誤，每個位元組必須是兩位十六進位（00–FF）',
    copied: '已複製！',
  },
  ja: {
    input_label: '入力',
    mode_ascii: 'ASCIIテキスト',
    mode_hex: 'HEXバイト',
    mode_hint_ascii: '任意のテキストを入力 — 各文字のASCII値を使用',
    mode_hint_hex: '16進数バイトをスペース区切りで入力（例: 01 02 FF A3）',
    btn_calc: '計算',
    btn_sample: 'サンプル',
    btn_clear: 'クリア',
    btn_copy: 'コピー',
    results: '結果',
    crc16_modbus: 'CRC16 / MODBUS',
    crc16_ccitt: 'CRC16 / CCITT (XModem)',
    crc16_ibm: 'CRC16 / IBM',
    sum8: '8ビットチェックサム（累加和）',
    sum16: '16ビットチェックサム（累加和）',
    hi: '上位バイト',
    lo: '下位バイト',
    be: 'ビッグエンディアン',
    le: 'リトルエンディアン',
    bytes_parsed: '解析バイト数',
    err_empty: '入力してください',
    err_hex: '無効なHEX — 各バイトは2桁の16進数（00〜FF）',
    copied: 'コピー済み！',
  },
};

function crc16Modbus(bytes: number[]): number {
  let crc = 0xFFFF;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1);
    }
  }
  return crc & 0xFFFF;
}

function crc16Ccitt(bytes: number[]): number {
  let crc = 0x0000;
  for (const b of bytes) {
    crc ^= (b << 8);
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
    }
  }
  return crc;
}

function crc16Ibm(bytes: number[]): number {
  let crc = 0x0000;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xA001) : (crc >>> 1);
    }
  }
  return crc & 0xFFFF;
}

function hex2(n: number) { return n.toString(16).toUpperCase().padStart(2, '0'); }
function hex4(n: number) { return n.toString(16).toUpperCase().padStart(4, '0'); }

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '16px',
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
};

const primaryPillStyle: React.CSSProperties = {
  ...pillStyle,
  background: 'var(--color-primary)',
  color: '#fff',
  border: '1px solid var(--color-primary)',
};

const monoVal: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--color-primary)',
  letterSpacing: '0.05em',
};

interface Result16 { val: number; hi: number; lo: number }
interface Results {
  modbus: Result16;
  ccitt: Result16;
  ibm: Result16;
  sum8: number;
  sum16: Result16;
  byteCount: number;
}

function makeResult16(val: number): Result16 {
  return { val, hi: (val >> 8) & 0xFF, lo: val & 0xFF };
}

export default function ChecksumCalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [mode, setMode] = useState<'ascii' | 'hex'>('ascii');
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const parseBytes = (): number[] => {
    if (mode === 'ascii') {
      return Array.from(input).map(c => c.charCodeAt(0) & 0xFF);
    } else {
      const tokens = input.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
      return tokens.map(tok => {
        const v = parseInt(tok, 16);
        if (isNaN(v) || v < 0 || v > 255 || tok.length > 2) throw new Error(t.err_hex);
        return v;
      });
    }
  };

  const calculate = () => {
    setError('');
    if (!input.trim()) { setError(t.err_empty); return; }
    try {
      const bytes = parseBytes();
      const sum = bytes.reduce((a, b) => a + b, 0);
      setResults({
        modbus: makeResult16(crc16Modbus(bytes)),
        ccitt:  makeResult16(crc16Ccitt(bytes)),
        ibm:    makeResult16(crc16Ibm(bytes)),
        sum8:   sum & 0xFF,
        sum16:  makeResult16(sum & 0xFFFF),
        byteCount: bytes.length,
      });
      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setError(e.message);
      setResults(null);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    });
  };

  const loadSample = () => {
    if (mode === 'ascii') {
      setInput('Hello');
    } else {
      setInput('01 03 00 00 00 0A');
    }
    setResults(null);
    setError('');
  };

  const Row16 = ({ label, r, id }: { label: string; r: Result16; id: string }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ minWidth: '220px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={monoVal}>0x{hex4(r.val)}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
        {t.be}: {hex2(r.hi)} {hex2(r.lo)} &nbsp;|&nbsp; {t.le}: {hex2(r.lo)} {hex2(r.hi)}
      </span>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
        {t.hi}: 0x{hex2(r.hi)} &nbsp; {t.lo}: 0x{hex2(r.lo)}
      </span>
      <button
        type="button"
        onClick={() => copyText(`0x${hex4(r.val)}`, id)}
        style={{ ...pillStyle, padding: '3px 10px', fontSize: '0.78rem', marginLeft: 'auto' }}
      >
        {copied === id ? t.copied : t.btn_copy}
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Input card */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>{t.input_label}</div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {(['ascii', 'hex'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setResults(null); setError(''); }}
              style={mode === m ? primaryPillStyle : pillStyle}
            >
              {m === 'ascii' ? t.mode_ascii : t.mode_hex}
            </button>
          ))}
        </div>

        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          {mode === 'ascii' ? t.mode_hint_ascii : t.mode_hint_hex}
        </p>

        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setResults(null); setError(''); }}
          rows={4}
          placeholder={mode === 'ascii' ? 'Hello' : '01 03 00 00 00 0A'}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px',
            border: '1px solid var(--color-border)', borderRadius: '8px',
            background: 'var(--color-card-bg)', color: 'var(--color-text)',
            fontFamily: 'monospace', fontSize: '0.9rem', resize: 'vertical',
          }}
        />

        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '6px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button type="button" onClick={calculate} style={primaryPillStyle}>{t.btn_calc}</button>
          <button type="button" onClick={loadSample} style={pillStyle}>{t.btn_sample}</button>
          <button type="button" onClick={() => { setInput(''); setResults(null); setError(''); }} style={pillStyle}>{t.btn_clear}</button>
        </div>
      </div>

      {/* Results card */}
      {results && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>{t.results}</div>
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            {t.bytes_parsed}: {results.byteCount}
          </p>

          <Row16 label={t.crc16_modbus} r={results.modbus} id="modbus" />
          <Row16 label={t.crc16_ccitt}  r={results.ccitt}  id="ccitt"  />
          <Row16 label={t.crc16_ibm}    r={results.ibm}    id="ibm"    />

          {/* 8-bit checksum */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ minWidth: '220px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{t.sum8}</span>
            <span style={monoVal}>0x{hex2(results.sum8)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>dec: {results.sum8}</span>
            <button type="button" onClick={() => copyText(`0x${hex2(results.sum8)}`, 'sum8')}
              style={{ ...pillStyle, padding: '3px 10px', fontSize: '0.78rem', marginLeft: 'auto' }}>
              {copied === 'sum8' ? t.copied : t.btn_copy}
            </button>
          </div>

          {/* 16-bit checksum */}
          <Row16 label={t.sum16} r={results.sum16} id="sum16" />
        </div>
      )}
    </div>
  );
}
