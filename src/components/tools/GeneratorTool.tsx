import { useState, useCallback } from 'react';

interface Props {
  slug: string;
  apiType: string;
  apiEndpoint: string;
  locale: string;
  component: string;
  defaultMode?: string;
}

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const PINYIN_SYLLABLES = new Set([
  'a', 'ai', 'an', 'ang', 'ao',
  'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu',
  'ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cen', 'ceng', 'cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chi', 'chong', 'chou', 'chu', 'chua', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo',
  'da', 'dai', 'dan', 'dang', 'dao', 'de', 'dei', 'den', 'deng', 'di', 'dia', 'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo',
  'e', 'ei', 'en', 'eng', 'er',
  'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu',
  'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo',
  'ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo',
  'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun',
  'ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'kei', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo',
  'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'lo', 'long', 'lou', 'lu', 'luan', 'lun', 'luo', 'lv', 'lve',
  'ma', 'mai', 'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie', 'min', 'ming', 'miu', 'mo', 'mou', 'mu',
  'na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nou', 'nu', 'nuan', 'nun', 'nuo', 'nv', 'nve',
  'o', 'ou',
  'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao', 'pie', 'pin', 'ping', 'po', 'pou', 'pu',
  'qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun',
  'ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'ruan', 'rui', 'run', 'ruo',
  'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai', 'shan', 'shang', 'shao', 'she', 'shen', 'sheng', 'shi', 'shou', 'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si', 'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo',
  'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'tei', 'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo',
  'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu',
  'xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan', 'xue', 'xun',
  'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yo', 'yong', 'you', 'yu', 'yuan', 'yue', 'yun',
  'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhen', 'zheng', 'zhi', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'zhui', 'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo',
]);

const PINYIN_TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v',
};

function normalizePinyinToken(value: string) {
  return value
    .toLowerCase()
    .split('')
    .map((char) => PINYIN_TONE_MAP[char] || char)
    .join('');
}

function splitPinyinSyllables(value: string) {
  if (/\s/.test(value)) return value;
  const parts: string[] = [];
  let index = 0;

  while (index < value.length) {
    if (!/[A-Za-z\u00C0-\u024F\u01CD-\u01DC\u01D5-\u01DC]/.test(value[index])) {
      parts.push(value[index]);
      index += 1;
      continue;
    }

    let match = '';
    for (let end = Math.min(value.length, index + 6); end > index; end -= 1) {
      const raw = value.slice(index, end);
      if (PINYIN_SYLLABLES.has(normalizePinyinToken(raw))) {
        match = raw;
        break;
      }
    }

    if (!match) return value;
    parts.push(match);
    index += match.length;
  }

  return parts.join(' ').replace(/\s+([,.;:!?，。；：！？])/g, '$1');
}

const i18n: Record<string, Record<string, string>> = {
  en: { generate: 'Generate', copy: 'Copy', copied: 'Copied!', clear: 'Clear', result: 'Result', download: 'Download' },
  'zh-CN': { generate: '生成', copy: '复制', copied: '已复制', clear: '清空', result: '结果', download: '下载' },
  'zh-TW': { generate: '生成', copy: '複製', copied: '已複製', clear: '清空', result: '結果', download: '下載' },
  ja: { generate: '生成', copy: 'コピー', copied: 'コピー済み', clear: 'クリア', result: '結果', download: 'ダウンロード' },
};

export default function GeneratorTool({ slug, locale, component, apiEndpoint, defaultMode }: Props) {
  const t = i18n[locale] || i18n.en;
  const config = getGeneratorConfig(component, locale, defaultMode);
  const isPinyinTool = component === 'ChineseToPinyin';

  const [params, setParams] = useState<Record<string, any>>(config.defaults);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const generate = useCallback(async () => {
    setError('');
    try {
      const output = await config.generate(params, apiEndpoint);
      if (typeof output === 'object' && output.previewUrl) {
        setPreviewUrl(output.previewUrl);
        setResult(output.text || '');
      } else {
        setResult(output as string);
        setPreviewUrl('');
      }
      (window as any).__trackToolUsed?.(slug);
    } catch (e: any) {
      setError(e.message);
    }
  }, [params, config, apiEndpoint]);

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLine = async (line: string, index: number) => {
    await navigator.clipboard.writeText(line);
    setCopiedLine(index);
    setTimeout(() => setCopiedLine(null), 2000);
  };
  const downloadPreview = async () => {
    if (!previewUrl) return;
    try {
      const image = new Image();
      const pngUrl = await new Promise<string>((resolve, reject) => {
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth || image.width || 300;
          canvas.height = image.naturalHeight || image.height || 300;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas is not available'));
            return;
          }
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = () => reject(new Error('Unable to prepare PNG download'));
        image.src = previewUrl;
      });

      const link = document.createElement('a');
      link.download = `tool.tl-${slug}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateParam = (key: string, value: any) => {
    setParams((p) => ({ ...p, [key]: value }));
  };

  const btnStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer' as const,
    fontSize: '0.85rem',
  };

  const primaryBtn = {
    ...btnStyle,
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
  };

  return (
    <div className="tool-generator-area">
      {/* Config panel */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-card-bg)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          {config.fields.map((field) => (
            <div key={field.key} style={{ width: field.type === 'textarea' ? '100%' : undefined }}>
              <label
                style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--color-text-secondary)' }}
              >
                {field.labels[locale] || field.labels.en}
              </label>
              {field.type === 'number' && (
                <input
                  type="number"
                  value={params[field.key] ?? ''}
                  onChange={(e) => updateParam(field.key, Number(e.target.value))}
                  min={field.min}
                  max={field.max}
                  style={{ ...btnStyle, width: '100px' }}
                />
              )}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={params[field.key] ?? ''}
                  onChange={(e) => updateParam(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{ ...btnStyle, width: field.width || '260px', maxWidth: '100%' }}
                />
              )}
              {field.type === 'textarea' && (
                <textarea
                  value={params[field.key] ?? ''}
                  onChange={(e) => updateParam(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                  rows={3}
                  style={{
                    ...btnStyle,
                    width: '100%',
                    minWidth: '250px',
                    minHeight: '140px',
                    fontFamily: 'monospace',
                    resize: 'vertical' as const,
                  }}
                />
              )}
              {field.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={params[field.key] ?? false}
                  onChange={(e) => updateParam(field.key, e.target.checked)}
                  style={{ marginLeft: '0.5rem' }}
                />
              )}
              {field.type === 'select' && (
                <select
                  value={params[field.key] ?? ''}
                  onChange={(e) => updateParam(field.key, e.target.value)}
                  style={btnStyle}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button onClick={generate} style={primaryBtn}>{config.actionLabel?.[locale] || config.actionLabel?.en || t.generate}</button>
        <button onClick={copy} style={btnStyle}>{copied ? t.copied : t.copy}</button>
        <button onClick={() => { setResult(''); setPreviewUrl(''); setError(''); }} style={btnStyle}>{t.clear}</button>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}

      {/* Preview (e.g. QR code) */}
      {previewUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <img src={previewUrl} alt="Generated" style={{ maxWidth: '300px', borderRadius: '8px' }} />
          <div style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={downloadPreview} style={btnStyle}>
              {t.download}
            </button>
          </div>
        </div>
      )}

      {/* Result display */}
      {result && (
        <div
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--color-card-bg)',
            border: '1px solid var(--color-border)',
            overflow: 'auto',
            maxHeight: '500px',
          }}
        >
          {result.split('\n').map((line, i) =>
            line.trim() === '' ? null : (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <code
                  style={{
                    fontFamily: isPinyinTool ? 'inherit' : 'monospace',
                    fontSize: isPinyinTool ? '1rem' : '0.875rem',
                    lineHeight: isPinyinTool ? 1.6 : undefined,
                    color: 'var(--color-text)',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {line}
                </code>
                <button
                  onClick={() => copyLine(line, i)}
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: copiedLine === i ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: copiedLine === i ? '#fff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {copiedLine === i ? t.copied : t.copy}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Generator configs ─────────────────────────────────────── */

interface FieldDef {
  key: string;
  labels: Record<string, string>;
  type: 'number' | 'text' | 'textarea' | 'checkbox' | 'select';
  min?: number;
  max?: number;
  placeholder?: string;
  width?: string;
  options?: Array<{ value: string; label: string }>;
}

interface GeneratorConfig {
  fields: FieldDef[];
  defaults: Record<string, any>;
  actionLabel?: Record<string, string>;
  generate: (params: Record<string, any>, apiEndpoint?: string) => Promise<any> | any;
}

function getGeneratorConfig(component: string, locale: string = 'en', defaultMode: string = ''): GeneratorConfig {
  switch (component) {
    case 'PasswordGenerator':
      return {
        fields: [
          { key: 'length', labels: { en: 'Length', 'zh-CN': '长度', 'zh-TW': '長度', ja: '長さ' }, type: 'number', min: 4, max: 128 },
          { key: 'count', labels: { en: 'Count', 'zh-CN': '数量', 'zh-TW': '數量', ja: '数量' }, type: 'number', min: 1, max: 50 },
          { key: 'uppercase', labels: { en: 'A-Z', 'zh-CN': '大写', 'zh-TW': '大寫', ja: '大文字' }, type: 'checkbox' },
          { key: 'lowercase', labels: { en: 'a-z', 'zh-CN': '小写', 'zh-TW': '小寫', ja: '小文字' }, type: 'checkbox' },
          { key: 'numbers', labels: { en: '0-9', 'zh-CN': '数字', 'zh-TW': '數字', ja: '数字' }, type: 'checkbox' },
          { key: 'symbols', labels: { en: '!@#$', 'zh-CN': '符号', 'zh-TW': '符號', ja: '記号' }, type: 'checkbox' },
        ],
        defaults: { length: 16, count: 5, uppercase: true, lowercase: true, numbers: true, symbols: true },
        generate: (p) => {
          let chars = '';
          if (p.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          if (p.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
          if (p.numbers) chars += '0123456789';
          if (p.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
          if (!chars) throw new Error('Select at least one character type');
          const results: string[] = [];
          const arr = new Uint32Array(p.length);
          for (let i = 0; i < p.count; i++) {
            crypto.getRandomValues(arr);
            let pw = '';
            for (let j = 0; j < p.length; j++) pw += chars[arr[j] % chars.length];
            results.push(pw);
          }
          return results.join('\n');
        },
      };

    case 'TotpGenerator':
      return {
        fields: [
          { key: 'secret', labels: { en: 'Secret Key', 'zh-CN': '密钥', 'zh-TW': '密鑰', ja: '秘密鍵' }, type: 'text', placeholder: 'JBSWY3DPEHPK3PXP' },
        ],
        defaults: { secret: '' },
        generate: async (p, apiEndpoint) => {
          if (!p.secret) throw new Error('Enter a TOTP secret key');
          const res = await fetch(`${API_BASE}${apiEndpoint || '/totp/'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: p.secret }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          return `Code: ${data.code}\nRemaining: ${data.remaining}s`;
        },
      };

    case 'SvgToPng':
      return {
        fields: [
          { key: 'svg', labels: { en: 'SVG Code', 'zh-CN': 'SVG 代码', 'zh-TW': 'SVG 程式碼', ja: 'SVGコード' }, type: 'textarea', placeholder: '<svg>...</svg>' },
          { key: 'scale', labels: { en: 'Scale', 'zh-CN': '缩放', 'zh-TW': '縮放', ja: 'スケール' }, type: 'number', min: 1, max: 10 },
        ],
        defaults: { svg: '', scale: 2 },
        generate: (p) => {
          if (!p.svg.trim()) throw new Error('Enter SVG code');
          const blob = new Blob([p.svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          return { previewUrl: url, text: 'SVG preview generated. Right-click to save as PNG.' };
        },
      };

    case 'QrCode':
      return {
        fields: [
          { key: 'text', labels: { en: 'Text / URL', 'zh-CN': '文本 / URL', 'zh-TW': '文字 / URL', ja: 'テキスト / URL' }, type: 'text', placeholder: 'https://example.com', width: '360px' },
          { key: 'size', labels: { en: 'Size', 'zh-CN': '尺寸', 'zh-TW': '尺寸', ja: 'サイズ' }, type: 'number', min: 100, max: 1000 },
        ],
        defaults: { text: '', size: 300 },
        generate: async (p, apiEndpoint) => {
          if (!p.text) throw new Error('Enter text or URL');
          const formData = new FormData();
          formData.append('text', p.text);
          formData.append('size', String(p.size || 300));
          const res = await fetch(`${API_BASE}${apiEndpoint || '/qrcode/api'}`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error('QR code generation failed');
          const blob = await res.blob();
          return { previewUrl: URL.createObjectURL(blob), text: '' };
        },
      };
    case 'BarcodeGenerator':
      return {
        fields: [
          { key: 'text', labels: { en: 'Text', 'zh-CN': '内容', 'zh-TW': '內容', ja: 'テキスト' }, type: 'text', placeholder: 'TL-2026-0001', width: '280px' },
          { key: 'height', labels: { en: 'Height', 'zh-CN': '高度', 'zh-TW': '高度', ja: '高さ' }, type: 'number', min: 48, max: 180 },
        ],
        defaults: { text: 'TL-2026-0001', height: 96 },
        actionLabel: { en: 'Generate', 'zh-CN': '生成', 'zh-TW': '生成', ja: '生成' },
        generate: (p) => {
          const text = String(p.text || '').trim();
          const height = Math.min(180, Math.max(48, Number(p.height) || 96));
          if (!text) throw new Error('Enter barcode text');
          if (!/^[\x20-\x7e]+$/.test(text)) throw new Error('Code 128 supports ASCII characters only');
          const svg = createCode128Svg(text, height);
          const previewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
          return { previewUrl, text: `Type: Code 128\nData: ${text}` };
        },
      };
    case 'UrlEncoder':
      return {
        fields: [
          { key: 'input', labels: { en: 'Input', 'zh-CN': '输入', 'zh-TW': '輸入', ja: '入力' }, type: 'textarea', placeholder: 'https://example.com/path?query=hello world' },
        ],
        defaults: { input: '' },
        generate: (p) => encodeURIComponent(p.input),
      };

    case 'UrlDecoder':
      return {
        fields: [
          { key: 'input', labels: { en: 'Input', 'zh-CN': '输入', 'zh-TW': '輸入', ja: '入力' }, type: 'textarea', placeholder: 'https%3A%2F%2Fexample.com' },
        ],
        defaults: { input: '' },
        generate: (p) => decodeURIComponent(p.input),
      };

    case 'TimestampConverter': {
      const tsLabels: Record<string, Record<string, string>> = {
        en:    { now: 'Current Time', unix: 'Unix (s)', ms: 'Milliseconds', iso: 'ISO 8601', utc: 'UTC', local: 'Local', invalid: 'Invalid date/timestamp' },
        'zh-CN': { now: '当前时间', unix: 'Unix（秒）', ms: '毫秒', iso: 'ISO 8601', utc: 'UTC', local: '本地时间', invalid: '无效的日期/时间戳' },
        'zh-TW': { now: '目前時間', unix: 'Unix（秒）', ms: '毫秒', iso: 'ISO 8601', utc: 'UTC', local: '本地時間', invalid: '無效的日期/時間戳' },
        ja:    { now: '現在時刻', unix: 'Unix（秒）', ms: 'ミリ秒', iso: 'ISO 8601', utc: 'UTC', local: 'ローカル時間', invalid: '無効な日付/タイムスタンプ' },
      };
      const L = tsLabels[locale] || tsLabels.en;
      return {
        fields: [
          { key: 'input', labels: { en: 'Timestamp / Date', 'zh-CN': '时间戳 / 日期', 'zh-TW': '時間戳 / 日期', ja: 'タイムスタンプ / 日付' }, type: 'text', placeholder: '1700000000 or 2024-01-01' },
        ],
        defaults: { input: '' },
        generate: (p) => {
          const val = p.input.trim();
          if (!val) {
            const now = new Date();
            return `${L.now}:\n${L.unix}:  ${Math.floor(now.getTime() / 1000)}\n${L.iso}:   ${now.toISOString()}\n${L.local}: ${now.toLocaleString()}`;
          }
          if (/^\d{10,13}$/.test(val)) {
            const ts = val.length === 13 ? Number(val) : Number(val) * 1000;
            const d = new Date(ts);
            return `${L.unix}:  ${Math.floor(ts / 1000)}\n${L.ms}:    ${ts}\n${L.iso}:   ${d.toISOString()}\n${L.utc}:   ${d.toUTCString()}\n${L.local}: ${d.toLocaleString()}`;
          }
          const d = new Date(val);
          if (isNaN(d.getTime())) throw new Error(L.invalid);
          return `${L.unix}:  ${Math.floor(d.getTime() / 1000)}\n${L.ms}:    ${d.getTime()}\n${L.iso}:   ${d.toISOString()}\n${L.utc}:   ${d.toUTCString()}\n${L.local}: ${d.toLocaleString()}`;
        },
      };
    }

    case 'RegexTester':
      return {
        fields: [
          { key: 'pattern', labels: { en: 'Pattern', 'zh-CN': '正则表达式', 'zh-TW': '正規表達式', ja: 'パターン' }, type: 'text', placeholder: '\\d+' },
          { key: 'flags', labels: { en: 'Flags', 'zh-CN': '标志', 'zh-TW': '標誌', ja: 'フラグ' }, type: 'text', placeholder: 'gim' },
          { key: 'input', labels: { en: 'Test String', 'zh-CN': '测试字符串', 'zh-TW': '測試字串', ja: 'テスト文字列' }, type: 'textarea', placeholder: 'Hello 123 World 456' },
        ],
        defaults: { pattern: '', flags: 'g', input: '' },
        generate: (p) => {
          if (!p.pattern) throw new Error('Enter a regex pattern');
          const re = new RegExp(p.pattern, p.flags || '');
          const matches = [...p.input.matchAll(re)];
          if (matches.length === 0) return 'No matches found.';
          return matches
            .map((m, i) => {
              let line = `Match ${i + 1}: "${m[0]}" at index ${m.index}`;
              if (m.length > 1) {
                line += '\n  Groups: ' + m.slice(1).map((g, j) => `$${j + 1}="${g}"`).join(', ');
              }
              return line;
            })
            .join('\n');
        },
      };

    case 'Base64EncoderImg':
      return {
        fields: [
          { key: 'input', labels: { en: 'Paste Base64 or drag image', 'zh-CN': '粘贴Base64或拖入图片', 'zh-TW': '貼上Base64或拖入圖片', ja: 'Base64を貼り付けまたは画像をドラッグ' }, type: 'textarea', placeholder: 'Paste image Base64 data URI here...' },
        ],
        defaults: { input: '' },
        generate: (p) => {
          if (!p.input.trim()) throw new Error('Provide Base64 image data');
          const dataUri = p.input.trim().startsWith('data:') ? p.input.trim() : `data:image/png;base64,${p.input.trim()}`;
          return { previewUrl: dataUri, text: dataUri };
        },
      };

    case 'Base64DecoderImg':
      return {
        fields: [
          { key: 'input', labels: { en: 'Base64 Image Data', 'zh-CN': 'Base64 图片数据', 'zh-TW': 'Base64 圖片資料', ja: 'Base64画像データ' }, type: 'textarea', placeholder: 'data:image/png;base64,...' },
        ],
        defaults: { input: '' },
        generate: (p) => {
          if (!p.input.trim()) throw new Error('Provide Base64 image data');
          const dataUri = p.input.trim().startsWith('data:') ? p.input.trim() : `data:image/png;base64,${p.input.trim()}`;
          return { previewUrl: dataUri, text: `Image decoded successfully.\nLength: ${p.input.trim().length} chars` };
        },
      };

    case 'ChineseToPinyin':
      return {
        fields: [
          { key: 'input', labels: { en: 'Chinese Text', 'zh-CN': '中文文本', 'zh-TW': '中文文字', ja: '中国語テキスト' }, type: 'textarea', placeholder: '请输入中文文本...' },
          { key: 'tone', labels: { en: 'Tone marks', 'zh-CN': '输出声调', 'zh-TW': '輸出聲調', ja: '声調記号' }, type: 'checkbox' },
          { key: 'capitalize', labels: { en: 'Capitalize each word', 'zh-CN': '每个字首字母大写', 'zh-TW': '每個字首字母大寫', ja: '各語を大文字で開始' }, type: 'checkbox' },
        ],
        defaults: { input: '', tone: false, capitalize: false },
        actionLabel: { en: 'Convert', 'zh-CN': '开始转换', 'zh-TW': '開始轉換', ja: '変換' },
        generate: async (p, apiEndpoint) => {
          if (!p.input.trim()) throw new Error('Enter Chinese text');
          const res = await fetch(`${API_BASE}${apiEndpoint || '/chinese-to-pinyin/api'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: p.input.trim(),
              tone: Boolean(p.tone),
              capitalize: Boolean(p.capitalize),
            }),
          });
          const data = await res.json();
          if (!res.ok || data.ok === false || data.error) throw new Error(data.error || data.msg || `HTTP ${res.status}`);
          const output = data.data || data.pinyin || data.result || JSON.stringify(data, null, 2);
          return splitPinyinSyllables(String(output));
        },
      };
    case 'WifiPasswordGenerator': {
      const wifiLabels: Record<string, Record<string, string>> = {
        en:      { ssid: 'Network Name (SSID)', password: 'Password', security: 'Security', hidden: 'Hidden Network', nopass: 'No Password (Open)', errSsid: 'Enter a network name (SSID)' },
        'zh-CN': { ssid: '网络名称 (SSID)', password: '密码', security: '加密类型', hidden: '隐藏网络', nopass: '无密码（开放网络）', errSsid: '请输入网络名称 (SSID)' },
        'zh-TW': { ssid: '網路名稱 (SSID)', password: '密碼', security: '加密類型', hidden: '隱藏網路', nopass: '無密碼（開放網路）', errSsid: '請輸入網路名稱 (SSID)' },
        ja:      { ssid: 'ネットワーク名 (SSID)', password: 'パスワード', security: 'セキュリティ', hidden: '非公開ネットワーク', nopass: 'パスワードなし（オープン）', errSsid: 'ネットワーク名(SSID)を入力してください' },
      };
      const WL = wifiLabels[locale] || wifiLabels.en;
      return {
        fields: [
          { key: 'ssid', labels: { en: WL.ssid, 'zh-CN': WL.ssid, 'zh-TW': WL.ssid, ja: WL.ssid }, type: 'text', placeholder: 'MyHomeWiFi' },
          { key: 'password', labels: { en: WL.password, 'zh-CN': WL.password, 'zh-TW': WL.password, ja: WL.password }, type: 'text', placeholder: 'mypassword123' },
          {
            key: 'security',
            labels: { en: WL.security, 'zh-CN': WL.security, 'zh-TW': WL.security, ja: WL.security },
            type: 'select',
            options: [
              { value: 'WPA', label: 'WPA/WPA2' },
              { value: 'WEP', label: 'WEP' },
              { value: 'nopass', label: WL.nopass },
            ],
          },
          { key: 'hidden', labels: { en: WL.hidden, 'zh-CN': WL.hidden, 'zh-TW': WL.hidden, ja: WL.hidden }, type: 'checkbox' },
        ],
        defaults: { ssid: '', password: '', security: 'WPA', hidden: false },
        generate: async (p) => {
          if (!p.ssid.trim()) throw new Error(WL.errSsid);
          // Escape special chars per WiFi QR spec
          const esc = (s: string) => s.replace(/([\\;,":])/g, '\\$1');
          const wifiString = `WIFI:T:${p.security};S:${esc(p.ssid)};P:${esc(p.password)};H:${p.hidden ? 'true' : 'false'};;`;
          // Generate QR code via API
          const formData = new FormData();
          formData.append('text', wifiString);
          formData.append('size', '300');
          const res = await fetch(`${API_BASE}/qrcode/api`, { method: 'POST', body: formData });
          if (!res.ok) throw new Error('QR code generation failed');
          const blob = await res.blob();
          return { previewUrl: URL.createObjectURL(blob), text: wifiString };
        },
      };
    }

    case 'ColorConverter':
      const defaultColor = defaultMode === 'rgb-to-hex' ? 'rgb(255, 87, 51)' : '#FF5733';
      return {
        fields: [
          { key: 'input', labels: { en: 'Color', 'zh-CN': '颜色值', 'zh-TW': '顏色值', ja: 'カラー' }, type: 'text', placeholder: '#FF5733 or rgb(255,87,51) or hsl(9,100%,60%)' },
        ],
        defaults: { input: defaultColor },
        actionLabel: { en: 'Convert', 'zh-CN': '转换', 'zh-TW': '轉換', ja: '変換' },
        generate: (p) => {
          const v = p.input.trim();
          if (!v) throw new Error('Enter a color value');

          let r = 0, g = 0, b = 0;
          let matched = false;

          // Hex
          const hexMatch = v.match(/^#?([0-9a-f]{3,8})$/i);
          if (hexMatch) {
            let hex = hexMatch[1];
            if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
            if (hex.length < 6) throw new Error('Supported: #HEX, rgb(r,g,b), hsl(h,s%,l%)');
            r = parseInt(hex.slice(0,2), 16);
            g = parseInt(hex.slice(2,4), 16);
            b = parseInt(hex.slice(4,6), 16);
            matched = true;
          }

          // rgb()
          const rgbMatch = v.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
          if (rgbMatch) {
            r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]);
            matched = true;
          }

          // hsl()
          const hslMatch = v.match(/^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i);
          if (hslMatch) {
            const h = (((Number(hslMatch[1]) % 360) + 360) % 360) / 360;
            const s = Math.max(0, Math.min(100, Number(hslMatch[2]))) / 100;
            const l = Math.max(0, Math.min(100, Number(hslMatch[3]))) / 100;
            if (s === 0) {
              r = g = b = Math.round(l * 255);
            } else {
              const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
              };
              const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              const p2 = 2 * l - q;
              r = Math.round(hue2rgb(p2, q, h + 1 / 3) * 255);
              g = Math.round(hue2rgb(p2, q, h) * 255);
              b = Math.round(hue2rgb(p2, q, h - 1 / 3) * 255);
            }
            matched = true;
          }

          if (!matched || [r, g, b].some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
            throw new Error('Supported: #HEX, rgb(r,g,b), hsl(h,s%,l%)');
          }

          const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
          const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255;
          const l = (max+min)/2;
          let s = 0, h = 0;
          if (max !== min) {
            const d = max-min;
            s = l > 0.5 ? d/(2-max-min) : d/(max+min);
            if (max === r/255) h = ((g/255-b/255)/d + (g<b?6:0))*60;
            else if (max === g/255) h = ((b/255-r/255)/d + 2)*60;
            else h = ((r/255-g/255)/d + 4)*60;
          }

          return `HEX:  ${hex}\nRGB:  rgb(${r}, ${g}, ${b})\nHSL:  hsl(${Math.round(h)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
        },
      };

    default:
      return {
        fields: [
          { key: 'input', labels: { en: 'Input', 'zh-CN': '输入', 'zh-TW': '輸入', ja: '入力' }, type: 'textarea' },
        ],
        defaults: { input: '' },
        generate: (p) => p.input || 'No input provided',
      };
  }
}

const CODE128_PATTERNS = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112',
];

function createCode128Svg(text: string, height: number) {
  const codes = [104, ...Array.from(text).map((char) => char.charCodeAt(0) - 32)];
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) checksum += codes[i] * i;
  codes.push(checksum % 103, 106);

  const quiet = 10;
  const moduleWidth = 2;
  const barHeight = height;
  const labelHeight = 24;
  const modules = codes.reduce((sum, code) => sum + CODE128_PATTERNS[code].split('').reduce((a, n) => a + Number(n), 0), 0);
  const width = (modules + quiet * 2) * moduleWidth;
  let x = quiet * moduleWidth;
  const bars: string[] = [];

  for (const code of codes) {
    let drawBar = true;
    for (const part of CODE128_PATTERNS[code]) {
      const w = Number(part) * moduleWidth;
      if (drawBar) bars.push(`<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="#111827"/>`);
      x += w;
      drawBar = !drawBar;
    }
  }

  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${barHeight + labelHeight}" viewBox="0 0 ${width} ${barHeight + labelHeight}" role="img" aria-label="Code 128 barcode"><rect width="100%" height="100%" fill="#fff"/>${bars.join('')}<text x="${width / 2}" y="${barHeight + 17}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#111827">${escapedText}</text></svg>`;
}
