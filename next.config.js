/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporary: Header/Footer link to extensionless routes (Phase 2.3), but
  // none of these pages have a real Next.js route yet — they're all still
  // served as-is from /public. Each rewrite below is removed the moment its
  // page actually migrates (starting with /giro26, /tdf, /vuelta in Phase 3),
  // so links never break mid-migration in either direction.
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/climb', destination: '/climb.html' },
      { source: '/compare', destination: '/compare.html' },
      { source: '/derailleur', destination: '/derailleur.html' },
      { source: '/wkg', destination: '/wkg.html' },
      // /tdf, /giro26, /vuelta, /about, /guide, /glossary, /contact removed —
      // their app/ pages are real routes now.
    ];
  },
};

module.exports = nextConfig;
