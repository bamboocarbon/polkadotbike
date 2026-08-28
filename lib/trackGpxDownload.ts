// Fires a GA4 custom event when a "Download GPX" link is clicked, so we can
// see how many downloads happen and which climbs they're for — the file
// itself is a static asset (public/climbs/routes/*.gpx) served straight off
// the CDN with no server code in the path, so this client-side event is the
// only hook we have. No-ops silently if analytics consent hasn't been
// accepted yet (components/Analytics.tsx only loads gtag.js after that).
export function trackGpxDownload(slug: string) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'gpx_download', { climb_slug: slug });
  }
}
