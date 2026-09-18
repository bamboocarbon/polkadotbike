/**
 * UCI Road World Championships, Montréal — 20-27 September 2026
 * (montreal2026.org/en/challenges). Deliberately NOT part of
 * data/climbs.json / climb-index.json — same reasoning as
 * data/rpiRoutes.ts and data/cheqRoutes.ts: that schema (race/stage/kbf/
 * cat) assumes a Grand Tour's single categorised mountain ascent, which
 * fits neither a stand-alone finishing climb shared by two separate ITT
 * distances nor a lapped circuit. This is its own small dataset; the 3D
 * engine (DebugScene, the GPX->route/basemap/terrain build scripts) is
 * fully generic and reused as-is — see scripts/build-climb-routes.ts's
 * ROADBOOK_ANCHORS for the montreal-worlds-tt / montreal-worlds-circuit
 * entries.
 *
 * Two routes, not one per event, because the two GPX files Robin supplied
 * are already scoped that way:
 *  - montreal-worlds-tt: just the finishing climb of the 39.2km Elite ITT
 *    course (shared by the Men's and Women's time trials, both 20 Sept) —
 *    "the only real climb" on that course, per Robin.
 *  - montreal-worlds-circuit: the Mount Royal finishing circuit itself,
 *    ridden multiple times by every road-race category, not a single
 *    ascent (Camillien-Houde + Chemin de la Polytechnique + the Avenue du
 *    Parc false-flat finish).
 *
 * Dates/distances/times below are from montreal2026.org/en/challenges
 * (checked 2026-09-18); lap counts and climb names are from the UCI's own
 * course reveal via flobikes.com/articles/16184384-2026-uci-road-worlds-
 * course-montreal-mount-royal (checked 2026-09-18) — no lap count is
 * published for the U23/Junior road races, so those aren't stated here
 * rather than guessed.
 */
export interface MontrealWorldsRoute {
  slug: string;
  name: string;
  kind: 'tt' | 'circuit';
  lengthKm: number;
  lengthMi: number;
  ascentM: number;
  ascentFt: number;
  elevMinM: number;
  elevMaxM: number;
  blurb: string;
  eventLabel: string;
}

export const MONTREAL_WORLDS_ROUTES: MontrealWorldsRoute[] = [
  {
    slug: 'montreal-worlds-tt',
    name: 'ITT Finishing Climb',
    kind: 'tt',
    lengthKm: 4.14,
    lengthMi: 2.57,
    ascentM: 70,
    ascentFt: 230,
    elevMinM: 22,
    elevMaxM: 77,
    blurb:
      "The decisive final section of the 39.2km Elite individual time trial course — the only real climb either time trial faces, run in to the finish line.",
    eventLabel: "Elite Men's & Women's ITT — Sunday 20 September 2026",
  },
  {
    slug: 'montreal-worlds-circuit',
    name: 'Mount Royal Finishing Circuit',
    kind: 'circuit',
    lengthKm: 13.5,
    lengthMi: 8.39,
    ascentM: 261,
    ascentFt: 856,
    elevMinM: 51,
    elevMaxM: 214,
    blurb:
      'The closing circuit every road race finishes on — up Voie Camillien-Houde, over the steep ramps of Chemin de la Polytechnique, then the rising false flat of Avenue du Parc. Ridden 12 times by the Elite Men and 8 times by the Elite Women, with the same repeated punishment wearing riders down lap after lap.',
    eventLabel: 'Elite Women RR Sat 26 Sept · Elite Men RR Sun 27 September 2026',
  },
];

export function findMontrealWorldsRoute(slug: string): MontrealWorldsRoute | undefined {
  return MONTREAL_WORLDS_ROUTES.find((r) => r.slug === slug);
}
