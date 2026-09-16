/**
 * Real race history for individual 2027 TDF UK climbs — leads sourced from
 * Grok, independently verified by Claude against ProCyclingStats,
 * Cyclingnews, Cycling Weekly and official race sites before use
 * (2026-09-16). Only added where the core claim (stage, winner, climb
 * figures) checked out; specific sub-details that didn't independently
 * corroborate are left out even where the broader claim held up (e.g.
 * Rhigos: confirmed as one of the 2023 Tour of Britain's first KOM
 * climbs, but the claim that James Fouché scored his KOM points there
 * specifically — as opposed to elsewhere in the race he also won the
 * mountains classification of — wasn't independently confirmed, so it's
 * omitted). One claim (Belmont/"Rivington Road" supposedly featuring in
 * the 2023 Tour of Britain's opening stage) was checked and found to be
 * wrong — that stage's real categorised climbs were Grains Bar and
 * Ramsbottom Rake — so Belmont has no entry here.
 */
export const CLIMB_HISTORY_NOTES: Record<string, string> = {
  'cote-de-melrose':
    'It was the decisive climb of Stage 3 (Kelso–Kelso) at the 2025 Tour of Britain Women, climbed twice — Cat Ferguson took the race lead with a stage-winning sprint after the second ascent.',
  'cote-de-waddington-fell':
    'It was the opening climb and stage high point of Stage 2 (Clitheroe–Blackpool) at the 2026 Tour of Britain Women, won by Lorena Wiebes.',
  'cote-de-caerffili':
    'Caerphilly Mountain has hosted the Tour of Britain repeatedly, including Sam Bennett’s first professional win there in 2013 and a decisive double ascent on the race’s final stage in 2023, where Carlos Rodríguez won the stage and Wout van Aert sealed overall victory.',
  'cote-de-rhigos':
    'It featured as one of the first climbs of the 2023 Tour of Britain’s queen stage, which finished with a double ascent of Caerphilly Mountain and saw Carlos Rodríguez solo to the stage win as Wout van Aert secured the overall title.',
};
