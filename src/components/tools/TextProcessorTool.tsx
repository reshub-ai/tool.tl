import { useState } from 'react';

interface Props { slug: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    input: 'Input', output: 'Output',
    mode: 'Mode',
    mode_wrap: 'Word Wrap', mode_split: 'Split Lines', mode_join: 'Join Lines',
    mode_prefix: 'Add Prefix/Suffix', mode_clean: 'Clean & Trim',
    wrap_width: 'Wrap at (chars)', split_by: 'Split by',
    split_newline: 'Newline', split_comma: 'Comma (,)', split_semi: 'Semicolon (;)', split_tab: 'Tab',
    join_with: 'Join with',
    join_newline: 'Newline', join_comma: 'Comma', join_space: 'Space', join_custom: 'Custom…',
    custom_sep: 'Custom separator',
    prefix: 'Prefix', suffix: 'Suffix',
    clean_trim: 'Trim whitespace', clean_empty: 'Remove empty lines', clean_dedup: 'Remove duplicates',
    btn_process: 'Process', btn_sample: 'Sample', btn_clear: 'Clear', btn_copy: 'Copy', btn_swap: 'Use Output as Input',
    placeholder_in: 'Paste text here…', placeholder_out: 'Result…',
    copied: 'Copied!', lines: 'lines',
  },
  'zh-CN': {
    input: '输入', output: '输出',
    mode: '模式',
    mode_wrap: '自动换行', mode_split: '拆分行', mode_join: '合并行',
    mode_prefix: '添加前缀/后缀', mode_clean: '清理与修剪',
    wrap_width: '换行宽度（字符数）', split_by: '按…拆分',
    split_newline: '换行符', split_comma: '逗号（,）', split_semi: '分号（;）', split_tab: '制表符',
    join_with: '合并方式',
    join_newline: '换行', join_comma: '逗号', join_space: '空格', join_custom: '自定义…',
    custom_sep: '自定义分隔符',
    prefix: '前缀', suffix: '后缀',
    clean_trim: '修剪空白', clean_empty: '删除空行', clean_dedup: '去除重复行',
    btn_process: '处理', btn_sample: '示例', btn_clear: '清空', btn_copy: '复制', btn_swap: '以输出作为输入',
    placeholder_in: '在此粘贴文本…', placeholder_out: '结果…',
    copied: '已复制！', lines: '行',
  },
  'zh-TW': {
    input: '輸入', output: '輸出',
    mode: '模式',
    mode_wrap: '自動換行', mode_split: '拆分行', mode_join: '合併行',
    mode_prefix: '新增前綴/後綴', mode_clean: '清理與修剪',
    wrap_width: '換行寬度（字元數）', split_by: '按…拆分',
    split_newline: '換行符', split_comma: '逗號（,）', split_semi: '分號（;）', split_tab: '定位字元',
    join_with: '合併方式',
    join_newline: '換行', join_comma: '逗號', join_space: '空格', join_custom: '自訂…',
    custom_sep: '自訂分隔符',
    prefix: '前綴', suffix: '後綴',
    clean_trim: '修剪空白', clean_empty: '刪除空行', clean_dedup: '去除重複行',
    btn_process: '處理', btn_sample: '範例', btn_clear: '清除', btn_copy: '複製', btn_swap: '以輸出作為輸入',
    placeholder_in: '在此貼上文字…', placeholder_out: '結果…',
    copied: '已複製！', lines: '行',
  },
  ja: {
    input: '入力', output: '出力',
    mode: 'モード',
    mode_wrap: '折り返し', mode_split: '行分割', mode_join: '行結合',
    mode_prefix: '接頭辞/接尾辞追加', mode_clean: 'クリーン＆トリム',
    wrap_width: '折り返し幅（文字数）', split_by: '分割方法',
    split_newline: '改行', split_comma: 'カンマ（,）', split_semi: 'セミコロン（;）', split_tab: 'タブ',
    join_with: '結合方法',
    join_newline: '改行', join_comma: 'カンマ', join_space: 'スペース', join_custom: 'カスタム…',
    custom_sep: 'カスタム区切り文字',
    prefix: '接頭辞', suffix: '接尾辞',
    clean_trim: '空白をトリム', clean_empty: '空行を削除', clean_dedup: '重複行を削除',
    btn_process: '処理', btn_sample: 'サンプル', btn_clear: 'クリア', btn_copy: 'コピー', btn_swap: '出力を入力に使用',
    placeholder_in: 'テキストを貼り付けてください…', placeholder_out: '結果…',
    copied: 'コピー済み！', lines: '行',
  },
};

const SAMPLE = `apple,banana,cherry,date,elderberry
one;two;three;four
Hello World this is a test of word wrapping functionality`;

type Mode = 'wrap' | 'split' | 'join' | 'prefix' | 'clean';

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
  borderRadius: '12px', padding: '16px',
};
const pillStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: '10px', border: '1px solid var(--color-border)',
  background: 'var(--color-card-bg)', color: 'var(--color-text)',
  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
};
const primaryPill: React.CSSProperties = { ...pillStyle, background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' };
const inputStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-card-bg)', color: 'var(--color-text)', fontSize: '0.875rem',
};
const taStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-card-bg)', color: 'var(--color-text)',
  fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit',
};

export default function TextProcessorTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('split');
  const [wrapWidth, setWrapWidth] = useState(80);
  const [splitBy, setSplitBy] = useState('comma');
  const [joinWith, setJoinWith] = useState('newline');
  const [customSep, setCustomSep] = useState(', ');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [doTrim, setDoTrim] = useState(true);
  const [doEmpty, setDoEmpty] = useState(true);
  const [doDedup, setDoDedup] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSplitSep = () => ({ newline: '\n', comma: ',', semi: ';', tab: '\t' }[splitBy] ?? ',');
  const getJoinSep = () => {
    if (joinWith === 'newline') return '\n';
    if (joinWith === 'comma') return ', ';
    if (joinWith === 'space') return ' ';
    return customSep;
  };

  const process = () => {
    let lines: string[] = input.split('\n');
    if (mode === 'wrap') {
      const w = Math.max(1, wrapWidth);
      const result: string[] = [];
      for (const line of lines) {
        if (line.length <= w) { result.push(line); continue; }
        let i = 0;
        while (i < line.length) {
          let end = i + w;
          if (end < line.length) {
            const space = line.lastIndexOf(' ', end);
            if (space > i) end = space;
          }
          result.push(line.slice(i, end).trim());
          i = end;
          while (i < line.length && line[i] === ' ') i++;
        }
      }
      setOutput(result.join('\n'));
    } else if (mode === 'split') {
      const sep = getSplitSep();
      const parts = input.split(sep).map(s => s.trim());
      setOutput(parts.join('\n'));
    } else if (mode === 'join') {
      const sep = getJoinSep();
      let parts = lines;
      if (doTrim) parts = parts.map(l => l.trim());
      if (doEmpty) parts = parts.filter(l => l.length > 0);
      setOutput(parts.join(sep));
    } else if (mode === 'prefix') {
      setOutput(lines.map(l => prefix + l + suffix).join('\n'));
    } else if (mode === 'clean') {
      let parts = lines;
      if (doTrim) parts = parts.map(l => l.trim());
      if (doEmpty) parts = parts.filter(l => l.length > 0);
      if (doDedup) parts = [...new Set(parts)];
      setOutput(parts.join('\n'));
    }
    (window as any).__trackToolUsed?.(slug);
  };

  const modes: Mode[] = ['split', 'join', 'wrap', 'prefix', 'clean'];
  const lineCount = output ? output.split('\n').length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--color-text)' }}>{t.mode}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {modes.map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={mode === m ? primaryPill : pillStyle}>
              {(t as any)['mode_' + m]}
            </button>
          ))}
        </div>

        {/* Mode options */}
        {mode === 'wrap' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.wrap_width}</span>
            <input type="number" min={1} max={500} value={wrapWidth} onChange={e => setWrapWidth(+e.target.value)} style={{ ...inputStyle, width: '80px' }} />
          </div>
        )}
        {mode === 'split' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.split_by}</span>
            {['newline', 'comma', 'semi', 'tab'].map(s => (
              <button key={s} type="button" onClick={() => setSplitBy(s)} style={splitBy === s ? primaryPill : pillStyle}>
                {(t as any)['split_' + s]}
              </button>
            ))}
          </div>
        )}
        {mode === 'join' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.join_with}</span>
            {['newline', 'comma', 'space', 'custom'].map(s => (
              <button key={s} type="button" onClick={() => setJoinWith(s)} style={joinWith === s ? primaryPill : pillStyle}>
                {(t as any)['join_' + s]}
              </button>
            ))}
            {joinWith === 'custom' && (
              <input value={customSep} onChange={e => setCustomSep(e.target.value)} placeholder=", " style={{ ...inputStyle, width: '100px' }} />
            )}
          </div>
        )}
        {mode === 'prefix' && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.prefix}</span>
              <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder='"' style={{ ...inputStyle, width: '120px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{t.suffix}</span>
              <input value={suffix} onChange={e => setSuffix(e.target.value)} placeholder='",' style={{ ...inputStyle, width: '120px' }} />
            </div>
          </div>
        )}
        {mode === 'clean' && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[['doTrim', t.clean_trim], ['doEmpty', t.clean_empty], ['doDedup', t.clean_dedup]].map(([k, label]) => (
              <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--color-text)' }}>
                <input type="checkbox" checked={k === 'doTrim' ? doTrim : k === 'doEmpty' ? doEmpty : doDedup}
                  onChange={e => k === 'doTrim' ? setDoTrim(e.target.checked) : k === 'doEmpty' ? setDoEmpty(e.target.checked) : setDoDedup(e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        )}

        {/* I/O */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{t.input}</div>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={t.placeholder_in} rows={8} style={taStyle} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              {t.output} {output && <span style={{ color: 'var(--color-primary)' }}>({lineCount} {t.lines})</span>}
            </div>
            <textarea readOnly value={output} placeholder={t.placeholder_out} rows={8} style={taStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button type="button" onClick={process} style={primaryPill}>{t.btn_process}</button>
          <button type="button" onClick={() => setInput(SAMPLE)} style={pillStyle}>{t.btn_sample}</button>
          <button type="button" onClick={() => { if (output) setInput(output); setOutput(''); }} style={pillStyle}>{t.btn_swap}</button>
          <button type="button" onClick={() => navigator.clipboard?.writeText(output).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })} style={pillStyle}>
            {copied ? t.copied : t.btn_copy}
          </button>
          <button type="button" onClick={() => { setInput(''); setOutput(''); }} style={pillStyle}>{t.btn_clear}</button>
        </div>
      </div>
    </div>
  );
}
