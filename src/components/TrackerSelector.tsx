import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { TrackerRegistryEntry } from '@/lib/types';
import { defaultNameFromUrl, tryNormalizeTrackerUrl } from '@/lib/tracker-url';
import TrackerIcon from './TrackerIcon';

interface TrackerSelectorProps {
  registry: TrackerRegistryEntry[];
  selected: TrackerRegistryEntry | null;
  onSelect: (entry: TrackerRegistryEntry | null) => void;
  /** Called when the user confirms a base URL that is not in the registry. */
  onUseUrl: (normalizedUrl: string) => void;
  /** When the add dialog opens, reset the search field. */
  dialogOpen: boolean;
}

function basesMatch(a: string, b: string): boolean {
  return a.replace(/\/+$/, '').toLowerCase() === b.replace(/\/+$/, '').toLowerCase();
}

export default function TrackerSelector({ registry, onSelect, onUseUrl, selected, dialogOpen }: TrackerSelectorProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncingFromSelect = useRef(false);
  const prevDialogOpen = useRef(dialogOpen);

  const q = query.trim().toLowerCase();
  const filtered = registry.filter(
    (tr) => tr.name.toLowerCase().includes(q) || tr.baseUrl.toLowerCase().includes(q),
  );

  const normalizedUrl = tryNormalizeTrackerUrl(query);
  const registryHasUrl =
    normalizedUrl != null &&
    registry.some((tr) => basesMatch(tr.baseUrl, normalizedUrl));
  const showCreateRow = normalizedUrl != null && !registryHasUrl;

  useEffect(() => {
    if (dialogOpen && !prevDialogOpen.current) {
      setQuery('');
      setListOpen(false);
    }
    prevDialogOpen.current = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    if (selected) {
      syncingFromSelect.current = true;
      setQuery(selected.name);
      queueMicrotask(() => {
        syncingFromSelect.current = false;
      });
    }
  }, [selected]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setListOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleQueryChange(v: string) {
    setQuery(v);
    setListOpen(true);
    if (syncingFromSelect.current) return;
    if (selected) onSelect(null);
  }

  function pickEntry(entry: TrackerRegistryEntry) {
    syncingFromSelect.current = true;
    onSelect(entry);
    setQuery(entry.name);
    setListOpen(false);
    queueMicrotask(() => {
      syncingFromSelect.current = false;
    });
  }

  function pickCreateUrl() {
    if (!normalizedUrl) return;
    onUseUrl(normalizedUrl);
    setQuery(defaultNameFromUrl(normalizedUrl));
    setListOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (filtered.length === 1) {
      pickEntry(filtered[0]);
      return;
    }
    if (showCreateRow) {
      pickCreateUrl();
      return;
    }
    if (filtered.length > 0) {
      pickEntry(filtered[0]);
    }
  }

  const showNoMatches = query.trim() !== '' && filtered.length === 0 && !showCreateRow;

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-300">{t('selector.searchOrUrl')}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => setListOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t('selector.searchOrUrlPlaceholder')}
        autoComplete="off"
        className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
      />

      {listOpen && query.trim() !== '' && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl">
          {filtered.map((entry) => (
            <button
              key={entry.baseUrl}
              type="button"
              onClick={() => pickEntry(entry)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-surface-700"
            >
              <TrackerIcon name={entry.name} iconId={entry.icon} size={20} />
              <div className="min-w-0">
                <span className="block truncate font-medium">{entry.name}</span>
                <span className="block truncate text-xs text-gray-500">{entry.baseUrl}</span>
              </div>
            </button>
          ))}

          {showCreateRow && (
            <button
              type="button"
              onClick={pickCreateUrl}
              className={`w-full text-left text-sm text-accent-400 hover:bg-surface-700 ${
                filtered.length > 0 ? 'border-t border-surface-700' : ''
              } px-3 py-2.5`}
            >
              {t('selector.createWithUrl', { url: normalizedUrl })}
            </button>
          )}

          {showNoMatches && <p className="px-3 py-2 text-xs text-gray-500">{t('selector.noMatches')}</p>}
        </div>
      )}
    </div>
  );
}
