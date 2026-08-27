'use client';

/**
 * EXPERIMENTAL — gated to one climb via PERSONALISED_REPORT_SLUG in
 * ClimbDetailClient.tsx while this is being tried out. "At your numbers,
 * this climb takes about X" using the rider's own power/weight (from
 * cg_shared, already flowing into `S` on this page) against the climb's
 * real per-point GPX gradient data, not a single average-gradient guess.
 * See lib/climbTimeEstimate.ts for the physics.
 */
import { useEffect, useState } from 'react';
import { type ClimbCalcState, BRAND_LABELS } from '@/lib/climbCalcState';
import type { ClimbGearCalcResult } from '@/lib/climbGearCalc';
import {
  computeClimbTimeEstimate,
  findEasierGearingOption,
  formatClimbTime,
  isGrindRisk,
  isWorthSuggestingEasierGearing,
  type RouteTimePoint,
} from '@/lib/climbTimeEstimate';

function useRouteTimePoints(slug: string): RouteTimePoint[] | null {
  const [points, setPoints] = useState<RouteTimePoint[] | null>(null);
  useEffect(() => {
    setPoints(null);
    let cancelled = false;
    fetch(`/climbs/routes/${slug}.json`)
      .then((r) => r.json())
      .then((raw: { points: RouteTimePoint[] }) => {
        if (!cancelled) setPoints(raw.points.map((p) => ({ distanceM: p.distanceM, gradientPct: p.gradientPct })));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return points;
}

interface PersonalisedClimbReportProps {
  slug: string;
  S: ClimbCalcState;
  gears: ClimbGearCalcResult | null;
}

export default function PersonalisedClimbReport({ slug, S, gears }: PersonalisedClimbReportProps) {
  const points = useRouteTimePoints(slug);
  const estimate = points ? computeClimbTimeEstimate(points, S, gears) : null;

  if (!estimate) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto 18px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
        Loading your personalised climb report…
      </div>
    );
  }

  const grindRisk = isGrindRisk(estimate);
  const gearingCmp = gears ? findEasierGearingOption(S, gears, estimate.steepestSpeedKmh) : null;
  const suggestEasier = gearingCmp ? isWorthSuggestingEasierGearing(gearingCmp) : false;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto 22px', textAlign: 'center' }}>
      <div
        style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}
      >
        Your Personalised Climb Report
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{formatClimbTime(estimate.totalTimeS)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>estimated time</div>
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{estimate.avgSpeedKmh.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>avg km/h</div>
        </div>
      </div>

      {gears && (
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
          Based on your setup: {BRAND_LABELS[S.brand]}
          {S.brand !== 'custom' && S.groupset ? ` ${S.groupset}` : ''}, {gears.crLabelText} · {gears.csLabelText}, {S.power}W,{' '}
          {(S.bodyRaw + S.bikeRaw).toFixed(0)}
          {S.weightUnit} all-up.
        </p>
      )}

      <p className="climb-summary" style={{ margin: '0 0 10px' }}>
        Physics says you&apos;d hold roughly <strong style={{ color: '#1e293b' }}>{estimate.steepestSpeedKmh.toFixed(1)} km/h</strong> through the
        steepest section ({estimate.steepestGradientPct >= 0 ? '+' : ''}
        {estimate.steepestGradientPct.toFixed(1)}%).
      </p>

      {estimate.easiestGearCadenceAtSteepest !== null && (
        <p className="climb-summary" style={{ color: grindRisk ? '#f87171' : 'var(--muted)', margin: '0 0 10px' }}>
          {grindRisk ? (
            <>
              ⚠ Your easiest gear ({estimate.easiestGearLabel}) would only be turning{' '}
              <strong>{Math.round(estimate.easiestGearCadenceAtSteepest)}rpm</strong> there — likely to feel like a grind.
            </>
          ) : (
            <>
              Your easiest gear ({estimate.easiestGearLabel}) keeps you at a comfortable{' '}
              <strong>{Math.round(estimate.easiestGearCadenceAtSteepest)}rpm</strong> even on the steepest section.
            </>
          )}
        </p>
      )}

      {gearingCmp && (
        <p className="climb-summary" style={{ color: suggestEasier ? '#fbbf24' : 'var(--muted)', margin: '0 0 10px' }}>
          {suggestEasier ? (
            <>
              💡 A {gearingCmp.bestChainringLabel} chainring with an {gearingCmp.bestCassetteLabel} cassette — still available for this groupset —
              would spin at <strong>{Math.round(gearingCmp.bestCadenceRpm)}rpm</strong> instead of{' '}
              <strong>{Math.round(gearingCmp.currentCadenceRpm)}rpm</strong> on the steepest section. Same speed, easier pedalling — gearing
              can&apos;t make you faster at a fixed power, but it can make the effort feel a lot less brutal.
            </>
          ) : (
            <>You&apos;re already running the easiest gearing available for this groupset — no lower option would help here.</>
          )}
        </p>
      )}

      <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
        Physics-based estimate from your Setup power/weight and this climb&apos;s real GPX gradient data — a guide, not a guarantee. Doesn&apos;t
        account for wind, traffic stops, or fatigue.
      </p>
    </div>
  );
}
