'use client';

import { useEffect, useState } from 'react';
import { SystemGears } from '@/lib/compareCalcState';

export type CompareChartMode = 'dev' | 'spd' | 'in';

interface TooltipState {
  x: number;
  y: number;
  sys: 'a' | 'b';
  ring: 'big' | 'small';
  cog: number;
  dev: number;
  cross: boolean;
}

interface CompareChartProps {
  a: SystemGears;
  b: SystemGears | null;
  chartMode: CompareChartMode;
  cadence: number;
  bigColA: string;
  smlColA: string;
  aName: string;
  bName: string;
}

const BIG_COL_B = '#ffffff';
const SML_COL_B = '#e5e9ee';

function smoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return `M ${coords[0].x},${coords[0].y}`;
  let d = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function gapColour(ratio: number): string {
  if (ratio < 0.04) return '#12b05f';
  if (ratio < 0.09) return '#ffcd00';
  if (ratio < 0.15) return '#ff7a00';
  return '#ee1c28';
}

export default function CompareChart({ a, b, chartMode, cadence, bigColA, smlColA, aName, bName }: CompareChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mob = mounted && typeof window !== 'undefined' && window.innerWidth < 768;
  const W = mob ? 420 : 780, H = mob ? 540 : 500, pL = 62, pR = 22, pT = 20, pB = 48;
  const cW = W - pL - pR, cH = H - pT - pB;

  const isSpd = chartMode === 'spd';
  const isIn = chartMode === 'in';
  const getVal = (g: { dev: number }) => (isSpd ? (g.dev * cadence * 60) / 1000 : isIn ? g.dev * 12.527 : g.dev);

  const bigA = [...a.bigG].reverse();
  const smlA = a.smallG ? [...a.smallG].reverse() : null;
  const bigB = b ? [...b.bigG].reverse() : [];
  const smlB = b && b.smallG ? [...b.smallG].reverse() : null;

  const allVals = [...bigA, ...(smlA || []), ...bigB, ...(smlB || [])].map(getVal);
  const rawMax = Math.max(...allVals);
  let yMax: number, yStep: number;
  if (isSpd) {
    yStep = rawMax > 60 ? 10 : rawMax > 30 ? 5 : 2;
    yMax = Math.ceil(rawMax / yStep + 1) * yStep;
  } else if (isIn) {
    yStep = 10;
    yMax = Math.ceil(rawMax / 10 + 1) * 10;
  } else {
    yStep = 1;
    yMax = Math.ceil(rawMax) + 1;
  }

  const sx = (i: number, n: number) => pL + (n < 2 ? cW / 2 : (i / (n - 1)) * cW);
  const sy = (v: number) => pT + cH * (1 - v / yMax);
  const bot = pT + cH;

  let grid = '';
  const yLbls: { y: number; label: string }[] = [];
  for (let v = 0; v <= yMax; v += yStep) {
    const y = sy(v);
    grid += `<line x1="${pL}" x2="${pL + cW}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
    yLbls.push({ y, label: (isSpd || isIn) ? v.toFixed(0) : String(v) });
  }
  const midY = (pT + cH / 2).toFixed(0);

  const coordsA = bigA.map((g, i) => ({ x: sx(i, bigA.length), y: sy(getVal(g)) }));
  const coordsB = bigB.length ? bigB.map((g, i) => ({ x: sx(i, bigB.length), y: sy(getVal(g)) })) : null;
  const coordsSA = smlA ? smlA.map((g, i) => ({ x: sx(i, smlA.length), y: sy(getVal(g)) })) : null;
  const coordsSB = smlB ? smlB.map((g, i) => ({ x: sx(i, smlB.length), y: sy(getVal(g)) })) : null;

  function interpDev(gears: { dev: number }[], xNorm: number): number {
    const n = gears.length;
    if (n === 1) return getVal(gears[0]);
    const pos = xNorm * (n - 1);
    const i = Math.min(n - 2, Math.floor(pos));
    const t = pos - i;
    return getVal(gears[i]) * (1 - t) + getVal(gears[i + 1]) * t;
  }

  function buildGapRibbon(plotA: { dev: number }[], plotB: { dev: number }[]): string {
    const SEGS = 120;
    let fwd = '', back = '';
    for (let k = 0; k <= SEGS; k++) {
      const t = k / SEGS;
      fwd += `${k ? 'L' : 'M'} ${(pL + t * cW).toFixed(1)},${sy(interpDev(plotA, t)).toFixed(1)} `;
      back = `L ${(pL + t * cW).toFixed(1)},${sy(interpDev(plotB, t)).toFixed(1)} ` + back;
    }
    return `<path d="${fwd}${back}Z" fill="rgba(255,255,255,0.06)"/>`;
  }

  function buildHeatStrip(plotA: { dev: number }[], plotB: { dev: number }[], y: number): string {
    let out = '';
    const SEGS = 120;
    for (let k = 0; k < SEGS; k++) {
      const x0 = k / SEGS, x1 = (k + 1) / SEGS;
      const gap = Math.abs(interpDev(plotA, x0) - interpDev(plotB, x0)) / Math.max(interpDev(plotA, x0), interpDev(plotB, x0), 0.01);
      out += `<rect x="${(pL + x0 * cW).toFixed(1)}" y="${y}" width="${((x1 - x0) * cW + 0.5).toFixed(1)}" height="22" fill="${gapColour(gap)}"/>`;
    }
    return out;
  }

  const gapPaths = coordsB ? buildGapRibbon(bigA, bigB) + (smlA && smlB ? buildGapRibbon(smlA, smlB) : '') : '';

  let heatStrips = '';
  const heatLabels: { x: number; y: number; text: string }[] = [];
  if (coordsB) {
    const mixed = !!smlA !== !!smlB;
    const bigMax = Math.max(...bigA.map(getVal), ...bigB.map(getVal));
    const yBig = Math.max(2, sy(bigMax) - 28);
    heatStrips += buildHeatStrip(bigA, bigB, yBig);
    heatLabels.push({ x: pL + 6, y: Math.max(yBig - 6, 14), text: mixed ? '1x vs big chainring' : 'big chainring' });
    if (smlA && smlB) {
      const smlMin = Math.min(...smlA.map(getVal), ...smlB.map(getVal));
      const ySml = Math.min(sy(smlMin) + 6, pT + cH + 5);
      heatStrips += buildHeatStrip(smlA, smlB, ySml);
      heatLabels.push({ x: pL + 6, y: ySml + 39, text: 'small chainring' });
    } else if (mixed) {
      const solo = smlA ? bigB : bigA;
      const sml = smlA || smlB!;
      const smlMin = Math.min(...sml.map(getVal), ...solo.map(getVal));
      const ySml = Math.min(sy(smlMin) + 6, pT + cH + 5);
      heatStrips += buildHeatStrip(solo, sml, ySml);
      heatLabels.push({ x: pL + 6, y: ySml + 39, text: '1x vs small chainring' });
    }
  }

  function makeDots(plot: { cog: number; dev: number; cross: boolean }[], col: string, ring: 'big' | 'small', sys: 'a' | 'b', n: number) {
    const s = 5;
    return plot.map((g, i) => {
      const x = sx(i, n), y = sy(getVal(g));
      const cross = g.cross;
      const key = `${sys}-${ring}-${g.cog}-${i}`;
      return (
        <g key={key}>
          {cross ? (
            <>
              <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke={col} strokeWidth={3} strokeLinecap="round" />
              <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke={col} strokeWidth={3} strokeLinecap="round" />
            </>
          ) : (
            <circle cx={x} cy={y} r={5} fill={col} />
          )}
          <circle
            cx={x}
            cy={y}
            r={16}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, sys, ring, cog: g.cog, dev: g.dev, cross })}
            onMouseLeave={() => setTooltip(null)}
          />
        </g>
      );
    });
  }

  const isATip = tooltip?.sys === 'a';
  const tipCol = isATip ? bigColA : BIG_COL_B;
  const tipSysName = isATip ? aName : bName;
  const tipSys = isATip ? a : b;
  const tipRingName = tooltip ? (tooltip.ring === 'big' ? (tipSys?.isSingle ? 'Single Ring' : 'Big Ring') : 'Small Ring') : '';
  const tipSpd = tooltip ? ((tooltip.dev * cadence * 60) / 1000).toFixed(1) : '0';
  const tipIn = tooltip ? (tooltip.dev * 12.527).toFixed(1) : '0';

  return (
    <div className="chart-wrap" id="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <clipPath id="cc">
            <rect x={pL} y={pT} width={cW} height={cH} />
          </clipPath>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: grid }} />
        <line x1={pL} x2={pL} y1={pT} y2={bot} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
        <line x1={pL} x2={pL + cW} y1={bot} y2={bot} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
        <g clipPath="url(#cc)">
          <g dangerouslySetInnerHTML={{ __html: gapPaths }} />
        </g>
        <path d={smoothPath(coordsA)} fill="none" stroke={bigColA} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {coordsSA && <path d={smoothPath(coordsSA)} fill="none" stroke={smlColA} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}
        {coordsB && <path d={smoothPath(coordsB)} fill="none" stroke={BIG_COL_B} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 5" />}
        {coordsSB && <path d={smoothPath(coordsSB)} fill="none" stroke={SML_COL_B} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" />}
        {makeDots(bigA, bigColA, 'big', 'a', bigA.length)}
        {smlA && makeDots(smlA, smlColA, 'small', 'a', smlA.length)}
        {coordsB && makeDots(bigB, BIG_COL_B, 'big', 'b', bigB.length)}
        {smlB && makeDots(smlB, SML_COL_B, 'small', 'b', smlB.length)}
        {yLbls.map((l, i) => (
          <text key={i} x={pL - 9} y={l.y + 5} textAnchor="end" fontSize={16} fontWeight={500} fill="#94a3b8">{l.label}</text>
        ))}
        <text transform={`rotate(-90,14,${midY})`} x={14} y={+midY + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="#94a3b8">
          {isSpd ? 'km/h' : isIn ? 'gear in.' : 'm / rev'}
        </text>
        <text x={pL + 6} y={H - pB + 36} fontSize={14} fontWeight={500} fill="#64748b">← Easiest</text>
        <text x={pL + cW - 6} y={H - pB + 36} textAnchor="end" fontSize={14} fontWeight={500} fill="#64748b">Hardest →</text>
        <text x={pL + cW / 2} y={H - pB + 36} textAnchor="middle" fontSize={14} fontWeight={600} fill="#64748b">
          Cassette sprocket size (teeth)
        </text>
        <g dangerouslySetInnerHTML={{ __html: heatStrips }} />
        {heatLabels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} fontSize={15} fontWeight={600} fill="#94a3b8">{l.text}</text>
        ))}
      </svg>

      {tooltip && tipSys && (
        <div className="chart-tooltip show" style={{ left: Math.min(tooltip.x + 16, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 240), top: Math.max(10, tooltip.y - 90) }}>
          <div className="ct-ring" style={{ color: tipCol }}>
            {isATip ? 'System A' : 'System B'} &middot; {tipRingName} &middot; {tooltip.cog}T{tooltip.cross ? ' · ×cross-chain' : ''}
          </div>
          <div className="ct-dev">
            {isSpd ? (
              <>{tipSpd}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>km/h</span></>
            ) : isIn ? (
              <>{tipIn}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>gear in.</span></>
            ) : (
              <>{tooltip.dev.toFixed(2)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>m / rev</span></>
            )}
          </div>
          <div className="ct-detail">
            {tipSysName.split('(')[0].trim()} &middot; {isSpd ? `${tooltip.dev.toFixed(2)} m/rev` : isIn ? `${tooltip.dev.toFixed(2)} m/rev` : `${tipSpd} km/h at ${cadence} rpm`}
          </div>
        </div>
      )}
    </div>
  );
}
