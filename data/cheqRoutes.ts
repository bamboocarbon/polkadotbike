/**
 * Chequamegon MTB Festival (cheqmtb.com), Hayward/Cable, WI. Deliberately
 * NOT part of data/climbs.json / climb-index.json — same reasoning as
 * data/rpiRoutes.ts: that schema (race/stage/kbf/cat) and its
 * buildClimbSummary() copy assume a Grand Tour's single categorised
 * mountain ascent, which doesn't fit a long rolling point-to-point MTB
 * race. This is its own small dataset; the 3D engine (DebugScene, the
 * GPX->route/basemap/terrain build scripts) is fully generic and reused
 * as-is — see scripts/build-climb-routes.ts's ROADBOOK_ANCHORS for the
 * three cheq-* entries.
 *
 * Stats are read directly off each route's own built GPX data
 * (data/climbs/routes/cheq-*.json ascentM/lengthM) — cheqmtb.com's own
 * event pages (checked 2026-09-04, event/chequamegon-40 and
 * event/short-fat) give race distances by name ("40 miles", "16 miles")
 * but no elevation-gain figure or per-point profile at all, so the GPX
 * IS the source for gain, gradient and terrain here, same as RPI.
 *
 * Distance reconciliation vs the site's own published names, all three
 * courtesy of Robin's own official GPX exports (files literally named
 * "Official Cheq 40 Pro Course", "Official Cheq 40 Course", "Official
 * Cheq Short & Fat"):
 *  - Chequamegon 40 ("40 miles" per cheqmtb.com/event/chequamegon-40):
 *    this GPX measures 66.97km/41.6mi — 4% over the named distance,
 *    normal GPX-vs-nominal-race-name variance (race names round to a
 *    clean number; the actual course rarely lands on it exactly).
 *  - Short & Fat ("16 miles" per cheqmtb.com/event/short-fat): this GPX
 *    measures 25.34km/15.75mi — within 2% of the named distance, a close
 *    match.
 *  - "Cheq 40 Pro": cheqmtb.com's own race-details page (event/
 *    chequamegon-40) describes "Pro/Elite" as an awards CATEGORY within
 *    the Chequamegon 40 field (alongside Single Speed, Fat Bike, Tandem,
 *    Non-Binary, Para, E-Bike), not a separately-documented course or
 *    distance — but Robin's official GPX export for it is a genuinely
 *    different track from the standard Cheq 40 file (different start
 *    point, ~46.006,-91.446 vs ~46.016,-91.486, about 3km apart; same
 *    Cable finish) measuring 62.81km/39.0mi, ~4km shorter. Flagged here
 *    rather than assumed identical to the standard 40 — shown as its own
 *    route since the source GPX genuinely is one, sourced from cheqmtb.com
 *    per its own filename even though the site's descriptive text doesn't
 *    call out a distinct "Pro course".
 *
 * Event date (19 September 2026) per cheqmtb.com/event/chequamegon-40 and
 * /event/short-fat, checked 2026-09-04 — both races run the same day.
 * Start/finish per the same pages: Chequamegon 40 (and its Pro/Elite
 * category) starts at Hayward Primary School, downtown Hayward, WI and
 * finishes at the Derksen Family Great Hall, Cable, WI, over "the famed
 * American Birkebeiner Ski Trail and along picturesque trails of varying
 * terrain" (cheqmtb.com's own description); Short & Fat starts and
 * finishes in Cable, WI itself, with one aid station at mile 6.6.
 */
export interface CheqRoute {
  slug: string;
  name: string;
  dateLabel: string;
  lengthKm: number;
  lengthMi: number;
  ascentM: number;
  ascentFt: number;
  elevMinM: number;
  elevMaxM: number;
  blurb: string;
}

export const CHEQ_ROUTES: CheqRoute[] = [
  {
    slug: 'cheq-40',
    name: 'Chequamegon 40',
    dateLabel: 'Saturday 19 September 2026',
    lengthKm: 66.97,
    lengthMi: 41.6,
    ascentM: 913,
    ascentFt: 2995,
    elevMinM: 362,
    elevMaxM: 532,
    blurb:
      'The headline race of the Chequamegon MTB Festival — starts in downtown Hayward, WI (Hayward Primary School) and finishes at the Derksen Family Great Hall in Cable, over the famed American Birkebeiner Ski Trail and a mix of forest roads and snowmobile routes.',
  },
  {
    slug: 'cheq-40-pro',
    name: 'Chequamegon 40 — Pro/Elite Course',
    dateLabel: 'Saturday 19 September 2026',
    lengthKm: 62.81,
    lengthMi: 39.0,
    ascentM: 913,
    ascentFt: 2995,
    elevMinM: 371,
    elevMaxM: 532,
    blurb:
      "cheqmtb.com's own site describes Pro/Elite as an awards category within the Chequamegon 40 field rather than a separate course, but this is the event's own distinct GPX for it — a genuinely different track from the standard 40 (a start point ~3km away, about 4km shorter overall), still finishing at the same Cable line.",
  },
  {
    slug: 'cheq-short-fat',
    name: 'Short & Fat',
    dateLabel: 'Saturday 19 September 2026',
    lengthKm: 25.34,
    lengthMi: 15.75,
    ascentM: 338,
    ascentFt: 1109,
    elevMinM: 415,
    elevMaxM: 501,
    blurb:
      'All the same challenges as the Chequamegon 40, in a bite-sized version — starts and finishes in Cable, WI, with one aid station at mile 6.6.',
  },
];

export function findCheqRoute(slug: string): CheqRoute | undefined {
  return CHEQ_ROUTES.find((r) => r.slug === slug);
}
