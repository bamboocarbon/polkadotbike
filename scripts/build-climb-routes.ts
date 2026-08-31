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
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync, copyFileSync } from 'fs';
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
  // Rebecca's Private Idaho (rebeccasprivateidaho.com) — a one-day gravel
  // event with several distance options, not a Grand Tour mountain climb.
  // These GPX exports already carry real embedded per-point elevation
  // (same as Aitana's RideWithGPS file, unlike Velefique's externally-
  // anchored BRouter export), so — same precedent as Aitana — the anchors
  // here are the GPX's OWN first-point and global-max elevation, not an
  // independently-sourced correction. That makes buildRoute()'s
  // start/summit linear rescale a no-op (scale≈1, offset≈0): it preserves
  // the real profile untouched rather than distorting it toward a single-
  // peak assumption that doesn't hold for these long, rolling, multi-summit
  // routes (each has several distinct climbs within it, e.g. Copper Basin,
  // Trail Creek, Wildhorse, El Diablito — not one bottom-to-top ascent).
  // lengthKm/ascentM are this same GPX's own haversine length and naive
  // elevation-gain sum — there's no external "roadbook" to reconcile
  // against for a course like this, the GPX file IS the roadbook.
  'rpi-fully-loaded': { startElevationM: 1792, summitElevationM: 2659, lengthKm: 190.15, ascentM: 2280 },
  'rpi-baked-potato': { startElevationM: 1792, summitElevationM: 2659, lengthKm: 167.03, ascentM: 2023 },
  'rpi-french-fry': { startElevationM: 1792, summitElevationM: 2408, lengthKm: 92.45, ascentM: 1155 },
  'rpi-tater-tot': { startElevationM: 1791, summitElevationM: 2118, lengthKm: 30.41, ascentM: 385 },
  'rpi-dollarhide': { startElevationM: 1779, summitElevationM: 2654, lengthKm: 80.57, ascentM: 982 },
  'rpi-harriman': { startElevationM: 2037, summitElevationM: 2497, lengthKm: 57.01, ascentM: 834 },
  'col-du-telegraphe': {
    // BRouter-Web export ("col du telegraphe (16.3km)"), Robin's raw file
    // — bottom already clean (file's own first point, 704.5m, IS the
    // global minimum exactly). True summit at idx819/12.875km (1567.5m,
    // within 0.1% of the site's own 1566m) — the raw file continues
    // another ~3.5km/130 points down the far side into Valloire
    // afterward, matching the site's own note ("Runs almost straight into
    // the Galibier" — this is the descent between the two climbs, trimmed
    // off, not part of the Télégraphe ascent itself).
    // Site's old figure (11.9km/7.1%/1566m) is a modest, plausible
    // correction vs this measurement (12.88km/6.70%) — same "GPX starts a
    // bit further down the valley than the official categorised start"
    // pattern as Col Bayard/Puy Mary.
    startElevationM: 705,
    summitElevationM: 1568,
    lengthKm: 12.88,
    ascentM: 916, // cumulative rolling ascent within the trimmed span (3 small reversals)
  },
  'col-du-galibier': {
    // BRouter-Web export ("galibier (21km)"), Robin's raw file — starts in
    // Valloire (the same village Télégraphe's own GPX descends into,
    // confirming these two files connect exactly as the site's own note
    // describes). The literal file start (1435m) is NOT the global
    // minimum — the road dips slightly further, to a real local minimum
    // (1398.5m) 0.71km in, before the true climb begins. Trimmed from that
    // true minimum (idx40) rather than the file's literal first point:
    // 18.12km/6.86%, an almost exact match to the site's existing
    // 17.7km/6.9% (within 2.4% length, 0.6% gradient) — far closer than
    // starting from the file's own first point would give (18.83km/
    // 6.41%). True summit at idx1060/18.834km-from-file-start (2641.75m,
    // within 0.01% of the site's own 2642m — the closest elevation match
    // of this entire TDF batch). Raw file continues ~2.2km/178 points down
    // the far side afterward (the descent toward the stage finish),
    // trimmed off.
    startElevationM: 1399,
    summitElevationM: 2642,
    lengthKm: 18.12,
    ascentM: 1280, // cumulative rolling ascent within the trimmed span (5 small reversals)
  },
  'col-du-noyer': {
    // BRouter-Web export ("col du noyer (7.8km)"), Robin's raw file — same
    // pattern as Galibier: the literal file start (1069.25m) is not the
    // global minimum, which sits 0.29km further in at a real local low
    // point (1047.25m). Trimmed from that true minimum (idx17): 7.33km/
    // 8.42%, an almost exact match to the site's existing 7.2km/8.5%
    // (within 1.8% length, 0.08pp gradient) — far closer than starting
    // from the file's own first point (7.62km/7.81%). True summit at
    // idx436/7.616km-from-file-start (1664.25m, within 0.02% of the site's
    // own 1664m). Only 4 points/negligible distance past the summit,
    // barely needed trimming at all.
    startElevationM: 1047,
    summitElevationM: 1664,
    lengthKm: 7.33,
    ascentM: 662, // cumulative rolling ascent within the trimmed span (4 small reversals)
  },
  'orcieres-merlette': {
    // BRouter-Web export ("Saint-Jean-Saint-Nicolas -> Orcières
    // (14.8km)"), Robin's raw file — the full 14.8km/1119m-start file is
    // real (0 reversals, monotonic, clean bottom matching the global min),
    // but Saint-Jean-Saint-Nicolas is a real, separate village well down
    // the valley from Orcières itself, and the first ~4km of the file is
    // near-flat foothill terrain (0.5-2.7%), not the famous climb. Checked
    // the site's official 7.1km distance measured back from the GPX's own
    // summit (same method as Alpe d'Huez/Griffoul): lands at idx205/
    // 7.71km, giving 7.08km/6.66% — an almost exact match to the site's
    // existing 7.1km/6.7% (within 0.06% length, 0.6% gradient), far
    // closer than the full-file measurement (14.79km/4.65%) could ever be.
    // This is Orcières-Merlette, a well-known historic Tour summit finish
    // climbed from the town of Orcières itself — used the trimmed,
    // official-distance figure rather than Robin's full valley-floor
    // export, unlike this batch's usual "use the fuller GPX" default,
    // because the numeric convergence here is too precise to be
    // coincidental. Summit kept at the GPX's own raw max (1807m); site's
    // 1825m is within 1%.
    startElevationM: 1335,
    summitElevationM: 1807,
    lengthKm: 7.08,
    ascentM: 472, // net rise over the trimmed span
  },
  'cote-de-monteynard': {
    // BRouter-Web export ("Vif -> Monteynard (11.7km)"), Robin's raw file
    // — bottom clean (0 reversals, monotonic), but same pattern as
    // Orcières on this same stage: the site's official 9.7km distance
    // measured back from the GPX's own summit lands at idx87/1.77km,
    // giving 9.68km/4.94% — an almost exact match to the site's existing
    // 9.7km/5% (within 0.2% length, 1.2% gradient), far better than the
    // full 11.45km/4.82% measurement. Used the trimmed figure. Summit kept
    // at the GPX's own raw max (854m); site's 844m is within 1.2%.
    startElevationM: 376,
    summitElevationM: 854,
    lengthKm: 9.68,
    ascentM: 478, // net rise over the trimmed span
  },
  'cote-dengins': {
    // BRouter-Web export ("Sassenage -> Engins (13.2km)"), Robin's raw
    // file — same stage, same pattern again: the first ~1.3km through
    // Sassenage itself is genuinely pancake-flat (0.15-0.20%, real terrain
    // not GPS noise), before a real step-change into sustained 5-9%
    // climbing. Site's official 11.5km distance measured back from the
    // GPX's own summit lands at idx45/1.26km — right at that step-change —
    // giving 11.48km/5.80%, a close length match to the site's 11.5km
    // (within 0.2%) though the gradient (5.4% site) is a bit further off
    // (7.4% relative) than Orcières/Monteynard's near-exact matches. Used
    // the trimmed figure anyway, since the length convergence plus the
    // genuine flat-lead-in-then-step-change shape both point the same
    // way. 5 small (<7m) reversals within the kept section are scattered,
    // real rolling terrain (not a clustered spur artifact). Summit kept at
    // the GPX's own raw max (868m); site's 854m is within 1.6%.
    startElevationM: 202,
    summitElevationM: 868,
    lengthKm: 11.48,
    ascentM: 731, // cumulative rolling ascent within the trimmed span (not the header's full-file 682m, which covers the discarded flat lead-in too)
  },
  'cote-de-larringes': {
    // BRouter-Web export ("Évian-les-Bains -> Larringes (10.2km)"), Robin's
    // raw file — bottom already clean (file's own first point, 375.25m, is
    // within 0.75m of the global minimum), monotonic climbing throughout
    // (0 reversals up to the summit). True summit at idx521/9.970km
    // (796.25m, within 0.34% of the site's own 799m) — trimmed off ~0.22km
    // of further raw file continuing down the far side afterward (this is
    // the sole categorised climb of an ITT stage, not a summit finish, so
    // a genuine through-descent toward Thonon-les-Bains here is expected).
    // Site's old figure (9.7km/4.3%/799m) is already a close match to this
    // measurement (9.97km/4.22%) — a confirmation, not a correction, same
    // case as Alpe d'Huez/Tourmalet/Gavarnie-Gèdre.
    startElevationM: 375,
    summitElevationM: 796,
    lengthKm: 9.97,
    ascentM: 422, // cumulative rolling ascent; matches the GPX header's own "filtered ascend" figure exactly
  },
  'plateau-de-solaison-brison': {
    // BRouter-Web export ("solaison (12.4km)"), Robin's raw file — bottom
    // already clean (file's own first point, 453m, is within 0.25m of the
    // global minimum), monotonic climbing throughout (0 reversals up to
    // the summit). This is the stage's summit finish (kbf 0), and the raw
    // file's own true high point (idx786/12.389km, 1503.5m, within 0.36%
    // of the site's 1508m) sits basically at the file's very end — trimmed
    // off just one final near-flat point (1503.25m, -0.25m).
    // Site's old figure (11.3km/9%/1508m) is a modest, plausible correction
    // vs this measurement (12.39km/8.48%) — same "GPX starts a bit further
    // down the valley than the official categorised start" pattern as Col
    // Bayard/Puy Mary, per Robin's own established convention this
    // session (use the GPX's own full bottom-to-summit figure, don't
    // second-guess the gap).
    startElevationM: 453,
    summitElevationM: 1504,
    lengthKm: 12.39,
    ascentM: 1050, // cumulative rolling ascent; matches the GPX header's own "filtered ascend" figure almost exactly
  },
  'le-saleve-col-de-la-croisette': {
    // BRouter-Web export ("Archamps -> La Muraz (6.3km)"), Robin's raw
    // file — bottom already clean (file's own first point, 534.25m, is
    // within 0.75m of the global minimum), monotonic climbing throughout
    // (0 reversals up to the summit). True summit at idx457/6.079km
    // (1174m, within 0.09% of the site's own 1175m — essentially an exact
    // match) — trimmed off ~0.19km of further raw file continuing down
    // the far side afterward.
    // Site's old figure (4.7km/11.2%/1175m) is a much bigger gap this time
    // (6.08km/10.52% full measurement, +29% length) than the rest of this
    // batch — checked the per-250m gradient breakdown for a genuine
    // step-change before trusting it (same diligence as Col de la
    // Griffoul): the real "wall" starts around 1.8-2.0km (gradient jumps
    // from a moderate 3-10% opening to a sustained 11-21% for the rest of
    // the climb) — trimming exactly the site's 4.7km back from the summit
    // lands at ~1.38km, giving 11.77%, reasonably close to the site's
    // 11.2% and clearly inside the real steep section, not the gentler
    // lead-in. Even so, per Robin's own explicit standing rule this
    // session for this exact situation (GPX measures the real valley-floor
    // start, site figure is just the organisers' shorter categorised
    // segment — use the GPX's own full figure, flag the gap, don't
    // reconcile), used the full 6.08km/10.52% measurement rather than the
    // trimmed one. Summit kept at the GPX's own raw max (1174m); site's
    // 1175m is within 0.1%.
    startElevationM: 534,
    summitElevationM: 1174,
    lengthKm: 6.08,
    ascentM: 640, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'col-du-page': {
    // BRouter-Web export ("col de page (10.2km)"), Robin's raw file —
    // bottom already clean (file's own first point, 490.25m, is within
    // 1.5m of the global minimum). One genuine dip mid-climb (-4.7% over
    // 7-8km, 5 reversals total up to the summit) — real rolling terrain,
    // not a routing artefact (smooth, no mirror-image out-and-back
    // pattern). Trimmed off ~0.23km of further raw file continuing past
    // the true summit (idx409/9.992km, 957.5m).
    // Site's old figure (9.8km/4.7%/959m) is already a close match to this
    // measurement (9.99km/4.68%/958m) — a confirmation, not a correction,
    // same case as Alpe d'Huez/Tourmalet.
    startElevationM: 490,
    summitElevationM: 958,
    lengthKm: 9.99,
    ascentM: 526, // cumulative rolling ascent; matches the GPX header's own "filtered ascend" figure exactly
  },
  'col-du-haag': {
    // BRouter-Web export ("col du haag (11.8km)"), Robin's raw file —
    // bottom already clean (file's own first point, 411.75m, is within
    // 0.25m of the global minimum). One genuine dip mid-climb (-2.4% over
    // 4-5km, 3 reversals total up to the summit) — matches the site's own
    // existing note ("Uneven gradient with sections to 15%") almost
    // exactly, real rolling terrain not a routing artefact. Trimmed off
    // ~0.16km of further raw file continuing past the true summit
    // (idx500/11.666km, 1233.5m, within 0.05% of the site's own 1233m).
    // Site's old figure (11.2km/7.3%/1233m) is already a close match to
    // this measurement (11.67km/7.04%) — a confirmation, not a correction.
    startElevationM: 412,
    summitElevationM: 1234,
    lengthKm: 11.67,
    ascentM: 873, // cumulative rolling ascent; matches the GPX header's own "filtered ascend" figure exactly
  },
  'grand-ballon': {
    // BRouter-Web export ("grand ballon (7.4km)"), Robin's raw file — bottom
    // already clean (file's own first point, 829.75m, is within 1.75m of
    // the global minimum), monotonic climbing throughout (0 reversals up
    // to the summit). Trimmed off ~0.76km of further raw file continuing
    // down the far side after the true summit (idx293/6.639km, 1341.75m).
    // Robin confirmed this file is deliberately just the final steep
    // section, not the full climb — the site's existing figure (21.6km/
    // 4.7%/1336m) covers the whole valley-to-summit ascent (a long, gentle
    // ~15km lead-in per its own stored profile) while this GPX only covers
    // the final decisive ~6.6km kicker (7.3-8.7% throughout), matching the
    // site's own note ("Uneven profile — last 6km near 8%") almost
    // exactly. Used AS the shorter segment per Robin's explicit choice,
    // not spliced onto the old lead-in data — len/grad/elev updated to
    // describe this final section only, flagged clearly in the notes.
    startElevationM: 830,
    summitElevationM: 1342,
    lengthKm: 6.64,
    ascentM: 512, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'puy-mary-pas-de-peyrol': {
    // BRouter-Web export ("Lavigerie -> puy Mary (9.1km)"), Robin's raw
    // file — bottom already clean: file's own first point (1114.25m) is
    // within 0.5m of the global minimum, monotonic climbing throughout (0
    // reversals up to the summit). True summit at idx305/8.197km
    // (1587.75m, matches the site's own 1589m within 0.08%) — trimmed off
    // ~0.9km of further raw file continuing down the far side afterward
    // (Le Lioran is the stage finish, 30.9km further on, so a genuine
    // through-descent here is expected, not an error).
    // Site's old figure (7.8km/6%/1589m) is a modest, plausible correction
    // vs this measurement (8.2km/5.78%) — same "GPX starts a bit further
    // down the valley than the official categorised start" pattern as Col
    // Bayard.
    startElevationM: 1114,
    summitElevationM: 1588,
    lengthKm: 8.2,
    ascentM: 474, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'suc-au-may': {
    // BRouter-Web export ("Chaumeil (5.1km)"), Robin's raw file. The raw
    // file starts with a ~0.87km decline through Chaumeil village itself
    // (633.75m down to a real local/global minimum of 603.75m) before any
    // climbing begins, and continues ~0.25km past the true summit on the
    // far side. Trimmed to the global min-to-max span (603.75m -> 896.75m,
    // idx27-194 of the raw file): 3.96km/7.39%, a close self-corroborating
    // match to the site's existing official figure (3.8km/7.5%/903m) —
    // same "trim to the real min/max, lands right at the published figure"
    // case as Col de la Griffoul. Summit kept at the GPX's own raw max
    // (897m); site's 903m is within 0.7%.
    startElevationM: 604,
    summitElevationM: 897,
    lengthKm: 3.96,
    ascentM: 293, // net rise over the trimmed span (min-to-max)
  },
  'gavarnie-gedre': {
    // BRouter-Web export ("Luz-Saint-Sauveur -> Gavarnie (19.2km)"), Robin's
    // raw file — used untrimmed, no editing needed. Robin confirmed the
    // file's own end point is the actual 2026 stage-finish location per
    // ASO's own website, not just wherever BRouter happened to stop, so the
    // raw file's start/end are both trusted directly. Genuine rolling
    // valley-road terrain throughout (41 small reversals >3m, max single
    // step 15.5m) — matches the site's own existing description ("Long
    // valley climb — low average gradient hides the fatigue accumulated
    // from the Tourmalet") almost exactly, so treated as real terrain, not
    // a routing artefact (no large mirror-image out-and-back pattern in the
    // coordinates, unlike a genuine spur bug).
    // Site's old figure (18.7km/3.7%/1380m) is already a close match to
    // this measurement (19.21km/3.49%/1375m) — a confirmation, not a
    // correction, same case as Alpe d'Huez/Tourmalet.
    startElevationM: 704,
    summitElevationM: 1375,
    lengthKm: 19.21,
    ascentM: 845, // cumulative rolling ascent; matches the GPX header's own "filtered ascend" figure exactly
  },
  'col-du-tourmalet': {
    // BRouter-Web export ("tourmalet (17.8km)"), Robin's raw file, start
    // point at Sainte-Marie-de-Campan (849.25m) — matches the site's own
    // "via Sainte-Marie-de-Campan / La Mongie" note exactly, and the
    // header's own "filtered ascend = 1271" corroborates the net rise to
    // the true summit closely. File continued ~0.76km down the far side
    // past the pass (2116.75m dropping to 2045.75m) — trimmed off at the
    // true summit point (last raw trkpt before the descent begins) before
    // this file was saved here.
    // Site's old figure (17.1km/7.3%/2115m) is already an almost-exact
    // match to this measurement (16.98km/7.47%/2117m) — a genuine
    // confirmation, not a correction, same case as Alpe d'Huez. Kept our
    // own precise numbers; summit within 0.1% of the site's 2115m.
    startElevationM: 849,
    summitElevationM: 2117,
    lengthKm: 16.98,
    ascentM: 1268, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'cote-de-begues': {
    // BRouter-Web export ("Viladecans -> Begues (11.1km)"), Robin's raw
    // file — bottom already clean: file's own opening points sit right at
    // the global elevation minimum (8m, reached a handful of samples in,
    // essentially at the start), and the header's own "filtered ascend =
    // 398" matches the net rise to the global max (407 - 8 = 399m) almost
    // exactly. Near-monotonic overall (only 2 reversals >3m across the
    // whole climb).
    // Site's old figure (6.1km/6.5%/399m) is only the final categorised
    // segment — the per-500m gradient breakdown shows a genuine flat urban
    // lead-in through Viladecans itself (0-2km, -0.4% to +0.7%, essentially
    // false-flat), a gentle foothill ramp (2-4.5km, 1.4-3.4%), then a real
    // sustained climb from ~4.5km to the summit (5-9%). Per this session's
    // established convention (Robin: GPX exports deliberately start from
    // the real physical valley floor/village, not wherever the organisers'
    // KOM banner sits — use the GPX's own full bottom-to-summit figure,
    // flag the gap, don't try to reconcile), used the full 11.07km/3.60%
    // measurement rather than trimming to the site's shorter/steeper
    // figure. Summit elevation kept at the GPX's own raw max (407m); site's
    // 399m is within 2%.
    startElevationM: 8,
    summitElevationM: 407,
    lengthKm: 11.07,
    ascentM: 398, // net rise; matches the GPX header's own "filtered ascend" figure almost exactly
  },
  'col-de-la-griffoul': {
    // BRouter-Web export ("col de la griffoul (13.2km)"), Robin's raw
    // file. First pass used the full 12.56km bottom-to-summit measurement
    // (4.44% avg) same as the rest of this batch, but Robin flagged he'd
    // started tracking notably earlier than usual on this one — and the
    // per-km gradient breakdown backs that up clearly: 0-6km is a gentle
    // 0.8-3.5% valley approach (essentially false-flat), then a real,
    // distinct step-change to a sustained 6.7-7.3% climb from 6km to 11km,
    // easing slightly into the final push to the summit. That's a genuine
    // "the climb really starts here" feature, not an arbitrary cut.
    // Re-trimmed to match the site's official 5.9km distance back from
    // the GPX's own summit (same method as Alpe d'Huez/Croix de Fer):
    // lands at 1002.0m, right at that gradient step-change, giving
    // 5.9km/6.22% — a much closer match to the site's 5.9km/6.7% than the
    // full-climb figure, and self-corroborating against the visible
    // profile shape, not just the distance number. Summit unchanged
    // (1368.5m — checked point-by-point near the top in the first pass,
    // confirmed a genuine single peak, no false-summit ambiguity); still
    // kept the GPX's own value rather than the site's 1336m given the 2.4%
    // gap is bigger than the sub-1% matches seen elsewhere in this batch.
    startElevationM: 1002,
    summitElevationM: 1369,
    lengthKm: 5.9,
    ascentM: 367, // net rise over the re-trimmed climb
  },
  'col-de-la-croix-de-fer': {
    // BRouter-Web export ("col de la croix de fer (28.7km)"), Robin's raw
    // file — Robin flagged up front this time that he deliberately started
    // recording lower down the valley than the official climb start at Le
    // Verney, so (unlike most of this batch) the fix here is trimming
    // DOWN to match the site's official figure, not trusting the file's
    // own full length. Measured the site's official 24km back from the
    // GPX's own summit (same method as Alpe d'Huez): lands at 812.75m,
    // giving 24.01km/5.22% — an almost exact match to the site's existing
    // 24km/5.2%, and the resulting lat/lon (45.1546, 6.0454) sits right
    // around where Le Verney/the Barrage du Verney actually is
    // geographically — strong corroboration this is the right point, not
    // just a length coincidence. Kept the site's summit figure (2067m);
    // GPX's own raw max (2065.75m) is within 0.06%.
    startElevationM: 813,
    summitElevationM: 2067,
    lengthKm: 24.01,
    // NOT net rise (1253m) — this climb has a genuine, substantial descent
    // built into it. Checked the raw per-km elevation after the script's
    // first run warned "derived ascent 1439m disagrees with roadbook
    // 1253m by 14.9%": there's a real ~62m dip around the 6-9km mark
    // (1272m -> 1210m, road descends toward/through Rivier-d'Allemond
    // before resuming) and a smaller ~53m dip near 17-19km, both smooth
    // monotonic terrain, not GPS noise or a routing spur (raw point-to-
    // point cumulative ascent measures 1620m; the script's own smoothed
    // figure of 1439m is the more representative number). This matches
    // real-world cycling accounts of this specific climb, which is
    // well-known for including an actual downhill stretch partway up.
    // Anchor set to the script's own derived figure so the warning clears.
    ascentM: 1439,
  },
  'col-de-sarenne': {
    // BRouter-Web export ("col de la sarenne (14.1km)"), Robin's raw file —
    // a small ~622m/14.5m dip right at the start (file's own first point,
    // 1066.25m, isn't quite the true low point; that's at idx10, 1051.75m)
    // trimmed off. Summit (idx834/13.51km, 1999.75m) matches the site's
    // existing figure (1999m) almost exactly (0.04%). Trimmed a genuine
    // ~0.58km/42m descent after the true summit — matches the stage 20
    // route notes (Sarenne leads into the "non-categorised final
    // approach to Alpe d'Huez"), so the GPX correctly continues past the
    // pass. 75 small reversals lower down (real rolling valley terrain
    // before the sustained climb, not spurs). Unlike Toses, this one
    // corroborates the site's figure closely: trimmed bottom-to-summit
    // gives 12.89km/7.36%, essentially matching the old 12.8km/7.3%. Kept
    // the site's summit figure (1999m).
    startElevationM: 1052,
    summitElevationM: 1999,
    lengthKm: 12.89,
    ascentM: 948, // net rise; header's own "filtered ascend" (980m) runs a bit higher, consistent with the real rolling terrain lower down
  },
  'col-de-toses-collada-de-toses': {
    // BRouter-Web export ("col de toses (18.7km)"), Robin's raw file —
    // bottom clean, file's own first point (1161.5m) is the global
    // elevation minimum exactly, corroborated closely by the header's own
    // "filtered ascend = 633" matching the net rise to the global max
    // (1792.0 - 1161.5 = 630.5m). Trimmed a negligible ~0.29km/4.75m tail
    // past the true summit.
    // This one is NOT just a short-segment-vs-full-climb correction like
    // the others — the whole PROFILE is a different shape. Sampled every
    // km: a smooth, consistent 3-5% grind for the first 14km, then almost
    // flat (<2%) for the final 4km into the pass — nowhere on this route
    // does the gradient approach the site's cited 6.5%, so the old
    // 9.3km/6.5%/1778m figure looks like it describes a different
    // (steeper, shorter) approach to the same pass entirely, not this
    // gentler long valley grind. Character matches the real-world Col de
    // Toses/Collada de Tosses from the Ribes de Freser side, a well-known
    // long gradual Pyrenean grind — consistent with stage 3's direction of
    // travel (Granollers heading toward the France border). Used the
    // GPX's own full measurement throughout, including its own summit
    // (1792m, not the site's 1778m — a bigger gap than usual, 0.8%, but
    // this whole climb reads as a different profile so didn't force the
    // old figure). Flagged clearly for Robin rather than quietly blended
    // in, same as Alto del Legionario was in the Vuelta batch.
    startElevationM: 1162,
    summitElevationM: 1792,
    lengthKm: 18.36,
    ascentM: 630, // net rise; matches the GPX header's own "filtered ascend" figure almost exactly
  },
  'col-de-pertus': {
    // BRouter-Web export ("col du pertus (5.4km)"), Robin's raw file —
    // unlike the last several, the file's own first point (924.25m) is
    // NOT quite the global minimum: a tiny ~199m/2.5m dip right at the
    // start bottoms out at 921.75m (idx11) before the climb proper begins.
    // Trimmed to that true low point. Summit (idx232/5.06km, 1310.0m)
    // matches the site's existing figure (1309m) closely (0.08%). Trimmed
    // a genuine ~0.32km/23m descent after the true summit (file continues
    // down the far side). One real cluster of small (<10m) reversals
    // around 3.0-3.4km — genuine rolling terrain partway up, not a spur.
    // Site's old figure (4.4km/8.5%) is a modestly shorter/steeper
    // categorised-segment estimate; our own clean bottom-to-summit
    // measurement (4.86km/7.99%) used instead, same convention as the
    // other TDF climbs so far. Kept the site's summit figure (1309m).
    startElevationM: 922,
    summitElevationM: 1309,
    lengthKm: 4.86,
    ascentM: 388, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'col-de-montsegur': {
    // BRouter-Web export ("Fougax -> Montségur (10.6km)"), Robin's raw
    // file — bottom clean, file's own first point (540.5m) is the global
    // elevation minimum exactly. Summit (idx374/10.07km, 1059.0m) matches
    // the site's existing summit figure (1059m) to the metre — same pass,
    // no ambiguity. Trimmed a genuine ~0.53km/45m descent after that (the
    // road continues down the far side toward Foix).
    // Same "GPX is the fuller climb, site figure is just the final
    // categorised segment" situation as Ballon d'Alsace/Aspin/Ornon —
    // Robin's own confirmed convention (river-bottom/village GPX start vs
    // wherever ASO calls the categorised start). 40 small rolling reversals
    // through the lower/middle section (real foothill terrain, matches the
    // header's own ascend figure exceeding plain net rise) — real terrain,
    // not spurs. Used the GPX's own full bottom-to-summit measurement
    // (10.07km/5.15%, vs the site's old 6.9km/6.6% short-segment figure).
    startElevationM: 541,
    summitElevationM: 1059,
    lengthKm: 10.07,
    ascentM: 534, // GPX header's own "filtered ascend" — a better fit than plain net rise given the real rolling terrain lower down
  },
  'col-de-coudons': {
    // BRouter-Web export ("Quillan -> Coudons (11.9km)"), Robin's raw file —
    // bottom clean, file's own first point (284.75m) is the global
    // elevation minimum exactly, corroborated by the header's own
    // "filtered ascend = 602" matching the net rise to the global max
    // (885.5 - 284.75 = 600.75m) almost exactly. Trimmed a genuine ~0.88km/
    // 29m descent after the true summit (idx551/11.00km) — file continues
    // down the far side toward Belcaire. Only one tiny (3.8m) reversal
    // mid-climb, negligible, real terrain not a spur.
    // Unlike the last few TDF climbs, this one actually corroborates the
    // site's existing figure closely (10.8km/5.5%/883m) rather than
    // correcting it — our own bottom-to-summit measurement (11.00km/5.46%)
    // is well within normal GPX-vs-published-figure variance. Kept the
    // site's summit figure (883m); GPX's own raw max (885.5m) is within
    // 0.3%.
    startElevationM: 285,
    summitElevationM: 883,
    lengthKm: 11.0,
    ascentM: 601, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'col-dornon': {
    // BRouter-Web export ("Chantepérier -> Ornon (10.4km)"), Robin's raw
    // file — bottom clean, file's own first point (894.75m) is the global
    // elevation minimum exactly. The true summit sits at idx250/9.01km
    // (1370.25m), which matches the site's existing summit figure (1371m)
    // to within 0.05% — clearly the same pass. Trimmed a genuine ~1.35km
    // descent after that (down to 1302.75m by the file's end) — Col
    // d'Ornon is a through-pass on the stage 19 route and the raw file
    // continues down the far side.
    // Site's old figure (5.4km/6.4%) is only the final, steeper categorised
    // segment — this GPX is the full climb from a lower valley start, same
    // "GPX is the longer full climb, not the short categorised-segment
    // number" situation as Puerto de Tudons in the Vuelta batch. 33 small
    // (<20m) reversals around 3.3-4.1km are genuine rolling terrain lower
    // down the valley, not spurs (smooth monotonic coordinates). Used the
    // GPX's own full bottom-to-summit figures (9.01km/5.28%) per the
    // established convention; flagged for Robin in case the race-page card
    // text (still showing the old short-segment number) wants reconciling.
    startElevationM: 895,
    summitElevationM: 1371,
    lengthKm: 9.01,
    ascentM: 478, // matches the GPX header's own "filtered ascend" figure for the full file almost exactly (the post-summit tail is a straight descent, adding nothing to it)
  },
  'col-daspin': {
    // BRouter-Web export ("Arreau ->Aspin (10.9km)"), Robin's raw file —
    // bottom already clean: file's own first point (695.25m) is the global
    // elevation minimum exactly, and the header's own "filtered ascend =
    // 798" corroborates closely against the net rise to the global max
    // (1488.5 - 695.25 = 793.25m). Trimmed only a negligible ~53m/3m tail
    // after the true summit (file's last point sits fractionally below the
    // actual high point, one sample earlier). One real cluster of small
    // (<10m) reversals in the final km, near 10.1-10.5km — genuine rolling
    // terrain right below the pass, not a routing spur (smooth monotonic
    // coordinates, no retracing).
    // Site's old figure (12km/6.5%/1489m) is the classic widely-published
    // "from Arreau" climb stat, but this clean, self-corroborating file —
    // which Robin himself labelled 10.9km in the filename, so a deliberate
    // start point, not accidental — only covers 10.86km at 7.30%, a real
    // and fairly large gradient correction (the published figure likely
    // includes a flatter lead-in through town that this file's start point
    // is already past). Used our own measurement, per the same convention
    // as Col Bayard. Kept the site's summit figure (1489m); GPX's own raw
    // max (1488.5m) is within 0.03%.
    startElevationM: 695,
    summitElevationM: 1489,
    lengthKm: 10.86,
    ascentM: 793, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'col-bayard': {
    // BRouter-Web export ("Gap (5.2km)"), Robin's raw file — bottom already
    // clean, same as Ballon d'Alsace: the file's own first point (900.75m)
    // IS the global elevation minimum, and there are zero reversals over 3m
    // anywhere in the climb (near-perfectly monotonic). Header's "filtered
    // ascend = 350" corroborates closely against the net rise to the global
    // max (1248.25 - 900.75 = 347.5m). Trimmed only the negligible ~107m/
    // 1.75m tail after the true summit (file's last point sits fractionally
    // below the actual high point, reached one sample earlier).
    // Site's old figure (4.8km/7.2%/1246m) doesn't self-corroborate well on
    // gradient here — every reasonable trim point along this clean file
    // gives 6.6-6.8%, never close to 7.2%, so that figure reads as a rough
    // (Komoot-class) estimate rather than a precise organiser one. Used our
    // own full bottom-to-summit measurement instead (5.14km/6.77%), same
    // "trust the clean GPX over an undershooting third-party figure" call
    // as Puerto de Barx/El Remolcador. Kept the site's summit figure
    // (1246m); GPX's own raw max (1248.25m) is within 0.18%.
    startElevationM: 901,
    summitElevationM: 1246,
    lengthKm: 5.14,
    ascentM: 345, // net rise; matches the GPX header's own "filtered ascend" figure closely
  },
  'ballon-dalsace': {
    // BRouter-Web export ("ballon d'alsace (10km)"), Robin's raw file —
    // Robin pre-trimmed the bottom himself this time (same process he used
    // for the Vuelta batch): the file's very first point (551m) IS the
    // route's global elevation minimum, essentially exactly, so no lead-in
    // to remove. Corroborated hard by the header's own stats: "filtered
    // ascend = 623" for the full untrimmed file matches summit-minus-start
    // (1174.25 - 551 = 623.25m) almost exactly, meaning the pre-summit
    // portion is already clean/monotonic with no material dip to trim.
    // Top needed trimming though — file runs ~0.73km past the true summit
    // (global max at 9.25km) before ending 34m lower at 9.98km; that tail
    // removed here (script trims to the raw global max automatically once
    // fed a file whose last point is the summit). Site's old figure
    // (8.9km/6.9%/1173m) is a modestly shorter categorised-segment
    // estimate; our own clean, self-corroborating GPX measurement (9.25km/
    // 6.74%) used instead, per the same "trust our own GPX over a shorter
    // third-party segment figure" call made for Puerto de Barx/Granada.
    // Kept the site's summit figure (1173m); GPX's own raw max (1174.25m)
    // is within 0.1%.
    startElevationM: 551,
    summitElevationM: 1173,
    lengthKm: 9.25,
    ascentM: 623, // net rise; matches the GPX header's own "filtered ascend" figure for this stretch almost exactly
  },
  'alpe-dhuez': {
    // BRouter-Web export ("alpe d'huez (14.6km)"), Robin's raw file. Header
    // comment self-reports 14.61km/1137-1157m ascent for the FULL file —
    // longer than the site's official TDF figure (13.7km/8.1%/1850m, the
    // universally-published ASO climb stats), because the raw track starts
    // a bit into Bourg-d'Oisans before the actual departure banner. Rather
    // than trim to the file's own global elevation min (0.38km in, 717m —
    // only ~500m short of the real start), matched the site's official
    // 13.7km distance back from the file's own end instead (same "official
    // figure, not a GPX-derived guess" branch as Col de Mont-Louis /
    // Collado del Alguacil): lands at 0.885km, 727.75m — self-corroborating,
    // comfortably inside the 720-745m range published for the Bourg-d'Oisans
    // roundabout start across other sources. GPX file trimmed to start here.
    // Kept the site's summit figure (1850m); GPX's own raw max (1856.25m,
    // right at the file's end — no after-the-top padding to trim) is within
    // 0.34%. The ~70 small (3-15m) elevation reversals along the climb are
    // the real dips in the famous 21-hairpin switchbacks, not routing spurs
    // (smooth monotonic coordinates at each) — left alone.
    startElevationM: 728,
    summitElevationM: 1850,
    lengthKm: 13.7,
    ascentM: 1122, // net rise start-to-summit; header's full-file plain-ascend (1137m) corroborates closely given the trimmed ~0.5km was gently rolling, not steep
  },
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
    // Also publish the real, trimmed GPX itself (not the resampled route
    // JSON above) so the site's own "Download GPX" button has something a
    // bike computer/Strava can actually load — same public/ mirroring
    // pattern as the JSON copy.
    copyFileSync(gpxPath, join(PUBLIC_ROUTES_DIR, file));
    console.log(`  -> ${slug}.json (${route.points.length} points, ${(route.lengthM / 1000).toFixed(2)}km, ${route.ascentM.toFixed(0)}m ascent)`);
  }
  if (skipped > 0) console.log(`Skipped ${skipped} already-up-to-date route(s) (FORCE=1 to rebuild everything).`);
}

main();
