import { useEffect, useState } from 'react';

import { BADGE_PALETTE_COUNT, BADGE_PALETTES, defaultBadgeColors, type IconBadgeColors } from '@/lib/icon-colors';

function getInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return '?';
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function lettersFromAlias(alias: string | undefined): string | null {
  if (!alias) return null;
  const s = alias.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  if (s.length >= 2) return s;
  return null;
}

function resolveColors(
  name: string,
  iconPaletteIndex: number | undefined,
  override?: IconBadgeColors,
): IconBadgeColors {
  if (override) return override;
  if (
    iconPaletteIndex != null &&
    iconPaletteIndex >= 0 &&
    iconPaletteIndex < BADGE_PALETTE_COUNT
  ) {
    return BADGE_PALETTES[iconPaletteIndex];
  }
  return defaultBadgeColors(name);
}

interface TrackerIconProps {
  name: string;
  iconId: string;
  iconAlias?: string;
  /** Index into BADGE_PALETTES; if unset, colors derive from name. */
  iconPaletteIndex?: number;
  size?: number;
  className?: string;
}

export default function TrackerIcon({
  name,
  iconId,
  iconAlias,
  iconPaletteIndex,
  size = 32,
  className = '',
}: TrackerIconProps) {
  const [staticIconFailed, setStaticIconFailed] = useState(false);
  const wantsStatic = Boolean(iconId && iconId !== 'generic' && !staticIconFailed);

  useEffect(() => {
    setStaticIconFailed(false);
  }, [iconId]);

  if (wantsStatic) {
    return (
      <img
        src={`/icons/${iconId}.svg`}
        alt={name}
        width={size}
        height={size}
        className={`block shrink-0 rounded-md ${className}`}
        draggable={false}
        onError={() => setStaticIconFailed(true)}
      />
    );
  }

  return (
    <GeneratedIcon
      name={name}
      iconAlias={iconAlias}
      paletteIndex={iconPaletteIndex}
      size={size}
      className={`shrink-0 ${className}`}
    />
  );
}

export function GeneratedIcon({
  name,
  iconAlias,
  paletteIndex,
  badgeColors,
  size = 32,
  className = '',
}: {
  name: string;
  iconAlias?: string;
  /** Prefer explicit palette index (0–19). */
  paletteIndex?: number;
  /** Rare override (e.g. previews). */
  badgeColors?: IconBadgeColors;
  size?: number;
  className?: string;
}) {
  const color = resolveColors(name, paletteIndex, badgeColors);
  const letters = lettersFromAlias(iconAlias) ?? getInitials(name);
  const fontScale = letters.length > 2 ? 0.32 : 0.38;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={`block shrink-0 rounded-md ${className}`}
      aria-hidden
    >
      <rect width="40" height="40" rx="8" fill={color.bg} />
      <text
        x="20"
        y="26"
        fontFamily="sans-serif"
        fontSize={40 * fontScale * (size / 32)}
        fontWeight="700"
        fill={color.fg}
        textAnchor="middle"
      >
        {letters}
      </text>
    </svg>
  );
}
