import { useState, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    title: 'Browser Fingerprint',
    scanning: 'Scanning browser fingerprint…',
    rescan: 'Rescan',
    copy: 'Copy Fingerprint ID',
    copied: 'Copied!',
    uniqueness: 'Uniqueness Score',
    unique_high: 'Highly Unique',
    unique_med: 'Moderately Unique',
    unique_low: 'Less Unique',
    section_basic: 'Basic Info',
    section_screen: 'Screen & Display',
    section_hw: 'Hardware',
    section_media: 'Media Capabilities',
    section_network: 'Network',
    section_misc: 'Misc',
    what_is: 'What is Browser Fingerprinting?',
    what_is_desc: 'Browser fingerprinting collects technical attributes of your browser and device to create a unique identifier — even without cookies. Websites can track you across sessions using this fingerprint.',
  },
  'zh-CN': {
    title: '浏览器指纹检测',
    scanning: '正在扫描浏览器指纹…',
    rescan: '重新扫描',
    copy: '复制指纹 ID',
    copied: '已复制！',
    uniqueness: '唯一性评分',
    unique_high: '高度唯一',
    unique_med: '中等唯一',
    unique_low: '唯一性较低',
    section_basic: '基本信息',
    section_screen: '屏幕与显示',
    section_hw: '硬件',
    section_media: '媒体能力',
    section_network: '网络',
    section_misc: '其他',
    what_is: '什么是浏览器指纹？',
    what_is_desc: '浏览器指纹通过收集浏览器和设备的技术属性生成唯一标识符——无需 Cookie 即可实现。网站可利用指纹跨会话追踪用户。',
  },
  'zh-TW': {
    title: '瀏覽器指紋檢測',
    scanning: '正在掃描瀏覽器指紋…',
    rescan: '重新掃描',
    copy: '複製指紋 ID',
    copied: '已複製！',
    uniqueness: '唯一性評分',
    unique_high: '高度唯一',
    unique_med: '中等唯一',
    unique_low: '唯一性較低',
    section_basic: '基本資訊',
    section_screen: '螢幕與顯示',
    section_hw: '硬體',
    section_media: '媒體能力',
    section_network: '網路',
    section_misc: '其他',
    what_is: '什麼是瀏覽器指紋？',
    what_is_desc: '瀏覽器指紋透過收集瀏覽器和裝置的技術屬性產生唯一識別碼——無需 Cookie 即可實現。網站可利用指紋跨會話追蹤使用者。',
  },
  ja: {
    title: 'ブラウザフィンガープリント',
    scanning: 'フィンガープリントをスキャン中…',
    rescan: '再スキャン',
    copy: 'フィンガープリントIDをコピー',
    copied: 'コピー済み！',
    uniqueness: '一意性スコア',
    unique_high: '高い一意性',
    unique_med: '中程度の一意性',
    unique_low: '低い一意性',
    section_basic: '基本情報',
    section_screen: '画面・ディスプレイ',
    section_hw: 'ハードウェア',
    section_media: 'メディア能力',
    section_network: 'ネットワーク',
    section_misc: 'その他',
    what_is: 'ブラウザフィンガープリントとは？',
    what_is_desc: 'ブラウザフィンガープリントは、ブラウザとデバイスの技術的属性を収集してCookieなしに一意のIDを作成します。ウェブサイトはこれを使ってセッション間であなたを追跡できます。',
  },
};

interface FpData { label: string; value: string; bits?: number; }
interface Section { title: string; items: FpData[]; }

async function collectFingerprint(t: Record<string, string>): Promise<{ sections: Section[]; id: string; score: number }> {
  const nav = window.navigator;
  const scr = window.screen;

  // Canvas fingerprint
  let canvasFp = '';
  try {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 50;
    const ctx = c.getContext('2d')!;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069'; ctx.fillText('BrowserFP 🎨', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)'; ctx.fillText('BrowserFP 🎨', 4, 17);
    canvasFp = c.toDataURL().slice(-20);
  } catch { canvasFp = 'blocked'; }

  // WebGL renderer
  let glRenderer = 'N/A'; let glVendor = 'N/A';
  try {
    const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null;
    if (gl) {
      const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgInfo) {
        glRenderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) || 'N/A';
        glVendor = gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL) || 'N/A';
      }
    }
  } catch { /* blocked */ }

  // Audio fingerprint
  let audioFp = 'N/A';
  try {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const analyser = ac.createAnalyser();
    const gain = ac.createGain();
    gain.gain.value = 0;
    osc.connect(analyser); analyser.connect(gain); gain.connect(ac.destination);
    osc.start(0); osc.stop(0.001);
    const buf = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(buf);
    audioFp = buf.slice(0, 5).map((n) => n.toFixed(2)).join(',');
    await ac.close();
  } catch { audioFp = 'blocked'; }

  // Fonts (sample check)
  const testFonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'];
  const detectedFonts: string[] = [];
  const testStr = 'mmmmwwwwi';
  const baseSize = '72px';
  const base = document.createElement('canvas');
  base.width = 200; base.height = 80;
  const bCtx = base.getContext('2d')!;
  bCtx.font = `${baseSize} monospace`; const w0 = bCtx.measureText(testStr).width;
  for (const f of testFonts) {
    bCtx.font = `${baseSize} '${f}',monospace`;
    if (bCtx.measureText(testStr).width !== w0) detectedFonts.push(f);
  }

  // Media devices count
  let audioIn = 0, videoIn = 0, audioOut = 0;
  try {
    const devices = await nav.mediaDevices?.enumerateDevices() || [];
    audioIn = devices.filter((d) => d.kind === 'audioinput').length;
    videoIn = devices.filter((d) => d.kind === 'videoinput').length;
    audioOut = devices.filter((d) => d.kind === 'audiooutput').length;
  } catch { /* blocked */ }

  // Connection
  const conn = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection;

  const sections: Section[] = [
    {
      title: t.section_basic,
      items: [
        { label: 'User Agent', value: nav.userAgent, bits: 8 },
        { label: 'Language', value: nav.language + (nav.languages ? ` (${nav.languages.join(', ')})` : ''), bits: 3 },
        { label: 'Platform', value: nav.platform, bits: 3 },
        { label: 'Cookies Enabled', value: String(nav.cookieEnabled) },
        { label: 'Do Not Track', value: nav.doNotTrack || 'unset' },
        { label: 'Timezone', value: Intl.DateTimeFormat().resolvedOptions().timeZone, bits: 4 },
        { label: 'Timezone Offset', value: `UTC${new Date().getTimezoneOffset() / -60 >= 0 ? '+' : ''}${new Date().getTimezoneOffset() / -60}` },
      ],
    },
    {
      title: t.section_screen,
      items: [
        { label: 'Screen Resolution', value: `${scr.width}×${scr.height}`, bits: 4 },
        { label: 'Available Resolution', value: `${scr.availWidth}×${scr.availHeight}` },
        { label: 'Color Depth', value: `${scr.colorDepth}-bit`, bits: 2 },
        { label: 'Pixel Ratio', value: String(window.devicePixelRatio), bits: 2 },
        { label: 'Touch Points', value: String(nav.maxTouchPoints) },
      ],
    },
    {
      title: t.section_hw,
      items: [
        { label: 'CPU Cores', value: String(nav.hardwareConcurrency || 'N/A'), bits: 2 },
        { label: 'Memory (GB)', value: String((nav as any).deviceMemory || 'N/A'), bits: 2 },
        { label: 'WebGL Vendor', value: glVendor, bits: 4 },
        { label: 'WebGL Renderer', value: glRenderer, bits: 5 },
        { label: 'Canvas FP', value: canvasFp, bits: 6 },
        { label: 'Audio FP', value: audioFp, bits: 5 },
      ],
    },
    {
      title: t.section_media,
      items: [
        { label: 'Audio Inputs', value: String(audioIn) },
        { label: 'Video Inputs', value: String(videoIn) },
        { label: 'Audio Outputs', value: String(audioOut) },
        { label: 'Fonts Detected', value: detectedFonts.join(', ') || 'none', bits: 4 },
      ],
    },
    {
      title: t.section_network,
      items: [
        { label: 'Connection Type', value: conn?.effectiveType || 'N/A' },
        { label: 'Downlink', value: conn ? `${conn.downlink} Mbps` : 'N/A' },
        { label: 'RTT', value: conn ? `${conn.rtt} ms` : 'N/A' },
      ],
    },
    {
      title: t.section_misc,
      items: [
        { label: 'JS Engines', value: (() => { try { return Function.prototype.toString.call(Function).slice(0, 20); } catch { return 'N/A'; } })() },
        { label: 'PDF Viewer', value: String(nav.pdfViewerEnabled ?? 'N/A') },
        { label: 'Ad Blocker', value: (() => { const d = document.createElement('div'); d.className = 'ad banner ads'; d.style.cssText = 'position:absolute;left:-9999px'; document.body.appendChild(d); const hidden = d.offsetHeight === 0; document.body.removeChild(d); return hidden ? 'likely' : 'not detected'; })() },
      ],
    },
  ];

  // 简单哈希生成 ID
  const raw = sections.flatMap((s) => s.items.map((i) => i.value)).join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0; }
  const id = (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();

  const score = sections.flatMap((s) => s.items).reduce((sum, item) => sum + (item.bits || 0), 0);

  return { sections, id, score };
}

export default function BrowserFingerprintTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [scanning, setScanning] = useState(true);
  const [data, setData] = useState<{ sections: Section[]; id: string; score: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const trackedRef = useRef(false);

  const run = async () => {
    setScanning(true);
    const result = await collectFingerprint(t);
    setData(result);
    setScanning(false);
    if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
  };

  useEffect(() => { run(); }, []);

  const copyId = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.id);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const scoreColor = !data ? '#6b7280' : data.score >= 40 ? '#ef4444' : data.score >= 25 ? '#f59e0b' : '#22c55e';
  const scoreLabel = !data ? '' : data.score >= 40 ? t.unique_high : data.score >= 25 ? t.unique_med : t.unique_low;

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '0.45rem 0', borderBottom: '1px solid var(--color-border)', gap: '1rem',
  };
  const pill: React.CSSProperties = {
    padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem',
  };
  const pillPrimary: React.CSSProperties = {
    ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600,
  };

  return (
    <div>
      {/* 状态栏 */}
      <div style={{ ...card, marginBottom: '1rem' }}>
        {scanning ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{t.scanning}</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : data ? (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>Fingerprint ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.1em' }}>{data.id}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.uniqueness}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: scoreColor }}>{scoreLabel} ({data.score} bits)</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={copyId} style={pillPrimary}>{copied ? t.copied : t.copy}</button>
              <button onClick={run} style={pill}>{t.rescan}</button>
            </div>
          </div>
        ) : null}
      </div>

      {/* 指纹详情 */}
      {data && data.sections.map((sec) => (
        <div key={sec.title} style={{ ...card, marginBottom: '0.75rem' }}>
          <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sec.title}</h3>
          {sec.items.map((item, idx) => (
            <div key={idx} style={{ ...rowStyle, borderBottom: idx === sec.items.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', flexShrink: 0, minWidth: '140px' }}>{item.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text)', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right' }}>{item.value}</span>
            </div>
          ))}
        </div>
      ))}

      {/* 说明 */}
      {!scanning && (
        <div style={card}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--color-text)' }}>{t.what_is}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{t.what_is_desc}</p>
        </div>
      )}
    </div>
  );
}
