import { useState } from 'react';
import JSEncrypt from 'jsencrypt';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const i18n: Record<string, Record<string, string>> = {
  en: {
    generateKeys: 'Generate Key Pair',
    keySize: 'Key Size',
    publicKey: 'Public Key (PEM)',
    privateKey: 'Private Key (PEM)',
    publicKeyPlaceholder: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
    privateKeyPlaceholder: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----',
    inputText: 'Input Text',
    outputText: 'Output Text',
    encrypt: 'Encrypt (Public Key)',
    decrypt: 'Decrypt (Private Key)',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    generating: 'Generating…',
    encryptError: 'Encryption failed. Check your public key and input.',
    decryptError: 'Decryption failed. Check your private key and ciphertext.',
    keyGenError: 'Key generation failed.',
    inputPlaceholder: 'Enter text to encrypt…',
    outputPlaceholder: 'Result will appear here…',
    ciphertextPlaceholder: 'Enter Base64 ciphertext to decrypt…',
    padding: 'Padding',
    mode: 'Mode',
    modeEncrypt: 'Encrypt',
    modeDecrypt: 'Decrypt',
    encoding: 'Encoding',
  },
  'zh-CN': {
    generateKeys: '生成密钥对',
    keySize: '密钥长度',
    publicKey: '公钥（PEM 格式）',
    privateKey: '私钥（PEM 格式）',
    publicKeyPlaceholder: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
    privateKeyPlaceholder: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----',
    inputText: '输入文本',
    outputText: '输出结果',
    encrypt: '公钥加密',
    decrypt: '私钥解密',
    copy: '复制',
    copied: '已复制',
    clear: '清空',
    generating: '生成中…',
    encryptError: '加密失败，请检查公钥和输入内容。',
    decryptError: '解密失败，请检查私钥和密文。',
    keyGenError: '密钥生成失败。',
    inputPlaceholder: '请输入要加密的文本…',
    outputPlaceholder: '结果将显示在这里…',
    ciphertextPlaceholder: '请输入 Base64 格式的密文以解密…',
    padding: '填充方式',
    mode: '操作模式',
    modeEncrypt: '加密',
    modeDecrypt: '解密',
    encoding: '编码',
  },
  'zh-TW': {
    generateKeys: '生成金鑰對',
    keySize: '金鑰長度',
    publicKey: '公鑰（PEM 格式）',
    privateKey: '私鑰（PEM 格式）',
    publicKeyPlaceholder: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
    privateKeyPlaceholder: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----',
    inputText: '輸入文字',
    outputText: '輸出結果',
    encrypt: '公鑰加密',
    decrypt: '私鑰解密',
    copy: '複製',
    copied: '已複製',
    clear: '清除',
    generating: '生成中…',
    encryptError: '加密失敗，請確認公鑰和輸入內容。',
    decryptError: '解密失敗，請確認私鑰和密文。',
    keyGenError: '金鑰生成失敗。',
    inputPlaceholder: '請輸入要加密的文字…',
    outputPlaceholder: '結果將顯示在此處…',
    ciphertextPlaceholder: '請輸入 Base64 格式的密文以解密…',
    padding: '填充方式',
    mode: '操作模式',
    modeEncrypt: '加密',
    modeDecrypt: '解密',
    encoding: '編碼',
  },
  ja: {
    generateKeys: '鍵ペアを生成',
    keySize: '鍵長',
    publicKey: '公開鍵（PEM形式）',
    privateKey: '秘密鍵（PEM形式）',
    publicKeyPlaceholder: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
    privateKeyPlaceholder: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----',
    inputText: '入力テキスト',
    outputText: '出力結果',
    encrypt: '公開鍵で暗号化',
    decrypt: '秘密鍵で復号',
    copy: 'コピー',
    copied: 'コピー済み',
    clear: 'クリア',
    generating: '生成中…',
    encryptError: '暗号化に失敗しました。公開鍵と入力を確認してください。',
    decryptError: '復号に失敗しました。秘密鍵と暗号文を確認してください。',
    keyGenError: '鍵の生成に失敗しました。',
    inputPlaceholder: '暗号化するテキストを入力…',
    outputPlaceholder: '結果がここに表示されます…',
    ciphertextPlaceholder: 'Base64形式の暗号文を入力して復号…',
    padding: 'パディング',
    mode: '操作モード',
    modeEncrypt: '暗号化',
    modeDecrypt: '復号',
    encoding: 'エンコード',
  },
};

type Mode = 'encrypt' | 'decrypt';
type KeySize = 1024 | 2048 | 4096;

export default function RsaEncryptDecryptTool({ slug, locale }: Props) {
  const t = i18n[locale] || i18n.en;
  const [mode, setMode] = useState<Mode>('encrypt');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [keySize, setKeySize] = useState<KeySize>(2048);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '16px',
  };
  const label: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '6px',
  };
  const textarea: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.82rem',
    fontFamily: 'monospace',
    color: 'var(--color-text)',
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
  };
  const btn: React.CSSProperties = {
    padding: '0.5rem 1.2rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 500,
  };
  const btnPrimary: React.CSSProperties = {
    ...btn,
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
  };
  const btnOrange: React.CSSProperties = {
    ...btn,
    background: '#f97316',
    color: '#fff',
    border: 'none',
  };

  const generateKeyPair = () => {
    setGenerating(true);
    setError('');
    // Run in next tick so UI updates first
    setTimeout(() => {
      try {
        const crypt = new JSEncrypt({ default_key_size: String(keySize) } as any);
        crypt.getKey();
        const pub = crypt.getPublicKey();
        const priv = crypt.getPrivateKey();
        if (!pub || !priv) throw new Error('empty');
        setPublicKey(pub);
        setPrivateKey(priv);
      } catch {
        setError(t.keyGenError);
      } finally {
        setGenerating(false);
      }
    }, 10);
  };

  const doEncrypt = () => {
    setError('');
    setOutput('');
    if (!publicKey.trim()) { setError(t.encryptError); return; }
    try {
      const crypt = new JSEncrypt();
      crypt.setPublicKey(publicKey);
      const result = crypt.encrypt(input);
      if (!result) throw new Error('failed');
      setOutput(result);
      (window as any).__trackToolUsed?.(slug);
    } catch {
      setError(t.encryptError);
    }
  };

  const doDecrypt = () => {
    setError('');
    setOutput('');
    if (!privateKey.trim()) { setError(t.decryptError); return; }
    try {
      const crypt = new JSEncrypt();
      crypt.setPrivateKey(privateKey);
      const result = crypt.decrypt(input);
      if (!result) throw new Error('failed');
      setOutput(result);
      (window as any).__trackToolUsed?.(slug);
    } catch {
      setError(t.decryptError);
    }
  };

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Key Generator */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {t.keySize}:
          </span>
          {([1024, 2048, 4096] as KeySize[]).map((s) => (
            <button key={s} onClick={() => setKeySize(s)} style={{
              ...btn,
              background: keySize === s ? 'var(--color-primary)' : 'var(--color-card-bg)',
              color: keySize === s ? '#fff' : 'var(--color-text)',
              border: keySize === s ? 'none' : '1px solid var(--color-border)',
              padding: '0.35rem 0.9rem',
            }}>
              {s} bit
            </button>
          ))}
          <button onClick={generateKeyPair} disabled={generating} style={{
            ...btnPrimary,
            opacity: generating ? 0.7 : 1,
            marginLeft: 'auto',
          }}>
            {generating ? t.generating : t.generateKeys}
          </button>
        </div>
      </div>

      {/* Keys */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={card}>
          <label style={label}>{t.publicKey}</label>
          <textarea
            rows={6}
            style={textarea}
            placeholder={t.publicKeyPlaceholder}
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
          />
        </div>
        <div style={card}>
          <label style={label}>{t.privateKey}</label>
          <textarea
            rows={6}
            style={textarea}
            placeholder={t.privateKeyPlaceholder}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t.mode}:</span>
        {(['encrypt', 'decrypt'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setInput(''); setOutput(''); setError(''); }} style={{
            ...btn,
            background: mode === m ? 'var(--color-primary)' : 'var(--color-card-bg)',
            color: mode === m ? '#fff' : 'var(--color-text)',
            border: mode === m ? 'none' : '1px solid var(--color-border)',
          }}>
            {m === 'encrypt' ? t.modeEncrypt : t.modeDecrypt}
          </button>
        ))}
      </div>

      {/* Input / Output */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ ...label, margin: 0 }}>{t.inputText}</label>
            <button style={{ ...btn, padding: '0.2rem 0.7rem', fontSize: '0.75rem' }} onClick={() => { setInput(''); setOutput(''); setError(''); }}>{t.clear}</button>
          </div>
          <textarea
            rows={8}
            style={textarea}
            placeholder={mode === 'encrypt' ? t.inputPlaceholder : t.ciphertextPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div style={{ marginTop: '10px' }}>
            {mode === 'encrypt' ? (
              <button onClick={doEncrypt} style={btnPrimary}>{t.encrypt}</button>
            ) : (
              <button onClick={doDecrypt} style={btnOrange}>{t.decrypt}</button>
            )}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ ...label, margin: 0 }}>{t.outputText}</label>
            <button style={{ ...btn, padding: '0.2rem 0.7rem', fontSize: '0.75rem' }} onClick={copyOutput}>
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <textarea
            rows={8}
            style={{ ...textarea, resize: 'none' }}
            readOnly
            placeholder={t.outputPlaceholder}
            value={output}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
