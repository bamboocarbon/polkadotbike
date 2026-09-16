/**
 * Strava segment links for the 14 2027 TDF UK climbs — found 2026-09-16
 * (Robin, via Claude in Chrome, matching by segment start/finish coordinates
 * against each climb's own GPX endpoints, not by name — several of these
 * roads have multiple overlapping segments).
 *
 * Deliberately NO rider names or times here. Strava's API Agreement
 * restricts displaying one user's Strava data to anyone other than that
 * user, and most of the KOM/QOM holders found for these climbs are private
 * individuals, not public figures — republishing their names/times as a
 * site feature isn't something to risk. Linking to Strava's own segment
 * page (where the real, current leaderboard lives) is the safe version of
 * the same idea, and sends Strava traffic rather than competing with them.
 */
export interface ClimbStravaSegment {
  id: number;
  name: string;
  lengthKm: number;
  /** How this segment's own start/finish compares to this climb's, in plain terms. */
  fit: string;
}

export const CLIMB_STRAVA_SEGMENTS: Record<string, ClimbStravaSegment> = {
  'cote-de-melrose': { id: 7193276, name: 'Dingleton Road Climb', lengthKm: 2.19, fit: 'Exact match' },
  'cote-de-jubilee-tower': { id: 6688053, name: 'Jubilee Tower', lengthKm: 4.12, fit: 'Close match — segment runs on past the summit' },
  'cote-de-trough-of-bowland': { id: 682721, name: 'Trough of Bowland', lengthKm: 4.31, fit: 'Longer segment — this climb covers roughly km 2.0–3.9 of it' },
  'cote-de-waddington-fell': { id: 14302965, name: 'Newton Fell', lengthKm: 3.39, fit: 'Exact match' },
  'cote-de-belmont': { id: 27838282, name: 'Belmont Climb', lengthKm: 2.08, fit: 'Exact match' },
  'cote-de-parbold': { id: 907053, name: 'Parbold Hill Climb', lengthKm: 1.23, fit: 'Partial — covers the top two-thirds of this climb' },
  'cote-de-epynt': { id: 15374310, name: 'Cattle grid to top', lengthKm: 1.33, fit: 'Partial — covers only the final 1.3km of this climb' },
  'cote-de-bannau-brycheiniog': { id: 17024479, name: 'A4215 to Story Arms climb', lengthKm: 5.67, fit: 'Partial — covers only the final 5.4km of this climb' },
  'cote-de-rhigos': { id: 10352954, name: 'Create the Strava point before Mrs N kills me', lengthKm: 4.67, fit: 'Exact match' },
  'cote-de-penrhys': { id: 6882454, name: 'Penrhys Climb From Speed Camera to Roundabout', lengthKm: 0.95, fit: 'Partial match' },
  'cote-de-maerdy': { id: 6912798, name: 'justb4tatt', lengthKm: 1.03, fit: 'Partial match' },
  'cote-de-gelligaer': { id: 15628821, name: 'Gelligaer Rd', lengthKm: 2.37, fit: 'Longer segment — starts about 890m before this climb' },
  'cote-de-hengoed': { id: 1631884, name: 'Kestrel View Climb', lengthKm: 1.27, fit: 'Longer segment — this climb is just the first 0.68km of it' },
  'cote-de-caerffili': { id: 16406779, name: 'Caerphilly Mountain', lengthKm: 1.47, fit: 'Partial — covers the top 1.47km of this climb' },
};
