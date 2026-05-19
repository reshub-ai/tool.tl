import { useState } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

interface CaseMode {
  key: string;
  label: Record<string, string>;
  desc: Record<string, string>;
  group: 'case' | 'code';
}

const MODES: CaseMode[] = [
  {
    key: 'upper',
    label: { en: 'UPPER CASE', 'zh-CN': '全大写', 'zh-TW': '全大寫', ja: '大文字' },
    desc:  { en: 'All letters uppercase', 'zh-CN': '所有字母转为大写', 'zh-TW': '所有字母轉為大寫', ja: 'すべて大文字' },
    group: 'case',
  },
  {
    key: 'lower',
    label: { en: 'lower case', 'zh-CN': '全小写', 'zh-TW': '全小寫', ja: '小文字' },
    desc:  { en: 'All letters lowercase', 'zh-CN': '所有字母转为小写', 'zh-TW': '所有字母轉為小寫', ja: 'すべて小文字' },
    group: 'case',
  },
  {
    key: 'sentence',
    label: { en: 'Sentence case', 'zh-CN': '句首大写', 'zh-TW': '句首大寫', ja: '文頭大文字' },
    desc:  { en: 'First letter of sentence capitalized', 'zh-CN': '仅句子首字母大写', 'zh-TW': '僅句子首字母大寫', ja: '文頭のみ大文字' },
    group: 'case',
  },
  {
    key: 'title',
    label: { en: 'Title Case', 'zh-CN': '词首大写', 'zh-TW': '詞首大寫', ja: 'タイトルケース' },
    desc:  { en: 'First letter of each word capitalized', 'zh-CN': '每个单词首字母大写', 'zh-TW': '每個單詞首字母大寫', ja: '各単語の頭文字を大文字' },
    group: 'case',
  },
  {
    key: 'toggle',
    label: { en: 'tOgGlE cAsE', 'zh-CN': '反转大小写', 'zh-TW': '反轉大小寫', ja: '大小文字反転' },
    desc:  { en: 'Invert case of each letter', 'zh-CN': '大写变小写，小写变大写', 'zh-TW': '大寫變小寫，小寫變大寫', ja: '各文字の大小を反転' },
    group: 'case',
  },
  {
    key: 'camel',
    label: { en: 'camelCase', 'zh-CN': 'camelCase（驼峰）', 'zh-TW': 'camelCase（駝峰）', ja: 'camelCase' },
    desc:  { en: 'For variables & functions', 'zh-CN': '适用于变量名、函数名', 'zh-TW': '適用於變數名、函式名', ja: '変数名・関数名に適用' },
    group: 'code',
  },
  {
    key: 'pascal',
    label: { en: 'PascalCase', 'zh-CN': 'PascalCase（帕斯卡）', 'zh-TW': 'PascalCase（帕斯卡）', ja: 'PascalCase' },
    desc:  { en: 'For classes & types', 'zh-CN': '适用于类名、类型名', 'zh-TW': '適用於類別名、型別名', ja: 'クラス名・型名に適用' },
    group: 'code',
  },
  {
    key: 'snake',
    label: { en: 'snake_case', 'zh-CN': 'snake_case（蛇形）', 'zh-TW': 'snake_case（蛇形）', ja: 'snake_case' },
    desc:  { en: 'Words joined by underscores', 'zh-CN': '单词用下划线连接', 'zh-TW': '單詞用底線連接', ja: 'アンダースコアで区切る' },
    group: 'code',
  },
  {
    key: 'kebab',
    label: { en: 'kebab-case', 'zh-CN': 'kebab-case（短横线）', 'zh-TW': 'kebab-case（短橫線）', ja: 'kebab-case' },
    desc:  { en: 'Words joined by hyphens', 'zh-CN': '单词用短横线连接', 'zh-TW': '單詞用連字號連接', ja: 'ハイフンで区切る' },
    group: 'code',
  },
  {
    key: 'constant',
    label: { en: 'CONSTANT_CASE', 'zh-CN': 'CONSTANT_CASE（常量）', 'zh-TW': 'CONSTANT_CASE（常量）', ja: 'CONSTANT_CASE' },
    desc:  { en: 'For constants & env vars', 'zh-CN': '适用于常量、环境变量', 'zh-TW': '適用於常數、環境變數', ja: '定数・環境変数に適用' },
    group: 'code',
  },
  {
    key: 'dot',
    label: { en: 'dot.case', 'zh-CN': 'dot.case（点分）', 'zh-TW': 'dot.case（點分）', ja: 'dot.case' },
    desc:  { en: 'Words joined by dots', 'zh-CN': '单词用点号连接', 'zh-TW': '單詞用點號連接', ja: 'ドットで区切る' },
    group: 'code',
  },
];

const i18n: Record<string, Record<string, string>> = {
  en:      { input: 'Input', placeholder: 'Type or paste text here…', copy: 'Copy', copied: 'Copied!', clear: 'Clear', groupCase: 'Letter Case', groupCode: 'Code Naming', copyAll: 'Copy All', empty: '—' },
  'zh-CN': { input: '输入', placeholder: '在此输入或粘贴文本…', copy: '复制', copied: '已复制！', clear: '清空', groupCase: '大小写转换', groupCode: '编程命名格式', copyAll: '复制全部', empty: '—' },
  'zh-TW': { input: '輸入', placeholder: '在此輸入或貼上文字…', copy: '複製', copied: '已複製！', clear: '清除', groupCase: '大小寫轉換', groupCode: '程式命名格式', copyAll: '複製全部', empty: '—' },
  ja:      { input: '入力', placeholder: 'テキストを入力または貼り付け…', copy: 'コピー', copied: 'コピー済！', clear: 'クリア', groupCase: '大小文字変換', groupCode: 'コード命名規則', copyAll: '全てコピー', empty: '—' },
};

function convert(input: string, key: string): string {
  if (!input.trim()) return '';
  const words = input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-\.]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  switch (key) {
    case 'upper':    return input.toUpperCase();
    case 'lower':    return input.toLowerCase();
    case 'sentence': return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    case 'title':    return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    case 'toggle':   return input.split('').map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
    case 'camel':    return words.map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'pascal':   return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
    case 'snake':    return words.map((w) => w.toLowerCase()).join('_');
    case 'kebab':    return words.map((w) => w.toLowerCase()).join('-');
    case 'constant': return words.map((w) => w.toUpperCase()).join('_');
    case 'dot':      return words.map((w) => w.toLowerCase()).join('.');
    default:         return input;
  }
}

export default function TextCaseTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = async (text: string, key: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    (window as any).__trackToolUsed?.(slug);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '10px', padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  };
  const pill: React.CSSProperties = {
    padding: '0.3rem 0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' as const,
  };
  const pillPrimary: React.CSSProperties = { ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none' };
  const pillGreen: React.CSSProperties = { ...pill, background: '#16a34a', color: '#fff', border: 'none' };

  const ResultCard = ({ mode }: { mode: CaseMode }) => {
    const result = convert(input, mode.key);
    const isCopied = copied === mode.key;
    return (
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)', fontFamily: 'monospace' }}>
              {mode.label[locale] || mode.label.en}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {mode.desc[locale] || mode.desc.en}
            </div>
          </div>
          <button
            style={isCopied ? pillGreen : pill}
            onClick={() => copyText(result, mode.key)}
            disabled={!result}
          >
            {isCopied ? t.copied : t.copy}
          </button>
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: '0.875rem', padding: '6px 8px',
          borderRadius: '6px', background: 'var(--color-bg)',
          border: '1px solid var(--color-border)', color: result ? 'var(--color-text)' : 'var(--color-text-secondary)',
          wordBreak: 'break-all', minHeight: '32px', lineHeight: '20px',
        }}>
          {result || t.empty}
        </div>
      </div>
    );
  };

  const caseModes = MODES.filter((m) => m.group === 'case');
  const codeModes = MODES.filter((m) => m.group === 'code');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Input */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
          {t.input}
        </label>
        <div style={{ position: 'relative' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              border: '1px solid var(--color-border)', borderRadius: '10px',
              background: 'var(--color-card-bg)', color: 'var(--color-text)',
              fontSize: '0.95rem', resize: 'vertical', lineHeight: 1.6,
            }}
          />
          {input && (
            <button
              onClick={() => setInput('')}
              style={{
                position: 'absolute', top: '8px', right: '8px',
                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              {t.clear}
            </button>
          )}
        </div>
      </div>

      {/* Group: Letter Case */}
      <div>
        <div style={{
          fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>{t.groupCase}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {caseModes.map((m) => <ResultCard key={m.key} mode={m} />)}
        </div>
      </div>

      {/* Group: Code Naming */}
      <div>
        <div style={{
          fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>{t.groupCode}</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
          {codeModes.map((m) => <ResultCard key={m.key} mode={m} />)}
        </div>
      </div>
    </div>
  );
}
