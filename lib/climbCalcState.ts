import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import { firstGroupsetKey, groupsetOptionsFor, CUST_LIMITS, ACCENT_MAP, ACCENT_LIGHT_MAP, BRAND_LABELS, parseCustomCassette } from '@/lib/gearCalcState';
import { kgToLbs } from '@/lib/units';
import type { SharedSetup } from '@/lib/sharedSetup';

export type { ChartMode } from '@/lib/gearCalcState';
export { CUST_LIMITS, ACCENT_MAP, ACCENT_LIGHT_MAP, BRAND_LABELS, parseCustomCassette, groupsetOptionsFor };

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

/**
 * Builds initial ClimbCalcState from cg_shared (the site's cross-tool
 * shared setup) plus optional URL params — extracted from ClimbPlanner.tsx
 * so the 3D climb debug tool can inherit the same setup other calculators
 * left behind, without re-deriving the same read logic. URL params win over
 * cg_shared when both are present (matches climb.html's original
 * precedence); pass an empty URLSearchParams if a caller has no URL to read
 * (they'll just fall through to cg_shared / hard defaults).
 */
export function initClimbStateFromShared(urlP: URLSearchParams, sh: SharedSetup): ClimbCalcState {
  let next = defaultClimbState();

  const disc = (['road', 'mtb', 'gravel'].includes((urlP.get('d') || (sh.d as string)) as string)
    ? (urlP.get('d') || (sh.d as string))
    : 'road') as Discipline;
  next = applyDiscipline(next, disc);

  const brandRaw = (urlP.get('b') || (sh.b as string)) as Brand | undefined;
  if (brandRaw === 'custom') {
    const sc = (sh.cust as { big?: number; small?: number; ct?: string; cass?: string }) || {};
    const cBig = urlP.get('xb') || (sc.big != null ? String(sc.big) : undefined);
    const cSmall = urlP.get('xs') || (sc.small != null ? String(sc.small) : undefined);
    const cKind = urlP.get('xk') || sc.ct;
    const cCass = urlP.get('xc') || sc.cass;
    next = applyBrand(next, 'custom');
    next = {
      ...next,
      cust: {
        crankType: cKind === '1x' ? '1x' : '2x',
        big: cBig ? parseInt(cBig, 10) || next.cust.big : next.cust.big,
        small: cSmall ? parseInt(cSmall, 10) || next.cust.small : next.cust.small,
        cassetteText: cCass || next.cust.cassetteText,
      },
    };
  } else if (brandRaw && DISC_BRANDS[disc].includes(brandRaw as Exclude<Brand, 'custom'>)) {
    next = applyBrand(next, brandRaw);
  }

  if (next.brand !== 'custom') {
    const gsName = urlP.get('g') || (sh.g as string);
    const brandData = DB[disc][next.brand as Exclude<Brand, 'custom'>];
    if (gsName && brandData && Object.prototype.hasOwnProperty.call(brandData, gsName)) {
      next = applyGroupset(next, gsName);
    }
    const crValRaw = urlP.get('cr') ?? (sh.cr as string | number | undefined);
    const crVal = crValRaw != null ? parseInt(String(crValRaw), 10) : 0;
    if (crVal) next = applyCrIdx(next, crVal);
    const csVal = urlP.get('cs') || (sh.cs as string);
    const data = next.groupset ? (brandData as Record<string, { cassettes: { label: string }[] }>)[next.groupset] : null;
    if (csVal && data && data.cassettes.some((c) => c.label === csVal)) next = applyCassette(next, csVal);
  }

  const wVal = urlP.get('w') || (sh.w as string);
  if (wVal && WHEELS[disc].some((w) => String(w.circ) === String(wVal))) next = applyWheel(next, parseInt(wVal, 10));

  const cadVal = urlP.get('cad') || (sh.cad as string);
  if (cadVal) next = applyCadence(next, parseInt(cadVal, 10) || next.cadence);

  const pwVal = urlP.get('pw') || (sh.pw as string);
  if (pwVal) next = applyPower(next, parseInt(pwVal, 10) || next.power);

  const savedWUnit = (urlP.get('wunit') || (sh.wunit as string)) as WeightUnit | undefined;
  const weightUnit: WeightUnit = savedWUnit === 'kg' || savedWUnit === 'lbs' ? savedWUnit : next.weightUnit;

  const rawBody = urlP.get('bwt') || (sh.bwt as string) || (sh.wt as string);
  const rawBike = urlP.get('bkw') || (sh.bkw as string);
  let bodyK = 70;
  let bikeK = 8;
  if (rawBody) bodyK = Math.min(130, Math.max(40, parseFloat(rawBody as string)));
  if (rawBike) bikeK = Math.min(16, Math.max(4, parseFloat(rawBike as string)));
  next = {
    ...next,
    weightUnit,
    bodyRaw: weightUnit === 'lbs' ? +kgToLbs(bodyK).toFixed(1) : +bodyK.toFixed(1),
    bikeRaw: weightUnit === 'lbs' ? +kgToLbs(bikeK).toFixed(1) : +bikeK.toFixed(1),
  };

  const grVal = urlP.get('gr') || (sh.gr as string);
  if (grVal) next = applyGradient(next, parseFloat(grVal));

  const cdaVal = urlP.get('cda') || (sh.cda as string);
  if (cdaVal) next = applyCda(next, parseFloat(cdaVal));

  const crrVal = urlP.get('crr') || (sh.crr as string);
  if (crrVal) next = applyCrr(next, parseFloat(crrVal));

  const ckVal = urlP.get('ck') || (sh.ck as string);
  if (ckVal) next = applyCrankLen(next, parseFloat(ckVal));

  const dstVal = urlP.get('dst') || (sh.dst as string);
  if (dstVal) {
    const km = Math.min(30, Math.max(1, parseFloat(dstVal)));
    next = { ...next, distUnit: 'km', distRaw: km };
  }

  return next;
}
