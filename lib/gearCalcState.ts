import { DB, DISC_BRANDS, WHEELS, Discipline, Brand, BrandGroupsets, Groupset } from '@/lib/gearDb';

export type ChartMode = 'dev' | 'spd' | 'in';
export type SpeedUnit = 'kmh' | 'mph';

export interface CustomState {
  crankType: '1x' | '2x';
  big: number;
  small: number;
  cassetteText: string;
}

export interface GearCalcState {
  discipline: Discipline;
  brand: Brand;
  groupset: string | null;
  crIdx: number;
  cassetteLabel: string;
  wheelCirc: number;
  cadence: number;
  unit: SpeedUnit;
  chartMode: ChartMode;
  cust: CustomState;
}

export const CUST_LIMITS: { big: [number, number]; small: [number, number] } = { big: [32, 70], small: [22, 52] };

// Era-major, then file-declaration-order-within-era — matches populateGroupsets()'s
// own Object.keys() iteration exactly (JS preserves string-key insertion order).
export function firstGroupsetKey(brandData: BrandGroupsets): string {
  for (const era of brandData._eras) {
    for (const name of Object.keys(brandData)) {
      if (name === '_eras') continue;
      if ((brandData as Record<string, Groupset>)[name].era === era) return name;
    }
  }
  return Object.keys(brandData).find((k) => k !== '_eras')!;
}

// Grouped {era, names[]} pairs in display order, for <optgroup> rendering —
// same grouping logic as populateGroupsets(), era-major then declaration order.
export function groupsetOptionsFor(discipline: Discipline, brand: Exclude<Brand, 'custom'>): { era: string; names: string[] }[] {
  const brandData = DB[discipline][brand]!;
  const groups: Record<string, string[]> = {};
  brandData._eras.forEach((e) => (groups[e] = []));
  Object.keys(brandData).forEach((name) => {
    if (name === '_eras') return;
    const gs = (brandData as Record<string, Groupset>)[name];
    if (gs?.era && groups[gs.era] !== undefined) groups[gs.era].push(name);
  });
  return brandData._eras.filter((era) => groups[era]?.length).map((era) => ({ era, names: groups[era] }));
}

function groupsetDefaultsFor(discipline: Discipline, brand: Exclude<Brand, 'custom'>) {
  const brandData = DB[discipline][brand]!;
  const key = firstGroupsetKey(brandData);
  const data = (brandData as Record<string, Groupset>)[key];
  return { groupset: key, crIdx: 0, cassetteLabel: data.cassettes[0].label };
}

export function defaultCalcState(): GearCalcState {
  const discipline: Discipline = 'road';
  const brand: Brand = 'shimano';
  const gs = groupsetDefaultsFor(discipline, brand);
  const wheelCirc = WHEELS[discipline].find((w) => w.dflt)?.circ ?? WHEELS[discipline][0].circ;
  return {
    discipline,
    brand,
    ...gs,
    wheelCirc,
    cadence: 90,
    unit: 'kmh',
    chartMode: 'dev',
    cust: { crankType: '2x', big: 50, small: 34, cassetteText: '11,13,15,17,19,22,25,28' },
  };
}

export function applyDiscipline(state: GearCalcState, d: Discipline): GearCalcState {
  const brands = DISC_BRANDS[d];
  const brand: Brand = state.brand !== 'custom' && !brands.includes(state.brand) ? brands[0] : state.brand;
  const wheelList = WHEELS[d];
  const wheelCirc = wheelList.find((w) => w.circ === state.wheelCirc)?.circ ?? wheelList.find((w) => w.dflt)?.circ ?? wheelList[0].circ;
  const gs = brand === 'custom' ? { groupset: null, crIdx: 0, cassetteLabel: '' } : groupsetDefaultsFor(d, brand);
  return { ...state, discipline: d, brand, wheelCirc, ...gs };
}

export function applyBrand(state: GearCalcState, b: Brand): GearCalcState {
  const gs = b === 'custom' ? { groupset: null, crIdx: 0, cassetteLabel: '' } : groupsetDefaultsFor(state.discipline, b);
  return { ...state, brand: b, ...gs };
}

export function applyGroupset(state: GearCalcState, groupsetName: string): GearCalcState {
  if (state.brand === 'custom') return state;
  const brandData = DB[state.discipline][state.brand as Exclude<Brand, 'custom'>] as BrandGroupsets;
  const data = brandData[groupsetName] as Groupset | undefined;
  if (!data) return state;
  return { ...state, groupset: groupsetName, crIdx: 0, cassetteLabel: data.cassettes[0].label };
}

export function applyCrIdx(state: GearCalcState, i: number): GearCalcState {
  return { ...state, crIdx: i };
}

export function applyCassette(state: GearCalcState, label: string): GearCalcState {
  return { ...state, cassetteLabel: label };
}

export function applyWheel(state: GearCalcState, circ: number): GearCalcState {
  return { ...state, wheelCirc: circ };
}

export function applyCadence(state: GearCalcState, cadence: number): GearCalcState {
  return { ...state, cadence };
}

export function applyUnit(state: GearCalcState, unit: SpeedUnit): GearCalcState {
  return { ...state, unit };
}

export function applyChartMode(state: GearCalcState, chartMode: ChartMode): GearCalcState {
  return { ...state, chartMode };
}

export function applyCrankMode(state: GearCalcState, mode: '1x' | '2x'): GearCalcState {
  return { ...state, cust: { ...state.cust, crankType: mode } };
}

export function applyCustAdjust(state: GearCalcState, key: 'big' | 'small', delta: number): GearCalcState {
  const [mn, mx] = CUST_LIMITS[key];
  let big = state.cust.big;
  let small = state.cust.small;
  if (key === 'big') {
    big = Math.min(mx, Math.max(mn, big + delta));
    if (big <= small) small = Math.max(CUST_LIMITS.small[0], big - 1);
  } else {
    small = Math.min(mx, Math.max(mn, small + delta));
    if (small >= big) big = Math.min(CUST_LIMITS.big[1], small + 1);
  }
  return { ...state, cust: { ...state.cust, big, small } };
}

export function applyCustCassetteText(state: GearCalcState, text: string): GearCalcState {
  return { ...state, cust: { ...state.cust, cassetteText: text } };
}

export function parseCustomCassette(raw: string): number[] | null {
  const nums = raw
    .trim()
    .split(/[\s,;]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n >= 8 && n <= 56);
  if (nums.length < 2) return null;
  const unique = [...new Set(nums)];
  unique.sort((a, b) => a - b);
  return unique;
}

export const ACCENT_MAP: Record<Brand, string> = { shimano: '#1a72e0', sram: '#ee1c28', campagnolo: '#ffcd00', custom: '#12b05f' };
export const ACCENT_LIGHT_MAP: Record<Brand, string> = { shimano: '#7fb3f0', sram: '#ff7178', campagnolo: '#ffe066', custom: '#5fd39a' };
