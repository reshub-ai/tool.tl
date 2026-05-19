import { useState, useEffect } from 'react';

interface Props {
  locale: string;
  toolPath: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    title: 'Current Timestamp',
    unix_seconds: 'Unix (s)',
    unix_ms: 'Unix (ms)',
    local_time: 'Local Time',
    copy: 'Copy',
    copied: 'Copied!',
    go_tool: 'Full Tool →',
  },
  'zh-CN': {
    title: '当前时间戳',
    unix_seconds: 'Unix（秒）',
    unix_ms: 'Unix（毫秒）',
    local_time: '本地时间',
    copy: '复制',
    copied: '已复制！',
    go_tool: '完整工具 →',
  },
  'zh-TW': {
    title: '當前時間戳',
    unix_seconds: 'Unix（秒）',
    unix_ms: 'Unix（毫秒）',
    local_time: '本地時間',
    copy: '複製',
    copied: '已複製！',
    go_tool: '完整工具 →',
  },
  ja: {
    title: '現在のタイムスタンプ',
    unix_seconds: 'Unix（秒）',
    unix_ms: 'Unix（ミリ秒）',
    local_time: 'ローカル時間',
    copy: 'コピー',
    copied: 'コピー済み！',
    go_tool: '詳細ツール →',
  },
};

export default function TimestampWidget({ locale, toolPath }: Props) {
  const t = i18n[locale] || i18n.en;
  const [now, setNow] = useState(() => new Date());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const unixSec = Math.floor(now.getTime() / 1000);
  const unixMs = now.getTime();
  const localTime = now.toLocaleString();

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: 'sec',   label: t.unix_seconds, value: String(unixSec) },
    { key: 'ms',    label: t.unix_ms,      value: String(unixMs)  },
    { key: 'local', label: t.local_time,   value: localTime       },
  ];

  return (
    <div
      style={{
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        backgroundColor: 'transparent',
        padding: '0.5rem 0.85rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.35rem',
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>⏱</span>
          {t.title}
        </span>
        <a
          href={toolPath}
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 500,
            opacity: 0.9,
            whiteSpace: 'nowrap',
          }}
        >
          {t.go_tool}
        </a>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        {rows.map(({ key, label, value }) => (
          <div
            key={key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(72px, auto) 1fr auto',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.25rem 0',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
            <span
              style={{
                fontFamily: key !== 'local' ? 'monospace' : 'inherit',
                fontSize: key !== 'local' ? '0.9rem' : '0.85rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                letterSpacing: key !== 'local' ? '0.02em' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </span>
            <button
              onClick={() => copy(value, key)}
              style={{
                padding: '0.15rem 0.55rem',
                borderRadius: '5px',
                border: '1px solid var(--color-border)',
                backgroundColor: copiedKey === key ? 'var(--color-primary)' : 'transparent',
                color: copiedKey === key ? '#fff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {copiedKey === key ? t.copied : t.copy}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
