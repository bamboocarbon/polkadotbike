'use client';

/**
 * The 3D climb detail page — reached from every ready climb card and the
 * /climbs index (see ClimbCard.tsx and ClimbIndexClient.tsx). Moved here
 * from app/climb-debug-3d/[slug] 2026-08-15, once it became clear this
 * *is* the live climb-detail page, not a scratch tool — see
 * project_cyclegear_climb_3d.md memory. metadata/generateMetadata lives in
 * the sibling page.tsx (a Server Component) since this file is 'use client'.
 *
 * 2026-08-13: contained the 3D view inside the site's own hero/AADS chrome
 * (was full-viewport) and added a gear-achievability panel wired to the
 * "travel along route" slider, reusing the real ClimbPlanner gear-ratio
 * logic and AchievabilityCards component rather than reinventing it. Later
 * the same day: the panel grew a Setup/Gears toggle — Setup reuses the real
 * Climb Planner's own ClimbConfigPanel (brand/groupset/cadence/weight/etc,
 * extracted out of ClimbPlanner.tsx so both pages share one form), Gears
 * shows the resulting AchievabilityCards driven by that setup at the live
 * travel gradient (not a manual slider — that's the whole point of
 * scrubbing the route).
 */
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { TravelInfo } from '../DebugScene';
import AADSUnit from '@/components/AADSUnit';
import Footer from '@/components/Footer';
import AchievabilityCards from '@/components/climb/AchievabilityCards';
import ClimbConfigPanel from '@/components/climb/ClimbConfigPanel';
import { computeClimbGears, computeBuyInfo, type ClimbBuyInfo } from '@/lib/climbGearCalc';
import { ClimbCalcState, defaultClimbState, initClimbStateFromShared } from '@/lib/climbCalcState';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { pbBrandColorStyle } from '@/lib/pbLinks';
import { lbsToKg } from '@/lib/units';
import '@/components/climb/climb.css';

const DebugScene = dynamic(() => import('../DebugScene'), { ssr: false });

const BRAND_LABELS: Record<string, string> = { shimano: 'Shimano', sram: 'SRAM', campagnolo: 'Campagnolo', custom: 'Custom' };

function BuyCard({ buyInfo }: { buyInfo: ClimbBuyInfo }) {
  return (
    <div className="rail-card" id="buy-card">
      <div className="rail-head">Buy These Components</div>
      <div className="rail-body" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <img src="/pb-logo.png" alt="Performance Bicycle" style={{ width: 190, maxWidth: '100%', height: 'auto', flexShrink: 0 }} />
          <div
            style={{ fontSize: 19, fontWeight: 700, color: '#fff', flex: '1 1 180px', minWidth: 160 }}
            title={buyInfo.label}
          >
            {buyInfo.label}
          </div>
          <a
            className="pb-buy-link"
            href={buyInfo.url}
            target="_blank"
            rel="noopener sponsored"
            style={{ ...pbBrandColorStyle(buyInfo.color, buyInfo.text), flexShrink: 0, padding: '14px 30px', gap: 8, fontSize: 16 }}
          >
            <span className="pb-text" style={{ whiteSpace: 'nowrap' }}>
              {buyInfo.exact ? 'Shop this groupset' : 'Browse similar groupsets'}
            </span>
            <span className="pb-arrow">→</span>
          </a>
        </div>
        <p className="pb-note" style={{ marginTop: 10 }}>Affiliate link — I may earn a small commission at no extra cost to you.</p>
      </div>
    </div>
  );
}

const STOPS = [
  { key: 'A', label: 'Plan', state: 'A' as const, mapStyle: 'flat' as const },
  { key: 'B-flat', label: 'Route (flat map)', state: 'B' as const, mapStyle: 'flat' as const },
  { key: 'B-3d', label: 'Route (3D terrain)', state: 'B' as const, mapStyle: 'terrain' as const },
  { key: 'C', label: 'Wedge', state: 'C' as const, mapStyle: 'flat' as const },
];

interface ClimbDetailClientProps {
  name: string;
  summary: string;
}

export default function ClimbDetailClient({ name, summary }: ClimbDetailClientProps) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
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

  // Inherit whatever setup was last used on the Gear Calculator / Climb
  // Planner / Comparator (cg_shared) — mirrors ClimbPlanner.tsx's own init
  // effect (see initClimbStateFromShared), but no URL params here since
  // this page's URL is just the climb slug. Deliberately a useEffect, not a
  // useState lazy initializer, so the first render matches SSR (defaults)
  // and avoids a hydration mismatch — the swap to the real shared setup
  // happens right after mount, same pattern ClimbPlanner.tsx uses.
  useEffect(() => {
    setS(initClimbStateFromShared(new URLSearchParams(), readSharedSetup()));
    setSetupInitDone(true);
  }, []);

  // Write our own setup fields back to cg_shared (debounced, same reasoning
  // as ClimbPlanner.tsx: avoid tripping WebKit's shared history.replaceState
  // rate limit during a fast slider drag) — but never gradient/distance,
  // which this tool doesn't expose (gradient comes live from the route) and
  // shouldn't overwrite what the other calculators have set for those.
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
          {name}
          <br />
          <span className="climb-kicker">3D Climb Visualiser</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1400, paddingBottom: 0 }}>
        <p className="climb-summary">{summary}</p>
      </div>

      <div className="container" style={{ maxWidth: 1400 }}>
        <div className="climb-detail-grid">
          <div>
            <div className="glass" style={{ position: 'relative', height: 640, overflow: 'hidden' }}>
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
              <DebugScene key={slug} slug={slug} influences={influences} state={stop.state} mapStyle={stop.mapStyle} onTravelChange={setTravel} />
            </div>
            {buyInfo && (
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
                style={{ padding: 16, position: 'sticky', top: 70, maxHeight: 'calc(100vh - 82px)', overflowY: 'auto', overflowX: 'hidden' }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{name}</div>
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
              <li><b>Plan</b> — the climb before any route or terrain is loaded.</li>
              <li><b>Route (flat map)</b> — the climb laid out on a 2D map, drag the slider under the map to travel along it.</li>
              <li><b>Route (3D terrain)</b> — the same route over real 3D elevation data.</li>
              <li><b>Wedge</b> — a side-on profile of the climb, showing gradient as a rising wedge.</li>
              <li>Whichever view is open, dragging the slider moves you along the climb — the gradient, distance and elevation readouts on the right update live as you go.</li>
              <li><b>Smoothing</b> (bottom-right of the map) — averages the gradient colour band over a distance window from 0 (off) up to 1000m, so noisy raw gradient data reads as a cleaner gradient.</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
              How to use Setup &amp; Gears
            </div>
            <ul className="controls" style={{ margin: 0 }}>
              <li><b>Setup</b> — enter your groupset, weight, power and cadence. This is the same setup used across the Gear Calculator, Climb Planner and Comparator, so it carries over automatically.</li>
              <li><b>Gears</b> — shows which of your gears are achievable at the current gradient as you drag the slider on the map, and flags the ones that are too hard or too easy.</li>
              <li>Switch to Setup first if you haven&apos;t entered a groupset yet — Gears needs it to work out achievability.</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer
        attribution={
          <>
            <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> — 3D climb visualiser. Terrain and gradient are indicative.
          </>
        }
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/climb', label: 'Climb Planner' },
          { href: '/vuelta', label: 'Vuelta 2026' },
          { href: '/guide', label: 'Guide' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
