import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export const runtime = 'nodejs';

function isAuthorised(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

// Tallies the one-marker-blob-per-download log written by
// app/api/gpx/[slug]/route.ts (gpx-downloads/<slug>/<id>) into per-climb
// counts. A list() call is Blob's "Advanced Operation" tier and is rate
// limited on the free plan, but this route only runs when a human opens
// /admin, so that's not a concern here.
export async function GET(request: Request) {
  if (!isAuthorised(request)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const counts: Record<string, number> = {};
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'gpx-downloads/', cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const slug = blob.pathname.slice('gpx-downloads/'.length).split('/')[0];
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return NextResponse.json(counts);
}
