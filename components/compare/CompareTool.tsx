'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import {
  SystemState,
  defaultSystemA,
  defaultSystemB,
  applySysDiscipline,
  applySysBrand,
  applySysGroupset,
  applySysCrIdx,
  applySysCassette,
  applySysWheel,
  applySysCustomWheel,
  computeSystemGears,
  groupsetOptionsFor,
} from '@/lib/compareCalcState';
import { readCmpState, writeCmpState, readSharedSetup } from '@/lib/sharedSetup';
import { pbLinkFor, pbBrandColorStyle, PB_VIVID_TEXT } from '@/lib/pbLinks';
import CompareChart, { CompareChartMode } from './CompareChart';
import CompareReportModal, { CompareReportData } from './CompareReportModal';

const DISCIPLINES: Discipline[] = ['road', 'mtb', 'gravel'];
const BRANDS: Brand[] = ['shimano', 'sram', 'campagnolo', 'custom'];
const ACCENT_MAP: Record<Brand, string> = { shimano: '#1a72e0', sram: '#ee1c28', campagnolo: '#ffcd00', custom: '#12b05f' };
const ACCENT_LIGHT_MAP: Record<Brand, string> = { shimano: '#7fb3f0', sram: '#ff7178', campagnolo: '#ffe066', custom: '#5fd39a' };
const BRAND_SHORT: Record<Exclude<Brand, 'custom'>, string> = { shimano: 'Shim', sram: 'SRAM', campagnolo: 'Camp' };

function toParamString(state: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in state) out[k] = String(state[k] ?? '');
  return out;
}

function ChainringGrid({ id, chainrings, active, onSelect }: { id: string; chainrings: { label: string }[]; active: number; onSelect: (i: number) => void }) {
  return (
    <div id={id} className="cr-grid">
      {chainrings.map((cr, i) => (
        <button key={i} className={`cr-btn${active === i ? ' active' : ''}`} onClick={() => onSelect(i)}>
          {cr.label}
        </button>
      ))}
    </div>
  );
}

function CompareToolInner() {
  const searchParams = useSearchParams();
  const [sysA, setSysA] = useState<SystemState>(defaultSystemA);
  const [sysB, setSysB] = useState<SystemState>(defaultSystemB);
  const [chartMode, setChartMode] = useState<CompareChartMode>('dev');
  const [cadence, setCadence] = useState(90);
  const [activePanel, setActivePanel] = useState<0 | 1 | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSvgHtml, setReportSvgHtml] = useState('');
  const [initDone, setInitDone] = useState(false);
  const chartWrapRef = useRef<HTMLDivElement>(null);

  // ── INIT ──
  useEffect(() => {
    const urlP = searchParams;
    let p: Record<string, string> = {};
    if (urlP.has('aG') || urlP.has('aD')) {
      urlP.forEach((v, k) => (p[k] = v));
    } else {
      p = toParamString(readCmpState());
      const sh = readSharedSetup();
      if (sh.g || sh.b === 'custom') {
        p.aD = (sh.d as string) || '';
        p.aB = (sh.b as string) || '';
        p.aG = (sh.g as string) || '';
        p.aC = String(sh.cr ?? '');
        p.aK = (sh.cs as string) || '';
        p.aW = (sh.w as string) || '';
        if (sh.b === 'custom' && sh.cust) {
          const cust = sh.cust as { ct?: string; big?: number; small?: number; cass?: string };
          p.aM = 'custom';
          p.aBi = String(cust.big ?? '');
          p.aSm = cust.ct === '1x' ? '' : String(cust.small ?? '');
          p.aCg = cust.cass || '';
        }
      }
      if (p.bM === 'custom' && !p.bCg) {
        p.bM = 'groupset';
        p.bG = '';
      }
      if (!p.bG && p.bM !== 'custom') {
        p.bD = p.bD || 'road';
        p.bB = p.bB || 'shimano';
        p.bG = 'Dura-Ace R9200';
      }
    }

    // System A
    let nextA = defaultSystemA();
    if (p.aL) nextA = { ...nextA, customLabel: p.aL };
    if (p.aBi) nextA = { ...nextA, customBig: p.aBi };
    if (p.aSm !== undefined && p.aSm !== null) nextA = { ...nextA, customSmall: p.aSm };
    if (p.aCg) nextA = { ...nextA, customCogs: p.aCg };

    nextA = applySysDiscipline(nextA, (['road', 'mtb', 'gravel'].includes(p.aD) ? p.aD : 'road') as Discipline);
    const aInitBrand: Brand = p.aM === 'custom' ? 'custom' : p.aB && DISC_BRANDS[nextA.discipline].includes(p.aB as Exclude<Brand, 'custom'>) ? (p.aB as Brand) : 'shimano';
    nextA = applySysBrand(nextA, aInitBrand);
    if (p.aWc && WHEELS[nextA.discipline].some((w) => String(w.circ) === p.aWc)) nextA = applySysCustomWheel(nextA, parseInt(p.aWc, 10));
    if (nextA.mode !== 'custom') {
      const brandData = DB[nextA.discipline][nextA.brand as Exclude<Brand, 'custom'>];
      if (p.aG && brandData && Object.prototype.hasOwnProperty.call(brandData, p.aG)) nextA = applySysGroupset(nextA, p.aG);
      if (p.aC) nextA = applySysCrIdx(nextA, parseInt(p.aC, 10) || 0);
      const data = nextA.groupset ? (brandData as Record<string, { cassettes: { label: string }[] }>)[nextA.groupset] : null;
      if (p.aK && data && data.cassettes.some((c) => c.label === p.aK)) nextA = applySysCassette(nextA, p.aK);
      if (p.aW && WHEELS[nextA.discipline].some((w) => String(w.circ) === p.aW)) nextA = applySysWheel(nextA, parseInt(p.aW, 10));
    }

    // System B
    let nextB = defaultSystemB();
    if (p.bL) nextB = { ...nextB, customLabel: p.bL };
    if (p.bBi) nextB = { ...nextB, customBig: p.bBi };
    if (p.bSm) nextB = { ...nextB, customSmall: p.bSm };
    if (p.bCg) nextB = { ...nextB, customCogs: p.bCg };

    nextB = applySysDiscipline(nextB, (['road', 'mtb', 'gravel'].includes(p.bD) ? p.bD : 'road') as Discipline);
    const bInitBrand: Brand = p.bM === 'custom' ? 'custom' : p.bB && DISC_BRANDS[nextB.discipline].includes(p.bB as Exclude<Brand, 'custom'>) ? (p.bB as Brand) : 'shimano';
    nextB = applySysBrand(nextB, bInitBrand);
    if (p.bWc && WHEELS[nextB.discipline].some((w) => String(w.circ) === p.bWc)) nextB = applySysCustomWheel(nextB, parseInt(p.bWc, 10));
    if (nextB.mode !== 'custom') {
      const brandDataB = DB[nextB.discipline][nextB.brand as Exclude<Brand, 'custom'>];
      const gsElOptions = brandDataB ? Object.keys(brandDataB).filter((k) => k !== '_eras') : [];
      const wantGs = p.bG && gsElOptions.includes(p.bG) ? p.bG : gsElOptions[0] || '';
      if (wantGs) nextB = applySysGroupset(nextB, wantGs);
      if (p.bC) nextB = applySysCrIdx(nextB, parseInt(p.bC, 10) || 0);
      const dataB = nextB.groupset ? (brandDataB as Record<string, { cassettes: { label: string }[] }>)[nextB.groupset] : null;
      if (p.bK && dataB && dataB.cassettes.some((c) => c.label === p.bK)) nextB = applySysCassette(nextB, p.bK);
      if (p.bW && WHEELS[nextB.discipline].some((w) => String(w.circ) === p.bW)) nextB = applySysWheel(nextB, parseInt(p.bW, 10));
    }

    setSysA(nextA);
    setSysB(nextB);
    setInitDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only System A drives the global --accent CSS vars.
  useEffect(() => {
    if (sysA.mode === 'custom') {
      document.documentElement.style.setProperty('--accent', '#12b05f');
      document.documentElement.style.setProperty('--accent-light', '#12b05f');
    } else {
      document.documentElement.style.setProperty('--accent', ACCENT_MAP[sysA.brand]);
      document.documentElement.style.setProperty('--accent-light', ACCENT_LIGHT_MAP[sysA.brand]);
    }
  }, [sysA.brand, sysA.mode]);

  const gearsA = useMemo(() => computeSystemGears(sysA), [sysA]);
  const gearsB = useMemo(() => computeSystemGears(sysB), [sysB]);

  // ── Save-back to cg_cmp + cg_shared (System A subset) + URL ──
  useEffect(() => {
    if (!initDone) return;
    const state = {
      aD: sysA.discipline, aB: sysA.brand, aM: sysA.mode, aG: sysA.groupset || '', aC: sysA.crIdx,
      aK: sysA.cassetteLabel, aW: String(sysA.wheelCirc),
      aL: sysA.customLabel, aBi: sysA.customBig, aSm: sysA.customSmall, aCg: sysA.customCogs,
      aCl: sysA.customColour, aWc: String(sysA.customWheelCirc),
      bD: sysB.discipline, bB: sysB.brand, bM: sysB.mode, bG: sysB.groupset || '', bC: sysB.crIdx,
      bK: sysB.cassetteLabel, bW: String(sysB.wheelCirc),
      bL: sysB.customLabel, bBi: sysB.customBig, bSm: sysB.customSmall, bCg: sysB.customCogs,
      bCl: sysB.customColour, bWc: String(sysB.customWheelCirc),
    };
    writeCmpState(state);
    try {
      window.history.replaceState(null, '', '?' + new URLSearchParams(toParamString(state)).toString());
    } catch {
      // ignore
    }
    try {
      const sh = readSharedSetup();
      const aSmallRaw = parseInt(sysA.customSmall, 10);
      writeCmpStateBridge(sh, sysA, aSmallRaw);
    } catch {
      // ignore
    }
  }, [sysA, sysB, initDone]);

  function updateSysA(updater: (s: SystemState) => SystemState) {
    setSysA(updater);
  }
  function updateSysB(updater: (s: SystemState) => SystemState) {
    setSysB(updater);
  }

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
          .replace(/fill="white"/g, 'fill="#334155"')
      : '';
    setReportSvgHtml(html);
    setShowReport(true);
  }

  function onChartModeChange(mode: CompareChartMode) {
    setChartMode(mode);
  }

  const groupsetGroupsA = useMemo(() => (sysA.mode === 'custom' ? [] : groupsetOptionsFor(sysA.discipline, sysA.brand as Exclude<Brand, 'custom'>)), [sysA.discipline, sysA.brand, sysA.mode]);
  const groupsetGroupsB = useMemo(() => (sysB.mode === 'custom' ? [] : groupsetOptionsFor(sysB.discipline, sysB.brand as Exclude<Brand, 'custom'>)), [sysB.discipline, sysB.brand, sysB.mode]);
  const dataA = useMemo(() => {
    if (sysA.mode === 'custom' || !sysA.groupset) return null;
    const bd = DB[sysA.discipline][sysA.brand as Exclude<Brand, 'custom'>];
    return bd ? (bd as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[sysA.groupset] : null;
  }, [sysA.discipline, sysA.brand, sysA.groupset, sysA.mode]);
  const dataB = useMemo(() => {
    if (sysB.mode === 'custom' || !sysB.groupset) return null;
    const bd = DB[sysB.discipline][sysB.brand as Exclude<Brand, 'custom'>];
    return bd ? (bd as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[sysB.groupset] : null;
  }, [sysB.discipline, sysB.brand, sysB.groupset, sysB.mode]);

  const bigColA = sysA.mode === 'custom' ? '#12b05f' : ACCENT_MAP[sysA.brand];
  const smlColA = sysA.mode === 'custom' ? '#5fd39a' : ACCENT_LIGHT_MAP[sysA.brand];

  const aName = sysA.mode === 'custom' ? sysA.customLabel || 'Custom' : sysA.groupset || 'System A';
  const bName = sysB.mode === 'custom' ? sysB.customLabel || 'Custom' : sysB.groupset || 'System B';

  const legAName = gearsA ? (gearsA.isSingle ? `A · ${aName} · ${gearsA.crOuter}T 1×` : `A · ${aName} · ${gearsA.crOuter}T big`) : 'System A';
  const legASmall = gearsA && !gearsA.isSingle ? `A · ${gearsA.crInner}T small` : '';
  const legBName = gearsB ? (gearsB.isSingle ? `B · ${bName} · ${gearsB.crOuter}T 1×` : `B · ${bName} · ${gearsB.crOuter}T big`) : 'System B';
  const legBSmall = gearsB && !gearsB.isSingle ? `B · ${gearsB.crInner}T small` : '';

  const stats = useMemo(() => {
    function calc(gears: typeof gearsA) {
      if (!gears) return { low: '—', hi: '—', step: '—' };
      const big = [...gears.bigG].reverse().filter((g) => !g.cross);
      if (!big.length) return { low: '—', hi: '—', step: '—' };
      const low = Math.min(...big.map((g) => g.dev)).toFixed(2);
      const hi = Math.max(...big.map((g) => g.dev)).toFixed(2);
      let step = '—';
      if (big.length >= 2) {
        let tot = 0;
        for (let i = 0; i < big.length - 1; i++) tot += ((big[i + 1].dev - big[i].dev) / big[i].dev) * 100;
        step = (tot / (big.length - 1)).toFixed(1);
      }
      return { low, hi, step };
    }
    return { a: calc(gearsA), b: calc(gearsB) };
  }, [gearsA, gearsB]);

  const buyInfo = useMemo(() => {
    if (!gearsA) return null;
    if (sysA.mode === 'custom') {
      return { label: `${gearsA.crLabel} · ${gearsA.cassLabel}`, url: '', exact: false, color: ACCENT_MAP.custom, text: PB_VIVID_TEXT.custom, custom: true };
    }
    if (!sysA.groupset) return null;
    const clean = sysA.groupset.replace(/\s*\([^)]+\)\s*/g, '').trim();
    const pb = pbLinkFor(sysA.discipline, sysA.brand, sysA.groupset);
    return { label: `${clean} · ${gearsA.crLabel} · ${gearsA.cassLabel}`, url: pb.url, exact: pb.exact, color: ACCENT_MAP[sysA.brand], text: PB_VIVID_TEXT[sysA.brand], custom: false };
  }, [gearsA, sysA.mode, sysA.brand, sysA.discipline, sysA.groupset]);

  const chartTitle = chartMode === 'spd' ? 'Speed Comparison' : chartMode === 'in' ? 'Gear Inches Comparison' : 'Development Comparison';
  const chartSub = chartMode === 'spd' ? 'km/h at selected cadence · hover dots for development' : chartMode === 'in' ? 'Gear inches per gear · hover dots for details' : 'Metres per revolution · hover dots for details';

  const printData: CompareReportData | null = gearsA
    ? {
        a: gearsA,
        b: gearsB,
        wheelLabelA: WHEELS[sysA.discipline].find((w) => w.circ === sysA.wheelCirc)?.label || '',
        wheelLabelB: WHEELS[sysB.discipline].find((w) => w.circ === sysB.wheelCirc)?.label || '',
        svgHtml: reportSvgHtml,
      }
    : null;

  function renderPanel(which: 'A' | 'B') {
    const state = which === 'A' ? sysA : sysB;
    const setState = which === 'A' ? updateSysA : updateSysB;
    const groupsetGroups = which === 'A' ? groupsetGroupsA : groupsetGroupsB;
    const currentData = which === 'A' ? dataA : dataB;
    const idPrefix = which === 'A' ? 'a' : 'b';
    const visibleBrands = state.mode === 'custom' ? BRANDS : BRANDS.filter((b) => b === 'custom' || DISC_BRANDS[state.discipline].includes(b as Exclude<Brand, 'custom'>));

    return (
      <div className={`input-panel glass panel-${idPrefix}`} style={activePanel === null ? undefined : { display: (which === 'A' ? activePanel === 0 : activePanel === 1) ? 'block' : 'none' }}>
        <div className="panel-head">
          <span className={`sys-badge badge-${idPrefix}`}>{which}</span> System {which}
        </div>
        <div id={`disc-tabs-${idPrefix}`} className="disc-tabs" style={{ opacity: state.mode === 'custom' ? 0.4 : undefined }}>
          {DISCIPLINES.map((d) => (
            <button key={d} className={`disc-tab${state.discipline === d ? ' active' : ''}`} onClick={() => setState((s) => applySysDiscipline(s, d))}>
              {d === 'road' ? 'Road' : d === 'mtb' ? 'MTB' : 'Gravel'}
            </button>
          ))}
        </div>
        <div id={`brand-tabs-${idPrefix}`} className="brand-tabs brand-tabs-4">
          {BRANDS.map((b) => (
            <button
              key={b}
              className={`brand-tab${state.brand === b ? ' active' : ''}`}
              data-brand={b}
              style={{ display: visibleBrands.includes(b) ? '' : 'none' }}
              onClick={() => setState((s) => applySysBrand(s, b))}
            >
              {b === 'custom' ? 'Custom' : BRAND_SHORT[b]}
            </button>
          ))}
        </div>

        {state.mode !== 'custom' ? (
          <div className="form-body">
            <div className="form-group">
              <label>Groupset</label>
              <select value={state.groupset || ''} onChange={(e) => setState((s) => applySysGroupset(s, e.target.value))}>
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
              <label>Chainring</label>
              <ChainringGrid id={`cr-grid-${idPrefix}`} chainrings={currentData?.chainrings || []} active={state.crIdx} onSelect={(i) => setState((s) => applySysCrIdx(s, i))} />
            </div>
            <div className="form-group">
              <label>Cassette</label>
              <select value={state.cassetteLabel} onChange={(e) => setState((s) => applySysCassette(s, e.target.value))}>
                {currentData?.cassettes.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Wheel &amp; Tyre</label>
              <select value={state.wheelCirc} onChange={(e) => setState((s) => applySysWheel(s, parseInt(e.target.value, 10)))}>
                {WHEELS[state.discipline].map((w) => (
                  <option key={w.circ} value={w.circ}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-body">
            <div className="form-group">
              <label>Label</label>
              <input type="text" value={state.customLabel} onChange={(e) => setState((s) => ({ ...s, customLabel: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Big Ring (teeth)</label>
              <input type="number" min={20} max={62} value={state.customBig} onChange={(e) => setState((s) => ({ ...s, customBig: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Small Ring (blank for 1×)</label>
              <input type="number" min={20} max={50} value={state.customSmall} onChange={(e) => setState((s) => ({ ...s, customSmall: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Cassette Cogs (comma-separated)</label>
              <input type="text" value={state.customCogs} onChange={(e) => setState((s) => ({ ...s, customCogs: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Wheel &amp; Tyre</label>
              <select value={state.customWheelCirc} onChange={(e) => setState((s) => applySysCustomWheel(s, parseInt(e.target.value, 10)))}>
                {WHEELS[state.discipline].map((w) => (
                  <option key={w.circ} value={w.circ}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {which === 'A' && buyInfo && (
          <div className="glass" id="buy-card" style={{ marginTop: 16, borderRadius: 16 }}>
            <div className="panel-head">Buy These Components</div>
            <div className="form-body">
              <img className="pb-logo-chip" src="/pb-logo.png" alt="Performance Bicycle" />
              <div className="buy-label">
                <strong>{buyInfo.label}</strong>Selected configuration
              </div>
              <a
                className="pb-buy-link"
                href={buyInfo.custom ? '#' : buyInfo.url}
                target="_blank"
                rel="noopener sponsored"
                style={pbBrandColorStyle(buyInfo.color, buyInfo.text)}
              >
                <span className="pb-text">
                  {buyInfo.custom ? 'Shop groupsets' : buyInfo.exact ? 'Shop this groupset' : 'Browse similar groupsets'}
                  <small>{buyInfo.custom || buyInfo.exact ? 'Opens in a new tab' : 'Exact model not stocked — opens in a new tab'}</small>
                </span>
                <span className="pb-arrow">→</span>
              </a>
              <p className="pb-note">Affiliate link — I may earn a small commission at no extra cost to you.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="compare-grid">
      <div className="panels-row">
        {renderPanel('A')}
        {renderPanel('B')}
      </div>

      <div className="panel-tabs">
        <button className={`panel-tab-btn${activePanel !== 1 ? ' active' : ''}`} onClick={() => setActivePanel(0)}>
          ⬤ System A
        </button>
        <button className={`panel-tab-btn${activePanel === 1 ? ' active' : ''}`} onClick={() => setActivePanel(1)}>
          System B ›
        </button>
      </div>

      <div className="chart-col">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">{chartTitle}</div>
              <div className="chart-sub">{chartSub}</div>
            </div>
            <div className="chart-controls">
              <div className="chart-mode-toggle">
                <button className={`chart-mode-btn${chartMode === 'dev' ? ' active' : ''}`} onClick={() => onChartModeChange('dev')}>
                  m/rev
                </button>
                <button className={`chart-mode-btn${chartMode === 'spd' ? ' active' : ''}`} onClick={() => onChartModeChange('spd')}>
                  Speed
                </button>
                <button className={`chart-mode-btn${chartMode === 'in' ? ' active' : ''}`} onClick={() => onChartModeChange('in')}>
                  Gear in.
                </button>
              </div>
              {chartMode === 'spd' && (
                <div className="cadence-ctrl">
                  <label htmlFor="chart-cadence">Cadence</label>
                  <input id="chart-cadence" type="number" min={40} max={140} step={5} value={cadence} onChange={(e) => setCadence(parseInt(e.target.value, 10) || 90)} />
                  <span>rpm</span>
                </div>
              )}
              <div className="chart-legend">
                <div className="cl-item">
                  <div className="cl-line" style={{ background: bigColA }} />
                  <span>{legAName}</span>
                </div>
                <div className="cl-item">
                  <div className="cl-line" style={{ background: smlColA }} />
                  <span>{legASmall}</span>
                </div>
                <div className="cl-item">
                  <div className="cl-line-dash" style={{ borderColor: '#ffffff' }} />
                  <span>{legBName}</span>
                </div>
                <div className="cl-item">
                  <div className="cl-line-dash" style={{ borderColor: '#e5e9ee' }} />
                  <span>{legBSmall}</span>
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
            {gearsA ? (
              <CompareChart a={gearsA} b={gearsB} chartMode={chartMode} cadence={cadence} bigColA={bigColA} smlColA={smlColA} aName={aName} bName={bName} />
            ) : (
              <div className="chart-wrap">
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
              </div>
            )}
          </div>
        </div>

        <div className="gap-legend">
          <span className="gap-legend-label">Gap strip</span>
          <div className="gap-swatch" style={{ background: '#12b05f' }} />
          <span className="gap-text">&lt;4% — close match</span>
          <div className="gap-swatch" style={{ background: '#ffcd00' }} />
          <span className="gap-text">4–9%</span>
          <div className="gap-swatch" style={{ background: '#ff7a00' }} />
          <span className="gap-text">9–15%</span>
          <div className="gap-swatch" style={{ background: '#ee1c28' }} />
          <span className="gap-text">&gt;15% — wide gap</span>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Lowest Gear (Big Ring)</div>
            <div className="stat-ab">
              <span className="stat-a">{stats.a.low}</span>
              <span className="stat-sep">/</span>
              <span className="stat-b">{stats.b.low}</span>
              <span className="stat-u">m/rev</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Highest Gear (Big Ring)</div>
            <div className="stat-ab">
              <span className="stat-a">{stats.a.hi}</span>
              <span className="stat-sep">/</span>
              <span className="stat-b">{stats.b.hi}</span>
              <span className="stat-u">m/rev</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Step (Big Ring)</div>
            <div className="stat-ab">
              <span className="stat-a">{stats.a.step}</span>
              <span className="stat-sep">/</span>
              <span className="stat-b">{stats.b.step}</span>
              <span className="stat-u">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-tooltip" />

      {showReport && printData && <CompareReportModal data={printData} onClose={() => setShowReport(false)} />}
    </div>
  );
}

// Mirrors saveState()'s cg_shared bridge — writes System A's subset only.
function writeCmpStateBridge(sh: Record<string, unknown>, sysA: SystemState, aSmallRaw: number) {
  const merged = {
    ...sh,
    d: sysA.discipline,
    b: sysA.brand,
    g: sysA.groupset || '',
    cr: sysA.crIdx,
    cs: sysA.cassetteLabel,
    w: String(sysA.wheelCirc),
    cust: {
      ct: isNaN(aSmallRaw) ? '1x' : '2x',
      big: parseInt(sysA.customBig, 10) || 50,
      small: isNaN(aSmallRaw) ? 34 : aSmallRaw,
      cass: sysA.customCogs,
    },
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cg_shared', JSON.stringify(merged));
    } catch {
      // ignore
    }
  }
}

export default function CompareTool() {
  return (
    <Suspense fallback={null}>
      <CompareToolInner />
    </Suspense>
  );
}
