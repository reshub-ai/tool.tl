import { useState } from 'react';

interface Props { slug: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    input_label: 'Input',
    mode_ascii: 'ASCII Text', mode_hex: 'HEX Bytes',
    hint_ascii: 'Each character\'s ASCII byte value is used',
    hint_hex: 'Space-separated hex bytes, e.g. 01 02 FF A3',
    btn_calc: 'Calculate', btn_sample: 'Sample', btn_clear: 'Clear', btn_copy: 'Copy',
    results: 'Results', bytes_parsed: 'Bytes',
    hi: 'Hi', lo: 'Lo', be: 'Big-End', le: 'Little-End',
    err_empty: 'Input is empty',
    err_hex: 'Invalid HEX — each byte must be two hex digits (00–FF)',
    copied: 'Copied!',
  },
  'zh-CN': {
    input_label: '输入',
    mode_ascii: 'ASCII 文本', mode_hex: '十六进制字节',
    hint_ascii: '使用每个字符的 ASCII 字节值',
    hint_hex: '用空格分隔十六进制字节，如 01 02 FF A3',
    btn_calc: '计算', btn_sample: '示例', btn_clear: '清空', btn_copy: '复制',
    results: '结果', bytes_parsed: '字节数',
    hi: '高字节', lo: '低字节', be: '大端序', le: '小端序',
    err_empty: '请输入内容',
    err_hex: '十六进制格式错误，每个字节必须是两位十六进制（00–FF）',
    copied: '已复制！',
  },
  'zh-TW': {
    input_label: '輸入',
    mode_ascii: 'ASCII 文字', mode_hex: '十六進位位元組',
    hint_ascii: '使用每個字元的 ASCII 位元組值',
    hint_hex: '用空格分隔十六進位位元組，如 01 02 FF A3',
    btn_calc: '計算', btn_sample: '範例', btn_clear: '清除', btn_copy: '複製',
    results: '結果', bytes_parsed: '位元組數',
    hi: '高位元組', lo: '低位元組', be: '大端序', le: '小端序',
    err_empty: '請輸入內容',
    err_hex: '十六進位格式錯誤，每個位元組必須是兩位十六進位（00–FF）',
    copied: '已複製！',
  },
  ja: {
    input_label: '入力',
    mode_ascii: 'ASCIIテキスト', mode_hex: 'HEXバイト',
    hint_ascii: '各文字のASCIIバイト値を使用',
    hint_hex: 'スペース区切りの16進バイト、例: 01 02 FF A3',
    btn_calc: '計算', btn_sample: 'サンプル', btn_clear: 'クリア', btn_copy: 'コピー',
    results: '結果', bytes_parsed: 'バイト数',
    hi: '上位', lo: '下位', be: 'ビッグエンド', le: 'リトルエンド',
    err_empty: '入力してください',
    err_hex: '無効なHEX — 各バイトは2桁の16進数（00〜FF）',
    copied: 'コピー済み！',
  },
};

// -------- CRC engine --------
interface CrcDef {
  name: string;
  width: number;
  poly: number;
  init: number;
  refIn: boolean;
  refOut: boolean;
  xorOut: number;
}

const CRC_TABLE: CrcDef[] = [
  { name: 'CRC-8',            width: 8,  poly: 0x07,     init: 0x00,   refIn: false, refOut: false, xorOut: 0x00 },
  { name: 'CRC-8/MAXIM',      width: 8,  poly: 0x31,     init: 0x00,   refIn: true,  refOut: true,  xorOut: 0x00 },
  { name: 'CRC-16/IBM',       width: 16, poly: 0x8005,   init: 0x0000, refIn: true,  refOut: true,  xorOut: 0x0000 },
  { name: 'CRC-16/MAXIM',     width: 16, poly: 0x8005,   init: 0x0000, refIn: true,  refOut: true,  xorOut: 0xFFFF },
  { name: 'CRC-16/USB',       width: 16, poly: 0x8005,   init: 0xFFFF, refIn: true,  refOut: true,  xorOut: 0xFFFF },
  { name: 'CRC-16/MODBUS',    width: 16, poly: 0x8005,   init: 0xFFFF, refIn: true,  refOut: true,  xorOut: 0x0000 },
  { name: 'CRC-16/CCITT-0',   width: 16, poly: 0x1021,   init: 0x0000, refIn: false, refOut: false, xorOut: 0x0000 },
  { name: 'CRC-16/CCITT-FALSE', width: 16, poly: 0x1021, init: 0xFFFF, refIn: false, refOut: false, xorOut: 0x0000 },
  { name: 'CRC-16/XMODEM',    width: 16, poly: 0x1021,   init: 0x0000, refIn: false, refOut: false, xorOut: 0x0000 },
  { name: 'CRC-16/KERMIT',    width: 16, poly: 0x1021,   init: 0x0000, refIn: true,  refOut: true,  xorOut: 0x0000 },
  { name: 'CRC-16/DNP',       width: 16, poly: 0x3D65,   init: 0x0000, refIn: true,  refOut: true,  xorOut: 0xFFFF },
  { name: 'CRC-16/EN-13757',  width: 16, poly: 0x3D65,   init: 0x0000, refIn: false, refOut: false, xorOut: 0xFFFF },
  { name: 'CRC-16/BUYPASS',   width: 16, poly: 0x8005,   init: 0x0000, refIn: false, refOut: false, xorOut: 0x0000 },
  { name: 'CRC-16/DDS-110',   width: 16, poly: 0x8005,   init: 0x800D, refIn: false, refOut: false, xorOut: 0x0000 },
  { name: 'CRC-32',           width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refIn: true, refOut: true, xorOut: 0xFFFFFFFF },
  { name: 'CRC-32/MPEG-2',    width: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refIn: false, refOut: false, xorOut: 0x00000000 },
];

function reflect(val: number, bits: number): number {
  let r = 0;
  for (let i = 0; i < bits; i++) {
    if (val & (1 << i)) r |= (1 << (bits - 1 - i));
  }
  return r >>> 0;
}

function calcCrc(def: CrcDef, bytes: number[]): number {
  const mask = def.width === 8 ? 0xFF : def.width === 16 ? 0xFFFF : 0xFFFFFFFF;
  let crc = def.init & mask;
  const topBit = 1 << (def.width - 1);
  for (let byte of bytes) {
    if (def.refIn) byte = reflect(byte, 8);
    crc ^= (byte << (def.width - 8));
    for (let i = 0; i < 8; i++) {
      crc = (crc & topBit) ? (((crc << 1) ^ def.poly) & mask) : ((crc << 1) & mask);
    }
  }
  if (def.refOut) crc = reflect(crc, def.width);
  return (crc ^ def.xorOut) & mask;
}

function checksum(bytes: number[], bits: 8 | 16): number {
  const mask = bits === 8 ? 0xFF : 0xFFFF;
  return bytes.reduce((a, b) => (a + b) & mask, 0);
}

// -------- UI --------
function hex(n: number, w: number) { return n.toString(16).toUpperCase().padStart(w, '0'); }

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
  borderRadius: '12px', padding: '16px',
};
const pillStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: '10px', border: '1px solid var(--color-border)',
  background: 'var(--color-card-bg)', color: 'var(--color-text)',
  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
};
const primaryPill: React.CSSProperties = { ...pillStyle, background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' };
const monoVal: React.CSSProperties = { fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' };

type ResultRow = { name: string; val: number; width: number };

export default function CrcCalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [mode, setMode] = useState<'ascii' | 'hex'>('hex');
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [byteCount, setByteCount] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const parseBytes = (): number[] => {
    if (mode === 'ascii') return Array.from(input).map(c => c.charCodeAt(0) & 0xFF);
    const tokens = input.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    return tokens.map(tok => {
      const v = parseInt(tok, 16);
      if (isNaN(v) || v < 0 || v > 255 || tok.length > 2) throw new Error(t.err_hex);
      return v;
    });
  };

  const calculate = () => {
    setError('');
    if (!input.trim()) { setError(t.err_empty); return; }
    try {
      const bytes = parseBytes();
      const result: ResultRow[] = CRC_TABLE.map(d => ({ name: d.name, val: calcCrc(d, bytes), width: d.width }));
      result.push({ name: 'Checksum-8', val: checksum(bytes, 8), width: 8 });
      result.push({ name: 'Checksum-16', val: checksum(bytes, 16), width: 16 });
      setRows(result);
      setByteCount(bytes.length);
      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setError(e.message);
      setRows([]);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 1200); });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          {(['ascii', 'hex'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setRows([]); setError(''); }}
              style={mode === m ? primaryPill : pillStyle}>
              {m === 'ascii' ? t.mode_ascii : t.mode_hex}
            </button>
          ))}
        </div>
        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          {mode === 'ascii' ? t.hint_ascii : t.hint_hex}
        </p>
        <textarea value={input} onChange={e => { setInput(e.target.value); setRows([]); setError(''); }} rows={3}
          placeholder={mode === 'ascii' ? 'Hello World' : '01 03 00 00 00 0A'}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-card-bg)', color: 'var(--color-text)', fontFamily: 'monospace', fontSize: '0.9rem', resize: 'vertical' }} />
        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '6px 0 0' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button type="button" onClick={calculate} style={primaryPill}>{t.btn_calc}</button>
          <button type="button" onClick={() => { setInput(mode === 'ascii' ? 'Hello World' : '01 03 00 00 00 0A'); setRows([]); }} style={pillStyle}>{t.btn_sample}</button>
          <button type="button" onClick={() => { setInput(''); setRows([]); setError(''); }} style={pillStyle}>{t.btn_clear}</button>
        </div>
      </div>

      {rows.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.results}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.bytes_parsed}: {byteCount}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {['Algorithm', 'HEX', t.be, t.le, t.hi, t.lo, ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const hw = row.width === 32 ? 4 : row.width === 16 ? 2 : 1;
                  const hexVal = hex(row.val, hw * 2);
                  const byteArr = hexVal.match(/.{2}/g) || [];
                  const beStr = byteArr.join(' ');
                  const leStr = [...byteArr].reverse().join(' ');
                  const hiStr = byteArr[0] || '';
                  const loStr = byteArr[byteArr.length - 1] || '';
                  const key = row.name;
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '7px 10px', color: 'var(--color-text)', whiteSpace: 'nowrap', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ padding: '7px 10px' }}><span style={monoVal}>0x{hexVal}</span></td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text)' }}>{beStr}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text)' }}>{leStr}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{hiStr}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{loStr}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <button type="button" onClick={() => copy(`0x${hexVal}`, key)}
                          style={{ ...pillStyle, padding: '2px 8px', fontSize: '0.75rem' }}>
                          {copied === key ? t.copied : t.btn_copy}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
