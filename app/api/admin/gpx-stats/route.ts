import { NextResponse } from 'next/server';
import { getGpxDownloadStats } from '@/lib/gpxDownloadLog';

export const runtime = 'nodejs';

function isAuthorised(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

// Reads the per-climb counts app/api/gpx/[slug]/route.ts increments
// (lib/gpxDownloadLog.ts) — one Redis hash, not a Blob list() scan.
export async function GET(request: Request) {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const counts = await getGpxDownloadStats();
  return NextResponse.json(counts);
}
