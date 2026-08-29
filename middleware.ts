import { NextResponse, type NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import { put } from '@vercel/blob';

// Best-effort — this only needs to keep out the obvious crawlers so the
// counter reflects real visits, not perfectly filter every bot.
const BOT_UA = /bot|spider|crawl|slurp|facebookexternalhit|headless|lighthouse|pingdom|uptimerobot|monitor|preview/i;

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
  if (!BOT_UA.test(ua)) {
    const encoded = encodePath(request.nextUrl.pathname);
    event.waitUntil(
      put(`pageviews/${encoded}/${Date.now()}-${crypto.randomUUID()}`, new Date().toISOString(), {
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
