'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import {
  ClimbCalcState,
  WeightUnit,
  DistUnit,
  defaultClimbState,
  applyDiscipline,
  applyBrand,
  applyGroupset,
  applyCrIdx,
  applyCassette,
  applyWheel,
  applyCrankLen,
  applyCadence,
  applyPower,
  applyCda,
  applyCrr,
  applyGradient,
  applyCrankMode,
  applyCustAdjust,
  applyCustCassetteText,
  parseCustomCassette,
  groupsetOptionsFor,
  CUST_LIMITS,
  ACCENT_MAP,
} from '@/lib/climbCalcState';
import { calcPower } from '@/lib/climbPhysics';
import { kgToLbs, lbsToKg, kmToMi, miToKm } from '@/lib/units';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import { pbLinkFor, pbBrandColorStyle, PB_VIVID_TEXT, PB_GENERIC_LINK } from '@/lib/pbLinks';
import ClimbChart, { ClimbGearPoint } from './ClimbChart';
import AchievabilityCards from './AchievabilityCards';
import PrintReportModal, { ClimbPrintReportData } from './PrintReportModal';

const DISCIPLINES: Discipline[] = ['road', 'mtb', 'gravel'];
const BRANDS: Brand[] = ['shimano', 'sram', 'campagnolo', 'custom'];
const CRANK_LENGTHS = [155, 157.5, 160, 162.5, 165, 167.5, 170, 172.5, 175];
const REF_CRANK = 172.5;
const POSITIONS = [
  { cda: 0.45, label: 'Upright' },
  { cda: 0.36, label: 'Hoods' },
  { cda: 0.32, label: 'Drops' },
  { cda: 0.22, label: 'TT' },
];
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

function NumberField({
  value,
  unit,
  onCommit,
  step = 1,
}: {
  value: string;
  unit: string;
  onCommit: (raw: string) => void;
  step?: number;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <div className="big-val-wrap">
      <input
        className="big-val-input"
        type="number"
        step={step}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onCommit(local)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
      <span className="big-val-unit">{unit}</span>
    </div>
  );
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
    const urlP = searchParams;
    const sh = readSharedSetup();
    let next = defaultClimbState();

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

    const pwVal = urlP.get('pw') || (sh.pw as string);
    if (pwVal) next = applyPower(next, parseInt(pwVal, 10) || next.power);

    const savedWUnit = (urlP.get('wunit') || (sh.wunit as string)) as WeightUnit | undefined;
    const weightUnit: WeightUnit = savedWUnit === 'kg' || savedWUnit === 'lbs' ? savedWUnit : next.weightUnit;

    const rawBody = urlP.get('bwt') || (sh.bwt as string) || (sh.wt as string);
    const rawBike = urlP.get('bkw') || (sh.bkw as string);
    let bodyK = 70, bikeK = 8;
    if (rawBody) bodyK = Math.min(130, Math.max(40, parseFloat(rawBody)));
    if (rawBike) bikeK = Math.min(16, Math.max(4, parseFloat(rawBike)));
    next = {
      ...next,
      weightUnit,
      bodyRaw: weightUnit === 'lbs' ? +kgToLbs(bodyK).toFixed(1) : +bodyK.toFixed(1),
      bikeRaw: weightUnit === 'lbs' ? +kgToLbs(bikeK).toFixed(1) : +bikeK.toFixed(1),
    };

    const grVal = urlP.get('gr') || (sh.gr as string);
    if (grVal) next = applyGradient(next, parseFloat(grVal));

    const cdaVal = urlP.get('cda') || (sh.cda as string);
    if (cdaVal) next = applyCda(next, parseFloat(cdaVal));

    const crrVal = urlP.get('crr') || (sh.crr as string);
    if (crrVal) next = applyCrr(next, parseFloat(crrVal));

    const ckVal = urlP.get('ck') || (sh.ck as string);
    if (ckVal) next = applyCrankLen(next, parseFloat(ckVal));

    const dstVal = urlP.get('dst') || (sh.dst as string);
    if (dstVal) {
      const km = Math.min(30, Math.max(1, parseFloat(dstVal)));
      next = { ...next, distUnit: 'km', distRaw: km };
    }

    setS(next);
    setInitDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT_MAP[S.brand]);
    document.documentElement.style.setProperty('--accent-light', ACCENT_MAP[S.brand]);
  }, [S.brand]);

  const bodyKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bodyRaw) : S.bodyRaw;
  const bikeKgVal = S.weightUnit === 'lbs' ? lbsToKg(S.bikeRaw) : S.bikeRaw;
  const mass = bodyKgVal + bikeKgVal;
  const climbDistKm = S.distUnit === 'mi' ? miToKm(S.distRaw) : S.distRaw;

  const custTeeth = useMemo(() => (S.brand === 'custom' ? parseCustomCassette(S.cust.cassetteText) : null), [S.brand, S.cust.cassetteText]);

  const currentGroupsetData = useMemo(() => {
    if (S.brand === 'custom' || !S.groupset) return null;
    const brandData = DB[S.discipline][S.brand as Exclude<Brand, 'custom'>];
    return brandData
      ? (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[S.groupset]
      : null;
  }, [S.discipline, S.brand, S.groupset]);

  const calc = useMemo(() => {
    let outer: number, inner: number | null, teeth: number[], crLabelText: string, csLabelText: string;
    if (S.brand === 'custom') {
      if (!custTeeth) return null;
      outer = S.cust.big;
      inner = S.cust.crankType === '2x' ? S.cust.small : null;
      teeth = custTeeth;
      crLabelText = inner ? `${outer}/${inner}` : `${outer}T Single Ring`;
      csLabelText = `${teeth[0]}-${teeth[teeth.length - 1]}T`;
    } else {
      if (!S.groupset || !currentGroupsetData) return null;
      const cr = currentGroupsetData.chainrings[S.crIdx];
      const cass = currentGroupsetData.cassettes.find((c) => c.label === S.cassetteLabel);
      if (!cr || !cass) return null;
      outer = cr.outer;
      inner = cr.inner;
      teeth = cass.teeth;
      crLabelText = cr.label;
      csLabelText = cass.label;
    }

    const isSingle = !inner;
    const n = teeth.length;
    const CC = 2;
    function isCross(ring: 'outer' | 'inner', i: number) {
      if (isSingle) return false;
      return (ring === 'outer' && i >= n - CC) || (ring === 'inner' && i < CC);
    }
    function spd(ring: number, cog: number) {
      return (ring / cog) * (S.wheelCirc / 1000) * S.cadence * 60 / 1000;
    }
    function pwr(speedKmh: number) {
      return calcPower(speedKmh, mass, S.gradient, S.cda, S.crr);
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
  }, [S, custTeeth, currentGroupsetData, mass]);

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
  }, [S, initDone, mass, bodyKgVal, bikeKgVal, climbDistKm]);

  const groupsetGroups = useMemo(
    () => (S.brand === 'custom' ? [] : groupsetOptionsFor(S.discipline, S.brand as Exclude<Brand, 'custom'>)),
    [S.discipline, S.brand]
  );

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
  function setCrankMode(mode: '1x' | '2x') {
    setS((prev) => applyCrankMode(prev, mode));
  }
  function adjCust(key: 'big' | 'small', delta: number) {
    setS((prev) => applyCustAdjust(prev, key, delta));
  }

  function commitWeight(which: 'body' | 'bike', raw: string) {
    let v = parseFloat(raw);
    const [min, max] = which === 'body' ? (S.weightUnit === 'lbs' ? [88, 287] : [40, 130]) : S.weightUnit === 'lbs' ? [8.8, 35] : [4, 16];
    const step = S.weightUnit === 'lbs' ? 0.2 : 0.1;
    if (isNaN(v)) return;
    v = Math.min(max, Math.max(min, v));
    v = Math.round(v / step) * step;
    setS((prev) => (which === 'body' ? { ...prev, bodyRaw: v } : { ...prev, bikeRaw: v }));
  }

  function setWeightUnit(u: WeightUnit) {
    setS((prev) => {
      const bKg = prev.weightUnit === 'lbs' ? lbsToKg(prev.bodyRaw) : prev.bodyRaw;
      const kKg = prev.weightUnit === 'lbs' ? lbsToKg(prev.bikeRaw) : prev.bikeRaw;
      return {
        ...prev,
        weightUnit: u,
        bodyRaw: +(u === 'lbs' ? kgToLbs(bKg) : bKg).toFixed(1),
        bikeRaw: +(u === 'lbs' ? kgToLbs(kKg) : kKg).toFixed(1),
      };
    });
  }

  function commitGradient(raw: string) {
    let v = parseFloat(raw);
    if (isNaN(v)) return;
    v = Math.min(20, Math.max(-5, v));
    v = Math.round(v / 0.1) * 0.1;
    setS((prev) => applyGradient(prev, +v.toFixed(1)));
  }

  function commitDist(raw: string) {
    let v = parseFloat(raw);
    if (isNaN(v)) return;
    const [min, max] = S.distUnit === 'mi' ? [0.5, 19] : [1, 30];
    v = Math.min(max, Math.max(min, v));
    v = Math.round(v / 0.1) * 0.1;
    setS((prev) => ({ ...prev, distRaw: +v.toFixed(1) }));
  }

  function setDistUnit(u: DistUnit) {
    setS((prev) => {
      const km = prev.distUnit === 'mi' ? miToKm(prev.distRaw) : prev.distRaw;
      if (u === 'mi') {
        return { ...prev, distUnit: u, distRaw: Math.min(19, Math.max(0.5, +kmToMi(km).toFixed(1))) };
      }
      return { ...prev, distUnit: u, distRaw: Math.min(30, Math.max(1, +km.toFixed(1))) };
    });
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
      : '';
    setReportSvgHtml(html);
    setShowReport(true);
  }

  const custHint = useMemo(() => {
    if (S.brand !== 'custom') return null;
    if (!custTeeth) return { cls: 'err', text: 'Enter at least 2 cog sizes, e.g. 11,13,15,17,19,22,25,28' };
    return { cls: 'ok', text: `${custTeeth.length} sprocket${custTeeth.length > 1 ? 's' : ''} · ${custTeeth[0]}–${custTeeth[custTeeth.length - 1]}T` };
  }, [S.brand, custTeeth]);

  const buyInfo = useMemo(() => {
    if (!calc) return null;
    if (S.brand === 'custom') {
      return { label: `${calc.crLabelText} · ${calc.csLabelText}`, url: PB_GENERIC_LINK, exact: false, color: ACCENT_MAP.custom, text: PB_VIVID_TEXT.custom };
    }
    if (!S.groupset) return null;
    const cleanGroupset = S.groupset.replace(/\s*\([^)]+\)\s*/g, '').trim();
    const pb = pbLinkFor(S.discipline, S.brand, S.groupset);
    return { label: `${cleanGroupset} · ${calc.crLabelText} · ${calc.csLabelText}`, url: pb.url, exact: pb.exact, color: ACCENT_MAP[S.brand], text: PB_VIVID_TEXT[S.brand] };
  }, [calc, S.brand, S.discipline, S.groupset]);

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
      <div className="input-panel glass">
        <div className="panel-head">Configure</div>
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
              <button key={b} className={`brand-tab${S.brand === b ? ' active' : ''}`} data-brand={b} style={{ display: visible ? '' : 'none' }} onClick={() => selectBrand(b)}>
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
                <label>Chainring</label>
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
                  onChange={(e) => setS((prev) => applyCustCassetteText(prev, e.target.value))}
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
            <label>Crank Length</label>
            <select value={S.crankLen} onChange={(e) => setS((prev) => applyCrankLen(prev, parseFloat(e.target.value)))}>
              {CRANK_LENGTHS.map((c) => (
                <option key={c} value={c}>
                  {c} mm
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Cadence</label>
              <div className="big-val">
                {S.cadence}
                <span>rpm</span>
              </div>
            </div>
            <input type="range" min={60} max={120} value={S.cadence} onChange={(e) => setS((prev) => applyCadence(prev, parseInt(e.target.value, 10)))} />
            <div className="range-labels">
              <span>60</span>
              <span>120 rpm</span>
            </div>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Your Power</label>
              <div className="big-val">
                {S.power}
                <span>W</span>
              </div>
            </div>
            <input type="range" min={60} max={600} step={5} value={S.power} onChange={(e) => setS((prev) => applyPower(prev, parseInt(e.target.value, 10)))} />
            <div className="range-labels">
              <span>60 W</span>
              <span>600 W</span>
            </div>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Weight Units</label>
              <div className="wt-unit-toggle">
                <button className={`wt-unit-btn${S.weightUnit === 'kg' ? ' active' : ''}`} onClick={() => setWeightUnit('kg')}>
                  kg
                </button>
                <button className={`wt-unit-btn${S.weightUnit === 'lbs' ? ' active' : ''}`} onClick={() => setWeightUnit('lbs')}>
                  lbs
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Body Weight</label>
              <NumberField value={S.bodyRaw.toFixed(1)} unit={S.weightUnit} onCommit={(raw) => commitWeight('body', raw)} step={S.weightUnit === 'lbs' ? 0.2 : 0.1} />
            </div>
            <input
              type="range"
              min={S.weightUnit === 'lbs' ? 88 : 40}
              max={S.weightUnit === 'lbs' ? 287 : 130}
              step={S.weightUnit === 'lbs' ? 0.2 : 0.1}
              value={S.bodyRaw}
              onChange={(e) => setS((prev) => ({ ...prev, bodyRaw: parseFloat(e.target.value) }))}
            />
            <div className="range-labels">
              <span>{S.weightUnit === 'lbs' ? '88 lbs' : '40 kg'}</span>
              <span>{S.weightUnit === 'lbs' ? '287 lbs' : '130 kg'}</span>
            </div>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Bike Weight</label>
              <NumberField value={S.bikeRaw.toFixed(1)} unit={S.weightUnit} onCommit={(raw) => commitWeight('bike', raw)} step={S.weightUnit === 'lbs' ? 0.2 : 0.1} />
            </div>
            <input
              type="range"
              min={S.weightUnit === 'lbs' ? 8.8 : 4}
              max={S.weightUnit === 'lbs' ? 35 : 16}
              step={S.weightUnit === 'lbs' ? 0.2 : 0.1}
              value={S.bikeRaw}
              onChange={(e) => setS((prev) => ({ ...prev, bikeRaw: parseFloat(e.target.value) }))}
            />
            <div className="range-labels">
              <span>{S.weightUnit === 'lbs' ? '9 lbs' : '4 kg'}</span>
              <span>{S.weightUnit === 'lbs' ? '35 lbs' : '16 kg'}</span>
            </div>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Road Gradient</label>
              <NumberField value={S.gradient.toFixed(1)} unit="%" onCommit={commitGradient} step={0.1} />
            </div>
            <input type="range" min={-5} max={20} step={0.1} value={S.gradient} onChange={(e) => setS((prev) => applyGradient(prev, parseFloat(e.target.value)))} />
            <div className="range-labels">
              <span>-5%</span>
              <span>+20%</span>
            </div>
          </div>

          <div className="form-group">
            <div className="row-between">
              <label>Climb Distance</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="dst-unit-toggle">
                  <button className={`dst-unit-btn${S.distUnit === 'km' ? ' active' : ''}`} onClick={() => setDistUnit('km')}>
                    km
                  </button>
                  <button className={`dst-unit-btn${S.distUnit === 'mi' ? ' active' : ''}`} onClick={() => setDistUnit('mi')}>
                    mi
                  </button>
                </div>
                <NumberField value={S.distRaw.toFixed(1)} unit={S.distUnit} onCommit={commitDist} step={0.1} />
              </div>
            </div>
            <input
              type="range"
              min={S.distUnit === 'mi' ? 0.5 : 1}
              max={S.distUnit === 'mi' ? 19 : 30}
              step={0.1}
              value={S.distRaw}
              onChange={(e) => setS((prev) => ({ ...prev, distRaw: parseFloat(e.target.value) }))}
            />
            <div className="range-labels">
              <span>{S.distUnit === 'mi' ? '0.5 mi' : '1 km'}</span>
              <span>{S.distUnit === 'mi' ? '19 mi' : '30 km'}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Riding Position (CdA)</label>
            <div className="pos-tabs">
              {POSITIONS.map((p) => (
                <button key={p.cda} className={`pos-btn${S.cda === p.cda ? ' active' : ''}`} onClick={() => setS((prev) => applyCda(prev, p.cda))}>
                  {p.label}
                  <span className="pos-cda">{p.cda}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Surface (Crr)</label>
            <div className="pos-tabs">
              {SURFACES.map((s) => (
                <button key={s.crr} className={`pos-btn${S.crr === s.crr ? ' active' : ''}`} onClick={() => setS((prev) => applyCrr(prev, s.crr))}>
                  {s.label}
                  <span className="pos-cda">{s.crr}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
