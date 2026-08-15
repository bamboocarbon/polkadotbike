'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WHEELS } from '@/lib/gearDb';
import { ClimbCalcState, defaultClimbState, initClimbStateFromShared, ACCENT_MAP, ACCENT_LIGHT_MAP } from '@/lib/climbCalcState';
import { computeClimbGears, computeBuyInfo } from '@/lib/climbGearCalc';
import { kgToLbs, lbsToKg, kmToMi, miToKm } from '@/lib/units';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { pbBrandColorStyle } from '@/lib/pbLinks';
import ClimbChart, { ClimbGearPoint } from './ClimbChart';
import AchievabilityCards from './AchievabilityCards';
import ClimbConfigPanel from './ClimbConfigPanel';
import PrintReportModal, { ClimbPrintReportData } from './PrintReportModal';

const REF_CRANK = 172.5;
const SURFACES = [
  { crr: 0.004, label: 'Asphalt' },
  { crr: 0.007, label: 'Hardpack' },
  { crr: 0.012, label: 'Gravel' },
  { crr: 0.02, label: 'Rocky' },
];

function fmtTime(t: number | null): string | null {
  if (t === null) return null;
  if (t >= 60) return `${Math.floor(t / 60)}h ${Math.round(t % 60)}m`;
  return `${Math.round(t)} min`;
}

function ClimbPlannerInner() {
  const searchParams = useSearchParams();
  const [S, setS] = useState<ClimbCalcState>(defaultClimbState);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSvgHtml, setReportSvgHtml] = useState('');
  const [initDone, setInitDone] = useState(false);
  const chartWrapRef = useRef<HTMLDivElement>(null);

  // ── INIT: cg_shared (always loaded as a fallback base — unlike index.html,
  // climb.html never skips it) + URL params, run once on mount ──
  useEffect(() => {
    setS(initClimbStateFromShared(searchParams, readSharedSetup()));
    setInitDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[S.brand]);
    document.documentElement.style.setProperty('--accent-light', ACCENT_LIGHT_MAP[S.brand]);
  }, [S.brand]);

  const bodyKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bodyRaw) : S.bodyRaw;
  const bikeKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bikeRaw) : S.bikeRaw;
  const mass = bodyKgVal + bikeKgVal;
  const climbDistKm = S.distUnit === 'mi' ? miToKm(S.distRaw) : S.distRaw;

  const calc = useMemo(() => computeClimbGears(S), [S]);

  const results = useMemo(() => {
    if (!calc) return null;
    const allGears = calc.isSingle ? calc.bigGears : [...calc.bigGears, ...(calc.smallGears as ClimbGearPoint[])];
    const usable = allGears.filter((g) => !g.cross && g.pwr <= S.power);
    const total = allGears.filter((g) => !g.cross);
    const best = usable.length ? usable.reduce((a, b) => (a.spd > b.spd ? a : b)) : null;
    const vam = best && S.gradient > 0 ? Math.round(best.spd * S.gradient * 10) : null;
    const timeMin = best ? (climbDistKm / best.spd) * 60 : null;
    const timeFmt = fmtTime(timeMin);
    const equivOuter = ((calc.outer * S.crankLen) / REF_CRANK).toFixed(1);
    return { usable, total, best, vam, timeFmt, equivOuter };
  }, [calc, S.power, S.gradient, climbDistKm, S.crankLen]);

  // ── Save-back to cg_shared + URL, after every recalculation (post-init only) ──
  // Debounced: Next's own App Router does its own history.replaceState() housekeeping
  // on the same page, sharing WebKit's per-document rate limit on that API with ours.
  // Firing on every single slider tick during a fast drag can exhaust that shared
  // budget and crash the app when Next's (unguarded) call is the one that trips it.
  useEffect(() => {
    if (!initDone) return;
    const t = setTimeout(() => {
      writeSharedSetup({
        d: S.discipline,
        b: S.brand,
        g: S.groupset || '',
        cr: S.crIdx,
        cs: S.cassetteLabel || '',
        w: String(S.wheelCirc),
        cad: String(S.cadence),
        pw: String(S.power),
        wt: mass.toFixed(2),
        bwt: bodyKgVal.toFixed(2),
        bkw: bikeKgVal.toFixed(2),
        wunit: S.weightUnit,
        gr: String(S.gradient),
        cda: S.cda,
        crr: S.crr,
        ck: String(S.crankLen),
        dst: climbDistKm.toFixed(1),
        cust: { ct: S.cust.crankType, big: S.cust.big, small: S.cust.small, cass: S.cust.cassetteText },
      });
      const p = new URLSearchParams({
        d: S.discipline,
        b: S.brand,
        g: S.groupset || '',
        cr: String(S.crIdx),
        cs: S.cassetteLabel || '',
        w: String(S.wheelCirc),
        cad: String(S.cadence),
        pw: String(S.power),
        wt: mass.toFixed(2),
        bwt: bodyKgVal.toFixed(1),
        bkw: bikeKgVal.toFixed(1),
        wunit: S.weightUnit,
        gr: String(S.gradient),
        cda: String(S.cda),
        crr: String(S.crr),
        ck: String(S.crankLen),
        dst: climbDistKm.toFixed(1),
      });
      if (S.brand === 'custom') {
        p.set('xk', S.cust.crankType);
        p.set('xb', String(S.cust.big));
        p.set('xs', String(S.cust.small));
        p.set('xc', S.cust.cassetteText);
      }
      try {
        window.history.replaceState(null, '', '?' + p.toString());
      } catch {
        // ignore
      }
    }, 200);
    return () => clearTimeout(t);
  }, [S, initDone, mass, bodyKgVal, bikeKgVal, climbDistKm]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openReport() {
    const svgEl = chartWrapRef.current?.querySelector('svg');
    const html = svgEl
      ? svgEl.outerHTML
          .replace(/rgba\(255,255,255,0\.05\)/g, 'rgba(0,0,0,0.09)')
          .replace(/rgba\(255,255,255,0\.09\)/g, 'rgba(0,0,0,0.18)')
          .replace(/fill="#94a3b8"/g, 'fill="#64748b"')
      : '';
    setReportSvgHtml(html);
    setShowReport(true);
  }

  const buyInfo = useMemo(() => computeBuyInfo(S, calc), [S, calc]);

  const verdict = useMemo(() => {
    if (!results) return null;
    const { usable, total } = results;
    let cls: string, icon: string, main: string, meta: string;
    if (usable.length === 0) {
      const minPwr = total.length ? Math.round(Math.min(...total.map((g) => g.pwr))) : 0;
      cls = 'v-no';
      icon = '✕';
      main = 'This climb exceeds your current power';
      meta = `Easiest gear needs ${minPwr}W — reduce gradient, increase power output, or choose a lower gear ratio`;
    } else if (usable.length <= Math.ceil(total.length * 0.35)) {
      cls = 'v-warn';
      icon = '⚠';
      main = "Possible, but you're near your limit";
      meta = `${usable.length} of ${total.length} gears within your ${S.power}W`;
    } else {
      cls = 'v-yes';
      icon = '✓';
      main = 'This climb is achievable';
      meta = `${usable.length} of ${total.length} gears within your ${S.power}W`;
    }
    const parts = [meta];
    if (results.timeFmt && S.gradient > 0) {
      const distDisp = S.distUnit === 'mi' ? `${kmToMi(climbDistKm).toFixed(1)}mi` : `${climbDistKm.toFixed(1)}km`;
      parts.push(`${distDisp} takes ~${results.timeFmt}`);
    }
    if (S.crankLen !== REF_CRANK && calc) parts.push(`${S.crankLen}mm cranks — ${calc.outer}T feels like ${results.equivOuter}T on 172.5mm ref`);
    return { cls, icon, main, meta: parts.join(' · ') };
  }, [results, S.power, S.gradient, S.distUnit, S.crankLen, climbDistKm, calc]);

  const recommendation = useMemo(() => {
    if (!results?.best || !calc) return null;
    const best = results.best;
    const ring = calc.isSingle ? `${calc.outer}T single ring` : calc.bigGears.includes(best) ? `${calc.outer}T big ring` : `${calc.inner}T small ring`;
    const subParts = [`${best.spd.toFixed(1)} km/h`, `${Math.round(best.pwr)}W`];
    if (results.vam !== null) subParts.push(`${results.vam.toLocaleString()} m/hr VAM`);
    return { gearLabel: `${ring} / ${best.cog}T`, sub: subParts.join(' · '), best };
  }, [results, calc]);

  const ul = 'km/h';

  const printData: ClimbPrintReportData | null =
    calc && results
      ? {
          groupset: S.brand === 'custom' ? 'Custom' : S.groupset || '',
          crLabel: calc.crLabelText,
          csLabel: calc.csLabelText,
          outer: calc.outer,
          inner: calc.inner,
          isSingle: calc.isSingle,
          bigGears: calc.bigGears,
          smallGears: calc.smallGears,
          userPwr: S.power,
          mass: +mass.toFixed(1),
          grade: S.gradient,
          cadence: S.cadence,
          crankLen: S.crankLen,
          climbDist: climbDistKm,
          distUnit: S.distUnit,
          vam: results.vam,
          timeFmt: results.timeFmt,
          equivOuter: results.equivOuter,
          crr: S.crr,
          surfaceLabel: SURFACES.find((s) => s.crr === S.crr)?.label || '',
          wheelLabel: WHEELS[S.discipline].find((w) => w.circ === S.wheelCirc)?.label || '',
          svgHtml: reportSvgHtml,
        }
      : null;

  const ringLabel = calc ? (calc.isSingle ? `${calc.outer}T Single Ring` : calc.crLabelText) : '';
  const achieveTitle = calc ? `${ringLabel} · ${calc.csLabelText} Cassette · ${S.gradient}% gradient` : 'Gear Achievability';

  return (
    <div className="calc-grid">
      {/* ── INPUT PANEL ── */}
      <ClimbConfigPanel S={S} setS={setS} />

      {/* ── RESULTS ── */}
      <div className="results">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Your Power</div>
            <div className="stat-val">
              {S.power}
              <span className="u">W</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Achievable Gears</div>
            <div className="stat-val">
              {results ? (
                <>
                  <span className={results.usable.length > 0 ? 'stat-green' : 'stat-red'}>{results.usable.length}</span>
                  <span className="u"> / {results.total.length}</span>
                </>
              ) : (
                '—'
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Best Climbing Speed</div>
            <div className="stat-val">{results?.best ? <>{results.best.spd.toFixed(1)}<span className="u">km/h</span></> : results ? <span className="stat-red">none</span> : '—'}</div>
            <div className="stat-note">Fastest usable gear — moves in steps as gearing or terrain changes, not continuously</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gradient</div>
            <div className="stat-val">
              {S.gradient > 0 ? '+' : ''}
              {S.gradient}
              <span className="u">%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">VAM</div>
            <div className="stat-val">
              {S.gradient <= 0 ? (
                <>
                  <span style={{ fontSize: 17, letterSpacing: 0 }}>N/A</span>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>on flat</div>
                </>
              ) : results?.vam != null ? (
                <>
                  {results.vam.toLocaleString()}
                  <span className="u">m/hr</span>
                </>
              ) : (
                <span className="u">—</span>
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Summit Time</div>
            <div className="stat-val">{results?.timeFmt ? results.timeFmt : <span className="u">—</span>}</div>
            <div className="stat-note">Based on that same gear&apos;s pace</div>
          </div>
        </div>

        {verdict && (
          <div className={`verdict-card ${verdict.cls}`}>
            <div className="verdict-icon">{verdict.icon}</div>
            <div className="verdict-body">
              <div className="verdict-main">{verdict.main}</div>
              <div className="verdict-meta">{verdict.meta}</div>
            </div>
          </div>
        )}

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Power Required per Gear</div>
              <div className="chart-subtitle">Gears below the dashed line are achievable at your power · hover for details</div>
            </div>
            <div className="chart-legend">
              <div className="cl-item">
                <div className="cl-line" style={{ background: '#aeb8c2' }} />
                Big ring
              </div>
              <div className="cl-item">
                <div className="cl-line" style={{ background: '#7d8896' }} />
                Small ring
              </div>
              <div className="cl-item">
                <div className="cl-line" style={{ background: '#fff', opacity: 0.4, borderTop: '2px dashed #fff' }} />
                Your power
              </div>
              <button className={`share-btn${copied ? ' copied' : ''}`} onClick={copyLink}>
                {copied ? '✓ Copied!' : '⬡ Copy link'}
              </button>
              <button className="share-btn" onClick={openReport}>
                ⎙ Report
              </button>
            </div>
          </div>
          <div ref={chartWrapRef}>
            {calc ? (
              <ClimbChart bigGears={calc.bigGears} smallGears={calc.smallGears} isSingle={calc.isSingle} userPwr={S.power} />
            ) : (
              <div className="chart-wrap">
                <div className="chart-empty">Configure groupset and power to see your climb profile</div>
              </div>
            )}
          </div>
        </div>
        <div className="chart-tooltip" />

        <div className="achieve-card">
          <div className="achieve-head">
            <div className="achieve-title">{achieveTitle}</div>
            <div className="achieve-sub">Green = within your power · Amber = within 15% of limit · Red = too hard · × = cross-chain</div>
          </div>
          {calc ? (
            <AchievabilityCards bigGears={calc.bigGears} smallGears={calc.smallGears} outer={calc.outer} inner={calc.inner} isSingle={calc.isSingle} userPwr={S.power} />
          ) : (
            <div className="achieve-cols">
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13, gridColumn: '1/-1' }}>
                Select a groupset to see gear achievability
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RAIL ── */}
      <div className="rail">
        {buyInfo && (
          <div className="rail-card" id="buy-card">
            <div className="rail-head">Buy These Components</div>
            <div className="rail-body">
              <img className="pb-logo-chip" src="/pb-logo.png" alt="Performance Bicycle" />
              <div className="buy-label">
                <strong>{buyInfo.label}</strong>Selected configuration
              </div>
              <a className="pb-buy-link" href={buyInfo.url} target="_blank" rel="noopener sponsored" style={pbBrandColorStyle(buyInfo.color, buyInfo.text)}>
                <span className="pb-text">
                  {buyInfo.exact ? 'Shop this groupset' : 'Browse similar groupsets'}
                  <small>{buyInfo.exact ? 'Opens in a new tab' : 'Exact model not stocked — opens in a new tab'}</small>
                </span>
                <span className="pb-arrow">→</span>
              </a>
              <p className="pb-note">Affiliate link — I may earn a small commission at no extra cost to you.</p>
            </div>
          </div>
        )}

        {recommendation && (
          <div className="rail-card" id="rec-card">
            <div className="rail-head">Recommended Gear</div>
            <div className="rail-body">
              <div className="rec-box">
                <div className="rec-label">Best climbing gear</div>
                <div className="rec-gear">{recommendation.gearLabel}</div>
                <div className="rec-sub">{recommendation.sub}</div>
              </div>
              <div className="tip-text">
                <p>
                  The hardest gear you can sustain at <strong>{S.power}W</strong> on <strong>{S.gradient}%</strong> at <strong>{S.cadence} rpm</strong>.
                </p>
                {results?.timeFmt && S.gradient > 0 && (
                  <p>
                    At this pace, a <strong>{S.distUnit === 'mi' ? `${kmToMi(climbDistKm).toFixed(1)}mi` : `${climbDistKm.toFixed(1)}km`}</strong> climb takes roughly{' '}
                    <strong>{results.timeFmt}</strong>.
                  </p>
                )}
                {S.crankLen !== REF_CRANK && calc && results && (
                  <p>
                    On <strong>{S.crankLen}mm</strong> cranks, your {calc.outer}T chainring applies the same leverage as a{' '}
                    <strong>{results.equivOuter}T</strong> on 172.5mm cranks.
                  </p>
                )}
                <p>Shift to a smaller cog when the gradient eases.</p>
              </div>
            </div>
          </div>
        )}

        <div className="rail-card">
          <div className="rail-head">How It Works</div>
          <div className="rail-body">
            <div className="tip-text">
              <p>
                <strong>Power model</strong> — watts required = gravity + rolling resistance + aerodynamic drag, all multiplied by speed.
                This is the standard cycling physics model.
              </p>
              <p>
                <strong>Green gears</strong> are comfortably within your power. <strong>Amber</strong> gears are within 15% of your
                limit — hard but possible. <strong>Red</strong> gears need more watts than you&apos;ve set.
              </p>
              <p>
                <strong>CdA</strong> is your drag coefficient × frontal area. Hoods ≈ 0.36, drops ≈ 0.32, TT position ≈ 0.22. It has
                less effect on climbs than on flat roads.
              </p>
              <p>
                <strong>Surface (Crr)</strong> is rolling resistance — it rises sharply off tarmac. Smooth asphalt ≈ 0.004, hardpack
                gravel ≈ 0.007, loose gravel ≈ 0.012, rocky/rough off-road ≈ 0.020. These are reference estimates — actual resistance
                also depends on tyre width and pressure, and rough terrain adds traction losses this model can&apos;t capture.
              </p>
              <p>
                <strong>System weight</strong> — include rider, clothing, shoes, bike, water and food. Every kilogram matters on a
                climb.
              </p>
              <p>
                <strong>VAM</strong> (velocità ascensionale media) is vertical metres climbed per hour — the classic climber&apos;s
                metric. Pro riders hit 1,500–1,800 m/hr on steep mountain stages.
              </p>
              <p>
                <strong>Crank length</strong> affects leverage, not speed. Shorter cranks (e.g. 170mm) spin more freely but reduce
                torque per pedal stroke — the equivalent chainring shows what size would give the same leverage on a 172.5mm
                reference.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showReport && printData && <PrintReportModal data={printData} onClose={() => setShowReport(false)} />}
    </div>
  );
}

export default function ClimbPlanner() {
  return (
    <Suspense fallback={null}>
      <ClimbPlannerInner />
    </Suspense>
  );
}
