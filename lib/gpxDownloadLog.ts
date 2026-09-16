import { redis } from './redisClient';

// Same fix as lib/pageviewLog.ts's own migration off Vercel Blob (see that
// file's comment): a one-marker-blob-per-download design is a Blob
// "Advanced Operation" per write, and another per list()-over-history read
// on every /admin visit — exactly what put pageviews over Blob's 2,000/
// month Hobby cap within days. GPX downloads were on the same pattern and
// heading the same way (~20-30 writes/day and climbing, before even
// counting the new 2027 UK climbs). One Redis hash field per climb, HINCRBY
// on write, HGETALL on read — a handful of commands, comfortably inside
// Upstash's free tier, same shared database already used for pageviews
// (see pageviewLog.ts's own namespacing note).
const KEY = 'pdb:gpx:counts';

export async function recordGpxDownload(slug: string): Promise<void> {
  await redis.hincrby(KEY, slug, 1);
}

export async function getGpxDownloadStats(): Promise<Record<string, number>> {
  const counts = await redis.hgetall<Record<string, number>>(KEY);
  return counts || {};
}
