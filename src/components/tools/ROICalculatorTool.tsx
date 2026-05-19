import { useState, useMemo, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    investment: 'Initial Investment',
    returnAmt: 'Final Value / Total Return',
    period: 'Time Period (Years, optional)',
    periodHint: 'Leave blank to skip annualized ROI',
    roi: 'ROI',
    netProfit: 'Net Profit / Loss',
    multiplier: 'Return Multiplier',
    annualRoi: 'Annualized ROI (CAGR)',
    profitLabel: 'Profit',
    lossLabel: 'Loss',
    currency: '$',
    breakEven: 'Break-even (no gain no loss)',
    howTitle: 'How ROI is Calculated',
    howDesc: 'ROI = (Final Value − Initial Investment) ÷ Initial Investment × 100%',
    cagrDesc: 'CAGR = (Final Value ÷ Initial Investment) ^ (1 ÷ Years) − 1',
    placeholder: '0',
  },
  'zh-CN': {
    investment: '初始投入金额', returnAmt: '最终价值 / 总回报',
    period: '投资期限（年，选填）', periodHint: '不填则不计算年化收益率',
    roi: '投资回报率 ROI', netProfit: '净盈亏', multiplier: '回报倍数',
    annualRoi: '年化收益率 CAGR', profitLabel: '盈利', lossLabel: '亏损',
    currency: '¥', breakEven: '持平（无盈亏）',
    howTitle: 'ROI 计算方式',
    howDesc: 'ROI = (最终价值 − 初始投入) ÷ 初始投入 × 100%',
    cagrDesc: 'CAGR = (最终价值 ÷ 初始投入) ^ (1 ÷ 年数) − 1',
    placeholder: '0',
  },
  'zh-TW': {
    investment: '初始投入金額', returnAmt: '最終價值 / 總回報',
    period: '投資期限（年，選填）', periodHint: '不填則不計算年化報酬率',
    roi: '投資報酬率 ROI', netProfit: '淨盈虧', multiplier: '報酬倍數',
    annualRoi: '年化報酬率 CAGR', profitLabel: '獲利', lossLabel: '虧損',
    currency: 'NT$', breakEven: '持平（無盈虧）',
    howTitle: 'ROI 計算方式',
    howDesc: 'ROI = (最終價值 − 初始投入) ÷ 初始投入 × 100%',
    cagrDesc: 'CAGR = (最終價值 ÷ 初始投入) ^ (1 ÷ 年數) − 1',
    placeholder: '0',
  },
  ja: {
    investment: '初期投資額', returnAmt: '最終価値 / 総リターン',
    period: '投資期間（年、任意）', periodHint: '未入力の場合は年率換算をスキップ',
    roi: '投資収益率 ROI', netProfit: '純利益 / 損失', multiplier: 'リターン倍率',
    annualRoi: '年率換算 CAGR', profitLabel: '利益', lossLabel: '損失',
    currency: '¥', breakEven: '損益なし（ブレークイーブン）',
    howTitle: 'ROI の計算方法',
    howDesc: 'ROI = (最終価値 − 初期投資) ÷ 初期投資 × 100%',
    cagrDesc: 'CAGR = (最終価値 ÷ 初期投資) ^ (1 ÷ 年数) − 1',
    placeholder: '0',
  },
};

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

export default function ROICalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [inv, setInv] = useState('10000');
  const [ret, setRet] = useState('15000');
  const [years, setYears] = useState('');

  const result = useMemo(() => {
    const i = parseFloat(inv.replace(/,/g, '')) || 0;
    const r = parseFloat(ret.replace(/,/g, '')) || 0;
    if (i <= 0) return null;
    const netProfit = r - i;
    const roi = (netProfit / i) * 100;
    const multiplier = r / i;
    const y = parseFloat(years) || 0;
    const cagr = (y > 0 && r > 0) ? ((Math.pow(r / i, 1 / y) - 1) * 100) : null;
    return { netProfit, roi, multiplier, cagr, i, r };
  }, [inv, ret, years]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const isProfit = result && result.netProfit > 0;
  const isLoss = result && result.netProfit < 0;
  const profitColor = isProfit ? '#10b981' : isLoss ? '#ef4444' : 'var(--color-text-secondary)';

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' };
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem' };
  const statCard = (color: string): React.CSSProperties => ({ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', borderLeft: `4px solid ${color}` });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={lbl}>{t.investment} ({t.currency})</label>
            <input style={inp} type="number" min="0" value={inv} placeholder={t.placeholder}
              onChange={(e) => setInv(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.returnAmt} ({t.currency})</label>
            <input style={inp} type="number" min="0" value={ret} placeholder={t.placeholder}
              onChange={(e) => setRet(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.period}</label>
            <input style={inp} type="number" min="0.1" step="0.5" value={years} placeholder="—"
              onChange={(e) => setYears(e.target.value)} />
            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{t.periodHint}</p>
          </div>
        </div>
      </div>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
            {/* ROI */}
            <div style={statCard(profitColor)}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.roi}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: profitColor }}>
                {result.netProfit === 0 ? '0%' : fmtPct(result.roi)}
              </div>
            </div>

            {/* Net Profit */}
            <div style={statCard(profitColor)}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                {result.netProfit === 0 ? t.breakEven : isProfit ? t.profitLabel : t.lossLabel}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: profitColor }}>
                {(isProfit ? '+' : '') + t.currency + fmtNum(Math.abs(result.netProfit))}
              </div>
            </div>

            {/* Multiplier */}
            <div style={statCard('var(--color-primary)')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.multiplier}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {result.multiplier.toFixed(2)}x
              </div>
            </div>

            {/* CAGR */}
            {result.cagr !== null && (
              <div style={statCard('#8b5cf6')}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.annualRoi}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>
                  {fmtPct(result.cagr)}
                </div>
              </div>
            )}
          </div>

          {/* Visual bar: investment vs return */}
          <div style={{ ...card, padding: '16px 20px' }}>
            {(() => {
              const maxVal = Math.max(result.i, result.r);
              const invW = Math.round((result.i / maxVal) * 100);
              const retW = Math.round((result.r / maxVal) * 100);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', width: '90px', textAlign: 'right', flexShrink: 0 }}>{t.investment}</span>
                    <div style={{ flex: 1, height: '18px', borderRadius: '6px', background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${invW}%`, height: '100%', background: '#64748b', borderRadius: '6px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)', width: '80px' }}>{t.currency}{fmtNum(result.i)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', width: '90px', textAlign: 'right', flexShrink: 0 }}>{t.returnAmt.split('/')[0].trim()}</span>
                    <div style={{ flex: 1, height: '18px', borderRadius: '6px', background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ width: `${retW}%`, height: '100%', background: profitColor, borderRadius: '6px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: profitColor, width: '80px' }}>{t.currency}{fmtNum(result.r)}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Formula card */}
          <div style={{ ...card, padding: '14px 18px', background: 'var(--color-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{t.howTitle}</div>
            <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: 'var(--color-text)', fontFamily: 'monospace' }}>{t.howDesc}</p>
            {result.cagr !== null && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text)', fontFamily: 'monospace' }}>{t.cagrDesc}</p>}
          </div>
        </>
      )}
    </div>
  );
}
