import { useState, useEffect, useRef } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    testing: 'Running IP detection…',
    test_again: 'Test Again',
    your_ip: 'Your IP (as seen by server)',
    org: 'Organization / ISP',
    rdns: 'Reverse DNS',
    resolver_test: 'Public DNS Resolver Test (server-side)',
    resolver: 'Resolver',
    resolved: 'Resolved IPs',
    status_done: 'IP Check Complete',
    how_works: 'How this test works',
    how_desc: 'Our server records the IP address of your request. If you are using a VPN, this IP should be your VPN server\'s IP, not your real IP. Compare this IP with your real IP to check for leaks.',
    privacy_note: 'Note: Client-side DNS server detection requires a dedicated DNS infrastructure (like dnsleaktest.com). This tool shows your server-seen IP and tests reachability of public resolvers from our server.',
  },
  'zh-CN': {
    testing: '正在检测 IP…',
    test_again: '重新检测',
    your_ip: '你的 IP（服务器看到的）',
    org: '运营商 / 组织',
    rdns: '反向 DNS',
    resolver_test: '公共 DNS 解析器测试（服务器侧）',
    resolver: '解析器',
    resolved: '解析结果 IP',
    status_done: 'IP 检测完成',
    how_works: '检测原理',
    how_desc: '服务器记录你请求的 IP 地址。如果你在使用 VPN，这里应该是 VPN 服务器的 IP，而非你的真实 IP。将此 IP 与真实 IP 对比，即可判断是否泄露。',
    privacy_note: '提示：客户端 DNS 服务器检测需要专用 DNS 基础设施（如 dnsleaktest.com）。本工具显示服务器看到的 IP，并从服务器测试公共解析器的可达性。',
  },
  'zh-TW': {
    testing: '正在檢測 IP…',
    test_again: '重新檢測',
    your_ip: '你的 IP（伺服器看到的）',
    org: '電信業者 / 組織',
    rdns: '反向 DNS',
    resolver_test: '公共 DNS 解析器測試（伺服器端）',
    resolver: '解析器',
    resolved: '解析結果 IP',
    status_done: 'IP 檢測完成',
    how_works: '檢測原理',
    how_desc: '伺服器記錄你請求的 IP 位址。如果你在使用 VPN，這裡應該是 VPN 伺服器的 IP，而非真實 IP。將此 IP 與真實 IP 對比，即可判斷是否洩漏。',
    privacy_note: '提示：用戶端 DNS 伺服器檢測需要專用 DNS 基礎設施（如 dnsleaktest.com）。本工具顯示伺服器看到的 IP，並從伺服器測試公共解析器的可達性。',
  },
  ja: {
    testing: 'IP検出中…',
    test_again: '再テスト',
    your_ip: 'あなたのIP（サーバーが確認）',
    org: 'プロバイダー / 組織',
    rdns: '逆引きDNS',
    resolver_test: '公開DNSリゾルバーテスト（サーバー側）',
    resolver: 'リゾルバー',
    resolved: '解決済みIP',
    status_done: 'IP確認完了',
    how_works: 'テストの仕組み',
    how_desc: 'サーバーはリクエストのIPアドレスを記録します。VPN使用時はVPNサーバーのIPが表示されるはずです。このIPと実際のIPを比較してリークを確認してください。',
    privacy_note: '注意：クライアント側のDNSサーバー検出には専用DNSインフラ（dnsleaktest.comなど）が必要です。本ツールはサーバーが確認したIPと、サーバー側からの公開リゾルバーの到達性テストを提供します。',
  },
};

interface Result {
  client_ip: string;
  client_org: string;
  client_rdns: string;
  resolver_test: { resolver: string; resolved_ips: string[]; ok: boolean; error?: string }[];
}

export default function DnsLeakTestTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [testing, setTesting] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const trackedRef = useRef(false);

  const run = async () => {
    setTesting(true); setResult(null); setError('');
    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      if (!trackedRef.current) { trackedRef.current = true; (window as any).__trackToolUsed?.(slug); }
    } catch (e) {
      setError(String(e));
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => { run(); }, []);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', gap: '1rem',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.82rem', color: 'var(--color-text-secondary)', flexShrink: 0 };
  const valueStyle: React.CSSProperties = { fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--color-text)', textAlign: 'right', wordBreak: 'break-all' };

  return (
    <div>
      {/* 状态卡片 */}
      <div style={{ ...card, border: `2px solid ${testing ? 'var(--color-border)' : error ? '#ef4444' : '#22c55e'}` }}>
        {testing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{t.testing}</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <p style={{ margin: 0, color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>
        ) : result ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🟢</span>
              <span style={{ fontWeight: 700, color: '#22c55e' }}>{t.status_done}</span>
            </div>
            <button onClick={run} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-card-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>{t.test_again}</button>
          </div>
        ) : null}
      </div>

      {result && (
        <>
          {/* IP 信息 */}
          <div style={card}>
            <div style={rowStyle}>
              <span style={labelStyle}>{t.your_ip}</span>
              <span style={{ ...valueStyle, fontWeight: 700, color: 'var(--color-primary)' }}>{result.client_ip || '—'}</span>
            </div>
            {result.client_org && (
              <div style={rowStyle}>
                <span style={labelStyle}>{t.org}</span>
                <span style={valueStyle}>{result.client_org}</span>
              </div>
            )}
            {result.client_rdns && (
              <div style={{ ...rowStyle, borderBottom: 'none' }}>
                <span style={labelStyle}>{t.rdns}</span>
                <span style={valueStyle}>{result.client_rdns}</span>
              </div>
            )}
          </div>

          {/* 解析器对比（服务器侧） */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.resolver_test}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '360px' }}>
                <thead>
                  <tr>
                    {[t.resolver, t.resolved].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.resolver_test.map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>{r.resolver}</td>
                      <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem', fontFamily: 'monospace', color: r.ok ? 'var(--color-text)' : '#ef4444', borderBottom: '1px solid var(--color-border)' }}>
                        {r.ok ? r.resolved_ips.join(', ') : r.error || 'Failed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 说明 */}
          <div style={card}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: 'var(--color-text)' }}>{t.how_works}</h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{t.how_desc}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', padding: '0.6rem', background: 'var(--color-bg)', borderRadius: '6px', borderLeft: '3px solid var(--color-primary)' }}>{t.privacy_note}</p>
          </div>
        </>
      )}
    </div>
  );
}
