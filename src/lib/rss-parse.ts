import { XMLParser } from 'fast-xml-parser';

import type { TorrentItem } from './types';

const PLACEHOLDER = 'https://via.placeholder.com/90x135';

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseSizeBytes(text: string): number {
  const m = text.match(/([\d.,]+)\s*(GB|MB|GiB|MiB|KB|KiB)/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(',', '.'));
  if (Number.isNaN(n)) return 0;
  const u = m[2].toUpperCase();
  if (u.startsWith('G')) return Math.round(n * 1024 * 1024 * 1024);
  if (u.startsWith('M')) return Math.round(n * 1024 * 1024);
  if (u.startsWith('K')) return Math.round(n * 1024);
  return 0;
}

function parseSeedLeech(desc: string): { seeders: number; leechers: number } {
  const lower = desc.toLowerCase();
  const m = lower.match(/(\d+)\s*seeders?\s*y\s*(?:no hay leechers|(\d+)\s*leechers?)/i);
  if (m) {
    return { seeders: parseInt(m[1], 10) || 0, leechers: m[2] ? parseInt(m[2], 10) : 0 };
  }
  const m2 = lower.match(/estado:\s*(\d+)\s*seeders?\s*(?:y\s*)?(\d+)?\s*leechers?/i);
  if (m2) {
    return { seeders: parseInt(m2[1], 10) || 0, leechers: m2[2] ? parseInt(m2[2], 10) : 0 };
  }
  return { seeders: 0, leechers: 0 };
}

function extractCategory(desc: string): string {
  const m = desc.match(/Categoria:\s*([^\n\r<]+)/i);
  return m ? m[1].trim() : '';
}

function decodeHtmlEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity) => {
    const inner = entity.slice(1, -1).toLowerCase();
    if (inner === 'amp') return '&';
    if (inner === 'lt') return '<';
    if (inner === 'gt') return '>';
    if (inner === 'quot') return '"';
    if (inner === 'apos') return "'";
    if (inner.startsWith('#x')) return String.fromCharCode(parseInt(inner.slice(2), 16));
    if (inner.startsWith('#')) return String.fromCharCode(parseInt(inner.slice(1), 10));
    return entity;
  });
}

function extractMediaUrl(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim();
  if (Array.isArray(v)) {
    for (const x of v) {
      const u = extractMediaUrl(x);
      if (u) return u;
    }
    return null;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const type = String(o['@_type'] ?? o.type ?? '').toLowerCase();
    const url = o['@_url'] ?? o['@_href'] ?? o.url ?? o.href;
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      const u = url.trim();
      if (type.includes('bittorrent') || type.includes('octet-stream')) return null;
      if (/\.torrent(\?|$)/i.test(u)) return null;
      if (
        !type ||
        type.includes('image') ||
        type.includes('jpeg') ||
        type.includes('png') ||
        /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u)
      ) {
        return u;
      }
    }
  }
  return null;
}

function extractPosterFromMediaTags(item: Record<string, unknown>): string | null {
  const keys = ['media:thumbnail', 'media:content', 'itunes:image', 'enclosure'];
  for (const k of keys) {
    const u = extractMediaUrl(item[k]);
    if (u) return u;
  }
  return null;
}

function shouldSkipImageUrl(u: string): boolean {
  const x = u.toLowerCase();
  return /favicon|icon\.ico|spacer|1x1|blank\.gif|pixel\.gif|clear\.gif|data:image/.test(x);
}

function collectImageUrlsFromDescription(html: string): string[] {
  const decoded = decodeHtmlEntities(html);
  const found: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const cleaned = raw.replace(/&amp;/g, '&').replace(/[)\],.;]+$/, '').trim();
    if (!/^https?:\/\//i.test(cleaned) || shouldSkipImageUrl(cleaned)) return;
    if (seen.has(cleaned)) return;
    seen.add(cleaned);
    found.push(cleaned);
  };

  const bracketPatterns = [
    /\[imgw\](https?:\/\/[^\[\]\r\n]+)\[\/imgw\]/gi,
    /\[img\](https?:\/\/[^\[\]\r\n]+)\[\/img\]/gi,
    /\[IMG\](https?:\/\/[^\[\]\r\n]+)\[\/IMG\]/g,
  ];
  for (const re of bracketPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(decoded)) !== null) push(m[1]);
  }

  const htmlImg = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
  let im: RegExpExecArray | null;
  while ((im = htmlImg.exec(decoded)) !== null) push(im[1]);

  const srcOnly = /src=["'](https?:\/\/[^"']+)["']/gi;
  let sm: RegExpExecArray | null;
  while ((sm = srcOnly.exec(decoded)) !== null) push(sm[1]);

  const generic =
    /(https?:\/\/[^\s"'<>\[\]]+\.(?:jpe?g|png|gif|webp)(?:\?[^\s"'<>\[\]]*)?)/gi;
  let gm: RegExpExecArray | null;
  while ((gm = generic.exec(decoded)) !== null) push(gm[1]);

  return found;
}

function scorePosterUrl(u: string): number {
  const x = u.toLowerCase();
  let s = 0;
  if (x.includes('filmaffinity')) s += 5;
  if (x.includes('themoviedb') || x.includes('tmdb')) s += 5;
  if (x.includes('imdb')) s += 3;
  if (x.includes('imgur') || x.includes('i.imgur')) s += 4;
  if (x.includes('i.ibb.co')) s += 3;
  if (x.includes('image.tmdb')) s += 5;
  if (/-large\.|\/large\//.test(x)) s += 2;
  if (x.includes('preview')) s += 1;
  return s;
}

function pickBestPoster(urls: string[]): string {
  if (urls.length === 0) return PLACEHOLDER;
  const ranked = [...urls].sort((a, b) => scorePosterUrl(b) - scorePosterUrl(a));
  return ranked[0];
}

/** Unescape HTML so <img> and BBCode match when XML entity-encoded. */
function normalizeRssHtmlForImages(html: string): string {
  if (!html) return html;
  let s = decodeHtmlEntities(html);
  if (!/<img[\s/>]/i.test(s) && /&lt;img/i.test(s)) {
    s = s
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&amp;/g, '&');
  }
  return s;
}

function extractPosterFromRssItem(item: Record<string, unknown>, descriptionHtml: string): string {
  const fromMedia = extractPosterFromMediaTags(item);
  if (fromMedia) return fromMedia;

  const normalized = normalizeRssHtmlForImages(descriptionHtml);
  const fromDesc = collectImageUrlsFromDescription(normalized);
  if (fromDesc.length > 0) return pickBestPoster(fromDesc);

  return PLACEHOLDER;
}

function resolutionFromTitle(title: string): string {
  const br = title.match(/\[(\d{3,4}p)\]/i);
  if (br) return br[1].toLowerCase();
  const m = title.match(/\b(2160p|1440p|1080p|720p|480p)\b/i);
  return m ? m[1].toLowerCase() : '';
}

function hashLink(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function normalizeItems(raw: unknown): Record<string, unknown>[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  return [raw as Record<string, unknown>];
}

function itemTextField(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && v !== null && '#text' in v) {
    return String((v as { '#text': string })['#text']);
  }
  return '';
}

function itemLink(item: Record<string, unknown>): string {
  const link = item.link;
  if (typeof link === 'string' && link.trim()) return link.trim();
  const g = item.guid;
  if (typeof g === 'string' && g.trim()) return g.trim();
  if (g && typeof g === 'object' && g !== null && '#text' in g) {
    return String((g as { '#text': string })['#text']).trim();
  }
  return '';
}

function itemToTorrent(
  item: Record<string, unknown>,
  feedId: string,
): TorrentItem | null {
  const title = itemTextField(item.title).trim();
  const link = itemLink(item);
  if (!title || !link) return null;

  const encoded = item['content:encoded'] ?? item.encoded;
  const desc = [itemTextField(item.description), itemTextField(encoded)].filter(Boolean).join('\n');
  const descStr = desc || '';
  const plain = stripTags(descStr);
  const category = extractCategory(descStr + plain) || 'RSS';
  const { seeders, leechers } = parseSeedLeech(descStr + plain);
  const sizeLine = plain.match(/Tama[nñ]o:\s*([^\n]+)/i);
  const size = sizeLine ? parseSizeBytes(sizeLine[1]) : parseSizeBytes(plain);

  let created = new Date().toISOString();
  const pub = item.pubDate ?? item['dc:date'];
  if (pub) {
    const d = new Date(String(pub));
    if (!Number.isNaN(d.getTime())) created = d.toISOString();
  }

  const poster = extractPosterFromRssItem(item, descStr);
  const resolution = resolutionFromTitle(title);

  const id = `${feedId}-${hashLink(link)}`;

  return {
    type: 'torrent',
    id,
    attributes: {
      meta: { poster, genres: '' },
      name: title,
      release_year: null,
      category,
      type: '',
      resolution,
      size,
      freeleech: '0',
      double_upload: false,
      internal: 0,
      personal_release: false,
      uploader: '',
      seeders,
      leechers,
      times_completed: 0,
      tmdb_id: null,
      imdb_id: 0,
      created_at: created,
      download_link: link,
      details_link: link,
    },
  };
}

/**
 * Fetches a legacy RSS/Atom feed (e.g. Gazelle rss.php?...&passkey=...) and maps items to TorrentItem.
 */
export async function fetchLegacyRssAsTorrents(feedUrl: string, feedId: string): Promise<TorrentItem[]> {
  const res = await fetch(feedUrl, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'User-Agent': 'Trackarr/1.0',
    },
  });
  if (!res.ok) {
    throw new Error(`RSS returned ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  const ct = res.headers.get('content-type') ?? '';
  const charsetMatch = /charset=([^;]+)/i.exec(ct);
  const charset = charsetMatch ? charsetMatch[1].trim().replace(/['"]/g, '') : 'utf-8';
  let text: string;
  try {
    text = new TextDecoder(charset).decode(buf);
  } catch {
    text = new TextDecoder('utf-8').decode(buf);
  }

  const doc = parser.parse(text);
  const rawChannel = doc?.rss?.channel ?? doc?.feed;
  const channel = Array.isArray(rawChannel) ? rawChannel[0] : rawChannel;
  if (!channel) {
    return [];
  }

  const items = normalizeItems(channel.item ?? channel.entry);
  const out: TorrentItem[] = [];
  for (const raw of items) {
    const mapped = itemToTorrent(raw, feedId);
    if (mapped) out.push(mapped);
  }
  return out;
}
