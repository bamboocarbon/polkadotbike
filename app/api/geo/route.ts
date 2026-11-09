import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // must never be cached or statically evaluated

export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') ?? null;
  const res = NextResponse.json({ country }, {
    headers: { 'Cache-Control': 'no-store' },
  });
  // 2026-11-09 — KiwiCard reads this cookie first so the route is called about once per
  // visitor per 30 days, not on every stage-page view (Hobby Fluid Active CPU cap).
  if (country) {
    res.cookies.set('geo_country', country, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
  }
  return res;
}
