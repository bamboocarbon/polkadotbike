import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import { firstGroupsetKey, groupsetOptionsFor } from '@/lib/gearCalcState';

export { groupsetOptionsFor };

export type SysMode = 'groupset' | 'custom';

export interface SystemState {
  discipline: Discipline;
  brand: Brand;
  mode: SysMode;
  groupset: string | null;
  crIdx: number;
  cassetteLabel: string;
  wheelCirc: number;
  customWheelCirc: number;
  customLabel: string;
  customBig: string;
  customSmall: string; // blank string = 1x (no small ring)
  customCogs: string;
  // Tracked/persisted for schema fidelity with the source's cg_cmp, but
  // never actually applied anywhere in rendering — the colour-swatch UI
  // that would have let a user pick this was removed from compare.html's
  // markup at some point; the JS/CSS/state plumbing was left behind. Not
  // porting a swatch picker that doesn't exist on the live site.
  customColour: string;
}

function groupsetDefaultsFor(discipline: Discipline, brand: Exclude<Brand, 'custom'>) {
  const brandData = DB[discipline][brand]!;
  const key = firstGroupsetKey(brandData);
  const data = (brandData as Record<string, { cassettes: { label: string }[] }>)[key];
  return { groupset: key, crIdx: 0, cassetteLabel: data.cassettes[0].label };
}

function defaultWheel(discipline: Discipline): number {
  const list = WHEELS[discipline];
  return list.find((w) => w.dflt)?.circ ?? list[0].circ;
}

// compare.html's populateWheels() keeps a previously-selected wheel if it's
// present in the new discipline's list, else falls back to that
// discipline's default — same preserve-behaviour as index.html's
// updateWheels(), NOT climb.html's always-reset-to-default.
function preserveOrDefaultWheel(discipline: Discipline, prevCirc: number): number {
  const list = WHEELS[discipline];
  return list.find((w) => w.circ === prevCirc)?.circ ?? defaultWheel(discipline);
}

export function defaultSystemA(): SystemState {
  const discipline: Discipline = 'road';
  const brand: Brand = 'shimano';
  return {
    discipline,
    brand,
    mode: 'groupset',
    ...groupsetDefaultsFor(discipline, brand),
    wheelCirc: defaultWheel(discipline),
    customWheelCirc: defaultWheel(discipline),
    customLabel: 'Custom',
    customBig: '50',
    customSmall: '34',
    customCogs: '11,12,13,14,15,17,19,21,24,28',
    customColour: '#12b05f',
  };
}

export function defaultSystemB(): SystemState {
  return { ...defaultSystemA(), customColour: '#ffffff' };
}

export function applySysDiscipline(state: SystemState, d: Discipline): SystemState {
  let next: SystemState = {
    ...state,
    discipline: d,
    crIdx: 0,
    wheelCirc: preserveOrDefaultWheel(d, state.wheelCirc),
    customWheelCirc: preserveOrDefaultWheel(d, state.customWheelCirc),
  };
  if (state.mode !== 'custom') {
    const brands = DISC_BRANDS[d];
    const brand: Brand = brands.includes(state.brand as Exclude<Brand, 'custom'>) ? state.brand : brands[0];
    next = applySysBrand(next, brand);
  }
  return next;
}

export function applySysBrand(state: SystemState, brand: Brand): SystemState {
  if (brand === 'custom') {
    return { ...state, brand, mode: 'custom', crIdx: 0 };
  }
  const gs = groupsetDefaultsFor(state.discipline, brand);
  return { ...state, brand, mode: 'groupset', ...gs };
}

export function applySysGroupset(state: SystemState, groupsetName: string): SystemState {
  if (state.mode === 'custom') return state;
  const brandData = DB[state.discipline][state.brand as Exclude<Brand, 'custom'>]!;
  const data = (brandData as Record<string, { cassettes: { label: string }[] }>)[groupsetName];
  if (!data) return state;
  return { ...state, groupset: groupsetName, crIdx: 0, cassetteLabel: data.cassettes[0].label };
}

export function applySysCrIdx(state: SystemState, i: number): SystemState {
  return { ...state, crIdx: i };
}
export function applySysCassette(state: SystemState, label: string): SystemState {
  return { ...state, cassetteLabel: label };
}
export function applySysWheel(state: SystemState, circ: number): SystemState {
  return { ...state, wheelCirc: circ };
}
export function applySysCustomWheel(state: SystemState, circ: number): SystemState {
  return { ...state, customWheelCirc: circ };
}

export interface CompareGearPoint {
  cog: number;
  dev: number;
  cross: boolean;
}

export interface SystemGears {
  bigG: CompareGearPoint[];
  smallG: CompareGearPoint[] | null;
  crOuter: number;
  crInner: number | null;
  crLabel: string;
  cassLabel: string;
  name: string;
  isSingle: boolean;
}

// Ported verbatim from getGearsForSystem()/getGearsA()/getGearsB() — dev-only
// (no speed/power baked in, unlike index.html/climb.html's gear points),
// because this page's chart computes speed at RENDER time from a single
// shared cadence control, not per-system.
export function computeSystemGears(state: SystemState): SystemGears | null {
  const CC = 2;
  if (state.mode === 'custom') {
    const circ = state.customWheelCirc || 2136;
    const big = parseInt(state.customBig, 10) || 50;
    const smallVal = parseInt(state.customSmall, 10);
    const small = isNaN(smallVal) ? null : smallVal;
    const cogs = state.customCogs
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
    if (!cogs.length || !big) return null;
    const n = cogs.length;
    const isSingle = !small;
    const dev = (ring: number, cog: number) => (ring / cog) * circ / 1000;
    const bigG = cogs.map((cog, i) => ({ cog, dev: dev(big, cog), cross: !isSingle && i >= n - CC }));
    const smallG = small ? cogs.map((cog, i) => ({ cog, dev: dev(small, cog), cross: i < CC })) : null;
    return {
      bigG,
      smallG,
      crOuter: big,
      crInner: small,
      crLabel: `${big}${small ? '/' + small : ''}`,
      cassLabel: state.customCogs,
      name: state.customLabel || 'Custom',
      isSingle,
    };
  }
  if (!state.groupset) return null;
  const brandData = DB[state.discipline][state.brand as Exclude<Brand, 'custom'>];
  if (!brandData) return null;
  const data = (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[state.groupset];
  if (!data) return null;
  const cr = data.chainrings[state.crIdx];
  const cass = data.cassettes.find((c) => c.label === state.cassetteLabel) || data.cassettes[0];
  if (!cr || !cass) return null;
  const teeth = cass.teeth;
  const n = teeth.length;
  const isSingle = !cr.inner;
  const dev = (ring: number, cog: number) => (ring / cog) * (state.wheelCirc / 1000);
  const bigG = teeth.map((cog, i) => ({ cog, dev: dev(cr.outer, cog), cross: !isSingle && i >= n - CC }));
  const smallG = isSingle ? null : teeth.map((cog, i) => ({ cog, dev: dev(cr.inner as number, cog), cross: i < CC }));
  return { bigG, smallG, crOuter: cr.outer, crInner: cr.inner, crLabel: cr.label, cassLabel: cass.label, name: state.groupset, isSingle };
}
