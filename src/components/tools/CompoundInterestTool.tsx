import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

// 各地区默认参数
const LOCALE_DEFAULTS: Record<string, { rate: string; tax: string; principal: string; contribution: string }> = {
  en:      { rate: '7',    tax: '0',      principal: '10000',   contribution: '200' },
  'zh-CN': { rate: '2',    tax: '0',      principal: '10000',   contribution: '500' },
  'zh-TW': { rate: '1.5',  tax: '10',     principal: '100000',  contribution: '5000' },
  ja:      { rate: '0.5',  tax: '20.315', principal: '1000000', contribution: '10000' },
};

const i18n: Record<string, Record<string, string>> = {
  en: {
    principal: 'Starting Principal ($)',
    rate: 'Annual Interest Rate (%)',
    years: 'Time Period (years)',
    freq: 'Compound Frequency',
    freq_daily: 'Daily (365×/yr)', freq_monthly: 'Monthly (12×/yr)',
    freq_quarterly: 'Quarterly (4×/yr)', freq_semi: 'Semi-annually (2×/yr)', freq_annually: 'Annually (1×/yr)',
    contribution: 'Monthly Contribution ($)',
    tax_rate: 'Interest / Withholding Tax Rate (%)',
    final_amount: 'Final Balance (after tax)',
    gross_final: 'Gross Balance (before tax)',
    total_interest: 'Net Interest Earned',
    gross_interest: 'Gross Interest',
    tax_paid: 'Total Tax Paid',
    total_contributions: 'Total Contributions',
    growth_x: 'Growth',
    breakdown: 'Growth Breakdown',
    year_label: 'Year', balance_label: 'Balance', interest_label: 'Net Interest',
    tax_label: 'Tax Paid', contributed_label: 'Contributed',
    show_all: 'Show All', show_less: 'Show Less',
    tax_note: 'ℹ️ US: Interest income is not automatically withheld. It is taxed as ordinary income when you file your annual tax return. Enter your estimated marginal rate for a realistic after-tax projection.',
    hint: 'Tip: Even a 1% rate difference or a few extra years creates a massive difference thanks to compounding.',
    no_tax: 'No tax applied',
  },
  'zh-CN': {
    principal: '初始本金（元）',
    rate: '年利率（%）',
    years: '投资年限（年）',
    freq: '复利计算频率',
    freq_daily: '每日（365次/年）', freq_monthly: '每月（12次/年）',
    freq_quarterly: '每季（4次/年）', freq_semi: '每半年（2次/年）', freq_annually: '每年（1次/年）',
    contribution: '每月追加投入（元）',
    tax_rate: '利息税率（%）',
    final_amount: '税后最终金额',
    gross_final: '税前最终金额',
    total_interest: '税后累计利息',
    gross_interest: '税前累计利息',
    tax_paid: '累计利息税',
    total_contributions: '累计投入',
    growth_x: '增长倍数',
    breakdown: '逐年增长明细',
    year_label: '年份', balance_label: '账户余额', interest_label: '税后利息',
    tax_label: '已缴税', contributed_label: '累计投入',
    show_all: '显示全部', show_less: '收起',
    tax_note: 'ℹ️ 中国：个人储蓄存款利息税自2008年起暂停征收，当前实际税率为0%。基金、债券、股票等投资收益按20%征收个人所得税，可根据实际情况调整税率。',
    hint: '提示：利率或年限的微小变化，经过复利效应会产生巨大差异。',
    no_tax: '无利息税',
  },
  'zh-TW': {
    principal: '初始本金（元）',
    rate: '年利率（%）',
    years: '投資年限（年）',
    freq: '複利計算頻率',
    freq_daily: '每日（365次/年）', freq_monthly: '每月（12次/年）',
    freq_quarterly: '每季（4次/年）', freq_semi: '每半年（2次/年）', freq_annually: '每年（1次/年）',
    contribution: '每月追加投入（元）',
    tax_rate: '利息稅率（%）',
    final_amount: '稅後最終金額',
    gross_final: '稅前最終金額',
    total_interest: '稅後累計利息',
    gross_interest: '稅前累計利息',
    tax_paid: '累計利息稅',
    total_contributions: '累計投入',
    growth_x: '成長倍數',
    breakdown: '逐年成長明細',
    year_label: '年份', balance_label: '帳戶餘額', interest_label: '稅後利息',
    tax_label: '已繳稅', contributed_label: '累計投入',
    show_all: '顯示全部', show_less: '收起',
    tax_note: 'ℹ️ 台灣：存款及債券利息所得採分離課稅，稅率10%，不併入綜合所得稅計算。儲蓄投資特別扣除額每人每年27萬元以內免稅，超過部分按10%課稅。',
    hint: '提示：利率或年限的微小變化，經過複利效應會產生巨大差異。',
    no_tax: '無利息稅',
  },
  ja: {
    principal: '元本（円）',
    rate: '年利率（%）',
    years: '運用期間（年）',
    freq: '複利計算頻度',
    freq_daily: '毎日（365回/年）', freq_monthly: '毎月（12回/年）',
    freq_quarterly: '四半期（4回/年）', freq_semi: '半年（2回/年）', freq_annually: '毎年（1回/年）',
    contribution: '毎月の追加投資（円）',
    tax_rate: '利息源泉徴収税率（%）',
    final_amount: '税引後最終残高',
    gross_final: '税引前最終残高',
    total_interest: '税引後利息',
    gross_interest: '税引前利息',
    tax_paid: '源泉徴収税合計',
    total_contributions: '累計投資額',
    growth_x: '運用倍率',
    breakdown: '年次成長内訳',
    year_label: '年', balance_label: '税引後残高', interest_label: '税引後利息',
    tax_label: '源泉徴収税', contributed_label: '累計投資',
    show_all: 'すべて表示', show_less: '折りたたむ',
    tax_note: 'ℹ️ 日本：預貯金・債券の利子には所得税15.315%（復興特別所得税0.315%含む）＋地方税5%＝合計20.315%の源泉徴収が適用されます。NISA口座内の運用は非課税です（NISA利用時は税率0%に設定してください）。',
    hint: 'ヒント：利率や期間のわずかな違いが、複利効果により長期では大きな差になります。',
    no_tax: '非課税',
  },
};

const FREQS = [
  { value: 365, key: 'freq_daily' },
  { value: 12,  key: 'freq_monthly' },
  { value: 4,   key: 'freq_quarterly' },
  { value: 2,   key: 'freq_semi' },
  { value: 1,   key: 'freq_annually' },
];

interface Row {
  year: number;
  balance: number;       // 税后余额
  netInterest: number;   // 税后累计利息
  grossInterest: number; // 税前累计利息
  taxPaid: number;       // 累计税款
  contributed: number;   // 累计投入
}

function compute(P: number, r: number, n: number, years: number, pmt: number, taxRate: number): Row[] {
  const grossMonthlyRate = Math.pow(1 + r / n, n / 12) - 1;
  const rows: Row[] = [];
  let balance = P;
  let totalContributed = P;
  let totalTaxPaid = 0;

  for (let yr = 1; yr <= years; yr++) {
    for (let m = 0; m < 12; m++) {
      const grossInterest = balance * grossMonthlyRate;
      const tax = grossInterest * taxRate;
      totalTaxPaid += tax;
      balance = balance + grossInterest - tax + pmt;
      if (yr > 1 || m > 0) totalContributed += pmt;
    }
    if (yr === 1) totalContributed = P + pmt * 12;
    const netInterest = balance - totalContributed;
    rows.push({
      year: yr,
      balance,
      netInterest,
      grossInterest: netInterest + totalTaxPaid,
      taxPaid: totalTaxPaid,
      contributed: totalContributed,
    });
  }
  return rows;
}

function fmtMoney(n: number, locale: string) {
  const abs = Math.abs(n);
  if (locale === 'zh-CN') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(2) + '亿';
    if (abs >= 10_000) return (n / 10_000).toFixed(2) + '万';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  }
  if (locale === 'zh-TW') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(2) + '億';
    if (abs >= 10_000) return (n / 10_000).toFixed(2) + '萬';
    return n.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
  }
  if (locale === 'ja') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(2) + '億';
    if (abs >= 10_000) return (n / 10_000).toFixed(2) + '万';
    return Math.round(n).toLocaleString();
  }
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function CompoundInterestTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const def = LOCALE_DEFAULTS[locale] || LOCALE_DEFAULTS.en;

  const [principal, setPrincipal] = useState(def.principal);
  const [rate, setRate] = useState(def.rate);
  const [years, setYears] = useState('20');
  const [freq, setFreq] = useState(12);
  const [contribution, setContribution] = useState(def.contribution);
  const [taxRate, setTaxRate] = useState(def.tax);
  const [showAll, setShowAll] = useState(false);
  const trackedRef = useRef(false);

  const result = (() => {
    const P = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const y = parseInt(years);
    const pmt = parseFloat(contribution) || 0;
    const tx = Math.min(Math.max(parseFloat(taxRate) || 0, 0), 99) / 100;
    if (!P || !r || !y || P <= 0 || y <= 0 || y > 100) return null;
    return { rows: compute(P, r, freq, y, pmt, tx), hasTax: tx > 0 };
  })();

  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const rows = result?.rows ?? [];
  const last = rows[rows.length - 1];
  const hasTax = result?.hasTax ?? false;
  const displayRows = showAll ? rows : rows.slice(0, 10);

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' };
  const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' };
  const tdStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-text)' };
  const thStyle: React.CSSProperties = { ...tdStyle, fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', position: 'sticky', top: 0 };
  const mc = (border?: string): React.CSSProperties => ({ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: border || '1px solid var(--color-border)', textAlign: 'center' });

  return (
    <div>
      {/* 输入区 */}
      <div style={card}>
        <div style={grid2}>
          <div><label style={lbl}>{t.principal}</label><input style={inp} type="number" min="0" step="1000" value={principal} onChange={e => setPrincipal(e.target.value)} /></div>
          <div><label style={lbl}>{t.rate}</label><input style={inp} type="number" min="0.01" max="50" step="0.1" value={rate} onChange={e => setRate(e.target.value)} /></div>
          <div><label style={lbl}>{t.years}</label><input style={inp} type="number" min="1" max="100" value={years} onChange={e => setYears(e.target.value)} /></div>
          <div><label style={lbl}>{t.contribution}</label><input style={inp} type="number" min="0" step="100" value={contribution} onChange={e => setContribution(e.target.value)} /></div>
          <div>
            <label style={lbl}>{t.tax_rate}</label>
            <input style={inp} type="number" min="0" max="99" step="0.001" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>{t.freq}</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {FREQS.map(f => (
                <button key={f.value} onClick={() => setFreq(f.value)} style={{ padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', border: freq === f.value ? 'none' : '1px solid var(--color-border)', background: freq === f.value ? 'var(--color-primary)' : 'var(--color-card-bg)', color: freq === f.value ? '#fff' : 'var(--color-text)' }}>
                  {t[f.key as keyof typeof t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {last && (
        <>
          {/* 汇总指标 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={mc('2px solid var(--color-primary)')}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.final_amount}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{fmtMoney(last.balance, locale)}</div>
            </div>
            {hasTax && (
              <div style={mc('1px solid var(--color-border)')}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.gross_final}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{fmtMoney(last.balance + last.taxPaid, locale)}</div>
              </div>
            )}
            <div style={mc('1px solid #22c55e')}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.total_interest}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>{fmtMoney(last.netInterest, locale)}</div>
            </div>
            {hasTax && (
              <>
                <div style={mc('1px solid var(--color-border)')}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.gross_interest}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{fmtMoney(last.grossInterest, locale)}</div>
                </div>
                <div style={mc('1px solid #ef4444')}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.tax_paid}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(last.taxPaid, locale)}</div>
                </div>
              </>
            )}
            <div style={mc()}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.total_contributions}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{fmtMoney(last.contributed, locale)}</div>
            </div>
            <div style={mc()}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.growth_x}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{(last.balance / last.contributed).toFixed(2)}×</div>
            </div>
          </div>

          {/* 可视化条形：本金+追加 | 税后利息 | 税款 */}
          <div style={card}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.breakdown}</div>
            <div style={{ display: 'flex', height: '22px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${(last.contributed / (last.balance + last.taxPaid)) * 100}%`, background: 'var(--color-primary)', opacity: 0.6 }} />
              <div style={{ width: `${(last.netInterest / (last.balance + last.taxPaid)) * 100}%`, background: '#22c55e' }} />
              {hasTax && <div style={{ flex: 1, background: '#ef4444', opacity: 0.7 }} />}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.4rem' }}>
              {[
                { color: 'var(--color-primary)', opacity: 0.6, label: t.total_contributions, val: last.contributed },
                { color: '#22c55e', opacity: 1, label: t.total_interest, val: last.netInterest },
                ...(hasTax ? [{ color: '#ef4444', opacity: 0.7, label: t.tax_paid, val: last.taxPaid }] : []),
              ].map(item => (
                <span key={item.label} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: item.color, opacity: item.opacity, borderRadius: '2px' }} />
                  {item.label}: {fmtMoney(item.val, locale)}
                </span>
              ))}
            </div>
          </div>

          {/* 逐年表格 */}
          <div style={card}>
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: hasTax ? '520px' : '400px' }}>
                <thead>
                  <tr>
                    {[t.year_label, t.balance_label, t.interest_label, ...(hasTax ? [t.tax_label] : []), t.contributed_label].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map(row => (
                    <tr key={row.year} style={{ background: row.year % 5 === 0 ? 'rgba(59,130,246,0.05)' : undefined }}>
                      <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)' }}>{row.year}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{fmtMoney(row.balance, locale)}</td>
                      <td style={{ ...tdStyle, color: '#22c55e' }}>{fmtMoney(row.netInterest, locale)}</td>
                      {hasTax && <td style={{ ...tdStyle, color: '#ef4444' }}>{fmtMoney(row.taxPaid, locale)}</td>}
                      <td style={tdStyle}>{fmtMoney(row.contributed, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 && (
              <button onClick={() => setShowAll(!showAll)} style={{ marginTop: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.82rem' }}>
                {showAll ? t.show_less : `${t.show_all} (${rows.length})`}
              </button>
            )}
          </div>

          {/* 地区税务说明 */}
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', padding: '0.6rem 0.75rem', background: 'var(--color-card-bg)', borderRadius: '6px', borderLeft: '3px solid var(--color-primary)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
            {t.tax_note}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', padding: '0.6rem 0.75rem', background: 'var(--color-card-bg)', borderRadius: '6px', borderLeft: '3px solid var(--color-border)', lineHeight: 1.6 }}>
            {t.hint}
          </p>
        </>
      )}
    </div>
  );
}
