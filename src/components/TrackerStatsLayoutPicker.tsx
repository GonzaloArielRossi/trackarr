import { CardsThree, GridFour, List } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import type { TrackerStatsLayout } from '@/lib/tracker-stats-layout';

interface TrackerStatsLayoutPickerProps {
  value: TrackerStatsLayout;
  onChange: (layout: TrackerStatsLayout) => void;
}

const modes: { id: TrackerStatsLayout; Icon: typeof GridFour }[] = [
  { id: 'strip', Icon: CardsThree },
  { id: 'grid', Icon: GridFour },
  { id: 'list', Icon: List },
];

export default function TrackerStatsLayoutPicker({ value, onChange }: TrackerStatsLayoutPickerProps) {
  const { t } = useTranslation();

  return (
    <div
      className="inline-flex shrink-0 rounded-lg border border-surface-600 bg-surface-800/90 p-0.5 shadow-sm"
      role="radiogroup"
      aria-label={t('stats.layoutAria')}
    >
      {modes.map(({ id, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(`stats.layout.${id}`)}
            onClick={() => onChange(id)}
            className={`rounded-md px-2 py-1.5 transition-colors ${
              active
                ? 'bg-accent-500/20 text-accent-300 shadow-sm'
                : 'text-gray-500 hover:bg-surface-700/80 hover:text-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" weight={active ? 'bold' : 'regular'} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
