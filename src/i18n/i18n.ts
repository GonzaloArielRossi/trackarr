import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

const STORAGE_KEY = 'trackarr-lang';

export const SUPPORTED_LANGS = ['es', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function getStoredLng(): SupportedLang | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'es' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  return undefined;
}

export function persistLang(lng: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lng;
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: getStoredLng() ?? 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  persistLang(lng);
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export default i18n;
