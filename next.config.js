/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Workers static assets (moved off Vercel
  // 2026-11-11 after the Hobby Fluid Active CPU cap took the site offline).
  // `next build` writes the whole site to out/ — no server at runtime.
  //
  // Redirects (old .html URLs, /gear-ratio-calculator) now live in
  // public/_redirects, and www → apex is a Cloudflare redirect rule —
  // Next's redirects() isn't supported by `output: 'export'`.
  output: 'export',
  images: { unoptimized: true },
};

module.exports = nextConfig;
