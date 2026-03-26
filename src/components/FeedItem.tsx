import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import type { FeedTorrent } from '@/lib/types';
import { defaultPaletteIndex } from '@/lib/icon-colors';
import { feedPosterSrc, formatBytes, timeAgo } from '@/lib/format';
import { GeneratedIcon } from './TrackerIcon';

interface FeedItemProps {
  torrent: FeedTorrent;
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'accent' | 'warning' }) {
  const colors = {
    default: 'bg-surface-600/80 text-gray-300',
    success: 'bg-success-500/20 text-success-400',
    accent: 'bg-accent-500/20 text-accent-400',
    warning: 'bg-warning-500/20 text-warning-500',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${colors[variant]}`}>
      {children}
    </span>
  );
}

export default function FeedItem({ torrent }: FeedItemProps) {
  const { t } = useTranslation();
  const { attributes: a, tracker } = torrent;
  const [posterBroken, setPosterBroken] = useState(false);
  useEffect(() => {
    setPosterBroken(false);
  }, [torrent.id, a.meta.poster]);

  const freeleechPct = parseInt(a.freeleech);
  const isFreeleech = freeleechPct > 0;
  const isInternal = a.internal === 1;

  return (
    <a
      href={a.details_link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-700 bg-surface-800 transition-all hover:border-surface-500 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-700">
        {a.meta.poster && a.meta.poster !== 'https://via.placeholder.com/90x135' && !posterBroken ? (
          <img
            src={feedPosterSrc(a.meta.poster)}
            alt={a.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setPosterBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-surface-700 to-surface-800">
            <svg className="h-12 w-12 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Overlay badges - top */}
        <div className="absolute left-1.5 right-1.5 top-1.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 max-w-[min(100%,14rem)] items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
            <GeneratedIcon
              name={tracker.name}
              iconAlias={tracker.iconAlias}
              paletteIndex={tracker.iconPaletteIndex ?? defaultPaletteIndex(tracker.name)}
              size={20}
              className="shrink-0"
            />
            <span className="min-w-0 truncate text-[10px] font-bold text-white">{tracker.name}</span>
          </div>
          {isFreeleech && (
            <span className="rounded-md bg-success-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
              FL {a.freeleech}
            </span>
          )}
        </div>

        {/* Overlay badges - bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-6">
          <div className="flex items-center gap-2 text-[11px] text-gray-200">
            <span className="flex items-center gap-0.5">
              <ArrowUp size={12} weight="bold" className="text-success-400" />
              {a.seeders}
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowDown size={12} weight="bold" className="text-danger-400" />
              {a.leechers}
            </span>
            <span className="ml-auto text-[10px] text-gray-300">{formatBytes(a.size)}</span>
          </div>
        </div>

        {/* Status badges over poster */}
        {(a.double_upload || isInternal) && (
          <div className="absolute right-1.5 top-8 flex flex-col gap-1">
            {a.double_upload && (
              <span className="rounded-md bg-warning-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">2x</span>
            )}
            {isInternal && (
              <span className="rounded-md bg-accent-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">INT</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="mb-2 line-clamp-2 text-xs font-semibold leading-snug text-gray-100 group-hover:text-white">
          {a.name}
        </h3>
        <div className="mt-auto flex flex-wrap gap-1">
          <Badge>{a.category}</Badge>
          {a.type && <Badge>{a.type}</Badge>}
          {a.resolution && <Badge>{a.resolution}</Badge>}
        </div>
        <p className="mt-1.5 text-[10px] text-gray-500">{timeAgo(a.created_at, t)}</p>
      </div>
    </a>
  );
}
