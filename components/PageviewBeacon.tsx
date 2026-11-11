'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Cookie-free, ID-free pageview ping to our own counter (worker/pageviews.js writes it to Redis under
// `pdb:pv`, the same store and keys the old Vercel middleware used, so the daily analytics report keeps
// working). Not gated by cookie consent, like digital-credit-yield's server-side counter: no cookie, no
// per-visitor ID, just the page path.
//
// It's a beacon rather than server-side middleware because this site is a static export on Cloudflare —
// pages never run server code, so a counter in the request path would mean running the Worker on every
// page load. Firing from the browser also counts client-side navigations, ignores link prefetches and
// bots that never run JavaScript, and keeps page loads fully static.
export default function PageviewBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    // Only real production hosts — never `next dev` or a preview URL.
    if (!['polkadotbike.com', 'www.polkadotbike.com'].includes(window.location.hostname)) return;
    // A page being prerendered in the background isn't a visit yet.
    if ((document as Document & { prerendering?: boolean }).prerendering) return;
    try {
      const body = JSON.stringify({ p: pathname });
      if (navigator.sendBeacon) {
        // text/plain keeps it a "simple" request (no CORS preflight).
        navigator.sendBeacon('/api/pv', new Blob([body], { type: 'text/plain' }));
      } else {
        fetch('/api/pv', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
      }
    } catch {
      // Counting must never break the page.
    }
  }, [pathname]);

  return null;
}
