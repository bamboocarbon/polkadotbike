'use client';

/**
 * The Climb Planner's "Configure" input panel, extracted verbatim from
 * ClimbPlanner.tsx so it can be reused outside the full Climb Planner page
 * (currently: the 3D climb debug tool's Setup tab) without duplicating the
 * form. Pure function of S/setS — no URL sync, no cg_shared writeback, no
 * results/chart/rail — those stay in ClimbPlanner.tsx, which still owns the
 * ClimbCalcState and everything derived from it beyond this form.
 *
 * `showClimbFields` (default true) hides the Road Gradient + Climb Distance
 * fields when gradient is being driven by something else instead (the 3D
 * debug tool derives it live from the travel-along-route position, so a
 * manual gradient slider there would be dead/confusing UI).
 */
import { useEffect, useMemo, useState } from 'react';
import { DB, DISC_BRANDS, WHEELS, Discipline, Brand } from '@/lib/gearDb';
import {
  ClimbCalcState,
  WeightUnit,
  DistUnit,
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
} from '@/lib/climbCalcState';
import { kgToLbs, lbsToKg, kmToMi, miToKm } from '@/lib/units';

const DISCIPLINES: Discipline[] = ['road', 'mtb', 'gravel'];
const BRANDS: Brand[] = ['shimano', 'sram', 'campagnolo', 'custom'];
const CRANK_LENGTHS = [155, 157.5, 160, 162.5, 165, 167.5, 170, 172.5, 175];
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

export default function ClimbConfigPanel({
  S,
  setS,
  showClimbFields = true,
}: {
  S: ClimbCalcState;
  setS: React.Dispatch<React.SetStateAction<ClimbCalcState>>;
  showClimbFields?: boolean;
}) {
  const custTeeth = useMemo(() => (S.brand === 'custom' ? parseCustomCassette(S.cust.cassetteText) : null), [S.brand, S.cust.cassetteText]);

  const currentGroupsetData = useMemo(() => {
    if (S.brand === 'custom' || !S.groupset) return null;
    const brandData = DB[S.discipline][S.brand as Exclude<Brand, 'custom'>];
    return brandData
      ? (brandData as Record<string, { chainrings: { label: string; outer: number; inner: number | null }[]; cassettes: { label: string; teeth: number[] }[] }>)[S.groupset]
      : null;
  }, [S.discipline, S.brand, S.groupset]);

  const groupsetGroups = useMemo(
    () => (S.brand === 'custom' ? [] : groupsetOptionsFor(S.discipline, S.brand as Exclude<Brand, 'custom'>)),
    [S.discipline, S.brand]
  );

  const custHint = useMemo(() => {
    if (S.brand !== 'custom') return null;
    if (!custTeeth) return { cls: 'err', text: 'Enter at least 2 cog sizes, e.g. 11,13,15,17,19,22,25,28' };
    return { cls: 'ok', text: `${custTeeth.length} sprocket${custTeeth.length > 1 ? 's' : ''} · ${custTeeth[0]}–${custTeeth[custTeeth.length - 1]}T` };
  }, [S.brand, custTeeth]);

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

  return (
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

        {showClimbFields && (
          <>
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
          </>
        )}

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
  );
}
