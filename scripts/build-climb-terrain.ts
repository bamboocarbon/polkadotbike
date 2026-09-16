/**
 * PROOF OF CONCEPT — terrain-relief viability check (2026-08-12), NOT part
 * of the tasksheet's committed phases. The tasksheet lists terrain relief
 * as explicitly out of scope ("separate MapLibre DEM job"); Robin asked to
 * check whether it's practical to build now anyway. This fetches a grid of
 * free Mapzen/AWS Terrarium elevation tiles (same free/no-key/global source
 * Mapbox's own terrain product is built on) covering the route's basemap
 * bounds, decodes real elevation per grid point, and writes a heightmap
 * JSON the debug scene can render as an actual undulating ground mesh
 * instead of a flat textured plane.
 *
 * Run with: npx tsx scripts/build-climb-terrain.ts
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, utimesSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { contentHash, MANIFEST_CACHE_CONTROL, uploadBasemapAsset } from './lib/uploadBasemapToR2';

const ROUTES_DIR = join(__dirname, '..', 'data', 'climbs', 'routes');
// Same staging dir build-climb-basemaps.ts writes to — terrain.json is
// uploaded to R2 alongside the webp/json it's a sidecar to, not shipped in
// public/. See project_cyclegear memory, Sept 2026.
const BASEMAPS_DIR = join(__dirname, '..', '.basemap-staging', 'basemaps');
const GRID_N = 96; // vertices per axis — plenty for a stylised terrain mesh
const TILE_PX = 256; // Terrarium tile size
const USER_AGENT = 'PolkaDotBike-ClimbTerrainPOC/1.0 (+https://polkadotbike.com)';

function lonToTileX(lon: number, z: number): number {
  return ((lon + 180) / 360) * 2 ** z;
}
function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
}

// A fixed zoom 12 (Terrarium tiles are usable well below imagery zoom for a
// coarse grid) worked fine for the long continental climbs this was first
// built against, but broke down on a short climb (cote-de-belmont, ~3.4km
// bbox) — zoom 12's ~40m/pixel tile raster and the 96x96 output grid's own
// ~36m spacing are close enough in frequency to beat against each other, a
// moiré pattern that survived bilinear interpolation (interpolation smooths
// *between* source samples, it can't add resolution the source doesn't
// have) and showed up as regular parallel ridges in the rendered terrain.
// Picking a zoom whose tile raster is comfortably denser than our own grid
// avoids the beat frequency entirely. Capped at 14 — Terrarium's underlying
// SRTM/ASTER source is ~30m resolution globally, so higher zooms are
// Mapzen's own upsampling, not real extra detail, while every extra zoom
// level roughly triples the tile count (and network/build cost) for a big
// bbox — not worth it for climbs that weren't aliasing in the first place.
const ELEV_ZOOM_MIN = 10;
const ELEV_ZOOM_MAX = 14;
const OVERSAMPLE_FACTOR = 3; // want at least this many source pixels per grid cell

function pickElevationZoom(latMin: number, latMax: number, lonMin: number, lonMax: number): number {
  const targetPx = (GRID_N - 1) * OVERSAMPLE_FACTOR;
  for (let z = ELEV_ZOOM_MIN; z <= ELEV_ZOOM_MAX; z++) {
    const xPx = (lonToTileX(lonMax, z) - lonToTileX(lonMin, z)) * TILE_PX;
    const yPx = (latToTileY(latMin, z) - latToTileY(latMax, z)) * TILE_PX;
    if (Math.min(xPx, yPx) >= targetPx) return z;
  }
  return ELEV_ZOOM_MAX;
}

// Inverse of build-climb-routes.ts's project() — must match exactly.
function unproject(x: number, z: number, lat0: number, lon0: number): { lat: number; lon: number } {
  const lon = lon0 + x / (Math.cos((lat0 * Math.PI) / 180) * 111320);
  const lat = lat0 - z / 110540;
  return { lat, lon };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A failed tile fetch used to fall back to a silent 0m elevation
// (elevationAt below), which bakes a flat sea-level cliff into whatever
// climb happened to hit a transient S3 hiccup — found 2026-09-16 across 21
// climbs in the existing catalogue (cote-de-jubilee-tower's mid-terrain
// cliff was the visible symptom). Retrying absorbs the transient case;
// throwing after retries are exhausted means a genuinely-missing tile
// aborts that climb's build loudly instead of shipping bad terrain.
const TILE_FETCH_RETRIES = 4;
const TILE_FETCH_BACKOFF_MS = [500, 1500, 4000];

const tileCache = new Map<string, Promise<{ data: Buffer; width: number } | null>>();
async function fetchTile(z: number, x: number, y: number): Promise<{ data: Buffer; width: number } | null> {
  const key = `${z}/${x}/${y}`;
  if (!tileCache.has(key)) {
    tileCache.set(
      key,
      (async () => {
        let lastErr: unknown;
        for (let attempt = 0; attempt < TILE_FETCH_RETRIES; attempt++) {
          if (attempt > 0) await sleep(TILE_FETCH_BACKOFF_MS[attempt - 1]);
          try {
            const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, {
              headers: { 'User-Agent': USER_AGENT },
            });
            if (!res.ok) {
              if (res.status === 404) return null; // genuinely no data at this tile — not transient
              lastErr = new Error(`HTTP ${res.status}`);
              continue;
            }
            const buf = Buffer.from(await res.arrayBuffer());
            const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
            return { data, width: info.width };
          } catch (e) {
            lastErr = e;
          }
        }
        throw new Error(`Failed to fetch elevation tile ${key} after ${TILE_FETCH_RETRIES} attempts: ${lastErr}`);
      })()
    );
  }
  return tileCache.get(key)!;
}

function pixelElevation(tile: { data: Buffer; width: number }, px: number, py: number): number {
  const cx = Math.min(tile.width - 1, Math.max(0, px));
  const cy = Math.min(tile.width - 1, Math.max(0, py));
  const idx = (cy * tile.width + cx) * 3;
  const r = tile.data[idx];
  const g = tile.data[idx + 1];
  const b = tile.data[idx + 2];
  return r * 256 + g + b / 256 - 32768;
}

async function elevationAt(lat: number, lon: number, zoom: number): Promise<number> {
  const xTile = lonToTileX(lon, zoom);
  const yTile = latToTileY(lat, zoom);
  const tx = Math.floor(xTile);
  const ty = Math.floor(yTile);
  const tile = await fetchTile(zoom, tx, ty);
  if (!tile) throw new Error(`No elevation tile at ${zoom}/${tx}/${ty} (lat=${lat}, lon=${lon})`);
  // Bilinear interpolation across the 4 nearest source pixels, not just the
  // nearest one — nearest-pixel sampling produced visible terracing once
  // the mesh is vertically exaggerated, on top of the moiré risk pickElevationZoom
  // above guards against. Interpolating smooths what aliasing remains.
  const fx = (xTile - tx) * tile.width - 0.5;
  const fy = (yTile - ty) * tile.width - 0.5;
  const px0 = Math.floor(fx);
  const py0 = Math.floor(fy);
  const wx = fx - px0;
  const wy = fy - py0;
  const e00 = pixelElevation(tile, px0, py0);
  const e10 = pixelElevation(tile, px0 + 1, py0);
  const e01 = pixelElevation(tile, px0, py0 + 1);
  const e11 = pixelElevation(tile, px0 + 1, py0 + 1);
  return e00 * (1 - wx) * (1 - wy) + e10 * wx * (1 - wy) + e01 * (1 - wx) * wy + e11 * wx * wy;
}

async function buildTerrain(slug: string) {
  const route = JSON.parse(readFileSync(join(ROUTES_DIR, `${slug}.json`), 'utf-8'));
  const basemapMeta = JSON.parse(readFileSync(join(BASEMAPS_DIR, `${slug}.json`), 'utf-8'));
  const { xMin, xMax, zMin, zMax } = basemapMeta.bounds;
  const lat0 = route.origin.lat;
  const lon0 = route.origin.lon;

  // Pick a zoom dense enough for this specific bbox before sampling — see
  // pickElevationZoom's comment for why a fixed zoom aliased on short climbs.
  const corners = [
    unproject(xMin, zMin, lat0, lon0),
    unproject(xMax, zMin, lat0, lon0),
    unproject(xMin, zMax, lat0, lon0),
    unproject(xMax, zMax, lat0, lon0),
  ];
  const latMin = Math.min(...corners.map((c) => c.lat));
  const latMax = Math.max(...corners.map((c) => c.lat));
  const lonMin = Math.min(...corners.map((c) => c.lon));
  const lonMax = Math.max(...corners.map((c) => c.lon));
  const zoom = pickElevationZoom(latMin, latMax, lonMin, lonMax);

  console.log(`${slug}: sampling ${GRID_N}x${GRID_N} elevation grid over ${((xMax - xMin) / 1000).toFixed(1)}x${((zMax - zMin) / 1000).toFixed(1)}km at zoom ${zoom}...`);

  const elevations: number[][] = [];
  for (let j = 0; j < GRID_N; j++) {
    const row: number[] = [];
    for (let i = 0; i < GRID_N; i++) {
      const x = xMin + ((xMax - xMin) * i) / (GRID_N - 1);
      const z = zMin + ((zMax - zMin) * j) / (GRID_N - 1);
      const { lat, lon } = unproject(x, z, lat0, lon0);
      row.push(await elevationAt(lat, lon, zoom));
    }
    elevations.push(row);
    if (j % 16 === 0) console.log(`  row ${j}/${GRID_N}, ${tileCache.size} tiles fetched so far`);
  }

  let min = Infinity, max = -Infinity;
  for (const row of elevations) for (const e of row) { min = Math.min(min, e); max = Math.max(max, e); }
  console.log(`  elevation range: ${min.toFixed(0)}m - ${max.toFixed(0)}m, ${tileCache.size} unique tiles fetched`);

  const out = { slug, gridN: GRID_N, bounds: { xMin, xMax, zMin, zMax }, elevations };
  const outPath = join(BASEMAPS_DIR, `${slug}.terrain.json`);
  writeFileSync(outPath, JSON.stringify(out));
  uploadBasemapAsset(outPath, `${slug}.terrain.json`, 'application/json');
  const terrainVersion = contentHash(outPath);

  // Fold terrainVersion into the shared manifest (basemapMeta, read above)
  // without disturbing webpVersion/bounds — same cache-busting scheme as
  // build-climb-basemaps.ts's own webpVersion, so a terrain-only rebuild
  // (independent of the basemap image) still reaches every client, not just
  // new ones. See uploadBasemapToR2.ts's IMMUTABLE_CACHE_CONTROL comment.
  const manifestPath = join(BASEMAPS_DIR, `${slug}.json`);
  writeFileSync(manifestPath, JSON.stringify({ ...basemapMeta, terrainVersion }, null, 2));
  uploadBasemapAsset(manifestPath, `${slug}.json`, 'application/json', MANIFEST_CACHE_CONTROL);

  // manifestPath is rewritten after outPath (terrainVersion is derived from
  // outPath's own content hash), which otherwise leaves the manifest with a
  // newer mtime than terrain.json — isUpToDate() would then see this climb
  // as stale again on the very next run. Bump outPath's mtime to now so a
  // freshly-built terrain is correctly recognised as up to date.
  const now = new Date();
  utimesSync(outPath, now, now);

  console.log(`  -> ${outPath} (v${terrainVersion}, uploaded to R2)`);
}

// Incremental by default, same reasoning as build-climb-basemaps.ts — this
// walks every climb every run otherwise. mtime comparison against the
// basemap's own bounds sidecar also naturally covers the documented gotcha
// (terrain must be rebuilt whenever the basemap is, since tile-boundary
// snapping shifts the bounds slightly): a freshly-rebuilt basemap has a
// newer mtime than a stale terrain.json, so it's picked up automatically.
// Force a full rebuild with FORCE=1 npx tsx scripts/build-climb-terrain.ts.
const FORCE = process.env.FORCE === '1';
// Scope a run to specific slugs (comma-separated) instead of every basemap
// in the staging dir — added 2026-09-15 while backfilling the 14 2027 TDF
// UK climbs, discovered mid-run that terrain had never been comprehensively
// built for the existing ~89-climb catalogue (isUpToDate() was failing open
// for nearly all of them), which is a real but separate backlog from that
// specific task. Omit SLUGS for the original full-catalogue behaviour.
const ONLY_SLUGS = process.env.SLUGS ? new Set(process.env.SLUGS.split(',').map((s) => s.trim())) : null;
function isUpToDate(slug: string): boolean {
  const outPath = join(BASEMAPS_DIR, `${slug}.terrain.json`);
  if (!existsSync(outPath)) return false;
  const inputMtime = statSync(join(BASEMAPS_DIR, `${slug}.json`)).mtimeMs;
  const outputMtime = statSync(outPath).mtimeMs;
  return outputMtime >= inputMtime;
}

async function main() {
  // One per basemap that's actually been built — building terrain before
  // the basemap exists would have no bounds to sample against.
  let slugs = readdirSync(BASEMAPS_DIR)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.terrain.json'))
    .map((f) => f.replace(/\.json$/, ''));
  if (ONLY_SLUGS) slugs = slugs.filter((s) => ONLY_SLUGS.has(s));
  let skipped = 0;
  let built = 0;
  const failed: string[] = [];
  for (const slug of slugs) {
    if (!FORCE && isUpToDate(slug)) {
      skipped++;
      continue;
    }
    try {
      await buildTerrain(slug);
      built++;
    } catch (e) {
      // One climb hitting a genuinely-missing tile (a real 404, not a
      // transient failure — those are retried inside fetchTile) must not
      // abort the rest of a full-catalogue run, and must not leave a
      // corrupt/partial terrain.json lying around for isUpToDate() to
      // later wave through as fine. Report it and move on.
      console.error(`  FAILED: ${slug}: ${e}`);
      failed.push(slug);
    }
  }
  console.log(`Built ${built}, skipped ${skipped} already-up-to-date (FORCE=1 to rebuild everything).`);
  if (failed.length > 0) {
    console.error(`${failed.length} climb(s) failed to build terrain: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
