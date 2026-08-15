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
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const ROUTES_DIR = join(__dirname, '..', 'data', 'climbs', 'routes');
const BASEMAPS_DIR = join(__dirname, '..', 'public', 'climbs', 'basemaps');
const GRID_N = 96; // vertices per axis — plenty for a stylised terrain mesh
const ELEV_ZOOM = 12; // Terrarium tiles are usable well below imagery zoom for a coarse grid
const USER_AGENT = 'PolkaDotBike-ClimbTerrainPOC/1.0 (+https://polkadotbike.com)';

function lonToTileX(lon: number, z: number): number {
  return ((lon + 180) / 360) * 2 ** z;
}
function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
}

// Inverse of build-climb-routes.ts's project() — must match exactly.
function unproject(x: number, z: number, lat0: number, lon0: number): { lat: number; lon: number } {
  const lon = lon0 + x / (Math.cos((lat0 * Math.PI) / 180) * 111320);
  const lat = lat0 - z / 110540;
  return { lat, lon };
}

const tileCache = new Map<string, Promise<{ data: Buffer; width: number } | null>>();
async function fetchTile(z: number, x: number, y: number): Promise<{ data: Buffer; width: number } | null> {
  const key = `${z}/${x}/${y}`;
  if (!tileCache.has(key)) {
    tileCache.set(
      key,
      (async () => {
        try {
          const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, {
            headers: { 'User-Agent': USER_AGENT },
          });
          if (!res.ok) return null;
          const buf = Buffer.from(await res.arrayBuffer());
          const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
          return { data, width: info.width };
        } catch {
          return null;
        }
      })()
    );
  }
  return tileCache.get(key)!;
}

async function elevationAt(lat: number, lon: number): Promise<number> {
  const xTile = lonToTileX(lon, ELEV_ZOOM);
  const yTile = latToTileY(lat, ELEV_ZOOM);
  const tx = Math.floor(xTile);
  const ty = Math.floor(yTile);
  const tile = await fetchTile(ELEV_ZOOM, tx, ty);
  if (!tile) return 0;
  const px = Math.min(tile.width - 1, Math.floor((xTile - tx) * tile.width));
  const py = Math.min(tile.width - 1, Math.floor((yTile - ty) * tile.width));
  const idx = (py * tile.width + px) * 3;
  const r = tile.data[idx];
  const g = tile.data[idx + 1];
  const b = tile.data[idx + 2];
  return r * 256 + g + b / 256 - 32768;
}

async function buildTerrain(slug: string) {
  const route = JSON.parse(readFileSync(join(ROUTES_DIR, `${slug}.json`), 'utf-8'));
  const basemapMeta = JSON.parse(readFileSync(join(BASEMAPS_DIR, `${slug}.json`), 'utf-8'));
  const { xMin, xMax, zMin, zMax } = basemapMeta.bounds;
  const lat0 = route.origin.lat;
  const lon0 = route.origin.lon;

  console.log(`${slug}: sampling ${GRID_N}x${GRID_N} elevation grid over ${((xMax - xMin) / 1000).toFixed(1)}x${((zMax - zMin) / 1000).toFixed(1)}km...`);

  const elevations: number[][] = [];
  let tileFetches = 0;
  for (let j = 0; j < GRID_N; j++) {
    const row: number[] = [];
    for (let i = 0; i < GRID_N; i++) {
      const x = xMin + ((xMax - xMin) * i) / (GRID_N - 1);
      const z = zMin + ((zMax - zMin) * j) / (GRID_N - 1);
      const { lat, lon } = unproject(x, z, lat0, lon0);
      row.push(await elevationAt(lat, lon));
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
  console.log(`  -> ${outPath}`);
}

// Incremental by default, same reasoning as build-climb-basemaps.ts — this
// walks every climb every run otherwise. mtime comparison against the
// basemap's own bounds sidecar also naturally covers the documented gotcha
// (terrain must be rebuilt whenever the basemap is, since tile-boundary
// snapping shifts the bounds slightly): a freshly-rebuilt basemap has a
// newer mtime than a stale terrain.json, so it's picked up automatically.
// Force a full rebuild with FORCE=1 npx tsx scripts/build-climb-terrain.ts.
const FORCE = process.env.FORCE === '1';
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
  const slugs = readdirSync(BASEMAPS_DIR)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.terrain.json'))
    .map((f) => f.replace(/\.json$/, ''));
  let skipped = 0;
  for (const slug of slugs) {
    if (!FORCE && isUpToDate(slug)) {
      skipped++;
      continue;
    }
    await buildTerrain(slug);
  }
  if (skipped > 0) console.log(`Skipped ${skipped} already-up-to-date terrain(s) (FORCE=1 to rebuild everything).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
