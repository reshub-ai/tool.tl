import { useState, useMemo, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    homePrice: 'Home Price', downPayment: 'Down Payment', downPct: 'Down %',
    interestRate: 'Annual Interest Rate (%)', loanTerm: 'Loan Term (Years)',
    repaymentMode: 'Repayment Method',
    modeAnnuity: 'Fixed Monthly Payment', modeLinear: 'Fixed Principal Payment',
    monthlyPayment: 'Monthly Payment', firstPayment: 'First Payment', lastPayment: 'Last Payment',
    totalInterest: 'Total Interest', totalPayment: 'Total Payment', loanAmount: 'Loan Amount',
    amortization: 'Amortization Schedule', year: 'Year', principal: 'Principal',
    interest: 'Interest', balance: 'Remaining Balance', showAll: 'Show All Years',
    collapse: 'Collapse', principalPct: 'Principal', interestPct: 'Interest',
    currency: '$', years: 'years', downPaymentTip: 'Recommended: 20% to avoid PMI',
    modeAnnuityDesc: 'Equal monthly payment throughout the loan term.',
    modeLinearDesc: 'Equal principal each month; payment decreases over time.',
  },
  'zh-CN': {
    homePrice: '房价', downPayment: '首付金额', downPct: '首付比例 %',
    interestRate: '年利率 (%)', loanTerm: '贷款年限（年）',
    repaymentMode: '还款方式',
    modeAnnuity: '等额本息', modeLinear: '等额本金',
    monthlyPayment: '每月还款', firstPayment: '首期还款', lastPayment: '末期还款',
    totalInterest: '总利息', totalPayment: '总还款额', loanAmount: '贷款金额',
    amortization: '逐年摊还明细', year: '年份', principal: '本金', interest: '利息',
    balance: '剩余本金', showAll: '展开全部年份', collapse: '收起',
    principalPct: '本金', interestPct: '利息', currency: '¥', years: '年',
    downPaymentTip: '中国大陆首套房最低首付 20%，二套房最低 30%',
    modeAnnuityDesc: '每月还款额固定，前期利息占比高，适合收入稳定者。',
    modeLinearDesc: '每月还款本金固定，月供逐月递减，总利息低于等额本息。',
  },
  'zh-TW': {
    homePrice: '房價', downPayment: '頭期款金額', downPct: '頭期款比例 %',
    interestRate: '年利率 (%)', loanTerm: '貸款年限（年）',
    repaymentMode: '還款方式',
    modeAnnuity: '等額本息', modeLinear: '等額本金',
    monthlyPayment: '每月還款', firstPayment: '首期還款', lastPayment: '末期還款',
    totalInterest: '總利息', totalPayment: '總還款額', loanAmount: '貸款金額',
    amortization: '逐年攤還明細', year: '年份', principal: '本金', interest: '利息',
    balance: '剩餘本金', showAll: '展開全部年份', collapse: '收起',
    principalPct: '本金', interestPct: '利息', currency: 'NT$', years: '年',
    downPaymentTip: '建議頭期款 20% 以上',
    modeAnnuityDesc: '每月還款額固定，適合收入穩定者。',
    modeLinearDesc: '每月本金固定，月供逐月遞減，總利息低於等額本息。',
  },
  ja: {
    homePrice: '物件価格', downPayment: '頭金', downPct: '頭金 %',
    interestRate: '年利率 (%)', loanTerm: 'ローン期間（年）',
    repaymentMode: '返済方式',
    modeAnnuity: '元利均等返済', modeLinear: '元金均等返済',
    monthlyPayment: '毎月の返済額', firstPayment: '初回返済額', lastPayment: '最終返済額',
    totalInterest: '総利息', totalPayment: '総返済額', loanAmount: 'ローン残高',
    amortization: '年別償還スケジュール', year: '年', principal: '元金', interest: '利息',
    balance: '残高', showAll: '全年表示', collapse: '折りたたむ',
    principalPct: '元金', interestPct: '利息', currency: '¥', years: '年',
    downPaymentTip: '頭金20%以上が推奨されます',
    modeAnnuityDesc: '毎月の返済額が一定。収入が安定している方に適しています。',
    modeLinearDesc: '毎月の元金返済額が一定。月々の返済が減少し、総利息が少なくなります。',
  },
};

function fmt(n: number, currency: string) {
  return currency + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface AmortRow { year: number; principal: number; interest: number; balance: number; }

function calcAnnuity(principal: number, rate: number, termYears: number) {
  const r = rate / 100 / 12;
  const n = termYears * 12;
  const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const rows: AmortRow[] = [];
  let balance = principal;
  for (let yr = 1; yr <= termYears; yr++) {
    let yP = 0, yI = 0;
    for (let m = 0; m < 12; m++) {
      const iP = balance * r;
      const pP = monthly - iP;
      yI += iP; yP += pP;
      balance = Math.max(0, balance - pP);
    }
    rows.push({ year: yr, principal: yP, interest: yI, balance });
  }
  const totalPayment = monthly * n;
  return { monthly, firstPayment: monthly, lastPayment: monthly, totalPayment, totalInterest: totalPayment - principal, rows };
}

function calcLinear(principal: number, rate: number, termYears: number) {
  const r = rate / 100 / 12;
  const n = termYears * 12;
  const monthlyPrincipal = principal / n;
  const rows: AmortRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  const firstPayment = monthlyPrincipal + principal * r;
  let lastPayment = monthlyPrincipal;
  for (let yr = 1; yr <= termYears; yr++) {
    let yP = 0, yI = 0;
    for (let m = 0; m < 12; m++) {
      const iP = balance * r;
      yI += iP; yP += monthlyPrincipal;
      totalInterest += iP;
      balance = Math.max(0, balance - monthlyPrincipal);
      if (yr === termYears && m === 11) lastPayment = monthlyPrincipal + balance * r + iP;
    }
    rows.push({ year: yr, principal: yP, interest: yI, balance });
  }
  return { monthly: null, firstPayment, lastPayment, totalPayment: principal + totalInterest, totalInterest, rows };
}

export default function MortgageCalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const isChinese = locale === 'zh-CN' || locale === 'zh-TW' || locale === 'ja';

  const homePriceDefault = locale === 'zh-CN' ? '2000000' : locale === 'zh-TW' ? '15000000' : locale === 'ja' ? '40000000' : '400000';
  const downPctDefault = locale === 'zh-CN' ? '30' : '20';
  const rateDefault = locale === 'zh-CN' ? '3.1' : locale === 'zh-TW' ? '2.0' : locale === 'ja' ? '0.8' : '6.5';
  const termDefault = locale === 'ja' ? '35' : '30';

  const [homePrice, setHomePrice] = useState(homePriceDefault);
  const [downPct, setDownPct] = useState(downPctDefault);
  const [downAmt, setDownAmt] = useState(() => String(Math.round(parseFloat(homePriceDefault) * parseFloat(downPctDefault) / 100)));
  const [rate, setRate] = useState(rateDefault);
  const [term, setTerm] = useState(termDefault);
  const [mode, setMode] = useState<'annuity' | 'linear'>('annuity');
  const [showAll, setShowAll] = useState(false);

  const syncFromPct = (pct: string, price: string) => {
    const p = parseFloat(price) || 0;
    setDownAmt(Math.round(p * (parseFloat(pct) || 0) / 100).toString());
  };
  const syncFromAmt = (amt: string, price: string) => {
    const p = parseFloat(price) || 0;
    if (p > 0) setDownPct(((parseFloat(amt) / p) * 100).toFixed(1));
  };

  const result = useMemo(() => {
    const p = parseFloat(homePrice.replace(/,/g, '')) || 0;
    const d = parseFloat(downAmt.replace(/,/g, '')) || 0;
    const r = parseFloat(rate) || 0;
    const y = parseInt(term) || 0;
    const principal = p - d;
    if (principal <= 0 || r <= 0 || y <= 0) return null;
    return mode === 'annuity' ? calcAnnuity(principal, r, y) : calcLinear(principal, r, y);
  }, [homePrice, downAmt, rate, term, mode]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const principal = (parseFloat(homePrice) || 0) - (parseFloat(downAmt) || 0);
  const principalPct = result ? Math.round((principal / result.totalPayment) * 100) : 0;

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' };
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem' };
  const statCard = (color: string): React.CSSProperties => ({ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', borderLeft: `4px solid ${color}` });
  const modeBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    border: active ? 'none' : '1px solid var(--color-border)',
    background: active ? 'var(--color-primary)' : 'var(--color-bg)',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    transition: 'all 0.15s',
  });

  const displayRows = showAll ? result?.rows : result?.rows.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={card}>
        {/* Repayment mode toggle */}
        <div style={{ marginBottom: '18px' }}>
          <label style={lbl}>{t.repaymentMode}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={modeBtn(mode === 'annuity')} onClick={() => setMode('annuity')}>{t.modeAnnuity}</button>
            <button style={modeBtn(mode === 'linear')} onClick={() => setMode('linear')}>{t.modeLinear}</button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
            {mode === 'annuity' ? t.modeAnnuityDesc : t.modeLinearDesc}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={lbl}>{t.homePrice}</label>
            <input style={inp} type="number" min="0" value={homePrice}
              onChange={(e) => { setHomePrice(e.target.value); syncFromPct(downPct, e.target.value); }} />
          </div>
          <div>
            <label style={lbl}>{t.downPayment}</label>
            <input style={inp} type="number" min="0" value={downAmt}
              onChange={(e) => { setDownAmt(e.target.value); syncFromAmt(e.target.value, homePrice); }} />
          </div>
          <div>
            <label style={lbl}>{t.downPct}</label>
            <input style={inp} type="number" min="0" max="100" step="0.5" value={downPct}
              onChange={(e) => { setDownPct(e.target.value); syncFromPct(e.target.value, homePrice); }} />
            {parseFloat(downPct) < 20 && (
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#f59e0b' }}>{t.downPaymentTip}</p>
            )}
          </div>
          <div>
            <label style={lbl}>{t.interestRate}</label>
            <input style={inp} type="number" min="0.1" max="30" step="0.05" value={rate}
              onChange={(e) => setRate(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.loanTerm}</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={term} onChange={(e) => setTerm(e.target.value)}>
              {[5, 10, 15, 20, 25, 30].map((y) => <option key={y} value={y}>{y} {t.years}</option>)}
            </select>
          </div>
        </div>
      </div>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {result.monthly !== null ? (
              <div style={statCard('var(--color-primary)')}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.monthlyPayment}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)' }}>{fmt(result.monthly, t.currency)}</div>
              </div>
            ) : (
              <>
                <div style={statCard('var(--color-primary)')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.firstPayment}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{fmt(result.firstPayment, t.currency)}</div>
                </div>
                <div style={statCard('#10b981')}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.lastPayment}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{fmt(result.lastPayment, t.currency)}</div>
                </div>
              </>
            )}
            <div style={statCard('#10b981')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.loanAmount}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)' }}>{fmt(principal, t.currency)}</div>
            </div>
            <div style={statCard('#f59e0b')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.totalInterest}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)' }}>{fmt(result.totalInterest, t.currency)}</div>
            </div>
            <div style={statCard('#8b5cf6')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.totalPayment}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)' }}>{fmt(result.totalPayment, t.currency)}</div>
            </div>
          </div>

          {/* Visual bar */}
          <div style={{ ...card, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--color-primary)' }} />
              {t.principalPct} {principalPct}%
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#f59e0b', marginLeft: 8 }} />
              {t.interestPct} {100 - principalPct}%
            </div>
            <div style={{ height: '20px', borderRadius: '10px', overflow: 'hidden', background: 'var(--color-border)', display: 'flex' }}>
              <div style={{ width: `${principalPct}%`, background: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
              <div style={{ flex: 1, background: '#f59e0b' }} />
            </div>
          </div>

          {/* Amortization table */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '12px' }}>{t.amortization}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {[t.year, t.principal, t.interest, t.balance].map((h) => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows?.map((row) => (
                    <tr key={row.year} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>{row.year}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(row.principal, t.currency)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{fmt(row.interest, t.currency)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--color-text)' }}>{fmt(row.balance, t.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(result.rows.length > 5) && (
              <button onClick={() => setShowAll(!showAll)} style={{ marginTop: '10px', padding: '6px 16px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                {showAll ? t.collapse : `${t.showAll} (${result.rows.length})`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
