import { readFile } from 'fs/promises';
import path from 'path';
import { recordGpxDownload } from '@/lib/gpxDownloadLog';

// Serves the same static files as public/climbs/routes/*.gpx did directly,
// but records each download per climb first. Counting has to happen here
// rather than client-side (e.g. a GA event) because that only fires for
// visitors who've accepted analytics consent and have JS running — this
// route is the actual file transfer, so every real download is counted.
export const runtime = 'nodejs';

const SLUG_RE = /^[a-z0-9-]+$/;

// HINCRBY on a single Redis hash (lib/gpxDownloadLog.ts) — was previously
// one marker blob per download on Vercel Blob, migrated off it (see that
// file's comment) for the same reason lib/pageviewLog.ts was.
async function recordDownload(slug: string) {
  try {
    await recordGpxDownload(slug);
  } catch {
    // A missed count shouldn't ever block the actual download.
  }
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;
  if (!SLUG_RE.test(slug)) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'public', 'climbs', 'routes', `${slug}.gpx`);
  let file: Buffer;
  try {
    file = await readFile(filePath);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  // Must be awaited, not fire-and-forget: an unawaited write here can get
  // torn down along with the serverless function once the response is sent,
  // silently dropping the count (found while testing this locally).
  await recordDownload(slug);

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename="${slug}.gpx"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
