import { useState, useEffect, useCallback } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    from: 'From',
    to: 'To',
    amount: 'Amount',
    convert: 'Convert',
    result: 'Result',
    loading: 'Loading rates...',
    error: 'Failed to load exchange rates. Please try again.',
    updated: 'Updated',
    common_rates: 'Common Rates',
    base: 'Base',
    swap: 'Swap',
    rate: 'Rate',
  },
  'zh-CN': {
    from: '源货币',
    to: '目标货币',
    amount: '金额',
    convert: '换算',
    result: '结果',
    loading: '正在加载汇率...',
    error: '加载汇率失败，请重试。',
    updated: '更新时间',
    common_rates: '常用汇率',
    base: '基准',
    swap: '交换',
    rate: '汇率',
  },
  'zh-TW': {
    from: '來源貨幣',
    to: '目標貨幣',
    amount: '金額',
    convert: '換算',
    result: '結果',
    loading: '正在載入匯率...',
    error: '載入匯率失敗，請重試。',
    updated: '更新時間',
    common_rates: '常用匯率',
    base: '基準',
    swap: '交換',
    rate: '匯率',
  },
  ja: {
    from: '換算元',
    to: '換算先',
    amount: '金額',
    convert: '換算',
    result: '結果',
    loading: 'レートを読み込み中...',
    error: '為替レートの読み込みに失敗しました。',
    updated: '更新時刻',
    common_rates: '主要レート',
    base: '基準',
    swap: '交換',
    rate: 'レート',
  },
};

const CURRENCIES = ['USD', 'CNY', 'EUR', 'JPY', 'GBP', 'HKD', 'KRW', 'SGD', 'AUD', 'CAD', 'CHF', 'TWD'];

const CURRENCY_NAMES: Record<string, Record<string, string>> = {
  USD: { en: 'US Dollar', 'zh-CN': '美元', 'zh-TW': '美元', ja: '米ドル' },
  CNY: { en: 'Chinese Yuan', 'zh-CN': '人民币', 'zh-TW': '人民幣', ja: '人民元' },
  EUR: { en: 'Euro', 'zh-CN': '欧元', 'zh-TW': '歐元', ja: 'ユーロ' },
  JPY: { en: 'Japanese Yen', 'zh-CN': '日元', 'zh-TW': '日圓', ja: '日本円' },
  GBP: { en: 'British Pound', 'zh-CN': '英镑', 'zh-TW': '英鎊', ja: '英ポンド' },
  HKD: { en: 'HK Dollar', 'zh-CN': '港币', 'zh-TW': '港幣', ja: '香港ドル' },
  KRW: { en: 'Korean Won', 'zh-CN': '韩元', 'zh-TW': '韓元', ja: '韓国ウォン' },
  SGD: { en: 'Singapore Dollar', 'zh-CN': '新加坡元', 'zh-TW': '新加坡元', ja: 'シンガポールドル' },
  AUD: { en: 'Australian Dollar', 'zh-CN': '澳大利亚元', 'zh-TW': '澳大利亞元', ja: '豪ドル' },
  CAD: { en: 'Canadian Dollar', 'zh-CN': '加拿大元', 'zh-TW': '加拿大元', ja: 'カナダドル' },
  CHF: { en: 'Swiss Franc', 'zh-CN': '瑞士法郎', 'zh-TW': '瑞士法郎', ja: 'スイスフラン' },
  TWD: { en: 'Taiwan Dollar', 'zh-CN': '新台币', 'zh-TW': '新台幣', ja: '台湾ドル' },
};

// Common pairs to show in the rates table (base: USD)
const COMMON_PAIRS = ['CNY', 'EUR', 'JPY', 'GBP', 'HKD', 'KRW', 'SGD', 'AUD'];

function getCurrencyLabel(code: string, locale: string) {
  const name = CURRENCY_NAMES[code]?.[locale] || CURRENCY_NAMES[code]?.en || code;
  return `${code} - ${name}`;
}

export default function ExchangeRateTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;

  const [rates, setRates] = useState<Record<string, number>>({});
  const [base, setBase] = useState('USD');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [amount, setAmount] = useState('1');
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);

  const fetchRates = useCallback(async (baseCurrency: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${baseCurrency}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const allRates: Record<string, number> = { ...data.rates, [baseCurrency]: 1 };
      setRates(allRates);
      setBase(baseCurrency);
      setDate(data.date || '');
      (window as any).__trackToolUsed?.(slug);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    fetchRates('USD');
  }, []);

  const doConvert = useCallback(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || !rates[fromCurrency] || !rates[toCurrency]) {
      setConvertedAmount(null);
      return;
    }
    // Convert via base
    const inBase = amt / rates[fromCurrency];
    const result = inBase * rates[toCurrency];
    const decimals = toCurrency === 'JPY' || toCurrency === 'KRW' ? 0 : 4;
    setConvertedAmount(result.toFixed(decimals));
  }, [amount, fromCurrency, toCurrency, rates]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
  };

  const btnStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.85rem',
  };

  const primaryBtn: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    padding: '1.25rem',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    marginBottom: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    marginBottom: '0.35rem',
    color: 'var(--color-text-secondary)',
  };

  // Show the rate between fromCurrency and toCurrency
  const currentRate = (() => {
    if (!rates[fromCurrency] || !rates[toCurrency]) return null;
    const r = rates[toCurrency] / rates[fromCurrency];
    const decimals = toCurrency === 'JPY' || toCurrency === 'KRW' ? 4 : 4;
    return r.toFixed(decimals);
  })();

  return (
    <div>
      {/* Converter Card */}
      <div style={cardStyle}>
        {loading && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            {t.loading}
          </p>
        )}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{error}</p>
        )}

        {/* Amount + From */}
        <div className="tl-auto-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={labelStyle}>{t.amount}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setConvertedAmount(null); }}
              style={inputStyle}
              min="0"
              step="any"
            />
          </div>
          <div>
            <label style={labelStyle}>{t.from}</label>
            <select
              value={fromCurrency}
              onChange={(e) => { setFromCurrency(e.target.value); setConvertedAmount(null); }}
              style={inputStyle}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{getCurrencyLabel(c, locale)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap + To */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <button onClick={swapCurrencies} style={{ ...btnStyle, padding: '0.5rem 0.75rem', fontSize: '1rem' }} title={t.swap}>
            ⇄
          </button>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t.to}</label>
            <select
              value={toCurrency}
              onChange={(e) => { setToCurrency(e.target.value); setConvertedAmount(null); }}
              style={inputStyle}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{getCurrencyLabel(c, locale)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Convert button */}
        <button onClick={doConvert} style={primaryBtn} disabled={loading}>
          {t.convert}
        </button>

        {/* Result */}
        {convertedAmount !== null && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-primary)',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {parseFloat(amount).toLocaleString()} {fromCurrency} ≈ {parseFloat(convertedAmount).toLocaleString()} {toCurrency}
            </div>
            {currentRate && (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem' }}>
                1 {fromCurrency} = {currentRate} {toCurrency}
              </div>
            )}
            {date && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                {t.updated}: {date}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Common Rates Table */}
      {!loading && !error && Object.keys(rates).length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {t.common_rates}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{t.base}:</span>
              <select
                value={base}
                onChange={(e) => fetchRates(e.target.value)}
                style={{ ...btnStyle, padding: '0.3rem 0.5rem' }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {COMMON_PAIRS.filter((c) => c !== base && rates[c]).map((c) => (
              <div
                key={c}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setFromCurrency(base);
                  setToCurrency(c);
                  setConvertedAmount(null);
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  {base}/{c}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '0.15rem' }}>
                  {rates[c]?.toFixed(c === 'JPY' || c === 'KRW' ? 2 : 4)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                  {CURRENCY_NAMES[c]?.[locale] || CURRENCY_NAMES[c]?.en || c}
                </div>
              </div>
            ))}
          </div>

          {date && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              {t.updated}: {date}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
