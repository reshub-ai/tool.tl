import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    optBase: 'Base', opt1000: 'Decimal (1 KB = 1000 B)', opt1024: 'Binary (1 KiB = 1024 B)',
    optPrec: 'Precision', btnClear: 'Clear',
    hint: 'Supports scientific notation (e.g. 1.5e9) and comma separators',
    bit: 'Bit', bytes: 'Byte', kb: 'KB', mb: 'MB', gb: 'GB', tb: 'TB',
    placeholder: 'Enter a value…',
  },
  'zh-CN': {
    optBase: '进制', opt1000: '十进制 (1 KB = 1000 B)', opt1024: '二进制 (1 KiB = 1024 B)',
    optPrec: '精度', btnClear: '清空',
    hint: '支持科学计数法（如 1.5e9）和逗号分隔符',
    bit: 'Bit', bytes: 'Byte', kb: 'KB', mb: 'MB', gb: 'GB', tb: 'TB',
    placeholder: '输入数值…',
  },
  'zh-TW': {
    optBase: '進制', opt1000: '十進位 (1 KB = 1000 B)', opt1024: '二進位 (1 KiB = 1024 B)',
    optPrec: '精度', btnClear: '清除',
    hint: '支援科學計數法（如 1.5e9）和逗號分隔符',
    bit: 'Bit', bytes: 'Byte', kb: 'KB', mb: 'MB', gb: 'GB', tb: 'TB',
    placeholder: '輸入數值…',
  },
  ja: {
    optBase: '基数', opt1000: '十進数 (1 KB = 1000 B)', opt1024: '二進数 (1 KiB = 1024 B)',
    optPrec: '精度', btnClear: 'クリア',
    hint: '科学記数法（例: 1.5e9）とカンマ区切りに対応',
    bit: 'ビット', bytes: 'バイト', kb: 'KB', mb: 'MB', gb: 'GB', tb: 'TB',
    placeholder: '値を入力…',
  },
};

const UNITS = ['bit', 'bytes', 'kb', 'mb', 'gb', 'tb'] as const;
type Unit = typeof UNITS[number];

const PRECISION_OPTIONS = [0, 1, 2, 3, 4, 6, 8, 10, 12];

function parseNum(raw: string): number {
  const s = String(raw || '').replace(/[,_\s]/g, '');
  if (!s) return NaN;
  return Number(s);
}

function fmt(n: number, prec: number): string {
  if (!isFinite(n)) return '';
  return Number(n).toPrecision(prec);
}

function toBytes(val: number, unit: Unit, base: number): number {
  switch (unit) {
    case 'bit':   return val / 8;
    case 'bytes': return val;
    case 'kb':    return val * base;
    case 'mb':    return val * base ** 2;
    case 'gb':    return val * base ** 3;
    case 'tb':    return val * base ** 4;
  }
}

function fromBytesMap(bytes: number, base: number, prec: number, skip: Unit): Record<Unit, string> {
  const calc = (unit: Unit) => unit === skip ? '' : fmt(
    unit === 'bit' ? bytes * 8 :
    unit === 'bytes' ? bytes :
    unit === 'kb' ? bytes / base :
    unit === 'mb' ? bytes / base ** 2 :
    unit === 'gb' ? bytes / base ** 3 :
    bytes / base ** 4,
    prec
  );
  return Object.fromEntries(UNITS.map(u => [u, calc(u)])) as Record<Unit, string>;
}

export default function FileSizeConverterTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [base, setBase] = useState(1000);
  const [prec, setPrec] = useState(6);
  const [vals, setVals] = useState<Record<Unit, string>>({ bit: '1', bytes: '', kb: '', mb: '', gb: '', tb: '' });
  const updating = useRef(false);

  const convert = useCallback((src: Unit, raw: string, newBase = base, newPrec = prec) => {
    if (updating.current) return;
    updating.current = true;
    const n = parseNum(raw);
    if (isFinite(n)) {
      const bytes = toBytes(n, src, newBase);
      const next = fromBytesMap(bytes, newBase, newPrec, src);
      setVals(prev => ({ ...prev, ...next, [src]: raw }));
    } else {
      setVals(prev => ({ ...prev, [src]: raw }));
    }
    updating.current = false;
  }, [base, prec]);

  const handleInput = (unit: Unit, raw: string) => {
    convert(unit, raw);
    (window as any).__trackToolUsed?.(slug);
  };

  const changeBase = (b: number) => {
    setBase(b);
    // Recalc from bytes
    const bytes = toBytes(parseNum(vals.bytes), 'bytes', b);
    if (isFinite(bytes)) {
      const next = fromBytesMap(bytes, b, prec, 'bytes');
      setVals(prev => ({ ...prev, ...next }));
    }
  };

  const changePrec = (p: number) => {
    setPrec(p);
    const n = parseNum(vals.bytes);
    if (isFinite(n)) {
      const next = fromBytesMap(n, base, p, 'bytes');
      setVals(prev => ({ ...prev, ...next }));
    }
  };

  const clear = () => setVals({ bit: '', bytes: '', kb: '', mb: '', gb: '', tb: '' });

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 120px 13px 14px', fontSize: '1rem',
    border: '1px solid var(--color-border)', borderRadius: '10px',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Config panel */}
      <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>{t.optBase}</span>
            {[1000, 1024].map(b => (
              <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                <input type="radio" name="base" checked={base === b} onChange={() => changeBase(b)} />
                {b === 1000 ? t.opt1000 : t.opt1024}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>{t.optPrec}</span>
            <select value={prec} onChange={e => changePrec(Number(e.target.value))} style={{
              padding: '5px 10px', borderRadius: '999px', border: '1px solid var(--color-border)',
              background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.85rem',
            }}>
              {PRECISION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={clear} style={{
              padding: '5px 14px', borderRadius: '999px', border: '1px solid var(--color-border)',
              background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem',
            }}>{t.btnClear}</button>
          </div>
        </div>
        <p style={{ marginTop: '8px', color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>{t.hint}</p>
      </div>

      {/* Conversion panel */}
      <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '14px' }}>
        {UNITS.map(unit => (
          <div key={unit} style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              type="text"
              inputMode="decimal"
              value={vals[unit]}
              onChange={e => handleInput(unit, e.target.value)}
              placeholder={t.placeholder}
              style={inp}
            />
            <span style={{
              position: 'absolute', top: '8px', right: '8px',
              height: 'calc(100% - 16px)', padding: '0 16px', minWidth: '80px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: '7px', color: 'var(--color-text)', pointerEvents: 'none',
            }}>
              {t[unit]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
