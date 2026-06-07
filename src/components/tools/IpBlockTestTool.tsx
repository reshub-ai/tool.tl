import { useState, type FormEvent } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

type Status = 'open' | 'closed' | 'unknown';
type Verdict = 'normal' | 'blocked' | 'partial' | 'unreachable' | 'unknown';

interface Result {
  ip: string;
  port: number;
  foreign: { tcp: Status; icmp: Status };
  domestic: { tcp: Status; icmp: Status };
  verdict: Verdict;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    ip: 'IP', port: 'Port', test: 'Test', testing: 'Testing…',
    ipPlaceholder: 'e.g. 104.243.19.163', portPlaceholder: 'e.g. 443',
    domesticTcp: 'Domestic TCP', domesticIcmp: 'Domestic ICMP',
    foreignTcp: 'Foreign TCP', foreignIcmp: 'Foreign ICMP',
    open: 'Open', closed: 'Closed', unknown: 'No node',
    v_normal_t: 'IP is reachable', v_normal_d: 'The IP responds from both inside and outside China. It does not appear to be blocked.',
    v_blocked_t: 'Likely blocked by GFW', v_blocked_d: 'The IP is reachable from outside China but not from inside. It is most likely blocked.',
    v_partial_t: 'Partially reachable', v_partial_d: 'Some probes differ between domestic and foreign — likely port-level blocking or partial interference.',
    v_unreachable_t: 'Server unreachable', v_unreachable_d: 'The IP does not respond from either location. The server may be down or the port closed.',
    v_unknown_t: 'Domestic node not connected', v_unknown_d: 'No domestic probe node is configured, so GFW blocking cannot be determined. Foreign results are shown.',
    invalidIp: 'Please enter a valid IPv4 address.',
    intro: 'Check whether an IP / port is blocked by the GFW. We probe TCP + ICMP from both a China node and an overseas node and compare.',
  },
  'zh-CN': {
    ip: 'IP', port: '端口', test: '测试', testing: '测试中…',
    ipPlaceholder: '例如 104.243.19.163', portPlaceholder: '例如 443',
    domesticTcp: '国内 TCP', domesticIcmp: '国内 ICMP',
    foreignTcp: '国外 TCP', foreignIcmp: '国外 ICMP',
    open: 'Open', closed: 'Closed', unknown: '无节点',
    v_normal_t: 'IP 正常可达', v_normal_d: '国内、国外均可访问该 IP，未发现被墙迹象。',
    v_blocked_t: '疑似被墙', v_blocked_d: '该 IP 国外可达但国内不通，极有可能已被 GFW 封锁。',
    v_partial_t: '部分可达', v_partial_d: '国内外探测结果不一致——可能是端口级封锁或部分干扰。',
    v_unreachable_t: '服务器不可达', v_unreachable_d: '国内外均无响应，服务器可能宕机或端口未开放。',
    v_unknown_t: '未接入国内节点', v_unknown_d: '尚未配置国内探测节点，无法判断是否被墙，仅显示国外结果。',
    invalidIp: '请输入有效的 IPv4 地址。',
    intro: '检测某个 IP / 端口是否被 GFW 封锁。我们从国内节点和国外节点分别做 TCP + ICMP 探测并对比。',
  },
  'zh-TW': {
    ip: 'IP', port: '埠', test: '測試', testing: '測試中…',
    ipPlaceholder: '例如 104.243.19.163', portPlaceholder: '例如 443',
    domesticTcp: '國內 TCP', domesticIcmp: '國內 ICMP',
    foreignTcp: '國外 TCP', foreignIcmp: '國外 ICMP',
    open: 'Open', closed: 'Closed', unknown: '無節點',
    v_normal_t: 'IP 正常可達', v_normal_d: '國內、國外均可存取該 IP，未發現被牆跡象。',
    v_blocked_t: '疑似被牆', v_blocked_d: '該 IP 國外可達但國內不通，極有可能已被 GFW 封鎖。',
    v_partial_t: '部分可達', v_partial_d: '國內外探測結果不一致——可能是埠級封鎖或部分干擾。',
    v_unreachable_t: '伺服器不可達', v_unreachable_d: '國內外均無回應，伺服器可能當機或埠未開放。',
    v_unknown_t: '未接入國內節點', v_unknown_d: '尚未設定國內探測節點，無法判斷是否被牆，僅顯示國外結果。',
    invalidIp: '請輸入有效的 IPv4 位址。',
    intro: '檢測某個 IP / 埠是否被 GFW 封鎖。我們從國內節點和國外節點分別做 TCP + ICMP 探測並對比。',
  },
  ja: {
    ip: 'IP', port: 'ポート', test: 'テスト', testing: 'テスト中…',
    ipPlaceholder: '例: 104.243.19.163', portPlaceholder: '例: 443',
    domesticTcp: '国内 TCP', domesticIcmp: '国内 ICMP',
    foreignTcp: '国外 TCP', foreignIcmp: '国外 ICMP',
    open: 'Open', closed: 'Closed', unknown: 'ノードなし',
    v_normal_t: 'IP に到達可能', v_normal_d: '中国国内・国外の両方からアクセスでき、ブロックの兆候はありません。',
    v_blocked_t: 'GFW でブロックの可能性', v_blocked_d: '国外からは到達できますが国内からは不可。ブロックされている可能性が高いです。',
    v_partial_t: '一部到達可能', v_partial_d: '国内外で結果が異なります。ポート単位のブロックや部分的な干渉の可能性があります。',
    v_unreachable_t: 'サーバー到達不可', v_unreachable_d: '国内外どちらからも応答なし。サーバー停止かポート未開放の可能性。',
    v_unknown_t: '国内ノード未接続', v_unknown_d: '国内プローブノードが未設定のためブロック判定不可。国外結果のみ表示します。',
    invalidIp: '有効な IPv4 アドレスを入力してください。',
    intro: 'IP / ポートが GFW にブロックされているか検査します。国内ノードと国外ノードから TCP + ICMP を探測し比較します。',
  },
};

const VERDICT_STYLE: Record<Verdict, { bg: string; border: string; color: string; icon: string }> = {
  normal:      { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', color: '#10b981', icon: '✓' },
  blocked:     { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)',  color: '#ef4444', icon: '⛔' },
  partial:     { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', color: '#f59e0b', icon: '⚠' },
  unreachable: { bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.35)', color: '#64748b', icon: '✕' },
  unknown:     { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)',  color: '#3b82f6', icon: 'ℹ' },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.9rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card-bg)',
  color: 'var(--color-text)',
  fontSize: '1rem',
  fontFamily: 'monospace',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.3rem',
};

function StatusPill({ status, t }: { status: Status; t: Record<string, string> }) {
  const map: Record<Status, { color: string; bg: string; label: string }> = {
    open:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: t.open },
    closed:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: t.closed },
    unknown: { color: '#94a3b8', bg: 'rgba(100,116,139,0.12)', label: t.unknown },
  };
  const s = map[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.2rem 0.7rem', borderRadius: '999px',
      fontSize: '0.85rem', fontWeight: 700, color: s.color, background: s.bg,
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

function Row({ label, status, t }: { label: string; status: Status; t: Record<string, string> }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 0.25rem', borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>{label}</span>
      <StatusPill status={status} t={t} />
    </div>
  );
}

export default function IpBlockTestTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const ipTrim = ip.trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ipTrim) || ipTrim.split('.').some((o) => +o > 255)) {
      setError(t.invalidIp);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/network/ip-blocktest/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipTrim, port: port.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data as Result);
      (window as any).__trackToolUsed?.(slug);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const v = result ? VERDICT_STYLE[result.verdict] : null;

  return (
    <div className="tool-network-area">
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{t.intro}</p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '220px' }}>
            <label style={labelStyle} htmlFor="bt-ip">{t.ip}</label>
            <input id="bt-ip" type="text" value={ip} onChange={(e) => setIp(e.target.value)}
              placeholder={t.ipPlaceholder} required style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={labelStyle} htmlFor="bt-port">{t.port}</label>
            <input id="bt-port" type="text" inputMode="numeric" value={port}
              onChange={(e) => setPort(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={t.portPlaceholder} style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '0.62rem 1.8rem', borderRadius: '8px', border: 'none',
            backgroundColor: 'var(--color-primary)', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
            fontWeight: 600, fontSize: '1rem', height: 'fit-content',
          }}>
            {loading ? t.testing : t.test}
          </button>
        </div>
      </form>

      {error && <p style={{ marginTop: '0.85rem', color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

      {result && v && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.9rem 1.1rem', borderRadius: '10px',
            background: v.bg, border: `1px solid ${v.border}`, marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1.2, color: v.color }}>{v.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: v.color }}>
                {t[`v_${result.verdict}_t`]}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                {t[`v_${result.verdict}_d`]}
              </div>
            </div>
          </div>

          <div style={{
            padding: '0.5rem 1.1rem 0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-text-secondary)',
              padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--color-border)',
            }}>
              {result.ip}:{result.port}
            </div>
            <Row label={t.domesticTcp} status={result.domestic.tcp} t={t} />
            <Row label={t.domesticIcmp} status={result.domestic.icmp} t={t} />
            <Row label={t.foreignTcp} status={result.foreign.tcp} t={t} />
            <Row label={t.foreignIcmp} status={result.foreign.icmp} t={t} />
          </div>
        </div>
      )}
    </div>
  );
}
