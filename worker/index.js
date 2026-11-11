// Tiny Cloudflare Worker in front of the static site. It only runs for
// /api/geo (see run_worker_first in wrangler.jsonc); every other request is
// served straight from static assets and never touches this code, so it
// costs nothing against the free plan's per-request CPU limit.
//
// /api/geo replaces the old Vercel route: same JSON shape ({ country }) and
// the same 30-day geo_country cookie that KiwiCard reads first.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/geo') {
      const country = request.cf?.country ?? null;
      const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
      if (country) {
        headers['Set-Cookie'] = `geo_country=${country}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }
      return new Response(JSON.stringify({ country }), { headers });
    }
    return env.ASSETS.fetch(request);
  },
};
