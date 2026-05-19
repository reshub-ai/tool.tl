import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    tab_ltv: 'LTV',
    tab_cac: 'CAC & Ratio',
    tab_cohort: 'Payback Period',
    // LTV tab
    avg_revenue: 'Avg Monthly Revenue per Customer ($)',
    gross_margin: 'Gross Margin (%)',
    churn_rate: 'Monthly Churn Rate (%)',
    ltv: 'Customer Lifetime Value (LTV)',
    avg_lifetime: 'Avg Customer Lifetime',
    months_unit: 'months',
    gross_ltv: 'Gross LTV',
    net_ltv: 'Net LTV (after margin)',
    // CAC tab
    sales_marketing: 'Sales & Marketing Spend ($)',
    new_customers: 'New Customers Acquired',
    cac: 'Customer Acquisition Cost (CAC)',
    ltv_cac_ratio: 'LTV:CAC Ratio',
    hint_ratio: 'LTV:CAC > 3:1 is healthy. > 5:1 may mean under-investing in growth.',
    hint_ltv: 'LTV = ARPU × Gross Margin % ÷ Monthly Churn Rate',
    // Payback tab
    mrr_per_customer: 'MRR per Customer ($)',
    cac_input: 'CAC ($)',
    gross_margin_pb: 'Gross Margin (%)',
    payback_months: 'CAC Payback Period',
    payback_hint: 'Best-in-class SaaS targets < 12 months payback. > 18 months is a concern.',
    // Common
    result: 'Result',
    benchmark: 'Benchmark',
    good: 'Good',
    warning: 'Review',
    bad: 'Needs work',
  },
  'zh-CN': {
    tab_ltv: 'LTV',
    tab_cac: 'CAC & 比率',
    tab_cohort: '回收周期',
    avg_revenue: '每客户月均收入',
    gross_margin: '毛利率（%）',
    churn_rate: '月流失率（%）',
    ltv: '客户终身价值（LTV）',
    avg_lifetime: '平均客户生命周期',
    months_unit: '个月',
    gross_ltv: '总 LTV',
    net_ltv: '净 LTV（考虑毛利率后）',
    sales_marketing: '销售 & 市场支出',
    new_customers: '新增客户数',
    cac: '客户获取成本（CAC）',
    ltv_cac_ratio: 'LTV:CAC 比率',
    hint_ratio: 'LTV:CAC > 3:1 为健康水平，> 5:1 可能意味着增长投入不足。',
    hint_ltv: 'LTV = 客均 ARPU × 毛利率 ÷ 月流失率',
    mrr_per_customer: '每客户 MRR',
    cac_input: 'CAC',
    gross_margin_pb: '毛利率（%）',
    payback_months: 'CAC 回收周期',
    payback_hint: '一流 SaaS 的目标是回收期 < 12 个月，> 18 个月需要关注。',
    result: '结果',
    benchmark: '行业参考',
    good: '良好',
    warning: '待改善',
    bad: '需关注',
  },
  'zh-TW': {
    tab_ltv: 'LTV',
    tab_cac: 'CAC & 比率',
    tab_cohort: '回收期',
    avg_revenue: '每位客戶月均收入',
    gross_margin: '毛利率（%）',
    churn_rate: '月流失率（%）',
    ltv: '客戶終身價值（LTV）',
    avg_lifetime: '平均客戶生命週期',
    months_unit: '個月',
    gross_ltv: '總 LTV',
    net_ltv: '淨 LTV（考慮毛利率後）',
    sales_marketing: '銷售 & 行銷支出',
    new_customers: '新增客戶數',
    cac: '客戶獲取成本（CAC）',
    ltv_cac_ratio: 'LTV:CAC 比率',
    hint_ratio: 'LTV:CAC > 3:1 為健康水準，> 5:1 可能代表成長投入不足。',
    hint_ltv: 'LTV = 每客戶 ARPU × 毛利率 ÷ 月流失率',
    mrr_per_customer: '每位客戶 MRR',
    cac_input: 'CAC',
    gross_margin_pb: '毛利率（%）',
    payback_months: 'CAC 回收期',
    payback_hint: '一流 SaaS 目標回收期 < 12 個月，> 18 個月需要關注。',
    result: '結果',
    benchmark: '產業參考',
    good: '良好',
    warning: '待改善',
    bad: '需關注',
  },
  ja: {
    tab_ltv: 'LTV',
    tab_cac: 'CAC・比率',
    tab_cohort: '回収期間',
    avg_revenue: '顧客あたり月次収益',
    gross_margin: '粗利率（%）',
    churn_rate: '月次チャーン率（%）',
    ltv: '顧客生涯価値（LTV）',
    avg_lifetime: '平均顧客継続期間',
    months_unit: 'ヶ月',
    gross_ltv: 'グロスLTV',
    net_ltv: 'ネットLTV（粗利考慮後）',
    sales_marketing: '営業・マーケ費用',
    new_customers: '新規獲得顧客数',
    cac: '顧客獲得コスト（CAC）',
    ltv_cac_ratio: 'LTV:CAC比率',
    hint_ratio: 'LTV:CAC > 3:1が健全。> 5:1は成長投資不足の可能性。',
    hint_ltv: 'LTV = ARPU × 粗利率 ÷ 月次チャーン率',
    mrr_per_customer: '顧客あたりMRR',
    cac_input: 'CAC',
    gross_margin_pb: '粗利率（%）',
    payback_months: 'CAC回収期間',
    payback_hint: 'トップクラスのSaaSは12ヶ月未満を目標。18ヶ月超は要注意。',
    result: '結果',
    benchmark: '業界目安',
    good: '良好',
    warning: '要改善',
    bad: '要注意',
  },
};

type Tab = 'ltv' | 'cac' | 'cohort';

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
  return '$' + n.toFixed(0);
}
function fmtRatio(n: number) { return n.toFixed(1) + ':1'; }

export default function LtvCalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [tab, setTab] = useState<Tab>('ltv');
  const trackedRef = useRef(false);

  // LTV inputs
  const [arpu, setArpu] = useState('500');
  const [margin, setMargin] = useState('75');
  const [churn, setChurn] = useState('3');

  // CAC inputs
  const [spend, setSpend] = useState('50000');
  const [acquired, setAcquired] = useState('25');

  // Payback inputs
  const [mrrPerCust, setMrrPerCust] = useState('500');
  const [cacInput, setCacInput] = useState('2000');
  const [marginPb, setMarginPb] = useState('75');

  const ltvResult = (() => {
    const a = parseFloat(arpu);
    const m = parseFloat(margin) / 100;
    const c = parseFloat(churn) / 100;
    if (!a || !m || !c || c <= 0) return null;
    const lifetime = 1 / c;
    const grossLtv = a * lifetime;
    const netLtv = grossLtv * m;
    return { lifetime, grossLtv, netLtv };
  })();

  const cacResult = (() => {
    const s = parseFloat(spend);
    const n = parseFloat(acquired);
    if (!s || !n || n <= 0) return null;
    const cac = s / n;
    const ratio = ltvResult ? ltvResult.netLtv / cac : null;
    return { cac, ratio };
  })();

  const paybackResult = (() => {
    const mrr = parseFloat(mrrPerCust);
    const cac = parseFloat(cacInput);
    const m = parseFloat(marginPb) / 100;
    if (!mrr || !cac || !m || mrr * m <= 0) return null;
    const months = cac / (mrr * m);
    return { months };
  })();

  useEffect(() => {
    const hasResult = (tab === 'ltv' && ltvResult) || (tab === 'cac' && cacResult) || (tab === 'cohort' && paybackResult);
    if (hasResult && !trackedRef.current) {
      trackedRef.current = true;
      (window as any).__trackToolUsed?.(slug);
    }
  }, [ltvResult, cacResult, paybackResult, tab, slug]);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const inp: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    fontSize: '0.95rem', width: '100%', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--color-text-secondary)',
  };
  const resultBox: React.CSSProperties = {
    background: 'var(--color-bg)', border: '1px solid var(--color-primary)',
    borderRadius: '10px', padding: '1rem', marginTop: '1rem',
  };
  const row: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)',
  };
  const bigNum: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' };
  const hint: React.CSSProperties = {
    fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem',
    padding: '0.6rem 0.75rem', background: 'var(--color-bg)', borderRadius: '6px',
    borderLeft: '3px solid var(--color-primary)',
  };

  const ratioBadge = (ratio: number | null) => {
    if (!ratio) return null;
    const color = ratio >= 3 ? '#22c55e' : ratio >= 2 ? '#f59e0b' : '#ef4444';
    const label = ratio >= 3 ? t.good : ratio >= 2 ? t.warning : t.bad;
    return (
      <span style={{ fontSize: '0.75rem', background: color, color: '#fff', borderRadius: '4px', padding: '0.15rem 0.5rem', marginLeft: '0.5rem' }}>
        {label}
      </span>
    );
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ltv', label: t.tab_ltv },
    { key: 'cac', label: t.tab_cac },
    { key: 'cohort', label: t.tab_cohort },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
            border: tab === tb.key ? 'none' : '1px solid var(--color-border)',
            background: tab === tb.key ? 'var(--color-primary)' : 'var(--color-card-bg)',
            color: tab === tb.key ? '#fff' : 'var(--color-text)', cursor: 'pointer',
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── LTV Tab ── */}
      {tab === 'ltv' && (
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={lbl}>{t.avg_revenue}</label>
              <input style={inp} type="number" min="0" value={arpu} onChange={(e) => setArpu(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{t.gross_margin}</label>
              <input style={inp} type="number" min="0" max="100" step="1" value={margin} onChange={(e) => setMargin(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>{t.churn_rate}</label>
              <input style={inp} type="number" min="0.01" max="100" step="0.1" value={churn} onChange={(e) => setChurn(e.target.value)} />
            </div>
          </div>

          {ltvResult && (
            <div style={resultBox}>
              <div style={{ ...row, borderBottom: '2px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.net_ltv}</span>
                <span style={bigNum}>{fmtMoney(ltvResult.netLtv, locale)}</span>
              </div>
              <div style={row}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.gross_ltv}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{fmtMoney(ltvResult.grossLtv, locale)}</span>
              </div>
              <div style={{ ...row, borderBottom: 'none' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.avg_lifetime}</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                  {ltvResult.lifetime.toFixed(1)} {t.months_unit}
                </span>
              </div>
              <p style={hint}>{t.hint_ltv}</p>
            </div>
          )}
        </div>
      )}

      {/* ── CAC & Ratio Tab ── */}
      {tab === 'cac' && (
        <div style={card}>
          {!ltvResult && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              {locale === 'en' ? 'Fill in the LTV tab first to see the LTV:CAC ratio.'
                : locale === 'ja' ? 'LTV:CAC比率を表示するにはLTVタブを先に入力してください。'
                : '请先在 LTV 标签填写数据以查看 LTV:CAC 比率。'}
            </p>
          )}
          <div style={grid2}>
            <div>
              <label style={lbl}>{t.sales_marketing}</label>
              <input style={inp} type="number" min="0" value={spend} onChange={(e) => setSpend(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{t.new_customers}</label>
              <input style={inp} type="number" min="1" value={acquired} onChange={(e) => setAcquired(e.target.value)} />
            </div>
          </div>

          {cacResult && (
            <div style={resultBox}>
              <div style={{ ...row, borderBottom: '2px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.cac}</span>
                <span style={bigNum}>{fmtMoney(cacResult.cac, locale)}</span>
              </div>
              {cacResult.ratio !== null && (
                <div style={{ ...row, borderBottom: 'none' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                    {t.ltv_cac_ratio} {ratioBadge(cacResult.ratio)}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1.3rem', color: cacResult.ratio >= 3 ? '#22c55e' : cacResult.ratio >= 2 ? '#f59e0b' : '#ef4444' }}>
                    {fmtRatio(cacResult.ratio)}
                  </span>
                </div>
              )}
              <p style={hint}>{t.hint_ratio}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Payback Period Tab ── */}
      {tab === 'cohort' && (
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={lbl}>{t.mrr_per_customer}</label>
              <input style={inp} type="number" min="0" value={mrrPerCust} onChange={(e) => setMrrPerCust(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{t.cac_input}</label>
              <input style={inp} type="number" min="0" value={cacInput} onChange={(e) => setCacInput(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>{t.gross_margin_pb}</label>
              <input style={inp} type="number" min="1" max="100" step="1" value={marginPb} onChange={(e) => setMarginPb(e.target.value)} />
            </div>
          </div>

          {paybackResult && (
            <div style={resultBox}>
              <div style={{ ...row, borderBottom: 'none' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.payback_months}</span>
                <span style={{
                  ...bigNum,
                  color: paybackResult.months <= 12 ? '#22c55e' : paybackResult.months <= 18 ? '#f59e0b' : '#ef4444',
                }}>
                  {paybackResult.months.toFixed(1)} {t.months_unit}
                </span>
              </div>
              <p style={hint}>{t.payback_hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
