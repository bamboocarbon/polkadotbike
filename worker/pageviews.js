// Pageview counting for polkadotbike on Cloudflare — a port of the counter that used to live in the Vercel
// middleware (git history: middleware.ts at 90bac6a). Same Redis (Upstash), same `pdb:pv` keys, same bot,
// scanner, burst and owner-IP filters, so lib/pageviewPeriods and the daily analytics report keep working.
//
// Called from worker/index.js for POST /api/pv, fired by components/PageviewBeacon.tsx. Everything here
// fails open: a Redis hiccup or a missing secret just means a view isn't counted — it never affects the page.

const NS = 'pdb:pv';
const BURST_WINDOW_SECONDS = 3;
const BURST_ALLOWANCE = 4;
// Per-week path hash (keyed by that week's Monday, UTC) so the daily report can show LAST WEEK's top pages; the
// all-time `paths` hash can't be split by period. Expires after ~10 weeks. Added 2026-11-11.
const WPATHS_TTL_SECONDS = 60 * 60 * 24 * 70;
function mondayOf(d) {
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7));
  return m.toISOString().slice(0, 10);
}

// Best-effort bot filter, copied verbatim from the old middleware (widened several times against real UA
// data — see that file's history). Bots that never run JavaScript don't reach this endpoint at all.
const BOT_UA = /bot|spider|crawl|slurp|facebookexternalhit|meta-externalagent|headless|lighthouse|pingdom|uptimerobot|monitor|preview|whatsapp|telegrambot|discordbot|google-inspectiontool|googleother|barkrowler|curl\/|wget\/|python-requests|python-urllib|go-http-client|okhttp|axios\/|node-fetch|postmanruntime|libwww-perl|apache-httpclient|guzzlehttp|insomnia|http\.rb|get_titles|forestengine|networkingextension|crusader-worker|appengine-google|chrome\/[\d.]+ safari\/604\.1|iphone os 13_2_3.*version\/13\.0\.3|panscient|wp-safe-scanner|censysinspect|domain-harvester|nomorevibe|^user-agent:|windows nt 10\.0\) applewebkit|^(?!.*(?:micromessenger|weixin|xweb)).*chrome\/(?:[0-9]|[1-8][0-9])\./i;

const SCAN_PATH = /^\/(wp-|wordpress|xmlrpc\.php|\.env|\.git|phpmyadmin|pma\/|file-manager|elfinder|cgi-bin|actuator|vendor\/phpunit|config\.php|\.aws|\.ssh|shell\.php|eval-stdin\.php|_profiler)/i;

export const ALLOWED_ORIGINS = new Set(['https://polkadotbike.com', 'https://www.polkadotbike.com']);
// Paths are site routes only: letters, digits, dash, underscore, slash. Anything else is ignored.
const PATH_OK = /^\/[A-Za-z0-9_\-\/]*$/;

export function encodePath(pathname) {
  const trimmed = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) return '_home';
  return trimmed.replace(/\//g, '--');
}

// Upstash REST pipeline: POST <url>/pipeline with [[CMD, ...args], ...] → [{result}, ...].
async function redis(env, commands) {
  const res = await fetch(`${env.KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return res.json();
}

export function excludedIps(env) {
  return new Set((env.PV_EXCLUDE_IPS || '').split(',').map((s) => s.trim()).filter(Boolean));
}

// Validates one beacon and, if it's a real visit, records it. Resolves to a short reason string (useful in
// tests); callers ignore it. Never throws for bad input.
export async function recordPageview(env, { path, ip, ua, now = new Date() }) {
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) return 'no-redis';
  if (typeof path !== 'string' || path.length > 120 || !PATH_OK.test(path) || SCAN_PATH.test(path)) return 'bad-path';
  // A real browser always sends a User-Agent — a blank one is itself a bot signal.
  if (!ua || BOT_UA.test(ua)) return 'bot';
  if (excludedIps(env).has(ip)) return 'excluded-ip';

  // Burst check: a real visitor never opens several distinct pages inside a few seconds.
  const burstKey = `${NS}:burst:${ip}`;
  const [{ result: hits }] = await redis(env, [['INCR', burstKey]]);
  if (hits === 1) await redis(env, [['EXPIRE', burstKey, BURST_WINDOW_SECONDS]]);
  if (hits > BURST_ALLOWANCE) return 'burst';

  const encoded = encodePath(path);
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const weekKey = `${NS}:wpaths:${mondayOf(now)}`;
  await redis(env, [
    ['INCR', `${NS}:day:${day}`],
    ['INCR', `${NS}:month:${month}`],
    ['SADD', `${NS}:months`, month],
    ['HINCRBY', `${NS}:paths`, encoded, 1],
    ['HINCRBY', weekKey, encoded, 1],
    ['EXPIRE', weekKey, WPATHS_TTL_SECONDS],
    ['INCR', `${NS}:total`],
    // Bounded rolling sample of the last 500 events, for diagnosing new bot patterns from real data.
    ['LPUSH', `${NS}:recentUAs`, `${now.toISOString()}\t${encoded}\t${ua}`],
    ['LTRIM', `${NS}:recentUAs`, 0, 499],
  ]);
  return 'recorded';
}

// Handles POST /api/pv. Always answers quickly with 204; the counting runs after the response.
export async function handlePageview(request, env, ctx) {
  const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  // Same-site beacons only; anything else is ignored (spoofed counts, other origins).
  if (!ALLOWED_ORIGINS.has(request.headers.get('origin') || '')) return done();
  let path;
  try {
    const text = await request.text();
    if (text.length > 300) return done();
    path = JSON.parse(text).p;
  } catch {
    return done();
  }
  const ip = (request.headers.get('cf-connecting-ip') || 'unknown').trim();
  const ua = request.headers.get('user-agent') || '';
  ctx.waitUntil(recordPageview(env, { path, ip, ua }).catch(() => {}));
  return done();
}
