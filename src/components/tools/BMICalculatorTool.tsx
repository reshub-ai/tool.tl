import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string,Record<string,string>> = {
  en: {
    tab_bmi:'BMI', tab_tdee:'Calories (TDEE)',
    weight:'Weight', height:'Height',
    age:'Age', gender:'Gender', male:'Male', female:'Female',
    unit:'Unit System', metric:'Metric (kg/cm)', imperial:'Imperial (lb/in)',
    activity:'Activity Level',
    act_sedentary:'Sedentary (little/no exercise)',
    act_light:'Light (1–3 days/week)',
    act_moderate:'Moderate (3–5 days/week)',
    act_active:'Very Active (6–7 days/week)',
    act_extra:'Extra Active (twice daily / physical job)',
    bmi_value:'BMI',
    category:'Category',
    healthy_range:'Healthy Weight Range',
    cat_under:'Underweight',
    cat_normal:'Normal Weight',
    cat_over:'Overweight',
    cat_obese:'Obese',
    bmr:'BMR (Basal Metabolic Rate)',
    tdee:'TDEE (Daily Calories)',
    lose:'Weight Loss (−500 kcal)',
    gain:'Weight Gain (+500 kcal)',
    maintain:'Maintain Weight',
    protein:'Protein', carbs:'Carbs', fat:'Fat',
    note:'BMI is a screening tool, not a diagnostic measure. Consult a doctor for personalized advice.',
    kg:'kg', cm:'cm', lb:'lb', in:'in', kcal:'kcal',
  },
  'zh-CN': {
    tab_bmi:'BMI 体重指数', tab_tdee:'热量（TDEE）',
    weight:'体重', height:'身高',
    age:'年龄', gender:'性别', male:'男', female:'女',
    unit:'单位', metric:'公制（kg/cm）', imperial:'英制（lb/in）',
    activity:'活动量',
    act_sedentary:'久坐（几乎不运动）',
    act_light:'轻度活动（1–3天/周）',
    act_moderate:'中度活动（3–5天/周）',
    act_active:'高度活动（6–7天/周）',
    act_extra:'极高活动量（每日两练/体力劳动）',
    bmi_value:'BMI 值',
    category:'体重状况',
    healthy_range:'健康体重范围',
    cat_under:'偏瘦',
    cat_normal:'正常',
    cat_over:'超重',
    cat_obese:'肥胖',
    bmr:'基础代谢率（BMR）',
    tdee:'每日总消耗（TDEE）',
    lose:'减脂（−500 kcal）',
    gain:'增肌（+500 kcal）',
    maintain:'维持体重',
    protein:'蛋白质', carbs:'碳水化合物', fat:'脂肪',
    note:'BMI 是筛查工具，不能作为诊断依据。亚洲人群标准：BMI≥23为超重，≥27.5为肥胖。',
    kg:'kg', cm:'cm', lb:'lb', in:'in', kcal:'kcal',
  },
  'zh-TW': {
    tab_bmi:'BMI 身體質量指數', tab_tdee:'熱量（TDEE）',
    weight:'體重', height:'身高',
    age:'年齡', gender:'性別', male:'男', female:'女',
    unit:'單位', metric:'公制（kg/cm）', imperial:'英制（lb/in）',
    activity:'活動量',
    act_sedentary:'久坐（幾乎不運動）',
    act_light:'輕度活動（1–3天/週）',
    act_moderate:'中度活動（3–5天/週）',
    act_active:'高度活動（6–7天/週）',
    act_extra:'極高活動量（每日兩練/體力勞動）',
    bmi_value:'BMI 值',
    category:'體重狀況',
    healthy_range:'健康體重範圍',
    cat_under:'過輕',
    cat_normal:'正常',
    cat_over:'過重',
    cat_obese:'肥胖',
    bmr:'基礎代謝率（BMR）',
    tdee:'每日總消耗（TDEE）',
    lose:'減脂（−500 kcal）',
    gain:'增肌（+500 kcal）',
    maintain:'維持體重',
    protein:'蛋白質', carbs:'碳水化合物', fat:'脂肪',
    note:'BMI 為篩查工具，非診斷依據。亞洲人群標準：BMI≥23為過重，≥27.5為肥胖。',
    kg:'kg', cm:'cm', lb:'lb', in:'in', kcal:'kcal',
  },
  ja: {
    tab_bmi:'BMI 体格指数', tab_tdee:'カロリー（TDEE）',
    weight:'体重', height:'身長',
    age:'年齢', gender:'性別', male:'男性', female:'女性',
    unit:'単位', metric:'メートル法（kg/cm）', imperial:'ヤード・ポンド法',
    activity:'活動レベル',
    act_sedentary:'座り仕事（ほぼ運動なし）',
    act_light:'軽い活動（週1〜3日）',
    act_moderate:'中程度の活動（週3〜5日）',
    act_active:'活発な活動（週6〜7日）',
    act_extra:'非常に活発（1日2回/肉体労働）',
    bmi_value:'BMI値',
    category:'体重区分',
    healthy_range:'適正体重の範囲',
    cat_under:'低体重',
    cat_normal:'普通体重',
    cat_over:'過体重',
    cat_obese:'肥満',
    bmr:'基礎代謝量（BMR）',
    tdee:'1日の総消費カロリー（TDEE）',
    lose:'減量（−500 kcal）',
    gain:'増量（+500 kcal）',
    maintain:'現状維持',
    protein:'たんぱく質', carbs:'炭水化物', fat:'脂質',
    note:'BMIはスクリーニング指標であり、診断基準ではありません。アジア人基準：BMI≥25が過体重、≥30が肥満。',
    kg:'kg', cm:'cm', lb:'lb', in:'in', kcal:'kcal',
  },
};

// Asian BMI cutoffs for zh-CN, zh-TW, ja
function bmiCategory(bmi: number, isAsian: boolean, t: Record<string,string>) {
  if (isAsian) {
    if (bmi < 18.5) return { label: t.cat_under, color: '#60a5fa' };
    if (bmi < 23)   return { label: t.cat_normal, color: '#22c55e' };
    if (bmi < 27.5) return { label: t.cat_over,   color: '#f59e0b' };
    return { label: t.cat_obese, color: '#ef4444' };
  }
  if (bmi < 18.5) return { label: t.cat_under, color: '#60a5fa' };
  if (bmi < 25)   return { label: t.cat_normal, color: '#22c55e' };
  if (bmi < 30)   return { label: t.cat_over,   color: '#f59e0b' };
  return { label: t.cat_obese, color: '#ef4444' };
}

const ACT_MULTS = [1.2, 1.375, 1.55, 1.725, 1.9];

export default function BMICalculatorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const isAsian = locale !== 'en';
  const [tab, setTab] = useState<'bmi'|'tdee'>('bmi');
  const [imperial, setImperial] = useState(false);
  const [weight, setWeight] = useState(isAsian ? '65' : '70');
  const [height, setHeight] = useState(isAsian ? '170' : '175');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'male'|'female'>('male');
  const [activity, setActivity] = useState(1);
  const trackedRef = useRef(false);

  const wKg = imperial ? (parseFloat(weight)||0) * 0.453592 : (parseFloat(weight)||0);
  const hCm = imperial ? (parseFloat(height)||0) * 2.54 : (parseFloat(height)||0);
  const hM  = hCm / 100;

  const bmi = (wKg > 0 && hM > 0) ? wKg / (hM * hM) : 0;
  const cat = bmi > 0 ? bmiCategory(bmi, isAsian, t) : null;

  const normalLow  = isAsian ? 18.5 * hM * hM : 18.5 * hM * hM;
  const normalHigh = isAsian ? 23   * hM * hM : 25   * hM * hM;

  const bmr = wKg > 0 && hCm > 0 ? (
    gender === 'male'
      ? 10 * wKg + 6.25 * hCm - 5 * (parseInt(age)||30) + 5
      : 10 * wKg + 6.25 * hCm - 5 * (parseInt(age)||30) - 161
  ) : 0;
  const tdee = bmr * ACT_MULTS[activity];

  useEffect(() => {
    if (!trackedRef.current && bmi > 0) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [bmi, slug]);

  const card: React.CSSProperties = { background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'12px', padding:'1.25rem', marginBottom:'1rem' };
  const inp: React.CSSProperties = { padding:'0.5rem 0.75rem', borderRadius:'6px', border:'1px solid var(--color-border)', background:'var(--color-card-bg)', color:'var(--color-text)', fontSize:'0.9rem', width:'100%', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.78rem', marginBottom:'0.3rem', color:'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap:'0.75rem', marginBottom:'0.75rem' };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex:1, padding:'0.5rem', borderRadius:'8px', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', textAlign:'center',
    border: active ? 'none' : '1px solid var(--color-border)',
    background: active ? 'var(--color-primary)' : 'var(--color-card-bg)',
    color: active ? '#fff' : 'var(--color-text-secondary)',
  });

  const actOptions = [t.act_sedentary, t.act_light, t.act_moderate, t.act_active, t.act_extra];

  return (
    <div>
      {/* Tab */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
        <button style={tabBtn(tab==='bmi')} onClick={()=>setTab('bmi')}>{t.tab_bmi}</button>
        <button style={tabBtn(tab==='tdee')} onClick={()=>setTab('tdee')}>{t.tab_tdee}</button>
      </div>

      <div style={card}>
        <div style={{ ...grid2 }}>
          {locale === 'en' && (
            <div style={{ gridColumn:'1/-1', marginBottom:'0.25rem' }}>
              <label style={lbl}>{t.unit}</label>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                {[false, true].map(imp => (
                  <button key={imp?'imp':'met'} onClick={()=>setImperial(imp)} style={{ ...tabBtn(imperial===imp), flex:'none', padding:'0.35rem 0.75rem', fontSize:'0.8rem' }}>
                    {imp ? t.imperial : t.metric}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={lbl}>{t.weight} ({imperial ? t.lb : t.kg})</label>
            <input style={inp} type="number" min="20" max="300" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)}/>
          </div>
          <div>
            <label style={lbl}>{t.height} ({imperial ? t.in : t.cm})</label>
            <input style={inp} type="number" min="100" max="250" step="1" value={height} onChange={e=>setHeight(e.target.value)}/>
          </div>
          {tab === 'tdee' && <>
            <div>
              <label style={lbl}>{t.age}</label>
              <input style={inp} type="number" min="10" max="100" value={age} onChange={e=>setAge(e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>{t.gender}</label>
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.3rem' }}>
                {(['male','female'] as const).map(g => (
                  <button key={g} onClick={()=>setGender(g)} style={{ ...tabBtn(gender===g), flex:'none', padding:'0.35rem 0.75rem', fontSize:'0.8rem' }}>
                    {t[g]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>{t.activity}</label>
              <select style={inp} value={activity} onChange={e=>setActivity(Number(e.target.value))}>
                {actOptions.map((a,i) => <option key={i} value={i}>{a}</option>)}
              </select>
            </div>
          </>}
        </div>
      </div>

      {/* BMI Results */}
      {tab === 'bmi' && bmi > 0 && cat && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
            <div style={{ padding:'1rem', borderRadius:'8px', background:'var(--color-bg)', border:`2px solid ${cat.color}`, textAlign:'center' }}>
              <div style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', marginBottom:'0.25rem' }}>{t.bmi_value}</div>
              <div style={{ fontSize:'2rem', fontWeight:800, color:cat.color }}>{bmi.toFixed(1)}</div>
              <div style={{ fontSize:'0.8rem', fontWeight:600, color:cat.color, marginTop:'0.25rem' }}>{cat.label}</div>
            </div>
            <div style={{ padding:'1rem', borderRadius:'8px', background:'var(--color-bg)', border:'1px solid var(--color-border)', textAlign:'center' }}>
              <div style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>{t.healthy_range}</div>
              <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#22c55e' }}>
                {imperial
                  ? `${(normalLow/0.453592).toFixed(1)} – ${(normalHigh/0.453592).toFixed(1)} ${t.lb}`
                  : `${normalLow.toFixed(1)} – ${normalHigh.toFixed(1)} ${t.kg}`}
              </div>
            </div>
          </div>
          {/* BMI Scale */}
          <div style={card}>
            <div style={{ height:'12px', borderRadius:'6px', background:'linear-gradient(to right, #60a5fa 0%, #22c55e 30%, #22c55e 60%, #f59e0b 75%, #ef4444 100%)', position:'relative', marginBottom:'0.5rem' }}>
              <div style={{ position:'absolute', left:`${Math.min(95, Math.max(1, ((bmi-10)/30)*100))}%`, top:'-4px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', border:`3px solid ${cat.color}`, transform:'translateX(-50%)' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--color-text-secondary)' }}>
              <span>10</span><span>18.5</span><span>{isAsian?'23':'25'}</span><span>{isAsian?'27.5':'30'}</span><span>40</span>
            </div>
          </div>
          <p style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', lineHeight:1.5 }}>ⓘ {t.note}</p>
        </>
      )}

      {/* TDEE Results */}
      {tab === 'tdee' && tdee > 0 && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
            {[
              [t.bmr, Math.round(bmr)+' '+t.kcal, 'var(--color-text)', '1px solid var(--color-border)'],
              [t.maintain, Math.round(tdee)+' '+t.kcal, 'var(--color-primary)', '2px solid var(--color-primary)'],
              [t.lose, Math.round(tdee-500)+' '+t.kcal, '#22c55e', '1px solid #22c55e'],
              [t.gain, Math.round(tdee+500)+' '+t.kcal, '#f59e0b', '1px solid #f59e0b'],
            ].map(([label, value, color, border]) => (
              <div key={label as string} style={{ padding:'0.75rem', borderRadius:'8px', background:'var(--color-bg)', border: border as string, textAlign:'center' }}>
                <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)', marginBottom:'0.25rem' }}>{label as string}</div>
                <div style={{ fontSize:'1.1rem', fontWeight:700, color: color as string }}>{value as string}</div>
              </div>
            ))}
          </div>
          {/* Macros for maintain */}
          <div style={card}>
            <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.85rem', fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{t.maintain} — Macros</h3>
            {[
              [t.protein, Math.round(tdee*0.30/4), Math.round(tdee*0.30)+'kcal', '#60a5fa'],
              [t.carbs,   Math.round(tdee*0.45/4), Math.round(tdee*0.45)+'kcal', '#f59e0b'],
              [t.fat,     Math.round(tdee*0.25/9), Math.round(tdee*0.25)+'kcal', '#a78bfa'],
            ].map(([name, g, kcalStr, color]) => (
              <div key={name as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.4rem 0', borderBottom:'1px solid var(--color-border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ display:'inline-block', width:10, height:10, background: color as string, borderRadius:2 }}/>
                  <span style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)' }}>{name as string}</span>
                </div>
                <span style={{ fontWeight:600, color: color as string }}>{g}g <span style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', fontWeight:400 }}>({kcalStr as string})</span></span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', lineHeight:1.5 }}>ⓘ {t.note}</p>
        </>
      )}
    </div>
  );
}
