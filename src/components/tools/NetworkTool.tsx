import { useState, type FormEvent } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
}

const API_BASE = `${import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl'}/network`;

const PLACEHOLDER: Record<string, string> = {
  ping: 'example.com',
  traceroute: 'example.com',
  dns: 'example.com',
  whois: 'example.com',
  portscan: 'example.com',
  cdncheck: 'example.com',
  asn: '8.8.8.8',
  'http-header': 'https://example.com',
};

const INPUT_LABEL: Record<string, Record<string, string>> = {
  en: {
    domain: 'Domain / IP', url: 'URL', execute: 'Execute', querying: 'Querying...', copy: 'Copy', copied: 'Copied!',
    open: 'Open', closed: 'Closed', target: 'Target', scanned: 'scanned',
  },
  'zh-CN': {
    domain: '域名 / IP', url: 'URL', execute: '执行', querying: '查询中...', copy: '复制', copied: '已复制！',
    open: '开放', closed: '关闭', target: '目标', scanned: '已扫描',
  },
  'zh-TW': {
    domain: '網域 / IP', url: 'URL', execute: '執行', querying: '查詢中...', copy: '複製', copied: '已複製！',
    open: '開放', closed: '關閉', target: '目標', scanned: '已掃描',
  },
  ja: {
    domain: 'ドメイン / IP', url: 'URL', execute: '実行', querying: '問い合わせ中...', copy: 'コピー', copied: 'コピー済み！',
    open: '開放', closed: '閉鎖', target: 'ターゲット', scanned: 'スキャン済み',
  },
};

// ─── shared style tokens ──────────────────────────────────────────────────────

const card: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '8px',
  backgroundColor: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
};

const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.45rem 0.75rem',
  backgroundColor: 'var(--color-border)',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const td: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  wordBreak: 'break-all',
  verticalAlign: 'top',
};

const tdKey: React.CSSProperties = {
  ...td,
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  width: '38%',
};

const mono: React.CSSProperties = { fontFamily: 'monospace' };

const label: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.2rem',
};

const value: React.CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text)', ...mono };

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td style={tdKey}>{k}</td>
      <td style={{ ...td, ...mono }}>{v}</td>
    </tr>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} style={{ ...td, backgroundColor: 'var(--color-border)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', padding: '0.35rem 0.75rem' }}>
        {title}
      </td>
    </tr>
  );
}

// ─── per-tool renderers ───────────────────────────────────────────────────────

function WhoisResult({ data }: { data: any }) {
  const raw: string = data.result || '';

  // Parse "Key: Value" lines, skip section headers and blank lines
  const sections: { header: string; rows: [string, string][] }[] = [];
  let current: { header: string; rows: [string, string][] } = { header: '', rows: [] };

  raw.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('>>>') || trimmed.startsWith('%') || trimmed.startsWith('#')) return;
    const sep = trimmed.indexOf(':');
    if (sep > 0) {
      const k = trimmed.slice(0, sep).trim();
      const v = trimmed.slice(sep + 1).trim();
      if (!v) return; // skip key-only lines
      // Start new section when we see a repeated first key
      if (current.rows.length > 0 && k === current.rows[0][0]) {
        sections.push(current);
        current = { header: '', rows: [] };
      }
      current.rows.push([k, v]);
    }
  });
  if (current.rows.length > 0) sections.push(current);

  if (sections.length === 0) {
    return <pre style={{ ...card, fontSize: '0.8rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{raw}</pre>;
  }

  return (
    <div style={card}>
      <table style={table}>
        <tbody>
          {sections.map((sec, si) =>
            sec.rows.map(([k, v], ri) => <InfoRow key={`${si}-${ri}`} k={k} v={v} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

function DnsResult({ data }: { data: any }) {
  const records: { type: string; value: string }[] = data.records || [];
  if (records.length === 0) {
    return <div style={{ ...card, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{data.result || 'No records found.'}</div>;
  }

  // group by type
  const grouped: Record<string, string[]> = {};
  records.forEach(({ type, value }) => {
    (grouped[type] ??= []).push(value);
  });

  const typeColors: Record<string, string> = {
    A: '#3b82f6', AAAA: '#8b5cf6', MX: '#f59e0b', TXT: '#10b981',
    CNAME: '#ef4444', NS: '#6366f1', SOA: '#64748b',
  };

  return (
    <div style={card}>
      <table style={table}>
        <thead>
          <tr>
            <th style={{ ...th, width: '80px' }}>Type</th>
            <th style={th}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([type, values]) =>
            values.map((v, i) => (
              <tr key={`${type}-${i}`}>
                {i === 0 && (
                  <td rowSpan={values.length} style={{ ...td, verticalAlign: 'middle', width: '80px' }}>
                    <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: typeColors[type] || '#64748b', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}>
                      {type}
                    </span>
                  </td>
                )}
                <td style={{ ...td, ...mono }}>{v}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PortScanResult({ data, t }: { data: any; t: Record<string, string> }) {
  const open: number[] = data.open_ports || [];
  const scanned = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 8080, 3306];
  const serviceNames: Record<number, string> = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS',
    465: 'SMTPS', 587: 'Submission', 8080: 'HTTP-Alt', 3306: 'MySQL',
  };

  return (
    <div style={card}>
      {/* Header: target + summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
        paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
          <span style={{ ...label, marginBottom: 0 }}>{t.target}:</span>
          <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {data.target}
          </code>
        </div>
        <span style={{
          fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '999px',
          color: open.length > 0 ? '#10b981' : 'var(--color-text-secondary)',
          background: open.length > 0 ? 'rgba(16,185,129,0.1)' : 'var(--color-border)',
          border: `1px solid ${open.length > 0 ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
          flexShrink: 0,
        }}>
          {open.length} {t.open} / {scanned.length} {t.scanned}
        </span>
      </div>

      {/* Port grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
        {scanned.map((port) => {
          const isOpen = open.includes(port);
          return (
            <div key={port} style={{
              padding: '0.6rem 0.4rem',
              borderRadius: '8px',
              border: `1px solid ${isOpen ? 'rgba(16,185,129,0.35)' : 'var(--color-border)'}`,
              backgroundColor: isOpen ? 'rgba(16,185,129,0.07)' : 'var(--color-bg)',
              textAlign: 'center',
              transition: 'border-color 0.15s',
            }}>
              <div style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem',
                color: isOpen ? '#10b981' : 'var(--color-text)',
                marginBottom: '0.15rem',
              }}>
                {port}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                {serviceNames[port]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: isOpen ? '#10b981' : 'var(--color-border)',
                  boxShadow: isOpen ? '0 0 4px rgba(16,185,129,0.5)' : 'none',
                }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isOpen ? '#10b981' : '#94a3b8' }}>
                  {isOpen ? t.open : t.closed}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CdnCheckResult({ data }: { data: any }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ ...value, fontWeight: 700, fontSize: '1rem' }}>{data.domain}</span>
        <span style={{
          padding: '0.2rem 0.65rem',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 700,
          backgroundColor: data.is_cdn ? 'rgba(59,130,246,0.12)' : 'rgba(100,116,139,0.12)',
          color: data.is_cdn ? '#3b82f6' : '#64748b',
          border: `1px solid ${data.is_cdn ? '#3b82f6' : '#94a3b8'}`,
        }}>
          {data.is_cdn ? (data.cdn_provider ? `CDN: ${data.cdn_provider}` : 'CDN Detected') : 'No CDN'}
        </span>
      </div>
      <table style={table}>
        <tbody>
          {data.ips?.length > 0 && <InfoRow k="IP Addresses" v={data.ips.join(', ')} />}
          {data.cnames?.length > 0 && <InfoRow k="CNAMEs" v={data.cnames.join(', ')} />}
          {data.cdn_provider && <InfoRow k="CDN Provider" v={data.cdn_provider} />}
        </tbody>
      </table>
    </div>
  );
}

function AsnResult({ data }: { data: any }) {
  const rows: [string, string][] = [
    ['IP', data.ip],
    ['Organization / ASN', data.org],
    ['Country', data.country],
    ['Region', data.region],
    ['City', data.city],
    ['Hostname', data.hostname],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div style={card}>
      <table style={table}>
        <tbody>
          {rows.map(([k, v]) => <InfoRow key={k} k={k} v={v} />)}
        </tbody>
      </table>
    </div>
  );
}

function HttpHeaderResult({ data }: { data: any }) {
  const statusCode: number = data.status_code;
  const statusColor = statusCode < 300 ? '#10b981' : statusCode < 400 ? '#f59e0b' : '#ef4444';
  const headers: Record<string, string> = data.headers || {};

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '1rem',
          backgroundColor: `${statusColor}18`,
          color: statusColor,
          border: `1px solid ${statusColor}`,
          ...mono,
        }}>
          {statusCode}
        </span>
        <span style={{ ...value, color: 'var(--color-text-secondary)' }}>{data.status_line}</span>
      </div>
      <table style={table}>
        <thead>
          <tr>
            <th style={{ ...th, width: '35%' }}>Header</th>
            <th style={th}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(headers).map(([k, v]) => (
            <tr key={k}>
              <td style={{ ...tdKey, color: '#3b82f6' }}>{k}</td>
              <td style={{ ...td, ...mono }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TerminalResult({ output }: { output: string }) {
  return (
    <pre style={{
      ...card,
      fontSize: '0.8rem',
      whiteSpace: 'pre-wrap',
      lineHeight: 1.6,
      fontFamily: 'monospace',
      color: 'var(--color-text)',
    }}>
      {output}
    </pre>
  );
}

function ResultRenderer({ slug, data, locale }: { slug: string; data: any; locale: string }) {
  const t = INPUT_LABEL[locale] || INPUT_LABEL.en;
  switch (slug) {
    case 'whois':     return <WhoisResult data={data} />;
    case 'dns':       return <DnsResult data={data} />;
    case 'portscan':  return <PortScanResult data={data} t={t} />;
    case 'cdncheck':  return <CdnCheckResult data={data} />;
    case 'asn':       return <AsnResult data={data} />;
    case 'http-header': return <HttpHeaderResult data={data} />;
    case 'ping':
    case 'traceroute':
      return <TerminalResult output={data.output || data.result || JSON.stringify(data, null, 2)} />;
    default:
      return <TerminalResult output={JSON.stringify(data, null, 2)} />;
  }
}

// ─── copy helper ──────────────────────────────────────────────────────────────

function getCopyText(slug: string, data: any): string {
  switch (slug) {
    case 'whois':     return data.result || '';
    case 'ping':
    case 'traceroute': return data.output || data.result || '';
    case 'dns':       return (data.records || []).map((r: any) => `${r.type}\t${r.value}`).join('\n');
    case 'portscan':  return `Target: ${data.target}\nOpen ports: ${(data.open_ports || []).join(', ')}`;
    case 'cdncheck':  return JSON.stringify(data, null, 2);
    case 'asn':       return JSON.stringify(data, null, 2);
    case 'http-header': return `${data.status_line}\n\n${Object.entries(data.headers || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
    default:          return JSON.stringify(data, null, 2);
  }
}

// ─── main component ───────────────────────────────────────────────────────────

function getHostInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return url.hostname.replace(/\.$/, '');
  } catch {
    return trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/, 1)[0].replace(/\.$/, '');
  }
}

function buildRequestBody(slug: string, input: string): Record<string, string> {
  if (slug === 'http-header') {
    return { url: input.trim() };
  }

  const hostInput = getHostInput(input);

  switch (slug) {
    case 'dns':
    case 'cdncheck':
      return { domain: hostInput };
    case 'asn':
      return { ip: hostInput };
    default:
      return { target: hostInput };
  }
}

export default function NetworkTool({ slug, apiEndpoint, locale }: Props) {
  const t = INPUT_LABEL[locale] || INPUT_LABEL.en;
  const [input, setInput] = useState('');
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError('');
    setResultData(null);

    try {
      const body = buildRequestBody(slug, input);

      const res = await fetch(`${API_BASE}${apiEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResultData(data);
      (window as any).__trackToolUsed?.(slug);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!resultData) return;
    await navigator.clipboard.writeText(getCopyText(slug, resultData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-network-area">
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDER[slug] || 'example.com'}
          required
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card-bg)',
            color: 'var(--color-text)',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            fontWeight: 600,
          }}
        >
          {loading ? t.querying : t.execute}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: '0.75rem', color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>
      )}

      {resultData && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
            <button
              onClick={copyResult}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: copied ? 'rgba(16,185,129,0.08)' : 'var(--color-card-bg)',
                color: copied ? '#10b981' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {copied ? '✓ ' + t.copied : t.copy}
            </button>
          </div>
          <ResultRenderer slug={slug} data={resultData} locale={locale} />
        </div>
      )}
    </div>
  );
}
