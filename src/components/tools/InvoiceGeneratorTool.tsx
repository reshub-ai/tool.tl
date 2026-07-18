import { useState, useRef, useEffect } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

interface LineItem { desc: string; qty: string; price: string; }

const LOCALE_CONFIG: Record<string, { currency: string; symbol: string; taxLabel: string; taxRate: string; dateFormat: string }> = {
  en:      { currency:'USD', symbol:'$',    taxLabel:'Tax / VAT',  taxRate:'0',  dateFormat:'MM/DD/YYYY' },
  'zh-CN': { currency:'CNY', symbol:'¥',    taxLabel:'增值税（VAT）', taxRate:'13', dateFormat:'YYYY-MM-DD' },
  'zh-TW': { currency:'TWD', symbol:'NT$',  taxLabel:'營業稅',      taxRate:'5',  dateFormat:'YYYY/MM/DD' },
  ja:      { currency:'JPY', symbol:'¥',    taxLabel:'消費税（10%）', taxRate:'10', dateFormat:'YYYY年MM月DD日' },
};

const i18n: Record<string,Record<string,string>> = {
  en: {
    from:'From (Seller)', to:'To (Client)', invoice_no:'Invoice #', date:'Date', due:'Due Date',
    items:'Line Items', desc:'Description', qty:'Qty', unit_price:'Unit Price', amount:'Amount', add_item:'+ Add Item',
    subtotal:'Subtotal', tax:'Tax Rate (%)', tax_amount:'Tax', total:'Total',
    notes:'Notes / Payment Terms', notes_ph:'e.g. Payment due within 30 days. Bank transfer preferred.',
    print:'🖨️ Print / Save as PDF', preview:'Invoice Preview',
    from_ph:'Your Company\n123 Main St, City\nemail@example.com',
    to_ph:'Client Name\nClient Address\nclient@example.com',
    paid:'PAID', currency:'Currency',
  },
  'zh-CN': {
    from:'卖方（发票人）', to:'买方（客户）', invoice_no:'发票号', date:'开票日期', due:'付款截止日',
    items:'明细项目', desc:'描述', qty:'数量', unit_price:'单价', amount:'金额', add_item:'+ 添加项目',
    subtotal:'小计', tax:'税率（%）', tax_amount:'税额', total:'总计',
    notes:'备注 / 付款说明', notes_ph:'例：请于30天内完成付款，支持银行转账、支付宝。',
    print:'🖨️ 打印 / 保存为 PDF', preview:'发票预览',
    from_ph:'你的公司名称\n地址、电话\n邮箱',
    to_ph:'客户公司名称\n客户地址\n客户邮箱',
    paid:'已付款', currency:'货币',
  },
  'zh-TW': {
    from:'賣方（開立人）', to:'買方（客戶）', invoice_no:'發票號碼', date:'開立日期', due:'付款截止日',
    items:'明細項目', desc:'描述', qty:'數量', unit_price:'單價', amount:'金額', add_item:'+ 新增項目',
    subtotal:'小計', tax:'稅率（%）', tax_amount:'稅額', total:'合計',
    notes:'備註 / 付款說明', notes_ph:'例：請於30天內完成付款，支援銀行轉帳。',
    print:'🖨️ 列印 / 儲存為 PDF', preview:'發票預覽',
    from_ph:'您的公司名稱\n地址、電話\n電子郵件',
    to_ph:'客戶公司名稱\n客戶地址\n客戶電子郵件',
    paid:'已付款', currency:'幣別',
  },
  ja: {
    from:'発行者（売り手）', to:'宛先（買い手）', invoice_no:'請求書番号', date:'発行日', due:'支払期限',
    items:'明細', desc:'内容', qty:'数量', unit_price:'単価', amount:'金額', add_item:'+ 明細を追加',
    subtotal:'小計', tax:'税率（%）', tax_amount:'消費税', total:'合計',
    notes:'備考 / お支払い条件', notes_ph:'例：請求書到着後30日以内にお振込みください。',
    print:'🖨️ 印刷 / PDFで保存', preview:'請求書プレビュー',
    from_ph:'会社名\n〒000-0000 住所\nメールアドレス',
    to_ph:'取引先名\n住所\nメールアドレス',
    paid:'支払済', currency:'通貨',
  },
};

function today() { const d = new Date(); return d.toISOString().slice(0, 10); }
function due30() { const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0, 10); }

function genInvoiceNo() { return 'INV-' + Date.now().toString().slice(-6); }

export default function InvoiceGeneratorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const cfg = LOCALE_CONFIG[locale] || LOCALE_CONFIG.en;

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState(() => genInvoiceNo());
  const [date, setDate] = useState(today());
  const [due, setDue] = useState(due30());
  const [taxRate, setTaxRate] = useState(cfg.taxRate);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { desc:'', qty:'1', price:'' },
    { desc:'', qty:'1', price:'' },
  ]);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  }, [slug]);

  const subtotal = items.reduce((s, item) => s + ((parseFloat(item.qty)||0) * (parseFloat(item.price)||0)), 0);
  const taxAmt = subtotal * (parseFloat(taxRate)||0) / 100;
  const total = subtotal + taxAmt;

  const fmtCurrency = (n: number) => {
    if (locale === 'ja') return cfg.symbol + Math.round(n).toLocaleString();
    return cfg.symbol + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const addItem = () => setItems(prev => [...prev, { desc:'', qty:'1', price:'' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_,j)=>j!==i));
  const updateItem = (i: number, field: keyof LineItem, val: string) =>
    setItems(prev => prev.map((item,j) => j===i ? {...item, [field]:val} : item));

  const card: React.CSSProperties = { background:'var(--color-card-bg)', border:'1px solid var(--color-border)', borderRadius:'12px', padding:'1.25rem', marginBottom:'1rem' };
  const inp: React.CSSProperties = { padding:'0.5rem 0.75rem', borderRadius:'6px', border:'1px solid var(--color-border)', background:'var(--color-card-bg)', color:'var(--color-text)', fontSize:'0.9rem', width:'100%', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.78rem', marginBottom:'0.3rem', color:'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap:'0.75rem', marginBottom:'0.75rem' };

  const printStyle = `
    @media print {
      .inv-no-print { display: none !important; }
      body > * { display: none; }
      #inv-preview { display: block !important; }
      .inv-preview-wrap { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; }
    }
  `;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: printStyle }} />

      {/* Form */}
      <div className="inv-no-print">
        <div style={card}>
          <div style={grid2}>
            <div>
              <label style={lbl}>{t.from}</label>
              <textarea style={{ ...inp, height:'80px', resize:'vertical' }} placeholder={t.from_ph} value={from} onChange={e=>setFrom(e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>{t.to}</label>
              <textarea style={{ ...inp, height:'80px', resize:'vertical' }} placeholder={t.to_ph} value={to} onChange={e=>setTo(e.target.value)}/>
            </div>
            <div><label style={lbl}>{t.invoice_no}</label><input style={inp} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)}/></div>
            <div><label style={lbl}>{t.date}</label><input style={inp} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label style={lbl}>{t.due}</label><input style={inp} type="date" value={due} onChange={e=>setDue(e.target.value)}/></div>
            <div><label style={lbl}>{t.tax} ({cfg.taxLabel})</label><input style={inp} type="number" min="0" max="30" step="0.5" value={taxRate} onChange={e=>setTaxRate(e.target.value)}/></div>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'0.9rem', fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{t.items}</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'480px' }}>
              <thead>
                <tr style={{ background:'var(--color-bg)' }}>
                  {[t.desc, t.qty, t.unit_price, t.amount, ''].map(h => (
                    <th key={h} style={{ padding:'0.4rem 0.5rem', fontSize:'0.78rem', color:'var(--color-text-secondary)', textAlign:h===t.desc?'left':'right', borderBottom:'1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding:'0.3rem 0.25rem' }}><input style={{ ...inp, fontSize:'0.82rem' }} placeholder={t.desc} value={item.desc} onChange={e=>updateItem(i,'desc',e.target.value)}/></td>
                    <td style={{ padding:'0.3rem 0.25rem', width:'60px' }}><input style={{ ...inp, fontSize:'0.82rem', textAlign:'right' }} type="number" min="0" step="0.5" value={item.qty} onChange={e=>updateItem(i,'qty',e.target.value)}/></td>
                    <td style={{ padding:'0.3rem 0.25rem', width:'110px' }}><input style={{ ...inp, fontSize:'0.82rem', textAlign:'right' }} type="number" min="0" step="0.01" placeholder="0" value={item.price} onChange={e=>updateItem(i,'price',e.target.value)}/></td>
                    <td style={{ padding:'0.3rem 0.5rem', textAlign:'right', fontSize:'0.85rem', fontWeight:500, color:'var(--color-text)', whiteSpace:'nowrap' }}>{fmtCurrency((parseFloat(item.qty)||0)*(parseFloat(item.price)||0))}</td>
                    <td style={{ padding:'0.3rem', width:'30px' }}>
                      {items.length > 1 && <button onClick={()=>removeItem(i)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1rem', padding:'0.2rem' }}>×</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addItem} style={{ marginTop:'0.5rem', padding:'0.35rem 0.85rem', borderRadius:'6px', border:'1px dashed var(--color-border)', background:'transparent', color:'var(--color-primary)', cursor:'pointer', fontSize:'0.82rem' }}>{t.add_item}</button>

          <div style={{ marginTop:'1rem', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.3rem', fontSize:'0.88rem' }}>
            <div style={{ display:'flex', gap:'2rem' }}><span style={{ color:'var(--color-text-secondary)' }}>{t.subtotal}</span><span style={{ fontWeight:600 }}>{fmtCurrency(subtotal)}</span></div>
            {taxAmt > 0 && <div style={{ display:'flex', gap:'2rem' }}><span style={{ color:'var(--color-text-secondary)' }}>{cfg.taxLabel} ({taxRate}%)</span><span style={{ fontWeight:600 }}>{fmtCurrency(taxAmt)}</span></div>}
            <div style={{ display:'flex', gap:'2rem', fontSize:'1.1rem', fontWeight:800, color:'var(--color-primary)', borderTop:'2px solid var(--color-primary)', paddingTop:'0.4rem', marginTop:'0.2rem' }}>
              <span>{t.total}</span><span>{fmtCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div style={card}>
          <label style={lbl}>{t.notes}</label>
          <textarea style={{ ...inp, height:'70px', resize:'vertical' }} placeholder={t.notes_ph} value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>

        <button onClick={()=>window.print()} style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', border:'none', background:'var(--color-primary)', color:'#fff', fontSize:'1rem', fontWeight:700, cursor:'pointer', marginBottom:'1.5rem' }}>
          {t.print}
        </button>
      </div>

      {/* Invoice Preview */}
      <div id="inv-preview">
        <h3 className="inv-no-print" style={{ margin:'0 0 0.75rem', fontSize:'0.9rem', fontWeight:600, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{t.preview}</h3>
        <div className="inv-preview-wrap" style={{ background:'#fff', color:'#111', borderRadius:'8px', padding:'2.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.12)', fontSize:'0.88rem', lineHeight:1.6, fontFamily:'system-ui, sans-serif' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem', borderBottom:'3px solid #2563eb', paddingBottom:'1.5rem' }}>
            <div>
              <div style={{ fontSize:'1.8rem', fontWeight:900, color:'#2563eb', letterSpacing:'-0.03em' }}>{locale === 'ja' ? '請求書' : locale.startsWith('zh') ? '发票' : 'INVOICE'}</div>
              <div style={{ color:'#666', marginTop:'0.5rem', whiteSpace:'pre-line', fontSize:'0.82rem' }}>{from || t.from_ph}</div>
            </div>
            <div style={{ textAlign:'right', fontSize:'0.82rem', color:'#666' }}>
              <div><strong style={{ color:'#111' }}>{t.invoice_no}:</strong> {invoiceNo}</div>
              <div><strong style={{ color:'#111' }}>{t.date}:</strong> {date}</div>
              <div><strong style={{ color:'#111' }}>{t.due}:</strong> {due}</div>
            </div>
          </div>

          {/* Bill To */}
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'#888', marginBottom:'0.25rem' }}>{t.to}</div>
            <div style={{ whiteSpace:'pre-line', color:'#333', fontWeight:500 }}>{to || t.to_ph}</div>
          </div>

          {/* Items Table */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'1.5rem' }}>
            <thead>
              <tr style={{ background:'#2563eb', color:'#fff' }}>
                <th style={{ padding:'0.6rem 0.75rem', textAlign:'left', fontSize:'0.78rem', fontWeight:600 }}>{t.desc}</th>
                <th style={{ padding:'0.6rem 0.75rem', textAlign:'right', fontSize:'0.78rem', fontWeight:600, width:'60px' }}>{t.qty}</th>
                <th style={{ padding:'0.6rem 0.75rem', textAlign:'right', fontSize:'0.78rem', fontWeight:600, width:'110px' }}>{t.unit_price}</th>
                <th style={{ padding:'0.6rem 0.75rem', textAlign:'right', fontSize:'0.78rem', fontWeight:600, width:'110px' }}>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(item => item.desc || item.price).map((item, i) => (
                <tr key={i} style={{ background: i%2===0 ? '#f8faff' : '#fff' }}>
                  <td style={{ padding:'0.5rem 0.75rem', borderBottom:'1px solid #e5e7eb' }}>{item.desc || '—'}</td>
                  <td style={{ padding:'0.5rem 0.75rem', textAlign:'right', borderBottom:'1px solid #e5e7eb' }}>{item.qty}</td>
                  <td style={{ padding:'0.5rem 0.75rem', textAlign:'right', borderBottom:'1px solid #e5e7eb' }}>{fmtCurrency(parseFloat(item.price)||0)}</td>
                  <td style={{ padding:'0.5rem 0.75rem', textAlign:'right', fontWeight:600, borderBottom:'1px solid #e5e7eb' }}>{fmtCurrency((parseFloat(item.qty)||0)*(parseFloat(item.price)||0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ minWidth:'260px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', color:'#555' }}>
                <span>{t.subtotal}</span><span style={{ fontWeight:600, color:'#111' }}>{fmtCurrency(subtotal)}</span>
              </div>
              {taxAmt > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', color:'#555', borderBottom:'1px solid #e5e7eb' }}>
                  <span>{cfg.taxLabel} ({taxRate}%)</span><span style={{ fontWeight:600, color:'#111' }}>{fmtCurrency(taxAmt)}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', marginTop:'0.25rem', borderTop:'2px solid #2563eb', fontSize:'1.1rem', fontWeight:800, color:'#2563eb' }}>
                <span>{t.total}</span><span>{fmtCurrency(total)}</span>
              </div>
            </div>
          </div>

          {notes && (
            <div style={{ marginTop:'2rem', padding:'0.75rem 1rem', background:'#f0f4ff', borderRadius:'6px', fontSize:'0.82rem', color:'#444', borderLeft:'3px solid #2563eb' }}>
              {notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
