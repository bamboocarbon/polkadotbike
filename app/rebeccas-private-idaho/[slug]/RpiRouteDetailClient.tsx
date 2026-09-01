'use client';

/**
 * Rebecca's Private Idaho route detail — same 3D engine as /climbs/[slug]
 * (DebugScene: Plan / 3D View / Wedge) plus the same Setup/Gears panel
 * (ClimbConfigPanel + AchievabilityCards, driven live by the travel slider's
 * gradient) — that machinery is generic gear-ratio-achievability, not tied
 * to a single categorised mountain ascent, so it's fully reusable here.
 * Deliberately still WITHOUT buildClimbSummary's narrative copy
 * (decisive-climb-of-the-stage language, kbf lookups) — that depends on
 * Grand Tour stage data these routes don't have. PersonalisedClimbReport
 * (physics time/speed/gearing estimate) is NOT in that boat — it only needs
 * setup+gears+per-point gradient data, which these routes' GPX-derived
 * JSONs supply at the same density as the Grand Tour climb files, so it's
 * wired in below. Caveat (not RPI-specific, but bites harder here): the
 * time model assumes pedaling at your set power for the whole route,
 * descents included — fine on ascent-only climb pages, but on these long
 * rolling routes with real descending it'll read a bit optimistic on
 * avg speed/time versus actually coasting downhill. See data/rpiRoutes.ts
 * for why this is a separate dataset entirely from data/climbs.json.
 *
 * Affiliate cards (2026-08-31): BuyCard (component shop-this-groupset,
 * driven by the same S/gears as the climb pages) and BikesBookingCard/
 * KiwiCard (bike rental/flights - generic, no per-route data needed)
 * ported over unchanged. Stay22 (hotel embed) is NOT on this per-route
 * page - Robin's real Ketchum/Sun Valley widget src (2026-08-31) is only
 * wired into the /rebeccas-private-idaho index page below the Day 3 route
 * cards, one map for the whole event rather than a copy per route.
 *
 * All of the above, plus the AADSUnit ad banner further down, are gated
 * behind RPI_AFFILIATES_ENABLED (2026-08-31) - Robin's temporarily hiding
 * every affiliate/ad block sitewide while he emails the event organisers
 * to check they're OK with the site being promoted before the event.
 * See rpiFeatureFlags.ts.
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
import BikesBookingCard from '@/components/affiliate/BikesBookingCard';
import KiwiCard from '@/components/affiliate/KiwiCard';
import { RPI_AFFILIATES_ENABLED } from '@/components/rpi/rpiFeatureFlags';
import { computeClimbGears, computeBuyInfo } from '@/lib/climbGearCalc';
import { ClimbCalcState, defaultClimbState, initClimbStateFromShared, BRAND_LABELS } from '@/lib/climbCalcState';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { lbsToKg } from '@/lib/units';
import type { RpiRoute } from '@/data/rpiRoutes';
import '@/components/climb/climb.css';
import '@/components/affiliate/affiliate.css';

const DebugScene = dynamic(() => import('@/app/climbs/DebugScene'), { ssr: false });

// Wider than the Grand Tour default (2) — these routes' low average
// gradient over a much longer distance pushes computeExaggeration to its
// ceiling clamp (15x vertical, vs ~3x for a typical mountain climb), which
// reads as spiky/oversized against the default horizontal footprint. Scoped
// to this page only via DebugScene's footprintScale prop — the 60 Grand
// Tour climb pages are untouched.
const RPI_FOOTPRINT_SCALE = 6;

// Grand Tour default (1000m/1km) isn't enough of a change to see a real
// difference on these much longer, rolling routes — Robin: "max of 1km
// smoothing on the long rides is not enough change. maybe 5k max."
const RPI_MAX_SMOOTHING_M = 5000;

// The Play button's default 25s-for-the-whole-route (DebugScene's
// DEFAULT_PLAY_DURATION_S) is tuned for a 5-30km mountain climb — on these
// 30-190km routes it made the travel marker look like it was zooming
// (Robin, on Dollarhide specifically, then correctly guessed every other
// long RPI route had the same issue). Computed per-route from its own real
// length instead of a flat override, so pace stays consistent whether it's
// Tater Tot (30km) or Fully Loaded Baked Potato (190km) rather than the
// shortest and longest routes playing back at wildly different speeds.
// 800 m/s matches roughly what a ~20km Grand Tour climb already plays at
// (20,000m / 25s) — kept as the reference pace so RPI's "quick flythrough"
// feel matches what's already established elsewhere, just no longer
// compressed into a fixed 25s regardless of how long the route actually is.
const RPI_PLAY_TARGET_MPS = 800;

const STOPS = [
  { key: 'A', label: 'Plan', state: 'A' as const, mapStyle: 'flat' as const },
  { key: 'B-3d', label: '3D View', state: 'B' as const, mapStyle: 'terrain' as const },
  { key: 'C', label: 'Wedge', state: 'C' as const, mapStyle: 'flat' as const },
];

export default function RpiRouteDetailClient({ route }: { route: RpiRoute }) {
  const [stopKey, setStopKey] = useState<string>('A');
  const [travel, setTravel] = useState<TravelInfo | null>(null);
  const [S, setS] = useState<ClimbCalcState>(defaultClimbState);
  const [setupInitDone, setSetupInitDone] = useState(false);
  const [panelTab, setPanelTab] = useState<'setup' | 'gears'>('gears');
  const stop = STOPS.find((s) => s.key === stopKey)!;
  const influences: [number, number] = stop.state === 'A' ? [0, 0] : stop.state === 'B' ? [1, 0] : [0, 1];
  const gradientPct = travel?.gradientPct ?? 0;
  const gears = useMemo(() => computeClimbGears(S, gradientPct), [S, gradientPct]);
  const buyInfo = useMemo(() => computeBuyInfo(S, gears), [S, gears]);
  const playDurationS = (route.lengthKm * 1000) / RPI_PLAY_TARGET_MPS;

  // Inherit whatever setup was last used on the Gear Calculator / Climb
  // Planner / Comparator / Grand Tour climb pages (cg_shared) — same
  // pattern as ClimbDetailClient.tsx.
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
          <span className="climb-kicker">Rebecca&apos;s Private Idaho — 3D Route Visualiser</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1400, paddingBottom: 0 }}>
        <p className="climb-summary">{route.blurb}</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -8, marginBottom: 18 }}>{route.dayLabel}</p>
        <PersonalisedClimbReport slug={route.slug} S={S} gears={gears} />
      </div>

      {RPI_AFFILIATES_ENABLED && (
        <div className="container" style={{ maxWidth: 1400, paddingBottom: 0 }}>
          <div className="rpi-affiliate-row">
            <BikesBookingCard blurb="Riding the route yourself, or just want wheels while you're in Idaho? Compare rental rates worldwide." />
            <KiwiCard
              title="✈️ Fly to the event"
              blurb="Taking part from further afield? Compare flights to Sun Valley/Ketchum, Idaho."
            />
          </div>
        </div>
      )}

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
              <DebugScene key={route.slug} slug={route.slug} influences={influences} state={stop.state} mapStyle={stop.mapStyle} onTravelChange={setTravel} footprintScale={RPI_FOOTPRINT_SCALE} playDurationS={playDurationS} maxSmoothingM={RPI_MAX_SMOOTHING_M} />
            </div>
            {/* Download GPX lives inside DebugScene's own control bar
                (top-right, next to Reset view) — this used to duplicate it
                with a second button below the map (Robin, 2026-08-31). */}
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
            {RPI_AFFILIATES_ENABLED && buyInfo && (
              <div style={{ marginTop: 16 }}>
                <BuyCard buyInfo={buyInfo} />
              </div>
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

      {RPI_AFFILIATES_ENABLED && <AADSUnit />}

      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="climb-detail-grid climb-guide-box">
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
              How to use the map
            </div>
            <ul className="controls" style={{ margin: 0 }}>
              <li><b>Plan</b> — the route laid out on a 2D map, drag the slider under the map to travel along it.</li>
              <li><b>3D View</b> — the same route over real 3D terrain relief.</li>
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
          Route data via Rebecca&apos;s Private Idaho (rebeccasprivateidaho.com).
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
          { href: '/rebeccas-private-idaho', label: "← Rebecca's Private Idaho" },
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
