import { useState, type FormEvent } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const CHECKS = [
  { key: 'mx' }, { key: 'spf' }, { key: 'dkim' }, { key: 'dmarc' },
  { key: 'ports' }, { key: 'tls' }, { key: 'dnsbl' }, { key: 'ptr' },
];

const CHECK_LABELS: Record<string, Record<string, string>> = {
  en: {
    mx: 'MX Records', spf: 'SPF Record', dkim: 'DKIM Record', dmarc: 'DMARC Record',
    ports: 'Mail Ports', tls: 'TLS Handshake', dnsbl: 'DNSBL Check', ptr: 'PTR Lookup',
  },
  'zh-CN': {
    mx: 'MX 记录', spf: 'SPF 记录', dkim: 'DKIM 记录', dmarc: 'DMARC 记录',
    ports: '邮件端口', tls: 'TLS 握手', dnsbl: 'DNSBL 检查', ptr: 'PTR 查询',
  },
  'zh-TW': {
    mx: 'MX 記錄', spf: 'SPF 記錄', dkim: 'DKIM 記錄', dmarc: 'DMARC 記錄',
    ports: '郵件端口', tls: 'TLS 交握', dnsbl: 'DNSBL 檢查', ptr: 'PTR 查詢',
  },
  ja: {
    mx: 'MX レコード', spf: 'SPF レコード', dkim: 'DKIM レコード', dmarc: 'DMARC レコード',
    ports: 'メールポート', tls: 'TLS ハンドシェイク', dnsbl: 'DNSBL チェック', ptr: 'PTR ルックアップ',
  },
};

const i18n: Record<string, Record<string, string>> = {
  en: {
    domain: 'Domain', runAll: 'Run All Checks', running: 'Running…', check: 'Check',
    open: 'Open', closed: 'Closed', priority: 'Priority', host: 'Host', clean: 'Not listed', listed: 'Listed',
    errNoRecords: 'No records found', errTimeout: 'Connection timed out', errNxdomain: 'Domain not found',
    errRefused: 'Connection refused', errUnreachable: 'Host unreachable', errInvalidDomain: 'Invalid domain name',
    errUnknown: 'Check failed',
    dkimSelector: 'Selector', dkimSelectorPlaceholder: 'e.g. google, selector1, default',
    dkimNotFound: 'DKIM not found', dkimFound: 'DKIM record found',
    dkimHint: '💡 Try a selector — e.g. google (Gmail), selector1 (Microsoft 365), default',
    dnsblChecked: 'Checked {n} DNSBLs', dnsblHits: '{n} hit(s)', dnsblClean: 'Not listed in any DNSBL',
    dnsblListed: 'Listed on {n} blacklist(s)',
  },
  'zh-CN': {
    domain: '域名', runAll: '运行所有检查', running: '运行中…', check: '检查',
    open: '开放', closed: '关闭', priority: '优先级', host: '主机', clean: '未列入', listed: '已列入',
    errNoRecords: '未找到记录', errTimeout: '连接超时', errNxdomain: '域名不存在',
    errRefused: '连接被拒绝', errUnreachable: '主机不可达', errInvalidDomain: '无效的域名',
    errUnknown: '检查失败',
    dkimSelector: '选择器', dkimSelectorPlaceholder: '例如 google、selector1、default',
    dkimNotFound: 'DKIM 记录未找到', dkimFound: 'DKIM 记录已找到',
    dkimHint: '💡 请指定选择器，常用值：google（Gmail）、selector1（Microsoft 365）、default',
    dnsblChecked: '已检查 {n} 个 DNSBL', dnsblHits: '命中 {n} 个', dnsblClean: '未列入任何黑名单',
    dnsblListed: '已列入 {n} 个黑名单',
  },
  'zh-TW': {
    domain: '網域', runAll: '執行所有檢查', running: '執行中…', check: '檢查',
    open: '開放', closed: '關閉', priority: '優先級', host: '主機', clean: '未列入', listed: '已列入',
    errNoRecords: '找不到記錄', errTimeout: '連線逾時', errNxdomain: '網域不存在',
    errRefused: '連線被拒', errUnreachable: '主機無法連線', errInvalidDomain: '無效的網域名稱',
    errUnknown: '檢查失敗',
    dkimSelector: '選擇器', dkimSelectorPlaceholder: '例如 google、selector1、default',
    dkimNotFound: 'DKIM 記錄未找到', dkimFound: 'DKIM 記錄已找到',
    dkimHint: '💡 請指定選擇器，常用值：google（Gmail）、selector1（Microsoft 365）、default',
    dnsblChecked: '已檢查 {n} 個 DNSBL', dnsblHits: '命中 {n} 個', dnsblClean: '未列入任何黑名單',
    dnsblListed: '已列入 {n} 個黑名單',
  },
  ja: {
    domain: 'ドメイン', runAll: '全チェック実行', running: '実行中…', check: 'チェック',
    open: '開放', closed: '閉鎖', priority: '優先度', host: 'ホスト', clean: 'クリーン', listed: 'リスト済み',
    errNoRecords: 'レコードが見つかりません', errTimeout: '接続タイムアウト', errNxdomain: 'ドメインが存在しません',
    errRefused: '接続が拒否されました', errUnreachable: 'ホストに到達できません', errInvalidDomain: '無効なドメイン名',
    errUnknown: 'チェックに失敗しました',
    dkimSelector: 'セレクター', dkimSelectorPlaceholder: '例: google、selector1、default',
    dkimNotFound: 'DKIM レコードが見つかりません', dkimFound: 'DKIM レコードが見つかりました',
    dkimHint: '💡 セレクターを指定してください。例: google（Gmail）、selector1（Microsoft 365）、default',
    dnsblChecked: '{n} 件の DNSBL を確認', dnsblHits: '{n} 件ヒット', dnsblClean: 'どのブラックリストにも未登録',
    dnsblListed: '{n} 件のブラックリストに登録済み',
  },
};

const PORT_SERVICES: Record<string, string> = {
  '25': 'SMTP', '465': 'SMTPS', '587': 'Submission',
  '143': 'IMAP', '993': 'IMAPS', '110': 'POP3', '995': 'POP3S',
};

// ─── Result renderers ────────────────────────────────────────────────────────

function MxResult({ records }: { records: Array<{ host: string; pref: number }> }) {
  const sorted = [...records].sort((a, b) => a.pref - b.pref);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {sorted.map((r, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          padding: '0.5rem 0.7rem', borderRadius: '6px',
          border: '1px solid var(--color-border)', background: 'var(--color-bg)',
        }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
            borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
            minWidth: '34px', textAlign: 'center', flexShrink: 0,
          }}>
            {r.pref}
          </span>
          <code style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--color-text)', wordBreak: 'break-all' }}>
            {r.host}
          </code>
        </div>
      ))}
    </div>
  );
}

function SpfResult({ record }: { record: string }) {
  const parts = record.trim().split(/\s+/);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      <code style={{
        display: 'block', padding: '0.6rem 0.75rem', borderRadius: '6px',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text)',
        lineHeight: 1.65, wordBreak: 'break-all',
      }}>
        {record}
      </code>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {parts.map((part, i) => {
          let bg = 'rgba(148,163,184,0.1)';
          let color = 'var(--color-text-secondary)';
          if (i === 0) { bg = 'rgba(59,130,246,0.1)'; color = '#3b82f6'; }
          else if (/^include:/i.test(part)) { bg = 'rgba(139,92,246,0.1)'; color = '#7c3aed'; }
          else if (/^ip[46]:/i.test(part)) { bg = 'rgba(20,184,166,0.1)'; color = '#0d9488'; }
          else if (/^redirect=/i.test(part)) { bg = 'rgba(245,158,11,0.1)'; color = '#d97706'; }
          else if (/^[~-]all$/i.test(part)) { bg = 'rgba(239,68,68,0.1)'; color = '#dc2626'; }
          else if (/^\+?all$/i.test(part)) { bg = 'rgba(239,68,68,0.15)'; color = '#dc2626'; }
          else if (/^(\?all|mx|a\b|ptr)/i.test(part)) { bg = 'rgba(34,197,94,0.1)'; color = '#16a34a'; }
          return (
            <span key={i} style={{
              fontSize: '0.73rem', fontFamily: 'monospace',
              padding: '0.15rem 0.45rem', borderRadius: '4px', background: bg, color,
            }}>
              {part}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DkimDmarcResult({ record }: { record: string }) {
  const pairs = record.split(/\s*;\s*/).filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <code style={{
        display: 'block', padding: '0.6rem 0.75rem', borderRadius: '6px',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--color-text)',
        lineHeight: 1.65, wordBreak: 'break-all',
        maxHeight: '120px', overflowY: 'auto',
      }}>
        {record}
      </code>
      {pairs.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {pairs.map((pair, i) => {
            const [k, ...rest] = pair.split('=');
            const v = rest.join('=');
            return (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#3b82f6', flexShrink: 0 }}>{k.trim()}</span>
                {v && <><span style={{ color: 'var(--color-text-secondary)' }}>=</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--color-text)', wordBreak: 'break-all' }}>{v.trim()}</span></>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DkimResult({ data, t }: { data: any; t: Record<string, string> }) {
  const isError = data?.error || (!data?.record && typeof data !== 'string');
  const record: string = typeof data === 'string' ? data : (data?.record ?? '');
  const selector: string = (data?.selector ?? '').trim();
  const domain: string = data?.domain ?? '';
  const error: string = data?.error ?? '';

  const chip = (label: string, val: string) => (
    <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
      {label}: {val}
    </code>
  );

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>✗</span>
          <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.85rem' }}>{t.dkimNotFound}</span>
          {selector && chip('selector', selector)}
        </div>
        {error && (
          <div style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fca5a5', fontSize: '0.78rem', color: '#991b1b', wordBreak: 'break-word' }}>
            {error}
          </div>
        )}
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {t.dkimHint}
        </p>
      </div>
    );
  }

  // Success: parse semicolon-separated record
  const pairs = record.split(/\s*;\s*/).filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: '1rem' }}>✓</span>
        <span style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.85rem' }}>{t.dkimFound}</span>
        {selector && chip('selector', selector)}
        {domain && chip('domain', domain)}
      </div>
      <code style={{
        display: 'block', padding: '0.6rem 0.75rem', borderRadius: '6px',
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--color-text)',
        lineHeight: 1.65, wordBreak: 'break-all', maxHeight: '120px', overflowY: 'auto',
      }}>
        {record}
      </code>
      {pairs.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {pairs.map((pair, i) => {
            const [k, ...rest] = pair.split('=');
            const v = rest.join('=');
            return (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.78rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#3b82f6', flexShrink: 0 }}>{k.trim()}</span>
                {v && <><span style={{ color: 'var(--color-text-secondary)' }}>=</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--color-text)', wordBreak: 'break-all' }}>{v.trim()}</span></>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PtrResult({ records }: { records: Array<{ ip: string; ptr: string }> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {records.map((r, i) => (
        <div key={i} style={{
          padding: '0.55rem 0.75rem', borderRadius: '6px',
          border: '1px solid var(--color-border)', background: 'var(--color-bg)',
          display: 'grid', gridTemplateColumns: '28px 1fr', rowGap: '0.15rem', columnGap: '0.5rem',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>IP</span>
          <code style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--color-text)' }}>{r.ip}</code>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>PTR</span>
          <code style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#3b82f6', wordBreak: 'break-all' }}>{r.ptr}</code>
        </div>
      ))}
    </div>
  );
}

function TlsResult({ data }: { data: Record<string, any> }) {
  const rows = Object.entries(data).filter(([, v]) => v !== null && v !== undefined);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {rows.map(([k, v], i) => {
        const isOk = v === true || String(v).toLowerCase() === 'valid';
        const isFail = v === false || String(v).toLowerCase() === 'invalid';
        return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--color-text-secondary)', minWidth: '90px', flexShrink: 0, textTransform: 'capitalize' }}>
              {k.replace(/_/g, ' ')}
            </span>
            <span style={{
              fontFamily: 'monospace', color: isOk ? '#16a34a' : isFail ? '#dc2626' : 'var(--color-text)',
              wordBreak: 'break-all',
            }}>
              {String(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DnsblResult({ records, t }: { records: Array<{ list: string; listed: boolean }>; t: Record<string, string> }) {
  const listed = records.filter((r) => r.listed);
  const clean = records.filter((r) => !r.listed);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {listed.length > 0 && listed.map((r, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.45rem 0.65rem', borderRadius: '6px',
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          <code style={{ fontSize: '0.78rem', color: 'var(--color-text)', flex: 1 }}>{r.list}</code>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#dc2626' }}>{t.listed}</span>
        </div>
      ))}
      {clean.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.45rem 0.65rem', borderRadius: '6px',
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text)', flex: 1 }}>
            {clean.length} {t.clean}
          </span>
        </div>
      )}
    </div>
  );
}

function PortsResult({ ports, t }: { ports: Array<{ service: string; reachable: boolean; note?: string }>; t: Record<string, string> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {ports.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.45rem 0.65rem', borderRadius: '6px',
          background: p.reachable ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.05)',
          border: `1px solid ${p.reachable ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.18)'}`,
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.reachable ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
          <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)', minWidth: '36px' }}>
            :{p.service}
          </code>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', flex: 1 }}>
            {PORT_SERVICES[p.service] || p.service}
          </span>
          {p.note && <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }} title={p.note}>{p.note}</span>}
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '4px', flexShrink: 0,
            color: p.reachable ? '#16a34a' : '#dc2626',
            background: p.reachable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
          }}>
            {p.reachable ? t.open : t.closed}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Smart result dispatcher ─────────────────────────────────────────────────

function CheckResult({ checkKey, data, t }: { checkKey: string; data: any; t: Record<string, string> }) {
  // MX: [{host, pref}]
  if (checkKey === 'mx' && Array.isArray(data) && data[0]?.host !== undefined) {
    return <MxResult records={data} />;
  }
  // SPF: string
  if (checkKey === 'spf' && typeof data === 'string') {
    return <SpfResult record={data} />;
  }
  // DKIM: object {record?, error?, selector?, domain?} or string
  if (checkKey === 'dkim') {
    return <DkimResult data={data} t={t} />;
  }
  // DMARC: string (semicolon-separated key=value)
  if (checkKey === 'dmarc' && typeof data === 'string') {
    return <DkimDmarcResult record={data} />;
  }
  // PTR: [{ip, ptr}] or {ip, ptr}
  if (checkKey === 'ptr') {
    const arr = Array.isArray(data) ? data : [data];
    if (arr[0]?.ip !== undefined) return <PtrResult records={arr} />;
  }
  // Ports: [{service, reachable}]
  if (checkKey === 'ports' && Array.isArray(data) && data[0]?.service !== undefined) {
    return <PortsResult ports={data} t={t} />;
  }
  // TLS: plain object with tls info
  if (checkKey === 'tls' && data && typeof data === 'object' && !Array.isArray(data)) {
    return <TlsResult data={data} />;
  }
  // DNSBL: [{list, listed}] array or {checked, listed} summary
  if (checkKey === 'dnsbl') {
    if (Array.isArray(data) && data[0]?.list !== undefined) {
      return <DnsblResult records={data} t={t} />;
    }
    if (data && typeof data === 'object' && 'checked' in data) {
      const listedCount: number = data.listed ?? 0;
      const checkedCount: number = data.checked ?? 0;
      const isClean = listedCount === 0;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 0.85rem', borderRadius: '8px',
            background: isClean ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
            border: `1px solid ${isClean ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <span style={{ fontSize: '1.1rem' }}>{isClean ? '✓' : '✗'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isClean ? '#16a34a' : '#dc2626' }}>
                {isClean ? t.dnsblClean : (t.dnsblListed || '').replace('{n}', String(listedCount))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                {(t.dnsblChecked || '').replace('{n}', String(checkedCount))}
                {listedCount > 0 ? ` · ${(t.dnsblHits || '').replace('{n}', String(listedCount))}` : ''}
              </div>
            </div>
          </div>
          {data.lists && Array.isArray(data.lists) && <DnsblResult records={data.lists} t={t} />}
        </div>
      );
    }
  }
  // Fallback: clean text / JSON display
  const text = formatRawText(data);
  return (
    <pre style={{
      margin: 0, fontSize: '0.75rem', color: 'var(--color-text)',
      whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: '220px', overflowY: 'auto',
    }}>
      {text}
    </pre>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function EmailDiagnosticsTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const checkLabels = CHECK_LABELS[locale] || CHECK_LABELS.en;
  const [domain, setDomain] = useState('');
  const [dkimSelector, setDkimSelector] = useState('');
  const [results, setResults] = useState<Record<string, { loading: boolean; data?: any; error?: string }>>({});

  const singleCheck = getSingleCheckKey(slug);

  const runCheck = async (check: string) => {
    if (!domain.trim()) return;
    setResults((prev) => ({ ...prev, [check]: { loading: true } }));
    (window as any).__trackToolUsed?.(slug);
    try {
      const body: Record<string, string> = { target: domain.trim() };
      if (check === 'dkim' && dkimSelector.trim()) body.selector = dkimSelector.trim();
      const res = await fetch(`${API_BASE}/email-diagnostics/api/${check}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
      const rawData = json.data ?? json;
      setResults((prev) => ({ ...prev, [check]: { loading: false, data: rawData } }));
    } catch (err: any) {
      setResults((prev) => ({ ...prev, [check]: { loading: false, error: err.message } }));
    }
  };

  const runAll = async (e: FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    const checksToRun = singleCheck ? [singleCheck] : CHECKS.map((c) => c.key);
    checksToRun.forEach((c) => runCheck(c));
  };

  const checksToShow = singleCheck ? CHECKS.filter((c) => c.key === singleCheck) : CHECKS;

  return (
    <div className="tool-email-area">
      <form onSubmit={runAll} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const }}>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            required
            style={{
              flex: 1, minWidth: '200px', padding: '0.6rem 1rem', borderRadius: '8px',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)',
              color: 'var(--color-text)', fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
              backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {singleCheck ? t.check : t.runAll}
          </button>
        </div>
        {(singleCheck === 'dkim' || !singleCheck) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' as const }}>
              {t.dkimSelector}
            </label>
            <input
              type="text"
              value={dkimSelector}
              onChange={(e) => setDkimSelector(e.target.value)}
              placeholder={t.dkimSelectorPlaceholder}
              style={{
                flex: 1, maxWidth: '320px', padding: '0.4rem 0.75rem', borderRadius: '6px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text)', fontSize: '0.875rem',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {t.dkimHint.replace('💡 ', '')}
            </span>
          </div>
        )}
      </form>

      <div style={{
        display: 'grid',
        gridTemplateColumns: singleCheck ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem',
      }}>
        {checksToShow.map((check) => {
          const r = results[check.key];
          const label = checkLabels[check.key] || check.key;
          return (
            <div
              key={check.key}
              style={{
                borderRadius: '10px', border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card-bg)', padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)', fontWeight: 600 }}>
                  {label}
                </h3>
                {!singleCheck && (
                  <button
                    onClick={() => runCheck(check.key)}
                    style={{
                      padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                      backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.75rem',
                    }}
                  >
                    {t.check}
                  </button>
                )}
              </div>

              <div style={{ minHeight: singleCheck ? 0 : '60px' }}>
                {r?.loading && (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>{t.running}</p>
                )}
                {r?.error && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }} title={r.error}>
                    {localizeError(r.error, t)}
                  </p>
                )}
                {r?.data !== undefined && !r.loading && (
                  <CheckResult checkKey={check.key} data={r.data} t={t} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSingleCheckKey(slug: string): string | null {
  const map: Record<string, string> = {
    'mx-checker': 'mx', 'spf-checker': 'spf', 'dkim-checker': 'dkim', 'dmarc-checker': 'dmarc',
    'email-port-checker': 'ports', 'tls-handshake-test': 'tls', 'dnsbl-checker': 'dnsbl', 'ptr-lookup': 'ptr',
  };
  return map[slug] || null;
}

function localizeError(msg: string, t: Record<string, string>): string {
  const m = msg.toLowerCase();
  if (/does not contain an answer|no records|nodata|nxrrset/.test(m)) return t.errNoRecords;
  if (/nxdomain|non-existent domain|does not exist/.test(m)) return t.errNxdomain;
  if (/timed? ?out|timeout/.test(m)) return t.errTimeout;
  if (/refused/.test(m)) return t.errRefused;
  if (/unreachable|no route/.test(m)) return t.errUnreachable;
  if (/invalid.*domain|bad.*domain|illegal.*label/.test(m)) return t.errInvalidDomain;
  return t.errUnknown;
}

function formatRawText(data: any): string {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) {
    return data.map((item: any) => (typeof item === 'string' ? item : JSON.stringify(item, null, 2))).join('\n');
  }
  return JSON.stringify(data, null, 2);
}
