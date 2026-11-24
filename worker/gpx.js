// GPX download counting for polkadotbike. The .gpx files are static assets served straight off the CDN, so the only
// hook is the click: lib/trackGpxDownload.ts fires a cookie-free, ID-free beacon here with just the climb slug.
// Same Upstash Redis as the pageview counter, own `pdb:gpx` namespace, read by the daily analytics report
// (digital-credit-yield: lib/gpxDownloads.js). Same bot / owner-IP filters as worker/pageviews.js, and it fails open:
// a Redis hiccup just means a download isn't counted, never that the file doesn't download (the link works on its own).
//
// Keys (all under pdb:gpx):  slugs (hash slug→all-time count) · day:YYYY-MM-DD (hash slug→count, 70-day TTL) ·
// total · since (date counting began) · dedupe:<ip>:<slug> (10-minute guard so a double-click or retry counts once).
import { ALLOWED_ORIGINS, BOT_UA, excludedIps, redis } from './pageviews.js';

const NS = 'pdb:gpx';
const DAY_TTL_SECONDS = 60 * 60 * 24 * 70;
const DEDUPE_SECONDS = 600;
// Climb/route slugs are lower-case letters, digits and dashes (public/climbs/routes/<slug>.gpx).
const SLUG_OK = /^[a-z0-9][a-z0-9-]{0,79}$/;

// Validates one beacon and, if it's a real download, records it. Resolves to a short reason string; never throws
// for bad input.
export async function recordGpxDownload(env, { slug, ip, ua, now = new Date() }) {
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) return 'no-redis';
  if (typeof slug !== 'string' || !SLUG_OK.test(slug)) return 'bad-slug';
  if (!ua || BOT_UA.test(ua)) return 'bot';
  if (excludedIps(env).has(ip)) return 'excluded-ip';

  const [{ result: first }] = await redis(env, [['SET', `${NS}:dedupe:${ip}:${slug}`, '1', 'EX', DEDUPE_SECONDS, 'NX']]);
  if (first !== 'OK') return 'duplicate';

  const day = now.toISOString().slice(0, 10);
  const dayKey = `${NS}:day:${day}`;
  await redis(env, [
    ['HINCRBY', `${NS}:slugs`, slug, 1],
    ['HINCRBY', dayKey, slug, 1],
    ['EXPIRE', dayKey, DAY_TTL_SECONDS],
    ['INCR', `${NS}:total`],
    ['SET', `${NS}:since`, day, 'NX'],
  ]);
  return 'recorded';
}

// Handles POST /api/gpx. Always answers quickly with 204; the counting runs after the response.
export async function handleGpxDownload(request, env, ctx) {
  const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  if (!ALLOWED_ORIGINS.has(request.headers.get('origin') || '')) return done();
  let slug;
  try {
    const text = await request.text();
    if (text.length > 200) return done();
    slug = JSON.parse(text).s;
  } catch {
    return done();
  }
  const ip = (request.headers.get('cf-connecting-ip') || 'unknown').trim();
  const ua = request.headers.get('user-agent') || '';
  ctx.waitUntil(recordGpxDownload(env, { slug, ip, ua }).catch(() => {}));
  return done();
}
