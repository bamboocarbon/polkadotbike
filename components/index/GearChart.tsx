'use client';

import { useEffect, useState } from 'react';

export interface GearPoint {
  cog: number;
  spd: number;
  dev: number;
  cross: boolean;
}

export type ChartMode = 'dev' | 'spd' | 'in';

interface TooltipState {
  x: number;
  y: number;
  ring: 'big' | 'small';
  cog: number;
  spd: number;
  dev: number;
  cross: boolean;
}

interface GearChartProps {
  bigGears: GearPoint[];
  smallGears: GearPoint[] | null;
  ul: string;
  cadence: number;
  chartMode: ChartMode;
  bigColor: string;
  smallColor: string;
}

// Catmull-Rom -> cubic Bezier smooth curve, ported verbatim from renderChart()'s smoothPath().
function smoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return `M ${coords[0].x},${coords[0].y}`;
  let d = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    const cp1x = (p1.x + (p2.x - p0.x) / 6).toFixed(1);
    const cp1y = (p1.y + (p2.y - p0.y) / 6).toFixed(1);
    const cp2x = (p2.x - (p3.x - p1.x) / 6).toFixed(1);
    const cp2y = (p2.y - (p3.y - p1.y) / 6).toFixed(1);
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function GearChart({ bigGears, smallGears, ul, cadence, chartMode, bigColor, smallColor }: GearChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  // Source only re-measures window.innerWidth when calculate()/calculateCustom()
  // re-renders the chart, not on live resize — replicated by reading it fresh on
  // every render (which happens exactly when the gear props change), rather than
  // wiring a resize listener that would recompute more often than the source ever did.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!bigGears.length) {
    return <div className="chart-empty">Select a groupset to see your gear chart</div>;
  }

  const hasSmall = smallGears !== null;
  const bigPlot = [...bigGears].reverse();
  const smallPlot = hasSmall ? [...smallGears].reverse() : [];
  const n = bigPlot.length;

  const mob = mounted && typeof window !== 'undefined' && window.innerWidth < 720;
  const W = mob ? 420 : 760, H = mob ? 520 : 520, pL = 62, pR = 22, pT = 18, pB = 54;
  const cW = W - pL - pR, cH = H - pT - pB;

  const isSpd = chartMode === 'spd';
  const isIn = chartMode === 'in';
  const getVal = (g: GearPoint) => (isSpd ? g.spd : isIn ? g.dev * 12.527 : g.dev);

  const allVals = [...bigGears, ...(hasSmall ? smallGears : [])].map(getVal);
  const rawMax = Math.max(...allVals);
  let yStep: number, yMax: number;
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
  const yLabel = isSpd ? ul : isIn ? 'gear inches' : 'metres / rev';

  const sx = (i: number) => pL + (n < 2 ? cW / 2 : (i / (n - 1)) * cW);
  const sy = (v: number) => pT + cH * (1 - v / yMax);

  let grid = '';
  const yLbls: { y: number; label: string }[] = [];
  for (let v = 0; v <= yMax; v += yStep) {
    const y = sy(v);
    grid += `<line x1="${pL}" x2="${pL + cW}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
    yLbls.push({ y, label: (isSpd || isIn) ? v.toFixed(0) : String(v) });
  }

  const bot = pT + cH;
  const bigCoords = bigPlot.map((g, i) => ({ x: sx(i), y: sy(getVal(g)) }));
  const smallCoords = hasSmall ? smallPlot.map((g, i) => ({ x: sx(i), y: sy(getVal(g)) })) : null;
  const bigLine = smoothPath(bigCoords);
  const smallLine = hasSmall && smallCoords ? smoothPath(smallCoords) : null;

  function makeBands(plot: GearPoint[]) {
    let paths = '';
    const bandH = 22, GAP = 14;
    for (let i = 0; i < plot.length - 1; i++) {
      if (plot[i].cross || plot[i + 1].cross) continue;
      const v0 = getVal(plot[i]), v1 = getVal(plot[i + 1]);
      const stepPct = ((v1 - v0) / v0) * 100;
      const x1 = sx(i), y1 = sy(v0);
      const x2 = sx(i + 1), y2 = sy(v1);
      let sc: string;
      if (stepPct >= 14) sc = '#ee1c28';
      else if (stepPct >= 10) sc = '#ffcd00';
      else sc = '#12b05f';
      paths += `<path d="M ${x1.toFixed(1)},${(y1 + GAP).toFixed(1)} L ${x2.toFixed(1)},${(y2 + GAP).toFixed(1)} L ${x2.toFixed(1)},${(y2 + GAP + bandH).toFixed(1)} L ${x1.toFixed(1)},${(y1 + GAP + bandH).toFixed(1)} Z" fill="${sc}"/>`;
    }
    return paths;
  }
  const bigBands = makeBands(bigPlot);
  const smallBands = hasSmall ? makeBands(smallPlot) : '';

  function makeDots(plot: GearPoint[], color: string, ring: 'big' | 'small') {
    return plot.map((g, i) => {
      const x = sx(i), y = sy(getVal(g));
      const cross = g.cross;
      const s = 6;
      const key = `${ring}-${g.cog}-${i}`;
      return (
        <g key={key}>
          {cross ? (
            <>
              <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
              <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={x} cy={y} r={12} fill={color} opacity={0.12} />
              <circle cx={x} cy={y} r={5.5} fill={color} />
            </>
          )}
          <circle
            cx={x}
            cy={y}
            r={18}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) =>
              setTooltip({ x: e.clientX, y: e.clientY, ring, cog: g.cog, spd: g.spd, dev: g.dev, cross })
            }
            onMouseLeave={() => setTooltip(null)}
          />
        </g>
      );
    });
  }

  const midY = pT + cH / 2;

  const bigCol = bigColor, smallCol = smallColor;
  const isBigTip = tooltip?.ring === 'big';
  const tipCol = isBigTip ? bigCol : smallCol;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" overflow="visible" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <clipPath id="chart-clip">
            <rect x={pL} y={pT} width={cW} height={cH} />
          </clipPath>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: grid }} />
        <line x1={pL} x2={pL} y1={pT} y2={bot} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
        <line x1={pL} x2={pL + cW} y1={bot} y2={bot} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
        <g clipPath="url(#chart-clip)">
          <g dangerouslySetInnerHTML={{ __html: bigBands + smallBands }} />
        </g>
        <path d={bigLine} fill="none" stroke={bigCol} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {hasSmall && smallLine && <path d={smallLine} fill="none" stroke={smallCol} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {makeDots(bigPlot, bigCol, 'big')}
        {hasSmall && makeDots(smallPlot, smallCol, 'small')}
        {yLbls.map((l, i) => (
          <text key={i} x={pL - 9} y={l.y + 5} textAnchor="end" fontSize={14} fill="#94a3b8">{l.label}</text>
        ))}
        {bigPlot.map((g, i) => (
          <text key={i} x={sx(i)} y={pT + cH + 20} textAnchor="middle" fontSize={n > 12 ? 12 : 14} fill="#94a3b8">{g.cog}T</text>
        ))}
        <text x={pL + cW / 2} y={pT + cH + 44} textAnchor="middle" fontSize={14} fontWeight={600} fill="#64748b">
          Cassette sprocket size (teeth)
        </text>
        <text transform={`rotate(-90,14,${midY.toFixed(0)})`} x={14} y={midY + 5} textAnchor="middle" fontSize={13} fill="#94a3b8">
          {yLabel}
        </text>
      </svg>

      {tooltip && (
        <div
          className="chart-tooltip show"
          style={{ left: Math.min(tooltip.x + 16, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 210), top: Math.max(10, tooltip.y - 80) }}
        >
          <div className="ct-ring" style={{ color: tipCol }}>
            {isBigTip ? 'Big Ring' : 'Small Ring'}{tooltip.cross ? ' · avoid cross-chain' : ''}
          </div>
          <div className="ct-speed" style={{ color: tipCol }}>
            {isSpd ? (
              <>{tooltip.spd.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sec)', marginLeft: 4 }}>{ul}</span></>
            ) : isIn ? (
              <>{(tooltip.dev * 12.527).toFixed(1)} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sec)', marginLeft: 4 }}>gear in.</span></>
            ) : (
              <>{tooltip.dev.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sec)', marginLeft: 4 }}>m / rev</span></>
            )}
          </div>
          <div className="ct-detail">
            {tooltip.cog}T cog &middot; {isSpd ? `${tooltip.dev.toFixed(2)} m/rev` : isIn ? `${tooltip.dev.toFixed(2)} m/rev` : `${tooltip.spd.toFixed(1)} ${ul} at ${cadence} rpm`}
          </div>
        </div>
      )}
    </div>
  );
}
