'use client';

/**
 * Chequamegon MTB Festival course detail — same 3D engine as /climbs/[slug]
 * and /rebeccas-private-idaho/[slug] (DebugScene: Plan / 3D View / Wedge)
 * plus the same Setup/Gears panel (ClimbConfigPanel + AchievabilityCards)
 * and PersonalisedClimbReport (physics time/speed/gearing estimate) — all
 * of that machinery is generic gear-ratio-achievability plus per-point-GPX
 * physics, not tied to a single categorised mountain ascent or to RPI
 * specifically, so it's fully reusable here unchanged. Deliberately still
 * WITHOUT buildClimbSummary's narrative copy, same reason as RPI (depends
 * on Grand Tour stage data these routes don't have).
 *
 * Unlike RPI, there is NO affiliate content at all here (Robin, 2026-09-04:
 * "no affiliate links, just the aads at the bottom") — no BuyCard,
 * BikesBookingCard, KiwiCard or Stay22 embed, and no feature flag gating
 * needed since there's nothing to gate. AADSUnit renders unconditionally.
 */
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { TravelInfo } from '@/app/climbs/DebugScene';
import AADSUnit from '@/components/AADSUnit';
import Footer from '@/components/Footer';
import AchievabilityCards from '@/components/climb/AchievabilityCards';
import ClimbConfigPanel from '@/components/climb/ClimbConfigPanel';
import PersonalisedClimbReport from '@/components/climb/PersonalisedClimbReport';
import { computeClimbGears } from '@/lib/climbGearCalc';
import { ClimbCalcState, defaultClimbState, initClimbStateFromShared, BRAND_LABELS } from '@/lib/climbCalcState';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { lbsToKg } from '@/lib/units';
import type { CheqRoute } from '@/data/cheqRoutes';
import '@/components/climb/climb.css';

const DebugScene = dynamic(() => import('@/app/climbs/DebugScene'), { ssr: false });

// NOT widened like RPI_FOOTPRINT_SCALE (RpiRouteDetailClient.tsx uses 6) —
// these courses' elevation RANGE is far smaller than RPI's (86-170m vs
// RPI's 300-900m) even though total climbing is comparable (rolling
// terrain), so widening the footprint the way RPI did would only read as
// flatter still. Kept at the site's own Grand Tour default.
const CHEQ_FOOTPRINT_SCALE = 2;

// computeExaggeration's own formula hits its 15x ceiling for these routes
// (low average gradient over 25-67km), same as RPI's longer routes — but
// unlike RPI, the ceiling still isn't enough relief here, because these
// courses' actual elevation RANGE is so small (86-170m, vs RPI's
// 300-900m) that even 15x of it is a modest scene height. Robin
// (2026-09-05): "too flat, but I don't want it mountainous" — boosts the
// already-capped 15x by another 2x via DebugScene's exaggerationMultiplier
// prop (added for this) rather than raising the shared ceiling itself,
// which would also inflate every Grand Tour climb and RPI route.
const CHEQ_EXAGGERATION_MULTIPLIER = 2;

// Same reasoning as RPI_MAX_SMOOTHING_M — the Grand Tour default (1km)
// isn't enough of a change on these much longer, rolling courses.
const CHEQ_MAX_SMOOTHING_M = 5000;

// Same reasoning/reference pace as RPI_PLAY_TARGET_MPS — computed per-route
// from its own real length so playback pace stays consistent across the
// 25-67km course range rather than a flat duration regardless of length.
const CHEQ_PLAY_TARGET_MPS = 800;

const STOPS = [
  { key: 'A', label: 'Plan', state: 'A' as const, mapStyle: 'flat' as const },
  { key: 'B-3d', label: '3D View', state: 'B' as const, mapStyle: 'terrain' as const },
  { key: 'C', label: 'Wedge', state: 'C' as const, mapStyle: 'flat' as const },
];

export default function CheqRouteDetailClient({ route }: { route: CheqRoute }) {
  const [stopKey, setStopKey] = useState<string>('A');
  const [travel, setTravel] = useState<TravelInfo | null>(null);
  const [S, setS] = useState<ClimbCalcState>(defaultClimbState);
  const [setupInitDone, setSetupInitDone] = useState(false);
  const [panelTab, setPanelTab] = useState<'setup' | 'gears'>('gears');
  const stop = STOPS.find((s) => s.key === stopKey)!;
  const influences: [number, number] = stop.state === 'A' ? [0, 0] : stop.state === 'B' ? [1, 0] : [0, 1];
  const gradientPct = travel?.gradientPct ?? 0;
  const gears = useMemo(() => computeClimbGears(S, gradientPct), [S, gradientPct]);
  const playDurationS = (route.lengthKm * 1000) / CHEQ_PLAY_TARGET_MPS;

  // Inherit whatever setup was last used on the Gear Calculator / Climb
  // Planner / Comparator / Grand Tour climb pages / RPI (cg_shared).
  useEffect(() => {
    setS(initClimbStateFromShared(new URLSearchParams(), readSharedSetup()));
    setSetupInitDone(true);
  }, []);

  useEffect(() => {
    if (!setupInitDone) return;
    const t = setTimeout(() => {
      const bodyKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bodyRaw) : S.bodyRaw;
      const bikeKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bikeRaw) : S.bikeRaw;
      writeSharedSetup({
        d: S.discipline,
        b: S.brand,
        g: S.groupset || '',
        cr: S.crIdx,
        cs: S.cassetteLabel || '',
        w: String(S.wheelCirc),
        cad: String(S.cadence),
        pw: String(S.power),
        wt: (bodyKgVal + bikeKgVal).toFixed(2),
        bwt: bodyKgVal.toFixed(2),
        bkw: bikeKgVal.toFixed(2),
        wunit: S.weightUnit,
        cda: S.cda,
        crr: S.crr,
        ck: String(S.crankLen),
        cust: { ct: S.cust.crankType, big: S.cust.big, small: S.cust.small, cass: S.cust.cassetteText },
      });
    }, 200);
    return () => clearTimeout(t);
  }, [S, setupInitDone]);

  return (
    <>
      <div className="hero climb-detail-hero">
        <h1>
          {route.name}
          <br />
          <span className="climb-kicker">Chequamegon MTB Festival — 3D Course Visualiser</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1400, paddingBottom: 0 }}>
        <p className="climb-summary">{route.blurb}</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginTop: -8, marginBottom: 18 }}>{route.dateLabel}</p>
        <PersonalisedClimbReport slug={route.slug} S={S} gears={gears} />
      </div>

      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="climb-detail-grid rpi-detail-grid">
          <div>
            <div className="glass rpi-map-stretch" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STOPS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStopKey(s.key)}
                    style={{
                      padding: '8px 16px',
                      background: stopKey === s.key ? '#3b82f6' : '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <DebugScene key={route.slug} slug={route.slug} influences={influences} state={stop.state} mapStyle={stop.mapStyle} onTravelChange={setTravel} footprintScale={CHEQ_FOOTPRINT_SCALE} playDurationS={playDurationS} maxSmoothingM={CHEQ_MAX_SMOOTHING_M} exaggerationMultiplier={CHEQ_EXAGGERATION_MULTIPLIER} endLabel="Finish" />
            </div>
            {/* Download GPX lives inside DebugScene's own control bar
                (top-right, next to Reset view) — same as RPI/climb pages. */}
            <div className="glass" style={{ padding: 16, marginTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{route.name}</div>
              <div style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 14 }}>
                {travel
                  ? `${(travel.distanceM / 1000).toFixed(1)}km · ${Math.round(travel.elevationM)}m · ${travel.gradientPct >= 0 ? '+' : ''}${travel.gradientPct.toFixed(1)}%`
                  : 'move the slider under the map'}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12, display: 'grid', gap: 8 }}>
                <StatRow label="Distance" value={`${route.lengthMi.toFixed(1)} mi (${route.lengthKm.toFixed(1)} km)`} />
                <StatRow label="Elevation gain" value={`${route.ascentFt.toLocaleString()} ft (${route.ascentM.toLocaleString()} m)`} />
                <StatRow label="Elevation range" value={`${route.elevMinM.toLocaleString()}–${route.elevMaxM.toLocaleString()} m`} />
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setPanelTab('setup')}
                style={{
                  flex: 1, padding: '8px 0', background: panelTab === 'setup' ? '#3b82f6' : '#333', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Setup
              </button>
              <button
                onClick={() => setPanelTab('gears')}
                style={{
                  flex: 1, padding: '8px 0', background: panelTab === 'gears' ? '#3b82f6' : '#333', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Gears
              </button>
            </div>

            {panelTab === 'setup' && <ClimbConfigPanel S={S} setS={setS} showClimbFields={false} />}

            {panelTab === 'gears' && (
              <div
                className="glass"
                style={{ padding: 16, position: 'sticky', top: 'calc(var(--header-h) + 16px)', maxHeight: 'calc(100vh - var(--header-h) - 28px)', overflowY: 'auto', overflowX: 'hidden' }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                  {gradientPct >= 0 ? '+' : ''}
                  {gradientPct.toFixed(1)}% gradient
                </div>
                <div style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 14 }}>
                  {travel ? `${(travel.distanceM / 1000).toFixed(1)}km · ${Math.round(travel.elevationM)}m` : 'move the slider'}
                </div>
                {gears ? (
                  <AchievabilityCards
                    bigGears={gears.bigGears}
                    smallGears={gears.smallGears}
                    outer={gears.outer}
                    inner={gears.inner}
                    isSingle={gears.isSingle}
                    userPwr={S.power}
                  />
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    Switch to Setup and choose a groupset (or enter a valid custom cassette) to see gear achievability
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
                  {BRAND_LABELS[S.brand]}, {S.power}W, {(S.bodyRaw + S.bikeRaw).toFixed(0)}
                  {S.weightUnit} all-up — set on the Setup tab.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AADSUnit />

      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="climb-detail-grid climb-guide-box">
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
              How to use the map
            </div>
            <ul className="controls" style={{ margin: 0 }}>
              <li><b>Plan</b> — the course laid out on a 2D map, drag the slider under the map to travel along it.</li>
              <li><b>3D View</b> — the same course over real 3D terrain relief.</li>
              <li><b>Wedge</b> — a side-on profile of the course, showing gradient as a rising/falling wedge.</li>
              <li>Whichever view is open, dragging the slider moves you along the course — the gradient, distance and elevation readouts update live as you go.</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
              How to use Setup &amp; Gears
            </div>
            <ul className="controls" style={{ margin: 0 }}>
              <li><b>Setup</b> — enter your groupset, weight, power and cadence. Shared with the Gear Calculator, Climb Planner and every climb page.</li>
              <li><b>Gears</b> — shows which of your gears are achievable at the current gradient as you drag the slider on the map.</li>
              <li>Switch to Setup first if you haven&apos;t entered a groupset yet — Gears needs it to work out achievability.</li>
            </ul>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
          Course data via the Chequamegon MTB Festival (cheqmtb.com).
        </p>
      </div>

      <Footer
        attribution={
          <>
            <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> — 3D route visualiser. Terrain and gradient are indicative.
          </>
        }
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/chequamegon', label: '← Chequamegon MTB Festival' },
          { href: '/climbs', label: 'Climbs' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
        ]}
      />
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
