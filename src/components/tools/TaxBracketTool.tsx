import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

type TaxSystem = 'us' | 'cn' | 'tw' | 'jp';
const TAX_SYSTEM: Record<string, TaxSystem> = {
  en: 'us', 'zh-CN': 'cn', 'zh-TW': 'tw', ja: 'jp',
};
const INCOME_DEFAULT: Record<string, string> = {
  en: '75000', 'zh-CN': '200000', 'zh-TW': '700000', ja: '5000000',
};

// ---------- US 2024 ----------
type USFiling = 'single' | 'married_joint' | 'married_sep' | 'hoh';
const US_STD: Record<USFiling, number> = { single: 14600, married_joint: 29200, married_sep: 14600, hoh: 21900 };
const US_BRACKETS: Record<USFiling, { rate: number; min: number }[]> = {
  single:       [{ rate:.10,min:0},{rate:.12,min:11600},{rate:.22,min:47150},{rate:.24,min:100525},{rate:.32,min:191950},{rate:.35,min:243725},{rate:.37,min:609350}],
  married_joint:[{ rate:.10,min:0},{rate:.12,min:23200},{rate:.22,min:94300},{rate:.24,min:201050},{rate:.32,min:383900},{rate:.35,min:487450},{rate:.37,min:731200}],
  married_sep:  [{ rate:.10,min:0},{rate:.12,min:11600},{rate:.22,min:47150},{rate:.24,min:100525},{rate:.32,min:191950},{rate:.35,min:243725},{rate:.37,min:365600}],
  hoh:          [{ rate:.10,min:0},{rate:.12,min:16550},{rate:.22,min:63100},{rate:.24,min:100500},{rate:.32,min:191950},{rate:.35,min:243700},{rate:.37,min:609350}],
};

// ---------- China IIT 2024（综合所得，居民个人）----------
const CN_BRACKETS = [
  { rate:.03,min:0 },{ rate:.10,min:36000 },{ rate:.20,min:144000 },
  { rate:.25,min:300000 },{ rate:.30,min:420000 },{ rate:.35,min:660000 },{ rate:.45,min:960000 },
];
const CN_BASIC_DED = 60000; // ¥5,000/月

// ---------- Taiwan 2024（综合所得税）----------
type TWFiling = 'single' | 'married';
const TW_BRACKETS = [
  { rate:.05,min:0 },{ rate:.12,min:560000 },{ rate:.20,min:1260000 },
  { rate:.30,min:2520000 },{ rate:.40,min:4720000 },
];
function twDeductions(income: number, filing: TWFiling) {
  const exempt   = filing === 'married' ? 184000 : 92000;
  const stdDed   = filing === 'married' ? 248000 : 124000;
  const salaryDed = Math.min(income, 207000);
  return { exempt, stdDed, salaryDed, total: exempt + stdDed + salaryDed };
}

// ---------- Japan 2024（給与所得 + 住民税）----------
const JP_BRACKETS = [
  { rate:.05,min:0 },{ rate:.10,min:1950000 },{ rate:.20,min:3300000 },
  { rate:.23,min:6950000 },{ rate:.33,min:9000000 },{ rate:.40,min:18000000 },{ rate:.45,min:40000000 },
];
function jpEmpDed(income: number) {
  if (income <= 1625000) return Math.min(550000, income);
  if (income <= 1800000) return income * 0.4 - 100000;
  if (income <= 3600000) return income * 0.3 + 80000;
  if (income <= 6600000) return income * 0.2 + 440000;
  if (income <= 8500000) return income * 0.1 + 1100000;
  return 1950000;
}

// ---------- Core computation ----------
interface BracketDetail { rate: number; min: number; max: number; income: number; tax: number; }
function computeTax(taxable: number, brackets: { rate: number; min: number }[]): { tax: number; details: BracketDetail[] } {
  let tax = 0;
  const details: BracketDetail[] = [];
  for (let i = 0; i < brackets.length; i++) {
    const lo = brackets[i].min;
    const hi = i + 1 < brackets.length ? brackets[i + 1].min : Infinity;
    const income = Math.max(0, Math.min(taxable, hi) - lo);
    const t = income * brackets[i].rate;
    tax += t;
    if (income > 0) details.push({ rate: brackets[i].rate, min: lo, max: hi, income, tax: t });
  }
  return { tax, details };
}

// ---------- Formatting ----------
function fmtMoney(n: number, locale: string) {
  const abs = Math.abs(n);
  if (locale === 'zh-CN') {
    if (abs >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  }
  if (locale === 'zh-TW') {
    if (abs >= 10000) return (n / 10000).toFixed(1) + '萬';
    return n.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
  }
  if (locale === 'ja') {
    if (abs >= 10000) return (n / 10000).toFixed(1) + '万';
    return Math.round(n).toLocaleString();
  }
  if (abs >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
  if (abs >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + Math.round(n).toLocaleString('en-US');
}
function rateColor(r: number) {
  if (r <= 0.05) return '#22c55e'; if (r <= 0.10) return '#4ade80'; if (r <= 0.12) return '#86efac';
  if (r <= 0.20) return '#fbbf24'; if (r <= 0.23) return '#f59e0b'; if (r <= 0.25) return '#fb923c';
  if (r <= 0.30) return '#f97316'; if (r <= 0.33) return '#ef4444'; if (r <= 0.35) return '#dc2626';
  if (r <= 0.37) return '#b91c1c'; if (r <= 0.40) return '#991b1b'; return '#7f1d1d';
}

// ---------- i18n ----------
const i18n: Record<string, Record<string, string>> = {
  en: {
    income:'Annual Gross Income ($)', filing:'Filing Status', single:'Single', married_joint:'Married Filing Jointly', married_sep:'Married Filing Separately', hoh:'Head of Household',
    std_deduction:'Standard Deduction', taxable_income:'Taxable Income', primary_tax:'Federal Income Tax',
    effective_rate:'Effective Rate', marginal_rate:'Marginal Rate', take_home:'Est. Take-Home (federal only)',
    breakdown:'Tax Breakdown by Bracket', bracket:'Bracket', rate_col:'Rate', income_in:'Income in Bracket', tax_in:'Tax',
    disclaimer:'⚠️ 2024 US federal tax brackets & standard deductions only. Excludes state tax, FICA (SS 6.2% + Medicare 1.45%), and itemized deductions.',
    extra_note:'FICA adds ~7.65% for most employees. Actual liability may differ.',
  },
  'zh-CN': {
    income:'年度综合收入（元）', extra_ded:'专项附加扣除（元）',
    std_deduction:'基本减除费用（6万/年）', taxable_income:'应纳税所得额', primary_tax:'个人所得税',
    effective_rate:'综合税率', marginal_rate:'边际税率', take_home:'税后收入（估算）',
    breakdown:'税档明细', bracket:'税档', rate_col:'税率', income_in:'此档收入', tax_in:'税额',
    disclaimer:'⚠️ 按2024年中国个税综合所得税率（居民个人）计算，基本减除费用¥60,000/年。不含社保/公积金专项扣除，实际以税务局申报为准。',
    extra_note:'专项附加扣除包括：子女教育、赡养老人、住房贷款利息、住房租金、继续教育、大病医疗，可在上方填入对应金额。',
  },
  'zh-TW': {
    income:'年度薪資收入（元）', filing:'申報方式', single:'單身申報', married:'夫妻合併申報',
    std_deduction:'標準扣除額', exempt:'免稅額', salary_ded:'薪資所得特別扣除額', total_ded:'合計扣除',
    taxable_income:'綜合所得淨額', primary_tax:'綜合所得稅',
    effective_rate:'綜合稅率', marginal_rate:'邊際稅率', take_home:'稅後收入（估算）',
    breakdown:'各級距稅額明細', bracket:'級距', rate_col:'稅率', income_in:'此級距收入', tax_in:'稅額',
    disclaimer:'⚠️ 以2024年台灣綜合所得稅計算，使用標準扣除額（NT$124,000/單身）、薪資所得特別扣除額（上限NT$207,000）及免稅額（NT$92,000/人）。未含列舉扣除、抵稅額及最低稅負。實際稅額以國稅局申報為準。',
    extra_note:'結婚後合併申報可享較高免稅額（NT$184,000）與標準扣除額（NT$248,000）；若另有扶養親屬，每人再加NT$92,000免稅額。',
  },
  ja: {
    income:'年間給与収入（円）', emp_ded:'給与所得控除', salary_income:'給与所得', basic_ded:'基礎控除（48万）',
    taxable_income:'課税所得（国税）', primary_tax:'所得税（復興税2.1%含む）', local_tax:'住民税（概算10%）',
    total_tax:'合計税負担', effective_rate:'実効税率', marginal_rate:'限界税率', take_home:'手取り（概算）',
    breakdown:'所得税の税率区分別内訳', bracket:'税率区分', rate_col:'税率', income_in:'この区分の所得', tax_in:'税額',
    disclaimer:'⚠️ 2024年の給与所得控除・基礎控除（48万）・所得税率区分（復興特別所得税2.1%含む）・住民税10%で試算。社会保険料・配偶者控除・扶養控除等は含みません。実際の税額は年末調整または確定申告によります。',
    extra_note:'社会保険料（健康保険・厚生年金等）は収入の約15%が目安で、課税前に控除されます。',
  },
};

export default function TaxBracketTool({ slug, locale }: Props) {
  const system = TAX_SYSTEM[locale] || 'us';
  const t = i18n[locale] || i18n.en;

  const [income, setIncome] = useState(INCOME_DEFAULT[locale] || '75000');
  const [usFiling, setUsFiling] = useState<USFiling>('single');
  const [twFiling, setTwFiling] = useState<TWFiling>('single');
  const [cnExtra, setCnExtra] = useState('0');
  const trackedRef = useRef(false);

  const result = (() => {
    const gross = parseFloat(income);
    if (!gross || gross <= 0) return null;

    if (system === 'us') {
      const stdDed = US_STD[usFiling];
      const taxable = Math.max(0, gross - stdDed);
      const { tax, details } = computeTax(taxable, US_BRACKETS[usFiling]);
      return { system, gross, stdDed, taxable, primaryTax: tax, effectiveRate: tax / gross, marginalRate: details.at(-1)?.rate ?? 0.10, details, takeHome: gross - tax };
    }
    if (system === 'cn') {
      const extra = parseFloat(cnExtra) || 0;
      const totalDed = CN_BASIC_DED + extra;
      const taxable = Math.max(0, gross - totalDed);
      const { tax, details } = computeTax(taxable, CN_BRACKETS);
      return { system, gross, stdDed: totalDed, taxable, primaryTax: tax, effectiveRate: tax / gross, marginalRate: details.at(-1)?.rate ?? 0.03, details, takeHome: gross - tax };
    }
    if (system === 'tw') {
      const ded = twDeductions(gross, twFiling);
      const taxable = Math.max(0, gross - ded.total);
      const { tax, details } = computeTax(taxable, TW_BRACKETS);
      return { system, gross, ded, taxable, primaryTax: tax, effectiveRate: tax / gross, marginalRate: details.at(-1)?.rate ?? 0.05, details, takeHome: gross - tax };
    }
    if (system === 'jp') {
      const empDed = jpEmpDed(gross);
      const salaryIncome = Math.max(0, gross - empDed);
      const taxableNational = Math.max(0, salaryIncome - 480000);
      const taxableLocal    = Math.max(0, salaryIncome - 430000);
      const { tax: natBase, details } = computeTax(taxableNational, JP_BRACKETS);
      const nationalTax = Math.floor(natBase * 1.021);
      const localTax    = Math.floor(taxableLocal * 0.10);
      const totalTax = nationalTax + localTax;
      return { system, gross, empDed, salaryIncome, taxableNational, nationalTax, localTax, totalTax, primaryTax: nationalTax, effectiveRate: totalTax / gross, marginalRate: details.at(-1)?.rate ?? 0.05, details, takeHome: gross - totalTax };
    }
    return null;
  })();

  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' };
  const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)' };
  const tdS: React.CSSProperties = { padding: '0.4rem 0.6rem', fontSize: '0.82rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-text)' };
  const thS: React.CSSProperties = { ...tdS, fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', position: 'sticky', top: 0 };

  const summaryCard = (label: string, value: string, color: string, border = '1px solid var(--color-border)') => (
    <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border, textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );

  return (
    <div>
      {/* 输入 */}
      <div style={card}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{t.income}</label>
          <input style={{ ...inp, maxWidth: '260px' }} type="number" min="0" step={system === 'jp' ? 100000 : system === 'tw' ? 10000 : 1000} value={income} onChange={e => setIncome(e.target.value)} />
        </div>

        {/* 申告区分：US + TW */}
        {(system === 'us') && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={lbl}>{t.filing}</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['single','married_joint','married_sep','hoh'] as USFiling[]).map(k => (
                <button key={k} onClick={() => setUsFiling(k)} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer', border: usFiling === k ? 'none' : '1px solid var(--color-border)', background: usFiling === k ? 'var(--color-primary)' : 'var(--color-card-bg)', color: usFiling === k ? '#fff' : 'var(--color-text)' }}>
                  {t[k]}
                </button>
              ))}
            </div>
          </div>
        )}
        {system === 'tw' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={lbl}>{t.filing}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['single','married'] as TWFiling[]).map(k => (
                <button key={k} onClick={() => setTwFiling(k)} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer', border: twFiling === k ? 'none' : '1px solid var(--color-border)', background: twFiling === k ? 'var(--color-primary)' : 'var(--color-card-bg)', color: twFiling === k ? '#fff' : 'var(--color-text)' }}>
                  {t[k]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 中国：专项附加扣除 */}
        {system === 'cn' && (
          <div>
            <label style={lbl}>{t.extra_ded}</label>
            <input style={{ ...inp, maxWidth: '260px' }} type="number" min="0" step="1000" value={cnExtra} onChange={e => setCnExtra(e.target.value)} />
          </div>
        )}
      </div>

      {result && (
        <>
          {/* 汇总卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {system !== 'jp' && summaryCard(t.primary_tax, fmtMoney(result.primaryTax, locale), 'var(--color-primary)', '2px solid var(--color-primary)')}
            {system === 'jp' && 'totalTax' in result && (
              <>
                {summaryCard(t.primary_tax, fmtMoney(result.nationalTax as number, locale), 'var(--color-primary)', '2px solid var(--color-primary)')}
                {summaryCard(t.local_tax!, fmtMoney(result.localTax as number, locale), '#f59e0b')}
                {summaryCard(t.total_tax!, fmtMoney(result.totalTax as number, locale), '#ef4444')}
              </>
            )}
            {summaryCard(t.effective_rate, (result.effectiveRate * 100).toFixed(1) + '%', 'var(--color-text)')}
            {summaryCard(t.marginal_rate, (result.marginalRate * 100).toFixed(0) + '%', rateColor(result.marginalRate))}
            {(system === 'us' || system === 'cn') && summaryCard(t.std_deduction, fmtMoney(result.stdDed as number, locale), 'var(--color-text)')}
            {system === 'jp' && 'empDed' in result && summaryCard(t.emp_ded!, fmtMoney(result.empDed as number, locale), 'var(--color-text)')}
            {system === 'jp' && 'salaryIncome' in result && summaryCard(t.salary_income!, fmtMoney(result.salaryIncome as number, locale), 'var(--color-text)')}
            {summaryCard(t.taxable_income, fmtMoney(system === 'jp' ? (result as any).taxableNational : result.taxable as number, locale), 'var(--color-text)')}
            {summaryCard(t.take_home, fmtMoney(result.takeHome, locale), '#22c55e', '1px solid #22c55e')}
          </div>

          {/* 台湾：扣除明细 */}
          {system === 'tw' && 'ded' in result && (
            <div style={{ ...card, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>{t.exempt}: <strong style={{ color: 'var(--color-text)' }}>{fmtMoney((result as any).ded.exempt, locale)}</strong></span>
              <span>{t.std_deduction}: <strong style={{ color: 'var(--color-text)' }}>{fmtMoney((result as any).ded.stdDed, locale)}</strong></span>
              <span>{t.salary_ded}: <strong style={{ color: 'var(--color-text)' }}>{fmtMoney((result as any).ded.salaryDed, locale)}</strong></span>
              <span>{t.total_ded}: <strong style={{ color: 'var(--color-text)' }}>{fmtMoney((result as any).ded.total, locale)}</strong></span>
            </div>
          )}

          {/* 税档明细 */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.breakdown}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr>{[t.bracket, t.rate_col, t.income_in, t.tax_in].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.details.map((d, i) => (
                    <tr key={i}>
                      <td style={{ ...tdS, textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {fmtMoney(d.min, locale)} – {d.max === Infinity ? '∞' : fmtMoney(d.max, locale)}
                      </td>
                      <td style={{ ...tdS, fontWeight: 700, color: rateColor(d.rate) }}>{(d.rate * 100).toFixed(0)}%</td>
                      <td style={tdS}>{fmtMoney(d.income, locale)}</td>
                      <td style={{ ...tdS, color: rateColor(d.rate) }}>{fmtMoney(d.tax, locale)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                    <td colSpan={2} style={{ ...tdS, textAlign: 'left', fontWeight: 700, borderBottom: 'none' }}>Total</td>
                    <td style={{ ...tdS, fontWeight: 700, borderBottom: 'none' }}>{fmtMoney(system === 'jp' ? (result as any).taxableNational : result.taxable as number, locale)}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: 'var(--color-primary)', borderBottom: 'none' }}>{fmtMoney(result.primaryTax, locale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#f59e0b', padding: '0.6rem', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', lineHeight: 1.5 }}>{t.disclaimer}</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', padding: '0.6rem', background: 'var(--color-card-bg)', borderRadius: '6px', lineHeight: 1.5, borderLeft: '3px solid var(--color-primary)' }}>{t.extra_note}</p>
        </>
      )}
    </div>
  );
}
