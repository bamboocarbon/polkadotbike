import { NextResponse, type NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import { put } from '@vercel/blob';

// Best-effort — this only needs to keep out the obvious crawlers so the
// counter reflects real visits, not perfectly filter every bot. A UA that
// spoofs a real browser will always slip through; nothing header-based can
// catch that (see the User-Agent logging below for when it does).
//
// Widened 2026-08-30 (ported from the same fix on digital-credit-yield)
// after an unidentified crawler swept 10+ pages there in ~3 seconds and
// none of it got filtered — the original list only caught UAs that
// self-identify as a bot/spider/crawler. Added: Meta's renamed crawler,
// chat-app link-preview fetchers, Google's URL-inspection tool, an SEO
// crawler with no bot/spider/crawl substring in its name, and the common
// non-browser HTTP clients (curl, wget, language-runtime HTTP libraries,
// API-testing tools) that a real visitor's browser never sends.
//
// 2026-08-30, second widening: caught `get_titles/1.0` live in the actual
// recorded data (a single hit, but a real gap — the UA-logging above is
// exactly what made this findable instead of guessed at) — a plain,
// undisguised scraper name that didn't match anything in the list above.
const BOT_UA = /bot|spider|crawl|slurp|facebookexternalhit|meta-externalagent|headless|lighthouse|pingdom|uptimerobot|monitor|preview|whatsapp|telegrambot|discordbot|google-inspectiontool|barkrowler|curl\/|wget\/|python-requests|python-urllib|go-http-client|okhttp|axios\/|node-fetch|postmanruntime|libwww-perl|apache-httpclient|guzzlehttp|insomnia|http\.rb|get_titles/i;

// A different bot class UA filtering can never catch: these self-identify
// by hitting a PATH that isn't a real route on this site at all, often with
// a normal-looking (or subtly malformed) UA rather than an honest one.
// Found live on digital-credit-yield 2026-08-30: /file-manager/initialize
// (a known vulnerability-scanner probe path, unrelated to this site) with a
// UA missing its browser/version entirely — no real browser sends that.
// Best-effort, extend as new scan targets show up in the recorded UA data.
const SCAN_PATH = /^\/(wp-|wordpress|xmlrpc\.php|\.env|\.git|phpmyadmin|pma\/|file-manager|elfinder|cgi-bin|actuator|vendor\/phpunit|config\.php|\.aws|\.ssh|shell\.php|eval-stdin\.php)/i;

function encodePath(pathname: string): string {
  const trimmed = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) return '_home';
  return trimmed.replace(/\//g, '--');
}

/**
 * Records one marker blob per real page load — no cookies, no per-visitor
 * ID, so it isn't gated by cookie consent the way GA4 is (see
 * components/Analytics.tsx: GA doesn't load until "Accept"). Same pattern
 * as the GPX download counter (lib/pageviewLog.ts aggregates it). Runs in
 * middleware, not a page/layout Server Component, because most routes here
 * are statically generated and would never re-execute server code per
 * request otherwise — middleware runs on every matched request regardless.
 */
export function middleware(request: NextRequest, event: NextFetchEvent) {
  // `npm run dev` shares this exact same production Blob store (same
  // BLOB_READ_WRITE_TOKEN in .env.local) — found 2026-08-30 when a day of
  // local testing on the new Rebecca's Private Idaho pages silently added
  // 43 fake "views" to the real counter (27% of that day's total). Vercel
  // sets `VERCEL` in every deployed environment (production AND preview)
  // but never in plain local `next dev` — same signal lib/calendar/store.ts
  // already uses to pick its storage backend. Skip recording entirely
  // rather than try to filter dev traffic out after the fact.
  if (!process.env.VERCEL) return NextResponse.next();
  const ua = request.headers.get('user-agent') || '';
  // A real browser always sends a User-Agent — a blank one is itself a
  // reliable bot signal, not just "unknown".
  if (ua && !BOT_UA.test(ua) && !SCAN_PATH.test(request.nextUrl.pathname)) {
    const encoded = encodePath(request.nextUrl.pathname);
    // Content is the UA behind the timestamp, not just a bare ISO string —
    // added 2026-08-30 so a repeat of an unfiltered crawl can be diagnosed
    // from the data itself instead of guessing at the filter again. The
    // aggregator (lib/pageviewLog.ts) still only reads blob.uploadedAt for
    // timing, so this is purely additive.
    event.waitUntil(
      put(`pageviews/${encoded}/${Date.now()}-${crypto.randomUUID()}`, `${new Date().toISOString()}\n${ua}`, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'text/plain',
      }).catch(() => {})
    );
  }
  return NextResponse.next();
}

export const config = {
  // Skips API routes, Next internals, /admin (don't count our own visits),
  // and anything that looks like a static file (has a dot anywhere in the
  // path — covers favicon.ico, robots.txt, sitemap.xml, images, etc.). One
  // combined negative-lookahead pattern, not multiple matcher entries —
  // multiple entries are OR'd together, which would defeat the exclusions.
  matcher: ['/((?!api/|_next/static/|_next/image/|admin|.*\\.).*)'],
};
