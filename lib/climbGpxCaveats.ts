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

// The 14 2027 Tour de France UK climbs (races: ["tdf27"] in climb-index.json,
// gateReasons: ["preview"]) — categories are still "TBC", pending official
// announcement, so Robin doesn't want a downloadable GPX offered for these
// yet (2026-09-16). Remove entries here once a climb's category is
// confirmed and Robin wants its GPX offered again.
export const GPX_UNAVAILABLE_CLIMB_SLUGS = new Set<string>([
  'cote-de-bannau-brycheiniog',
  'cote-de-belmont',
  'cote-de-caerffili',
  'cote-de-epynt',
  'cote-de-gelligaer',
  'cote-de-hengoed',
  'cote-de-jubilee-tower',
  'cote-de-maerdy',
  'cote-de-melrose',
  'cote-de-parbold',
  'cote-de-penrhys',
  'cote-de-rhigos',
  'cote-de-trough-of-bowland',
  'cote-de-waddington-fell',
]);
