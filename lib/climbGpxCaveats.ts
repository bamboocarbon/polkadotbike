/**
 * Climbs whose published GPX is the official categorised segment, not the
 * full physical ascent — a real, longer stretch of the same road continues
 * below the GPX's own start point. Found while auditing every
 * ROADBOOK_ANCHORS entry in scripts/build-climb-routes.ts (2026-08-28):
 * these are the ones where a materially longer/gentler measurement was
 * found and deliberately rejected in favour of the shorter organiser- or
 * Komoot-recognised distance, as opposed to the (much more common) case of
 * simply refining a start point by a few hundred metres, or using the
 * fuller GPX because the old site figure turned out to be the partial one.
 * Robin, re: Grand Ballon: "it starts halfway up but that was how the
 * route was portrayed by the TDF" — same reasoning applies to all eight.
 */
export const GPX_PARTIAL_CLIMB_SLUGS = new Set<string>([
  'grand-ballon',
  'orcieres-merlette',
  'cote-de-monteynard',
  'cote-dengins',
  'col-de-la-croix-de-fer',
  'puerto-de-tarbena',
  'collado-del-alguacil',
  'col-de-mont-louis',
]);

export const GPX_PARTIAL_CLIMB_CAVEAT =
  "This GPX covers the official categorised climb — a real ascent continues below this start point on the same road.";

// Climbs whose GPX download is withheld everywhere (race-page card and 3D map). Empty since 2026-11-24: it held
// the 14 2027 Tour de France UK climbs, hidden on 2026-09-16 while their categories were still "TBC", and Robin
// has now said to offer their downloads. Kept as an (empty) set so ClimbCard and DebugScene need no change if a
// climb has to be withdrawn again.
export const GPX_UNAVAILABLE_CLIMB_SLUGS = new Set<string>([]);

// The 80 already-built 2026 Grand Tour climbs (TDF/Giro/Vuelta) — GPX
// download removed sitewide 2026-09-16 (Robin), the map toolbar slot it
// occupied handed over to a "View segment on Strava" link instead
// (lib/climbStravaSegments.ts), race by race as each race's matching
// segments get found (Giro done first). Until a climb's own entry lands
// in CLIMB_STRAVA_SEGMENTS, its toolbar shows neither button — a
// deliberate gap during the handover, not a bug.
export const GPX_2026_GRAND_TOUR_SLUGS = new Set<string>([
  // Giro 2026 (20)
  'blockhaus',
  'borovets-pass',
  'cari',
  'coi',
  'col-du-saint-barthelemy',
  'colle-di-guaitarola',
  'corno-alle-scale',
  'cozzo-tunno',
  'forcella-staulanza',
  'leontica',
  'lin-noir',
  'montagna-grande-di-viggiano',
  'passo-duran',
  'passo-falzarego',
  'passo-giau',
  'piancavallo',
  'piani-di-pezze',
  'pila',
  'roccaraso',
  'verrogne',
  // TDF 2026 (29)
  'alpe-dhuez',
  'ballon-dalsace',
  'col-bayard',
  'col-daspin',
  'col-de-coudons',
  'col-de-la-croix-de-fer',
  'col-de-la-griffoul',
  'col-de-montsegur',
  'col-de-pertus',
  'col-de-sarenne',
  'col-de-toses-collada-de-toses',
  'col-dornon',
  'col-du-galibier',
  'col-du-haag',
  'col-du-noyer',
  'col-du-page',
  'col-du-telegraphe',
  'col-du-tourmalet',
  'cote-de-begues',
  'cote-de-larringes',
  'cote-de-monteynard',
  'cote-dengins',
  'gavarnie-gedre',
  'grand-ballon',
  'le-saleve-col-de-la-croisette',
  'orcieres-merlette',
  'plateau-de-solaison-brison',
  'puy-mary-pas-de-peyrol',
  'suc-au-may',
  // Vuelta 2026 (31)
  'alto-de-aitana',
  'alto-de-velefique',
  'alto-del-desierto-de-las-palmas',
  'alto-del-legionario',
  'aramon-valdelinares',
  'calar-alto',
  'col-de-mont-louis',
  'coll-dordino',
  'collada-de-beixalis',
  'collado-del-alguacil',
  'collado-garcia',
  'font-romeu',
  'penas-blancas',
  'port-denvalira',
  'puerto-de-barx',
  'puerto-de-el-duque',
  'puerto-de-el-miserat',
  'puerto-de-el-purche',
  'puerto-de-granada',
  'puerto-de-la-serratella',
  'puerto-de-las-abejas',
  'puerto-de-locubin',
  'puerto-de-los-villares',
  'puerto-de-san-rafael',
  'puerto-de-tarbena',
  'puerto-de-tudons',
  'puerto-del-viento',
  'puerto-el-bartolo',
  'puerto-el-remolcador',
  'sierra-de-la-pandera',
  'venta-de-la-cebada',
]);

// The 2027 Tour de France and Giro climbs. Same end state as the 2026 Grand Tours above: the race-page card keeps
// "Download GPX" and the 3D map shows the "View segment on Strava" link instead of it. Unlike 2026, most of these
// don't have a Strava segment matched yet, so the 3D map only drops its Download GPX button for a climb once it has
// one (see DebugScene) — until then it keeps the download rather than showing neither. Add a climb's Strava
// segment to lib/climbStravaSegments.ts and the swap happens by itself.
export const GPX_2027_GRAND_TOUR_SLUGS = new Set<string>([
  // Tour de France 2027 (37)
  'col-de-bagargui',
  'col-de-burdincurutcheta',
  'col-de-la-colombiere',
  'col-de-la-croix-fry-la-clusaz',
  'col-de-la-forclaz-de-queige',
  'col-de-la-lusette',
  'col-de-portet',
  'col-de-richemond',
  'col-de-soudet',
  'col-du-berthiand',
  'col-du-marie-blanque',
  'col-du-plan-du-saleve',
  'col-du-pre',
  'col-du-soulor',
  'col-du-tourmalet-2027',
  'col-du-vent',
  'cote-de-bannau-brycheiniog',
  'cote-de-belmont',
  'cote-de-caerffili',
  'cote-de-domancy',
  'cote-de-epynt',
  'cote-de-gelligaer',
  'cote-de-hengoed',
  'cote-de-jubilee-tower',
  'cote-de-la-croix-neuve',
  'cote-de-maerdy',
  'cote-de-melrose',
  'cote-de-parbold',
  'cote-de-penrhys',
  'cote-de-rhigos',
  'cote-de-trough-of-bowland',
  'cote-de-waddington-fell',
  'cote-des-neyrolles',
  'grand-colombier',
  'hourquette-d-ancizan',
  'montee-de-bisanne',
  'montee-de-brison',
  // Giro d'Italia 2027 (20)
  'bieno-borgo-valsugana',
  'culmine-di-san-pietro',
  'forca-di-presta',
  'forca-ventolosa',
  'gavia-ponte-di-legno',
  'madonna-del-ghisallo',
  'madonna-di-campiglio',
  'mirago',
  'mortirolo-mazzo',
  'passo-ballino',
  'passo-daone',
  'passo-dei-due-santi-zeri',
  'passo-duron',
  'passo-durone',
  'piani-di-bobbio',
  'sarnano-sassotetto',
  'sella-valcalda',
  'subiaco-monte-livata',
  'sulmona-campo-di-giove',
  'zoncolan-ovaro',
]);
