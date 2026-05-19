import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const LOCALE_DEFAULTS: Record<string, { apr: string; balance: string; payment: string; minRate: string; minFloor: string }> = {
  en:      { apr: '24',    balance: '5000',   payment: '200',   minRate: '2',  minFloor: '25' },
  'zh-CN': { apr: '18.25', balance: '30000',  payment: '3000',  minRate: '10', minFloor: '10' },
  'zh-TW': { apr: '15',    balance: '50000',  payment: '2000',  minRate: '10', minFloor: '500' },
  ja:      { apr: '15',    balance: '500000', payment: '20000', minRate: '3',  minFloor: '1000' },
};

const i18n: Record<string, Record<string, string>> = {
  en: {
    balance: 'Current Balance ($)',
    apr: 'Annual Interest Rate / APR (%)',
    payment: 'Monthly Payment ($)',
    min_rate: 'Minimum Payment (% of balance)',
    min_floor: 'Minimum Payment Floor ($)',
    months: 'Months to Pay Off',
    total_interest: 'Total Interest',
    total_paid: 'Total Paid',
    compare_title: 'Fixed vs Minimum Payment',
    fixed_label: 'Fixed Payment',
    min_label: 'Minimum Payment',
    interest_saved: 'Interest Saved vs Min Payment',
    interest_extra: 'Extra Interest vs Min Payment',
    time_saved: 'Time Saved',
    payment_below_min: 'Your fixed payment is below the initial minimum payment ({min}). In practice, you would be required to pay at least the minimum, so this comparison may not reflect real-world behavior.',
    never: '⚠️ At minimum payment, payoff could take decades.',
    schedule: 'Payoff Schedule',
    month_col: 'Month',
    payment_col: 'Payment',
    interest_col: 'Interest',
    principal_col: 'Principal',
    balance_col: 'Balance',
    show_all: 'Show All',
    show_less: 'Show Less',
    per_month: '/mo',
    too_low: 'Monthly payment must exceed the monthly interest charge.',
    rate_note: 'US credit card APR typically ranges 18–28%. Minimum payment is usually 1–3% of balance or $25–35, whichever is greater.',
  },
  'zh-CN': {
    balance: '当前余额（元）',
    apr: '年利率 / APR（%）',
    payment: '每月还款额（元）',
    min_rate: '最低还款比例（%）',
    min_floor: '最低还款底线（元）',
    months: '还清月数',
    total_interest: '总利息',
    total_paid: '总还款额',
    compare_title: '固定还款 vs 最低还款对比',
    fixed_label: '固定还款',
    min_label: '最低还款',
    interest_saved: '较最低还款节省利息',
    interest_extra: '较最低还款多付利息',
    time_saved: '节省时间',
    payment_below_min: '固定还款额（{min}）低于首月最低还款额，实际无法按此金额还款，对比结果仅供参考。',
    never: '⚠️ 按最低还款，可能需要数十年才能还清。',
    schedule: '还款明细',
    month_col: '期数',
    payment_col: '还款额',
    interest_col: '利息',
    principal_col: '本金',
    balance_col: '剩余余额',
    show_all: '显示全部',
    show_less: '收起',
    per_month: '/月',
    too_low: '每月还款额必须超过当月利息。',
    rate_note: '中国信用卡循环利率上限为日利率万分之五（年化 18.25%）。最低还款额通常为账单金额的 10%，未全额还款将从消费日起全额计息。',
  },
  'zh-TW': {
    balance: '目前餘額（元）',
    apr: '年利率 / APR（%）',
    payment: '每月還款額（元）',
    min_rate: '最低還款比例（%）',
    min_floor: '最低還款底線（元）',
    months: '還清月數',
    total_interest: '總利息',
    total_paid: '總還款額',
    compare_title: '固定還款 vs 最低還款對比',
    fixed_label: '固定還款',
    min_label: '最低還款',
    interest_saved: '較最低還款節省利息',
    interest_extra: '較最低還款多付利息',
    time_saved: '節省時間',
    payment_below_min: '固定還款額（{min}）低於首月最低還款額，實際無法按此金額還款，對比結果僅供參考。',
    never: '⚠️ 按最低還款，可能需要數十年才能還清。',
    schedule: '還款明細',
    month_col: '期數',
    payment_col: '還款額',
    interest_col: '利息',
    principal_col: '本金',
    balance_col: '剩餘餘額',
    show_all: '顯示全部',
    show_less: '收起',
    per_month: '/月',
    too_low: '每月還款額必須超過當月利息。',
    rate_note: '台灣信用卡循環利率法定上限為年利率 15%（金管會規定）。最低還款額通常為帳單金額的 10%，最低 NT$500。',
  },
  ja: {
    balance: '現在の残高（円）',
    apr: '年利率 / APR（%）',
    payment: '毎月の返済額（円）',
    min_rate: '最低返済率（%）',
    min_floor: '最低返済額の下限（円）',
    months: '完済月数',
    total_interest: '総利息',
    total_paid: '総返済額',
    compare_title: '固定返済 vs 最低返済の比較',
    fixed_label: '固定返済',
    min_label: '最低返済',
    interest_saved: '最低返済比の節約利息',
    interest_extra: '最低返済より多い利息',
    time_saved: '短縮期間',
    payment_below_min: '固定返済額（{min}）が初月の最低返済額を下回っています。実際にはこの金額での返済はできません。',
    never: '⚠️ 最低返済のみでは、完済に数十年かかる可能性があります。',
    schedule: '返済スケジュール',
    month_col: '月',
    payment_col: '返済額',
    interest_col: '利息',
    principal_col: '元金',
    balance_col: '残高',
    show_all: 'すべて表示',
    show_less: '折りたたむ',
    per_month: '/月',
    too_low: '毎月の返済額は月次利息を超える必要があります。',
    rate_note: '日本のリボ払い金利は通常年利 15〜18%（利息制限法の上限）。最低返済額はカード会社により異なります。',
  },
};

interface Row { n: number; payment: number; interest: number; principal: number; balance: number; date: string; }

function buildSchedule(balance: number, monthlyRate: number, fixedPayment: number | null, minRate: number, minFloor: number, maxMonths = 600): Row[] {
  const rows: Row[] = [];
  let bal = balance;
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1);
  for (let i = 1; i <= maxMonths && bal > 0.005; i++) {
    const interest = bal * monthlyRate;
    let pmt: number;
    if (fixedPayment !== null) {
      pmt = Math.min(fixedPayment, bal + interest);
    } else {
      pmt = Math.max(minFloor, bal * minRate);
      pmt = Math.min(pmt, bal + interest);
    }
    const principal = pmt - interest;
    bal = Math.max(0, bal - principal);
    rows.push({ n: i, payment: pmt, interest, principal, balance: bal, date: d.toLocaleDateString('en-CA') });
    d.setMonth(d.getMonth() + 1);
  }
  return rows;
}

function fmtMoney(n: number, locale: string) {
  const abs = Math.abs(n);
  if (locale === 'zh-CN') {
    if (abs >= 10_000) return (n / 10_000).toFixed(2) + '万';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  }
  if (locale === 'zh-TW') {
    if (abs >= 10_000) return (n / 10_000).toFixed(2) + '萬';
    return n.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
  }
  if (locale === 'ja') {
    if (abs >= 10_000) return (n / 10_000).toFixed(2) + '万';
    return Math.round(n).toLocaleString();
  }
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTableNum(n: number, locale: string) {
  const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (locale === 'en') ? '$' + s : s;
}

function fmtDuration(months: number, locale: string) {
  const y = Math.floor(months / 12), m = months % 12;
  if (locale === 'ja') return y > 0 ? `${y}年${m}ヶ月` : `${m}ヶ月`;
  if (locale === 'zh-CN') return y > 0 ? `${y}年${m}个月` : `${m}个月`;
  if (locale === 'zh-TW') return y > 0 ? `${y}年${m}個月` : `${m}個月`;
  return y > 0 ? `${y}y ${m}m` : `${m}m`;
}

export default function CreditCardPayoffTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const def = LOCALE_DEFAULTS[locale] || LOCALE_DEFAULTS.en;
  const [balance, setBalance] = useState(def.balance);
  const [apr, setApr] = useState(def.apr);
  const [payment, setPayment] = useState(def.payment);
  const [minRate, setMinRate] = useState(def.minRate);
  const [minFloor, setMinFloor] = useState(def.minFloor);
  const [showAll, setShowAll] = useState(false);
  const trackedRef = useRef(false);

  const computed = (() => {
    const B = parseFloat(balance);
    const r = parseFloat(apr) / 100 / 12;
    const pmt = parseFloat(payment);
    const mr = parseFloat(minRate) / 100;
    const mf = parseFloat(minFloor) || 25;
    if (!B || !r || B <= 0) return null;

    if (pmt <= B * r) return { tooLow: true, minNeeded: B * r + 0.01 };

    const initialMin = Math.max(mf, B * mr);
    const fixedBelowMin = pmt < initialMin;

    const fixedRows = buildSchedule(B, r, pmt, mr, mf);
    const minRows = buildSchedule(B, r, null, mr, mf);
    const neverPays = minRows.length >= 600;

    const totalFixed = fixedRows.reduce((s, row) => s + row.interest, 0);
    const totalMin = minRows.reduce((s, row) => s + row.interest, 0);

    return { fixedRows, minRows, neverPays, totalFixed, totalMin, r, initialMin, fixedBelowMin };
  })();

  useEffect(() => {
    if (computed && !('tooLow' in computed) && !trackedRef.current) {
      trackedRef.current = true; (window as any).__trackToolUsed?.(slug);
    }
  }, [computed, slug]);

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' };
  const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' };
  const tdStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right', color: 'var(--color-text)' };
  const thStyle: React.CSSProperties = { ...tdStyle, fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', position: 'sticky', top: 0 };

  const fixedRows = computed && !('tooLow' in computed) ? computed.fixedRows : [];
  const displayRows = showAll ? fixedRows : fixedRows.slice(0, 24);

  return (
    <div>
      <div style={card}>
        <div style={grid2}>
          <div><label style={lbl}>{t.balance}</label><input style={inp} type="number" min="0" step="100" value={balance} onChange={e => setBalance(e.target.value)} /></div>
          <div><label style={lbl}>{t.apr}</label><input style={inp} type="number" min="0" max="100" step="0.1" value={apr} onChange={e => setApr(e.target.value)} /></div>
          <div><label style={lbl}>{t.payment}</label><input style={inp} type="number" min="0" step="10" value={payment} onChange={e => setPayment(e.target.value)} /></div>
          <div><label style={lbl}>{t.min_rate}</label><input style={inp} type="number" min="1" max="30" step="0.5" value={minRate} onChange={e => setMinRate(e.target.value)} /></div>
          <div><label style={lbl}>{t.min_floor}</label><input style={inp} type="number" min="1" step="1" value={minFloor} onChange={e => setMinFloor(e.target.value)} /></div>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{t.rate_note}</p>
      </div>

      {computed && 'tooLow' in computed && (
        <div style={{ ...card, borderColor: '#ef4444', color: '#ef4444', fontSize: '0.9rem' }}>
          ⚠️ {t.too_low} ({fmtMoney(computed.minNeeded, locale)}{t.per_month})
        </div>
      )}

      {computed && !('tooLow' in computed) && (
        <>
          <div style={card}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.compare_title}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '360px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}> </th>
                    <th style={{ ...thStyle, color: 'var(--color-primary)' }}>{t.fixed_label}: {fmtMoney(parseFloat(payment), locale)}{t.per_month}</th>
                    <th style={thStyle}>{t.min_label}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.months}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>{fmtDuration(computed.fixedRows.length, locale)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{computed.neverPays ? '∞' : fmtDuration(computed.minRows.length, locale)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.total_interest}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>{fmtMoney(computed.totalFixed, locale)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{computed.neverPays ? '∞' : fmtMoney(computed.totalMin, locale)}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, borderBottom: 'none' }}>{t.total_paid}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)', borderBottom: 'none' }}>{fmtMoney(computed.fixedRows.reduce((s, r) => s + r.payment, 0), locale)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444', borderBottom: 'none' }}>{computed.neverPays ? '∞' : fmtMoney(computed.minRows.reduce((s, r) => s + r.payment, 0), locale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {computed.fixedBelowMin && (
              <p style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'rgba(245,158,11,0.08)', fontSize: '0.82rem', color: '#b45309' }}>
                ⚠️ {(t.payment_below_min || '').replace('{min}', fmtMoney(computed.initialMin, locale) + t.per_month)}
              </p>
            )}
            {!computed.neverPays && (() => {
              const interestDiff = computed.totalMin - computed.totalFixed;
              const saved = interestDiff >= 0;
              const timeDiff = computed.minRows.length - computed.fixedRows.length;
              return (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '6px', background: saved ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', fontSize: '0.85rem', color: saved ? '#16a34a' : '#ef4444' }}>
                  {saved ? t.interest_saved : t.interest_extra}: <strong>{fmtMoney(Math.abs(interestDiff), locale)}</strong>
                  {timeDiff > 0 && <> · {t.time_saved}: <strong>{fmtDuration(timeDiff, locale)}</strong></>}
                </div>
              );
            })()}
            {computed.neverPays && (
              <p style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', fontSize: '0.82rem', color: '#ef4444' }}>{t.never}</p>
            )}
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.schedule} — {t.fixed_label}</h3>
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '420px' }}>
                <thead>
                  <tr>{[t.month_col, t.payment_col, t.interest_col, t.principal_col, t.balance_col].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {displayRows.map(row => (
                    <tr key={row.n}>
                      <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)' }}>{row.n} <span style={{ fontSize: '0.7rem' }}>{row.date}</span></td>
                      <td style={tdStyle}>{fmtTableNum(row.payment, locale)}</td>
                      <td style={{ ...tdStyle, color: '#ef4444' }}>{fmtTableNum(row.interest, locale)}</td>
                      <td style={{ ...tdStyle, color: '#22c55e' }}>{fmtTableNum(row.principal, locale)}</td>
                      <td style={tdStyle}>{fmtTableNum(row.balance, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fixedRows.length > 24 && (
              <button onClick={() => setShowAll(!showAll)} style={{ marginTop: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.82rem' }}>
                {showAll ? t.show_less : `${t.show_all} (${fixedRows.length})`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
