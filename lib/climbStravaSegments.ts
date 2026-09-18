/**
 * Strava segment links for the site's built climbs — found via Claude in
 * Chrome, matching by segment start/finish coordinates against each
 * climb's own GPX endpoints, not by name (several of these roads have
 * multiple overlapping segments). Started 2026-09-16 with the 14 2027 TDF
 * UK climbs, then extended the same day to Giro 2026's 20, TDF 2026's 29,
 * and Vuelta 2026's 31 — all 3 Grand Tours' built climbs now covered.
 * Every 2026 Grand Tour climb's GPX download is already removed sitewide
 * (GPX_2026_GRAND_TOUR_SLUGS in climbGpxCaveats.ts), so a climb with no
 * Strava link either genuinely has no usable match (checked and confirmed
 * — alto-del-legionario, puerto-de-granada, puerto-de-los-villares; see
 * their omission below) or, for anything outside these 3 races, hasn't
 * been searched yet.
 *
 * Deliberately NO rider names or times here. Strava's API Agreement
 * restricts displaying one user's Strava data to anyone other than that
 * user, and most of the KOM/QOM holders found for these climbs are private
 * individuals, not public figures — republishing their names/times as a
 * site feature isn't something to risk. Linking to Strava's own segment
 * page (where the real, current leaderboard lives) is the safe version of
 * the same idea, and sends Strava traffic rather than competing with them.
 *
 * `name` is the segment's own title on Strava — only set when Robin's
 * source (the UK climbs' own hand-typed table, or a fit_note that plainly
 * states it) actually gave one. The Giro/TDF CSV exports have no segment-
 * name column, just an id/url/length/fit/fit_note, so most entries below
 * have no `name` at all rather than guessing one from the climb's own
 * name — don't backfill a name onto these without a real source.
 */
export interface ClimbStravaSegment {
  id: number;
  name?: string;
  lengthKm: number;
  /** How this segment's own start/finish compares to this climb's, in plain terms. */
  fit: string;
  /**
   * A named, public-figure performance worth stating outright, as distinct
   * from the ordinary KOM/QOM holders on these segments — Robin's call,
   * 2026-09-16: Pavel Sivakov (a WorldTour pro) is "more widely known than
   * just Strava", unlike the private individuals holding the other climbs'
   * fastest times, which stay unpublished. Couldn't independently
   * corroborate the specific time outside Strava itself, so it's presented
   * as a fact about a public figure's public athletic performance (the same
   * category cycling media routinely reports), not as republished
   * leaderboard data — only add further entries here on the same basis.
   */
  notablePerformance?: string;
}

export const CLIMB_STRAVA_SEGMENTS: Record<string, ClimbStravaSegment> = {
  // 2027 TDF UK (14) — segment names given directly by Robin.
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

  // Giro 2026 (20) — CSV export from Chrome has no segment-name column, so
  // `name` is only set on the 4 rows whose fit_note plainly stated one.
  blockhaus: { id: 18867662, name: 'Roccamorice climb', lengthKm: 12.67, fit: 'Close match — both ends sit roughly 400m inside this climb' },
  'borovets-pass': { id: 2661233, lengthKm: 7.61, fit: 'Partial — joins the climb ~1.5km in, covers about 80% to the top' },
  cari: { id: 15124636, name: 'Faido to Carì', lengthKm: 10.94, fit: 'Close match — both ends sit roughly 300m inside this climb' },
  coi: { id: 34193108, lengthKm: 5.81, fit: 'Exact match' },
  'col-du-saint-barthelemy': { id: 9661996, lengthKm: 17.0, fit: 'Longer segment — starts ~470m before this climb and runs ~1.2km past its finish' },
  'colle-di-guaitarola': { id: 16433350, lengthKm: 8.58, fit: 'Partial — starts at the climb start, stops ~680m short of the top (~87%)' },
  'corno-alle-scale': { id: 18362145, lengthKm: 10.22, fit: 'Partial — starts at the climb start, stops ~600m short of the top (~93%)' },
  'cozzo-tunno': { id: 19297709, lengthKm: 17.04, fit: 'Longer segment — starts at the climb start but runs ~2.2km past its finish' },
  'forcella-staulanza': { id: 4842549, lengthKm: 6.18, fit: 'Exact match (Strava’s own page shows 0m elevation gain, a data glitch — the real climb rises ~410m)' },
  leontica: { id: 8984767, lengthKm: 2.88, fit: 'Exact match' },
  'lin-noir': { id: 8217478, lengthKm: 7.53, fit: 'Exact match' },
  'montagna-grande-di-viggiano': { id: 23953372, lengthKm: 6.03, fit: 'Close match — stops ~390m short of the top' },
  'passo-duran': { id: 15309198, lengthKm: 9.38, fit: 'Partial — joins the climb ~2km in near La Valle Agordina, covers about 78% to the top' },
  'passo-falzarego': { id: 5363324, name: 'Pocol to Passo Valparola', lengthKm: 11.35, fit: 'Longer segment — passes this climb’s finish and runs ~1.2km beyond it' },
  'passo-giau': { id: 40138330, lengthKm: 9.53, fit: 'Exact match' },
  piancavallo: { id: 1404340, lengthKm: 13.84, fit: 'Close match — stops ~480m short of the top' },
  'piani-di-pezze': { id: 18429948, name: 'Alleghe junction to Piani di Pezzè', lengthKm: 4.93, fit: 'Close match — starts ~200m inside this climb' },
  pila: { id: 22886167, lengthKm: 16.71, fit: 'Exact match' },
  roccaraso: { id: 14948040, lengthKm: 4.18, fit: 'Partial — lower section only (~58%); no segment found reaching the top from this side' },
  verrogne: { id: 17576643, lengthKm: 5.47, fit: 'Exact match' },

  // TDF 2026 (29) — same CSV shape as Giro, no segment-name column.
  'alpe-dhuez': { id: 652851, lengthKm: 12.02, fit: 'Partial — the classic Bourg d’Oisans segment; starts at the climb start, stops ~850m short of the finish (~87%)' },
  'ballon-dalsace': { id: 31450149, lengthKm: 8.86, fit: 'Close match' },
  'col-bayard': { id: 10234259, lengthKm: 6.25, fit: 'Longer segment — starts ~1km before this climb, ends at the top' },
  'col-daspin': { id: 37857720, lengthKm: 11.92, fit: 'Exact match — ends align; Strava’s segment length runs about 1km longer than this climb’s own measured length' },
  'col-de-coudons': { id: 2277925, lengthKm: 10.88, fit: 'Exact match' },
  'col-de-la-croix-de-fer': { id: 37857789, lengthKm: 27.6, fit: 'Longer segment — starts ~3.6km before this climb, ends at the top' },
  'col-de-la-griffoul': { id: 17770964, lengthKm: 12.57, fit: 'Longer segment (weak match) — starts ~6.8km before this climb (from Brezons), ends near the top; no tighter segment found' },
  'col-de-montsegur': { id: 2375801, lengthKm: 9.97, fit: 'Close match' },
  'col-de-pertus': { id: 11836085, lengthKm: 4.39, fit: 'Close match' },
  'col-de-sarenne': { id: 4610074, lengthKm: 9.41, fit: 'Partial — covers only the top ~73%, joins this climb ~3.5km in' },
  'col-de-toses-collada-de-toses': { id: 10052732, lengthKm: 16.38, fit: 'Partial — Planoles to the top, covers about 89% of this climb' },
  'col-dornon': { id: 24434058, lengthKm: 13.84, fit: 'Longer segment — starts ~4.2km before this climb, ends at the top' },
  'col-du-galibier': { id: 5142903, lengthKm: 18.19, fit: 'Exact match' },
  'col-du-haag': { id: 24441293, lengthKm: 11.15, fit: 'Exact match' },
  'col-du-noyer': { id: 36908155, lengthKm: 7.42, fit: 'Exact match' },
  'col-du-page': { id: 29664997, lengthKm: 2.94, fit: 'Partial (weak match) — covers only the final ~2.9km (~29%); no segment found for the lower climb from Kruth' },
  'col-du-telegraphe': { id: 616079, lengthKm: 11.96, fit: 'Close match — starts ~700m from this climb’s start, ends at the top (~93%)' },
  'col-du-tourmalet': { id: 37855763, lengthKm: 16.89, fit: 'Exact match' },
  'cote-de-begues': { id: 16770991, lengthKm: 6.37, fit: 'Partial (weak match) — covers only the upper ~54%, runs ~400m past the finish; no segment found from the coast' },
  'cote-de-larringes': { id: 29873773, lengthKm: 7.75, fit: 'Partial — covers the top ~78%' },
  'cote-de-monteynard': { id: 679970, lengthKm: 7.62, fit: 'Partial — covers the top ~79%' },
  'cote-dengins': { id: 4796017, lengthKm: 11.99, fit: 'Close match — start is ~500–700m off this climb’s start, ends at the top (Strava’s own page shows 0m elevation gain, a data glitch)' },
  'gavarnie-gedre': { id: 14213174, lengthKm: 17.03, fit: 'Partial — covers the top ~88%, runs ~200m past the finish' },
  'grand-ballon': { id: 749400, lengthKm: 6.42, fit: 'Exact match' },
  'le-saleve-col-de-la-croisette': { id: 41769720, lengthKm: 7.04, fit: 'Exact match — ends align; Strava’s segment length runs about 1km longer than this climb’s own measured length' },
  'orcieres-merlette': { id: 692862, lengthKm: 7.4, fit: 'Close match — runs ~390m past the finish' },
  'plateau-de-solaison-brison': { id: 18522427, lengthKm: 9.87, fit: 'Partial — covers the top ~80%' },
  'puy-mary-pas-de-peyrol': { id: 21518000, lengthKm: 10.82, fit: 'Longer segment — starts ~2.7km before this climb, ends at the top' },
  'suc-au-may': { id: 10252510, lengthKm: 3.9, fit: 'Exact match' },

  // Vuelta 2026 (28 of 31 — alto-del-legionario, puerto-de-granada and
  // puerto-de-los-villares are deliberately absent: checked and confirmed
  // no usable Strava match, not just unsearched. Los Villares' coordinates
  // were re-verified against its own route file — nearby segments there
  // genuinely climb from a different side of the mountain, not a lookup
  // error.) Same CSV shape as Giro/TDF, no segment-name column.
  'alto-de-aitana': { id: 40721795, lengthKm: 7.75, fit: 'Partial (weak match) — covers only the lower ~41% from Sella; no segment found for the upper climb to the summit from this side' },
  'alto-de-velefique': { id: 8364179, name: 'Tabernas to Velefique', lengthKm: 28.93, fit: 'Partial — starts ~1.1km before this climb’s start, stops ~1.25km short of the top (~93% of the climb)' },
  'alto-del-desierto-de-las-palmas': { id: 26110379, lengthKm: 9.88, fit: 'Longer segment — starts ~700m from this climb’s start, passes the finish and runs ~2.8km beyond' },
  'aramon-valdelinares': { id: 12218520, lengthKm: 5.18, fit: 'Partial (weak match) — covers only the lower ~52%' },
  'calar-alto': { id: 8323120, lengthKm: 16.76, fit: 'Close match — covers about 93% of the climb' },
  'col-de-mont-louis': { id: 1746811, lengthKm: 18.89, fit: 'Partial — starts ~2.4km before this climb’s start, stops ~1.6km short of the top (~90% of the climb)' },
  'coll-dordino': { id: 6137187, lengthKm: 9.84, fit: 'Close match' },
  'collada-de-beixalis': { id: 20953385, lengthKm: 6.4, fit: 'Close match' },
  'collado-del-alguacil': { id: 9436092, lengthKm: 7.73, fit: 'Close match' },
  'collado-garcia': { id: 35689327, lengthKm: 3.96, fit: 'Partial — covers the top ~81%' },
  'font-romeu': { id: 14606013, lengthKm: 5.56, fit: 'Partial (weak match) — covers only the top ~42%, runs ~1.9km past the finish' },
  'penas-blancas': { id: 1781169, lengthKm: 14.26, fit: 'Partial — covers the top ~77%' },
  'port-denvalira': { id: 12300903, name: 'Encamp to the top', lengthKm: 21.23, fit: 'Partial — covers about 82% of the climb' },
  'puerto-de-barx': { id: 7196320, lengthKm: 2.46, fit: 'Partial (weak match) — covers only the final ~26%' },
  'puerto-de-el-duque': { id: 12572849, lengthKm: 7.13, fit: 'Partial — covers the top ~86%' },
  'puerto-de-el-miserat': { id: 7013808, lengthKm: 6.16, fit: 'Partial — covers the top ~85%' },
  'puerto-de-el-purche': { id: 16360125, lengthKm: 8.12, fit: 'Close match — covers about 92% of the climb (Strava’s own page shows 0m elevation gain, a data glitch)' },
  'puerto-de-la-serratella': { id: 10985597, lengthKm: 15.16, fit: 'Partial — covers the top ~63%, passes the finish and runs ~3.5km beyond' },
  'puerto-de-las-abejas': { id: 5437463, lengthKm: 14.6, fit: 'Longer segment — starts ~4.1km before this climb, ends at the top' },
  'puerto-de-locubin': { id: 1580091, lengthKm: 8.06, fit: 'Partial — covers the top ~77%' },
  'puerto-de-san-rafael': { id: 12423902, lengthKm: 11.4, fit: 'Partial — covers the top ~83%' },
  'puerto-de-tarbena': { id: 6463377, lengthKm: 4.97, fit: 'Partial — covers the top ~72%' },
  'puerto-de-tudons': { id: 632482, lengthKm: 7.36, fit: 'Partial — covers the top ~55%' },
  'puerto-del-viento': { id: 3878458, lengthKm: 13.36, fit: 'Close match' },
  'puerto-el-bartolo': { id: 12320743, lengthKm: 9.07, fit: 'Partial — covers the top ~83%' },
  'puerto-el-remolcador': { id: 9190390, lengthKm: 14.78, fit: 'Close match' },
  'sierra-de-la-pandera': { id: 15910681, lengthKm: 8.23, fit: 'Partial — covers the top ~66%' },
  'venta-de-la-cebada': { id: 4161785, lengthKm: 7.43, fit: 'Exact match' },

  // UCI Worlds Montréal 2026 — found/verified via Claude in Chrome in a
  // real logged-in Strava session, 2026-09-18 (this page's own route is a
  // custom closed-road course, not something regular riders log as a
  // whole, so the usual public-search-then-verify approach didn't apply
  // here). The two candidates found by plain web search first (segment
  // IDs 638378 and 32791013) turned out to be dead/wrong once checked
  // logged-in — replaced with the real current segment below. No segment
  // covers the TT climb (montreal-worlds-tt) or the full 13.5km RR
  // circuit lap itself — only this named climb feature within the lap.
  'montreal-worlds-circuit': {
    id: 37991154,
    name: 'Camillien-Houde after median',
    lengthKm: 1.59,
    fit: 'Exact match for the Camillien-Houde climb only — a short segment partway round this 13.5km lap, not the full circuit',
  },
};
