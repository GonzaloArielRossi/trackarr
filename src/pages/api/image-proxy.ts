import type { APIRoute } from 'astro';

function hostnameAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return false;
  if (['127.0.0.1', '0.0.0.0', '::1', '[::1]', '169.254.169.254'].includes(h)) return false;
  if (/^10\.\d+\.\d+\.\d+$/.test(h)) return false;
  if (/^192\.168\.\d+\.\d+$/.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return false;
  return true;
}

/**
 * Fetches remote images for feed posters (avoids hotlink blocks and mixed-content issues).
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const raw = url.searchParams.get('url');
  if (!raw) return new Response('Missing url', { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return new Response('Invalid scheme', { status: 400 });
  }

  if (!hostnameAllowed(target.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        Accept: 'image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: `${target.origin}/`,
      },
      redirect: 'follow',
    });

    if (!res.ok) return new Response(null, { status: 502 });

    const buf = await res.arrayBuffer();
    if (buf.byteLength > 8 * 1024 * 1024) return new Response(null, { status: 413 });

    const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (ct && (ct.includes('text/html') || ct.includes('application/json') || ct.startsWith('text/'))) {
      return new Response(null, { status: 502 });
    }

    let outType = ct && ct.startsWith('image/') ? ct : 'image/jpeg';
    if (ct.includes('octet-stream')) outType = 'image/jpeg';

    return new Response(buf, {
      headers: {
        'Content-Type': outType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
};
