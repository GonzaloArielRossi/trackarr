import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGS, type SupportedLang } from '@/i18n/i18n';

interface HeaderProps {
  onAddTracker: () => void;
  onManageTrackers?: () => void;
  trackerCount: number;
}

export default function Header({ onAddTracker, onManageTrackers, trackerCount }: HeaderProps) {
  const { t, i18n } = useTranslation();

  function setLang(lng: SupportedLang) {
    void i18n.changeLanguage(lng);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-700 bg-surface-800/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/logo.svg"
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 shrink-0 rounded-lg shadow-sm ring-1 ring-surface-600 sm:h-9 sm:w-9"
              draggable={false}
            />
            <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-white sm:text-xl">
              Track<span className="text-accent-400">arr</span>
            </h1>
            {trackerCount > 0 && (
              <span className="max-w-[40vw] shrink-0 truncate rounded-full bg-surface-600 px-2 py-0.5 text-[11px] font-medium text-gray-300 sm:max-w-none sm:px-2.5 sm:text-xs">
                {t('header.trackerCount', { count: trackerCount })}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            <div className="flex rounded-lg border border-surface-600 bg-surface-800 p-0.5">
              {SUPPORTED_LANGS.map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => setLang(lng)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    i18n.language.startsWith(lng)
                      ? 'bg-surface-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  aria-pressed={i18n.language.startsWith(lng)}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
            {onManageTrackers && (
              <button
                type="button"
                onClick={onManageTrackers}
                className="rounded-lg border border-surface-600 bg-surface-700 px-2.5 py-2 text-xs font-medium text-gray-200 transition-colors hover:border-surface-500 hover:bg-surface-600 sm:px-3 sm:text-sm"
              >
                {t('header.manage')}
              </button>
            )}
            <button
              type="button"
              onClick={onAddTracker}
              aria-label={t('header.addTracker')}
              className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-600 active:bg-accent-600/80 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              <span className="min-w-0 truncate">{t('header.addTracker')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
