import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const DEFAULTS: Record<string, { currentAge:string; retireAge:string; savings:string; contribution:string; returnRate:string; inflation:string; expenses:string }> = {
  en:      { currentAge:'30', retireAge:'65', savings:'50000',   contribution:'500',   returnRate:'7', inflation:'3', expenses:'3000'   },
  'zh-CN': { currentAge:'30', retireAge:'60', savings:'200000',  contribution:'3000',  returnRate:'4', inflation:'3', expenses:'8000'   },
  'zh-TW': { currentAge:'30', retireAge:'65', savings:'1000000', contribution:'15000', returnRate:'4', inflation:'2', expenses:'40000'  },
  ja:      { currentAge:'30', retireAge:'65', savings:'5000000', contribution:'50000', returnRate:'3', inflation:'1', expenses:'200000' },
};

const i18n: Record<string,Record<string,string>> = {
  en: {
    current_age:'Current Age', retire_age:'Retirement Age', savings:'Current Savings ($)', contribution:'Monthly Contribution ($)',
    return_rate:'Expected Annual Return (%)', inflation:'Inflation Rate (%)', expenses:'Monthly Expenses in Retirement ($)',
    projected:'Projected Savings at Retirement', real_value:'Real Value (Inflation-Adjusted)', monthly_income:'Monthly Income (4% Rule)',
    years_income:'Years of Income', shortfall:'Monthly Shortfall', surplus:'Monthly Surplus',
    breakdown:'Breakdown', years_to_retire:'Years to Retirement', total_contributions:'Total Contributions',
    growth:'Investment Growth', progress:'Savings Progress', current_savings:'Current Savings',
    target:'Retirement Target', note:'⚠️ This is an estimate. Actual returns vary. Consult a financial advisor.',
    yr:'yr', yrs:'yrs', too_old:'Retirement age must be greater than current age.',
    filing_note:'Based on 4% safe withdrawal rate and estimated real returns.',
  },
  'zh-CN': {
    current_age:'当前年龄', retire_age:'退休年龄', savings:'当前存款（元）', contribution:'每月储蓄额（元）',
    return_rate:'预期年化收益率（%）', inflation:'通货膨胀率（%）', expenses:'退休后月支出（元）',
    projected:'退休时预计资产', real_value:'实际购买力（扣通胀）', monthly_income:'每月可用金额（4%法则）',
    years_income:'资产可使用年限', shortfall:'每月缺口', surplus:'每月盈余',
    breakdown:'构成明细', years_to_retire:'距退休年数', total_contributions:'累计投入',
    growth:'投资增值', progress:'储蓄进度', current_savings:'当前存款',
    target:'退休目标资产', note:'⚠️ 仅供参考，实际收益因市场波动而异，建议咨询专业理财顾问。',
    yr:'年', yrs:'年', too_old:'退休年龄必须大于当前年龄。',
    filing_note:'基于4%安全提取率，已按通胀率调整实际购买力。',
  },
  'zh-TW': {
    current_age:'目前年齡', retire_age:'退休年齡', savings:'目前存款（元）', contribution:'每月儲蓄額（元）',
    return_rate:'預期年化報酬率（%）', inflation:'通貨膨脹率（%）', expenses:'退休後月支出（元）',
    projected:'退休時預計資產', real_value:'實際購買力（扣通膨）', monthly_income:'每月可用金額（4%法則）',
    years_income:'資產可使用年限', shortfall:'每月缺口', surplus:'每月盈餘',
    breakdown:'構成明細', years_to_retire:'距退休年數', total_contributions:'累計投入',
    growth:'投資增值', progress:'儲蓄進度', current_savings:'目前存款',
    target:'退休目標資產', note:'⚠️ 僅供參考，實際報酬因市場波動而異，建議諮詢專業理財顧問。',
    yr:'年', yrs:'年', too_old:'退休年齡必須大於目前年齡。',
    filing_note:'基於4%安全提領率，已按通膨率調整實際購買力。',
  },
  ja: {
    current_age:'現在の年齢', retire_age:'退職年齢', savings:'現在の貯蓄（円）', contribution:'毎月の積立額（円）',
    return_rate:'期待年利回り（%）', inflation:'インフレ率（%）', expenses:'退職後の月間支出（円）',
    projected:'退職時の推定資産', real_value:'実質価値（インフレ調整後）', monthly_income:'毎月の取崩額（4%ルール）',
    years_income:'資産の持続年数', shortfall:'月次不足額', surplus:'月次余剰額',
    breakdown:'内訳', years_to_retire:'退職までの年数', total_contributions:'累計積立額',
    growth:'運用益', progress:'貯蓄進捗', current_savings:'現在の貯蓄',
    target:'退職目標資産', note:'⚠️ 試算のみです。実際の運用成果は市場により異なります。ファイナンシャルアドバイザーにご相談ください。',
    yr:'年', yrs:'年', too_old:'退職年齢は現在の年齢より大きくしてください。',
    filing_note:'4%ルール（安全引き出し率）に基づき、インフレ調整後の実質値を計算しています。',
  },
};

function fmtMoney(n: number, locale: string) {
  const abs = Math.abs(n);
  if (locale === 'zh-CN') { if (abs >= 10000) return (n/10000).toFixed(1)+'万'; return Math.round(n).toLocaleString(); }
  if (locale === 'zh-TW') { if (abs >= 10000) return (n/10000).toFixed(1)+'萬'; return Math.round(n).toLocaleString(); }
  if (locale === 'ja')    { if (abs >= 10000) return (n/10000).toFixed(1)+'万'; return Math.round(n).toLocaleString(); }
  if (abs >= 1000000) return '$'+(n/1000000).toFixed(2)+'M';
  if (abs >= 1000) return '$'+(n/1000).toFixed(1)+'K';
  return '$'+Math.round(n).toLocaleString('en-US');
}

export default function RetirementCalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const def = DEFAULTS[locale] || DEFAULTS.en;
  const [currentAge, setCurrentAge] = useState(def.currentAge);
  const [retireAge, setRetireAge] = useState(def.retireAge);
  const [savings, setSavings] = useState(def.savings);
  const [contribution, setContribution] = useState(def.contribution);
  const [returnRate, setReturnRate] = useState(def.returnRate);
  const [inflation, setInflation] = useState(def.inflation);
  const [expenses, setExpenses] = useState(def.expenses);
  const trackedRef = useRef(false);

  const result = (() => {
    const age = parseInt(currentAge)||0, retire = parseInt(retireAge)||0;
    const PV = parseFloat(savings)||0, PMT = parseFloat(contribution)||0;
    const r = (parseFloat(returnRate)||0) / 100 / 12;
    const inf = (parseFloat(inflation)||0) / 100;
    const exp = parseFloat(expenses)||0;
    if (retire <= age) return null;
    const years = retire - age, months = years * 12;
    const factor = r > 0 ? Math.pow(1+r, months) : 1;
    const fvSavings = PV * (r > 0 ? factor : 1);
    const fvContrib = r > 0 ? PMT * (factor - 1) / r : PMT * months;
    const total = fvSavings + fvContrib;
    const realTotal = total / Math.pow(1+inf, years);
    const monthlyIncome = total * 0.04 / 12;
    const yearsIncome = exp > 0 ? total / (exp * 12) : Infinity;
    const surplus = monthlyIncome - exp;
    const totalContrib = PV + PMT * months;
    const growth = total - totalContrib;
    return { total, realTotal, monthlyIncome, yearsIncome, surplus, years, totalContrib, growth, fvSavings };
  })();

  useEffect(() => {
    if (result && !trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [result, slug]);

  const card: React.CSSProperties = { background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'12px', padding:'1.25rem', marginBottom:'1rem' };
  const inp: React.CSSProperties = { padding:'0.5rem 0.75rem', borderRadius:'6px', border:'1px solid var(--color-border)', background:'var(--color-card-bg)', color:'var(--color-text)', fontSize:'0.9rem', width:'100%', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.78rem', marginBottom:'0.3rem', color:'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap:'0.75rem' };

  return (
    <div>
      <div style={card}>
        <div style={{ ...grid2, marginBottom:'0.75rem' }}>
          <div><label style={lbl}>{t.current_age}</label><input style={inp} type="number" min="18" max="80" value={currentAge} onChange={e=>setCurrentAge(e.target.value)}/></div>
          <div><label style={lbl}>{t.retire_age}</label><input style={inp} type="number" min="40" max="80" value={retireAge} onChange={e=>setRetireAge(e.target.value)}/></div>
          <div><label style={lbl}>{t.savings}</label><input style={inp} type="number" min="0" step="1000" value={savings} onChange={e=>setSavings(e.target.value)}/></div>
          <div><label style={lbl}>{t.contribution}</label><input style={inp} type="number" min="0" step="100" value={contribution} onChange={e=>setContribution(e.target.value)}/></div>
          <div><label style={lbl}>{t.return_rate}</label><input style={inp} type="number" min="0" max="20" step="0.5" value={returnRate} onChange={e=>setReturnRate(e.target.value)}/></div>
          <div><label style={lbl}>{t.inflation}</label><input style={inp} type="number" min="0" max="10" step="0.5" value={inflation} onChange={e=>setInflation(e.target.value)}/></div>
          <div style={{ gridColumn:'1/-1' }}><label style={lbl}>{t.expenses}</label><input style={inp} type="number" min="0" step="100" value={expenses} onChange={e=>setExpenses(e.target.value)}/></div>
        </div>
      </div>

      {!result && <p style={{ color:'#ef4444', padding:'0.6rem', fontSize:'0.9rem' }}>⚠️ {t.too_old}</p>}

      {result && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
            {[
              [t.projected, fmtMoney(result.total, locale), 'var(--color-primary)', '2px solid var(--color-primary)'],
              [t.real_value, fmtMoney(result.realTotal, locale), 'var(--color-text)', '1px solid var(--color-border)'],
              [t.monthly_income, fmtMoney(result.monthlyIncome, locale), '#22c55e', '1px solid #22c55e'],
              [t.years_income, result.yearsIncome === Infinity ? '∞' : result.yearsIncome.toFixed(1)+' '+t.yr, result.yearsIncome >= 25 ? '#22c55e' : '#ef4444', '1px solid var(--color-border)'],
              [result.surplus >= 0 ? t.surplus : t.shortfall, fmtMoney(Math.abs(result.surplus), locale), result.surplus >= 0 ? '#22c55e' : '#ef4444', '1px solid var(--color-border)'],
            ].map(([label, value, color, border]) => (
              <div key={label as string} style={{ padding:'0.75rem 1rem', borderRadius:'8px', background:'var(--color-bg)', border: border as string, textAlign:'center' }}>
                <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)', marginBottom:'0.25rem' }}>{label as string}</div>
                <div style={{ fontSize:'1.1rem', fontWeight:700, color: color as string }}>{value as string}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.85rem', fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{t.breakdown}</h3>
            {[
              [t.years_to_retire, result.years+' '+t.yrs, 'var(--color-text)'],
              [t.current_savings, fmtMoney(parseFloat(savings)||0, locale), 'var(--color-text)'],
              [t.total_contributions, fmtMoney(result.totalContrib, locale), '#f59e0b'],
              [t.growth, fmtMoney(result.growth, locale), '#22c55e'],
            ].map(([label, value, color]) => (
              <div key={label as string} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid var(--color-border)' }}>
                <span style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)' }}>{label as string}</span>
                <span style={{ fontWeight:600, color: color as string }}>{value as string}</span>
              </div>
            ))}
            <div style={{ marginTop:'0.75rem' }}>
              {[
                { label: t.total_contributions, pct: Math.round(result.totalContrib/result.total*100), color:'#f59e0b' },
                { label: t.growth, pct: Math.round(result.growth/result.total*100), color:'#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem', fontSize:'0.78rem', color:'var(--color-text-secondary)' }}>
                  <span style={{ display:'inline-block', width:10, height:10, background:s.color, borderRadius:2 }}/>
                  {s.label} {s.pct}%
                </div>
              ))}
              <div style={{ height:'16px', borderRadius:'8px', overflow:'hidden', display:'flex', marginTop:'0.3rem' }}>
                <div style={{ width:`${Math.round(result.totalContrib/result.total*100)}%`, background:'#f59e0b' }}/>
                <div style={{ flex:1, background:'#22c55e' }}/>
              </div>
            </div>
          </div>

          <p style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', lineHeight:1.5, padding:'0.5rem 0' }}>
            ⓘ {t.filing_note}<br/>{t.note}
          </p>
        </>
      )}
    </div>
  );
}
