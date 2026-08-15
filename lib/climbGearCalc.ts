/**
 * Per-gear speed/power for the current groupset (or custom setup) at a given
 * gradient — the calculation ClimbPlanner.tsx's own `calc` useMemo used to
 * do inline. Extracted so the 3D climb debug tool's gear-achievability
 * panel can share the exact same logic (including custom-drivetrain
 * support) rather than re-deriving a second, drifting copy.
 */
import { DB, Brand } from '@/lib/gearDb';
import { ClimbCalcState, parseCustomCassette, ACCENT_MAP } from '@/lib/climbCalcState';
import { calcPower } from '@/lib/climbPhysics';
import { lbsToKg } from '@/lib/units';
import { pbLinkFor, PB_VIVID_TEXT, PB_GENERIC_LINK } from '@/lib/pbLinks';
import type { ClimbGearPoint } from '@/components/climb/ClimbChart';

export interface ClimbGearCalcResult {
  bigGears: ClimbGearPoint[];
  smallGears: ClimbGearPoint[] | null;
  outer: number;
  inner: number | null;
  isSingle: boolean;
  crLabelText: string;
  csLabelText: string;
}

/**
 * `gradientPctOverride`, when given, is used instead of `S.gradient` — the
 * debug tool drives gradient live from the travel-along-route position, not
 * a manual slider, so its own copy of S never has a meaningful `gradient`.
 */
export function computeClimbGears(S: ClimbCalcState, gradientPctOverride?: number): ClimbGearCalcResult | null {
  let outer: number;
  let inner: number | null;
  let teeth: number[];
  let crLabelText: string;
  let csLabelText: string;

  if (S.brand === 'custom') {
    const custTeeth = parseCustomCassette(S.cust.cassetteText);
    if (!custTeeth) return null;
    outer = S.cust.big;
    inner = S.cust.crankType === '2x' ? S.cust.small : null;
    teeth = custTeeth;
    crLabelText = inner ? `${outer}/${inner}` : `${outer}T Single Ring`;
    csLabelText = `${teeth[0]}-${teeth[teeth.length - 1]}T`;
  } else {
    if (!S.groupset) return null;
    const brandData = DB[S.discipline][S.brand as Exclude<Brand, 'custom'>];
    const groupsetData = brandData
      ? (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[S.groupset]
      : null;
    if (!groupsetData) return null;
    const cr = groupsetData.chainrings[S.crIdx];
    const cass = groupsetData.cassettes.find((c) => c.label === S.cassetteLabel);
    if (!cr || !cass) return null;
    outer = cr.outer;
    inner = cr.inner;
    teeth = cass.teeth;
    crLabelText = cr.label;
    csLabelText = cass.label;
  }

  const bodyKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bodyRaw) : S.bodyRaw;
  const bikeKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bikeRaw) : S.bikeRaw;
  const mass = bodyKgVal + bikeKgVal;
  const gradient = gradientPctOverride ?? S.gradient;

  const isSingle = !inner;
  const n = teeth.length;
  const CC = 2;
  function isCross(ring: 'outer' | 'inner', i: number) {
    if (isSingle) return false;
    return (ring === 'outer' && i >= n - CC) || (ring === 'inner' && i < CC);
  }
  function spd(ringTeeth: number, cog: number) {
    return ((ringTeeth / cog) * (S.wheelCirc / 1000) * S.cadence * 60) / 1000;
  }
  function pwr(speedKmh: number) {
    return calcPower(speedKmh, mass, gradient, S.cda, S.crr);
  }

  const bigGears: ClimbGearPoint[] = teeth.map((cog, i) => {
    const s = spd(outer, cog);
    return { cog, spd: s, pwr: pwr(s), cross: isCross('outer', i) };
  });
  const smallGears: ClimbGearPoint[] | null = isSingle
    ? null
    : teeth.map((cog, i) => {
        const s = spd(inner as number, cog);
        return { cog, spd: s, pwr: pwr(s), cross: isCross('inner', i) };
      });

  return { bigGears, smallGears, outer, inner, isSingle, crLabelText, csLabelText };
}

export interface ClimbBuyInfo {
  label: string;
  url: string;
  exact: boolean;
  color: string;
  text: string;
}

/**
 * The real Performance Bicycle affiliate link for the current setup — same
 * `pbLinkFor` lookup (exact-model URL when stocked, brand/category fallback
 * otherwise) ClimbPlanner.tsx's own "Buy These Components" rail card uses.
 * Needs `gears` (from computeClimbGears) for the chainring/cassette label.
 */
export function computeBuyInfo(S: ClimbCalcState, gears: ClimbGearCalcResult | null): ClimbBuyInfo | null {
  if (!gears) return null;
  if (S.brand === 'custom') {
    return { label: `${gears.crLabelText} · ${gears.csLabelText}`, url: PB_GENERIC_LINK, exact: false, color: ACCENT_MAP.custom, text: PB_VIVID_TEXT.custom };
  }
  if (!S.groupset) return null;
  const cleanGroupset = S.groupset.replace(/\s*\([^)]+\)\s*/g, '').trim();
  const pb = pbLinkFor(S.discipline, S.brand, S.groupset);
  return { label: `${cleanGroupset} · ${gears.crLabelText} · ${gears.csLabelText}`, url: pb.url, exact: pb.exact, color: ACCENT_MAP[S.brand], text: PB_VIVID_TEXT[S.brand] };
}
