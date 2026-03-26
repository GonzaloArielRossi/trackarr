/** Fixed badge palettes (bg + letter color). Exactly 20 options. */
export const BADGE_PALETTES = [
  { bg: '#1a1a2e', fg: '#e94560' },
  { bg: '#0a1929', fg: '#2196f3' },
  { bg: '#1b1b2f', fg: '#ff6b35' },
  { bg: '#1a0a2e', fg: '#b388ff' },
  { bg: '#0d1b0e', fg: '#66bb6a' },
  { bg: '#1a1a1a', fg: '#ffd54f' },
  { bg: '#1a0a0a', fg: '#ef5350' },
  { bg: '#0a1a2e', fg: '#4fc3f7' },
  { bg: '#1a1a2e', fg: '#ce93d8' },
  { bg: '#0d0d1a', fg: '#80cbc4' },
  { bg: '#111111', fg: '#9e9e9e' },
  { bg: '#2e1a0a', fg: '#ffb74d' },
  { bg: '#0f172a', fg: '#38bdf8' },
  { bg: '#1e1b4b', fg: '#a78bfa' },
  { bg: '#14532d', fg: '#4ade80' },
  { bg: '#7c2d12', fg: '#fb923c' },
  { bg: '#831843', fg: '#f472b6' },
  { bg: '#164e63', fg: '#22d3ee' },
  { bg: '#312e81', fg: '#c4b5fd' },
  { bg: '#3f1d1d', fg: '#fca5a5' },
] as const;

export const BADGE_PALETTE_COUNT = BADGE_PALETTES.length;

export type IconBadgeColors = { bg: string; fg: string };

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic palette index from tracker name (0 .. BADGE_PALETTE_COUNT-1). */
export function defaultPaletteIndex(name: string): number {
  return hashCode(name) % BADGE_PALETTE_COUNT;
}

export function defaultBadgeColors(name: string): IconBadgeColors {
  return BADGE_PALETTES[defaultPaletteIndex(name)];
}

function normHex(s: string): string {
  return s.trim().toLowerCase();
}

/** Map legacy free-form colors to a palette index, or null if no exact match. */
export function findPaletteIndexForLegacyColors(colors: { bg: string; fg: string }): number | null {
  const bg = normHex(colors.bg);
  const fg = normHex(colors.fg);
  const i = BADGE_PALETTES.findIndex((p) => normHex(p.bg) === bg && normHex(p.fg) === fg);
  return i >= 0 ? i : null;
}

export function parseIconPaletteIndex(input: unknown): number | null {
  if (typeof input !== 'number' || !Number.isInteger(input)) return null;
  if (input < 0 || input >= BADGE_PALETTE_COUNT) return null;
  return input;
}
