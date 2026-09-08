/**
 * One-off migration (2026-09-08): every basemap built before today's
 * cache-busting fix (see uploadBasemapToR2.ts's IMMUTABLE_CACHE_CONTROL
 * comment) has a manifest with no webpVersion/terrainVersion and is still
 * sitting behind the old 1yr-immutable Cache-Control. This backfills both
 * without touching the webp/terrain.json content or re-fetching a single
 * tile — just hashes what's already on disk and re-uploads the small
 * manifest with the version fields and the new short-lived Cache-Control.
 * build-climb-basemaps.ts / build-climb-terrain.ts do this automatically
 * for any climb built or rebuilt from now on; this is only needed once, to
 * catch the ~89 already sitting in .basemap-staging/basemaps.
 *
 * Run with: npx tsx scripts/backfill-basemap-versions.ts
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { contentHash, MANIFEST_CACHE_CONTROL, uploadBasemapAsset } from './lib/uploadBasemapToR2';

const DIR = join(__dirname, '..', '.basemap-staging', 'basemaps');

function main() {
  const slugs = readdirSync(DIR)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.terrain.json'))
    .map((f) => f.replace(/\.json$/, ''));

  let updated = 0;
  for (const slug of slugs) {
    const manifestPath = join(DIR, `${slug}.json`);
    const webpPath = join(DIR, `${slug}.webp`);
    const terrainPath = join(DIR, `${slug}.terrain.json`);
    if (!existsSync(webpPath)) {
      console.warn(`${slug}: no .webp on disk, skipping`);
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (manifest.webpVersion && (manifest.terrainVersion || !existsSync(terrainPath))) {
      continue; // already backfilled
    }
    manifest.webpVersion = contentHash(webpPath);
    if (existsSync(terrainPath)) manifest.terrainVersion = contentHash(terrainPath);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    uploadBasemapAsset(manifestPath, `${slug}.json`, 'application/json', MANIFEST_CACHE_CONTROL);
    console.log(`${slug}: webpVersion=${manifest.webpVersion}${manifest.terrainVersion ? ` terrainVersion=${manifest.terrainVersion}` : ''}`);
    updated++;
  }
  console.log(`Backfilled ${updated}/${slugs.length} manifest(s).`);
}

main();
