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
const BOT_UA = /bot|spider|crawl|slurp|facebookexternalhit|meta-externalagent|headless|lighthouse|pingdom|uptimerobot|monitor|preview|whatsapp|telegrambot|discordbot|google-inspectiontool|barkrowler|curl\/|wget\/|python-requests|python-urllib|go-http-client|okhttp|axios\/|node-fetch|postmanruntime|libwww-perl|apache-httpclient|guzzlehttp|insomnia|http\.rb/i;

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
  const ua = request.headers.get('user-agent') || '';
  // A real browser always sends a User-Agent — a blank one is itself a
  // reliable bot signal, not just "unknown".
  if (ua && !BOT_UA.test(ua)) {
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
