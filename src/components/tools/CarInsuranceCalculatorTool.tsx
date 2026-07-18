import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

type InsSystem = 'us' | 'cn' | 'tw' | 'jp';
const SYSTEM: Record<string, InsSystem> = { en: 'us', 'zh-CN': 'cn', 'zh-TW': 'tw', ja: 'jp' };

// ---------- US state rates ----------
const STATE_RATES: Record<string,number> = {
  AL:0.95,AK:1.1,AZ:1.05,AR:0.9,CA:1.25,CO:1.1,CT:1.15,DE:1.1,FL:1.35,GA:1.1,HI:0.9,ID:0.85,
  IL:1.0,IN:0.88,IA:0.82,KS:0.9,KY:1.05,LA:1.45,ME:0.8,MD:1.15,MA:1.15,MI:1.6,MN:0.9,MS:0.95,
  MO:0.95,MT:0.88,NE:0.88,NV:1.2,NH:0.85,NJ:1.3,NM:1.0,NY:1.25,NC:0.88,ND:0.82,OH:0.88,OK:1.0,
  OR:1.05,PA:1.0,RI:1.2,SC:1.0,SD:0.85,TN:0.92,TX:1.15,UT:0.95,VT:0.82,VA:0.9,WA:1.0,WV:0.95,WI:0.85,WY:0.88,
};
const STATES = Object.keys(STATE_RATES).sort();

type DriveRecord = 'clean'|'minor'|'major';
type Coverage = 'liability'|'collision'|'full';
type CNNcd = '0'|'1'|'2'|'3'|'4plus'|'claim';
type CNThird = '500k'|'1m'|'2m';
type TWCoverage = 'basic'|'yi'|'jia';
type JPCoverage = 'compulsory'|'voluntary'|'vehicle';

// ---------- Formatting ----------
function fmtM(n:number,locale:string){
  const abs=Math.abs(n);
  if(locale==='zh-CN'){if(abs>=10000)return(n/10000).toFixed(1)+'万';return Math.round(n).toLocaleString();}
  if(locale==='zh-TW'){if(abs>=10000)return(n/10000).toFixed(1)+'萬';return Math.round(n).toLocaleString();}
  if(locale==='ja'){if(abs>=10000)return(n/10000).toFixed(1)+'万';return Math.round(n).toLocaleString();}
  return '$'+Math.round(n).toLocaleString('en-US');
}

// ---------- i18n ----------
const i18n:Record<string,Record<string,string>>={
  en:{
    vehicle_value:'Vehicle Value ($)',vehicle_age:'Vehicle Age (years)',driver_age:'Driver Age',
    driving_record:'Driving Record',record_clean:'Clean (no incidents)',record_minor:'Minor incident (1 ticket)',record_major:'Major incident / DUI',
    annual_distance:'Annual Mileage',dist_low:'Low (< 7,500 mi)',dist_avg:'Average (7,500–15,000 mi)',dist_high:'High (> 15,000 mi)',
    state:'State',coverage:'Coverage Type',cov_liability:'Liability Only',cov_collision:'Liability + Collision',cov_full:'Full Coverage',
    deductible:'Deductible ($)',monthly:'Est. Monthly Premium',annual:'Est. Annual Premium',
    breakdown:'Estimate Breakdown',liability_cost:'Liability',collision_cost:'Collision',comprehensive_cost:'Comprehensive',
    disclaimer:'⚠️ Rough estimate for educational purposes only — NOT an actual insurance quote. Get quotes directly from insurers.',
    factors:'Key Factors Affecting Your Rate',
    factor_age:'Driver age: under 25 or over 75 typically pay more.',
    factor_record:'Driving record: incidents raise premiums 20–50%.',
    factor_vehicle:'Vehicle value: higher value = higher collision/comprehensive cost.',
    factor_location:'Location: state regulations and density affect rates.',
  },
  'zh-CN':{
    vehicle_value:'新车购置价（元）',vehicle_age:'车龄（年）',driver_age:'驾驶人年龄',
    driving_record:'驾驶记录',record_clean:'良好（无出险）',record_minor:'轻微违规',record_major:'重大事故',
    annual_distance:'年行驶里程',dist_low:'少（< 10,000 公里）',dist_avg:'正常（10,000–20,000 公里）',dist_high:'多（> 20,000 公里）',
    ncd_label:'无赔款优惠（NCD）',ncd_0:'首次投保',ncd_1:'连续1年无赔款',ncd_2:'连续2年无赔款',ncd_3:'连续3年无赔款',ncd_4plus:'连续4年以上无赔款',ncd_claim:'上年度有赔款',
    third_label:'第三者责任险保额',third_500k:'50万',third_1m:'100万',third_2m:'200万',
    coverage:'保险方案',cov_liability:'交强险 + 三者险',cov_collision:'基础商业险',cov_full:'全险（含不计免赔）',
    compulsory:'交强险（固定）',third_party:'第三者责任险',collision:'车辆损失险',waiver:'不计免赔特约',
    monthly:'预估月保费',annual:'预估年保费',breakdown:'费用明细',
    disclaimer:'⚠️ 本结果为参考估算，非正式报价。各保险公司费率、车型及城市系数不同，请向正规保险公司询价。',
    factors:'影响保费的主要因素',
    factor_age:'驾驶人年龄：25岁以下保费较高，一般在30-50岁时最低。',
    factor_record:'驾驶记录：有赔款记录次年保费上浮30%；连续无赔款可享最高40%折扣。',
    factor_vehicle:'车辆价值：车损险与车辆新购置价直接挂钩。',
    factor_location:'地区：不同城市基准费率存在差异，以当地保险公司报价为准。',
  },
  'zh-TW':{
    vehicle_value:'車輛購置價值（元）',vehicle_age:'車齡（年）',driver_age:'駕駛人年齡',
    driving_record:'駕駛紀錄',record_clean:'良好（無肇事）',record_minor:'輕微違規',record_major:'重大事故',
    annual_distance:'年行駛里程',dist_low:'少（< 10,000 公里）',dist_avg:'正常（10,000–20,000 公里）',dist_high:'多（> 20,000 公里）',
    coverage:'保險方案',cov_liability:'強制險 + 第三人責任險',cov_collision:'加計車體損失險乙式',cov_full:'加計車體損失險甲式（全險）',
    compulsory:'強制汽車責任保險',third_party:'第三人責任險',collision:'車體損失險',
    monthly:'預估月保費',annual:'預估年保費',breakdown:'費用明細',
    disclaimer:'⚠️ 本結果為參考估算，非正式報價。實際保費請向產險公司詢價。',
    factors:'影響保費的主要因素',
    factor_age:'駕駛人年齡：25歲以下保費較高。',
    factor_record:'駕駛紀錄：肇事紀錄將影響次年費率。',
    factor_vehicle:'車輛價值：車體損失險與車輛價值直接相關。',
    factor_location:'地區：台北市費率通常高於其他縣市。',
  },
  ja:{
    vehicle_value:'車両価値（円）',vehicle_age:'車齢（年）',driver_age:'運転者年齢',
    driving_record:'運転記録',record_clean:'優良（無事故）',record_minor:'軽微な違反',record_major:'重大事故',
    annual_distance:'年間走行距離',dist_low:'少ない（< 10,000 km）',dist_avg:'普通（10,000–20,000 km）',dist_high:'多い（> 20,000 km）',
    coverage:'補償プラン',cov_liability:'自賠責保険のみ',cov_collision:'自賠責 + 任意保険',cov_full:'自賠責 + 任意 + 車両保険',
    compulsory:'自賠責保険（固定）',voluntary_ins:'対人・対物賠償（任意）',vehicle_ins:'車両保険',
    monthly:'月次保険料（推定）',annual:'年間保険料（推定）',breakdown:'内訳',
    disclaimer:'⚠️ 概算のみです。実際の保険料は保険会社・等級・補償内容により大きく異なります。直接保険会社に見積もりを依頼してください。',
    factors:'保険料に影響する主な要因',
    factor_age:'運転者年齢：若い・高齢の運転者は割高になります。',
    factor_record:'事故・違反歴：等級が下がると保険料が上昇します。',
    factor_vehicle:'車両価値：高価な車ほど車両保険が高くなります。',
    factor_location:'地域：都市部は農村部より高い傾向があります。',
  },
};

const VEHICLE_DEFAULT:Record<string,string>={en:'25000','zh-CN':'150000','zh-TW':'600000',ja:'2000000'};

export default function CarInsuranceCalculatorTool({ slug, locale }: Props) {
  const system = SYSTEM[locale] || 'us';
  const t = i18n[locale] || i18n.en;

  const [vehicleValue, setVehicleValue] = useState(VEHICLE_DEFAULT[locale]||'25000');
  const [vehicleAge, setVehicleAge] = useState('3');
  const [driverAge, setDriverAge] = useState('35');
  const [record, setRecord] = useState<DriveRecord>('clean');
  const [distance, setDistance] = useState<'low'|'avg'|'high'>('avg');
  // US only
  const [state, setState] = useState('CA');
  const [coverage, setCoverage] = useState<Coverage>('full');
  const [deductible, setDeductible] = useState('500');
  // CN only
  const [cnNcd, setCnNcd] = useState<CNNcd>('1');
  const [cnThird, setCnThird] = useState<CNThird>('1m');
  const [cnCoverage, setCnCoverage] = useState<'basic'|'full'>('full');
  // TW only
  const [twCoverage, setTwCoverage] = useState<TWCoverage>('yi');
  // JP only
  const [jpCoverage, setJpCoverage] = useState<JPCoverage>('voluntary');
  const trackedRef = useRef(false);

  const result = (() => {
    const val = parseFloat(vehicleValue)||0;
    const vAge = parseInt(vehicleAge)||0;
    const age = parseInt(driverAge)||35;
    const ageMult = age<20?1.75:age<25?1.4:age<30?1.15:age>75?1.2:1.0;
    const recordMult = record==='clean'?1.0:record==='minor'?1.3:1.7;
    const distMult = distance==='low'?0.88:distance==='avg'?1.0:1.12;

    if(system==='us'){
      const stateRate=STATE_RATES[state]||1.0;
      const ded=parseFloat(deductible)||500;
      const dedFactor=ded>=1000?0.78:ded>=500?0.88:1.0;
      const liability=700*ageMult*recordMult*distMult*stateRate;
      const collisionBase=val*0.012*Math.max(0.5,1-vAge*0.04)*dedFactor;
      const collision=coverage==='liability'?0:collisionBase*ageMult*recordMult*stateRate;
      const comprehensive=coverage==='full'?val*0.006*Math.max(0.5,1-vAge*0.03)*dedFactor*stateRate:0;
      const annual=liability+collision+comprehensive;
      return {annual,monthly:annual/12,parts:{[t.liability_cost!]:liability,...(collision>0?{[t.collision_cost!]:collision}:{}),...(comprehensive>0?{[t.comprehensive_cost!]:comprehensive}:{})}};
    }

    if(system==='cn'){
      // 交强险 固定 ¥950（家用汽车）
      const compulsory=950;
      // NCD 折扣
      const ncdMult:Record<CNNcd,number>={0:1.0,'1':0.9,'2':0.8,'3':0.7,'4plus':0.6,'claim':1.3};
      const ncd=ncdMult[cnNcd]??1.0;
      // 车损险: 新车购置价 × 0.7% × 折旧 × NCD × 年龄/记录系数
      const deprFactor=Math.max(0.4,1-vAge*0.06);
      const collision=val*0.007*deprFactor*ncd*ageMult*(record==='major'?1.5:record==='minor'?1.2:1.0)*distMult;
      // 第三者责任险
      const thirdBase:Record<CNThird,number>={'500k':800,'1m':1200,'2m':2000};
      const third=thirdBase[cnThird]*ageMult*(record==='major'?1.5:record==='minor'?1.2:1.0)*ncd;
      // 不计免赔特约 ≈ 15% of 车损+三者
      const waiver=(collision+third)*0.15;
      const commercial=collision+third+(cnCoverage==='full'?waiver:0);
      const annual=compulsory+commercial;
      return {annual,monthly:annual/12,parts:{[t.compulsory!]:compulsory,[t.third_party!]:third,[t.collision!]:collision,...(cnCoverage==='full'?{[t.waiver!]:waiver}:{})}};
    }

    if(system==='tw'){
      // 強制險 固定 NT$2,742
      const compulsory=2742;
      // 第三人責任險: 保額1000萬 ≈ NT$2,000-4,000, 年齡/記錄調整
      const third=3000*ageMult*(record==='major'?1.5:record==='minor'?1.2:1.0)*(distance==='high'?1.1:1.0);
      // 車體損失險
      const depFactor=Math.max(0.4,1-vAge*0.07);
      const collRate=twCoverage==='jia'?0.016:0.010;
      const collision=twCoverage==='basic'?0:val*collRate*depFactor*ageMult*(record==='major'?1.4:record==='minor'?1.15:1.0);
      const annual=compulsory+(twCoverage!=='basic'?third:0)+collision;
      return {annual,monthly:annual/12,parts:{[t.compulsory!]:compulsory,...(twCoverage!=='basic'?{[t.third_party!]:third}:{}),...(collision>0?{[t.collision!]:collision}:{})}};
    }

    if(system==='jp'){
      // 自賠責保険 固定 ≈ ¥10,775/年 (24ヶ月 ¥21,550)
      const compulsory=10775;
      // 任意保険: 対人+対物 (無制限) ≈ ¥60,000ベース × 年齢・記録係数
      const voluntary=jpCoverage==='compulsory'?0:60000*ageMult*(record==='major'?1.6:record==='minor'?1.25:1.0)*(distance==='low'?0.9:distance==='high'?1.1:1.0);
      // 車両保険: 車両価値 × 4%〜6% × 車齢折旧
      const depFactor=Math.max(0.3,1-vAge*0.07);
      const vehicle=jpCoverage==='vehicle'?val*0.05*depFactor*ageMult:0;
      const annual=compulsory+voluntary+vehicle;
      return {annual,monthly:annual/12,parts:{[t.compulsory!]:compulsory,...(voluntary>0?{[t.voluntary_ins!]:voluntary}:{}),...(vehicle>0?{[t.vehicle_ins!]:vehicle}:{})}};
    }
    return {annual:0,monthly:0,parts:{}};
  })();

  useEffect(()=>{
    if(!trackedRef.current){trackedRef.current=true;(window as any).__trackToolUsed?.(slug);}
  },[slug]);

  const card:React.CSSProperties={background:'var(--color-card-bg)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'};
  const inp:React.CSSProperties={padding:'0.5rem 0.75rem',borderRadius:'6px',border:'1px solid var(--color-border)',background:'var(--color-card-bg)',color:'var(--color-text)',fontSize:'0.9rem',width:'100%',boxSizing:'border-box'};
  const lbl:React.CSSProperties={display:'block',fontSize:'0.78rem',marginBottom:'0.25rem',color:'var(--color-text-secondary)'};
  const grid2:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',gap:'0.75rem',marginBottom:'0.75rem'};
  const rowS:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem 0',borderBottom:'1px solid var(--color-border)'};

  return (
    <div>
      <div style={card}>
        <div style={grid2}>
          <div><label style={lbl}>{t.vehicle_value}</label><input style={inp} type="number" min="0" step={system==='cn'?5000:system==='tw'?10000:system==='jp'?100000:500} value={vehicleValue} onChange={e=>setVehicleValue(e.target.value)}/></div>
          <div><label style={lbl}>{t.vehicle_age}</label><input style={inp} type="number" min="0" max="20" value={vehicleAge} onChange={e=>setVehicleAge(e.target.value)}/></div>
          <div><label style={lbl}>{t.driver_age}</label><input style={inp} type="number" min="16" max="90" value={driverAge} onChange={e=>setDriverAge(e.target.value)}/></div>
          <div><label style={lbl}>{t.driving_record}</label>
            <select style={inp} value={record} onChange={e=>setRecord(e.target.value as DriveRecord)}>
              <option value="clean">{t.record_clean}</option>
              <option value="minor">{t.record_minor}</option>
              <option value="major">{t.record_major}</option>
            </select></div>
          <div><label style={lbl}>{t.annual_distance}</label>
            <select style={inp} value={distance} onChange={e=>setDistance(e.target.value as 'low'|'avg'|'high')}>
              <option value="low">{t.dist_low}</option>
              <option value="avg">{t.dist_avg}</option>
              <option value="high">{t.dist_high}</option>
            </select></div>

          {/* US specific */}
          {system==='us'&&<>
            <div><label style={lbl}>{t.state}</label>
              <select style={inp} value={state} onChange={e=>setState(e.target.value)}>
                {STATES.map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
            <div style={{gridColumn:'1/-1'}}><label style={lbl}>{t.coverage}</label>
              <select style={inp} value={coverage} onChange={e=>setCoverage(e.target.value as Coverage)}>
                <option value="liability">{t.cov_liability}</option>
                <option value="collision">{t.cov_collision}</option>
                <option value="full">{t.cov_full}</option>
              </select></div>
            {coverage!=='liability'&&<div style={{gridColumn:'1/-1'}}><label style={lbl}>{t.deductible}</label>
              <select style={inp} value={deductible} onChange={e=>setDeductible(e.target.value)}>
                {['250','500','1000','2000'].map(v=><option key={v} value={v}>{fmtM(parseInt(v),'en')}</option>)}
              </select></div>}
          </>}

          {/* CN specific */}
          {system==='cn'&&<>
            <div><label style={lbl}>{t.ncd_label}</label>
              <select style={inp} value={cnNcd} onChange={e=>setCnNcd(e.target.value as CNNcd)}>
                <option value="0">{t.ncd_0}</option>
                <option value="1">{t.ncd_1}</option>
                <option value="2">{t.ncd_2}</option>
                <option value="3">{t.ncd_3}</option>
                <option value="4plus">{t.ncd_4plus}</option>
                <option value="claim">{t.ncd_claim}</option>
              </select></div>
            <div><label style={lbl}>{t.third_label}</label>
              <select style={inp} value={cnThird} onChange={e=>setCnThird(e.target.value as CNThird)}>
                <option value="500k">{t.third_500k}</option>
                <option value="1m">{t.third_1m}</option>
                <option value="2m">{t.third_2m}</option>
              </select></div>
            <div style={{gridColumn:'1/-1'}}><label style={lbl}>{t.coverage}</label>
              <select style={inp} value={cnCoverage} onChange={e=>setCnCoverage(e.target.value as 'basic'|'full')}>
                <option value="basic">{t.cov_liability}</option>
                <option value="full">{t.cov_full}</option>
              </select></div>
          </>}

          {/* TW specific */}
          {system==='tw'&&<div style={{gridColumn:'1/-1'}}><label style={lbl}>{t.coverage}</label>
            <select style={inp} value={twCoverage} onChange={e=>setTwCoverage(e.target.value as TWCoverage)}>
              <option value="basic">{t.cov_liability}</option>
              <option value="yi">{t.cov_collision}</option>
              <option value="jia">{t.cov_full}</option>
            </select></div>}

          {/* JP specific */}
          {system==='jp'&&<div style={{gridColumn:'1/-1'}}><label style={lbl}>{t.coverage}</label>
            <select style={inp} value={jpCoverage} onChange={e=>setJpCoverage(e.target.value as JPCoverage)}>
              <option value="compulsory">{t.cov_liability}</option>
              <option value="voluntary">{t.cov_collision}</option>
              <option value="vehicle">{t.cov_full}</option>
            </select></div>}
        </div>
      </div>

      {/* 结果 */}
      <div style={card}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',gap:'1rem',marginBottom:'1rem'}}>
          <div style={{padding:'1rem',borderRadius:'8px',background:'var(--color-bg)',border:'2px solid var(--color-primary)',textAlign:'center'}}>
            <div style={{fontSize:'0.75rem',color:'var(--color-text-secondary)'}}>{t.monthly}</div>
            <div style={{fontSize:'1.8rem',fontWeight:700,color:'var(--color-primary)'}}>{fmtM(result.monthly,locale)}</div>
          </div>
          <div style={{padding:'1rem',borderRadius:'8px',background:'var(--color-bg)',border:'1px solid var(--color-border)',textAlign:'center'}}>
            <div style={{fontSize:'0.75rem',color:'var(--color-text-secondary)'}}>{t.annual}</div>
            <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--color-text)'}}>{fmtM(result.annual,locale)}</div>
          </div>
        </div>

        <h4 style={{margin:'0 0 0.5rem',fontSize:'0.85rem',color:'var(--color-text-secondary)'}}>{t.breakdown}</h4>
        {Object.entries(result.parts).map(([label,val])=>(
          <div key={label} style={rowS}>
            <span style={{fontSize:'0.85rem',color:'var(--color-text-secondary)'}}>{label}</span>
            <span style={{fontWeight:600,color:'var(--color-text)'}}>{fmtM(val as number,locale)}/yr</span>
          </div>
        ))}
        <p style={{margin:'1rem 0 0',fontSize:'0.78rem',color:'#f59e0b',lineHeight:1.5,padding:'0.6rem',background:'rgba(245,158,11,0.08)',borderRadius:'6px'}}>{t.disclaimer}</p>
      </div>

      {/* 影响因素 */}
      <div style={card}>
        <h3 style={{margin:'0 0 0.6rem',fontSize:'1rem',color:'var(--color-text)'}}>{t.factors}</h3>
        {[t.factor_age,t.factor_record,t.factor_vehicle,t.factor_location].map((f,i)=>(
          <p key={i} style={{margin:'0 0 0.5rem',fontSize:'0.85rem',color:'var(--color-text-secondary)',lineHeight:1.5}}>• {f}</p>
        ))}
      </div>
    </div>
  );
}
