import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string,Record<string,string[]|string>> = {
  en: {
    assets_title: 'Assets',
    liabilities_title: 'Liabilities',
    net_worth: 'Net Worth',
    total_assets: 'Total Assets',
    total_liab: 'Total Liabilities',
    debt_ratio: 'Debt-to-Asset Ratio',
    asset_keys: ['Cash & Savings','Investments (Stocks/Funds)','Real Estate','Vehicles','Retirement Accounts','Other Assets'],
    liab_keys:  ['Mortgage','Car Loans','Credit Cards','Student Loans','Personal Loans','Other Debt'],
    status_great: 'Excellent financial health',
    status_good: 'Good financial health',
    status_fair: 'Fair — focus on reducing debt',
    status_poor: 'Debt exceeds assets',
    note: 'Enter approximate values. All calculations are private and stay in your browser.',
  },
  'zh-CN': {
    assets_title: '资产',
    liabilities_title: '负债',
    net_worth: '净资产',
    total_assets: '总资产',
    total_liab: '总负债',
    debt_ratio: '负债率',
    asset_keys: ['现金与存款','股票/基金/理财','房产','车辆','公积金/养老金','其他资产'],
    liab_keys:  ['房贷','车贷','信用卡','消费贷款','亲友借款','其他负债'],
    status_great: '财务状况优秀',
    status_good: '财务状况良好',
    status_fair: '一般 — 建议减少负债',
    status_poor: '负债超过资产',
    note: '输入大概数值即可，所有计算在浏览器本地完成，数据不会上传。',
  },
  'zh-TW': {
    assets_title: '資產',
    liabilities_title: '負債',
    net_worth: '淨資產',
    total_assets: '總資產',
    total_liab: '總負債',
    debt_ratio: '負債比率',
    asset_keys: ['現金與存款','股票/基金/投資','不動產','車輛','勞退/退休金','其他資產'],
    liab_keys:  ['房貸','車貸','信用卡','信用貸款','親友借款','其他負債'],
    status_great: '財務狀況優秀',
    status_good: '財務狀況良好',
    status_fair: '尚可 — 建議減少負債',
    status_poor: '負債超過資產',
    note: '輸入概略數值即可，所有計算在瀏覽器本地完成，資料不會上傳。',
  },
  ja: {
    assets_title: '資産',
    liabilities_title: '負債',
    net_worth: '純資産',
    total_assets: '総資産',
    total_liab: '総負債',
    debt_ratio: '負債比率',
    asset_keys: ['現金・預貯金','株式・投資信託','不動産','車両','年金・退職金','その他資産'],
    liab_keys:  ['住宅ローン','自動車ローン','クレジットカード','カードローン','借入金','その他負債'],
    status_great: '財務状況：優秀',
    status_good: '財務状況：良好',
    status_fair: '普通 — 負債削減を検討',
    status_poor: '負債が資産を超過',
    note: '概算値で構いません。すべての計算はブラウザ内で完結し、データは送信されません。',
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

const ASSET_DEFAULTS: Record<string, number[]> = {
  en:      [10000, 20000, 0, 15000, 5000, 0],
  'zh-CN': [50000, 30000, 0, 50000, 20000, 0],
  'zh-TW': [200000, 100000, 0, 200000, 100000, 0],
  ja:      [2000000, 1000000, 0, 1000000, 500000, 0],
};

export default function NetWorthCalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const ak = t.asset_keys as string[];
  const lk = t.liab_keys as string[];
  const adef = ASSET_DEFAULTS[locale] || ASSET_DEFAULTS.en;

  const [assets, setAssets] = useState<number[]>(adef);
  const [liabs, setLiabs] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const trackedRef = useRef(false);

  const totalAssets = assets.reduce((s, v) => s + (v||0), 0);
  const totalLiabs  = liabs.reduce((s, v) => s + (v||0), 0);
  const netWorth = totalAssets - totalLiabs;
  const debtRatio = totalAssets > 0 ? (totalLiabs / totalAssets) * 100 : 0;

  const status = debtRatio <= 15 ? t.status_great as string
    : debtRatio <= 35 ? t.status_good as string
    : debtRatio <= 60 ? t.status_fair as string
    : t.status_poor as string;
  const statusColor = debtRatio <= 15 ? '#22c55e' : debtRatio <= 35 ? '#4ade80' : debtRatio <= 60 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [slug]);

  const card: React.CSSProperties = { background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'12px', padding:'1.25rem', marginBottom:'1rem' };
  const inp: React.CSSProperties = { padding:'0.4rem 0.6rem', borderRadius:'6px', border:'1px solid var(--color-border)', background:'var(--color-bg)', color:'var(--color-text)', fontSize:'0.85rem', width:'100%', boxSizing:'border-box', textAlign:'right' };
  const lbl: React.CSSProperties = { fontSize:'0.82rem', color:'var(--color-text-secondary)', flex:1 };
  const row: React.CSSProperties = { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.4rem 0', borderBottom:'1px solid var(--color-border)' };

  const inputRow = (label: string, value: number, onChange: (v: number) => void) => (
    <div style={row}>
      <span style={lbl}>{label}</span>
      <input style={{ ...inp, width:'140px', flexShrink:0 }} type="number" min="0" step="1000"
        value={value||''} placeholder="0"
        onChange={e => onChange(parseFloat(e.target.value)||0)} />
    </div>
  );

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap:'1rem', marginBottom:'1rem' }}>
        {/* 资产 */}
        <div style={card}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.9rem', fontWeight:700, color:'#22c55e' }}>{t.assets_title as string}</h3>
          {ak.map((k,i) => inputRow(k, assets[i], v => setAssets(prev => { const a=[...prev]; a[i]=v; return a; })))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0 0', fontWeight:700, fontSize:'0.9rem' }}>
            <span style={{ color:'var(--color-text)' }}>{t.total_assets as string}</span>
            <span style={{ color:'#22c55e' }}>{fmtMoney(totalAssets, locale)}</span>
          </div>
        </div>

        {/* 负债 */}
        <div style={card}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.9rem', fontWeight:700, color:'#ef4444' }}>{t.liabilities_title as string}</h3>
          {lk.map((k,i) => inputRow(k, liabs[i], v => setLiabs(prev => { const a=[...prev]; a[i]=v; return a; })))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0 0', fontWeight:700, fontSize:'0.9rem' }}>
            <span style={{ color:'var(--color-text)' }}>{t.total_liab as string}</span>
            <span style={{ color:'#ef4444' }}>{fmtMoney(totalLiabs, locale)}</span>
          </div>
        </div>
      </div>

      {/* 净资产汇总 */}
      <div style={{ ...card, textAlign:'center', border:`2px solid ${netWorth >= 0 ? '#22c55e' : '#ef4444'}` }}>
        <div style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>{t.net_worth as string}</div>
        <div style={{ fontSize:'2.2rem', fontWeight:800, color: netWorth >= 0 ? '#22c55e' : '#ef4444' }}>{fmtMoney(netWorth, locale)}</div>
        <div style={{ marginTop:'0.5rem', fontSize:'0.85rem', color: statusColor, fontWeight:600 }}>{status}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
        {[
          [t.total_assets as string, fmtMoney(totalAssets, locale), '#22c55e'],
          [t.total_liab as string, fmtMoney(totalLiabs, locale), '#ef4444'],
          [t.debt_ratio as string, debtRatio.toFixed(1)+'%', statusColor],
        ].map(([label, value, color]) => (
          <div key={label} style={{ padding:'0.75rem', borderRadius:'8px', background:'var(--color-bg)', border:'1px solid var(--color-border)', textAlign:'center' }}>
            <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)', marginBottom:'0.3rem' }}>{label}</div>
            <div style={{ fontSize:'1.1rem', fontWeight:700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {totalAssets > 0 && (
        <div style={{ ...card, padding:'0.75rem 1rem' }}>
          <div style={{ display:'flex', gap:'1rem', fontSize:'0.75rem', color:'var(--color-text-secondary)', marginBottom:'0.4rem' }}>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'#22c55e', borderRadius:2, marginRight:4 }}/>Net Worth {Math.max(0, Math.round((netWorth/totalAssets)*100))}%</span>
            <span><span style={{ display:'inline-block', width:10, height:10, background:'#ef4444', borderRadius:2, marginRight:4 }}/>Debt {Math.round((totalLiabs/totalAssets)*100)}%</span>
          </div>
          <div style={{ height:'16px', borderRadius:'8px', overflow:'hidden', display:'flex' }}>
            <div style={{ width:`${Math.max(0, Math.round((netWorth/totalAssets)*100))}%`, background:'#22c55e' }}/>
            <div style={{ flex:1, background:'#ef4444' }}/>
          </div>
        </div>
      )}

      <p style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', padding:'0.3rem 0' }}>ⓘ {t.note as string}</p>
    </div>
  );
}
