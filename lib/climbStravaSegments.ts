/**
 * Strava segment links for the site's built climbs — found via Claude in
 * Chrome, matching by segment start/finish coordinates against each
 * climb's own GPX endpoints, not by name (several of these roads have
 * multiple overlapping segments). Started 2026-09-16 with the 14 2027 TDF
 * UK climbs, then extended the same day to Giro 2026's 20 — TDF 2026 and
 * Vuelta 2026 still to come. Every 2026 Grand Tour climb's GPX download
 * is already removed sitewide (GPX_2026_GRAND_TOUR_SLUGS in
 * climbGpxCaveats.ts) ahead of its Strava link landing here, so a climb
 * with neither button yet is mid-handover, not a bug.
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
  /**
   * A named, public-figure performance worth stating outright, as distinct
   * from the ordinary KOM/QOM holders on these segments — Robin's call,
   * 2026-09-16: Pavel Sivakov (a WorldTour pro) is "more widely known than
   * just Strava", unlike the private individuals holding the other 13
   * climbs' fastest times, which stay unpublished. Couldn't independently
   * corroborate the specific time outside Strava itself, so it's presented
   * as a fact about a public figure's public athletic performance (the same
   * category cycling media routinely reports), not as republished
   * leaderboard data — only add further entries here on the same basis.
   */
  notablePerformance?: string;
}

export const CLIMB_STRAVA_SEGMENTS: Record<string, ClimbStravaSegment> = {
  'cote-de-melrose': {
    id: 7193276,
    name: 'Dingleton Road Climb',
    lengthKm: 2.19,
    fit: 'Exact match',
    notablePerformance: 'WorldTour pro Pavel Sivakov holds the fastest recorded ascent, 4:39 (2019).',
  },
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

  // Giro 2026 (20) — found 2026-09-16, same coordinate-matching process,
  // segment names as given by Robin's CSV export from Chrome.
  blockhaus: { id: 18867662, name: 'Roccamorice climb', lengthKm: 12.67, fit: 'Close match — both ends sit roughly 400m inside this climb' },
  'borovets-pass': { id: 2661233, name: 'Borovets Pass', lengthKm: 7.61, fit: 'Partial — joins the climb ~1.5km in, covers about 80% to the top' },
  cari: { id: 15124636, name: 'Faido to Carì', lengthKm: 10.94, fit: 'Close match — both ends sit roughly 300m inside this climb' },
  coi: { id: 34193108, name: 'Coi', lengthKm: 5.81, fit: 'Exact match' },
  'col-du-saint-barthelemy': { id: 9661996, name: 'Col du Saint-Barthélemy', lengthKm: 17.0, fit: 'Longer segment — starts ~470m before this climb and runs ~1.2km past its finish' },
  'colle-di-guaitarola': { id: 16433350, name: 'Colle di Guaitarola', lengthKm: 8.58, fit: 'Partial — starts at the climb start, stops ~680m short of the top (~87%)' },
  'corno-alle-scale': { id: 18362145, name: 'Corno alle Scale', lengthKm: 10.22, fit: 'Partial — starts at the climb start, stops ~600m short of the top (~93%)' },
  'cozzo-tunno': { id: 19297709, name: 'Cozzo Tunno', lengthKm: 17.04, fit: 'Longer segment — starts at the climb start but runs ~2.2km past its finish' },
  'forcella-staulanza': { id: 4842549, name: 'Forcella Staulanza', lengthKm: 6.18, fit: 'Exact match (Strava’s own page shows 0m elevation gain, a data glitch — the real climb rises ~410m)' },
  leontica: { id: 8984767, name: 'Leontica', lengthKm: 2.88, fit: 'Exact match' },
  'lin-noir': { id: 8217478, name: 'Lin Noir', lengthKm: 7.53, fit: 'Exact match' },
  'montagna-grande-di-viggiano': { id: 23953372, name: 'Montagna Grande di Viggiano', lengthKm: 6.03, fit: 'Close match — stops ~390m short of the top' },
  'passo-duran': { id: 15309198, name: 'La Valle Agordina to Passo Duran', lengthKm: 9.38, fit: 'Partial — joins the climb ~2km in, covers about 78% to the top' },
  'passo-falzarego': { id: 5363324, name: 'Pocol to Passo Valparola', lengthKm: 11.35, fit: 'Longer segment — passes this climb’s finish and runs ~1.2km beyond it' },
  'passo-giau': { id: 40138330, name: 'Passo Giau', lengthKm: 9.53, fit: 'Exact match' },
  piancavallo: { id: 1404340, name: 'Piancavallo', lengthKm: 13.84, fit: 'Close match — stops ~480m short of the top' },
  'piani-di-pezze': { id: 18429948, name: 'Alleghe junction to Piani di Pezzè', lengthKm: 4.93, fit: 'Close match — starts ~200m inside this climb' },
  pila: { id: 22886167, name: 'Pila', lengthKm: 16.71, fit: 'Exact match' },
  roccaraso: { id: 14948040, name: 'Roccaraso', lengthKm: 4.18, fit: 'Partial — lower section only (~58%); no segment found reaching the top from this side' },
  verrogne: { id: 17576643, name: 'Verrogne', lengthKm: 5.47, fit: 'Exact match' },
};
