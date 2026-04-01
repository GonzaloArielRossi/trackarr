import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

const STORAGE_KEY = 'trackarr-lang';

export const SUPPORTED_LANGS = ['es', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function normalizeToSupported(raw: string | null | undefined): SupportedLang | undefined {
  if (raw == null || raw === '') return undefined;
  const base = raw.split('-')[0]!.toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as SupportedLang) : undefined;
}

function readStoredLang(): SupportedLang | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return normalizeToSupported(localStorage.getItem(STORAGE_KEY));
  } catch {
    return undefined;
  }
}

/** Writes the active UI language to localStorage (short code: es | en). */
export function persistLang(lng: string) {
  const code = normalizeToSupported(lng);
  if (!code) return;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = code;
  }
}

const initialLng = readStoredLang() ?? 'es';

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: initialLng,
    fallbackLng: 'es',
    supportedLngs: [...SUPPORTED_LANGS],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
  })
  .then(() => {
    persistLang(i18n.language);
  });

i18n.on('languageChanged', (lng) => {
  persistLang(lng);
});

export default i18n;
