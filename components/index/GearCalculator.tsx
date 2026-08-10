'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import {
  GearCalcState,
  ChartMode,
  SpeedUnit,
  defaultCalcState,
  applyDiscipline,
  applyBrand,
  applyGroupset,
  applyCrIdx,
  applyCassette,
  applyWheel,
  applyCadence,
  applyUnit,
  applyChartMode,
  applyCrankMode,
  applyCustAdjust,
  applyCustCassetteText,
  parseCustomCassette,
  groupsetOptionsFor,
  CUST_LIMITS,
  ACCENT_MAP,
  ACCENT_LIGHT_MAP,
} from '@/lib/gearCalcState';
import { computeGears, gearStats, GearPoint } from '@/lib/gearMath';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { pbLinkFor, pbBrandColorStyle, PB_VIVID_TEXT, PB_GENERIC_LINK } from '@/lib/pbLinks';
import GearChart from './GearChart';
import PrintReportModal, { PrintReportData } from './PrintReportModal';

const DISCIPLINES: Discipline[] = ['road', 'mtb', 'gravel'];
const BRANDS: Brand[] = ['shimano', 'sram', 'campagnolo', 'custom'];

function fmtStat(v: number, ul: string) {
  return (
    <>
      {v.toFixed(1)}
      <span className="u">{ul}</span>
    </>
  );
}

function GearCards({
  gears,
  cls,
  ringLabel,
  ul,
}: {
  gears: GearPoint[];
  cls: 'big' | 'small';
  ringLabel: string;
  ul: string;
}) {
  return (
    <div className="ring-col">
      <div className={`ring-col-head ${cls}`}>{ringLabel}</div>
      <div className="gear-cards">
        {gears.map((g, i) => {
          const next = gears[i + 1];
          const showStep = i < gears.length - 1 && !g.cross && next && !next.cross;
          const stepPct = showStep ? Math.abs(((next.spd - g.spd) / g.spd) * 100) : 0;
          const jump = stepPct > 14;
          return (
            <div key={g.cog + '-' + i}>
              <div className={`gear-card ${cls}-card${g.cross ? ' cross' : ''}`}>
                <div className="gc-left">
                  <div className="gc-cog">{g.cog}T</div>
                  <div className="gc-info">
                    <div className="gc-dev">{g.dev.toFixed(2)}m / rev</div>
                    {g.cross && <div className="cross-label">Cross-chain</div>}
                  </div>
                </div>
                <div className="gc-right">
                  <div className="gc-speed">{g.spd.toFixed(1)}</div>
                  <div className="gc-unit">{ul}</div>
                </div>
              </div>
              {showStep && (
                <div className={`step-row${jump ? ' jump' : ''}`}>
                  ▼ {stepPct.toFixed(0)}% step{jump ? ' — wide gap' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GearCalculatorInner() {
  const searchParams = useSearchParams();
  const [S, setS] = useState<GearCalcState>(defaultCalcState);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSvgHtml, setReportSvgHtml] = useState('');
  const [initDone, setInitDone] = useState(false);
  const chartWrapRef = useRef<HTMLDivElement>(null);

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

  // ── INIT: cg_shared + URL params, run once on mount (client only) ──
  useEffect(() => {
    const urlP = searchParams;
    let sh: Record<string, unknown> = {};
    // Matches index.html's own asymmetry: skip cg_shared entirely if the URL
    // already carries 'd' or 'g' (unlike climb.html, which always loads it as a base).
    if (!urlP.get('d') && !urlP.get('g')) {
      sh = readSharedSetup();
    }
    let next = defaultCalcState();
    const disc = (['road', 'mtb', 'gravel'].includes((urlP.get('d') || (sh.d as string)) as string)
      ? (urlP.get('d') || (sh.d as string))
      : 'road') as Discipline;
    next = applyDiscipline(next, disc);

    const brandRaw = (urlP.get('b') || (sh.b as string)) as Brand | undefined;
    if (brandRaw === 'custom') {
      const sc = (sh.cust as { big?: number; small?: number; ct?: string; cass?: string }) || {};
      const cBig = urlP.get('xb') || (sc.big != null ? String(sc.big) : undefined);
      const cSmall = urlP.get('xs') || (sc.small != null ? String(sc.small) : undefined);
      const cKind = urlP.get('xk') || sc.ct;
      const cCass = urlP.get('xc') || sc.cass;
      next = applyBrand(next, 'custom');
      next = {
        ...next,
        cust: {
          crankType: cKind === '1x' ? '1x' : '2x',
          big: cBig ? parseInt(cBig, 10) || next.cust.big : next.cust.big,
          small: cSmall ? parseInt(cSmall, 10) || next.cust.small : next.cust.small,
          cassetteText: cCass || next.cust.cassetteText,
        },
      };
    } else if (brandRaw && DISC_BRANDS[disc].includes(brandRaw as Exclude<Brand, 'custom'>)) {
      next = applyBrand(next, brandRaw);
    }

    if (next.brand !== 'custom') {
      const gsName = urlP.get('g') || (sh.g as string);
      const brandData = DB[disc][next.brand as Exclude<Brand, 'custom'>];
      if (gsName && brandData && Object.prototype.hasOwnProperty.call(brandData, gsName)) {
        next = applyGroupset(next, gsName);
      }
      const crValRaw = urlP.get('cr') ?? (sh.cr as string | number | undefined);
      const crVal = crValRaw != null ? parseInt(String(crValRaw), 10) : 0;
      if (crVal) next = applyCrIdx(next, crVal);
      const csVal = urlP.get('cs') || (sh.cs as string);
      const data = next.groupset ? (brandData as Record<string, { cassettes: { label: string }[] }>)[next.groupset] : null;
      if (csVal && data && data.cassettes.some((c) => c.label === csVal)) next = applyCassette(next, csVal);
    }

    const wVal = urlP.get('w') || (sh.w as string);
    if (wVal && WHEELS[disc].some((w) => String(w.circ) === String(wVal))) next = applyWheel(next, parseInt(wVal, 10));

    const cadVal = urlP.get('cad') || (sh.cad as string);
    if (cadVal) next = applyCadence(next, parseInt(cadVal, 10) || next.cadence);

    const uVal = urlP.get('u') || (sh.u as string);
    if (uVal === 'kmh' || uVal === 'mph') next = applyUnit(next, uVal);

    const cmVal = urlP.get('cm') || (sh.cm as string);
    if (cmVal === 'dev' || cmVal === 'spd' || cmVal === 'in') next = applyChartMode(next, cmVal);

    setS(next);
    setInitDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Accent CSS custom properties (global, matches source's direct root mutation) ──
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[S.brand]);
    document.documentElement.style.setProperty('--accent-light', ACCENT_LIGHT_MAP[S.brand]);
  }, [S.brand]);

  const isKmh = S.unit === 'kmh';
  const ul = isKmh ? 'km/h' : 'mph';

  const custTeeth = useMemo(() => (S.brand === 'custom' ? parseCustomCassette(S.cust.cassetteText) : null), [S.brand, S.cust.cassetteText]);

  const calc = useMemo(() => {
    if (S.brand === 'custom') {
      if (!custTeeth) return null;
      const outer = S.cust.big;
      const inner = S.cust.crankType === '2x' ? S.cust.small : null;
      const { bigGears, smallGears, isSingle } = computeGears(outer, inner, custTeeth, S.wheelCirc, S.cadence, isKmh);
      const ringLabel = isSingle ? `${outer}T Single Ring` : `${outer}/${inner}`;
      const cassLabel = `${custTeeth[0]}-${custTeeth[custTeeth.length - 1]}T Custom`;
      return { bigGears, smallGears, outer, inner, isSingle, crLabel: ringLabel, csLabel: cassLabel, groupsetLabel: 'Custom' };
    }
    if (!S.groupset) return null;
    const brandData = DB[S.discipline][S.brand as Exclude<Brand, 'custom'>];
    if (!brandData) return null;
    const data = (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[S.groupset];
    if (!data) return null;
    const cr = data.chainrings[S.crIdx] || data.chainrings[0];
    const cass = data.cassettes.find((c) => c.label === S.cassetteLabel) || data.cassettes[0];
    if (!cr || !cass) return null;
    const { bigGears, smallGears, isSingle } = computeGears(cr.outer, cr.inner, cass.teeth, S.wheelCirc, S.cadence, isKmh);
    return { bigGears, smallGears, outer: cr.outer, inner: cr.inner, isSingle, crLabel: cr.label, csLabel: cass.label, groupsetLabel: S.groupset };
  }, [S, custTeeth, isKmh]);

  // ── Save-back to cg_shared + URL, after every recalculation (post-init only) ──
  useEffect(() => {
    if (!initDone) return;
    writeSharedSetup({
      d: S.discipline,
      b: S.brand,
      g: S.groupset || '',
      cr: S.crIdx,
      cs: S.cassetteLabel || '',
      w: String(S.wheelCirc),
      cad: String(S.cadence),
      u: S.unit,
      cm: S.chartMode,
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
      u: S.unit,
      cm: S.chartMode,
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
  }, [S, initDone]);

  const groupsetGroups = useMemo(
    () => (S.brand === 'custom' ? [] : groupsetOptionsFor(S.discipline, S.brand as Exclude<Brand, 'custom'>)),
    [S.discipline, S.brand]
  );
  const currentGroupsetData = useMemo(() => {
    if (S.brand === 'custom' || !S.groupset) return null;
    const brandData = DB[S.discipline][S.brand as Exclude<Brand, 'custom'>];
    return brandData ? (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[S.groupset] : null;
  }, [S.discipline, S.brand, S.groupset]);

  const stats = useMemo(() => {
    if (!calc) return null;
    return gearStats(calc.bigGears, calc.smallGears, calc.isSingle);
  }, [calc]);

  const buyInfo = useMemo(() => {
    if (!calc) return null;
    if (S.brand === 'custom') {
      return { label: `${calc.crLabel} · ${calc.csLabel}`, url: PB_GENERIC_LINK, exact: false, color: ACCENT_MAP.custom, text: PB_VIVID_TEXT.custom };
    }
    if (!S.groupset) return null;
    const cleanGroupset = S.groupset.replace(/\s*\([^)]+\)\s*/g, '').trim();
    const pb = pbLinkFor(S.discipline, S.brand, S.groupset);
    return { label: `${cleanGroupset} · ${calc.crLabel} · ${calc.csLabel}`, url: pb.url, exact: pb.exact, color: ACCENT_MAP[S.brand], text: PB_VIVID_TEXT[S.brand] };
  }, [calc, S.brand, S.discipline, S.groupset]);

  function selectDiscipline(d: Discipline) {
    setS((prev) => applyDiscipline(prev, d));
  }
  function selectBrand(b: Brand) {
    setS((prev) => applyBrand(prev, b));
  }
  function onGroupsetChange(name: string) {
    setS((prev) => applyGroupset(prev, name));
  }
  function selectCR(i: number) {
    setS((prev) => applyCrIdx(prev, i));
  }
  function onCassetteChange(label: string) {
    setS((prev) => applyCassette(prev, label));
  }
  function onWheelChange(circ: number) {
    setS((prev) => applyWheel(prev, circ));
  }
  function onCadenceChange(v: number) {
    setS((prev) => applyCadence(prev, v));
  }
  function setUnit(u: SpeedUnit) {
    setS((prev) => applyUnit(prev, u));
  }
  function setChartMode(m: ChartMode) {
    setS((prev) => applyChartMode(prev, m));
  }
  function setCrankMode(mode: '1x' | '2x') {
    setS((prev) => applyCrankMode(prev, mode));
  }
  function adjCust(key: 'big' | 'small', delta: number) {
    setS((prev) => applyCustAdjust(prev, key, delta));
  }
  function onCustCassetteInput(text: string) {
    setS((prev) => applyCustCassetteText(prev, text));
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const custHint = useMemo(() => {
    if (S.brand !== 'custom') return null;
    if (!custTeeth) return { cls: 'err', text: 'Enter at least 2 cog sizes, e.g. 11,13,15,17,19,22,25,28' };
    return { cls: 'ok', text: `${custTeeth.length} sprocket${custTeeth.length > 1 ? 's' : ''} · ${custTeeth[0]}–${custTeeth[custTeeth.length - 1]}T` };
  }, [S.brand, custTeeth]);

  const cardsTitle = calc ? (S.brand === 'custom' ? `${calc.crLabel} · ${calc.csLabel}` : `${calc.crLabel} Chainring · ${calc.csLabel} Cassette`) : '';

  const chartTitle = S.chartMode === 'spd' ? `Gear Speed at ${S.cadence} rpm` : S.chartMode === 'in' ? 'Gear Inches' : 'Gear Development';
  const chartSubtitle =
    S.chartMode === 'spd' ? (
      <>{ul} per gear · slowest left, fastest right · hover for development</>
    ) : S.chartMode === 'in' ? (
      <>Gear inches per gear · slowest left, fastest right · hover for development</>
    ) : (
      <>
        Metres per crank revolution · slowest left, fastest right · hover for speed at <span>{S.cadence}</span> rpm
      </>
    );

  const printData: PrintReportData | null =
    calc && stats
      ? {
          groupset: S.brand === 'custom' ? 'Custom' : S.groupset || '',
          crLabel: calc.crLabel,
          csLabel: calc.csLabel,
          outer: calc.outer,
          inner: calc.inner,
          isSingle: calc.isSingle,
          bigGears: calc.bigGears,
          smallGears: calc.smallGears,
          ul,
          cadence: S.cadence,
          wheelLabel: WHEELS[S.discipline].find((w) => w.circ === S.wheelCirc)?.label || '',
          svgHtml: reportSvgHtml,
        }
      : null;

  return (
    <div className="calc-grid">
      {/* ── INPUT PANEL ── */}
      <div className="input-panel glass">
        <div className="panel-head">Configure Groupset</div>
        <div className="disc-tabs">
          {DISCIPLINES.map((d) => (
            <button key={d} className={`disc-tab${S.discipline === d ? ' active' : ''}`} onClick={() => selectDiscipline(d)}>
              {d === 'road' ? 'Road' : d === 'mtb' ? 'MTB' : 'Gravel'}
            </button>
          ))}
        </div>
        <div className="brand-tabs">
          {BRANDS.map((b) => {
            const visible = b === 'custom' || DISC_BRANDS[S.discipline].includes(b as Exclude<Brand, 'custom'>);
            return (
              <button
                key={b}
                className={`brand-tab${S.brand === b ? ' active' : ''}`}
                data-brand={b}
                style={{ display: visible ? '' : 'none' }}
                onClick={() => selectBrand(b)}
              >
                {b === 'shimano' ? 'Shimano' : b === 'sram' ? 'SRAM' : b === 'campagnolo' ? 'Campagnolo' : 'Custom'}
              </button>
            );
          })}
        </div>
        <div className="form-body">
          {S.brand !== 'custom' && (
            <>
              <div className="form-group">
                <label>Groupset</label>
                <select value={S.groupset || ''} onChange={(e) => onGroupsetChange(e.target.value)}>
                  {groupsetGroups.map((g) => (
                    <optgroup key={g.era} label={g.era}>
                      {g.names.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Chainring Combination</label>
                <div className="cr-grid">
                  {currentGroupsetData?.chainrings.map((cr, i) => (
                    <button key={i} className={`cr-btn${S.crIdx === i ? ' active' : ''}`} onClick={() => selectCR(i)}>
                      {cr.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Cassette</label>
                <select value={S.cassetteLabel} onChange={(e) => onCassetteChange(e.target.value)}>
                  {currentGroupsetData?.cassettes.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {S.brand === 'custom' && (
            <div className="cust-section" style={{ display: 'flex' }}>
              <div className="form-group">
                <label>Drivetrain Type</label>
                <div className="cust-mode-toggle">
                  <button className={`cust-mode-btn${S.cust.crankType === '2x' ? ' active' : ''}`} onClick={() => setCrankMode('2x')}>
                    2× Double
                  </button>
                  <button className={`cust-mode-btn${S.cust.crankType === '1x' ? ' active' : ''}`} onClick={() => setCrankMode('1x')}>
                    1× Single
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Chainrings</label>
                <div className="cust-ring-row">
                  <div className="cust-ring-cell">
                    <label>Big Ring</label>
                    <div className="cust-spinner">
                      <button className="cust-spin-btn" onClick={() => adjCust('big', -1)} disabled={S.cust.big <= CUST_LIMITS.big[0]}>
                        −
                      </button>
                      <div className="cust-spin-val">
                        <span>{S.cust.big}</span>
                        <span className="cust-spin-unit">T</span>
                      </div>
                      <button className="cust-spin-btn" onClick={() => adjCust('big', 1)} disabled={S.cust.big >= CUST_LIMITS.big[1]}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cust-sep" style={{ visibility: S.cust.crankType === '2x' ? 'visible' : 'hidden' }}>
                    −
                  </div>
                  <div className="cust-ring-cell" style={{ visibility: S.cust.crankType === '2x' ? 'visible' : 'hidden' }}>
                    <label>Small Ring</label>
                    <div className="cust-spinner">
                      <button className="cust-spin-btn" onClick={() => adjCust('small', -1)} disabled={S.cust.small <= CUST_LIMITS.small[0]}>
                        −
                      </button>
                      <div className="cust-spin-val">
                        <span>{S.cust.small}</span>
                        <span className="cust-spin-unit">T</span>
                      </div>
                      <button className="cust-spin-btn" onClick={() => adjCust('small', 1)} disabled={S.cust.small >= CUST_LIMITS.small[1]}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Cassette Cog Sizes</label>
                <input
                  type="text"
                  className="cust-cass-input"
                  placeholder="e.g. 11,13,15,17,19,22,25,28"
                  value={S.cust.cassetteText}
                  onChange={(e) => onCustCassetteInput(e.target.value)}
                />
                <div className={`cust-hint${custHint ? ' ' + custHint.cls : ''}`}>{custHint?.text}</div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Wheel &amp; Tyre</label>
            <select value={S.wheelCirc} onChange={(e) => onWheelChange(parseInt(e.target.value, 10))}>
              {WHEELS[S.discipline].map((w) => (
                <option key={w.circ} value={w.circ}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <div className="cadence-row">
              <label>Cadence</label>
              <div className="cadence-val">
                {S.cadence}
                <span>rpm</span>
              </div>
            </div>
            <input type="range" min={60} max={130} value={S.cadence} onChange={(e) => onCadenceChange(parseInt(e.target.value, 10))} />
            <div className="range-labels">
              <span>60 rpm</span>
              <span>130 rpm</span>
            </div>
          </div>
          <div className="form-group">
            <label>Speed Units</label>
            <div className="unit-toggle">
              <button className={`unit-btn${S.unit === 'kmh' ? ' active' : ''}`} onClick={() => setUnit('kmh')}>
                km/h
              </button>
              <button className={`unit-btn${S.unit === 'mph' ? ' active' : ''}`} onClick={() => setUnit('mph')}>
                mph
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="results">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Top Speed</div>
            <div className="stat-val">{stats ? fmtStat(stats.maxSpd, ul) : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Lowest Speed</div>
            <div className="stat-val">{stats ? fmtStat(stats.minSpd, ul) : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Speed Range</div>
            <div className="stat-val">{stats ? fmtStat(stats.range, ul) : '—'}</div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">{chartTitle}</div>
              <div className="chart-subtitle">{chartSubtitle}</div>
            </div>
            <div className="chart-controls">
              <div className="chart-mode-toggle">
                <button className={`chart-mode-btn${S.chartMode === 'dev' ? ' active' : ''}`} onClick={() => setChartMode('dev')}>
                  m/rev
                </button>
                <button className={`chart-mode-btn${S.chartMode === 'spd' ? ' active' : ''}`} onClick={() => setChartMode('spd')}>
                  Speed
                </button>
                <button className={`chart-mode-btn${S.chartMode === 'in' ? ' active' : ''}`} onClick={() => setChartMode('in')}>
                  Gear in.
                </button>
              </div>
              <div className="chart-legend">
                <div className="cl-item">
                  <div className="cl-line cl-big" />
                  Big ring
                </div>
                <div className="cl-item">
                  <div className="cl-line cl-small" />
                  Small ring
                </div>
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
              <GearChart
                bigGears={calc.bigGears}
                smallGears={calc.smallGears}
                ul={ul}
                cadence={S.cadence}
                chartMode={S.chartMode}
                bigColor={ACCENT_MAP[S.brand]}
                smallColor={ACCENT_LIGHT_MAP[S.brand]}
              />
            ) : (
              <div className="chart-wrap">
                <div className="chart-empty">Select a groupset to see your gear chart</div>
              </div>
            )}
          </div>
        </div>

        <div className="cards-card">
          <div className="cards-head">
            <div>
              <div className="cards-title">{cardsTitle}</div>
              <div className="cards-sub">Dimmed gears are cross-chain — avoid for drivetrain longevity</div>
            </div>
          </div>
          <div className="cards-grid-wrap">
            {calc && (
              <>
                <GearCards
                  gears={calc.bigGears}
                  cls="big"
                  ringLabel={calc.isSingle ? `${calc.outer}T Single Ring` : `${calc.outer}T Big Ring`}
                  ul={ul}
                />
                {!calc.isSingle && calc.smallGears && (
                  <GearCards gears={calc.smallGears} cls="small" ringLabel={`${calc.inner}T Small Ring`} ul={ul} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT RAIL ── */}
      <div className="rail">
        {buyInfo && (
          <div className="rail-card" id="buy-card">
            <div className="rail-head">Buy These Components</div>
            <div className="rail-body">
              <img className="pb-logo-chip" src="/pb-logo.png" alt="Performance Bicycle" />
              <div className="buy-label">
                <strong>{buyInfo.label}</strong>Selected configuration
              </div>
              <a
                className="pb-buy-link"
                href={buyInfo.url}
                target="_blank"
                rel="noopener sponsored"
                style={pbBrandColorStyle(buyInfo.color, buyInfo.text)}
              >
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

        <div className="rail-card">
          <div className="rail-head">Reading the Chart</div>
          <div className="rail-body">
            <div className="tip-text">
              <p>
                <strong>Coloured bands</strong> — the band below each curve grades the size of the jump between one gear and the
                next. The same step % appears between the gear cards below.
              </p>
              <div className="band-key">
                <div className="band-key-row">
                  <div className="band-key-swatch" style={{ background: '#12b05f' }} />
                  <span>under 10% — smooth, barely felt shift</span>
                </div>
                <div className="band-key-row">
                  <div className="band-key-swatch" style={{ background: '#ffcd00' }} />
                  <span>10–14% — noticeable step</span>
                </div>
                <div className="band-key-row">
                  <div className="band-key-swatch" style={{ background: '#ee1c28' }} />
                  <span>14% or more — big jump in cadence</span>
                </div>
              </div>
              <p style={{ marginTop: 10 }}>
                <strong>Development curve</strong> — each dot is one gear, plotted by how far the bike travels per crank
                revolution. The curve rises left to right: slowest gear on the left, fastest on the right.
              </p>
              <p>
                <strong>Two lines</strong> — the upper curve is your big ring, the lower is your small ring. Where they overlap in
                height is the speed range covered by both rings.
              </p>
              <p>
                <strong>× marks</strong> — cross-chain gears to avoid. Big ring with the two largest cogs, or small ring with the
                two smallest, angles the chain across the cassette and accelerates wear.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showReport && printData && <PrintReportModal data={printData} onClose={() => setShowReport(false)} />}
    </div>
  );
}

export default function GearCalculator() {
  return (
    <Suspense fallback={null}>
      <GearCalculatorInner />
    </Suspense>
  );
}
