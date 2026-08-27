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
