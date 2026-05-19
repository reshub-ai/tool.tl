import { useState, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    title: 'WebRTC Leak Test',
    testing: 'Testing WebRTC…',
    test_again: 'Test Again',
    public_ip: 'Your Public IP',
    local_ips: 'IPs Detected via WebRTC',
    status: 'Status',
    leak_detected: 'WebRTC Leak Detected',
    no_leak: 'No WebRTC Leak',
    disabled: 'WebRTC Disabled',
    leak_desc: 'Your real local IP is exposed through WebRTC. A VPN does not hide local IPs — this is expected behavior.',
    no_leak_desc: 'WebRTC is active but no local IPs were detected.',
    disabled_desc: 'WebRTC appears to be disabled in your browser.',
    what_is: 'What is a WebRTC Leak?',
    what_is_desc: 'WebRTC (Web Real-Time Communication) is a browser feature for video/audio calls. It can expose your local network IP address even when you are using a VPN, because VPNs typically do not route WebRTC traffic.',
    how_fix: 'How to prevent it',
    how_fix_desc: 'Use a browser extension like uBlock Origin (enable "Prevent WebRTC from leaking local IP addresses"), or disable WebRTC in browser settings.',
    ipv4: 'IPv4',
    ipv6: 'IPv6',
    fetching: 'Fetching…',
    unavailable: 'Unavailable',
    compare_title: 'IP Comparison',
    network_ip: 'Network-reported IP',
    webrtc_ip: 'WebRTC-detected IP',
    ip_match: 'Match — WebRTC is routing through VPN',
    ip_mismatch: 'Mismatch — Real IP may be exposed',
    ip_private_only: 'Private IP only — local network visible',
    private_label: 'Private',
    public_label: 'Public',
  },
  'zh-CN': {
    title: 'WebRTC 泄露检测',
    testing: '正在检测 WebRTC…',
    test_again: '重新检测',
    public_ip: '你的公网 IP',
    local_ips: 'WebRTC 检测到的 IP',
    status: '检测结果',
    leak_detected: '检测到 WebRTC 泄露',
    no_leak: '未发现 WebRTC 泄露',
    disabled: 'WebRTC 已禁用',
    leak_desc: '你的本地真实 IP 通过 WebRTC 暴露。VPN 通常不会隐藏本地 IP，这是预期行为。',
    no_leak_desc: 'WebRTC 正常运行，但未检测到本地 IP 泄露。',
    disabled_desc: '浏览器中的 WebRTC 似乎已被禁用。',
    what_is: '什么是 WebRTC 泄露？',
    what_is_desc: 'WebRTC（网页实时通信）是浏览器用于视频/音频通话的功能。即使使用 VPN，它也可能暴露你的本地网络 IP，因为 VPN 通常不会路由 WebRTC 流量。',
    how_fix: '如何防止泄露',
    how_fix_desc: '使用 uBlock Origin 等浏览器扩展（开启"阻止 WebRTC 泄露本地 IP"选项），或在浏览器设置中禁用 WebRTC。',
    ipv4: 'IPv4',
    ipv6: 'IPv6',
    fetching: '获取中…',
    unavailable: '不可用',
    compare_title: 'IP 对比',
    network_ip: '网络报告 IP',
    webrtc_ip: 'WebRTC 检测 IP',
    ip_match: '一致 — WebRTC 流量经过 VPN',
    ip_mismatch: '不一致 — 真实 IP 可能已泄露',
    ip_private_only: '仅内网 IP — 本地网络可见',
    private_label: '内网',
    public_label: '公网',
  },
  'zh-TW': {
    title: 'WebRTC 洩漏檢測',
    testing: '正在檢測 WebRTC…',
    test_again: '重新檢測',
    public_ip: '你的公網 IP',
    local_ips: 'WebRTC 偵測到的 IP',
    status: '檢測結果',
    leak_detected: '偵測到 WebRTC 洩漏',
    no_leak: '未發現 WebRTC 洩漏',
    disabled: 'WebRTC 已停用',
    leak_desc: '您的本地真實 IP 透過 WebRTC 暴露。VPN 通常不會隱藏本地 IP，這是預期行為。',
    no_leak_desc: 'WebRTC 正常運作，但未偵測到本地 IP 洩漏。',
    disabled_desc: '瀏覽器中的 WebRTC 似乎已停用。',
    what_is: '什麼是 WebRTC 洩漏？',
    what_is_desc: 'WebRTC（網頁即時通訊）是瀏覽器用於視訊/音訊通話的功能。即使使用 VPN，它也可能暴露本地網路 IP，因為 VPN 通常不路由 WebRTC 流量。',
    how_fix: '如何防止洩漏',
    how_fix_desc: '使用 uBlock Origin 等瀏覽器擴充功能（開啟「防止 WebRTC 洩漏本地 IP」選項），或在瀏覽器設定中停用 WebRTC。',
    ipv4: 'IPv4',
    ipv6: 'IPv6',
    fetching: '取得中…',
    unavailable: '無法取得',
    compare_title: 'IP 對比',
    network_ip: '網路回報 IP',
    webrtc_ip: 'WebRTC 偵測 IP',
    ip_match: '一致 — WebRTC 流量經過 VPN',
    ip_mismatch: '不一致 — 真實 IP 可能已洩漏',
    ip_private_only: '僅內網 IP — 本地網路可見',
    private_label: '內網',
    public_label: '公網',
  },
  ja: {
    title: 'WebRTCリークテスト',
    testing: 'WebRTCを検査中…',
    test_again: '再テスト',
    public_ip: 'あなたのパブリックIP',
    local_ips: 'WebRTC検出IP',
    status: '検査結果',
    leak_detected: 'WebRTCリーク検出',
    no_leak: 'WebRTCリークなし',
    disabled: 'WebRTC無効',
    leak_desc: 'WebRTC経由で実際のローカルIPが漏洩しています。VPNはローカルIPを隠しません — これは通常の動作です。',
    no_leak_desc: 'WebRTCは有効ですが、ローカルIPは検出されませんでした。',
    disabled_desc: 'ブラウザでWebRTCが無効になっているようです。',
    what_is: 'WebRTCリークとは？',
    what_is_desc: 'WebRTC（Web リアルタイム通信）はビデオ/音声通話のブラウザ機能です。VPN使用中でもローカルネットワークIPを公開することがあります。VPNはWebRTCトラフィックをルーティングしないためです。',
    how_fix: '防止方法',
    how_fix_desc: 'uBlock Originなどの拡張機能を使用（「WebRTCによるローカルIPの漏洩を防止」を有効化）するか、ブラウザ設定でWebRTCを無効にしてください。',
    ipv4: 'IPv4',
    ipv6: 'IPv6',
    fetching: '取得中…',
    unavailable: '取得不可',
    compare_title: 'IP比較',
    network_ip: 'ネットワーク報告IP',
    webrtc_ip: 'WebRTC検出IP',
    ip_match: '一致 — WebRTCはVPN経由',
    ip_mismatch: '不一致 — 実IPが漏洩している可能性',
    ip_private_only: 'プライベートIPのみ — ローカルネットワーク可視',
    private_label: 'プライベート',
    public_label: 'パブリック',
  },
};

function collectIPs(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips = new Set<string>();
    const ipv4Re = /(\d{1,3}\.){3}\d{1,3}/;
    const ipv6Re = /([a-f0-9]{1,4}:){2,}[a-f0-9]{1,4}/i;

    let pc: RTCPeerConnection | null = null;
    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    } catch {
      resolve([]);
      return;
    }

    pc.createDataChannel('');
    pc.onicecandidate = (e) => {
      if (!e.candidate) {
        pc?.close();
        resolve([...ips]);
        return;
      }
      const cand = e.candidate.candidate;
      const m4 = cand.match(ipv4Re);
      const m6 = cand.match(ipv6Re);
      if (m4) ips.add(m4[0]);
      if (m6) ips.add(m6[0]);
    };

    pc.createOffer().then((o) => pc!.setLocalDescription(o)).catch(() => resolve([]));
    setTimeout(() => { pc?.close(); resolve([...ips]); }, 5000);
  });
}

async function fetchPublicIP(): Promise<{ v4: string; v6: string }> {
  const tryFetch = async (url: string) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return r.ok ? (await r.text()).trim() : '';
    } catch { return ''; }
  };
  const [v4, v6] = await Promise.all([
    tryFetch('https://api4.ipify.org'),
    tryFetch('https://api6.ipify.org'),
  ]);
  return { v4, v6 };
}

function isPrivateIP(ip: string) {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|fc|fd|fe80)/i.test(ip);
}

export default function WebRTCLeakTestTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [testing, setTesting] = useState(true);
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [publicIP, setPublicIP] = useState({ v4: '', v6: '' });
  const [webrtcDisabled, setWebrtcDisabled] = useState(false);
  const trackedRef = useRef(false);

  const runTest = async () => {
    setTesting(true);
    setLocalIPs([]);
    setWebrtcDisabled(false);

    const [ips, pub] = await Promise.all([collectIPs(), fetchPublicIP()]);
    setPublicIP(pub);

    if (ips.length === 0 && typeof RTCPeerConnection === 'undefined') {
      setWebrtcDisabled(true);
    } else {
      setLocalIPs(ips);
    }
    setTesting(false);

    if (!trackedRef.current) {
      trackedRef.current = true;
      (window as any).__trackToolUsed?.(slug);
    }
  };

  useEffect(() => { runTest(); }, []);

  const hasLeak = localIPs.length > 0;
  const publicWebRTCIPs = localIPs.filter((ip) => !isPrivateIP(ip));
  const privateWebRTCIPs = localIPs.filter((ip) => isPrivateIP(ip));
  const ipMismatch = publicWebRTCIPs.length > 0 &&
    publicWebRTCIPs.some((ip) => ip !== publicIP.v4 && ip !== publicIP.v6);
  const ipMatch = publicWebRTCIPs.length > 0 &&
    publicWebRTCIPs.every((ip) => ip === publicIP.v4 || ip === publicIP.v6);

  const statusColor = webrtcDisabled ? '#6b7280' : hasLeak ? '#f59e0b' : '#22c55e';
  const statusText = webrtcDisabled ? t.disabled : hasLeak ? t.leak_detected : t.no_leak;
  const statusDesc = webrtcDisabled ? t.disabled_desc : hasLeak ? t.leak_desc : t.no_leak_desc;

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const row: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.85rem', color: 'var(--color-text-secondary)' };
  const valueStyle: React.CSSProperties = { fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text)' };

  return (
    <div>
      {/* 状态卡片 */}
      <div style={{ ...card, border: `2px solid ${statusColor}`, marginBottom: '1rem' }}>
        {testing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              border: '3px solid var(--color-primary)', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{t.testing}</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{webrtcDisabled ? '⚪' : hasLeak ? '🟡' : '🟢'}</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: statusColor }}>{statusText}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{statusDesc}</p>
          </>
        )}
      </div>

      {/* IP 信息 */}
      {!testing && (
        <>
          <div style={card}>
            {/* 公网 IP（ipify） */}
            <div style={row}>
              <span style={labelStyle}>{t.public_ip} ({t.ipv4})</span>
              <span style={valueStyle}>{publicIP.v4 || t.unavailable}</span>
            </div>
            <div style={{ ...row, borderBottom: localIPs.length ? '1px solid var(--color-border)' : 'none' }}>
              <span style={labelStyle}>{t.public_ip} ({t.ipv6})</span>
              <span style={valueStyle}>{publicIP.v6 || t.unavailable}</span>
            </div>

            {/* WebRTC 检测到的 IP */}
            {localIPs.length > 0 && (
              <>
                <div style={{ marginTop: '0.75rem', marginBottom: '0.4rem' }}>
                  <span style={{ ...labelStyle, fontWeight: 600 }}>{t.local_ips}</span>
                </div>
                {localIPs.map((ip) => (
                  <div key={ip} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ ...labelStyle, fontSize: '0.78rem' }}>
                      {isPrivateIP(ip) ? t.private_label : t.public_label}
                    </span>
                    <span style={{ ...valueStyle, color: isPrivateIP(ip) ? '#f59e0b' : '#ef4444' }}>{ip}</span>
                  </div>
                ))}
              </>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button onClick={runTest} style={{
                padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
                background: 'var(--color-primary)', color: '#fff', fontWeight: 600,
                fontSize: '0.875rem', cursor: 'pointer',
              }}>
                {t.test_again}
              </button>
            </div>
          </div>

          {/* IP 对比 */}
          {(publicIP.v4 || publicIP.v6) && localIPs.length > 0 && (
            <div style={{ ...card, border: `1px solid ${ipMismatch ? '#ef4444' : ipMatch ? '#22c55e' : 'var(--color-border)'}` }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.compare_title}
              </h3>

              {/* 网络报告 IP */}
              <div style={row}>
                <span style={labelStyle}>{t.network_ip}</span>
                <span style={valueStyle}>{publicIP.v4 || publicIP.v6}</span>
              </div>

              {/* WebRTC 检测到的非私有 IP */}
              {publicWebRTCIPs.map((ip) => {
                const matches = ip === publicIP.v4 || ip === publicIP.v6;
                return (
                  <div key={ip} style={{ ...row, borderBottom: 'none' }}>
                    <span style={labelStyle}>{t.webrtc_ip}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ ...valueStyle, color: matches ? '#22c55e' : '#ef4444' }}>{ip}</span>
                      <span style={{
                        fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px',
                        background: matches ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: matches ? '#16a34a' : '#ef4444',
                      }}>
                        {matches ? '✓' : '≠'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* 仅私有 IP */}
              {publicWebRTCIPs.length === 0 && privateWebRTCIPs.length > 0 && (
                <div style={{ ...row, borderBottom: 'none' }}>
                  <span style={labelStyle}>{t.webrtc_ip}</span>
                  <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>{t.ip_private_only}</span>
                </div>
              )}

              {/* 结论标签 */}
              <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'var(--color-bg)', fontSize: '0.82rem', color: ipMismatch ? '#ef4444' : ipMatch ? '#16a34a' : '#f59e0b' }}>
                {ipMismatch ? t.ip_mismatch : ipMatch ? t.ip_match : t.ip_private_only}
              </div>
            </div>
          )}
        </>
      )}

      {/* 说明 */}
      <div style={card}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--color-text)' }}>{t.what_is}</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{t.what_is_desc}</p>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--color-text)' }}>{t.how_fix}</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{t.how_fix_desc}</p>
      </div>
    </div>
  );
}
