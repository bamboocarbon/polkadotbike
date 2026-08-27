/**
 * Build-time tile mosaic (tasksheet Phase 2.1).
 *
 * For each data/climbs/routes/{slug}.json, fetches and stitches map tiles
 * covering the route's padded bounding box, burns in attribution, and
 * writes public/climbs/basemaps/{slug}.webp plus a sidecar {slug}.json
 * carrying the plane's world-space bounds (same local tangent-plane
 * projection as the route) so the in-scene ground plane aligns exactly.
 *
 * Run once, commit the output — never fetch tiles at runtime. Both tile
 * servers below are donation- or state-funded and rate-limited.
 * Run with: npx tsx scripts/build-climb-basemaps.ts
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const ROUTES_DIR = join(__dirname, '..', 'data', 'climbs', 'routes');
const OUT_DIR = join(__dirname, '..', 'public', 'climbs', 'basemaps');
const TILE_PX = 256;
const TARGET_PX = 4800;
const PAD_PCT = 0.35;
const MAX_BYTES = 2600 * 1024;
const FALLBACK_PX = 2048;
const USER_AGENT = 'PolkaDotBike-ClimbBasemap/1.0 (build-time tile fetch, one run per climb; +https://polkadotbike.com)';
const REQUEST_DELAY_MS = 60; // politeness gap between tile requests

interface TileSource {
  name: string;
  url: (z: number, x: number, y: number) => string;
  attribution: string;
}

// Preference order: Spain-specific cartography first, global fallback for
// anything IGN doesn't cover.
const SOURCES: TileSource[] = [
  {
    name: 'IGN MTN',
    url: (z, x, y) =>
      `https://www.ign.es/wmts/mapa-raster?service=WMTS&request=GetTile&version=1.0.0&layer=MTN&style=default&format=image/jpeg&tilematrixset=GoogleMapsCompatible&tilematrix=${z}&tilerow=${y}&tilecol=${x}`,
    attribution: 'Map: IGN España, CC-BY 4.0',
  },
  {
    name: 'OpenTopoMap',
    url: (z, x, y) => `https://a.tile.opentopomap.org/${z}/${x}/${y}.png`,
    attribution: 'Map: OpenTopoMap, CC-BY-SA',
  },
];

interface RoutePoint {
  lat: number;
  lon: number;
}
interface RouteData {
  slug: string;
  origin: { lat: number; lon: number };
  points: RoutePoint[];
}

function lonToTileX(lon: number, z: number): number {
  return ((lon + 180) / 360) * 2 ** z;
}
function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
}
function tileXToLon(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}
function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

// Same local tangent-plane projection as scripts/build-climb-routes.ts —
// must match exactly for the basemap plane to align with the route mesh.
function project(lat: number, lon: number, lat0: number, lon0: number): { x: number; z: number } {
  const x = (lon - lon0) * Math.cos((lat0 * Math.PI) / 180) * 111320;
  const z = -(lat - lat0) * 110540;
  return { x, z };
}

// Highest zoom whose padded-bbox pixel span still fits within TARGET_PX —
// "the zoom filling ~2048px" (1.2).
function pickZoom(latMin: number, latMax: number, lonMin: number, lonMax: number): number {
  for (let z = 18; z >= 5; z--) {
    const xPx = (lonToTileX(lonMax, z) - lonToTileX(lonMin, z)) * TILE_PX;
    const yPx = (latToTileY(latMin, z) - latToTileY(latMax, z)) * TILE_PX;
    if (Math.max(xPx, yPx) <= TARGET_PX) return z;
  }
  return 5;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTile(source: TileSource, z: number, x: number, y: number): Promise<Buffer | null> {
  try {
    const res = await fetch(source.url(z, x, y), { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// IGN España's WMTS still returns HTTP 200 + image/jpeg for tiles outside
// Spain (e.g. France) — a low-detail flat-colour placeholder, not a real
// "no coverage" error, so fetchTile's own ok+content-type check alone can't
// tell them apart from real cartography. Found on col-de-mont-louis (a
// French climb): the probe tile passed fetchTile fine and the basemap
// silently baked in blank placeholder tiles instead of falling back to
// OpenTopoMap. A byte-size floor was tried first but rejected genuine real
// tiles too (found on collada-de-beixalis: a legitimate but visually sparse
// 6.9KB in-Andorra tile got nulled by an 8KB floor, applied to every mosaic
// tile, not just the probe — that caused this rewrite). Per-pixel stddev is
// a much cleaner signal and was verified against 3 real tiles (Spain,
// Andorra, and that sparse one: mean stddev 42/42/19) vs 2 confirmed
// placeholder tiles (France, Italy: mean stddev 9/5) — real cartography has
// texture, a flat placeholder doesn't. Only ever called on the probe tile
// (one 256x256 decode per basemap), never on the ~50-350 tiles in the
// mosaic loop itself, so a real sparse tile deep in a genuinely-covered
// mosaic is never wrongly rejected.
// 2026-08-26: found a THIRD placeholder sample (col-de-la-griffoul, deep
// in the Massif Central — nowhere near Spain) with mean stddev 12.96,
// just above the original threshold of 12 — a real false-negative that
// let a visibly flat two-tone checkerboard placeholder through as "real
// cartography" (confirmed both by eye and by the resulting mosaic coming
// out a near-solid 18KB instead of the usual 900KB-2MB). Raised the
// threshold to 16 — comfortably above this new placeholder sample (12.96)
// and still comfortably below the lowest known real-tile sample (19, the
// sparse Andorra one), so this shouldn't reintroduce the byte-size floor's
// false-rejection problem.
const IGN_PROBE_MIN_STDDEV = 16;

async function looksLikeRealCartography(buf: Buffer): Promise<boolean> {
  const stats = await sharp(buf).stats();
  const meanStdev = stats.channels.reduce((sum, c) => sum + c.stdev, 0) / stats.channels.length;
  return meanStdev >= IGN_PROBE_MIN_STDDEV;
}

function attributionSvg(text: string, widthPx: number): Buffer {
  const barH = 22;
  return Buffer.from(
    `<svg width="${widthPx}" height="${barH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${widthPx}" height="${barH}" fill="rgba(0,0,0,0.55)"/>
      <text x="8" y="${barH - 7}" font-family="sans-serif" font-size="12" fill="#fff">${text}</text>
    </svg>`
  );
}

async function buildBasemap(slug: string): Promise<void> {
  const routePath = join(ROUTES_DIR, `${slug}.json`);
  const route: RouteData = JSON.parse(readFileSync(routePath, 'utf-8'));

  const lats = route.points.map((p) => p.lat);
  const lons = route.points.map((p) => p.lon);
  const rawLatMin = Math.min(...lats);
  const rawLatMax = Math.max(...lats);
  const rawLonMin = Math.min(...lons);
  const rawLonMax = Math.max(...lons);
  const latPad = (rawLatMax - rawLatMin) * PAD_PCT;
  const lonPad = (rawLonMax - rawLonMin) * PAD_PCT;
  const latMin = rawLatMin - latPad;
  const latMax = rawLatMax + latPad;
  const lonMin = rawLonMin - lonPad;
  const lonMax = rawLonMax + lonPad;

  const z = pickZoom(latMin, latMax, lonMin, lonMax);
  const xMinTile = Math.floor(lonToTileX(lonMin, z));
  const xMaxTile = Math.floor(lonToTileX(lonMax, z));
  const yMinTile = Math.floor(latToTileY(latMax, z)); // north = smaller y
  const yMaxTile = Math.floor(latToTileY(latMin, z));
  const cols = xMaxTile - xMinTile + 1;
  const rows = yMaxTile - yMinTile + 1;

  console.log(`${slug}: zoom ${z}, ${cols}x${rows} tiles (${cols * rows} total)`);

  // Climbs straddling the France/Spain border where IGN's real high-detail
  // coverage only reaches part of the route — found on gavarnie-gedre
  // (2026-08-27, Robin: "a lot of poor graphics at the beginning"): the
  // route runs from deep in France (Luz-Saint-Sauveur) down to right at
  // the Spanish border (Gavarnie). The probe tile (northwest corner of the
  // padded bbox, i.e. the French end) genuinely passed looksLikeRealCartography
  // — it isn't IGN's flat out-of-coverage placeholder, it's real but
  // visibly blurry/low-detail imagery (no roads, contours or labels,
  // confirmed by eye), so the existing stdev-based placeholder guard can't
  // catch it. The southern, in-Spain end of the SAME mosaic is genuinely
  // excellent IGN detail — a single probe tile can't tell "good everywhere"
  // from "good near the border, degraded further into France" apart, so
  // this is a manual override rather than a general fix. Add a slug here
  // if the same north/south quality split turns up on another
  // border-straddling climb.
  const FORCE_OPENTOPO_SLUGS = new Set(['gavarnie-gedre']);

  // Probe the first tile against the preferred source; fall back to the next
  // source for the whole mosaic rather than mixing cartography styles
  // within one image.
  let source = SOURCES[0];
  let probe = FORCE_OPENTOPO_SLUGS.has(slug) ? null : await fetchTile(source, z, xMinTile, yMinTile);
  if (probe && source.name === 'IGN MTN' && !(await looksLikeRealCartography(probe))) {
    probe = null; // valid HTTP response, but a flat out-of-coverage placeholder
  }
  if (!probe) {
    console.log(
      FORCE_OPENTOPO_SLUGS.has(slug)
        ? `  ${source.name} forced off for this slug (border-straddling quality split), using ${SOURCES[1].name}`
        : `  ${source.name} unavailable for this area, falling back to ${SOURCES[1].name}`
    );
    source = SOURCES[1];
    probe = await fetchTile(source, z, xMinTile, yMinTile);
    if (!probe) throw new Error(`${slug}: neither tile source responded for tile ${z}/${xMinTile}/${yMinTile}`);
  }
  console.log(`  using ${source.name}`);

  const mosaicW = cols * TILE_PX;
  const mosaicH = rows * TILE_PX;

  // Fetches every tile for a given source and composites the mosaic. Pulled
  // into a function because the probe-tile check below isn't sufficient on
  // its own (see MIN_REAL_MOSAIC_BYTES) — a bad IGN fetch needs the whole
  // mosaic rebuilt against OpenTopoMap instead, not just the one tile.
  async function buildMosaic(src: TileSource, firstTile: Buffer): Promise<Buffer> {
    const composites: { input: Buffer; left: number; top: number }[] = [
      { input: firstTile, left: 0, top: 0 },
    ];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (row === 0 && col === 0) continue; // already fetched as the probe
        const x = xMinTile + col;
        const y = yMinTile + row;
        await sleep(REQUEST_DELAY_MS);
        const buf = await fetchTile(src, z, x, y);
        if (!buf) {
          console.warn(`  WARNING ${slug}: tile ${z}/${x}/${y} failed, leaving gap`);
          continue;
        }
        composites.push({ input: buf, left: col * TILE_PX, top: row * TILE_PX });
      }
    }
    const attrBar = attributionSvg(src.attribution, mosaicW);
    const image = sharp({
      create: { width: mosaicW, height: mosaicH, channels: 3, background: { r: 235, g: 230, b: 220 } },
    }).composite([...composites, { input: attrBar, left: 0, top: mosaicH - 22 }]);
    return image.webp({ quality: 82 }).toBuffer();
  }

  let webp = await buildMosaic(source, probe);

  // The single-tile probe check above (looksLikeRealCartography) has a real
  // blind spot: IGN's out-of-coverage placeholder isn't always a flat
  // two-tone checkerboard (that's what the stdev threshold was tuned
  // against) — found on puy-mary-pas-de-peyrol a placeholder made of ~4
  // distinct flat colour blocks within one 256x256 tile, whose stdev (17.15)
  // read as "textured" against the threshold (16) despite being entirely
  // fake, and the resulting 91-tile mosaic came out at 18KB, ~20x smaller
  // than the smallest known-real mosaic (col-bayard, 340KB). A per-tile
  // edge-detail check was tried as a fix and rejected: gavarnie-gedre's own
  // probe corner (a real, healthy 597KB fetch) happens to land on genuinely
  // flat terrain with even less edge detail than this placeholder, so a
  // per-tile signal can't distinguish "flat corner in a real fetch" from
  // "flat placeholder" reliably in either direction. The whole-mosaic byte
  // size doesn't have that problem — a real fetch only has one locally-flat
  // corner among 60-350 tiles, so a placeholder-flooded mosaic (every tile
  // fake, only the map source is wrong) reads unambiguously smaller than
  // any genuine multi-tile fetch, comfortably below the observed floor.
  const MIN_REAL_MOSAIC_BYTES = 100 * 1024;
  if (source.name === 'IGN MTN' && webp.length < MIN_REAL_MOSAIC_BYTES) {
    console.log(
      `  WARNING ${slug}: IGN MTN mosaic came out ${(webp.length / 1024).toFixed(0)}KB (< ${(MIN_REAL_MOSAIC_BYTES / 1024).toFixed(0)}KB floor) — ` +
        `probe tile passed the stdev check but the whole mosaic looks like an out-of-coverage placeholder. Rebuilding with ${SOURCES[1].name}.`
    );
    source = SOURCES[1];
    const fallbackProbe = await fetchTile(source, z, xMinTile, yMinTile);
    if (!fallbackProbe) throw new Error(`${slug}: ${source.name} probe tile ${z}/${xMinTile}/${yMinTile} failed on placeholder-recovery retry`);
    webp = await buildMosaic(source, fallbackProbe);
    console.log(`  using ${source.name} (recovered from placeholder mosaic)`);
  }

  let outW = mosaicW;
  if (webp.length > MAX_BYTES) {
    // Fit within a FALLBACK_PX square, shrinking by whichever dimension is
    // actually larger — this climb's bbox is taller than it is wide, so a
    // width-only resize would have upscaled it (source narrower than
    // FALLBACK_PX) instead of shrinking the binding (height) dimension.
    console.log(`  ${(webp.length / 1024).toFixed(0)}KB exceeds ${(MAX_BYTES / 1024).toFixed(0)}KB, downscaling to fit ${FALLBACK_PX}px`);
    const resized = await sharp(webp)
      .resize({ width: FALLBACK_PX, height: FALLBACK_PX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    webp = resized;
    outW = (await sharp(resized).metadata()).width ?? FALLBACK_PX;
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${slug}.webp`), webp);

  // Exact geographic bounds of the stitched mosaic (snapped to whole tiles,
  // so slightly larger than the padded bbox), projected into the same
  // local tangent plane as the route so the in-scene plane lines up.
  const cornerLatMax = tileYToLat(yMinTile, z);
  const cornerLatMin = tileYToLat(yMaxTile + 1, z);
  const cornerLonMin = tileXToLon(xMinTile, z);
  const cornerLonMax = tileXToLon(xMaxTile + 1, z);
  const nw = project(cornerLatMax, cornerLonMin, route.origin.lat, route.origin.lon);
  const se = project(cornerLatMin, cornerLonMax, route.origin.lat, route.origin.lon);

  writeFileSync(
    join(OUT_DIR, `${slug}.json`),
    JSON.stringify(
      {
        slug,
        source: source.name,
        attribution: source.attribution,
        zoom: z,
        imageWidthPx: outW,
        bounds: { xMin: nw.x, xMax: se.x, zMin: nw.z, zMax: se.z },
      },
      null,
      2
    )
  );

  console.log(`  -> ${slug}.webp (${(webp.length / 1024).toFixed(0)}KB) + ${slug}.json`);
}

// Incremental by default -- this runs against every climb in ROUTES_DIR
// every time, and with dozens of climbs already (more once Tour/Giro and
// past years get added) a full rebuild means refetching every tile for
// every unchanged climb, several minutes and growing. Skip a climb whose
// basemap.webp is already newer than its route JSON; force a full rebuild
// (e.g. after a tile-source/rendering change, like the placeholder-tile fix)
// with FORCE=1 npx tsx scripts/build-climb-basemaps.ts.
const FORCE = process.env.FORCE === '1';
function isUpToDate(slug: string): boolean {
  const outPath = join(OUT_DIR, `${slug}.webp`);
  if (!existsSync(outPath)) return false;
  const inputMtime = statSync(join(ROUTES_DIR, `${slug}.json`)).mtimeMs;
  const outputMtime = statSync(outPath).mtimeMs;
  return outputMtime >= inputMtime;
}

async function main() {
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error(`No route JSON found in ${ROUTES_DIR} — run build-climb-routes.ts first.`);
    process.exit(1);
  }
  let skipped = 0;
  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    if (!FORCE && isUpToDate(slug)) {
      skipped++;
      continue;
    }
    await buildBasemap(slug);
  }
  if (skipped > 0) console.log(`Skipped ${skipped} already-up-to-date basemap(s) (FORCE=1 to rebuild everything).`);
}

main();
