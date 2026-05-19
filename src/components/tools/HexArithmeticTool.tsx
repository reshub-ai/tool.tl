import { useState } from 'react';

interface Props { slug: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    a: 'Operand A (HEX)', b: 'Operand B (HEX)', op: 'Operation',
    bits: 'Result width', bits8: '8-bit', bits16: '16-bit', bits32: '32-bit', bits64: '64-bit',
    btn_calc: 'Calculate', btn_clear: 'Clear', btn_copy: 'Copy', btn_swap: 'Swap A↔B',
    result: 'Result', hex: 'HEX', dec: 'Decimal', bin: 'Binary',
    err_a: 'Invalid HEX for A', err_b: 'Invalid HEX for B', err_div0: 'Division by zero',
    overflow: 'Overflow (truncated to {bits} bits)', copied: 'Copied!',
    hint: 'Enter hexadecimal numbers without 0x prefix',
  },
  'zh-CN': {
    a: '操作数 A（十六进制）', b: '操作数 B（十六进制）', op: '运算符',
    bits: '结果位宽', bits8: '8位', bits16: '16位', bits32: '32位', bits64: '64位',
    btn_calc: '计算', btn_clear: '清空', btn_copy: '复制', btn_swap: '交换 A↔B',
    result: '结果', hex: '十六进制', dec: '十进制', bin: '二进制',
    err_a: 'A 不是有效的十六进制', err_b: 'B 不是有效的十六进制', err_div0: '除数不能为零',
    overflow: '溢出（已截断为 {bits} 位）', copied: '已复制！',
    hint: '输入十六进制数字，不需要 0x 前缀',
  },
  'zh-TW': {
    a: '運算元 A（十六進位）', b: '運算元 B（十六進位）', op: '運算子',
    bits: '結果位元寬', bits8: '8位元', bits16: '16位元', bits32: '32位元', bits64: '64位元',
    btn_calc: '計算', btn_clear: '清除', btn_copy: '複製', btn_swap: '交換 A↔B',
    result: '結果', hex: '十六進位', dec: '十進位', bin: '二進位',
    err_a: 'A 不是有效的十六進位', err_b: 'B 不是有效的十六進位', err_div0: '除數不能為零',
    overflow: '溢位（已截斷為 {bits} 位元）', copied: '已複製！',
    hint: '輸入十六進位數字，不需要 0x 前綴',
  },
  ja: {
    a: 'オペランド A（16進数）', b: 'オペランド B（16進数）', op: '演算子',
    bits: '結果ビット幅', bits8: '8ビット', bits16: '16ビット', bits32: '32ビット', bits64: '64ビット',
    btn_calc: '計算', btn_clear: 'クリア', btn_copy: 'コピー', btn_swap: 'A↔B 交換',
    result: '結果', hex: '16進数', dec: '10進数', bin: '2進数',
    err_a: 'Aは無効な16進数', err_b: 'Bは無効な16進数', err_div0: 'ゼロ除算',
    overflow: 'オーバーフロー（{bits}ビットに切り捨て）', copied: 'コピー済み！',
    hint: '0xプレフィックスなしで16進数を入力',
  },
};

const MASKS: Record<string, bigint> = {
  '8': 0xFFn, '16': 0xFFFFn, '32': 0xFFFFFFFFn, '64': 0xFFFFFFFFFFFFFFFFn,
};

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
  borderRadius: '12px', padding: '16px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 12px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-card-bg)', color: 'var(--color-text)',
  fontFamily: 'monospace', fontSize: '1rem',
};
const pillStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: '10px', border: '1px solid var(--color-border)',
  background: 'var(--color-card-bg)', color: 'var(--color-text)',
  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
};
const primaryPill: React.CSSProperties = { ...pillStyle, background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' };
const monoVal: React.CSSProperties = { fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' };

export default function HexArithmeticTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [op, setOp] = useState('+');
  const [bits, setBits] = useState('16');
  const [result, setResult] = useState<{ hex: string; dec: string; bin: string; overflow: boolean } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const parseHex = (s: string) => {
    const clean = s.trim().replace(/^0x/i, '').replace(/\s/g, '');
    if (!clean) return null;
    if (!/^[0-9a-fA-F]+$/.test(clean)) return undefined;
    return BigInt('0x' + clean);
  };

  const calculate = () => {
    setError(''); setResult(null);
    const va = parseHex(a); const vb = parseHex(b);
    if (va === undefined) { setError(t.err_a); return; }
    if (vb === undefined) { setError(t.err_b); return; }
    if (va === null || vb === null) { setError(t.err_a); return; }
    let res: bigint;
    try {
      if (op === '+') res = va + vb;
      else if (op === '-') res = va - vb;
      else if (op === '×') res = va * vb;
      else {
        if (vb === 0n) { setError(t.err_div0); return; }
        res = va / vb;
      }
    } catch { setError('Calculation error'); return; }
    const mask = MASKS[bits];
    const isNeg = res < 0n;
    const absRes = isNeg ? -res : res;
    const overflow = absRes > mask;
    const masked = isNeg ? (mask + 1n - (absRes & mask)) & mask : absRes & mask;
    setResult({
      hex: masked.toString(16).toUpperCase().padStart(Number(bits) / 4, '0'),
      dec: masked.toString(10),
      bin: masked.toString(2).padStart(Number(bits), '0'),
      overflow,
    });
    (window as any).__trackToolUsed?.(slug);
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard?.writeText('0x' + result.hex).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={cardStyle}>
        <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.hint}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>{t.a}</label>
            <input value={a} onChange={e => setA(e.target.value)} placeholder="FF0A" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <select value={op} onChange={e => setOp(e.target.value)} style={{ ...inputStyle, width: '60px', textAlign: 'center', fontSize: '1.2rem' }}>
              {['+', '-', '×', '÷'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>{t.b}</label>
            <input value={b} onChange={e => setB(e.target.value)} placeholder="0010" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.bits}:</span>
          {(['8', '16', '32', '64'] as const).map(w => (
            <button key={w} type="button" onClick={() => setBits(w)} style={bits === w ? primaryPill : pillStyle}>
              {(t as any)['bits' + w]}
            </button>
          ))}
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0 0 8px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={calculate} style={primaryPill}>{t.btn_calc}</button>
          <button type="button" onClick={() => { setA(b); setB(a); setResult(null); }} style={pillStyle}>{t.btn_swap}</button>
          <button type="button" onClick={() => { setA(''); setB(''); setResult(null); setError(''); }} style={pillStyle}>{t.btn_clear}</button>
        </div>
      </div>

      {result && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>{t.result}</div>
          {result.overflow && (
            <p style={{ color: 'var(--color-warning)', fontSize: '0.82rem', margin: '0 0 8px' }}>
              ⚠ {t.overflow.replace('{bits}', bits)}
            </p>
          )}
          {[
            { label: t.hex, val: '0x' + result.hex },
            { label: t.dec, val: result.dec },
            { label: t.bin, val: result.bin.replace(/(.{4})/g, '$1 ').trim() },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ minWidth: '80px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{row.label}</span>
              <span style={monoVal}>{row.val}</span>
            </div>
          ))}
          <div style={{ marginTop: '12px', position: 'relative' }}>
            <button type="button" onClick={copy} style={pillStyle}>{copied ? t.copied : t.btn_copy}</button>
          </div>
        </div>
      )}
    </div>
  );
}
