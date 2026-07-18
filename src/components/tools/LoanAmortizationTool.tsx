import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

type Method = 'installment' | 'principal' | 'interest_only';

const i18n: Record<string, Record<string, string>> = {
  en: {
    loan: 'Loan Amount ($)', rate: 'Annual Interest Rate (%)', term: 'Loan Term (years)', start: 'Start Date',
    method_label: 'Repayment Method',
    method_installment: 'Equal Installment', method_principal: 'Equal Principal', method_interest_only: 'Interest Only + Balloon',
    installment_desc: 'Fixed monthly payment throughout the term',
    principal_desc: 'Fixed principal each month, interest decreases over time',
    interest_only_desc: 'Pay interest only; repay full principal at maturity',
    compare_title: 'Method Comparison',
    first_month: '1st Month', last_month: 'Last Month',
    monthly: 'Monthly Payment', total_payment: 'Total Payment', total_interest: 'Total Interest', interest_pct: 'Interest / Loan',
    schedule: 'Amortization Schedule', month: 'Month', payment: 'Payment', principal: 'Principal', interest: 'Interest', balance: 'Balance',
    download: 'Download CSV', show_all: 'Show All', show_less: 'Show Less',
    extra: 'Extra Monthly Payment ($)', savings: 'Interest Saved', months_saved: 'Months Saved',
    save_vs: 'saves vs Equal Installment', extra_vs: 'more than Equal Installment',
    best: 'Best', worst: 'Highest Cost',
  },
  'zh-CN': {
    loan: '贷款金额', rate: '年利率（%）', term: '贷款期限（年）', start: '起始日期',
    method_label: '还款方式',
    method_installment: '等额本息', method_principal: '等额本金', method_interest_only: '先息后本',
    installment_desc: '每月固定还款，前期利息多、本金少',
    principal_desc: '每月还固定本金，利息逐月递减，总利息更少',
    interest_only_desc: '还款期内只还利息，到期一次还清全部本金',
    compare_title: '还款方式对比',
    first_month: '首月还款', last_month: '末月还款',
    monthly: '月供金额', total_payment: '还款总额', total_interest: '总利息', interest_pct: '利息占比',
    schedule: '还款摊销明细', month: '期数', payment: '还款额', principal: '本金', interest: '利息', balance: '剩余本金',
    download: '下载 CSV', show_all: '显示全部', show_less: '收起',
    extra: '每月额外还款', savings: '节省利息', months_saved: '提前还清月数',
    save_vs: '较等额本息节省', extra_vs: '较等额本息多付',
    best: '最优', worst: '成本最高',
  },
  'zh-TW': {
    loan: '貸款金額', rate: '年利率（%）', term: '貸款期限（年）', start: '起始日期',
    method_label: '還款方式',
    method_installment: '等額本息', method_principal: '等額本金', method_interest_only: '先息後本',
    installment_desc: '每月固定還款，前期利息多、本金少',
    principal_desc: '每月還固定本金，利息逐月遞減，總利息更少',
    interest_only_desc: '還款期內只還利息，到期一次還清全部本金',
    compare_title: '還款方式對比',
    first_month: '首月還款', last_month: '末月還款',
    monthly: '每月還款額', total_payment: '還款總額', total_interest: '總利息', interest_pct: '利息佔比',
    schedule: '還款攤還明細', month: '期數', payment: '還款額', principal: '本金', interest: '利息', balance: '剩餘本金',
    download: '下載 CSV', show_all: '顯示全部', show_less: '收起',
    extra: '每月額外還款', savings: '節省利息', months_saved: '提前還清月數',
    save_vs: '較等額本息節省', extra_vs: '較等額本息多付',
    best: '最優', worst: '成本最高',
  },
  ja: {
    loan: 'ローン金額', rate: '年利率（%）', term: '返済期間（年）', start: '開始日',
    method_label: '返済方法',
    method_installment: '元利均等', method_principal: '元金均等', method_interest_only: '利息のみ＋一括',
    installment_desc: '毎月の返済額が一定',
    principal_desc: '毎月の元金が一定、利息は減少。総利息が少ない',
    interest_only_desc: '期間中は利息のみ返済、満期に元金を一括返済',
    compare_title: '返済方法の比較',
    first_month: '初月', last_month: '最終月',
    monthly: '月々の返済額', total_payment: '総返済額', total_interest: '総利息', interest_pct: '利息割合',
    schedule: '返済スケジュール', month: '回', payment: '返済額', principal: '元金', interest: '利息', balance: '残高',
    download: 'CSVダウンロード', show_all: 'すべて表示', show_less: '折りたたむ',
    extra: '毎月の追加返済', savings: '節約利息', months_saved: '短縮月数',
    save_vs: '元利均等より節約', extra_vs: '元利均等より多い',
    best: '最良', worst: '最高コスト',
  },
};

interface Row { n: number; payment: number; principal: number; interest: number; balance: number; date: string; }

function buildInstallmentSchedule(P: number, r: number, n: number, payment: number, extra: number, sd: Date): Row[] {
  const rows: Row[] = [];
  let balance = P;
  const d = new Date(sd);
  for (let i = 1; i <= n && balance > 0.005; i++) {
    const interestAmt = balance * r;
    let principalAmt = Math.min(payment - interestAmt + extra, balance);
    if (principalAmt < 0) principalAmt = 0;
    balance = Math.max(0, balance - principalAmt);
    rows.push({ n: i, payment: principalAmt + interestAmt, principal: principalAmt, interest: interestAmt, balance, date: d.toLocaleDateString('en-CA') });
    d.setMonth(d.getMonth() + 1);
  }
  return rows;
}

function buildPrincipalSchedule(P: number, r: number, n: number, sd: Date): Row[] {
  const rows: Row[] = [];
  const monthlyPrincipal = P / n;
  let balance = P;
  const d = new Date(sd);
  for (let i = 1; i <= n && balance > 0.005; i++) {
    const interestAmt = balance * r;
    const principalAmt = Math.min(monthlyPrincipal, balance);
    balance = Math.max(0, balance - principalAmt);
    rows.push({ n: i, payment: principalAmt + interestAmt, principal: principalAmt, interest: interestAmt, balance, date: d.toLocaleDateString('en-CA') });
    d.setMonth(d.getMonth() + 1);
  }
  return rows;
}

function buildInterestOnlySchedule(P: number, r: number, n: number, sd: Date): Row[] {
  const rows: Row[] = [];
  const monthlyInterest = P * r;
  const d = new Date(sd);
  for (let i = 1; i <= n; i++) {
    const isLast = i === n;
    const principalAmt = isLast ? P : 0;
    const balance = isLast ? 0 : P;
    rows.push({ n: i, payment: principalAmt + monthlyInterest, principal: principalAmt, interest: monthlyInterest, balance, date: d.toLocaleDateString('en-CA') });
    d.setMonth(d.getMonth() + 1);
  }
  return rows;
}

function fmtUsd(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtTableNum(n: number, locale: string) {
  const dec = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (locale === 'zh-CN' || locale === 'zh-TW' || locale === 'ja') ? dec : '$' + dec;
}
function fmtMoney(n: number, locale: string) {
  const abs = Math.abs(n);
  if (locale === 'zh-CN') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(1) + '亿';
    if (abs >= 10_000) return (n / 10_000).toFixed(1) + '万';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  }
  if (locale === 'zh-TW') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(1) + '億';
    if (abs >= 10_000) return (n / 10_000).toFixed(1) + '萬';
    return n.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
  }
  if (locale === 'ja') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(1) + '億';
    if (abs >= 10_000) return (n / 10_000).toFixed(1) + '万';
    return Math.round(n).toLocaleString();
  }
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return fmtUsd(n);
}
function fmtPct(n: number) { return n.toFixed(1) + '%'; }

export default function LoanAmortizationTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const loanDefault = locale === 'zh-CN' ? '1000000' : locale === 'zh-TW' ? '8000000' : locale === 'ja' ? '30000000' : '300000';
  const rateDefault = locale === 'zh-CN' ? '3.65' : locale === 'zh-TW' ? '2.0' : locale === 'ja' ? '0.8' : '6.5';
  const termDefault = locale === 'ja' ? '35' : '30';

  const [loan, setLoan] = useState(loanDefault);
  const [rate, setRate] = useState(rateDefault);
  const [term, setTerm] = useState(termDefault);
  const [extra, setExtra] = useState('0');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  });
  const [method, setMethod] = useState<Method>('installment');
  const [showAll, setShowAll] = useState(false);
  const trackedRef = useRef(false);

  const computed = (() => {
    const P = parseFloat(loan);
    const r = parseFloat(rate) / 100 / 12;
    const n = parseFloat(term) * 12;
    const ex = parseFloat(extra) || 0;
    if (!P || !r || !n || P <= 0 || n <= 0) return null;
    const sd = new Date(startDate + '-01');

    const payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const rowsI = buildInstallmentSchedule(P, r, n, payment, 0, sd);
    const rowsIExtra = ex > 0 ? buildInstallmentSchedule(P, r, n, payment, ex, sd) : null;
    const rowsP = buildPrincipalSchedule(P, r, n, sd);
    const rowsIO = buildInterestOnlySchedule(P, r, n, sd);

    const sum = (rows: Row[], key: keyof Row) => rows.reduce((s, r) => s + (r[key] as number), 0);

    const iTotalInterest = sum(rowsI, 'interest');
    const pTotalInterest = sum(rowsP, 'interest');
    const ioTotalInterest = sum(rowsIO, 'interest');

    return {
      installment: {
        rows: rowsI, rowsExtra: rowsIExtra,
        firstPayment: rowsI[0]?.payment ?? 0,
        lastPayment: rowsI[rowsI.length - 1]?.payment ?? 0,
        totalPayment: sum(rowsI, 'payment'),
        totalInterest: iTotalInterest,
        interestSaved: rowsIExtra ? iTotalInterest - sum(rowsIExtra, 'interest') : 0,
        monthsSaved: rowsIExtra ? rowsI.length - rowsIExtra.length : 0,
      },
      principal: {
        rows: rowsP,
        firstPayment: rowsP[0]?.payment ?? 0,
        lastPayment: rowsP[rowsP.length - 1]?.payment ?? 0,
        totalPayment: sum(rowsP, 'payment'),
        totalInterest: pTotalInterest,
        savedVsInstallment: iTotalInterest - pTotalInterest,
      },
      interest_only: {
        rows: rowsIO,
        firstPayment: rowsIO[0]?.payment ?? 0,
        lastPayment: rowsIO[rowsIO.length - 1]?.payment ?? 0,
        totalPayment: sum(rowsIO, 'payment'),
        totalInterest: ioTotalInterest,
        extraVsInstallment: ioTotalInterest - iTotalInterest,
      },
      P,
    };
  })();

  useEffect(() => {
    if (computed && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [computed, slug]);

  const activeRows = computed ? (
    method === 'installment' ? (computed.installment.rowsExtra || computed.installment.rows) :
    method === 'principal' ? computed.principal.rows :
    computed.interest_only.rows
  ) : [];
  const displayRows = showAll ? activeRows : activeRows.slice(0, 24);

  const downloadCSV = () => {
    if (!computed) return;
    const header = [t.month, t.payment, t.principal, t.interest, t.balance].join(',');
    const csvRows = activeRows.map((r) =>
      [r.n, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)].join(',')
    );
    const blob = new Blob([header + '\n' + csvRows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `amortization_${method}_${loan}_${rate}pct_${term}yr.csv`; a.click();
  };

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' };
  const inp: React.CSSProperties = { padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem', marginBottom: '0.75rem' };
  const tdStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', textAlign: 'right' };
  const thStyle: React.CSSProperties = { ...tdStyle, fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-bg)', position: 'sticky', top: 0 };

  const methods: { key: Method; label: string; desc: string }[] = [
    { key: 'installment', label: t.method_installment, desc: t.installment_desc },
    { key: 'principal', label: t.method_principal, desc: t.principal_desc },
    { key: 'interest_only', label: t.method_interest_only, desc: t.interest_only_desc },
  ];

  return (
    <div>
      {/* 输入卡片 */}
      <div style={card}>
        <div style={grid2}>
          <div><label style={lbl}>{t.loan}</label><input style={inp} type="number" min="1000" step="1000" value={loan} onChange={(e) => setLoan(e.target.value)} /></div>
          <div><label style={lbl}>{t.rate}</label><input style={inp} type="number" min="0.1" max="30" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div><label style={lbl}>{t.term}</label><input style={inp} type="number" min="1" max="50" value={term} onChange={(e) => setTerm(e.target.value)} /></div>
          <div><label style={lbl}>{t.start}</label><input style={{ ...inp, width: 'auto' }} type="month" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        </div>

        {/* 还款方式选择 */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>{t.method_label}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {methods.map((m) => (
              <button key={m.key} onClick={() => setMethod(m.key)} style={{
                padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                border: method === m.key ? 'none' : '1px solid var(--color-border)',
                background: method === m.key ? 'var(--color-primary)' : 'var(--color-card-bg)',
                color: method === m.key ? '#fff' : 'var(--color-text)',
              }}>{m.label}</button>
            ))}
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            {methods.find(m => m.key === method)?.desc}
          </p>
        </div>

        {/* 额外还款（仅等额本息） */}
        {method === 'installment' && (
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>{t.extra}</label>
            <input style={{ ...inp, maxWidth: '200px' }} type="number" min="0" step="50" value={extra} onChange={(e) => setExtra(e.target.value)} />
          </div>
        )}
      </div>

      {computed && (
        <>
          {/* 三种方式对比表 */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.compare_title}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}> </th>
                    {methods.map((m) => (
                      <th key={m.key} style={{ ...thStyle, color: method === m.key ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={() => setMethod(m.key)}>
                        {m.label}{method === m.key ? ' ●' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 首月还款 */}
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.first_month}</td>
                    <td style={tdStyle}>{fmtMoney(computed.installment.firstPayment, locale)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{fmtMoney(computed.principal.firstPayment, locale)}</td>
                    <td style={{ ...tdStyle, color: '#22c55e' }}>{fmtMoney(computed.interest_only.firstPayment, locale)}</td>
                  </tr>
                  {/* 末月还款 */}
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.last_month}</td>
                    <td style={tdStyle}>{fmtMoney(computed.installment.lastPayment, locale)}</td>
                    <td style={{ ...tdStyle, color: '#22c55e' }}>{fmtMoney(computed.principal.lastPayment, locale)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{fmtMoney(computed.interest_only.lastPayment, locale)}</td>
                  </tr>
                  {/* 总利息 */}
                  <tr style={{ background: 'rgba(59,130,246,0.04)' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.total_interest}</td>
                    <td style={tdStyle}>{fmtMoney(computed.installment.totalInterest, locale)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#22c55e' }}>
                      {fmtMoney(computed.principal.totalInterest, locale)}
                      <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>▼ {fmtMoney(computed.principal.savedVsInstallment, locale)} {t.save_vs}</div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#ef4444' }}>
                      {fmtMoney(computed.interest_only.totalInterest, locale)}
                      <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>▲ {fmtMoney(computed.interest_only.extraVsInstallment, locale)} {t.extra_vs}</div>
                    </td>
                  </tr>
                  {/* 总还款额 */}
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{t.total_payment}</td>
                    <td style={tdStyle}>{fmtMoney(computed.installment.totalPayment, locale)}</td>
                    <td style={{ ...tdStyle, color: '#22c55e' }}>{fmtMoney(computed.principal.totalPayment, locale)}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{fmtMoney(computed.interest_only.totalPayment, locale)}</td>
                  </tr>
                  {/* 利息占比 */}
                  <tr>
                    <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 500, borderBottom: 'none' }}>{t.interest_pct}</td>
                    <td style={{ ...tdStyle, borderBottom: 'none' }}>{fmtPct(computed.installment.totalInterest / computed.P * 100)}</td>
                    <td style={{ ...tdStyle, borderBottom: 'none', color: '#22c55e' }}>{fmtPct(computed.principal.totalInterest / computed.P * 100)}</td>
                    <td style={{ ...tdStyle, borderBottom: 'none', color: '#ef4444' }}>{fmtPct(computed.interest_only.totalInterest / computed.P * 100)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 当前方式汇总 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {method === 'installment' && (() => {
              const d = computed.installment;
              return <>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '2px solid var(--color-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.monthly}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{fmtMoney(d.firstPayment, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.total_interest}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(d.totalInterest, locale)}</div>
                </div>
                {d.interestSaved > 0 && <>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #22c55e', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.savings}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>{fmtMoney(d.interestSaved, locale)}</div>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #22c55e', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.months_saved}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>{d.monthsSaved}</div>
                  </div>
                </>}
              </>;
            })()}
            {method === 'principal' && (() => {
              const d = computed.principal;
              return <>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '2px solid var(--color-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.first_month}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{fmtMoney(d.firstPayment, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.last_month}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>{fmtMoney(d.lastPayment, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #22c55e', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.total_interest}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>{fmtMoney(d.totalInterest, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #22c55e', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.save_vs}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>{fmtMoney(d.savedVsInstallment, locale)}</div>
                </div>
              </>;
            })()}
            {method === 'interest_only' && (() => {
              const d = computed.interest_only;
              return <>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '2px solid var(--color-primary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.monthly}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)' }}>{fmtMoney(d.firstPayment, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #ef4444', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.last_month}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(d.lastPayment, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #ef4444', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.total_interest}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(d.totalInterest, locale)}</div>
                </div>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid #ef4444', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.extra_vs}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(d.extraVsInstallment, locale)}</div>
                </div>
              </>;
            })()}
          </div>

          {/* 明细表 */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)' }}>{t.schedule}</h3>
              <button onClick={downloadCSV} style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.82rem' }}>{t.download}</button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: showAll ? '60vh' : '400px', overflowY: 'auto', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                <thead>
                  <tr>{[t.month, t.payment, t.principal, t.interest, t.balance].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.n} style={{ background: row.n % 12 === 0 ? 'rgba(59,130,246,0.05)' : undefined }}>
                      <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--color-text-secondary)' }}>{row.n} <span style={{ fontSize: '0.7rem' }}>{row.date}</span></td>
                      <td style={tdStyle}>{fmtTableNum(row.payment, locale)}</td>
                      <td style={{ ...tdStyle, color: '#22c55e' }}>{fmtTableNum(row.principal, locale)}</td>
                      <td style={{ ...tdStyle, color: '#ef4444' }}>{fmtTableNum(row.interest, locale)}</td>
                      <td style={tdStyle}>{fmtTableNum(row.balance, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activeRows.length > 24 && (
              <button onClick={() => setShowAll(!showAll)} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
                {showAll ? t.show_less : `${t.show_all} (${activeRows.length})`}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
