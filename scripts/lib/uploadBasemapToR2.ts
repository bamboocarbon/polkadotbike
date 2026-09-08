/**
 * Pushes one built basemap asset (webp / json / terrain.json) to the
 * polkadotbike-assets R2 bucket, served at assets.polkadotbike.com/basemaps.
 * These used to live in public/ and got duplicated into every single Vercel
 * deployment (~90MB+ across 69 climbs), which is what blew through the
 * Hobby plan's 10GB Deployment Storage cap in Sept 2026 — see
 * project_cyclegear memory. Basemaps now build to a git-ignored local
 * staging dir and get uploaded here instead of shipping in the repo.
 *
 * Requires `wrangler login` to have been run once on this machine.
 */
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

const BUCKET = 'polkadotbike-assets';
// Immutable/1yr for the heavy, content-addressed assets (webp, terrain.json)
// — safe because any rebuild changes their content hash, which callers must
// fold into the query string they request the asset with (see
// DebugScene.tsx's ?v= param). The small {slug}.json manifest itself can't
// use this scheme (nothing points to a manifest by a busted URL — it's the
// thing readers find asset versions IN), so it gets its own short-lived
// Cache-Control instead. Found 2026-09-08: a rebuilt leontica.webp (fixing
// the OpenTopoMap max-zoom placeholder bug) stayed invisible to any browser
// that had already cached the old broken version under the old immutable
// scheme, with no way to recover short of a manual cache clear.
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export const MANIFEST_CACHE_CONTROL = 'public, max-age=300, must-revalidate';

// Short, stable per-content identifier for cache-busting a versioned asset
// URL — content-derived (not a timestamp) so an unrelated rebuild that
// produces byte-identical output doesn't force every client to re-fetch.
export function contentHash(localPath: string): string {
  return createHash('sha256').update(readFileSync(localPath)).digest('hex').slice(0, 10);
}

export function uploadBasemapAsset(
  localPath: string,
  remoteName: string,
  contentType: string,
  cacheControl: string = IMMUTABLE_CACHE_CONTROL
): void {
  execFileSync(
    'wrangler',
    [
      'r2',
      'object',
      'put',
      `${BUCKET}/basemaps/${remoteName}`,
      '--file',
      localPath,
      '--content-type',
      contentType,
      '--cache-control',
      cacheControl,
      '--remote',
    ],
    { stdio: 'inherit' }
  );
}
