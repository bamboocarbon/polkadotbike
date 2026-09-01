/**
 * Rebecca's Private Idaho (rebeccasprivateidaho.com) — a 3-day gravel event
 * out of Ketchum/Sun Valley, ID. Deliberately NOT part of data/climbs.json /
 * climb-index.json: that schema (race/stage/kbf/cat) and its
 * buildClimbSummary() copy assume a Grand Tour's single categorised
 * mountain ascent, which doesn't fit a long rolling multi-summit gravel
 * course. This is its own small dataset; the 3D engine (DebugScene, the
 * GPX->route/basemap/terrain build scripts) is fully generic and reused
 * as-is — see scripts/build-climb-routes.ts's ROADBOOK_ANCHORS for the six
 * rpi-<slug> entries and project_cyclegear_climb_3d.md memory.
 *
 * Stats are read directly off each route's own built GPX data
 * (data/climbs/routes/rpi-*.json ascentM/lengthM) — this event has no
 * external "roadbook" to reconcile against, the GPX IS the source.
 *
 * day/dayLabel confirmed against the event's own published schedule
 * (rebeccasprivateidaho.com/event-schedule, checked 2026-08-30): Wednesday
 * (Stage 1) is Harriman, Thursday (Stage 2) is the Dollarhide Summit hill
 * climb time trial, Saturday (Stage 3) is the main event with four start
 * categories — Fully Loaded/Baked Potato both 7:30am, French Fry 8:00am,
 * Tater Tot 8:30am (kept in that published start-time order below).
 *
 * Actual calendar dates (checked 2026-09-01): the site's own header states
 * "SEPT 9 - 12 2026" — the schedule page only gives day-of-week, no numeric
 * dates, so these were derived by matching that header range against the
 * real 2026 calendar (`date -j` confirmed Sept 9 = Wed, 10 = Thu, 11 = Fri,
 * 12 = Sat), which lines up exactly: Wed 9 Sept = Stage 1, Thu 10 Sept =
 * Stage 2, Fri 11 Sept = Vendor Expo/rest day (not a stage), Sat 12 Sept =
 * Stage 3. Tuesday's rider-meeting social falls on 8 Sept, just before the
 * "9-12" window, so it isn't shown here.
 */
export interface RpiRoute {
  slug: string;
  name: string;
  day: 1 | 2 | 3;
  dayLabel: string;
  lengthKm: number;
  lengthMi: number;
  ascentM: number;
  ascentFt: number;
  elevMinM: number;
  elevMaxM: number;
  blurb: string;
}

export const RPI_ROUTES: RpiRoute[] = [
  {
    slug: 'rpi-harriman',
    name: 'Harriman',
    day: 1,
    dayLabel: 'Day 1 — Wednesday 9 September 2026',
    lengthKm: 57.01,
    lengthMi: 35.4,
    ascentM: 788,
    ascentFt: 2585,
    elevMinM: 2037,
    elevMaxM: 2497,
    blurb: 'Stage 1 of the event — the Harriman Trail through the Boulder Mountains.',
  },
  {
    slug: 'rpi-dollarhide',
    name: 'Dollarhide',
    day: 2,
    dayLabel: 'Day 2 — Thursday 10 September 2026',
    lengthKm: 80.57,
    lengthMi: 50.1,
    ascentM: 949,
    ascentFt: 3114,
    elevMinM: 1779,
    elevMaxM: 2654,
    blurb: 'Stage 2 — the Dollarhide Summit hill-climb time trial, via Frenchman’s Hot Spring.',
  },
  {
    slug: 'rpi-fully-loaded',
    name: 'Fully Loaded Baked Potato',
    day: 3,
    dayLabel: 'Day 3 — Saturday 12 September 2026',
    lengthKm: 190.15,
    lengthMi: 118.2,
    ascentM: 2226,
    ascentFt: 7303,
    elevMinM: 1792,
    elevMaxM: 2659,
    blurb: 'Stage 3 main event, longest option (7:30am start) — the full route including Copper Basin, Trail Creek and Wildhorse.',
  },
  {
    slug: 'rpi-baked-potato',
    name: 'Baked Potato',
    day: 3,
    dayLabel: 'Day 3 — Saturday 12 September 2026',
    lengthKm: 167.03,
    lengthMi: 103.8,
    ascentM: 1976,
    ascentFt: 6483,
    elevMinM: 1792,
    elevMaxM: 2659,
    blurb: 'Stage 3 main event (7:30am start) — a shorter cut of the full loop, still touching Copper Basin and Wildhorse.',
  },
  {
    slug: 'rpi-french-fry',
    name: 'French Fry',
    day: 3,
    dayLabel: 'Day 3 — Saturday 12 September 2026',
    lengthKm: 92.45,
    lengthMi: 57.5,
    ascentM: 1129,
    ascentFt: 3704,
    elevMinM: 1792,
    elevMaxM: 2408,
    blurb: 'Stage 3 main event (8:00am start) — the mid-distance option, taking in Trail Creek, Wildhorse and El Diablito.',
  },
  {
    slug: 'rpi-tater-tot',
    name: 'Tater Tot',
    day: 3,
    dayLabel: 'Day 3 — Saturday 12 September 2026',
    lengthKm: 30.41,
    lengthMi: 18.9,
    ascentM: 378,
    ascentFt: 1240,
    elevMinM: 1791,
    elevMaxM: 2118,
    blurb: 'Stage 3 main event (8:30am start) — the short course, a taste of the event without the full mileage.',
  },
];

export function findRpiRoute(slug: string): RpiRoute | undefined {
  return RPI_ROUTES.find((r) => r.slug === slug);
}
