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

const BUCKET = 'polkadotbike-assets';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

export function uploadBasemapAsset(localPath: string, remoteName: string, contentType: string): void {
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
      CACHE_CONTROL,
      '--remote',
    ],
    { stdio: 'inherit' }
  );
}
