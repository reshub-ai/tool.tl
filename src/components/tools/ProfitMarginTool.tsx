import { useState, useMemo, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

type CalcMode = 'margin' | 'markup' | 'revenue';

const i18n: Record<string, Record<string, string>> = {
  en: {
    modeMargin: 'Margin from Revenue & Cost',
    modeMarkup: 'Markup from Cost & Profit',
    modeRevenue: 'Revenue from Cost & Margin',
    btnMargin: 'Gross Margin', btnMarkup: 'Markup', btnRevenue: 'Find Revenue',
    revenue: 'Revenue (Selling Price)', cost: 'Cost (COGS)',
    profit: 'Profit Amount', marginPct: 'Profit Margin (%)',
    markupPct: 'Markup (%)', grossProfit: 'Gross Profit',
    grossMargin: 'Gross Margin', markup: 'Markup',
    revenueLabel: 'Revenue', costLabel: 'Cost',
    calcMode: 'Calculation Mode',
    currency: '$',
    howTitle: 'Formulas',
    f1: 'Gross Profit = Revenue − Cost',
    f2: 'Margin % = Gross Profit ÷ Revenue × 100',
    f3: 'Markup % = Gross Profit ÷ Cost × 100',
    f4: 'Revenue = Cost ÷ (1 − Margin%)',
    placeholder: '0',
  },
  'zh-CN': {
    modeMargin: '按收入和成本计算利润率',
    modeMarkup: '按成本和利润计算加价率',
    modeRevenue: '按成本和利润率反推收入',
    btnMargin: '毛利率', btnMarkup: '加价率', btnRevenue: '反推收入',
    revenue: '收入（售价）', cost: '成本（COGS）',
    profit: '利润金额', marginPct: '利润率 (%)',
    markupPct: '加价率 (%)', grossProfit: '毛利润',
    grossMargin: '毛利率', markup: '加价率',
    revenueLabel: '收入', costLabel: '成本',
    calcMode: '计算模式',
    currency: '¥',
    howTitle: '计算公式',
    f1: '毛利润 = 收入 − 成本',
    f2: '利润率 = 毛利润 ÷ 收入 × 100%',
    f3: '加价率 = 毛利润 ÷ 成本 × 100%',
    f4: '收入 = 成本 ÷ (1 − 利润率)',
    placeholder: '0',
  },
  'zh-TW': {
    modeMargin: '按收入和成本計算利潤率',
    modeMarkup: '按成本和利潤計算加價率',
    modeRevenue: '按成本和利潤率反推收入',
    btnMargin: '毛利率', btnMarkup: '加價率', btnRevenue: '反推收入',
    revenue: '收入（售價）', cost: '成本（COGS）',
    profit: '利潤金額', marginPct: '利潤率 (%)',
    markupPct: '加價率 (%)', grossProfit: '毛利潤',
    grossMargin: '毛利率', markup: '加價率',
    revenueLabel: '收入', costLabel: '成本',
    calcMode: '計算模式',
    currency: 'NT$',
    howTitle: '計算公式',
    f1: '毛利潤 = 收入 − 成本',
    f2: '利潤率 = 毛利潤 ÷ 收入 × 100%',
    f3: '加價率 = 毛利潤 ÷ 成本 × 100%',
    f4: '收入 = 成本 ÷ (1 − 利潤率)',
    placeholder: '0',
  },
  ja: {
    modeMargin: '売上と原価から利益率を計算',
    modeMarkup: '原価と利益からマークアップを計算',
    modeRevenue: '原価と利益率から売上を逆算',
    btnMargin: '粗利率', btnMarkup: 'マークアップ', btnRevenue: '売上逆算',
    revenue: '売上（販売価格）', cost: '原価（COGS）',
    profit: '利益額', marginPct: '利益率 (%)',
    markupPct: 'マークアップ率 (%)', grossProfit: '粗利',
    grossMargin: '粗利率', markup: 'マークアップ率',
    revenueLabel: '売上', costLabel: '原価',
    calcMode: '計算モード',
    currency: '¥',
    howTitle: '計算式',
    f1: '粗利 = 売上 − 原価',
    f2: '粗利率 = 粗利 ÷ 売上 × 100%',
    f3: 'マークアップ率 = 粗利 ÷ 原価 × 100%',
    f4: '売上 = 原価 ÷ (1 − 利益率)',
    placeholder: '0',
  },
};

function fmtN(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtP(n: number) { return n.toFixed(2) + '%'; }

export default function ProfitMarginTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [mode, setMode] = useState<CalcMode>('margin');
  const [revenue, setRevenue] = useState('1000');
  const [cost, setCost] = useState('600');
  const [profit, setProfit] = useState('400');
  const [margin, setMargin] = useState('40');

  const result = useMemo(() => {
    if (mode === 'margin') {
      const r = parseFloat(revenue) || 0;
      const c = parseFloat(cost) || 0;
      if (r <= 0) return null;
      const gp = r - c;
      return { revenue: r, cost: c, grossProfit: gp, margin: (gp / r) * 100, markup: c > 0 ? (gp / c) * 100 : 0 };
    }
    if (mode === 'markup') {
      const c = parseFloat(cost) || 0;
      const p = parseFloat(profit) || 0;
      if (c <= 0) return null;
      const r = c + p;
      return { revenue: r, cost: c, grossProfit: p, margin: (p / r) * 100, markup: (p / c) * 100 };
    }
    // revenue mode
    const c = parseFloat(cost) || 0;
    const m = parseFloat(margin) || 0;
    if (c <= 0 || m >= 100) return null;
    const r = c / (1 - m / 100);
    const gp = r - c;
    return { revenue: r, cost: c, grossProfit: gp, margin: m, markup: (gp / c) * 100 };
  }, [mode, revenue, cost, profit, margin]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' };
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem' };
  const statCard = (color: string): React.CSSProperties => ({ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', borderLeft: `4px solid ${color}` });
  const modeBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '9px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center',
    border: active ? 'none' : '1px solid var(--color-border)',
    background: active ? 'var(--color-primary)' : 'var(--color-bg)',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={card}>
        {/* Mode selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={lbl}>{t.calcMode}</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['margin', 'markup', 'revenue'] as CalcMode[]).map((m) => (
              <button key={m} style={{ ...modeBtn(mode === m), flex: 'none', minWidth: '100px' }} onClick={() => setMode(m)}>
                {m === 'margin' ? t.btnMargin : m === 'markup' ? t.btnMarkup : t.btnRevenue}
              </button>
            ))}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
            {mode === 'margin' ? t.modeMargin : mode === 'markup' ? t.modeMarkup : t.modeRevenue}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {mode === 'margin' && (
            <>
              <div>
                <label style={lbl}>{t.revenue} ({t.currency})</label>
                <input style={inp} type="number" min="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>{t.cost} ({t.currency})</label>
                <input style={inp} type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
            </>
          )}
          {mode === 'markup' && (
            <>
              <div>
                <label style={lbl}>{t.cost} ({t.currency})</label>
                <input style={inp} type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>{t.profit} ({t.currency})</label>
                <input style={inp} type="number" min="0" value={profit} onChange={(e) => setProfit(e.target.value)} />
              </div>
            </>
          )}
          {mode === 'revenue' && (
            <>
              <div>
                <label style={lbl}>{t.cost} ({t.currency})</label>
                <input style={inp} type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>{t.marginPct}</label>
                <input style={inp} type="number" min="0" max="99.9" step="0.1" value={margin} onChange={(e) => setMargin(e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={statCard('var(--color-primary)')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.grossMargin}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>{fmtP(result.margin)}</div>
            </div>
            <div style={statCard('#10b981')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.grossProfit}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{t.currency}{fmtN(result.grossProfit)}</div>
            </div>
            <div style={statCard('#f59e0b')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.markup}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{fmtP(result.markup)}</div>
            </div>
            {mode !== 'margin' && (
              <div style={statCard('#8b5cf6')}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.revenueLabel}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>{t.currency}{fmtN(result.revenue)}</div>
              </div>
            )}
          </div>

          {/* Visual stacked bar */}
          <div style={{ ...card, padding: '16px 20px' }}>
            {(() => {
              const costPct = Math.round((result.cost / result.revenue) * 100);
              const profitPct = 100 - costPct;
              return (
                <>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#64748b', marginRight: 4 }} />{t.costLabel} {costPct}%</span>
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#10b981', marginRight: 4 }} />{t.grossMargin} {profitPct}%</span>
                  </div>
                  <div style={{ height: '24px', borderRadius: '10px', overflow: 'hidden', background: 'var(--color-border)', display: 'flex' }}>
                    <div style={{ width: `${costPct}%`, background: '#64748b', transition: 'width 0.4s' }} />
                    <div style={{ flex: 1, background: '#10b981' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    <span>{t.costLabel}: {t.currency}{fmtN(result.cost)}</span>
                    <span>{t.grossProfit}: {t.currency}{fmtN(result.grossProfit)}</span>
                    <span>{t.revenueLabel}: {t.currency}{fmtN(result.revenue)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Formulas */}
          <div style={{ ...card, padding: '14px 18px', background: 'var(--color-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{t.howTitle}</div>
            {[t.f1, t.f2, t.f3, t.f4].map((f, i) => (
              <p key={i} style={{ margin: '0 0 3px', fontSize: '0.78rem', color: 'var(--color-text)', fontFamily: 'monospace' }}>{f}</p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
