import { useState, useRef, useCallback } from 'react';

interface Props { slug: string; apiType: string; apiEndpoint: string; locale: string; }

const API_BASE = import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl';

const i18n: Record<string, Record<string, string>> = {
  en: {
    uploadLabel: 'Click or drag a video file here',
    supported: 'Supported: .wmv .avi .mov .mkv .flv .webm .3gp .mpg .m4v .ts .mts',
    fileChosen: 'Selected:',
    options: 'Conversion Options',
    vcodec: 'Video Codec',
    vcodecH264: 'H.264 (widely compatible)',
    vcodecH265: 'H.265 / HEVC (smaller file)',
    quality: 'Quality (CRF)',
    qualityHint: 'Lower = better quality & larger file',
    preset: 'Speed Preset',
    audio: 'Audio',
    audioCopy: 'Copy original audio (no re-encode)',
    audioBitrate: 'Audio Bitrate',
    resFps: 'Resolution / FPS',
    keepOriginal: 'Keep original resolution & FPS',
    resolution: 'Resolution',
    fps: 'Frame Rate',
    faststart: 'Web optimized (faststart)',
    start: 'Convert',
    clear: 'Clear',
    noFile: 'Please select a video file first.',
    progress: 'Progress',
    result: 'Result',
    statusWaiting: 'Waiting…',
    statusProcessing: 'Converting…',
    statusFinished: 'Conversion complete!',
    statusFailed: 'Conversion failed.',
    download: 'Download MP4',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    tipLarge: 'Files >25 MB are processed asynchronously — please wait.',
    uploading: 'Uploading…',
    error: 'Error',
  },
  'zh-CN': {
    uploadLabel: '点击或拖拽视频文件到此处',
    supported: '支持: .wmv .avi .mov .mkv .flv .webm .3gp .mpg .m4v .ts .mts',
    fileChosen: '已选择:',
    options: '转换选项',
    vcodec: '视频编码',
    vcodecH264: 'H.264（兼容性最佳）',
    vcodecH265: 'H.265 / HEVC（体积更小）',
    quality: '画质（CRF）',
    qualityHint: '数值越小画质越高，文件越大',
    preset: '编码速度',
    audio: '音频',
    audioCopy: '保留原始音频（不重新编码）',
    audioBitrate: '音频码率',
    resFps: '分辨率 / 帧率',
    keepOriginal: '保持原始分辨率和帧率',
    resolution: '分辨率',
    fps: '帧率',
    faststart: '网页优化（faststart）',
    start: '开始转换',
    clear: '清空',
    noFile: '请先选择视频文件。',
    progress: '转换进度',
    result: '转换结果',
    statusWaiting: '等待中…',
    statusProcessing: '转换中…',
    statusFinished: '转换完成！',
    statusFailed: '转换失败。',
    download: '下载 MP4',
    copyLink: '复制链接',
    copied: '已复制！',
    tipLarge: '大于 25 MB 的文件将异步处理，请稍候。',
    uploading: '上传中…',
    error: '出错',
  },
  'zh-TW': {
    uploadLabel: '點擊或拖曳影片檔到此處',
    supported: '支援: .wmv .avi .mov .mkv .flv .webm .3gp .mpg .m4v .ts .mts',
    fileChosen: '已選擇:',
    options: '轉換選項',
    vcodec: '視訊編碼',
    vcodecH264: 'H.264（相容性最佳）',
    vcodecH265: 'H.265 / HEVC（檔案更小）',
    quality: '畫質（CRF）',
    qualityHint: '數值越小畫質越高，檔案越大',
    preset: '編碼速度',
    audio: '音訊',
    audioCopy: '保留原始音訊（不重新編碼）',
    audioBitrate: '音訊位元率',
    resFps: '解析度 / 幀率',
    keepOriginal: '保持原始解析度和幀率',
    resolution: '解析度',
    fps: '幀率',
    faststart: '網頁最佳化（faststart）',
    start: '開始轉換',
    clear: '清除',
    noFile: '請先選擇影片檔。',
    progress: '轉換進度',
    result: '轉換結果',
    statusWaiting: '等待中…',
    statusProcessing: '轉換中…',
    statusFinished: '轉換完成！',
    statusFailed: '轉換失敗。',
    download: '下載 MP4',
    copyLink: '複製連結',
    copied: '已複製！',
    tipLarge: '大於 25 MB 的檔案將非同步處理，請稍候。',
    uploading: '上傳中…',
    error: '錯誤',
  },
  ja: {
    uploadLabel: 'クリックまたは動画ファイルをドラッグ',
    supported: '対応形式: .wmv .avi .mov .mkv .flv .webm .3gp .mpg .m4v .ts .mts',
    fileChosen: '選択済み:',
    options: '変換オプション',
    vcodec: '映像コーデック',
    vcodecH264: 'H.264（互換性重視）',
    vcodecH265: 'H.265 / HEVC（ファイル小）',
    quality: '画質（CRF）',
    qualityHint: '値が小さいほど高画質・大ファイル',
    preset: 'エンコード速度',
    audio: '音声',
    audioCopy: '元の音声をコピー（再エンコードなし）',
    audioBitrate: '音声ビットレート',
    resFps: '解像度 / フレームレート',
    keepOriginal: '元の解像度・FPS を保持',
    resolution: '解像度',
    fps: 'フレームレート',
    faststart: 'ウェブ最適化（faststart）',
    start: '変換開始',
    clear: 'クリア',
    noFile: 'まず動画ファイルを選択してください。',
    progress: '変換進捗',
    result: '変換結果',
    statusWaiting: '待機中…',
    statusProcessing: '変換中…',
    statusFinished: '変換完了！',
    statusFailed: '変換失敗。',
    download: 'MP4 をダウンロード',
    copyLink: 'リンクをコピー',
    copied: 'コピーしました！',
    tipLarge: '25 MB 超のファイルは非同期処理されます。',
    uploading: 'アップロード中…',
    error: 'エラー',
  },
};

function formatBytes(b: number) {
  if (!b) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / 1024 ** i).toFixed(2) + ' ' + units[i];
}

export default function VideoConverterTool({ slug, apiEndpoint, locale }: Props) {
  const t = i18n[locale] || i18n.en;

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  // Options
  const [vcodec, setVcodec] = useState('libx264');
  const [crf, setCrf] = useState(22);
  const [preset, setPreset] = useState('medium');
  const [audioCopy, setAudioCopy] = useState(true);
  const [audioBitrate, setAudioBitrate] = useState(128);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [resolution, setResolution] = useState('orig');
  const [fps, setFps] = useState('orig');
  const [faststart, setFaststart] = useState(true);

  // State
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setStatus('');
    setDownloadUrl('');
    setCopied(false);
    setConverting(false);
    setError('');
    if (pollRef.current) clearTimeout(pollRef.current);
  };

  const handleFile = (f: File) => {
    reset();
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const pollJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`${API_BASE}${apiEndpoint}jobs/${jobId}`);
      const data = await res.json();
      if (data.status === 'finished' && data.download_url) {
        setProgress(100);
        setStatus(t.statusFinished);
        setDownloadUrl(data.download_url);
        setConverting(false);
      } else if (data.status === 'failed') {
        setStatus(t.statusFailed);
        setError(data.message || t.statusFailed);
        setConverting(false);
      } else {
        setStatus(t.statusProcessing);
        pollRef.current = setTimeout(() => pollJob(jobId), 1500);
      }
    } catch {
      pollRef.current = setTimeout(() => pollJob(jobId), 2000);
    }
  }, [apiEndpoint, t]);

  const convert = () => {
    if (!file) { setError(t.noFile); return; }
    reset();
    setFile(file);
    setConverting(true);
    setStatus(t.uploading);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('target_format', 'mp4');
    fd.append('vcodec', vcodec);
    fd.append('crf', String(crf));
    fd.append('preset', preset);
    fd.append('audio_copy', audioCopy ? '1' : '0');
    fd.append('audio_bitrate', String(audioBitrate));
    fd.append('faststart', faststart ? '1' : '0');
    fd.append('resolution', keepOriginal ? 'orig' : resolution);
    fd.append('fps', keepOriginal ? 'orig' : fps);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round(e.loaded * 90 / e.total));
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.download_url) {
            setProgress(100);
            setStatus(t.statusFinished);
            setDownloadUrl(data.download_url);
            setConverting(false);
            (window as any).__trackToolUsed?.(slug);
          } else if (data.job_id) {
            setProgress(90);
            setStatus(t.statusWaiting);
            pollJob(data.job_id);
          } else {
            setError(data.message || t.statusFailed);
            setConverting(false);
          }
        } catch {
          setError(t.error);
          setConverting(false);
        }
      } else {
        try {
          const d = JSON.parse(xhr.responseText);
          setError(d.detail || d.message || `HTTP ${xhr.status}`);
        } catch { setError(`HTTP ${xhr.status}`); }
        setConverting(false);
      }
    };
    xhr.open('POST', `${API_BASE}${apiEndpoint}convert`, true);
    xhr.send(fd);
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'tool.tl-converted.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  const copyLink = async () => {
    if (!downloadUrl) return;
    await navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '16px',
  };
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0',
  };
  const label: React.CSSProperties = {
    minWidth: '140px', fontSize: '0.85rem', color: 'var(--color-text)', flexShrink: 0,
  };
  const ctrl: React.CSSProperties = {
    flex: 1, padding: '7px 10px', border: '1px solid var(--color-border)',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    borderRadius: '8px', fontSize: '0.85rem',
  };
  const pill: React.CSSProperties = {
    padding: '0.55rem 1.25rem', borderRadius: '999px', border: '1px solid var(--color-border)',
    background: 'var(--color-card-bg)', color: 'var(--color-text)',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
  };
  const pillPrimary: React.CSSProperties = {
    ...pill, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600,
  };
  const pillSuccess: React.CSSProperties = {
    ...pill, background: '#16a34a', color: '#fff', border: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '14px', padding: '2rem', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(59,130,246,0.06)' : 'var(--color-card-bg)',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <input
          ref={inputRef} type="file"
          accept=".wmv,.avi,.mov,.mkv,.flv,.webm,.3gp,.mts,.m2ts,.ts,.mpg,.mpeg,.m4v,video/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>
          {t.uploadLabel}
        </p>
        <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
          {t.supported}
        </p>
        {file && (
          <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>
            {t.fileChosen} {file.name} ({formatBytes(file.size)})
          </p>
        )}
      </div>

      {/* Grid: options + progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: '14px' }}>
        {/* Options */}
        <div style={card}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
            {t.options}
          </p>

          <div style={row}>
            <span style={label}>{t.vcodec}</span>
            <select value={vcodec} onChange={(e) => setVcodec(e.target.value)} style={ctrl}>
              <option value="libx264">{t.vcodecH264}</option>
              <option value="libx265">{t.vcodecH265}</option>
            </select>
          </div>

          <div style={row}>
            <span style={label}>{t.quality}</span>
            <input type="range" min={16} max={30} step={1} value={crf}
              onChange={(e) => setCrf(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--color-primary)' }} />
            <span style={{ minWidth: '28px', textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text)' }}>{crf}</span>
          </div>
          <p style={{ margin: '-6px 0 8px 152px', fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{t.qualityHint}</p>

          <div style={row}>
            <span style={label}>{t.preset}</span>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} style={ctrl}>
              {['veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div style={row}>
            <span style={label}>{t.audio}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={audioCopy} onChange={(e) => setAudioCopy(e.target.checked)} />
              {t.audioCopy}
            </label>
          </div>

          {!audioCopy && (
            <div style={row}>
              <span style={label}>{t.audioBitrate}</span>
              <input type="number" min={64} max={320} step={16} value={audioBitrate}
                onChange={(e) => setAudioBitrate(Number(e.target.value))}
                style={{ ...ctrl, maxWidth: '90px' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Kbps</span>
            </div>
          )}

          <div style={row}>
            <span style={label}>{t.resFps}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} />
              {t.keepOriginal}
            </label>
          </div>

          {!keepOriginal && (
            <>
              <div style={row}>
                <span style={label}>{t.resolution}</span>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={ctrl}>
                  <option value="orig">Original</option>
                  <option value="1080p">1920×1080</option>
                  <option value="720p">1280×720</option>
                  <option value="480p">854×480</option>
                  <option value="360p">640×360</option>
                </select>
              </div>
              <div style={row}>
                <span style={label}>{t.fps}</span>
                <select value={fps} onChange={(e) => setFps(e.target.value)} style={ctrl}>
                  <option value="orig">Original</option>
                  {['60', '50', '30', '25', '24'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </>
          )}

          <div style={row}>
            <span style={label}></span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={faststart} onChange={(e) => setFaststart(e.target.checked)} />
              {t.faststart}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button style={{ ...pillPrimary, flex: 1, textAlign: 'center' }}
              onClick={convert} disabled={converting}>
              {converting ? status || t.uploading : t.start}
            </button>
            <button style={{ ...pill, flex: 'none' }} onClick={reset}>{t.clear}</button>
          </div>

          <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.tipLarge}</p>
        </div>

        {/* Progress + Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={card}>
            <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              {t.progress}
            </p>
            <div style={{ height: '14px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'var(--color-primary)', transition: 'width 0.4s ease',
              }} />
            </div>
            {status && (
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{status}</p>
            )}
            {error && (
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#ef4444' }}>{t.error}: {error}</p>
            )}
          </div>

          <div style={card}>
            <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              {t.result}
            </p>
            {downloadUrl ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative' }}>
                <button style={pillPrimary} onClick={handleDownload}>
                  {t.download}
                </button>
                <div style={{ position: 'relative' }}>
                  <button style={copied ? pillSuccess : pill} onClick={copyLink}>
                    {copied ? t.copied : t.copyLink}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
