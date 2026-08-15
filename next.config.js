/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 4: every page that used to be a static .html file now has a real
  // route (see public/*.html — those are stale duplicates, no longer the
  // rewrite target, kept only in case anything still links directly to
  // them). Permanent redirects so old bookmarks/backlinks/search-indexed
  // .html URLs land on the real page instead of the frozen static copy.
  // Next.js forwards any query string automatically (e.g. old
  // /climb.html?gr=6&dst=6.92 links still work, land on /climb?gr=6&dst=6.92).
  // 404.html has no route to redirect to — Next's own not-found.tsx
  // handles that case now.
  async redirects() {
    const pages = [
      'about',
      'climb',
      'compare',
      'contact',
      'derailleur',
      'disclaimer',
      'giro26',
      'glossary',
      'guide',
      'privacy',
      'tdf',
      'vuelta',
      'wkg',
    ];
    return [
      // Migrated from vercel.json (deleted) — Vercel's own guidance is that
      // a Next.js app should define redirects here, not there; vercel.json
      // silently stopped taking effect once the project's Framework Preset
      // was correctly set to Next.js (was `null`, a leftover from the old
      // static site — see the 2026-08-15 launch).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.polkadotbike.com' }],
        destination: 'https://polkadotbike.com/:path*',
        permanent: true,
      },
      { source: '/gear-ratio-calculator', destination: '/', permanent: true },
      { source: '/gear-ratio-calculator.html', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      ...pages.map((page) => ({
        source: `/${page}.html`,
        destination: `/${page}`,
        permanent: true,
      })),
    ];
  },
};

module.exports = nextConfig;
