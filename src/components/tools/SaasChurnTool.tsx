import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    title: 'SaaS Churn Calculator',
    tab_churn: 'Churn Rate',
    tab_mrr: 'MRR Churn',
    tab_impact: 'Revenue Impact',
    // Churn Rate tab
    customers_start: 'Customers at Start of Period',
    customers_lost: 'Customers Lost',
    customers_end: 'Customers at End of Period',
    new_customers: 'New Customers Added',
    period: 'Period',
    period_monthly: 'Monthly',
    period_annual: 'Annual',
    churn_rate: 'Churn Rate',
    retention_rate: 'Retention Rate',
    // MRR tab
    mrr_start: 'MRR at Start ($)',
    mrr_lost: 'MRR Lost to Churn ($)',
    mrr_expansion: 'Expansion MRR ($)',
    mrr_new: 'New MRR ($)',
    mrr_churn_rate: 'MRR Churn Rate',
    net_mrr_churn: 'Net MRR Churn Rate',
    net_revenue_retention: 'Net Revenue Retention (NRR)',
    gross_revenue_retention: 'Gross Revenue Retention (GRR)',
    // Impact tab
    current_mrr: 'Current MRR ($)',
    current_churn: 'Monthly Churn Rate (%)',
    months: 'Projection (months)',
    avg_revenue: 'Avg Revenue per Customer ($)',
    customers_now: 'Current Customers',
    project: 'Calculate Impact',
    lost_mrr_month: 'MRR Lost per Month',
    lost_arr: 'Annual Revenue at Risk',
    customers_12m: 'Customers After 12 Months',
    mrr_12m: 'MRR After 12 Months',
    break_even_cac: 'Max CAC to Break Even',
    // Common
    calculate: 'Calculate',
    result: 'Result',
    formula: 'Formula',
    hint_churn: 'Industry benchmark: <5% monthly is good for SMB SaaS, <1% for enterprise.',
    hint_nrr: 'NRR > 100% means expansion revenue covers churn — best-in-class SaaS.',
  },
  'zh-CN': {
    title: 'SaaS 流失率计算器',
    tab_churn: '流失率',
    tab_mrr: 'MRR 流失',
    tab_impact: '收入影响',
    customers_start: '期初客户数',
    customers_lost: '流失客户数',
    customers_end: '期末客户数',
    new_customers: '新增客户数',
    period: '周期',
    period_monthly: '月度',
    period_annual: '年度',
    churn_rate: '流失率',
    retention_rate: '留存率',
    mrr_start: '期初 MRR',
    mrr_lost: '流失 MRR',
    mrr_expansion: '扩张 MRR',
    mrr_new: '新增 MRR',
    mrr_churn_rate: 'MRR 流失率',
    net_mrr_churn: '净 MRR 流失率',
    net_revenue_retention: '净收入留存率（NRR）',
    gross_revenue_retention: '总收入留存率（GRR）',
    current_mrr: '当前 MRR',
    current_churn: '月流失率（%）',
    months: '预测周期（月）',
    avg_revenue: '客均收入',
    customers_now: '当前客户数',
    project: '计算影响',
    lost_mrr_month: '每月流失 MRR',
    lost_arr: '年化流失收入',
    customers_12m: '12 个月后客户数',
    mrr_12m: '12 个月后 MRR',
    break_even_cac: '盈亏平衡最大 CAC',
    calculate: '计算',
    result: '结果',
    formula: '公式',
    hint_churn: '行业参考：SMB SaaS 月流失率 <5% 为良好，企业级 SaaS <1%。',
    hint_nrr: 'NRR > 100% 意味着扩张收入覆盖了流失，这是一流 SaaS 的标志。',
  },
  'zh-TW': {
    title: 'SaaS 流失率計算器',
    tab_churn: '流失率',
    tab_mrr: 'MRR 流失',
    tab_impact: '收入影響',
    customers_start: '期初客戶數',
    customers_lost: '流失客戶數',
    customers_end: '期末客戶數',
    new_customers: '新增客戶數',
    period: '週期',
    period_monthly: '月度',
    period_annual: '年度',
    churn_rate: '流失率',
    retention_rate: '留存率',
    mrr_start: '期初 MRR',
    mrr_lost: '流失 MRR',
    mrr_expansion: '擴張 MRR',
    mrr_new: '新增 MRR',
    mrr_churn_rate: 'MRR 流失率',
    net_mrr_churn: '淨 MRR 流失率',
    net_revenue_retention: '淨收入留存率（NRR）',
    gross_revenue_retention: '總收入留存率（GRR）',
    current_mrr: '當前 MRR',
    current_churn: '月流失率（%）',
    months: '預測週期（月）',
    avg_revenue: '客均收入',
    customers_now: '當前客戶數',
    project: '計算影響',
    lost_mrr_month: '每月流失 MRR',
    lost_arr: '年化流失收入',
    customers_12m: '12 個月後客戶數',
    mrr_12m: '12 個月後 MRR',
    break_even_cac: '損益平衡最大 CAC',
    calculate: '計算',
    result: '結果',
    formula: '公式',
    hint_churn: '行業參考：SMB SaaS 月流失率 <5% 為良好，企業級 SaaS <1%。',
    hint_nrr: 'NRR > 100% 意味著擴張收入覆蓋了流失，這是一流 SaaS 的標誌。',
  },
  ja: {
    title: 'SaaSチャーン計算ツール',
    tab_churn: 'チャーン率',
    tab_mrr: 'MRRチャーン',
    tab_impact: '収益影響',
    customers_start: '期首顧客数',
    customers_lost: '解約顧客数',
    customers_end: '期末顧客数',
    new_customers: '新規顧客数',
    period: '期間',
    period_monthly: '月次',
    period_annual: '年次',
    churn_rate: 'チャーン率',
    retention_rate: '継続率',
    mrr_start: '期首MRR',
    mrr_lost: 'チャーンMRR',
    mrr_expansion: '拡張MRR',
    mrr_new: '新規MRR',
    mrr_churn_rate: 'MRRチャーン率',
    net_mrr_churn: '純MRRチャーン率',
    net_revenue_retention: '純収益維持率（NRR）',
    gross_revenue_retention: '総収益維持率（GRR）',
    current_mrr: '現在のMRR',
    current_churn: '月次チャーン率（%）',
    months: '予測期間（ヶ月）',
    avg_revenue: '顧客平均収益',
    customers_now: '現在の顧客数',
    project: '影響を計算',
    lost_mrr_month: '月次流出MRR',
    lost_arr: '年間リスク収益',
    customers_12m: '12ヶ月後の顧客数',
    mrr_12m: '12ヶ月後のMRR',
    break_even_cac: '損益分岐最大CAC',
    calculate: '計算',
    result: '結果',
    formula: '計算式',
    hint_churn: '業界目安：SMB SaaSは月5%未満、エンタープライズは1%未満が良好。',
    hint_nrr: 'NRR > 100%は拡張収益がチャーンを上回ることを意味し、トップクラスのSaaSの指標です。',
  },
};

type Tab = 'churn' | 'mrr' | 'impact';

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtPct(n: number) { return fmt(n, 2) + '%'; }
function fmtUsd(n: number) { return '$' + fmt(n, 0); }
function fmtMoney(n: number, locale: string) {
  const abs = Math.abs(n);
  if (locale === 'zh-CN') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(1) + '亿';
    if (abs >= 10_000) return (n / 10_000).toFixed(1) + '万';
    return Math.round(n).toLocaleString();
  }
  if (locale === 'zh-TW') {
    if (abs >= 100_000_000) return (n / 100_000_000).toFixed(1) + '億';
    if (abs >= 10_000) return (n / 10_000).toFixed(1) + '萬';
    return Math.round(n).toLocaleString();
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

export default function SaasChurnTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [tab, setTab] = useState<Tab>('churn');
  const trackedRef = useRef(false);

  // --- Churn Rate tab ---
  const [custStart, setCustStart] = useState('1000');
  const [custLost, setCustLost] = useState('50');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');

  const churnResult = (() => {
    const s = parseFloat(custStart);
    const l = parseFloat(custLost);
    if (!s || isNaN(l) || s <= 0) return null;
    const churn = (l / s) * 100;
    const retention = 100 - churn;
    const annualChurn = period === 'monthly' ? (1 - Math.pow(1 - churn / 100, 12)) * 100 : churn;
    const annualRetention = 100 - annualChurn;
    return { churn, retention, annualChurn, annualRetention };
  })();

  // --- MRR Churn tab ---
  const [mrrStart, setMrrStart] = useState('100000');
  const [mrrLost, setMrrLost] = useState('3000');
  const [mrrExpansion, setMrrExpansion] = useState('2000');
  const [mrrNew, setMrrNew] = useState('5000');

  const mrrResult = (() => {
    const s = parseFloat(mrrStart);
    const l = parseFloat(mrrLost);
    const ex = parseFloat(mrrExpansion) || 0;
    if (!s || isNaN(l) || s <= 0) return null;
    const mrrChurn = (l / s) * 100;
    const netChurn = ((l - ex) / s) * 100;
    const grr = ((s - l) / s) * 100;
    const nrr = ((s - l + ex) / s) * 100;
    return { mrrChurn, netChurn, grr, nrr };
  })();

  // --- Revenue Impact tab ---
  const [curMrr, setCurMrr] = useState('50000');
  const [curChurn, setCurChurn] = useState('3');
  const [projMonths, setProjMonths] = useState('12');
  const [avgRev, setAvgRev] = useState('500');
  const [custNow, setCustNow] = useState('100');

  const impactResult = (() => {
    const mrr = parseFloat(curMrr);
    const churn = parseFloat(curChurn) / 100;
    const months = parseInt(projMonths) || 12;
    const avg = parseFloat(avgRev);
    const cust = parseFloat(custNow);
    if (!mrr || isNaN(churn) || churn <= 0) return null;
    const lostMrrMonth = mrr * churn;
    const lostArr = lostMrrMonth * 12;
    const custAfter = avg && cust ? cust * Math.pow(1 - churn, months) : null;
    const mrrAfter = mrr * Math.pow(1 - churn, months);
    const ltv = avg && churn ? avg / churn : null;
    return { lostMrrMonth, lostArr, custAfter, mrrAfter, ltv };
  })();

  useEffect(() => {
    const hasResult = (tab === 'churn' && churnResult) || (tab === 'mrr' && mrrResult) || (tab === 'impact' && impactResult);
    if (hasResult && !trackedRef.current) {
      trackedRef.current = true;
      (window as any).__trackToolUsed?.(slug);
    }
  }, [churnResult, mrrResult, impactResult, tab, slug]);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const input: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    fontSize: '0.95rem', width: '100%', boxSizing: 'border-box',
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)',
  };
  const resultBox: React.CSSProperties = {
    background: 'var(--color-bg)', border: '1px solid var(--color-primary)',
    borderRadius: '10px', padding: '1rem', marginTop: '1rem',
  };
  const metricRow: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)',
  };
  const bigNum: React.CSSProperties = { fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem', marginBottom: '0.75rem' };
  const hint: React.CSSProperties = {
    fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem',
    padding: '0.6rem 0.75rem', background: 'var(--color-bg)', borderRadius: '6px',
    borderLeft: '3px solid var(--color-primary)',
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'churn', label: t.tab_churn },
    { key: 'mrr', label: t.tab_mrr },
    { key: 'impact', label: t.tab_impact },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
              border: tab === tb.key ? 'none' : '1px solid var(--color-border)',
              background: tab === tb.key ? 'var(--color-primary)' : 'var(--color-card-bg)',
              color: tab === tb.key ? '#fff' : 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Churn Rate ── */}
      {tab === 'churn' && (
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={label}>{t.customers_start}</label>
              <input style={input} type="number" min="1" value={custStart}
                onChange={(e) => setCustStart(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.customers_lost}</label>
              <input style={input} type="number" min="0" value={custLost}
                onChange={(e) => setCustLost(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={label}>{t.period}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['monthly', 'annual'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem',
                  border: period === p ? 'none' : '1px solid var(--color-border)',
                  background: period === p ? 'var(--color-primary)' : 'var(--color-card-bg)',
                  color: period === p ? '#fff' : 'var(--color-text)', cursor: 'pointer',
                }}>
                  {p === 'monthly' ? t.period_monthly : t.period_annual}
                </button>
              ))}
            </div>
          </div>

          {churnResult && (
            <div style={resultBox}>
              <div style={{ ...metricRow, borderBottom: '2px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.churn_rate}</span>
                <span style={{ ...bigNum, color: churnResult.churn > 5 ? '#ef4444' : churnResult.churn > 2 ? '#f59e0b' : '#22c55e' }}>
                  {fmtPct(churnResult.churn)}
                </span>
              </div>
              <div style={metricRow}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.retention_rate}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtPct(churnResult.retention)}</span>
              </div>
              {period === 'monthly' && (
                <>
                  <div style={metricRow}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      {locale === 'en' ? 'Annual Churn Rate' : locale === 'ja' ? '年間チャーン率' : '年化流失率'}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtPct(churnResult.annualChurn)}</span>
                  </div>
                  <div style={{ ...metricRow, borderBottom: 'none' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      {locale === 'en' ? 'Annual Retention' : locale === 'ja' ? '年間継続率' : '年化留存率'}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtPct(churnResult.annualRetention)}</span>
                  </div>
                </>
              )}
              <p style={hint}>{t.hint_churn}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: MRR Churn ── */}
      {tab === 'mrr' && (
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={label}>{t.mrr_start}</label>
              <input style={input} type="number" min="0" value={mrrStart}
                onChange={(e) => setMrrStart(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.mrr_lost}</label>
              <input style={input} type="number" min="0" value={mrrLost}
                onChange={(e) => setMrrLost(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.mrr_expansion}</label>
              <input style={input} type="number" min="0" value={mrrExpansion}
                onChange={(e) => setMrrExpansion(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.mrr_new}</label>
              <input style={input} type="number" min="0" value={mrrNew}
                onChange={(e) => setMrrNew(e.target.value)} />
            </div>
          </div>

          {mrrResult && (
            <div style={resultBox}>
              <div style={metricRow}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.net_revenue_retention}</span>
                <span style={{ ...bigNum, color: mrrResult.nrr >= 100 ? '#22c55e' : mrrResult.nrr >= 90 ? '#f59e0b' : '#ef4444' }}>
                  {fmtPct(mrrResult.nrr)}
                </span>
              </div>
              <div style={metricRow}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.gross_revenue_retention}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtPct(mrrResult.grr)}</span>
              </div>
              <div style={metricRow}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.mrr_churn_rate}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtPct(mrrResult.mrrChurn)}</span>
              </div>
              <div style={{ ...metricRow, borderBottom: 'none' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.net_mrr_churn}</span>
                <span style={{ fontWeight: 600, color: mrrResult.netChurn < 0 ? '#22c55e' : 'var(--color-text)' }}>
                  {fmtPct(mrrResult.netChurn)}
                </span>
              </div>
              <p style={hint}>{t.hint_nrr}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Revenue Impact ── */}
      {tab === 'impact' && (
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={label}>{t.current_mrr}</label>
              <input style={input} type="number" min="0" value={curMrr}
                onChange={(e) => setCurMrr(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.current_churn}</label>
              <input style={input} type="number" min="0" max="100" step="0.1" value={curChurn}
                onChange={(e) => setCurChurn(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.avg_revenue}</label>
              <input style={input} type="number" min="0" value={avgRev}
                onChange={(e) => setAvgRev(e.target.value)} />
            </div>
            <div>
              <label style={label}>{t.customers_now}</label>
              <input style={input} type="number" min="0" value={custNow}
                onChange={(e) => setCustNow(e.target.value)} />
            </div>
          </div>

          {impactResult && (
            <div style={resultBox}>
              <div style={metricRow}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.lost_mrr_month}</span>
                <span style={{ ...bigNum, color: '#ef4444' }}>{fmtMoney(impactResult.lostMrrMonth, locale)}</span>
              </div>
              <div style={metricRow}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.lost_arr}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtMoney(impactResult.lostArr, locale)}</span>
              </div>
              {impactResult.custAfter !== null && (
                <div style={metricRow}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.customers_12m}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                    {Math.round(impactResult.custAfter).toLocaleString()}
                  </span>
                </div>
              )}
              <div style={metricRow}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.mrr_12m}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtMoney(impactResult.mrrAfter, locale)}</span>
              </div>
              {impactResult.ltv !== null && (
                <div style={{ ...metricRow, borderBottom: 'none' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {locale === 'en' ? 'Avg Customer LTV' : locale === 'ja' ? '平均LTV' : '平均客户 LTV'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>{fmtMoney(impactResult.ltv, locale)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
