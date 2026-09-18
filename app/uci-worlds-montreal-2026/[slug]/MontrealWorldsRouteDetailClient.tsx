'use client';

/**
 * UCI Worlds Montréal 2026 route detail — same 3D engine as /climbs/[slug]
 * and /rebeccas-private-idaho/[slug] (DebugScene: 3D View / Wedge, Plan
 * dropped sitewide 2026-09-16) plus the same Setup/Gears panel
 * (ClimbConfigPanel + AchievabilityCards, driven live by the travel
 * slider's gradient) and PersonalisedClimbReport (physics time/speed/
 * gearing estimate) — all generic gear-ratio-achievability machinery, not
 * tied to a single categorised mountain ascent, fully reusable here. No
 * buildClimbSummary narrative copy (decisive-climb-of-the-stage language,
 * kbf lookups) — that depends on Grand Tour stage data these routes don't
 * have, same as RPI/Cheq.
 *
 * BuyCard (Performance Bicycle affiliate) and AADSUnit render
 * unconditionally, no feature-flag gating — unlike RPI's initial
 * RPI_AFFILIATES_ENABLED caution (a small third-party event organiser
 * relationship question), this is the UCI's own official public World
 * Championship, and Robin asked for the buy card explicitly (2026-09-18).
 * Stay22 (hotel embed) + BikesBookingCard (bike hire) briefly lived here
 * per-route (both TT and RR pages) but were moved to the hub page
 * (app/uci-worlds-montreal-2026/page.tsx, below the Road Races table)
 * 2026-09-18 — one stay/bike-hire section for the whole event reads
 * better than a duplicate on both route pages, closer to RPI's own
 * once-on-the-index-page pattern than Grand Tour race pages' per-stage
 * one. KiwiCard (flights) was never added — Robin asked for bike hire
 * specifically, not flights.
 */
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { TravelInfo } from '@/app/climbs/DebugScene';
import AADSUnit from '@/components/AADSUnit';
import Footer from '@/components/Footer';
import AchievabilityCards from '@/components/climb/AchievabilityCards';
import ClimbConfigPanel from '@/components/climb/ClimbConfigPanel';
import PersonalisedClimbReport from '@/components/climb/PersonalisedClimbReport';
import BuyCard from '@/components/climb/BuyCard';
import { CLIMB_STRAVA_SEGMENTS } from '@/lib/climbStravaSegments';
import { computeClimbGears, computeBuyInfo } from '@/lib/climbGearCalc';
import { ClimbCalcState, defaultClimbState, initClimbStateFromShared, BRAND_LABELS } from '@/lib/climbCalcState';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { lbsToKg } from '@/lib/units';
import type { MontrealWorldsRoute } from '@/data/montrealWorldsRoutes';
import '@/components/climb/climb.css';
// Only needed here for .rpi-affiliate-row (the statsCard/BuyCard side-by-
// side grid below) — Stay22Embed/BikesBookingCard themselves moved to the
// hub page 2026-09-18, but this file still needs the grid class.
import '@/components/affiliate/affiliate.css';

const DebugScene = dynamic(() => import('@/app/climbs/DebugScene'), { ssr: false });

// Wider than the Grand Tour default (2) — the circuit's low average
// gradient over a longer distance (13.5km, multi-summit) pushes
// computeExaggeration toward its ceiling clamp, same reasoning as RPI's
// RPI_FOOTPRINT_SCALE. The TT climb is short/steep enough that the
// default would work, but a single shared scale keeps both pages'
// terrain reading consistently rather than picking a per-route value.
const FOOTPRINT_SCALE = 5;

// Both routes' elevation RANGE is small in absolute terms (TT: 22-77m,
// circuit: 51-214m) — same "too flat, but I don't want it mountainous"
// case as Chequamegon's CHEQ_EXAGGERATION_MULTIPLIER (86-170m range),
// which is what this DebugScene prop was added for: boosts the already-
// capped 15x computeExaggeration ceiling by another 2x, vertical relief
// only — footprintScale/the basemap's own horizontal footprint are
// untouched. Robin, 2026-09-18: "increase it so the climbs look bigger
// without altering the map base."
const EXAGGERATION_MULTIPLIER = 2;

// FOOTPRINT_SCALE (5, vs the Grand Tour default of 2) and
// EXAGGERATION_MULTIPLIER above compound in DebugScene's own
// highlightOffset formula (RouteHighlight, app/climbs/DebugScene.tsx) —
// each on its own is a modest line-clearance margin (RPI's footprintScale
// alone, or Cheq's exaggerationMultiplier alone), but together they
// produced a much bigger margin than Montréal's gentle urban terrain
// needs, visibly floating the route line above the terrain surface
// (Robin: "hovering in the air above the map"). Dialled back down via
// highlightOffsetScale — see its own comment for why this is safe to
// tune per-page without touching the shared default.
const HIGHLIGHT_OFFSET_SCALE = 0.2;

// Grand Tour default (1000m/1km) isn't enough of a change on the 13.5km
// circuit's rolling profile — same reasoning as RPI's RPI_MAX_SMOOTHING_M,
// scaled down since these routes are much shorter than RPI's.
const MAX_SMOOTHING_M = 2000;

const PLAY_TARGET_MPS = 800; // matches RPI_PLAY_TARGET_MPS — see RpiRouteDetailClient.tsx

const STOPS = [
  { key: 'B-3d', label: '3D View', state: 'B' as const, mapStyle: 'terrain' as const },
  { key: 'C', label: 'Wedge', state: 'C' as const, mapStyle: 'flat' as const },
];

export default function MontrealWorldsRouteDetailClient({ route }: { route: MontrealWorldsRoute }) {
  const [stopKey, setStopKey] = useState<string>('B-3d');
  const [travel, setTravel] = useState<TravelInfo | null>(null);
  const [S, setS] = useState<ClimbCalcState>(defaultClimbState);
  const [setupInitDone, setSetupInitDone] = useState(false);
  const [panelTab, setPanelTab] = useState<'setup' | 'gears'>('gears');
  const stop = STOPS.find((s) => s.key === stopKey)!;
  const influences: [number, number] = stop.state === 'B' ? [1, 0] : [0, 1];
  const gradientPct = travel?.gradientPct ?? 0;
  const gears = useMemo(() => computeClimbGears(S, gradientPct), [S, gradientPct]);
  const buyInfo = useMemo(() => computeBuyInfo(S, gears), [S, gears]);
  const playDurationS = (route.lengthKm * 1000) / PLAY_TARGET_MPS;

  const statsCard = (
    <div className="glass" style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{route.name}</div>
      <div style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 14 }}>
        {travel
          ? `${(travel.distanceM / 1000).toFixed(1)}km · ${Math.round(travel.elevationM)}m · ${travel.gradientPct >= 0 ? '+' : ''}${travel.gradientPct.toFixed(1)}%`
          : 'move the slider under the map'}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12, display: 'grid', gap: 8 }}>
        <StatRow label="Distance" value={`${route.lengthKm.toFixed(1)} km (${route.lengthMi.toFixed(1)} mi)`} />
        <StatRow label="Elevation gain" value={`${route.ascentM.toLocaleString()} m (${route.ascentFt.toLocaleString()} ft)`} />
        <StatRow label="Elevation range" value={`${route.elevMinM.toLocaleString()}–${route.elevMaxM.toLocaleString()} m`} />
      </div>
    </div>
  );

  // Inherit whatever setup was last used on the Gear Calculator / Climb
  // Planner / Comparator / Grand Tour / RPI / Chequamegon pages (cg_shared)
  // — same pattern as ClimbDetailClient.tsx / RpiRouteDetailClient.tsx.
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
          <span className="climb-kicker">UCI Worlds 2026, Montréal — 3D Route Visualiser</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1400, paddingBottom: 0 }}>
        <p className="climb-summary">{route.blurb}</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -8, marginBottom: 18, textAlign: 'center' }}>{route.eventLabel}</p>
        <PersonalisedClimbReport slug={route.slug} S={S} gears={gears} />
        {CLIMB_STRAVA_SEGMENTS[route.slug] && (
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 14, marginBottom: 24 }}>
            The Strava link in the top right of the map below is just the {CLIMB_STRAVA_SEGMENTS[route.slug].lengthKm}km{' '}
            {CLIMB_STRAVA_SEGMENTS[route.slug].name ?? 'climb'} segment — a short section of this {route.lengthKm}km
            lap, not the whole circuit.
          </p>
        )}
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
              <DebugScene key={route.slug} slug={route.slug} influences={influences} state={stop.state} mapStyle={stop.mapStyle} onTravelChange={setTravel} footprintScale={FOOTPRINT_SCALE} playDurationS={playDurationS} maxSmoothingM={MAX_SMOOTHING_M} exaggerationMultiplier={EXAGGERATION_MULTIPLIER} highlightOffsetScale={HIGHLIGHT_OFFSET_SCALE} endLabel="Finish" />
            </div>
            {buyInfo ? (
              <div className="rpi-affiliate-row" style={{ marginTop: 12, alignItems: 'stretch' }}>
                {statsCard}
                <BuyCard buyInfo={buyInfo} />
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>{statsCard}</div>
            )}
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
              <li><b>3D View</b> — the route over real 3D terrain relief, drag the slider under the map to travel along it.</li>
              <li><b>Wedge</b> — a side-on profile of the route, showing gradient as a rising/falling wedge.</li>
              <li>Whichever view is open, dragging the slider moves you along the route — the gradient, distance and elevation readouts update live as you go.</li>
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
          Course data via montreal2026.org and the UCI&apos;s own course reveal.
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
          { href: '/uci-worlds-montreal-2026', label: '← UCI Worlds 2026' },
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
