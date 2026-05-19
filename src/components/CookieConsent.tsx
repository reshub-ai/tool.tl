import { useState, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  locale: string;
  privacyPath: string;
}

/* ------------------------------------------------------------------ */
/*  Translations                                                       */
/* ------------------------------------------------------------------ */

interface Strings {
  message: string;
  accept: string;
  reject: string;
  learnMore: string;
}

const translations: Record<string, Strings> = {
  en: {
    message:
      'We use cookies to improve your experience and serve personalized ads.',
    accept: 'Accept',
    reject: 'Reject',
    learnMore: 'Learn More',
  },
  zh: {
    message: '我们使用 Cookie 来改善您的体验并提供个性化广告。',
    accept: '接受',
    reject: '拒绝',
    learnMore: '了解更多',
  },
  ja: {
    message:
      '当サイトでは、体験の向上とパーソナライズ広告の配信のためにCookieを使用しています。',
    accept: '同意',
    reject: '拒否',
    learnMore: '詳細',
  },
  ko: {
    message:
      '우리는 경험 개선과 맞춤형 광고 제공을 위해 쿠키를 사용합니다.',
    accept: '동의',
    reject: '거부',
    learnMore: '자세히',
  },
  es: {
    message:
      'Usamos cookies para mejorar su experiencia y mostrar anuncios personalizados.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    learnMore: 'M\u00e1s informaci\u00f3n',
  },
  fr: {
    message:
      'Nous utilisons des cookies pour am\u00e9liorer votre exp\u00e9rience et diffuser des publicit\u00e9s personnalis\u00e9es.',
    accept: 'Accepter',
    reject: 'Refuser',
    learnMore: 'En savoir plus',
  },
  de: {
    message:
      'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern und personalisierte Werbung bereitzustellen.',
    accept: 'Akzeptieren',
    reject: 'Ablehnen',
    learnMore: 'Mehr erfahren',
  },
  pt: {
    message:
      'Usamos cookies para melhorar sua experi\u00eancia e exibir an\u00fancios personalizados.',
    accept: 'Aceitar',
    reject: 'Rejeitar',
    learnMore: 'Saiba mais',
  },
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'cookie-consent';

const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 9998,
  padding: '16px 24px',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  background: 'var(--color-card-bg, #fff)',
  color: 'var(--color-text, #111)',
  borderTop: '1px solid var(--color-border, #ddd)',
  boxShadow: '0 -2px 12px rgba(0,0,0,0.1)',
  fontSize: 14,
  lineHeight: 1.5,
};

const messageStyle: React.CSSProperties = {
  flex: '1 1 400px',
  textAlign: 'center',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexShrink: 0,
};

const acceptBtnStyle: React.CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  padding: '10px 24px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-primary, #4f46e5)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const rejectBtnStyle: React.CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  padding: '10px 24px',
  border: '1px solid var(--color-border, #ccc)',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--color-text, #111)',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--color-primary, #4f46e5)',
  textDecoration: 'underline',
  fontSize: 14,
  whiteSpace: 'nowrap',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CookieConsent({ locale, privacyPath }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val !== 'accepted' && val !== 'rejected') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // storage unavailable
    }
    setVisible(false);
  }, []);

  const reject = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'rejected');
    } catch {
      // storage unavailable
    }
    // Disable GA & AdSense cookies by setting opt-out
    try {
      (window as any)[`ga-disable-${(window as any).__GA_ID || ''}`] = true;
    } catch {
      // ignore
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  // Map locale variants to base language (zh-CN, zh-TW -> zh)
  const langBase = locale.startsWith('zh') ? 'zh' : locale;
  const t = translations[langBase] ?? translations[locale] ?? translations.en;

  return (
    <div style={bannerStyle} role="banner" aria-label="Cookie consent">
      <p style={messageStyle}>{t.message}</p>
      <div style={buttonGroupStyle}>
        <button type="button" onClick={accept} style={acceptBtnStyle}>
          {t.accept}
        </button>
        <button type="button" onClick={reject} style={rejectBtnStyle}>
          {t.reject}
        </button>
        <a href={privacyPath} style={linkStyle}>
          {t.learnMore}
        </a>
      </div>
    </div>
  );
}
