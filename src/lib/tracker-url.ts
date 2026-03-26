/** Normalize user input into a tracker base URL, or null if invalid. */
export function tryNormalizeTrackerUrl(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withProto);
    if (!u.hostname) return null;
    let out = `${u.protocol}//${u.hostname}`;
    if (u.port) out += `:${u.port}`;
    const path = u.pathname.replace(/\/$/, '');
    if (path && path !== '/') out += path;
    return out;
  } catch {
    return null;
  }
}

/** Default display name from a tracker URL (hostname without www). */
export function defaultNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
