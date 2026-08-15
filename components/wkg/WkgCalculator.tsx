'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FTPChart from './FTPChart';
import { readSharedSetup, writeSharedSetup } from '@/lib/sharedSetup';
import {
  CATS, LBS, toKg, fromKg, fmtWt, unitLabel, getAgeFactor, getCat,
  type Gender, type WeightUnit,
} from '@/lib/wkg';

const KG_RANGE = { weight: { min: 40, max: 130, step: 0.1, labels: ['40 kg', '130 kg'] }, bike: { min: 4, max: 16, step: 0.1, labels: ['4 kg', '16 kg'] } };
const LBS_RANGE = { weight: { min: 88, max: 287, step: 0.2, labels: ['88 lbs', '287 lbs'] }, bike: { min: 8.8, max: 35, step: 0.2, labels: ['9 lbs', '35 lbs'] } };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function WkgCalculatorInner() {
  const searchParams = useSearchParams();

  const [gender, setGender] = useState<Gender>('male');
  const [unit, setUnitState] = useState<WeightUnit>('kg');
  const [age, setAge] = useState(35);
  const [ftp, setFtp] = useState(200);
  // Raw slider/input values in the CURRENTLY ACTIVE unit — mirrors the
  // source keeping weight-slider.value/bike-slider.value in whichever unit
  // is displayed, converting via toKg() only where needed, rather than
  // this component owning a single kg value and converting for display on
  // every render (functionally equivalent, but matching the source's own
  // state shape avoids any subtle rounding drift between the two models).
  const [bodyRaw, setBodyRaw] = useState(70);
  const [bikeRaw, setBikeRaw] = useState(8);
  const [bodyInputText, setBodyInputText] = useState('70.0');
  const [bikeInputText, setBikeInputText] = useState('8.0');

  const range = unit === 'lbs' ? LBS_RANGE : KG_RANGE;

  // Client-only init: read cg_shared (clamped) then let ?pw=/?wt= override,
  // exactly matching the source's own init() order. Runs post-mount, so —
  // same as the race pages' tri-state stage default — there's a brief
  // flash from the SSR-safe defaults above to the restored values; that's
  // the accepted tradeoff already established elsewhere in this migration,
  // not something to try to hide.
  useEffect(() => {
    let initFtp = 200, initBodyKg = 70, initBikeKg = 8;
    let initGender: Gender = 'male', initUnit: WeightUnit = 'kg', initAge = 35;

    const sh = readSharedSetup();
    if (sh.pw) initFtp = clamp(parseFloat(String(sh.pw)), 60, 500);
    const rawBody = sh.bwt ?? sh.wt;
    if (rawBody) initBodyKg = clamp(parseFloat(String(rawBody)), 40, 130);
    if (sh.bkw) initBikeKg = clamp(parseFloat(String(sh.bkw)), 4, 16);
    if (sh.gender === 'male' || sh.gender === 'female') initGender = sh.gender;
    if (sh.wunit === 'kg' || sh.wunit === 'lbs') initUnit = sh.wunit;
    if (sh.age) initAge = clamp(parseInt(String(sh.age), 10), 18, 80);

    const pwParam = searchParams.get('pw');
    const wtParam = searchParams.get('wt');
    if (pwParam) initFtp = clamp(parseFloat(pwParam), 60, 500);
    if (wtParam) initBodyKg = clamp(parseFloat(wtParam), 40, 130);

    setGender(initGender);
    setUnitState(initUnit);
    setAge(initAge);
    setFtp(initFtp);
    const bRaw = +fromKg(initBodyKg, initUnit).toFixed(1);
    const kRaw = +fromKg(initBikeKg, initUnit).toFixed(1);
    setBodyRaw(bRaw);
    setBikeRaw(kRaw);
    setBodyInputText(bRaw.toFixed(1));
    setBikeInputText(kRaw.toFixed(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSetUnit(newUnit: WeightUnit) {
    const bodyKg = toKg(bodyRaw, unit);
    const bikeKg = toKg(bikeRaw, unit);
    setUnitState(newUnit);
    const bRaw = +fromKg(bodyKg, newUnit).toFixed(1);
    const kRaw = +fromKg(bikeKg, newUnit).toFixed(1);
    setBodyRaw(bRaw);
    setBikeRaw(kRaw);
    setBodyInputText(bRaw.toFixed(1));
    setBikeInputText(kRaw.toFixed(1));
  }

  function handleWeightSlider(which: 'weight' | 'bike', v: number) {
    if (which === 'weight') { setBodyRaw(v); setBodyInputText(v.toFixed(1)); }
    else { setBikeRaw(v); setBikeInputText(v.toFixed(1)); }
  }

  function handleWeightInputChange(which: 'weight' | 'bike', text: string) {
    const r = which === 'weight' ? range.weight : range.bike;
    let v = parseFloat(text);
    if (isNaN(v)) {
      // matches source: invalid entry reverts the input to the slider's
      // current value rather than accepting garbage
      const fallback = which === 'weight' ? bodyRaw : bikeRaw;
      if (which === 'weight') setBodyInputText(fallback.toFixed(1)); else setBikeInputText(fallback.toFixed(1));
      return;
    }
    v = clamp(v, r.min, r.max);
    v = Math.round(v / r.step) * r.step;
    if (which === 'weight') { setBodyRaw(v); setBodyInputText(v.toFixed(1)); }
    else { setBikeRaw(v); setBikeInputText(v.toFixed(1)); }
  }

  const bodyKg = toKg(bodyRaw, unit);
  const bikeKg = toKg(bikeRaw, unit);
  const sysKg = +(bodyKg + bikeKg).toFixed(1);
  const wkg = ftp / bodyKg;
  const cats = CATS[gender];
  const { cat, idx } = getCat(wkg, gender);

  const GAUGE_MIN = 1.0;
  const GAUGE_MAX = cats[cats.length - 1].max;
  const gaugeRange = GAUGE_MAX - GAUGE_MIN;

  const gaugeSegments = useMemo(() => {
    return cats
      .map((c, i) => {
        const segMin = Math.max(c.min, GAUGE_MIN);
        const segMax = Math.min(c.max, GAUGE_MAX);
        if (segMax <= segMin) return null;
        const pct = ((segMax - segMin) / gaugeRange) * 100;
        return { i, label: c.label, color: c.color, pct, current: i === idx };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, idx]);

  const clampedWkg = clamp(wkg, GAUGE_MIN, GAUGE_MAX);
  const markerPct = ((clampedWkg - GAUGE_MIN) / gaugeRange) * 100;

  const age_ = age;
  const af = getAgeFactor(age_, gender);
  const adjWkg = wkg / af;
  const { cat: aCat, idx: aIdx } = getCat(adjWkg, gender);

  // Persist to the shared cross-tool setup on every recalculation — always
  // in kg, matching the source ("Persist in kg always").
  useEffect(() => {
    writeSharedSetup({
      pw: ftp,
      wt: sysKg,
      bwt: +bodyKg.toFixed(2),
      bkw: +bikeKg.toFixed(2),
      gender,
      wunit: unit,
      age,
    });
  }, [ftp, sysKg, bodyKg, bikeKg, gender, unit, age]);

  const climbLinkHref = `/climb?pw=${ftp}&wt=${sysKg}`;
  const climbLinkSub = `${ftp}W · ${fmtWt(bodyKg, unit)} body + ${fmtWt(bikeKg, unit)} bike = ${fmtWt(sysKg, unit)} system weight`;

  return (
    <div className="calc-grid">
      <div className="input-panel glass">
        <div className="panel-head">Your Numbers</div>
        <div className="form-body">
          <div>
            <div className="form-label">Gender</div>
            <div className="gender-toggle">
              <button type="button" className={`gender-btn${gender === 'male' ? ' active' : ''}`} onClick={() => setGender('male')}>Male</button>
              <button type="button" className={`gender-btn${gender === 'female' ? ' active' : ''}`} onClick={() => setGender('female')}>Female</button>
            </div>
          </div>

          <div>
            <div className="form-label">Weight Units</div>
            <div className="unit-toggle">
              <button type="button" className={`unit-btn${unit === 'kg' ? ' active' : ''}`} onClick={() => handleSetUnit('kg')}>kg</button>
              <button type="button" className={`unit-btn${unit === 'lbs' ? ' active' : ''}`} onClick={() => handleSetUnit('lbs')}>lbs</button>
            </div>
          </div>

          <div>
            <div className="row-between">
              <div className="form-label" style={{ margin: 0 }}>Age</div>
              <div className="big-val">{age}<span>yrs</span></div>
            </div>
            <input type="range" min={18} max={80} step={1} value={age} onChange={(e) => setAge(parseInt(e.target.value, 10))} />
            <div className="range-labels"><span>18</span><span>80</span></div>
          </div>

          <div>
            <div className="row-between">
              <div className="form-label" style={{ margin: 0 }}>FTP</div>
              <div className="big-val">{ftp}<span>W</span></div>
            </div>
            <input type="range" min={60} max={500} step={5} value={ftp} onChange={(e) => setFtp(parseInt(e.target.value, 10))} />
            <div className="range-labels"><span>60 W</span><span>500 W</span></div>
          </div>

          <div>
            <div className="row-between">
              <div className="form-label" style={{ margin: 0 }}>Body Weight</div>
              <div className="big-val-wrap">
                <input
                  className="big-val-input" type="number" value={bodyInputText}
                  onChange={(e) => setBodyInputText(e.target.value)}
                  onBlur={(e) => handleWeightInputChange('weight', e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="big-val-unit">{unitLabel(unit)}</span>
              </div>
            </div>
            <input type="range" min={range.weight.min} max={range.weight.max} step={range.weight.step} value={bodyRaw} onChange={(e) => handleWeightSlider('weight', parseFloat(e.target.value))} />
            <div className="range-labels"><span>{range.weight.labels[0]}</span><span>{range.weight.labels[1]}</span></div>
          </div>

          <div>
            <div className="row-between">
              <div className="form-label" style={{ margin: 0 }}>Bike Weight <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(for Climb Planner)</span></div>
              <div className="big-val-wrap">
                <input
                  className="big-val-input" type="number" value={bikeInputText}
                  onChange={(e) => setBikeInputText(e.target.value)}
                  onBlur={(e) => handleWeightInputChange('bike', e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="big-val-unit">{unitLabel(unit)}</span>
              </div>
            </div>
            <input type="range" min={range.bike.min} max={range.bike.max} step={range.bike.step} value={bikeRaw} onChange={(e) => handleWeightSlider('bike', parseFloat(e.target.value))} />
            <div className="range-labels"><span>{range.bike.labels[0]}</span><span>{range.bike.labels[1]}</span></div>
          </div>
        </div>
      </div>

      <div className="results">
        <div className="wkg-hero">
          <div className="wkg-number"><span style={{ color: cat.color }}>{wkg.toFixed(2)}</span><span className="wkg-unit">W/kg</span></div>
          <div>
            <div className="wkg-cat-badge" style={{ display: 'inline-block', color: cat.color, background: cat.color + '22', borderColor: cat.color + '55' }}>{cat.label}</div>
          </div>
          <div className="wkg-cat-desc">{cat.desc}</div>
          <div style={{ display: 'block', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'var(--sec)', lineHeight: 1.5 }}>
            {age_ <= 32 ? (
              `Age ${age_} — at or near peak cycling age. Your category reflects your current ability.`
            ) : (
              <>Age {age_} · <strong style={{ color: aCat.color }}>{aCat.label} for your age group</strong> · {
                aIdx >= 7 ? 'elite level' : aIdx >= 6 ? 'outstanding' : aIdx >= 5 ? 'excellent' : aIdx >= 4 ? 'very strong' : aIdx >= 3 ? 'solid' : aIdx >= 2 ? 'fair' : 'developing'
              } for a masters rider</>
            )}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">FTP</div>
            <div className="stat-val">{ftp}<span className="u">W</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Body Weight</div>
            <div className="stat-val">{unit === 'lbs' ? (bodyKg * LBS).toFixed(1) : bodyKg.toFixed(1)}<span className="u">{unitLabel(unit)}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Category</div>
            <div className="stat-val" style={{ fontSize: 17, letterSpacing: 0, lineHeight: 1.2, paddingTop: 3, color: cat.color }}>{cat.label}</div>
          </div>
        </div>

        <div className="chart-card">
          <div className="gauge-title">Power map — FTP by body weight</div>
          <FTPChart ftp={ftp} bodyKg={bodyKg} gender={gender} unit={unit} catColor={cat.color} />
        </div>

        <div className="gauge-card">
          <div className="gauge-title">Where you sit</div>
          <div className="gauge-bar">
            {gaugeSegments.map((s) => (
              <div key={s.i} className="gauge-segment" style={{ flex: `0 0 ${s.pct}%`, background: s.color }} title={`${s.label}: ${cats[s.i].min}–${cats[s.i].max} W/kg`} />
            ))}
          </div>
          <div className="gauge-marker-row">
            <div className="gauge-marker" style={{ left: `${markerPct.toFixed(1)}%` }} />
          </div>
          <div className="gauge-labels-row">
            {gaugeSegments.map((s) => (
              <div key={s.i} className={`gauge-lbl${s.current ? ' current' : ''}`} style={{ flex: `0 0 ${s.pct}%` }}>{s.label}</div>
            ))}
          </div>
        </div>

        <div className="next-card">
          <div className="next-head">To reach the next level</div>
          <div>
            {idx >= cats.length - 1 ? (
              <div className="next-peak">
                <div className="next-peak-icon">🏆</div>
                <div className="next-peak-text">WorldTour level</div>
                <div className="next-peak-sub">You&apos;re at the very top of the sport</div>
              </div>
            ) : (() => {
              const next = cats[idx + 1];
              const wattsNeeded = Math.ceil(next.min * bodyKg) - ftp;
              const kgToLose = +(bodyKg - ftp / next.min).toFixed(1);
              const wtToLose = unit === 'lbs' ? (kgToLose * LBS).toFixed(1) : kgToLose.toFixed(1);
              const u = unitLabel(unit);
              return (
                <>
                  <div className="next-intro">To reach <strong style={{ color: '#fff' }}>{next.label}</strong> ({next.min} W/kg):</div>
                  <div className="next-grid">
                    <div className="next-item">
                      <div className="next-item-head">Raise your FTP</div>
                      <div className="next-item-val" style={{ color: next.color }}>+{wattsNeeded}<span className="u" style={{ color: next.color }}>W</span></div>
                      <div className="next-item-constraint">keeping weight at <strong>{fmtWt(bodyKg, unit)}</strong></div>
                    </div>
                    <div className="next-item">
                      <div className="next-item-head">Lose body weight</div>
                      <div className="next-item-val" style={{ color: next.color }}>−{wtToLose}<span className="u" style={{ color: next.color }}>{u}</span></div>
                      <div className="next-item-constraint">keeping FTP at <strong>{ftp} W</strong></div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Still points at the old static /climb.html via next.config.js's
            rewrite for /climb — update this once the Climb Planner itself
            migrates to a real Next.js route. */}
        <a className="climb-link-card" href={climbLinkHref}>
          <div>
            <div className="climb-link-text">Take this to the Climb Planner</div>
            <div className="climb-link-sub">{climbLinkSub}</div>
          </div>
          <div className="climb-link-arrow">→</div>
        </a>
      </div>

      <div className="rail">
        <div className="rail-card">
          <div className="rail-head">Categories</div>
          <div className="rail-body">
            <table className="cat-table">
              <tbody>
                {cats.map((c, i) => (
                  <tr key={c.label}>
                    <td><span className="cat-dot" style={{ background: c.color }} /><span className={`cat-name${i === idx ? ' current' : ''}`}>{c.label}</span></td>
                    <td className="cat-range">{c.min === 0 ? `< ${c.max}` : `${c.min} – ${i === cats.length - 1 ? `${c.max}+` : c.max}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rail-card">
          <div className="rail-head">About W/kg</div>
          <div className="rail-body">
            <div className="tip-text">
              <p><strong>W/kg</strong> is the most useful single number in competitive cycling — it determines how fast you climb and how you compare across all rider sizes.</p>
              <p><strong>FTP</strong> (Functional Threshold Power) is roughly your 60-minute best sustainable power, or 95% of a 20-minute all-out effort. Use a recent test for an accurate number.</p>
              <p><strong>Body weight</strong> should be your morning weight in kit — not your bike weight. The lighter the rider at the same FTP, the faster they climb.</p>
              <p><strong>Categories</strong> are based on Coggan&apos;s power profile table — the standard reference used by coaches and training software worldwide. Values are FTP-based, not peak sprint power.</p>
              <p>W/kg matters most on climbs and sustained efforts. On flat roads, absolute watts and aerodynamics dominate; gravity is what makes power-to-weight the decisive number.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams() must be wrapped in Suspense per the App Router, same
// pattern as RacePageClient.tsx.
export default function WkgCalculator() {
  return (
    <Suspense fallback={null}>
      <WkgCalculatorInner />
    </Suspense>
  );
}
