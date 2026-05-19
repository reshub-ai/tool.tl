import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'theme';

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme): void {
  const isDark =
    theme === 'dark' || (theme === 'system' && getSystemPrefersDark());
  document.documentElement.classList.toggle('dark', isDark);
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'system';
}

function storeTheme(theme: Theme): void {
  try {
    if (theme === 'system') {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    // localStorage unavailable
  }
}

const icons: Record<Theme, string> = {
  light: '\u2600\uFE0F',
  dark: '\uD83C\uDF19',
  system: '\uD83D\uDCBB',
};

const labels: Record<Theme, string> = {
  light: 'Light mode (click for dark)',
  dark: 'Dark mode (click for system)',
  system: 'System mode (click for light)',
};

const cycle: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = cycle[prev];
      storeTheme(next);
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={labels[theme]}
      style={{
        minWidth: 44,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--color-border, #ccc)',
        borderRadius: 8,
        background: 'var(--color-card-bg, transparent)',
        color: 'var(--color-text, inherit)',
        cursor: 'pointer',
        fontSize: 20,
        lineHeight: 1,
        padding: 0,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {icons[theme]}
    </button>
  );
}
