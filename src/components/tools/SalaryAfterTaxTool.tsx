import { useState, useMemo, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

type SalarySystem = 'us' | 'cn' | 'tw' | 'jp';
const SYSTEM: Record<string, SalarySystem> = { en: 'us', 'zh-CN': 'cn', 'zh-TW': 'tw', ja: 'jp' };
const INCOME_DEFAULT: Record<string, string> = { en: '75000', 'zh-CN': '200000', 'zh-TW': '55000', ja: '5000000' };

// ---------- US 2024 ----------
const BRACKETS_SINGLE = [{rate:.10,max:11600},{rate:.12,max:47150},{rate:.22,max:100525},{rate:.24,max:191950},{rate:.32,max:243725},{rate:.35,max:609350},{rate:.37,max:Infinity}];
const BRACKETS_MARRIED = [{rate:.10,max:23200},{rate:.12,max:94300},{rate:.22,max:201050},{rate:.24,max:383900},{rate:.32,max:487450},{rate:.35,max:731200},{rate:.37,max:Infinity}];
const BRACKETS_HOH = [{rate:.10,max:16550},{rate:.12,max:63100},{rate:.22,max:100500},{rate:.24,max:191950},{rate:.32,max:243700},{rate:.35,max:609350},{rate:.37,max:Infinity}];
const STD_DED: Record<string,number> = { single:14600, married:29200, hoh:21900 };
const SS_BASE = 168600;
const STATES = [
  {label:'No State Tax (TX, FL, WA…)',rate:0},{label:'California ~9.3%',rate:9.3},{label:'New York ~6.85%',rate:6.85},
  {label:'Illinois 4.95%',rate:4.95},{label:'Pennsylvania 3.07%',rate:3.07},{label:'Georgia 5.49%',rate:5.49},
  {label:'North Carolina 4.5%',rate:4.5},{label:'Virginia 5.75%',rate:5.75},{label:'Massachusetts 5%',rate:5.0},
  {label:'Colorado 4.4%',rate:4.4},{label:'Arizona 2.5%',rate:2.5},{label:'Custom rate…',rate:-1},
];
function usFedTax(taxable:number,filing:string){
  const B=filing==='married'?BRACKETS_MARRIED:filing==='hoh'?BRACKETS_HOH:BRACKETS_SINGLE;
  let tax=0,prev=0;
  for(const b of B){const c=Math.min(taxable-prev,b.max-prev);if(c<=0)break;tax+=c*b.rate;prev=b.max;if(taxable<=b.max)break;}
  return tax;
}
function usMarginal(taxable:number,filing:string){
  const B=filing==='married'?BRACKETS_MARRIED:filing==='hoh'?BRACKETS_HOH:BRACKETS_SINGLE;
  for(const b of B)if(taxable<=b.max)return b.rate*100;
  return 37;
}

// ---------- China IIT 2024 ----------
const CN_BRACKETS=[{rate:.03,min:0},{rate:.10,min:36000},{rate:.20,min:144000},{rate:.25,min:300000},{rate:.30,min:420000},{rate:.35,min:660000},{rate:.45,min:960000}];
function cnIIT(taxable:number){
  let tax=0;
  for(let i=0;i<CN_BRACKETS.length;i++){
    const lo=CN_BRACKETS[i].min,hi=i+1<CN_BRACKETS.length?CN_BRACKETS[i+1].min:Infinity;
    const inc=Math.max(0,Math.min(taxable,hi)-lo);
    tax+=inc*CN_BRACKETS[i].rate;
    if(taxable<=hi)break;
  }
  return tax;
}

// ---------- Taiwan IIT 2024 ----------
const TW_BRACKETS=[{rate:.05,min:0},{rate:.12,min:560000},{rate:.20,min:1260000},{rate:.30,min:2520000},{rate:.40,min:4720000}];
function twIIT(taxable:number){
  let tax=0;
  for(let i=0;i<TW_BRACKETS.length;i++){
    const lo=TW_BRACKETS[i].min,hi=i+1<TW_BRACKETS.length?TW_BRACKETS[i+1].min:Infinity;
    const inc=Math.max(0,Math.min(taxable,hi)-lo);
    tax+=inc*TW_BRACKETS[i].rate;
    if(taxable<=hi)break;
  }
  return tax;
}

// ---------- Japan income tax ----------
const JP_BRACKETS=[{rate:.05,min:0},{rate:.10,min:1950000},{rate:.20,min:3300000},{rate:.23,min:6950000},{rate:.33,min:9000000},{rate:.40,min:18000000},{rate:.45,min:40000000}];
function jpEmpDed(income:number){
  if(income<=1625000)return Math.min(550000,income);
  if(income<=1800000)return income*.4-100000;
  if(income<=3600000)return income*.3+80000;
  if(income<=6600000)return income*.2+440000;
  if(income<=8500000)return income*.1+1100000;
  return 1950000;
}
function jpNatTax(taxable:number){
  let tax=0;
  for(let i=0;i<JP_BRACKETS.length;i++){
    const lo=JP_BRACKETS[i].min,hi=i+1<JP_BRACKETS.length?JP_BRACKETS[i+1].min:Infinity;
    const inc=Math.max(0,Math.min(taxable,hi)-lo);
    tax+=inc*JP_BRACKETS[i].rate;
    if(taxable<=hi)break;
  }
  return tax;
}

// ---------- Formatting ----------
function fmtN(n:number,locale:string){
  const abs=Math.abs(n);
  if(locale==='zh-CN'){if(abs>=10000)return(n/10000).toFixed(1)+'万';return Math.round(n).toLocaleString();}
  if(locale==='zh-TW'){if(abs>=10000)return(n/10000).toFixed(1)+'萬';return Math.round(n).toLocaleString();}
  if(locale==='ja'){if(abs>=10000)return(n/10000).toFixed(1)+'万';return Math.round(n).toLocaleString();}
  return '$'+Math.round(n).toLocaleString('en-US');
}
function fmtP(n:number){return n.toFixed(2)+'%';}

// ---------- i18n ----------
const i18n:Record<string,Record<string,string>>={
  en:{
    income:'Annual Gross Salary ($)',filing:'Filing Status',single:'Single',married:'Married Filing Jointly',hoh:'Head of Household',
    state_label:'State Income Tax',custom_rate:'Custom State Rate (%)',
    net_pay:'Net Take-Home / Year',total_tax:'Total Tax',effective:'Effective Rate',marginal:'Marginal Rate',
    federal:'Federal Income Tax',ss:'Social Security (6.2%)',medicare:'Medicare (1.45%)',state_tax:'State Income Tax',
    std_ded:'Standard Deduction',taxable:'Taxable Income',gross:'Gross Salary',
    tax_breakdown:'Tax Breakdown',pay_breakdown:'Pay Period Breakdown',
    annual:'Annual',monthly:'Monthly',biweekly:'Bi-Weekly',weekly:'Weekly',daily:'Daily',hourly:'Hourly',
    note:'2024 US Federal Tax Brackets · Standard deduction applied · Estimated state rate',
    disclaimer:'For estimation only. Consult a tax professional for exact figures.',
  },
  'zh-CN':{
    income:'年薪（税前，元）',social_note:'社保缴纳比例（个人）',housing_label:'住房公积金比例',extra_ded:'专项附加扣除（元/年）',
    net_pay:'税后到手 / 年',total_deduct:'总扣除',total_tax:'个人所得税',effective:'综合税率',marginal:'边际税率',
    social_ins:'五险（养老8%+医疗2%+失业0.5%）',housing_fund:'公积金（个人）',
    iit:'个人所得税',std_ded:'基本减除费用（¥60,000/年）',taxable:'应纳税所得额',gross:'税前年薪',
    tax_breakdown:'税项明细',pay_breakdown:'发薪周期',
    annual:'年',monthly:'月',
    note:'按2024年中国个税税率（居民综合所得）及城镇社保标准费率估算',
    disclaimer:'仅供参考，各地社保基数不同，实际以工资单及税务申报为准。',
  },
  'zh-TW':{
    income:'月薪（元）',insurance_note:'劳健保（个人负担）',
    net_pay:'税后到手 / 月',total_deduct:'月扣除合计',total_tax:'综合所得税（年摊月）',effective:'综合税率',marginal:'边际税率',
    labor_ins:'劳保费（员工负担≈1.95%）',health_ins:'健保费（员工负担≈1.55%）',
    iit:'综合所得税（年）',std_ded:'标准扣除额',taxable:'综合所得净额',gross:'月薪',
    tax_breakdown:'税项明细',pay_breakdown:'月收支明细',
    annual:'年薪',monthly:'月到手',
    note:'以2024年台湾劳健保费率及综合所得税率（标准扣除额）估算',
    disclaimer:'仅供参考，实际以投保薪资级距及当年度申报为准。',
  },
  ja:{
    income:'年間給与収入（円）',social_note:'社会保険料（被保険者負担）',
    net_pay:'手取り / 年',total_deduct:'控除合計',total_tax:'所得税・住民税',effective:'実効税率',marginal:'限界税率',
    health:'健康保険（約5.0%）',pension:'厚生年金（9.15%）',emp_ins:'雇用保険（0.6%）',
    emp_ded:'給与所得控除',basic_ded:'基礎控除（48万）',iit:'所得税（復興税含む）',local_tax:'住民税（10%）',
    taxable:'課税所得',gross:'年収',
    tax_breakdown:'税・社会保険内訳',pay_breakdown:'収支サマリー',
    annual:'年間',monthly:'月換算',
    note:'2024年 協会けんぽ標準料率・給与所得控除・所得税率区分（復興税2.1%含む）・住民税10%で試算',
    disclaimer:'社会保険料は標準的な計算です。実際の税額は年末調整または確定申告によります。',
  },
};

export default function SalaryAfterTaxTool({ slug, locale }: Props) {
  const system = SYSTEM[locale] || 'us';
  const t = i18n[locale] || i18n.en;

  const [income, setIncome] = useState(INCOME_DEFAULT[locale] || '75000');
  // US
  const [filing, setFiling] = useState('single');
  const [stateIdx, setStateIdx] = useState(0);
  const [customState, setCustomState] = useState('5');
  // CN
  const [housingPct, setHousingPct] = useState('7');
  const [cnExtra, setCnExtra] = useState('0');
  // TW — monthly input
  const trackedRef = useRef(false);

  const stateRate = useMemo(()=>{
    const s=STATES[stateIdx];
    return s.rate===-1?parseFloat(customState)||0:s.rate;
  },[stateIdx,customState]);

  const result = useMemo(()=>{
    const gross = parseFloat(income)||0;
    if(gross<=0) return null;

    if(system==='us'){
      const ded=STD_DED[filing]??14600;
      const taxable=Math.max(0,gross-ded);
      const federal=usFedTax(taxable,filing);
      const ss=Math.min(gross,SS_BASE)*0.062;
      const medicare=gross*0.0145;
      const state=gross*(stateRate/100);
      const totalTax=federal+ss+medicare+state;
      const net=gross-totalTax;
      return {system,gross,taxable,ded,federal,ss,medicare,state,totalTax,net,effective:(totalTax/gross)*100,marginal:usMarginal(taxable,filing),monthly:net/12,biweekly:net/26,weekly:net/52,daily:net/260,hourly:net/2080};
    }

    if(system==='cn'){
      const hp=(parseFloat(housingPct)||7)/100;
      const socialPct=0.105; // 养老8%+医疗2%+失业0.5%
      const social=gross*socialPct;
      const housing=gross*hp;
      const extra=parseFloat(cnExtra)||0;
      const taxable=Math.max(0,gross-social-housing-60000-extra);
      const iit=cnIIT(taxable);
      const totalDeduct=social+housing+iit;
      const net=gross-totalDeduct;
      const margBracket=CN_BRACKETS.findLast(b=>taxable>b.min);
      return {system,gross,social,housing,iit,taxable,totalDeduct,net,effective:(totalDeduct/gross)*100,marginal:(margBracket?.rate??0.03)*100,monthly:net/12};
    }

    if(system==='tw'){
      // income is monthly
      const monthly=gross;
      const annual=monthly*12;
      // 劳保费: 月薪 × 1.95%（员工负担，投保薪资上限45,800）
      const laborBase=Math.min(monthly,45800);
      const laborIns=laborBase*0.0195;
      // 健保费: 月薪 × 1.55%（员工负担，投保薪资上限219,500）
      const healthBase=Math.min(monthly,219500);
      const healthIns=healthBase*0.0155;
      const annualInsurance=(laborIns+healthIns)*12;
      // 综合所得税（台湾，年）
      const exempt=92000;
      const stdDed=124000;
      const salaryDed=Math.min(annual,207000);
      const taxable=Math.max(0,annual-exempt-stdDed-salaryDed);
      const iitAnnual=twIIT(taxable);
      const iitMonthly=iitAnnual/12;
      const totalDeductMonthly=laborIns+healthIns+iitMonthly;
      const netMonthly=monthly-totalDeductMonthly;
      const margBracket=TW_BRACKETS.findLast(b=>taxable>b.min);
      return {system,monthly,annual,laborIns,healthIns,iitAnnual,iitMonthly,taxable,totalDeductMonthly,netMonthly,effective:((annualInsurance+iitAnnual)/annual)*100,marginal:(margBracket?.rate??0.05)*100};
    }

    if(system==='jp'){
      const empDed=jpEmpDed(gross);
      const salaryInc=Math.max(0,gross-empDed);
      // 社会保険料
      const health=gross*0.05;
      const pension=gross*0.0915;
      const empIns=gross*0.006;
      const socialTotal=health+pension+empIns;
      // income tax
      const taxableNat=Math.max(0,salaryInc-480000);
      const taxableLoc=Math.max(0,salaryInc-430000);
      const natTax=Math.floor(jpNatTax(taxableNat)*1.021);
      const localTax=Math.floor(taxableLoc*0.10);
      const totalTax=natTax+localTax;
      const totalDeduct=socialTotal+totalTax;
      const net=gross-totalDeduct;
      const margBracket=JP_BRACKETS.findLast(b=>taxableNat>b.min);
      return {system,gross,empDed,salaryInc,health,pension,empIns,socialTotal,natTax,localTax,totalTax,totalDeduct,net,effective:(totalDeduct/gross)*100,marginal:(margBracket?.rate??0.05)*100,monthly:net/12};
    }
    return null;
  },[income,system,filing,stateRate,housingPct,cnExtra]);

  useEffect(()=>{
    if(result&&!trackedRef.current){trackedRef.current=true;(window as any).__trackToolUsed?.(slug);}
  },[result,slug]);

  const card:React.CSSProperties={background:'var(--color-card-bg)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'20px'};
  const lbl:React.CSSProperties={display:'block',fontSize:'0.78rem',fontWeight:600,color:'var(--color-text-secondary)',marginBottom:'6px'};
  const inp:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:'9px 12px',border:'1px solid var(--color-border)',borderRadius:'8px',background:'var(--color-bg)',color:'var(--color-text)',fontSize:'0.95rem'};
  const statCard=(color:string):React.CSSProperties=>({background:'var(--color-card-bg)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'16px 20px',borderLeft:`4px solid ${color}`});
  const taxRow=(label:string,value:number,color:string)=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--color-border)'}}>
      <span style={{fontSize:'0.83rem',color:'var(--color-text-secondary)'}}>{label}</span>
      <span style={{fontSize:'0.9rem',fontWeight:700,color}}>{fmtN(value,locale)}</span>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
      {/* 输入区 */}
      <div style={card}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px'}}>
          <div>
            <label style={lbl}>{t.income}</label>
            <input style={inp} type="number" min="0" step={system==='jp'?100000:system==='tw'?1000:1000} value={income} onChange={e=>setIncome(e.target.value)} />
          </div>

          {/* US extras */}
          {system==='us'&&<>
            <div>
              <label style={lbl}>{t.filing}</label>
              <select style={{...inp,cursor:'pointer'}} value={filing} onChange={e=>setFiling(e.target.value)}>
                <option value="single">{t.single}</option>
                <option value="married">{t.married}</option>
                <option value="hoh">{t.hoh}</option>
              </select>
            </div>
            <div>
              <label style={lbl}>{t.state_label}</label>
              <select style={{...inp,cursor:'pointer'}} value={stateIdx} onChange={e=>setStateIdx(Number(e.target.value))}>
                {STATES.map((s,i)=><option key={i} value={i}>{s.label}</option>)}
              </select>
            </div>
            {STATES[stateIdx].rate===-1&&<div>
              <label style={lbl}>{t.custom_rate}</label>
              <input style={inp} type="number" min="0" max="20" step="0.1" value={customState} onChange={e=>setCustomState(e.target.value)} />
            </div>}
          </>}

          {/* CN extras */}
          {system==='cn'&&<>
            <div>
              <label style={lbl}>{t.housing_label} (%)</label>
              <select style={{...inp,cursor:'pointer'}} value={housingPct} onChange={e=>setHousingPct(e.target.value)}>
                {['5','6','7','8','10','12'].map(v=><option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{t.extra_ded}</label>
              <input style={inp} type="number" min="0" step="1000" value={cnExtra} onChange={e=>setCnExtra(e.target.value)} />
            </div>
          </>}
        </div>
      </div>

      {result&&(
        <>
          {/* 关键指标 */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'12px'}}>
            <div style={statCard('#10b981')}>
              <div style={{fontSize:'0.75rem',color:'var(--color-text-secondary)',fontWeight:600,marginBottom:'4px'}}>{t.net_pay}</div>
              <div style={{fontSize:'1.5rem',fontWeight:800,color:'#10b981'}}>{fmtN(system==='tw'?(result as any).netMonthly*12:result.net!,locale)}</div>
            </div>
            <div style={statCard('#ef4444')}>
              <div style={{fontSize:'0.75rem',color:'var(--color-text-secondary)',fontWeight:600,marginBottom:'4px'}}>{t.total_tax}</div>
              <div style={{fontSize:'1.2rem',fontWeight:700,color:'#ef4444'}}>{fmtN(system==='us'?result.totalTax!:system==='cn'?result.iit!:system==='tw'?(result as any).iitAnnual:result.totalTax!,locale)}</div>
            </div>
            <div style={statCard('#f59e0b')}>
              <div style={{fontSize:'0.75rem',color:'var(--color-text-secondary)',fontWeight:600,marginBottom:'4px'}}>{t.effective}</div>
              <div style={{fontSize:'1.2rem',fontWeight:700,color:'#f59e0b'}}>{fmtP(result.effective!)}</div>
            </div>
            <div style={statCard('#8b5cf6')}>
              <div style={{fontSize:'0.75rem',color:'var(--color-text-secondary)',fontWeight:600,marginBottom:'4px'}}>{t.marginal}</div>
              <div style={{fontSize:'1.2rem',fontWeight:700,color:'#8b5cf6'}}>{fmtP(result.marginal!)}</div>
            </div>
          </div>

          <div className="tl-auto-stack" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',gap:'16px'}}>
            {/* 税项明细 */}
            <div style={card}>
              <div style={{fontWeight:700,fontSize:'0.875rem',marginBottom:'12px',color:'var(--color-text)'}}>{t.tax_breakdown}</div>

              {system==='us'&&<>
                <div style={{fontSize:'0.8rem',color:'var(--color-text-secondary)',marginBottom:'8px'}}>{t.std_ded}: {fmtN(result.ded!,locale)} → {t.taxable}: {fmtN(result.taxable!,locale)}</div>
                {taxRow(t.federal!,result.federal!,'#ef4444')}
                {taxRow(t.ss!,result.ss!,'#f59e0b')}
                {taxRow(t.medicare!,result.medicare!,'#f59e0b')}
                {stateRate>0&&taxRow(`${t.state_tax} (${stateRate}%)`,result.state!,'#8b5cf6')}
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontWeight:800}}>
                  <span style={{color:'var(--color-text)'}}>{t.total_tax}</span>
                  <span style={{color:'#ef4444',fontSize:'1rem'}}>{fmtN(result.totalTax!,locale)}</span>
                </div>
              </>}

              {system==='cn'&&<>
                <div style={{fontSize:'0.8rem',color:'var(--color-text-secondary)',marginBottom:'8px'}}>{t.std_ded}: ¥60,000 → {t.taxable}: {fmtN(result.taxable!,locale)}</div>
                {taxRow(t.social_ins!,result.social!,'#f59e0b')}
                {taxRow(`${t.housing_fund}（${housingPct}%）`,result.housing!,'#f59e0b')}
                {taxRow(t.iit!,result.iit!,'#ef4444')}
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontWeight:800}}>
                  <span style={{color:'var(--color-text)'}}>{t.total_deduct}</span>
                  <span style={{color:'#ef4444',fontSize:'1rem'}}>{fmtN(result.totalDeduct!,locale)}</span>
                </div>
              </>}

              {system==='tw'&&(()=>{const r=result as any;return(<>
                <div style={{fontSize:'0.8rem',color:'var(--color-text-secondary)',marginBottom:'8px'}}>{t.std_ded}: NT$124,000 → {t.taxable}: {fmtN(r.taxable,locale)}</div>
                {taxRow(t.labor_ins!,r.laborIns,'#f59e0b')}
                {taxRow(t.health_ins!,r.healthIns,'#f59e0b')}
                {taxRow(`${t.iit}（年）`,r.iitAnnual,'#ef4444')}
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontWeight:800}}>
                  <span style={{color:'var(--color-text)'}}>{t.total_deduct}（月）</span>
                  <span style={{color:'#ef4444',fontSize:'1rem'}}>{fmtN(r.totalDeductMonthly,locale)}</span>
                </div>
              </>)})()}

              {system==='jp'&&<>
                {taxRow(t.health!,(result as any).health,'#f59e0b')}
                {taxRow(t.pension!,(result as any).pension,'#f59e0b')}
                {taxRow(t.emp_ins!,(result as any).empIns,'#f59e0b')}
                {taxRow(t.iit!,(result as any).natTax,'#ef4444')}
                {taxRow(t.local_tax!,(result as any).localTax,'#ef4444')}
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontWeight:800}}>
                  <span style={{color:'var(--color-text)'}}>{t.total_deduct}</span>
                  <span style={{color:'#ef4444',fontSize:'1rem'}}>{fmtN((result as any).totalDeduct,locale)}</span>
                </div>
              </>}
            </div>

            {/* 发薪周期 */}
            <div style={card}>
              <div style={{fontWeight:700,fontSize:'0.875rem',marginBottom:'12px',color:'var(--color-text)'}}>{t.pay_breakdown}</div>
              {system==='tw'?(()=>{const r=result as any;return(<>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--color-border)'}}>
                  <span style={{fontSize:'0.82rem',color:'var(--color-text-secondary)'}}>{t.annual}</span>
                  <span style={{fontSize:'0.9rem',fontWeight:600,color:'var(--color-text)'}}>{fmtN(r.netMonthly*12,locale)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--color-border)'}}>
                  <span style={{fontSize:'0.82rem',color:'var(--color-text-secondary)'}}>{t.monthly}</span>
                  <span style={{fontSize:'0.9rem',fontWeight:600,color:'var(--color-text)'}}>{fmtN(r.netMonthly,locale)}</span>
                </div>
              </>)})():<>
                {[
                  [t.annual, system==='jp'?(result as any).net:result.net!],
                  [t.monthly, system==='jp'?(result as any).monthly:result.monthly!],
                  ...(system==='us'?[[t.biweekly,result.biweekly!],[t.weekly,result.weekly!],[t.daily,result.daily!],[t.hourly+' (÷2080)',result.hourly!]]:
                  system==='cn'?[]:
                  []),
                ].map(([label,val])=>(
                  <div key={label as string} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--color-border)'}}>
                    <span style={{fontSize:'0.82rem',color:'var(--color-text-secondary)'}}>{label as string}</span>
                    <span style={{fontSize:'0.9rem',fontWeight:600,color:'var(--color-text)'}}>{fmtN(val as number,locale)}</span>
                  </div>
                ))}
              </>}
            </div>
          </div>

          {/* 进度条 */}
          <div style={{...card,padding:'16px 20px'}}>
            {(()=>{
              const gross=system==='tw'?(result as any).monthly:system==='us'?result.gross!:(result as any).gross;
              const deduct=system==='us'?result.totalTax!:system==='cn'?result.totalDeduct!:system==='tw'?(result as any).totalDeductMonthly:(result as any).totalDeduct;
              const netPct=Math.round(((gross-deduct)/gross)*100);
              return(<>
                <div style={{display:'flex',gap:'16px',fontSize:'0.75rem',color:'var(--color-text-secondary)',marginBottom:'8px'}}>
                  <span><span style={{display:'inline-block',width:10,height:10,background:'#10b981',borderRadius:2,marginRight:4}}/>{t.net_pay} {netPct}%</span>
                  <span><span style={{display:'inline-block',width:10,height:10,background:'#ef4444',borderRadius:2,marginRight:4}}/>{t.total_deduct||t.total_tax} {100-netPct}%</span>
                </div>
                <div style={{height:'20px',borderRadius:'10px',overflow:'hidden',display:'flex'}}>
                  <div style={{width:`${netPct}%`,background:'#10b981'}}/>
                  <div style={{flex:1,background:'#ef4444'}}/>
                </div>
              </>);
            })()}
          </div>

          <p style={{fontSize:'0.72rem',color:'var(--color-text-secondary)',margin:0,padding:'0 4px',lineHeight:1.6}}>
            ⓘ {t.note}<br/>{t.disclaimer}
          </p>
        </>
      )}
    </div>
  );
}
