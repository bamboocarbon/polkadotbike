import climbsData from '@/data/climbs.json';

interface StageClimb {
  race: string;
  stage: number;
  name: string;
  cat: string;
  kbf: number;
}

interface Stage {
  num: number;
  start: string;
  finish: string;
  dist: number;
  vgain: number;
}

const CAT_LABEL: Record<string, string> = {
  HC: 'an Hors Catégorie (beyond-category) climb',
  ESP: "an Especial-category climb — La Vuelta's own toughest tier",
  Cat1: 'a Category 1 climb',
  Cat2: 'a Category 2 climb',
  Cat3: 'a Category 3 climb',
};

const MAJOR_CATS = new Set(['HC', 'ESP', 'Cat1', 'Cat2']);

/** climb-index.json's name has no "(1st/2nd ascent)" suffix, but
 *  data/climbs.json's does for climbs ridden twice in one stage (e.g.
 *  Puerto de El Purche on Vuelta stage 20) — match on either. */
function findStageEntries(name: string, race: string): StageClimb[] {
  const all = climbsData.climbs as StageClimb[];
  const exact = all.filter((c) => c.race === race && c.name === name);
  if (exact.length) return exact;
  return all.filter((c) => c.race === race && c.name.startsWith(name + ' ('));
}

export interface ClimbSummaryInput {
  name: string;
  range: string;
  cat: string;
  len: number;
  grad: number;
  elev: number;
  race: 'tdf' | 'giro' | 'vuelta';
}

/** Builds a short, factual paragraph from data already in the repo — the
 *  climb's own stats, its position in its stage, and whether it decides
 *  the stage (summit finish, or the last major climb before one). Never
 *  invents anything not already in climb-index.json/data/climbs.json. */
const GEAR_TOOL_SENTENCE = "Set your groupset — Shimano, SRAM, Campagnolo or a custom setup — and see exactly which gears get you up it, kilometre by kilometre.";

export function buildClimbSummary(input: ClimbSummaryInput): string {
  const { name, range, cat, len, grad, elev, race } = input;
  const catLabel = CAT_LABEL[cat] || `a ${cat} climb`;

  const sentence1 = `${name} is ${catLabel} in ${range} — ${len}km at ${grad}% average gradient, cresting at ${elev.toLocaleString()}m.`;

  const entries = findStageEntries(name, race);
  if (!entries.length) return `${sentence1} ${GEAR_TOOL_SENTENCE}`;

  const raceInfo = (climbsData.races as Record<string, { name: string; stages: Stage[] }>)[race];
  const raceName = raceInfo?.name || race;

  const ridTwiceSameStage = entries.length > 1 && new Set(entries.map((e) => e.stage)).size === 1;

  if (ridTwiceSameStage) {
    const stage = raceInfo?.stages.find((s) => s.num === entries[0].stage);
    const stageDesc = stage ? `Stage ${stage.num} of ${raceName} (${stage.start} → ${stage.finish}, ${stage.dist}km)` : `Stage ${entries[0].stage} of ${raceName}`;
    const distances = entries.map((e) => `${e.kbf}km`).join(' and then ');
    const sentence2 = `It's climbed twice on ${stageDesc} — ${distances} from the finish.`;
    return `${sentence1} ${sentence2} ${GEAR_TOOL_SENTENCE}`;
  }

  const stageSentences = entries.map((entry) => {
    const stage = raceInfo?.stages.find((s) => s.num === entry.stage);
    const stageDesc = stage ? `Stage ${stage.num} of ${raceName} (${stage.start} → ${stage.finish}, ${stage.dist}km)` : `Stage ${entry.stage} of ${raceName}`;

    if (entry.kbf === 0) {
      return `It's the summit finish of ${stageDesc} — the decisive climb of the day.`;
    }

    const stageClimbs = (climbsData.climbs as StageClimb[]).filter((c) => c.race === race && c.stage === entry.stage);
    const majorClimbs = stageClimbs.filter((c) => MAJOR_CATS.has(c.cat));
    const isLastMajor = majorClimbs.length > 0 && majorClimbs.every((c) => c.kbf >= entry.kbf);

    if (isLastMajor && MAJOR_CATS.has(cat)) {
      return `It's the last major climb of ${stageDesc}, cresting ${entry.kbf}km from the finish — often the launchpad for the day's decisive move.`;
    }
    return `It comes ${entry.kbf}km from the finish of ${stageDesc}.`;
  });

  const uniqueStageSentences = Array.from(new Set(stageSentences));
  return `${sentence1} ${uniqueStageSentences.join(' ')} ${GEAR_TOOL_SENTENCE}`;
}
