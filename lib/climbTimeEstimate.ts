/**
 * Personalised "how long will this climb take me" estimate — EXPERIMENTAL,
 * gated to one climb page for now (see PERSONALISED_REPORT_SLUG in
 * ClimbDetailClient.tsx). Uses the rider's own power+weight (from
 * cg_shared, via ClimbCalcState) against the climb's real per-point
 * gradient data, not a single average-gradient guess.
 *
 * Physically, speed on a climb is determined by power/mass/gradient/aero —
 * gearing only decides what cadence delivers that speed, it doesn't change
 * how fast a given power output can go (see speedFromPower's own comment).
 * So gearing is checked separately here as a feasibility flag (can the
 * rider's easiest gear actually turn over at a sane cadence on the
 * steepest section), not as an input to the time estimate itself.
 */
import { speedFromPower } from '@/lib/climbPhysics';
import type { ClimbCalcState } from '@/lib/climbCalcState';
import type { ClimbGearCalcResult } from '@/lib/climbGearCalc';
import { lbsToKg } from '@/lib/units';
import { DB, Brand } from '@/lib/gearDb';

export interface RouteTimePoint {
  distanceM: number;
  gradientPct: number;
}

export interface ClimbTimeEstimate {
  totalTimeS: number;
  avgSpeedKmh: number;
  steepestGradientPct: number;
  steepestSpeedKmh: number;
  /** Implied cadence (rpm) of the rider's easiest available gear at the
   * steepest section's estimated speed — null if gears aren't set up yet. */
  easiestGearCadenceAtSteepest: number | null;
  easiestGearLabel: string | null;
}

const LOW_CADENCE_GRIND_RPM = 55;

/** Cadence (rpm) a given gear ratio needs to produce speedKmh — inverse of
 * climbGearCalc.ts's own spd() helper. */
function impliedCadenceRpm(speedKmh: number, ringTeeth: number, cog: number, wheelCircMm: number): number {
  const kmhPerRpm = (ringTeeth / cog) * (wheelCircMm / 1000) * (60 / 1000);
  return speedKmh / kmhPerRpm;
}

export function computeClimbTimeEstimate(
  points: RouteTimePoint[],
  S: ClimbCalcState,
  gears: ClimbGearCalcResult | null
): ClimbTimeEstimate | null {
  if (points.length < 2) return null;
  const bodyKg = S.weightUnit === 'lbs' ? lbsToKg(S.bodyRaw) : S.bodyRaw;
  const bikeKg = S.weightUnit === 'lbs' ? lbsToKg(S.bikeRaw) : S.bikeRaw;
  const mass = bodyKg + bikeKg;

  let totalTimeS = 0;
  let steepestGradientPct = -Infinity;
  let steepestSpeedKmh = 0;

  for (let i = 1; i < points.length; i++) {
    const segM = points[i].distanceM - points[i - 1].distanceM;
    if (segM <= 0) continue;
    // Midpoint gradient reads slightly smoother than either endpoint alone
    // and avoids systematically biasing toward whichever end of the
    // segment happens to be steeper.
    const gradePct = (points[i - 1].gradientPct + points[i].gradientPct) / 2;
    const speedKmh = speedFromPower(S.power, mass, gradePct, S.cda, S.crr);
    if (speedKmh <= 0.1) continue; // avoid a division blow-up on a near-zero/negative-power segment
    totalTimeS += segM / (speedKmh / 3.6);
    if (gradePct > steepestGradientPct) {
      steepestGradientPct = gradePct;
      steepestSpeedKmh = speedKmh;
    }
  }

  const totalDistanceM = points[points.length - 1].distanceM - points[0].distanceM;
  const avgSpeedKmh = totalTimeS > 0 ? totalDistanceM / 1000 / (totalTimeS / 3600) : 0;

  let easiestGearCadenceAtSteepest: number | null = null;
  let easiestGearLabel: string | null = null;
  if (gears) {
    const easiestRingTeeth = gears.isSingle ? gears.outer : (gears.inner as number);
    const easiestRingLabel = gears.isSingle ? `${gears.outer}T` : `${gears.inner}T`;
    const col = gears.smallGears ?? gears.bigGears;
    const easiestCog = col[col.length - 1].cog; // cassettes are stored ascending, so the last is the largest (easiest)
    easiestGearCadenceAtSteepest = impliedCadenceRpm(steepestSpeedKmh, easiestRingTeeth, easiestCog, S.wheelCirc);
    easiestGearLabel = `${easiestRingLabel}/${easiestCog}T`;
  }

  return {
    totalTimeS,
    avgSpeedKmh,
    steepestGradientPct,
    steepestSpeedKmh,
    easiestGearCadenceAtSteepest,
    easiestGearLabel,
  };
}

export interface GearingComparison {
  currentChainringLabel: string;
  currentCassetteLabel: string;
  currentCadenceRpm: number;
  bestChainringLabel: string;
  bestCassetteLabel: string;
  bestCadenceRpm: number;
  isCurrentAlreadyBest: boolean;
}

const SUGGEST_MARGIN_RPM = 5;

/**
 * Whether a different chainring/cassette sold for the rider's OWN groupset
 * (not a different groupset or brand) would spin more comfortably on the
 * steepest section — real, purchasable combinations from gearDb, not a
 * hypothetical ratio. Gearing can't make the climb itself faster at a fixed
 * power (see this file's header comment) — this is purely a cadence-comfort
 * comparison. Returns null for a custom drivetrain (already fully flexible,
 * no "other options for this groupset" to compare against) or if the
 * groupset/gears aren't resolved yet.
 */
export function findEasierGearingOption(
  S: ClimbCalcState,
  gears: ClimbGearCalcResult | null,
  steepestSpeedKmh: number
): GearingComparison | null {
  if (!gears || S.brand === 'custom' || !S.groupset) return null;
  const brandData = DB[S.discipline][S.brand as Exclude<Brand, 'custom'>];
  const groupsetData = brandData
    ? (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[
        S.groupset
      ]
    : null;
  if (!groupsetData) return null;

  const currentEasiestRingTeeth = gears.isSingle ? gears.outer : (gears.inner as number);
  const currentEasiestCol = gears.smallGears ?? gears.bigGears;
  const currentEasiestCog = currentEasiestCol[currentEasiestCol.length - 1].cog;
  const currentCadenceRpm = impliedCadenceRpm(steepestSpeedKmh, currentEasiestRingTeeth, currentEasiestCog, S.wheelCirc);

  let best: { crLabel: string; csLabel: string; ringTeeth: number; cog: number; cadence: number } | null = null;
  for (const cr of groupsetData.chainrings) {
    const ringTeeth = cr.inner ?? cr.outer;
    for (const cs of groupsetData.cassettes) {
      const cog = Math.max(...cs.teeth);
      const cadence = impliedCadenceRpm(steepestSpeedKmh, ringTeeth, cog, S.wheelCirc);
      if (!best || cadence > best.cadence) best = { crLabel: cr.label, csLabel: cs.label, ringTeeth, cog, cadence };
    }
  }
  if (!best) return null;

  return {
    currentChainringLabel: gears.crLabelText,
    currentCassetteLabel: gears.csLabelText,
    currentCadenceRpm,
    bestChainringLabel: best.crLabel,
    bestCassetteLabel: best.csLabel,
    bestCadenceRpm: best.cadence,
    isCurrentAlreadyBest:
      best.ringTeeth === currentEasiestRingTeeth && best.cog === currentEasiestCog,
  };
}

export function isWorthSuggestingEasierGearing(cmp: GearingComparison): boolean {
  return !cmp.isCurrentAlreadyBest && cmp.bestCadenceRpm - cmp.currentCadenceRpm >= SUGGEST_MARGIN_RPM;
}

export function isGrindRisk(estimate: ClimbTimeEstimate): boolean {
  return estimate.easiestGearCadenceAtSteepest !== null && estimate.easiestGearCadenceAtSteepest < LOW_CADENCE_GRIND_RPM;
}

export function formatClimbTime(totalTimeS: number): string {
  const totalMin = Math.round(totalTimeS / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
