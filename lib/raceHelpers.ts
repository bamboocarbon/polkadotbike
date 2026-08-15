export interface Stage {
  num: number;
  date: string;
  start: string;
  finish: string;
  dist: number;
  type: 'Mountain' | 'Hilly' | 'Sprint' | 'TTT' | 'ITT' | 'Medium' | 'Flat';
  vgain: number;
  notes: string;
}

export interface Climb {
  race: string;
  stage: number;
  name: string;
  range: string;
  len: number | null;
  grad: number | null;
  elev: number | null;
  cat: 'HC' | 'ESP' | 'Cat1' | 'Cat2' | 'Cat3' | 'Cat4' | 'TBC' | 'Uncat';
  kbf: number | null;
  profile?: number[];
  notes: string;
}

export interface RaceData {
  name: string;
  startDate: string;
  endDate: string;
  queenStage: number;
  country: string;
  stages: Stage[];
}

export const TYPE_INFO: Record<string, { badge: string; cls: string; sidebarCls: string }> = {
  Mountain: { badge: 'Mountain', cls: 'badge-m', sidebarCls: 'type-m' },
  Hilly: { badge: 'Hilly', cls: 'badge-h', sidebarCls: 'type-h' },
  Sprint: { badge: 'Sprint', cls: 'badge-s', sidebarCls: 'type-s' },
  TTT: { badge: 'TTT', cls: 'badge-t', sidebarCls: 'type-t' },
  ITT: { badge: 'ITT', cls: 'badge-t', sidebarCls: 'type-t' },
  // Vuelta-only stage types (its own TYPE_INFO in the source page carried
  // these; TDF/Giro never produce them so adding them here is additive).
  Medium: { badge: 'Medium Mtns', cls: 'badge-mm', sidebarCls: 'type-mm' },
  Flat: { badge: 'Flat', cls: 'badge-s', sidebarCls: 'type-s' },
};

export const CAT_CLS: Record<string, string> = {
  HC: 'cat-hc',
  Cat1: 'cat-cat1',
  Cat2: 'cat-cat2',
  Cat3: 'cat-cat3',
  Cat4: 'cat-cat4',
  TBC: 'cat-tbc',
  // Vuelta's "especial" category — its climb-category ceiling, playing the
  // same role HC plays for TDF/Giro.
  ESP: 'cat-esp',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = DAYS[new Date(y, m - 1, d).getDay()];
  return `${dow} ${d} ${MONTH_SHORT[m - 1]}`;
}

export function gradColor(g: number): string {
  if (g < 5) return '#12b05f';
  if (g < 7) return '#ffcd00';
  if (g < 9) return '#ff6600';
  return '#ee1c28';
}

export function stageClimbs(climbs: Climb[], num: number): Climb[] {
  const list = climbs.filter((c) => c.stage === num);
  return list.slice().sort((a, b) => {
    if (a.kbf === null && b.kbf === null) return 0;
    if (a.kbf === null) return -1;
    if (b.kbf === null) return 1;
    return (b.kbf as number) - (a.kbf as number);
  });
}

// Ported from buildPlanUrl(): reads the Climb Planner's own saved setup out
// of localStorage (shared 'cg_shared' key) so "Plan this climb" carries the
// visitor's groupset/weight/etc. across, not just the gradient/distance.
export function buildPlanUrl(climb: Climb): string {
  const p: Record<string, string> = {};
  try {
    const sh = JSON.parse(localStorage.getItem('cg_shared') || '{}');
    (['d', 'b', 'g', 'cr', 'cs', 'w', 'cad', 'pw', 'wt', 'cda', 'ck'] as const).forEach((k) => {
      if (sh[k] !== undefined && sh[k] !== '') p[k] = String(sh[k]);
    });
  } catch {
    // localStorage unavailable — plan link still works, just without the carried-over setup
  }
  p.gr = String(Math.round(climb.grad as number));
  p.dst = String(climb.len);
  return '/climb.html?' + new URLSearchParams(p).toString();
}

// The static SEO index is a server component — no localStorage there, so it
// needs its own, simpler link builder rather than buildPlanUrl above.
// Matches gen_static_index.js's original (now-deleted) version exactly:
// just gradient + distance, no carried-over Climb Planner setup.
export function buildStaticPlanUrl(climb: Climb): string {
  return `/climb?gr=${Math.round(climb.grad as number)}&dst=${climb.len}`;
}

// The tri-state default-stage picker (3.3). Deliberately takes `today` as a
// parameter rather than calling `new Date()` itself — the server-stable
// variant and the client-corrected variant both go through this same
// function, just with a different `today`, so there's exactly one place
// the actual stage-picking logic lives.
export function defaultStage(race: RaceData, today: string): number {
  const first = race.stages[0].date;
  const last = race.stages[race.stages.length - 1].date;

  if (today < first) return 1;
  if (today > last) return race.queenStage;

  const match = race.stages.find((s) => s.date === today);
  if (match) return match.num;
  const past = race.stages.filter((s) => s.date <= today);
  return past.length ? past[past.length - 1].num : 1;
}

function isoToday(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Server-stable default (3.3): a build-time snapshot is fine for deciding
// "has this race finished yet", but NOT for picking "today's stage" — the
// server doesn't know the visitor's "now". So this collapses to the safe
// two-state version (stage 1 upcoming, queen stage once over) and leaves
// the true tri-state pick to the client, in useEffect, after hydration.
export function staticDefaultStage(race: RaceData, buildDate: Date): number {
  const today = isoToday(buildDate);
  if (today > race.stages[race.stages.length - 1].date) return race.queenStage;
  return 1;
}

// Client-side correction, called from useEffect only — never during render,
// which is what avoids the hydration mismatch (the server never asserts
// this value; it only asserts staticDefaultStage's).
export function clientDefaultStage(race: RaceData): number {
  return defaultStage(race, isoToday(new Date()));
}

export interface RaceStats {
  stages: number;
  mountainStages: number;
  specialClimbCount: number;
  specialSummitFinishes: number;
  startLabel: string;
  endLabel: string;
}

const MONTH_SHORT_STATS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT_STATS[m - 1]}`;
}

// Computed from data instead of hand-transcribed per race — verified
// against the hardcoded hero-stats values already live on all three pages
// before relying on this (all matched exactly: 21/8/6/2 for TDF).
export function raceStats(race: RaceData, climbs: Climb[], specialCat: string): RaceStats {
  return {
    stages: race.stages.length,
    mountainStages: race.stages.filter((s) => s.type === 'Mountain').length,
    specialClimbCount: climbs.filter((c) => c.cat === specialCat).length,
    specialSummitFinishes: climbs.filter((c) => c.cat === specialCat && c.kbf === 0).length,
    startLabel: shortDate(race.startDate),
    endLabel: shortDate(race.endDate),
  };
}

// Ported from gen_static_index.js's intro-paragraph builder. Returns
// {before, after} rather than one string — the source text has a real
// <a href="climb.html"> embedded mid-sentence ("...open it in the Climb
// Planner and work out..."), which a plain string return would lose
// (StaticIndex is a server component; the text is rendered as a string,
// not parsed as HTML). The caller renders `{before}<a>Climb Planner</a>
// {after}`.
export interface RaceIntro {
  before: string;
  after: string;
}

export function raceIntro(
  race: RaceData,
  climbs: Climb[],
  specialCat: string,
  specialLabel: string
): RaceIntro {
  const catCount = climbs.filter((c) => c.cat !== 'TBC').length;
  const specialCount = climbs.filter((c) => c.cat === specialCat).length;
  const mtnCount = race.stages.filter((s) => s.type === 'Mountain').length;
  const first = race.stages[0];
  const last = race.stages[race.stages.length - 1];
  const highest = climbs
    .filter((c) => c.cat !== 'TBC' && c.elev)
    .sort((a, b) => (b.elev as number) - (a.elev as number))[0];

  return {
    before: `The ${race.name} runs from ${fmtDate(first.date)} (${first.start}) to ${fmtDate(last.date)} (${last.finish}) — ${race.stages.length} stages, ${mtnCount} of them mountain stages, with ${catCount} categorised climbs including ${specialCount} ${specialLabel} ascents. The highest point of the race is ${highest.name} at ${highest.elev!.toLocaleString()}m. Every stage and climb is listed below with its length, average gradient and summit altitude — follow any climb's link to open it in the `,
    after: ` and work out the gearing you'd need to ride it yourself.`,
  };
}
