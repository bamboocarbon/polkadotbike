/**
 * A one-sentence description of each climb's actual shape (where it
 * steepens, how consistent it is) — grounded in the real per-km gradient
 * profile data already built for each climb (see app/tour-de-france-2027/
 * page.tsx's STAGES array, the source of these figures), not invented
 * place names or unverified history.
 *
 * Only for the 10 2027 UK climbs that have no verified Tour of Britain (or
 * other real) history to show instead — see CLIMB_HISTORY_NOTES in
 * lib/climbHistory.ts for the other 4 (Melrose, Waddington Fell, Caerffili,
 * Rhigos), which get that real history on their individual page instead of
 * one of these. Adapted from the shorter captions used under each climb's
 * card on the 2027 TDF overview page into full sentences for this page's
 * paragraph — same facts, reworded to fit.
 */
export const CLIMB_PROFILE_NOTES: Record<string, string> = {
  'cote-de-jubilee-tower':
    'The steepest test comes early — a 10%+ second kilometre — before three gentler kilometres carry the road to the top.',
  'cote-de-trough-of-bowland':
    'A gentle opening kilometre gives way to a much steeper final pitch near 8%.',
  'cote-de-belmont':
    'Its punchy middle kilometre, close to 5.5%, is bookended by two much easier ones.',
  'cote-de-parbold':
    'It doubles in gradient for its second and final kilometre, close to 8%.',
  'cote-de-epynt':
    'It builds steadily to a genuinely hard third kilometre near 10%, and barely eases before the summit.',
  'cote-de-bannau-brycheiniog':
    'It’s the longest of the UK climbs, but remarkably steady — every kilometre sits within a point of 3.5%, with no real sting in the tail.',
  'cote-de-penrhys':
    'Short and consistently brutal, both kilometres average close to 10%, with the second slightly steeper again.',
  'cote-de-maerdy':
    'It’s hardest right from the start — over 9% in the opening kilometre — before easing slightly into the finish.',
  'cote-de-gelligaer':
    'A demanding opening kilometre at nearly 6% softens into a gentle run-in for the second.',
  'cote-de-hengoed':
    'Barely 700m long but averaging almost 11% throughout, it’s a short, sharp shock of a climb.',
};
