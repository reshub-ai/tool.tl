import { useState, useMemo } from 'react';

interface Props { slug: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    input_label: 'Input Text',
    placeholder: 'Paste or type your text here…',
    btn_clear: 'Clear', btn_sample: 'Sample',
    stats: 'Statistics',
    chars: 'Characters (with spaces)',
    chars_no_space: 'Characters (no spaces)',
    words: 'Words',
    lines: 'Lines',
    sentences: 'Sentences',
    paragraphs: 'Paragraphs',
    bytes_utf8: 'Bytes (UTF-8)',
    bytes_utf16: 'Bytes (UTF-16)',
    unique_words: 'Unique words',
    avg_word_len: 'Avg word length',
  },
  'zh-CN': {
    input_label: '输入文本',
    placeholder: '在此粘贴或输入文本…',
    btn_clear: '清空', btn_sample: '示例',
    stats: '统计结果',
    chars: '字符数（含空格）',
    chars_no_space: '字符数（不含空格）',
    words: '单词数',
    lines: '行数',
    sentences: '句子数',
    paragraphs: '段落数',
    bytes_utf8: '字节数（UTF-8）',
    bytes_utf16: '字节数（UTF-16）',
    unique_words: '不重复单词数',
    avg_word_len: '平均单词长度',
  },
  'zh-TW': {
    input_label: '輸入文字',
    placeholder: '在此貼上或輸入文字…',
    btn_clear: '清除', btn_sample: '範例',
    stats: '統計結果',
    chars: '字元數（含空格）',
    chars_no_space: '字元數（不含空格）',
    words: '單詞數',
    lines: '行數',
    sentences: '句子數',
    paragraphs: '段落數',
    bytes_utf8: '位元組數（UTF-8）',
    bytes_utf16: '位元組數（UTF-16）',
    unique_words: '不重複單詞數',
    avg_word_len: '平均單詞長度',
  },
  ja: {
    input_label: '入力テキスト',
    placeholder: 'テキストを貼り付けるか入力してください…',
    btn_clear: 'クリア', btn_sample: 'サンプル',
    stats: '統計結果',
    chars: '文字数（スペース含む）',
    chars_no_space: '文字数（スペース除く）',
    words: '単語数',
    lines: '行数',
    sentences: '文の数',
    paragraphs: '段落数',
    bytes_utf8: 'バイト数（UTF-8）',
    bytes_utf16: 'バイト数（UTF-16）',
    unique_words: 'ユニーク単語数',
    avg_word_len: '平均単語長',
  },
};

const SAMPLE = `The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.

Hello World! This is a sample text for testing.`;

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
  borderRadius: '12px', padding: '16px',
};
const pillStyle: React.CSSProperties = {
  padding: '7px 14px', borderRadius: '10px', border: '1px solid var(--color-border)',
  background: 'var(--color-card-bg)', color: 'var(--color-text)',
  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
};

function computeStats(text: string) {
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;
  const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+/g) || []).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
  const encoder = new TextEncoder();
  const bytesUtf8 = encoder.encode(text).length;
  const bytesUtf16 = text.length * 2;
  const wordList = text.trim() ? text.trim().toLowerCase().split(/\s+/) : [];
  const uniqueWords = new Set(wordList.map(w => w.replace(/[^a-z0-9一-鿿]/g, ''))).size;
  const avgWordLen = words ? (wordList.reduce((s, w) => s + w.length, 0) / words).toFixed(1) : '0';
  return { chars, charsNoSpace, words, lines, sentences, paragraphs, bytesUtf8, bytesUtf16, uniqueWords, avgWordLen };
}

export default function TextStatsTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [text, setText] = useState('');
  const stats = useMemo(() => computeStats(text), [text]);

  const statRows = [
    { label: t.chars, val: stats.chars },
    { label: t.chars_no_space, val: stats.charsNoSpace },
    { label: t.words, val: stats.words },
    { label: t.lines, val: stats.lines },
    { label: t.sentences, val: stats.sentences },
    { label: t.paragraphs, val: stats.paragraphs },
    { label: t.bytes_utf8, val: stats.bytesUtf8 },
    { label: t.bytes_utf16, val: stats.bytesUtf16 },
    { label: t.unique_words, val: stats.uniqueWords },
    { label: t.avg_word_len, val: stats.avgWordLen },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--color-text)' }}>{t.input_label}</div>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); (window as any).__trackToolUsed?.(slug); }}
          placeholder={t.placeholder}
          rows={8}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px',
            border: '1px solid var(--color-border)', borderRadius: '8px',
            background: 'var(--color-card-bg)', color: 'var(--color-text)',
            fontSize: '0.9rem', resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button type="button" onClick={() => setText(SAMPLE)} style={pillStyle}>{t.btn_sample}</button>
          <button type="button" onClick={() => setText('')} style={pillStyle}>{t.btn_clear}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
        {statRows.map(row => (
          <div key={row.label} style={{ ...cardStyle, padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{row.label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
              {row.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
