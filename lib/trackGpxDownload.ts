// Records a "Download GPX" click, so we can see how many downloads happen and which climbs they're for — the file
// itself is a static asset (public/climbs/routes/*.gpx) served straight off the CDN with no server code in the
// path, so a client-side event is the only hook we have.
//
// Two things fire:
//  1. A cookie-free, ID-free beacon to our own counter (worker/gpx.js → Redis `pdb:gpx`, shown in the daily
//     analytics email). Not gated by cookie consent, like the pageview beacon: it carries only the climb slug.
//  2. A GA4 custom event, which no-ops silently if analytics consent hasn't been accepted yet
//     (components/Analytics.tsx only loads gtag.js after that).
// Neither can ever affect the download: the link works on its own.
export function trackGpxDownload(slug: string) {
  try {
    // Only real production hosts — never `next dev` or a preview URL.
    if (['polkadotbike.com', 'www.polkadotbike.com'].includes(window.location.hostname)) {
      const body = JSON.stringify({ s: slug });
      if (navigator.sendBeacon) {
        // text/plain keeps it a "simple" request (no CORS preflight).
        navigator.sendBeacon('/api/gpx', new Blob([body], { type: 'text/plain' }));
      } else {
        fetch('/api/gpx', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
      }
    }
  } catch {
    // Counting must never break the download.
  }
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'gpx_download', { climb_slug: slug });
  }
}
