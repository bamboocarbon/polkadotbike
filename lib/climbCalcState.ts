import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import { firstGroupsetKey, groupsetOptionsFor, CUST_LIMITS, ACCENT_MAP, ACCENT_LIGHT_MAP, parseCustomCassette } from '@/lib/gearCalcState';

export type { ChartMode } from '@/lib/gearCalcState';
export { CUST_LIMITS, ACCENT_MAP, ACCENT_LIGHT_MAP, parseCustomCassette, groupsetOptionsFor };

export type WeightUnit = 'kg' | 'lbs';
export type DistUnit = 'km' | 'mi';

export interface ClimbCustomState {
  crankType: '1x' | '2x';
  big: number;
  small: number;
  cassetteText: string;
}

export interface ClimbCalcState {
  discipline: Discipline;
  brand: Brand;
  groupset: string | null;
  crIdx: number;
  cassetteLabel: string;
  wheelCirc: number;
  crankLen: number;
  cadence: number;
  power: number;
  cda: number;
  crr: number;
  weightUnit: WeightUnit;
  bodyRaw: number; // in current weightUnit
  bikeRaw: number; // in current weightUnit
  distUnit: DistUnit;
  distRaw: number; // in current distUnit
  gradient: number;
  cust: ClimbCustomState;
}

function groupsetDefaultsFor(discipline: Discipline, brand: Exclude<Brand, 'custom'>) {
  const brandData = DB[discipline][brand]!;
  const key = firstGroupsetKey(brandData);
  const data = (brandData as Record<string, { cassettes: { label: string }[] }>)[key];
  return { groupset: key, crIdx: 0, cassetteLabel: data.cassettes[0].label };
}

// climb.html's own updateWheels() always resets to the discipline's `dflt`
// wheel on every discipline change — unlike index.html, it never preserves
// a previously-selected wheel. Deliberately different, ported as-is.
function defaultWheelFor(discipline: Discipline): number {
  const list = WHEELS[discipline];
  return list.find((w) => w.dflt)?.circ ?? list[0].circ;
}

export function defaultClimbState(): ClimbCalcState {
  const discipline: Discipline = 'road';
  const brand: Brand = 'shimano';
  const gs = groupsetDefaultsFor(discipline, brand);
  return {
    discipline,
    brand,
    ...gs,
    wheelCirc: defaultWheelFor(discipline),
    crankLen: 172.5,
    cadence: 90,
    power: 200,
    cda: 0.36,
    crr: 0.004,
    weightUnit: 'kg',
    bodyRaw: 70.0,
    bikeRaw: 8.0,
    distUnit: 'km',
    distRaw: 10.0,
    gradient: 5.0,
    cust: { crankType: '2x', big: 50, small: 34, cassetteText: '11,13,15,17,19,22,25,28' },
  };
}

export function applyDiscipline(state: ClimbCalcState, d: Discipline): ClimbCalcState {
  const brands = DISC_BRANDS[d];
  const brand: Brand = state.brand === 'custom' || brands.includes(state.brand as Exclude<Brand, 'custom'>) ? state.brand : brands[0];
  const gs = brand === 'custom' ? { groupset: null, crIdx: 0, cassetteLabel: '' } : groupsetDefaultsFor(d, brand as Exclude<Brand, 'custom'>);
  return { ...state, discipline: d, brand, wheelCirc: defaultWheelFor(d), ...gs };
}

export function applyBrand(state: ClimbCalcState, b: Brand): ClimbCalcState {
  const gs = b === 'custom' ? { groupset: null, crIdx: 0, cassetteLabel: '' } : groupsetDefaultsFor(state.discipline, b);
  return { ...state, brand: b, ...gs };
}

export function applyGroupset(state: ClimbCalcState, groupsetName: string): ClimbCalcState {
  if (state.brand === 'custom') return state;
  const brandData = DB[state.discipline][state.brand as Exclude<Brand, 'custom'>]!;
  const data = (brandData as Record<string, { cassettes: { label: string }[] }>)[groupsetName];
  if (!data) return state;
  return { ...state, groupset: groupsetName, crIdx: 0, cassetteLabel: data.cassettes[0].label };
}

export function applyCrIdx(state: ClimbCalcState, i: number): ClimbCalcState {
  return { ...state, crIdx: i };
}
export function applyCassette(state: ClimbCalcState, label: string): ClimbCalcState {
  return { ...state, cassetteLabel: label };
}
export function applyWheel(state: ClimbCalcState, circ: number): ClimbCalcState {
  return { ...state, wheelCirc: circ };
}
export function applyCrankLen(state: ClimbCalcState, crankLen: number): ClimbCalcState {
  return { ...state, crankLen };
}
export function applyCadence(state: ClimbCalcState, cadence: number): ClimbCalcState {
  return { ...state, cadence };
}
export function applyPower(state: ClimbCalcState, power: number): ClimbCalcState {
  return { ...state, power };
}
export function applyCda(state: ClimbCalcState, cda: number): ClimbCalcState {
  return { ...state, cda };
}
export function applyCrr(state: ClimbCalcState, crr: number): ClimbCalcState {
  return { ...state, crr };
}
export function applyGradient(state: ClimbCalcState, gradient: number): ClimbCalcState {
  return { ...state, gradient };
}

export function applyCrankMode(state: ClimbCalcState, mode: '1x' | '2x'): ClimbCalcState {
  return { ...state, cust: { ...state.cust, crankType: mode } };
}
export function applyCustAdjust(state: ClimbCalcState, key: 'big' | 'small', delta: number): ClimbCalcState {
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
export function applyCustCassetteText(state: ClimbCalcState, text: string): ClimbCalcState {
  return { ...state, cust: { ...state.cust, cassetteText: text } };
}
