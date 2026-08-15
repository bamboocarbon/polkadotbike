/**
 * Build-time GPX -> route JSON converter (tasksheet Phase 1).
 *
 * For each data/climbs/routes/{slug}.gpx, produces data/climbs/routes/{slug}.json:
 * curvature-adaptive resampled points with a local tangent-plane projection,
 * roadbook-anchored elevation, per-point gradient, curvature radius and
 * bearing. Run with: npx tsx scripts/build-climb-routes.ts
 *
 * Resampling is adaptive, not uniform. A fixed 25m grid was tried first and
 * silently floors curvature: three points spaced d apart can never report a
 * circumradius below d/2 (R = d / (2*cos(beta/2)), beta->0 => R->d/2), so a
 * uniform 25m grid cannot report anything under 12.5m regardless of the
 * actual bend — a hairpin with an 8m true radius has an arc length of about
 * 25m, so the whole bend fits inside a single sample interval and gets
 * rendered as a kink. Spacing here instead tracks curvature computed on the
 * raw GPX points: tight bends get ~4m samples, straights get up to 30m.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const ROUTES_DIR = join(__dirname, '..', 'data', 'climbs', 'routes');
const SMOOTH_RADIUS_M = 75; // ~150m window, centred, applied by distance not sample count
const MIN_RADIUS_M = 5; // floor against near-zero-area (near-collinear) triples
const LENGTH_FAIL_PCT = 8;
const ASCENT_WARN_PCT = 12;
const ADAPTIVE_MAX_SPACING_M = 30;
const ADAPTIVE_MIN_SPACING_FLOOR_M = 1; // won't reduce the lower clamp below this
const ASSERTION_MULTIPLIER = 1.5;

// Per-climb roadbook anchors. The site's climb data (data/climbs.json) only
// stores a single summit altitude and an average gradient — no start
// altitude, no independently-sourced total-ascent figure, and (for this
// climb) no intermediate profile points at all. This table fills that gap
// by hand for now, sourced from the same VeloViewer segment / CyclingCols
// figures already reconciled into data/climbs.json's Velefique entry.
// Extend per-climb as more routes are converted; consider promoting this
// into data/climbs.json itself once the pattern repeats.
interface RoadbookAnchors {
  startElevationM: number;
  summitElevationM: number;
  lengthKm: number;
  ascentM: number;
}
const ROADBOOK_ANCHORS: Record<string, RoadbookAnchors> = {
  'alto-de-velefique': {
    startElevationM: 437, // VeloViewer segment min elevation (Tabernas side)
    summitElevationM: 1789, // CyclingCols summit figure; corroborated by
                             // Komoot's 5906ft (~1800m) contour at the pass
    lengthKm: 29.2, // VeloViewer segment distance
    ascentM: 1362, // VeloViewer segment elevation gain
  },
  'alto-de-aitana': {
    // RideWithGPS export with real embedded elevation per point (not a raw
    // BRouter/SRTM lookup like Velefique's first GPX needed correcting
    // against) — anchors taken directly from the GPX's own start/summit
    // rather than re-deriving from a third-party segment. Summit (1545m)
    // matches data/climbs.json's existing figure for this climb exactly;
    // length came out ~18.9km, notably shorter than that entry's old
    // (pre-GPX) 21.5km estimate — treated as the correct figure and the
    // site data updated to match, same as Velefique's own correction.
    startElevationM: 401,
    summitElevationM: 1545,
    lengthKm: 18.9,
    ascentM: 1259, // distance-weighted (100m) smoothed gain, not the raw noisy point-to-point sum
  },
  'alto-del-desierto-de-las-palmas': {
    // BRouter-Web export (same source as Velefique's original GPX). Site's
    // existing summit figure (418m) kept as the anchor since the GPX's own
    // raw summit (420.5m) is within 3m of it; start taken from the GPX (26m,
    // sea-level Benicàssim start, plausible for a coastal-town climb).
    // 2026-08-13: Robin spotted a real out-and-back spur around the 3km
    // mark on the rendered map (the track "hooks left then backtracks") —
    // 32 raw trkpts (indices 87-118) were a mirror-image detour up a
    // dead-end and back, confirmed by points 86 and 118 sharing identical
    // lat/lon/ele; removed from the GPX. Length dropped 8.55km -> 7.90km
    // and ascent 414m -> ~402m as a result (the original 8.55km/9.5km
    // progression was itself the earlier pre-GPX-correction figure).
    startElevationM: 26,
    summitElevationM: 418,
    lengthKm: 7.9,
    ascentM: 402, // distance-weighted (100m) smoothed gain, post spur-removal
  },
  'alto-del-legionario': {
    // BRouter-Web export, named "Dúrcal -> Albuñuelas" — a notably bigger
    // correction than the previous two: site's old estimate was 22km "via
    // Padul", this GPX is 28.16km via a different town. Kept anyway because
    // the elevation end-point (1332m) lands within 1% of the site's known
    // summit (1347m) — same pass, just a longer/different approach road.
    // Flagged prominently to Robin; not silently absorbed like the smaller
    // corrections on Aitana/Palmas.
    startElevationM: 760,
    summitElevationM: 1347, // kept the site's figure; GPX's own raw end (1332m) is within 1%
    lengthKm: 28.16,
    ascentM: 716, // distance-weighted (100m) smoothed gain
  },
  'collado-garcia': {
    // BRouter-Web export. Robin's raw file had a small rolling dip right
    // after its own start (down to a genuine global-min low point at
    // 0.84km) before the climb proper begins, and ~0.31km of gentle
    // descent after the summit -- trimmed to the low point through the
    // global max. Site's old figure (4.15km/4.8%) was itself flagged as
    // synthetic -- Komoot combining two separately-detected segments into
    // one guessed climb. Our GPX gives a real, meaningfully different
    // figure (4.84km/4.2%). Kept the site's existing summit figure (1239m)
    // since the GPX's own raw max (1246.5m) is within 0.6%.
    startElevationM: 1043,
    summitElevationM: 1239,
    lengthKm: 4.84,
    ascentM: 204,
  },
  'puerto-de-las-abejas': {
    // BRouter-Web export, no trim needed at either end -- the file's own
    // start is the global elevation min and its own summit (10.40km) is
    // the global max, ~1.03km before the file's own end (real "after the
    // top" padding). Clean, no spurs, no waypoints, one genuine ~39m
    // rolling dip near 4.3km checked and confirmed real terrain. There are
    // several distinct named approaches to this same pass (El Burgo,
    // Alozaina, Tolox) with different stats -- checked real-world sources
    // (altigraphs.com) and this GPX matches the Alozaina side almost
    // exactly (382m start/826m summit/10.48km vs our 376m/822.5m/10.40km).
    // The site's old summit figure (887m) doesn't match ANY of the three
    // known named approaches -- simply wrong. Used the GPX's own measured
    // summit instead, well corroborated by the Alozaina-side source.
    startElevationM: 376,
    summitElevationM: 823,
    lengthKm: 10.4,
    ascentM: 447,
  },
  'puerto-de-locubin': {
    // BRouter-Web export, minimal trim -- global min sits just 0.26km into
    // the file (a tiny dip right at the start), summit at 10.73km with a
    // real ~0.77km descent after it (trimmed). Clean, no spurs, no
    // waypoints, one genuine ~27m rolling dip near 1.8km checked and
    // confirmed real terrain (smooth monotonic coordinates). Site's
    // existing figure (10.1km/4.5%) corroborates closely: bottom-to-top
    // gives 10.48km/4.47%. Kept the site's existing summit figure (1085m);
    // GPX's own raw max (1093.25m) is within 0.8%.
    startElevationM: 626,
    summitElevationM: 1085,
    lengthKm: 10.48,
    ascentM: 468,
  },
  'puerto-de-granada': {
    // BRouter-Web export, no trimming needed at either end -- the file's
    // own start is the global elevation min and its own summit (12.08km)
    // is the global max, ~2.4km before the file's own end (real "after the
    // top" padding). Clean, no spurs, no waypoints. Site's old figure
    // (13.5km/3.3%) undershoots on gradient; real climb is shorter and
    // steeper. Kept the site's existing summit figure (1034m); GPX's own
    // raw max (1048.75m) is within 1.4%.
    startElevationM: 555,
    summitElevationM: 1034,
    lengthKm: 12.08,
    ascentM: 479,
  },
  'puerto-de-la-serratella': {
    // BRouter-Web export, near-perfectly monotonic climb (max reversal
    // 6.25m), no spurs, no waypoints. Site's existing figure (19.0km/3.3%)
    // corroborates closely: bottom-to-top gives 18.6km/3.38%, essentially
    // matching. Kept the site's existing summit figure (799m); GPX's own
    // raw max (807.5m) is within 1%.
    startElevationM: 179,
    summitElevationM: 799,
    lengthKm: 18.61,
    ascentM: 620,
  },
  'puerto-de-el-purche': {
    // BRouter-Web export. Robin's raw file is a full 19.9km loop planned
    // from Komoot (climbs to the summit, then descends a *different* road
    // that rejoins the original route before Huétor Vega) — only the climb
    // portion matters here, same physical col used for both the stage's
    // 1st and 2nd ascents. Site's old figure (6.96km/9.0%) didn't
    // self-corroborate against either obvious read of the GPX (measuring
    // the site's own distance back from the summit gave 7.6%; the real
    // last-major-low-point read gave 8.83km/7.85%) — checked real-world
    // sources (cyclefiesta.com), which cite 8.4km/8.0%, closely matching
    // the low-point read. Went with that. No spurs; one genuine ~38m
    // rolling dip near the summit ridge (18.5km) checked and confirmed
    // real terrain, not a routing artifact (smooth monotonic coordinates,
    // no retracing). Kept the site's existing summit figure (1483m);
    // GPX's own raw max (1492m) is within 0.6%.
    startElevationM: 799,
    summitElevationM: 1483,
    lengthKm: 8.83,
    ascentM: 684,
  },
  'puerto-de-barx': {
    // BRouter-Web export, near-perfectly monotonic climb (max reversal
    // 10.25m), no spurs, no waypoints -- cleanest of this batch. Site's old
    // figure (7.42km/4.0%/317m, from Komoot) undershoots on all counts.
    // Checked against climbfinder.com's independently-sourced figure
    // (8.6km/3.8%/349m from Simat) -- broadly corroborates the correction
    // direction (much closer to our GPX than the old figure) without
    // matching exactly, so trusted our own GPX measurement as the more
    // precise source, consistent with how every other climb in this batch
    // was anchored. GPX's own raw summit (385.5m) used directly since
    // neither third-party figure (317m or 349m) is close enough to prefer
    // over our own measured data.
    startElevationM: 43,
    summitElevationM: 386,
    lengthKm: 9.66,
    ascentM: 343,
  },
  'puerto-de-el-duque': {
    // BRouter-Web export. Robin's raw file has ~2km of descent right at its
    // own start before the true climb begins (a real lead-in, matching the
    // stage's own sequencing — Puerto de El Duque follows Puerto de El
    // Purche in the route, so a connecting descent before the low point is
    // expected). Trimmed to the global elevation min through the global
    // max. A tiny dead-end spur near the 4.7km mark removed (confirmed via
    // exact coordinate match). Site's old figure (4.8km/8.2%) was roughly
    // half the true length; kept the site's existing summit figure (1670m)
    // since the GPX's own raw max (1676.75m) is within 0.4%.
    startElevationM: 1023,
    summitElevationM: 1670,
    lengthKm: 8.28,
    ascentM: 647,
  },
  'puerto-de-el-miserat': {
    // BRouter-Web export. Site's old figure (18km/2.6%, "long and gradual")
    // turned out to be measuring the wrong thing entirely -- Robin checked
    // against the official Vuelta stage 9 profile chart, which places the
    // "Puerto de El Miserat" categorised col right after Pego, not as some
    // gentle 18km grind from further back. Confirmed geographically: this
    // GPX's own global elevation min (68.75m) reverse-geocodes exactly to
    // Pego. Real climb is the steep run from there to the summit -- a
    // small dead-end spur near the 5.7km mark removed (confirmed via exact
    // coordinate match). Kept the site's existing summit figure (634m);
    // GPX's own raw max (633.75m) is within 0.05%.
    startElevationM: 69,
    summitElevationM: 634,
    lengthKm: 7.22,
    ascentM: 565,
  },
  'penas-blancas': {
    // BRouter-Web export, no lead-in padding needed -- the file's own start
    // is genuinely sea level in Estepona (3.75m), matching the site's own
    // description. Two tiny genuine loops found and removed (both confirmed
    // via exact-coordinate matches): a small roundabout-style loop at the
    // 1.2km mark and a single-point blip at 3.87km. The real story here is
    // the summit figure: the site's old 1264m was simply wrong -- real-world
    // sources (myCols, PJAMM) put this climb's actual summit at ~1003m, and
    // our own GPX's raw max (973.25m) corroborates that closely, not the
    // stale 1264m figure. Used the GPX's own measured summit rather than
    // splitting the difference.
    startElevationM: 4,
    summitElevationM: 973,
    lengthKm: 18.5,
    ascentM: 970,
  },
  'port-denvalira': {
    // BRouter-Web export of the FULL climb from Andorra la Vella (39.7km,
    // Robin's raw file). Real profile has a genuine mid-route dip (down to
    // ~1112m around 8.6km) before the sustained final climb -- flagged to
    // Robin since the official 25.3km/5.1% didn't self-corroborate tightly
    // either measuring back from the summit (near Les Bons, Encamp: 4.72%)
    // or from the true valley-floor low point (raw 27.98km: 4.63%). Robin
    // chose the true low point. The largest spur-cleanup job of the set so
    // far -- FOUR separate BRouter routing artifacts found and removed
    // between the low point and the summit (confirmed via exact-coordinate
    // matches, not just proximity): a tangled double-loop junction around
    // 15.3-16.0km, a small dead-end near 16.5km, a ~600m detour-and-repeat
    // around 20.1-21.5km (the router walked the same ~580m stretch twice),
    // and a small dead-end near 33.6km. After cleanup the length dropped
    // from the raw 27.98km to 25.78km at 5.03% -- now a close match to the
    // site's original 25.3km/5.1km after all. Kept the site's summit figure
    // (2409m); GPX's own raw max (2407.75m) is within 0.05%.
    startElevationM: 1112,
    summitElevationM: 2409,
    lengthKm: 25.78,
    ascentM: 1296,
  },
  'font-romeu': {
    // BRouter-Web export, no padding needed on either end — the file's own
    // start is the global elevation min and its own end is the global max,
    // near-perfectly monotonic (max reversal 3.5m). Site's old figure
    // (9.87km/4.5%) carried its own caveat ("best-guess match by position —
    // not independently cross-checked"); our GPX gives 8.65km, a real
    // correction. Kept the site's summit figure (1937m); GPX's own raw end
    // (1940.5m) is within 0.2%.
    startElevationM: 1494,
    summitElevationM: 1937,
    lengthKm: 8.65,
    ascentM: 447,
  },
  'collado-del-alguacil': {
    // BRouter-Web export of the FULL climb from ~800m near La Calahorra
    // (18.5km, Robin's raw file) — the site's figure for this one is
    // explicitly labelled "official" (organiser-published: 8.3km at 9.8%,
    // stage 20's summit finish), not a third-party estimate, so rather than
    // trim to the GPX's own global elevation min (which would give a much
    // longer, gentler 16.8km/6.7% climb covering unrelated earlier terrain
    // on the same road), measured the official 8.3km back from the GPX's
    // own summit instead — same method as Mont-Louis. Self-corroborating
    // here (unlike Mont-Louis): the resulting start point (1071.5m) gives
    // 9.90% average gradient over 8.30km, essentially an exact match to the
    // published 9.8%/8.3km, so proceeded without needing to check with
    // Robin. Kept the site's summit figure (1884m); GPX's own raw max
    // (1893m) is within 0.5%. Near-perfectly monotonic climb, max reversal
    // under 2m — cleanest GPX of the set so far, no spur cleanup needed.
    startElevationM: 1072,
    summitElevationM: 1884,
    lengthKm: 8.3,
    ascentM: 812,
  },
  'collada-de-beixalis': {
    // BRouter-Web export. Robin's raw file had a small dip right after its
    // own start (down to a genuine global-min low point at 0.18km) before
    // the climb proper begins, and ~0.30km of gentle descent after the
    // summit — trimmed to the low point through the global max. A tiny
    // exact-coordinate loop near the 0.75km mark (~50m round trip, <2m
    // elevation change) checked and left alone, same call as Coll d'Ordino's
    // — consistent with a real small loop/roundabout, not a routing spur.
    // Kept the site's existing summit figure (1803m) since the GPX's own
    // raw max (1795.5m) is within 0.5%.
    startElevationM: 1218,
    summitElevationM: 1803,
    lengthKm: 7.1,
    ascentM: 578, // net rise; max reversal only 3m along the whole climb
  },
  'coll-dordino': {
    // BRouter-Web export. The file's own start is already the true bottom
    // of the climb (global elevation min, no lead-in to trim) — trimmed
    // only ~0.32km of padding after the summit (global max, 1983m). A
    // small exact-coordinate loop near the 0.4km mark (~60m out-and-back,
    // <2m elevation change) was checked but left alone — unlike the Palmas/
    // Mont-Louis spurs, only 2 points coincide exactly (not a long mirrored
    // sequence), consistent with a real tight loop/roundabout in the road
    // rather than a routing artifact, and its effect on length/ascent is
    // negligible either way. Kept the site's existing summit figure (1989m)
    // since the GPX's own raw max (1983m) is within 0.3%.
    startElevationM: 1264,
    summitElevationM: 1989,
    lengthKm: 10.3,
    ascentM: 719, // net rise; max reversal only 3m along the whole climb
  },
  'col-de-mont-louis': {
    // BRouter-Web export of the FULL climb from sea level (71.8km, Robin's
    // raw file) — Komoot's own categorised-climb distance is only 12.2mi
    // (19.63km), and Robin asked to locate that distance back from the
    // summit rather than guess a start from the profile shape. That point
    // (743.75m) lands near Canaveilles, ~16.6km short of Prades (which
    // Robin had floated as a guess but the numbers don't support — Prades
    // is 38.4km from the summit, roughly double Komoot's figure). Robin
    // confirmed: use the Canaveilles/Komoot-distance point literally.
    // Two real out-and-back spurs found and removed from the raw GPX in
    // this region (same bug class as Palmas): an exact duplicate-coordinate
    // dead-end near Canaveilles (idx 1596<->1692, BRouter looped out to a
    // 785m apex and back) and a smaller one near the summit (idx
    // 2521<->2539, 1561m plateau, ~166m round trip). Removing both dropped
    // the naive 19.65km trim to a real 18.32km — length figure below
    // reflects the cleaned route, not the raw distance-from-summit figure.
    startElevationM: 744,
    summitElevationM: 1570, // kept the site's figure; GPX's own raw end (1574-1575m) is within 0.3%
    lengthKm: 18.32,
    ascentM: 831, // net rise; one ~22m rolling dip near Canaveilles, otherwise clean post-spur-removal
  },
  'calar-alto': {
    // BRouter-Web export, Robin's raw file padded both ends — a ~4.7km
    // lead-in from the Velefique-side descent before the true climb starts
    // (a clear valley low point matching the roadbook's known Bacares
    // altitude of ~1,197m almost exactly) and a further ~1.3km of
    // observatory-access road after the true summit before the file ends.
    // Trimmed to the global elevation min (1179.5m, Bacares) through the
    // global elevation max (2154m, matches the site's existing 2153m
    // summit figure within 1m — kept that figure). Small correction vs the
    // old Komoot-chart estimate (18.19km/5.15% -> 17.99km/5.42%).
    startElevationM: 1180,
    summitElevationM: 2153,
    lengthKm: 17.99,
    ascentM: 975, // net rise; one ~26m rolling dip near Bacares, otherwise clean
  },
  'aramon-valdelinares': {
    // BRouter-Web export, Robin's raw file padded ~4.4km before the true
    // start (a rolling lead-in that dips to a clear valley low point) and
    // ends right at the summit with no padding after. Trimmed the GPX to
    // start at that low point (1379.75m, the route's global elevation
    // minimum — confirmed no lower point exists anywhere else on the raw
    // track) through to the final point. Kept the site's existing summit
    // figure (1961m) since the GPX's own raw end (1970m) is within 0.5%.
    startElevationM: 1380,
    summitElevationM: 1961,
    lengthKm: 10.05,
    ascentM: 590, // net rise; no other reversals >5m along the trimmed climb
  },
  'puerto-del-viento': {
    // BRouter-Web export, ~1.77km of rolling lead-in trimmed off the front
    // (rises then dips back down to the route's global elevation minimum,
    // 553m) through to the global max (1071m, 15.55km), ~0.27km before the
    // file's own end (real "after the top" padding, trimmed). Clean, no
    // spurs, no waypoints. Bottom-to-top gives 13.77km/3.76% -- matches the
    // site's existing figure (13.8km/3.8%) almost exactly. Kept the site's
    // existing summit figure (1078m); GPX's own raw max (1071m) is within
    // 0.7%.
    startElevationM: 553,
    summitElevationM: 1078,
    lengthKm: 13.77,
    ascentM: 631, // cumulative (script-derived) -- rolling terrain along the climb means this exceeds the simple net rise (525m)
  },
  'puerto-de-tudons': {
    // BRouter-Web export, ~2.02km of rolling lead-in trimmed off the front
    // (dips to the route's global elevation minimum, 478m) through to the
    // global max (1026m, 15.30km), ~0.14km before the file's own end (real
    // "after the top" padding, trimmed). Clean, no spurs, no waypoints.
    // Bottom-to-top gives 13.29km/4.13% -- the summit (1026m) matches the
    // site's existing figure (1027m) almost exactly, confirming it's the
    // same pass, but the site's existing length/gradient (4.99km/6%) is
    // deliberately just the final categorised segment (its own note says
    // so: "not the much longer climb-from-the-stage-start figure
    // CyclingCols lists"). This GPX IS that longer full climb. Flagged for
    // Robin -- used the GPX's own full bottom-to-top figures here since
    // that's the established convention for the 3D visualiser, but the
    // Vuelta stage-card text/data still shows the old short-segment number
    // and may want reconciling.
    startElevationM: 478,
    summitElevationM: 1026,
    lengthKm: 13.29,
    ascentM: 623, // cumulative (script-derived) -- rolling terrain along the climb means this exceeds the simple net rise (548m)
  },
  'puerto-de-tarbena': {
    // Revised per Robin: the first ~5km (from the coastal-side start down
    // through Callosa d'En Sarrià) is a gentle rolling lead-in, not the
    // real climb -- he asked to shorten the route to start in the village
    // of Bolulla, ~5km along the original file. Reverse-geocode confirmed
    // Bolulla centres around 38.676,-0.110 (matches the route around
    // 4.95km); trimmed to the true local elevation minimum just past the
    // village (194.5m at 5.18km of the original file) through to the
    // existing, unchanged summit (593.8m). Bottom-to-top now gives
    // 6.92km/5.77% -- closely matches independent research (climbfinder /
    // official Vuelta Stage 9 profile: 7.2km/5.4%, Cat2, "preceded by an
    // uncategorised 1.7km/6.3% ramp"), i.e. this now reflects the real
    // officially-categorised climb rather than the fuller coastal approach.
    startElevationM: 195,
    summitElevationM: 594,
    lengthKm: 6.92,
    ascentM: 399,
  },
  'puerto-de-san-rafael': {
    // BRouter-Web export, no trim needed at the bottom (file's own start,
    // 1025m, is effectively the global minimum already) -- trimmed the
    // descent after the summit (13.73km-14.51km file end, dropping to
    // 1511m). Clean, no spurs, no waypoints. Bottom-to-top gives
    // 13.73km/3.90%, closely matching the site's existing figure
    // (14.2km/3.7%/1558m -- "long false-flat approach" before Valdelinares)
    // to within 3%. Kept the site's existing summit figure (1558m); GPX's
    // own raw max (1561m) is within 0.2%.
    startElevationM: 1025,
    summitElevationM: 1558,
    lengthKm: 13.73,
    ascentM: 533,
  },
  'puerto-de-los-villares': {
    // BRouter-Web export, no trim needed at the bottom (file's own start,
    // 598m, is effectively the global minimum already) -- trimmed the
    // descent after the summit plateau (11.17km-12.66km file end, dropping
    // to 1148m). Clean, no spurs, no waypoints. Bottom-to-top gives
    // 11.17km/5.29%, closely matching the site's existing figure
    // (11.4km/5.2%/1180m). Kept the site's existing summit figure (1180m);
    // GPX's own raw max (1189m) is within 0.8%.
    startElevationM: 598,
    summitElevationM: 1180,
    lengthKm: 11.17,
    ascentM: 591,
  },
  'puerto-el-bartolo': {
    // BRouter-Web export (Robin's file misnamed "bartalo" -- real name is
    // Monte Bartolo / Puerto El Bartolo, Castellón). No trim needed at the
    // bottom (file's own start, 10m, is the global minimum -- essentially
    // sea level). Trimmed the descent after the summit (10.88km-11.40km
    // file end, dropping ~48m) -- Robin confirmed this is ordinary
    // after-the-top padding, not the "don't cut the dip" case that applies
    // to Sierra de la Pandera. Bottom-to-top gives 10.88km/6.51%, closely
    // matching the site's existing figure (11.7km/6%/713m -- itself already
    // well corroborated by external sources, altigraphs.com/altimetrias.net
    // agree 10.3-11.7km/6.4-6.6%/713-735m). Kept the site's existing summit
    // figure (713m); GPX's own raw max (718.5m) is within 0.8%. The final
    // ~3km genuinely turns to unpaved gravel/dirt track before the summit
    // -- a real, confirmed first for a Vuelta stage (2026 Stage 6).
    startElevationM: 10,
    summitElevationM: 713,
    lengthKm: 10.88,
    ascentM: 703,
  },
  'puerto-el-remolcador': {
    // BRouter-Web export. Robin: this climb starts from a lower town than
    // the site's existing (much shorter) figure reflects -- confirmed
    // deliberate, not padding to trim. Trimmed only a small ~14m dip right
    // at the very start (0km-0.47km, the road leaving town) to the route's
    // true global minimum, and the descent after the summit (15.50km file
    // end, dropping ~18m). Clean, no spurs, no waypoints. Bottom-to-top
    // gives 15.03km/4.31% -- summit (986.5m) matches the site's existing
    // figure (982m) closely, but length/gradient are a real, substantial
    // correction (previously 10.3km/4.2%, evidently just the final segment).
    startElevationM: 339,
    summitElevationM: 982,
    lengthKm: 15.03,
    ascentM: 648, // cumulative -- see script warning threshold if this needs revising after a build run
  },
  'sierra-de-la-pandera': {
    // BRouter-Web export. Robin: this route is "routed right to the exact
    // finish point" -- the file's own end (1817.8m, 3m below the technical
    // high point 0.08km earlier) IS the real stage finish, a deliberate
    // instruction not to trim back to the local elevation max. Trimmed only
    // the lead-in before the true global minimum (0km-1.95km, a genuine
    // rolling dip that bottoms out at 903.8m) -- confirmed real terrain, not
    // a spur (smooth monotonic coordinates). Clean, no spurs, no waypoints.
    // Bottom-to-top gives 12.52km/7.30%, a real, substantial correction from
    // the site's existing figure (8.4km/7.8%/1797m, evidently just the
    // final categorised segment). Steepest ~100m window measured at 18.6%,
    // located roughly two-thirds up the trimmed climb (not in the final
    // kilometre, which is comparatively gentle) -- corroborates the site's
    // "touches 18%" claim but not its "final kilometre" framing, so the
    // descriptive note and per-km profile were rewritten to match. Used the
    // GPX's own summit figure (1818m) per Robin's explicit instruction that
    // this route is the authoritative finish-line trace.
    startElevationM: 904,
    summitElevationM: 1818,
    lengthKm: 12.52,
    ascentM: 913,
  },
  'venta-de-la-cebada': {
    // BRouter-Web export, minimal trim -- global min sits just 0.10km into
    // the file (a tiny dip right at the start), summit at 7.86km with a
    // real ~8m descent after it (trimmed). Clean, no spurs, no waypoints.
    // Bottom-to-top gives 7.76km/6.54%, closely matching the site's
    // existing figure (7.4km/6.7%/819m). Kept the site's existing summit
    // figure (819m); GPX's own raw max (823m) is within 0.5%.
    startElevationM: 316,
    summitElevationM: 819,
    lengthKm: 7.76,
    ascentM: 503,
  },
};

interface GpxPoint {
  lat: number;
  lon: number;
  ele: number | null;
}

interface RoutePoint {
  lat: number;
  lon: number;
  x: number;
  z: number;
  distanceM: number;
  elevationM: number;
  gradientPct: number;
  radiusM: number;
  bearingDeg: number;
}

interface RouteOutput {
  slug: string;
  elevationSource: string;
  lengthM: number;
  ascentM: number;
  origin: { lat: number; lon: number };
  points: RoutePoint[];
}

function parseGpx(path: string): GpxPoint[] {
  const xml = readFileSync(path, 'utf-8');
  const pts: GpxPoint[] = [];
  // Split on the opening tag rather than a single combined regex — trkpt
  // appears both self-closing (<trkpt .../>, seen on BRouter-Web's very
  // first point, which lacks <ele>) and as a full element with children,
  // and matching both shapes in one pattern is fragile.
  const chunks = xml.split('<trkpt').slice(1);
  for (const chunk of chunks) {
    const latM = chunk.match(/lat="(-?[\d.]+)"/);
    const lonM = chunk.match(/lon="(-?[\d.]+)"/);
    if (!latM || !lonM) continue;
    const eleM = chunk.match(/<ele>(-?[\d.]+)<\/ele>/);
    pts.push({
      lat: parseFloat(latM[1]),
      lon: parseFloat(lonM[1]),
      ele: eleM ? parseFloat(eleM[1]) : null,
    });
  }
  return pts;
}

const EARTH_R = 6371000;
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(a));
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Local tangent plane, metres, north-up. Not Web Mercator: at ~37N that
// distorts scale by ~1.25x and the road shape would be visibly wrong over a
// 30km climb (tasksheet 1.2).
function project(lat: number, lon: number, lat0: number, lon0: number): { x: number; z: number } {
  const x = (lon - lon0) * Math.cos((lat0 * Math.PI) / 180) * 111320;
  const z = -(lat - lat0) * 110540;
  return { x, z };
}

function circumradius(p1: { x: number; z: number }, p2: { x: number; z: number }, p3: { x: number; z: number }): number {
  const a = Math.hypot(p3.x - p2.x, p3.z - p2.z);
  const b = Math.hypot(p3.x - p1.x, p3.z - p1.z);
  const c = Math.hypot(p2.x - p1.x, p2.z - p1.z);
  const area = Math.abs((p2.x - p1.x) * (p3.z - p1.z) - (p3.x - p1.x) * (p2.z - p1.z)) / 2;
  if (area < 1e-6) return 100000; // effectively straight
  return Math.max(MIN_RADIUS_M, (a * b * c) / (4 * area));
}

// Distance-weighted moving average over a piecewise-linear elevation curve
// (trapezoidal integral / window width), NOT a per-sample arithmetic mean.
// With adaptive/variable spacing, an unweighted mean over-represents
// whichever side of the window happens to be more densely sampled — at a
// dense-to-sparse transition (e.g. leaving a tight bend), that pulls the
// smoothed curve toward the dense cluster's elevation and manufactures a
// fake steep segment right where sampling density changes, not where the
// terrain does.
function distanceWeightedSmooth(pts: { distanceM: number; ele: number }[], radiusM: number): number[] {
  const n = pts.length;
  const cumArea = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dx = pts[i].distanceM - pts[i - 1].distanceM;
    cumArea[i] = cumArea[i - 1] + ((pts[i - 1].ele + pts[i].ele) / 2) * dx;
  }
  const totalM = pts[n - 1].distanceM;

  function areaAt(d: number, hint: number): { area: number; nextHint: number } {
    let i = hint;
    while (i < n - 2 && pts[i + 1].distanceM < d) i++;
    const d0 = pts[i].distanceM;
    const d1 = pts[i + 1].distanceM;
    const e0 = pts[i].ele;
    const e1 = pts[i + 1].ele;
    const f = d1 > d0 ? (d - d0) / (d1 - d0) : 0;
    const eAtD = e0 + (e1 - e0) * f;
    return { area: cumArea[i] + ((e0 + eAtD) / 2) * (d - d0), nextHint: i };
  }

  const out = new Array<number>(n);
  let loHint = 0;
  let hiHint = 0;
  for (let i = 0; i < n; i++) {
    const wLo = Math.max(0, pts[i].distanceM - radiusM);
    const wHi = Math.min(totalM, pts[i].distanceM + radiusM);
    const lo = areaAt(wLo, loHint);
    const hi = areaAt(wHi, hiHint);
    loHint = lo.nextHint;
    hiHint = hi.nextHint;
    out[i] = (hi.area - lo.area) / (wHi - wLo);
  }
  return out;
}

function buildRoute(slug: string, gpxPath: string): RouteOutput {
  const anchors = ROADBOOK_ANCHORS[slug];
  if (!anchors) {
    throw new Error(
      `No roadbook anchors defined for "${slug}" in ROADBOOK_ANCHORS — add start/summit ` +
        `elevation, length and ascent before converting this climb.`
    );
  }

  const raw = parseGpx(gpxPath).filter((p) => p.ele !== null) as (GpxPoint & { ele: number })[];
  if (raw.length < 2) throw new Error(`${slug}: GPX has too few points with elevation`);

  // Cumulative distance along the raw polyline (1.1.3).
  const rawCumDist: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    rawCumDist.push(rawCumDist[i - 1] + haversineM(raw[i - 1].lat, raw[i - 1].lon, raw[i].lat, raw[i].lon));
  }
  const rawLengthM = rawCumDist[rawCumDist.length - 1];
  const rawLengthKm = rawLengthM / 1000;
  const lengthDisagreementPct = (Math.abs(rawLengthKm - anchors.lengthKm) / anchors.lengthKm) * 100;
  if (lengthDisagreementPct > LENGTH_FAIL_PCT) {
    throw new Error(
      `${slug}: GPX length ${rawLengthKm.toFixed(2)}km disagrees with roadbook ` +
        `${anchors.lengthKm}km by ${lengthDisagreementPct.toFixed(1)}% (>${LENGTH_FAIL_PCT}%) — wrong GPX, not a data quirk.`
    );
  }

  // Project raw points once (1.2). Origin = first point.
  const lat0 = raw[0].lat;
  const lon0 = raw[0].lon;
  const rawProjected = raw.map((p) => project(p.lat, p.lon, lat0, lon0));

  // Curvature on the RAW points first (Step 2) — this is what the adaptive
  // spacing profile is built from, before any resampling has a chance to
  // flatten a bend.
  const rawRadius: number[] = raw.map((_, i) => {
    const p1 = rawProjected[Math.max(0, i - 1)];
    const p2 = rawProjected[i];
    const p3 = rawProjected[Math.min(raw.length - 1, i + 1)];
    return circumradius(p1, p2, p3);
  });

  function bracketIndex(cumDist: number[], d: number, hint: number): number {
    let i = hint;
    while (i < cumDist.length - 2 && cumDist[i + 1] < d) i++;
    return i;
  }

  function interpAt(d: number, hint: number): { lat: number; lon: number; ele: number; radius: number; nextHint: number } {
    const i = bracketIndex(rawCumDist, d, hint);
    const d0 = rawCumDist[i];
    const d1 = rawCumDist[i + 1];
    const f = d1 > d0 ? (d - d0) / (d1 - d0) : 0;
    const p0 = raw[i];
    const p1 = raw[i + 1];
    const r0 = rawRadius[i];
    const r1 = rawRadius[i + 1];
    return {
      lat: p0.lat + (p1.lat - p0.lat) * f,
      lon: p0.lon + (p1.lon - p0.lon) * f,
      ele: p0.ele + (p1.ele - p0.ele) * f,
      radius: r0 + (r1 - r0) * f,
      nextHint: i,
    };
  }

  // Adaptive march (Step 2), with a retry loop (Step 3): if the resulting
  // min radius still sits near half the local spacing, that's the same
  // resampling-floor artefact at a finer resolution — lower the clamp and
  // try again, rather than trusting a number produced by the floor itself.
  let lowerClampM = 4;
  let finalPoints: RoutePoint[] | null = null;
  let finalAscentM = 0;
  let attempt = 0;

  while (!finalPoints) {
    attempt++;
    const resampled: { lat: number; lon: number; ele: number; distanceM: number }[] = [];
    let d = 0;
    let hint = 0;
    while (d < rawLengthM) {
      const s = interpAt(d, hint);
      hint = s.nextHint;
      resampled.push({ lat: s.lat, lon: s.lon, ele: s.ele, distanceM: d });
      const targetSpacing = Math.min(ADAPTIVE_MAX_SPACING_M, Math.max(lowerClampM, s.radius / 3));
      d += targetSpacing;
    }
    const last = interpAt(rawLengthM, hint);
    resampled.push({ lat: last.lat, lon: last.lon, ele: last.ele, distanceM: rawLengthM });

    // Smooth elevation with a true ~150m distance-weighted window (1.1.2,
    // 1.3.2) — see distanceWeightedSmooth for why this can't be a per-sample
    // mean once spacing is variable.
    const smoothed: number[] = distanceWeightedSmooth(resampled, SMOOTH_RADIUS_M);

    // Anchor and rescale (1.3.3-1.3.4): a single linear transform mapping
    // the GPX's own start and summit (its running maximum) onto the
    // roadbook's start/summit altitudes, applied to every point.
    let peakIdx = 0;
    for (let i = 1; i < smoothed.length; i++) if (smoothed[i] > smoothed[peakIdx]) peakIdx = i;
    const gpxStart = smoothed[0];
    const gpxSummit = smoothed[peakIdx];
    const scale = (anchors.summitElevationM - anchors.startElevationM) / (gpxSummit - gpxStart);
    const offset = anchors.startElevationM - scale * gpxStart;
    const rescaled = smoothed.map((e) => scale * e + offset);

    let ascentM = 0;
    for (let i = 1; i < rescaled.length; i++) ascentM += Math.max(0, rescaled[i] - rescaled[i - 1]);

    const projected = resampled.map((p) => project(p.lat, p.lon, lat0, lon0));

    const points: RoutePoint[] = resampled.map((p, i) => {
      const prev = projected[Math.max(0, i - 1)];
      const cur = projected[i];
      const next = projected[Math.min(projected.length - 1, i + 1)];
      const radiusM = circumradius(prev, cur, next);

      const bLat = resampled[Math.min(resampled.length - 1, i + 1)].lat;
      const bLon = resampled[Math.min(resampled.length - 1, i + 1)].lon;
      const bearing =
        i === resampled.length - 1
          ? bearingDeg(resampled[i - 1].lat, resampled[i - 1].lon, p.lat, p.lon)
          : bearingDeg(p.lat, p.lon, bLat, bLon);

      const gi0 = Math.max(0, i - 1);
      const gi1 = Math.min(resampled.length - 1, i + 1);
      const dElev = rescaled[gi1] - rescaled[gi0];
      const dDist = resampled[gi1].distanceM - resampled[gi0].distanceM;
      const gradientPct = dDist > 0 ? (dElev / dDist) * 100 : 0;

      return {
        lat: p.lat,
        lon: p.lon,
        x: cur.x,
        z: cur.z,
        distanceM: p.distanceM,
        elevationM: rescaled[i],
        gradientPct,
        radiusM,
        bearingDeg: bearing,
      };
    });

    // Step 3 assertion: the floor is no longer binding if the min radius
    // clears 1.5x half the LOCAL spacing around that same point (not a
    // global or absolute number).
    let minIdx = 0;
    for (let i = 1; i < points.length; i++) if (points[i].radiusM < points[minIdx].radiusM) minIdx = i;
    const prevGap = minIdx > 0 ? points[minIdx].distanceM - points[minIdx - 1].distanceM : Infinity;
    const nextGap = minIdx < points.length - 1 ? points[minIdx + 1].distanceM - points[minIdx].distanceM : Infinity;
    const localSpacing = Math.min(prevGap, nextGap);
    const floorBound = (localSpacing / 2) * ASSERTION_MULTIPLIER;

    console.log(
      `  attempt ${attempt} (lowerClamp=${lowerClampM}m): ${points.length} points, ` +
        `min radius ${points[minIdx].radiusM.toFixed(1)}m at local spacing ${localSpacing.toFixed(1)}m ` +
        `(need > ${floorBound.toFixed(1)}m)`
    );

    if (points[minIdx].radiusM > floorBound || lowerClampM <= ADAPTIVE_MIN_SPACING_FLOOR_M) {
      if (points[minIdx].radiusM <= floorBound) {
        console.warn(`  WARNING ${slug}: assertion still failing at the spacing floor (${ADAPTIVE_MIN_SPACING_FLOOR_M}m) — reporting anyway.`);
      }
      finalPoints = points;
      finalAscentM = ascentM;
    } else {
      lowerClampM = Math.max(ADAPTIVE_MIN_SPACING_FLOOR_M, lowerClampM / 2);
    }
  }

  const ascentDisagreementPct = (Math.abs(finalAscentM - anchors.ascentM) / anchors.ascentM) * 100;
  if (ascentDisagreementPct > ASCENT_WARN_PCT) {
    console.warn(
      `WARNING ${slug}: derived ascent ${finalAscentM.toFixed(0)}m disagrees with roadbook ` +
        `${anchors.ascentM}m by ${ascentDisagreementPct.toFixed(1)}% (>${ASCENT_WARN_PCT}%)`
    );
  }

  return {
    slug,
    elevationSource: 'roadbook+srtm',
    lengthM: finalPoints[finalPoints.length - 1].distanceM,
    ascentM: finalAscentM,
    origin: { lat: lat0, lon: lon0 },
    points: finalPoints,
  };
}

const PUBLIC_ROUTES_DIR = join(__dirname, '..', 'public', 'climbs', 'routes');

// Cheap (pure local computation, no network) so this matters less than the
// basemap/terrain scripts, but skip unchanged GPX files anyway for
// consistency and to keep run output focused on what actually changed as
// the route count grows. Force a full rebuild (e.g. after an algorithm
// change to buildRoute itself) with FORCE=1 npx tsx scripts/build-climb-routes.ts.
const FORCE = process.env.FORCE === '1';
function isUpToDate(slug: string, gpxPath: string): boolean {
  const outPath = join(ROUTES_DIR, `${slug}.json`);
  if (!existsSync(outPath)) return false;
  return statSync(outPath).mtimeMs >= statSync(gpxPath).mtimeMs;
}

function main() {
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.gpx'));
  if (files.length === 0) {
    console.error(`No .gpx files found in ${ROUTES_DIR}`);
    process.exit(1);
  }
  if (!existsSync(PUBLIC_ROUTES_DIR)) mkdirSync(PUBLIC_ROUTES_DIR, { recursive: true });
  let skipped = 0;
  for (const file of files) {
    const slug = file.replace(/\.gpx$/, '');
    const gpxPath = join(ROUTES_DIR, file);
    if (!FORCE && isUpToDate(slug, gpxPath)) {
      skipped++;
      continue;
    }
    console.log(`Building ${slug}...`);
    const route = buildRoute(slug, gpxPath);
    const json = JSON.stringify(route);
    // data/ is the committed source of truth (tasksheet 1.1); the public/
    // copy exists purely so client components (the debug tool, eventually
    // the real ClimbMorph3D) can fetch it at runtime without server code.
    writeFileSync(join(ROUTES_DIR, `${slug}.json`), json);
    writeFileSync(join(PUBLIC_ROUTES_DIR, `${slug}.json`), json);
    console.log(`  -> ${slug}.json (${route.points.length} points, ${(route.lengthM / 1000).toFixed(2)}km, ${route.ascentM.toFixed(0)}m ascent)`);
  }
  if (skipped > 0) console.log(`Skipped ${skipped} already-up-to-date route(s) (FORCE=1 to rebuild everything).`);
}

main();
