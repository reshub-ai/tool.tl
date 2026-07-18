import { useState, useRef, useEffect, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    title_field: 'Title',
    desc_field: 'Description',
    site_field: 'Site Name',
    bg_type: 'Background',
    bg_solid: 'Solid Color',
    bg_gradient: 'Gradient',
    bg_color: 'Background Color',
    grad_from: 'Gradient From',
    grad_to: 'Gradient To',
    text_color: 'Text Color',
    accent: 'Accent Color',
    logo: 'Logo / Icon (optional)',
    logo_upload: 'Upload logo',
    remove_logo: 'Remove',
    template: 'Template',
    tpl_dark: 'Dark',
    tpl_light: 'Light',
    tpl_brand: 'Brand',
    download: 'Download 1200×630 PNG',
    size_note: 'Output: 1200×630 px — optimal for Open Graph and Twitter Cards',
    preview: 'Preview',
    title_ph: 'Your Page Title',
    desc_ph: 'A short description of your page',
    site_ph: 'yoursite.com',
  },
  'zh-CN': {
    title_field: '标题',
    desc_field: '描述',
    site_field: '网站名称',
    bg_type: '背景',
    bg_solid: '纯色',
    bg_gradient: '渐变',
    bg_color: '背景颜色',
    grad_from: '渐变起始色',
    grad_to: '渐变终止色',
    text_color: '文字颜色',
    accent: '强调色',
    logo: 'Logo / 图标（可选）',
    logo_upload: '上传 Logo',
    remove_logo: '移除',
    template: '模板',
    tpl_dark: '深色',
    tpl_light: '浅色',
    tpl_brand: '品牌',
    download: '下载 1200×630 PNG',
    size_note: '输出尺寸：1200×630 像素，适用于 Open Graph 和 Twitter Card',
    preview: '预览',
    title_ph: '页面标题',
    desc_ph: '页面简短描述',
    site_ph: 'yoursite.com',
  },
  'zh-TW': {
    title_field: '標題',
    desc_field: '描述',
    site_field: '網站名稱',
    bg_type: '背景',
    bg_solid: '純色',
    bg_gradient: '漸層',
    bg_color: '背景顏色',
    grad_from: '漸層起始色',
    grad_to: '漸層終止色',
    text_color: '文字顏色',
    accent: '強調色',
    logo: 'Logo / 圖示（可選）',
    logo_upload: '上傳 Logo',
    remove_logo: '移除',
    template: '範本',
    tpl_dark: '深色',
    tpl_light: '淺色',
    tpl_brand: '品牌',
    download: '下載 1200×630 PNG',
    size_note: '輸出尺寸：1200×630 像素，適用於 Open Graph 和 Twitter Card',
    preview: '預覽',
    title_ph: '頁面標題',
    desc_ph: '頁面簡短描述',
    site_ph: 'yoursite.com',
  },
  ja: {
    title_field: 'タイトル',
    desc_field: '説明',
    site_field: 'サイト名',
    bg_type: '背景',
    bg_solid: '単色',
    bg_gradient: 'グラデーション',
    bg_color: '背景色',
    grad_from: 'グラデーション開始色',
    grad_to: 'グラデーション終了色',
    text_color: 'テキスト色',
    accent: 'アクセント色',
    logo: 'ロゴ/アイコン（任意）',
    logo_upload: 'ロゴをアップロード',
    remove_logo: '削除',
    template: 'テンプレート',
    tpl_dark: 'ダーク',
    tpl_light: 'ライト',
    tpl_brand: 'ブランド',
    download: '1200×630 PNG をダウンロード',
    size_note: '出力: 1200×630 px — OGPとTwitterカードに最適',
    preview: 'プレビュー',
    title_ph: 'ページタイトル',
    desc_ph: 'ページの短い説明',
    site_ph: 'yoursite.com',
  },
};

type BgType = 'solid' | 'gradient';
type Template = 'dark' | 'light' | 'brand';

const TEMPLATES: Record<Template, { bg: string; bg2: string; bgType: BgType; textColor: string; accent: string }> = {
  dark: { bg: '#0f172a', bg2: '#1e3a5f', bgType: 'gradient', textColor: '#f8fafc', accent: '#3b82f6' },
  light: { bg: '#ffffff', bg2: '#f1f5f9', bgType: 'gradient', textColor: '#0f172a', accent: '#3b82f6' },
  brand: { bg: '#7c3aed', bg2: '#4f46e5', bgType: 'gradient', textColor: '#ffffff', accent: '#fbbf24' },
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line); line = word;
    } else { line = test; }
  }
  if (line) lines.push(line);
  return lines;
}

export default function OgImageGeneratorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const trackedRef = useRef(false);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [site, setSite] = useState('');
  const [bgType, setBgType] = useState<BgType>('gradient');
  const [bg, setBg] = useState('#0f172a');
  const [bg2, setBg2] = useState('#1e3a5f');
  const [textColor, setTextColor] = useState('#f8fafc');
  const [accent, setAccent] = useState('#3b82f6');
  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const applyTemplate = (tpl: Template) => {
    const t = TEMPLATES[tpl];
    setBg(t.bg); setBg2(t.bg2); setBgType(t.bgType);
    setTextColor(t.textColor); setAccent(t.accent);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 1200; const H = 630;
    canvas.width = W; canvas.height = H;

    // 背景
    if (bgType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, bg); grad.addColorStop(1, bg2);
      ctx.fillStyle = grad;
    } else { ctx.fillStyle = bg; }
    ctx.fillRect(0, 0, W, H);

    // 装饰圆形
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(W - 150, -100, 350, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-100, H + 80, 280, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    const pad = 72;

    // Logo
    let logoX = pad;
    if (logoRef.current && logoRef.current.complete) {
      const lh = 52; const lw = logoRef.current.naturalWidth * (lh / logoRef.current.naturalHeight);
      ctx.drawImage(logoRef.current, pad, pad, lw, lh);
      logoX = pad + lw + 16;
    }

    // 网站名
    if (site) {
      ctx.font = `500 ${28}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillStyle = textColor; ctx.globalAlpha = 0.65;
      ctx.fillText(site, logoX, pad + 36);
      ctx.globalAlpha = 1;
    }

    // 强调线
    ctx.fillStyle = accent;
    ctx.fillRect(pad, 160, 60, 5);

    // 标题
    const titleText = title || t.title_ph;
    const fontSize = titleText.length > 50 ? 52 : titleText.length > 30 ? 60 : 68;
    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = textColor;
    const titleLines = wrapText(ctx, titleText, W - pad * 2, fontSize * 1.2);
    titleLines.slice(0, 3).forEach((line, i) => {
      ctx.fillText(line, pad, 200 + i * (fontSize * 1.2));
    });

    // 描述
    if (desc) {
      const descY = 200 + titleLines.slice(0, 3).length * (fontSize * 1.2) + 28;
      ctx.font = `400 ${30}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillStyle = textColor; ctx.globalAlpha = 0.7;
      const descLines = wrapText(ctx, desc, W - pad * 2, 38);
      descLines.slice(0, 2).forEach((line, i) => { ctx.fillText(line, pad, descY + i * 42); });
      ctx.globalAlpha = 1;
    }

    // 底部强调点
    ctx.fillStyle = accent;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(pad + i * 18, H - pad - 20, 5, 0, Math.PI * 2); ctx.fill();
    }
  }, [title, desc, site, bgType, bg, bg2, textColor, accent, logoUrl, t.title_ph]);

  useEffect(() => { draw(); }, [draw]);

  const handleLogo = (f: File) => {
    const url = URL.createObjectURL(f); setLogoUrl(url);
    const img = new Image();
    img.onload = () => { logoRef.current = img; draw(); };
    img.src = url;
  };

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'tool.tl-og-image.png'; a.click();
    if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const inp: React.CSSProperties = {
    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.9rem',
    width: '100%', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', marginBottom: '0.25rem', color: 'var(--color-text-secondary)' };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem', marginBottom: '0.75rem' };

  return (
    <div>
      {/* 预览 */}
      <div style={card}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{t.preview} (1200×630)</p>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'block' }} />
      </div>

      {/* 模板 */}
      <div style={card}>
        <label style={lbl}>{t.template}</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0' }}>
          {(['dark', 'light', 'brand'] as Template[]).map((tpl) => (
            <button key={tpl} onClick={() => applyTemplate(tpl)} style={{
              padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer',
              border: '1px solid var(--color-border)', background: TEMPLATES[tpl].bg,
              color: TEMPLATES[tpl].textColor, fontWeight: 600,
            }}>
              {tpl === 'dark' ? t.tpl_dark : tpl === 'light' ? t.tpl_light : t.tpl_brand}
            </button>
          ))}
        </div>
      </div>

      {/* 文字内容 */}
      <div style={card}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{t.title_field}</label>
          <input style={inp} value={title} placeholder={t.title_ph} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{t.desc_field}</label>
          <input style={inp} value={desc} placeholder={t.desc_ph} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>{t.site_field}</label>
          <input style={inp} value={site} placeholder={t.site_ph} onChange={(e) => setSite(e.target.value)} />
        </div>
      </div>

      {/* 颜色与背景 */}
      <div style={card}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={lbl}>{t.bg_type}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['solid', 'gradient'] as BgType[]).map((bt) => (
              <button key={bt} onClick={() => setBgType(bt)} style={{
                padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
                border: bgType === bt ? 'none' : '1px solid var(--color-border)',
                background: bgType === bt ? 'var(--color-primary)' : 'var(--color-card-bg)',
                color: bgType === bt ? '#fff' : 'var(--color-text)',
              }}>
                {bt === 'solid' ? t.bg_solid : t.bg_gradient}
              </button>
            ))}
          </div>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>{bgType === 'gradient' ? t.grad_from : t.bg_color}</label>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }} />
          </div>
          {bgType === 'gradient' && (
            <div>
              <label style={lbl}>{t.grad_to}</label>
              <input type="color" value={bg2} onChange={(e) => setBg2(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }} />
            </div>
          )}
          <div>
            <label style={lbl}>{t.text_color}</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }} />
          </div>
          <div>
            <label style={lbl}>{t.accent}</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid var(--color-border)', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Logo */}
        <div>
          <label style={lbl}>{t.logo}</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(f); }} />
            <button onClick={() => logoInputRef.current?.click()} style={{
              padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)',
              background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem',
            }}>{t.logo_upload}</button>
            {logoUrl && <button onClick={() => { setLogoUrl(''); logoRef.current = null; draw(); }} style={{
              padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid #ef4444',
              background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem',
            }}>{t.remove_logo}</button>}
          </div>
        </div>
      </div>

      {/* 下载 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button onClick={download} style={{
          padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none',
          background: 'var(--color-primary)', color: '#fff', fontWeight: 700,
          fontSize: '0.95rem', cursor: 'pointer',
        }}>{t.download}</button>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.size_note}</p>
      </div>
    </div>
  );
}
