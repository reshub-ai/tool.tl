import { useState, useMemo, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    fixedCosts: 'Fixed Costs', fixedCostsHint: 'Rent, salaries, insurance, etc.',
    varCost: 'Variable Cost per Unit', varCostHint: 'Materials, packaging, direct labor, etc.',
    price: 'Selling Price per Unit',
    currentSales: 'Current Sales Volume (units, optional)', currentSalesHint: 'Fill in to calculate margin of safety',
    breakEvenUnits: 'Break-Even Units', breakEvenRevenue: 'Break-Even Revenue',
    contribMargin: 'Contribution Margin / Unit', contribRatio: 'Contribution Margin Ratio',
    marginSafety: 'Margin of Safety', marginSafetyUnits: 'Margin of Safety (units)',
    profitZone: 'At break-even, total revenue = total costs. Profit = 0.',
    aboveBreakEven: 'Currently above break-even — profitable zone.',
    belowBreakEven: 'Currently below break-even — loss zone.',
    currency: '$', units: 'units',
    howTitle: 'Formulas',
    f1: 'Break-Even Units = Fixed Costs ÷ (Price − Variable Cost)',
    f2: 'Contribution Margin = Price − Variable Cost per Unit',
    f3: 'Contribution Margin Ratio = Contribution Margin ÷ Price',
    f4: 'Margin of Safety = (Current Sales − Break-Even) ÷ Current Sales',
    placeholder: '0',
    profitPerUnit: 'Profit per Unit (above break-even)',
  },
  'zh-CN': {
    fixedCosts: '固定成本', fixedCostsHint: '租金、工资、保险、折旧等不随产量变化的成本',
    varCost: '单位变动成本', varCostHint: '原材料、包装、直接人工等随产量变化的成本',
    price: '单位售价',
    currentSales: '当前销售量（件，选填）', currentSalesHint: '填写后可计算安全边际',
    breakEvenUnits: '盈亏平衡销量', breakEvenRevenue: '盈亏平衡收入',
    contribMargin: '单位贡献毛利', contribRatio: '贡献毛利率',
    marginSafety: '安全边际率', marginSafetyUnits: '安全边际（件）',
    profitZone: '在盈亏平衡点，总收入 = 总成本，利润为 0。',
    aboveBreakEven: '当前销量高于盈亏平衡点，处于盈利区间。',
    belowBreakEven: '当前销量低于盈亏平衡点，处于亏损区间。',
    currency: '¥', units: '件',
    howTitle: '计算公式',
    f1: '盈亏平衡销量 = 固定成本 ÷ (售价 − 单位变动成本)',
    f2: '单位贡献毛利 = 售价 − 单位变动成本',
    f3: '贡献毛利率 = 单位贡献毛利 ÷ 售价',
    f4: '安全边际率 = (当前销量 − 盈亏平衡量) ÷ 当前销量',
    placeholder: '0',
    profitPerUnit: '超出盈亏平衡后每件利润',
  },
  'zh-TW': {
    fixedCosts: '固定成本', fixedCostsHint: '租金、薪資、保險、折舊等不隨產量變動的成本',
    varCost: '單位變動成本', varCostHint: '原料、包裝、直接人工等隨產量變動的成本',
    price: '單位售價',
    currentSales: '目前銷售量（件，選填）', currentSalesHint: '填寫後可計算安全邊際',
    breakEvenUnits: '損益平衡銷售量', breakEvenRevenue: '損益平衡收入',
    contribMargin: '單位邊際貢獻', contribRatio: '邊際貢獻率',
    marginSafety: '安全邊際率', marginSafetyUnits: '安全邊際（件）',
    profitZone: '在損益平衡點，總收入 = 總成本，利潤為 0。',
    aboveBreakEven: '目前銷量高於損益平衡點，處於獲利區間。',
    belowBreakEven: '目前銷量低於損益平衡點，處於虧損區間。',
    currency: 'NT$', units: '件',
    howTitle: '計算公式',
    f1: '損益平衡量 = 固定成本 ÷ (售價 − 單位變動成本)',
    f2: '單位邊際貢獻 = 售價 − 單位變動成本',
    f3: '邊際貢獻率 = 單位邊際貢獻 ÷ 售價',
    f4: '安全邊際率 = (目前銷量 − 損益平衡量) ÷ 目前銷量',
    placeholder: '0',
    profitPerUnit: '超出損益平衡後每件利潤',
  },
  ja: {
    fixedCosts: '固定費', fixedCostsHint: '家賃・人件費・保険・減価償却など売上に関係なく発生する費用',
    varCost: '1単位あたり変動費', varCostHint: '材料費・包装費・直接労務費など売上に連動する費用',
    price: '1単位あたり販売価格',
    currentSales: '現在の販売量（個、任意）', currentSalesHint: '入力すると安全余裕率を計算します',
    breakEvenUnits: '損益分岐点（数量）', breakEvenRevenue: '損益分岐点（売上）',
    contribMargin: '1単位あたり限界利益', contribRatio: '限界利益率',
    marginSafety: '安全余裕率', marginSafetyUnits: '安全余裕（個）',
    profitZone: '損益分岐点では、総売上 = 総費用。利益 = 0。',
    aboveBreakEven: '現在の販売量は損益分岐点を上回っており、利益が出ています。',
    belowBreakEven: '現在の販売量は損益分岐点を下回っており、損失が出ています。',
    currency: '¥', units: '個',
    howTitle: '計算式',
    f1: '損益分岐点（数量）= 固定費 ÷ (販売価格 − 変動費)',
    f2: '限界利益 = 販売価格 − 1単位あたり変動費',
    f3: '限界利益率 = 限界利益 ÷ 販売価格',
    f4: '安全余裕率 = (現在販売量 − 損益分岐点) ÷ 現在販売量',
    placeholder: '0',
    profitPerUnit: '損益分岐点超過後の1単位あたり利益',
  },
};

function fmtN(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function BreakEvenTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;

  const [fixed, setFixed] = useState('50000');
  const [varCost, setVarCost] = useState('30');
  const [price, setPrice] = useState('80');
  const [currentSales, setCurrentSales] = useState('');

  const result = useMemo(() => {
    const f = parseFloat(fixed.replace(/,/g, '')) || 0;
    const v = parseFloat(varCost.replace(/,/g, '')) || 0;
    const p = parseFloat(price.replace(/,/g, '')) || 0;
    const contrib = p - v;
    if (p <= 0 || contrib <= 0) return null;
    const beUnits = Math.ceil(f / contrib);
    const beRevenue = beUnits * p;
    const contribRatio = (contrib / p) * 100;
    const cs = parseFloat(currentSales) || 0;
    const marginUnits = cs > 0 ? cs - beUnits : null;
    const marginPct = cs > 0 ? ((cs - beUnits) / cs) * 100 : null;
    return { beUnits, beRevenue, contrib, contribRatio, marginUnits, marginPct, cs, f, p, v };
  }, [fixed, varCost, price, currentSales]);

  const trackedRef = useRef(false);
  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const card: React.CSSProperties = { background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' };
  const hint: React.CSSProperties = { display: 'block', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '6px', opacity: 0.8 };
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem' };
  const statCard = (color: string): React.CSSProperties => ({ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px 20px', borderLeft: `4px solid ${color}` });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Inputs */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
          <div>
            <label style={lbl}>{t.fixedCosts} ({t.currency})</label>
            <span style={hint}>{t.fixedCostsHint}</span>
            <input style={inp} type="number" min="0" value={fixed} onChange={(e) => setFixed(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.varCost} ({t.currency})</label>
            <span style={hint}>{t.varCostHint}</span>
            <input style={inp} type="number" min="0" step="0.01" value={varCost} onChange={(e) => setVarCost(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.price} ({t.currency})</label>
            <span style={hint}>&nbsp;</span>
            <input style={inp} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.currentSales}</label>
            <span style={hint}>{t.currentSalesHint}</span>
            <input style={inp} type="number" min="0" value={currentSales} placeholder="—" onChange={(e) => setCurrentSales(e.target.value)} />
          </div>
        </div>
      </div>

      {result && (
        <>
          {/* Key stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
            <div style={statCard('var(--color-primary)')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.breakEvenUnits}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-primary)' }}>{fmtN(result.beUnits)}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{t.units}</div>
            </div>
            <div style={statCard('#10b981')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.breakEvenRevenue}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{t.currency}{fmtN(result.beRevenue)}</div>
            </div>
            <div style={statCard('#f59e0b')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.contribMargin}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{t.currency}{fmtN(result.contrib, 2)}</div>
            </div>
            <div style={statCard('#8b5cf6')}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.contribRatio}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6' }}>{result.contribRatio.toFixed(1)}%</div>
            </div>
            {result.marginPct !== null && (
              <div style={statCard(result.marginPct >= 0 ? '#10b981' : '#ef4444')}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>{t.marginSafety}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: result.marginPct >= 0 ? '#10b981' : '#ef4444' }}>
                  {result.marginPct >= 0 ? '+' : ''}{result.marginPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {result.marginUnits !== null && `${result.marginUnits >= 0 ? '+' : ''}${fmtN(result.marginUnits)} ${t.units}`}
                </div>
              </div>
            )}
          </div>

          {/* Status banner */}
          {(() => {
            const isAbove = result.cs > 0 && result.cs > result.beUnits;
            const isBelow = result.cs > 0 && result.cs < result.beUnits;
            const color = isAbove ? '#10b981' : isBelow ? '#ef4444' : '#64748b';
            const msg = isAbove ? t.aboveBreakEven : isBelow ? t.belowBreakEven : t.profitZone;
            return (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: color + '18', border: `1px solid ${color}40`, fontSize: '0.82rem', color, fontWeight: 600 }}>
                {msg}
              </div>
            );
          })()}

          {/* Visual: cost structure breakdown */}
          <div style={{ ...card, padding: '16px 20px' }}>
            {(() => {
              const totalCostAtBE = result.f + result.v * result.beUnits;
              const fixedPct = Math.round((result.f / totalCostAtBE) * 100);
              const varPct = 100 - fixedPct;
              const contribPct = Math.round((result.contrib / result.p) * 100);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Revenue breakdown */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      <span>{t.varCost.split(' ')[0]} {100 - contribPct}%</span>
                      <span>{t.contribMargin.split(' ')[0]} {contribPct}%</span>
                    </div>
                    <div style={{ height: '16px', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${100 - contribPct}%`, background: '#64748b' }} title={t.varCost} />
                      <div style={{ flex: 1, background: '#10b981' }} title={t.contribMargin} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      <span>{t.currency}{fmtN(result.v, 2)}/{t.units}</span>
                      <span>{t.currency}{fmtN(result.contrib, 2)}/{t.units}</span>
                    </div>
                  </div>
                  {/* Total cost structure at break-even */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      <span>{t.fixedCosts} {fixedPct}%</span>
                      <span>{t.varCost.split('(')[0].trim().split(' ').slice(-2).join(' ')} {varPct}%</span>
                    </div>
                    <div style={{ height: '16px', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${fixedPct}%`, background: '#f59e0b' }} />
                      <div style={{ flex: 1, background: '#8b5cf6' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      <span>{t.currency}{fmtN(result.f)}</span>
                      <span>{t.currency}{fmtN(result.v * result.beUnits)}</span>
                    </div>
                  </div>
                </div>
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
