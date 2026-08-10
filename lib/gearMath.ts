export interface GearPoint {
  cog: number;
  spd: number;
  dev: number;
  cross: boolean;
}

export interface ComputedGears {
  bigGears: GearPoint[];
  smallGears: GearPoint[] | null;
  isSingle: boolean;
}

// Ported verbatim from index.html's calculate()/calculateCustom() inner math
// (spd/devM/isCross closures) — shared by any page computing gear speed/development
// from a chainring+cassette+wheel+cadence combo.
export function computeGears(
  outer: number,
  inner: number | null,
  teeth: number[],
  circMm: number,
  cadence: number,
  isKmh: boolean
): ComputedGears {
  const isSingle = inner == null;
  const n = teeth.length;
  const CC = 2;

  function isCross(ring: 'outer' | 'inner', i: number): boolean {
    if (isSingle) return false;
    return (ring === 'outer' && i >= n - CC) || (ring === 'inner' && i < CC);
  }
  function spd(ring: number, cog: number): number {
    const kmh = ((ring / cog) * circMm / 1000) * cadence * 60 / 1000;
    return isKmh ? kmh : kmh * 0.621371;
  }
  function devM(ring: number, cog: number): number {
    return (ring / cog) * circMm / 1000;
  }

  const bigGears = teeth.map((cog, i) => ({ cog, spd: spd(outer, cog), dev: devM(outer, cog), cross: isCross('outer', i) }));
  const smallGears = isSingle
    ? null
    : teeth.map((cog, i) => ({ cog, spd: spd(inner!, cog), dev: devM(inner!, cog), cross: isCross('inner', i) }));

  return { bigGears, smallGears, isSingle };
}

export function gearStats(bigGears: GearPoint[], smallGears: GearPoint[] | null, isSingle: boolean) {
  const bigValid = bigGears.filter((g) => !g.cross);
  const smallValid = isSingle ? bigValid : (smallGears as GearPoint[]).filter((g) => !g.cross);
  const maxSpd = Math.max(...bigValid.map((g) => g.spd));
  const minSpd = Math.min(...smallValid.map((g) => g.spd));
  return { maxSpd, minSpd, range: maxSpd - minSpd };
}
