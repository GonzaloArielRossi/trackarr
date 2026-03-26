/** First 3 alphanumeric characters of the name (uppercase), for default badge text. */
export function defaultBadgeLetters(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
}

/** Normalize icon alias: 2–3 alphanumeric chars, or empty string for "unset". */
export function normalizeIconAlias(raw: string | undefined): string {
  if (raw == null || raw === '') return '';
  const s = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  if (s.length >= 2) return s;
  return '';
}
