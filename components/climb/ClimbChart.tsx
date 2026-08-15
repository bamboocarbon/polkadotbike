'use client';

import { useEffect, useState } from 'react';

export interface ClimbGearPoint {
  cog: number;
  spd: number;
  pwr: number;
  cross: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  ring: 'big' | 'small';
  cog: number;
  pwr: number;
  spd: number;
  cross: boolean;
}

interface ClimbChartProps {
  bigGears: ClimbGearPoint[];
  smallGears: ClimbGearPoint[] | null;
  isSingle: boolean;
  userPwr: number;
}

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

function dotColor(pwr: number, cross: boolean, userPwr: number): string | null {
  if (cross) return null;
  const ratio = pwr / userPwr;
  if (ratio <= 1.0) return '#12b05f';
  if (ratio <= 1.15) return '#ffcd00';
  return '#ee1c28';
}

export default function ClimbChart({ bigGears, smallGears, isSingle, userPwr }: ClimbChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!bigGears.length) {
    return <div className="chart-empty">Configure groupset and power to see your climb profile</div>;
  }

  const bigCol = '#aeb8c2', smallCol = '#7d8896';
  const mob = mounted && typeof window !== 'undefined' && window.innerWidth < 720;
  const W = mob ? 420 : 760, H = mob ? 520 : 460, pL = 62, pR = 22, pT = 20, pB = 50;
  const cW = W - pL - pR, cH = H - pT - pB;
  const n = bigGears.length;

  const hasSmall = !isSingle;
  const bigPlot = [...bigGears].reverse();
  const smallPlot = hasSmall && smallGears ? [...smallGears].reverse() : [];

  const maxPwr = Math.max(...bigGears.map((g) => g.pwr), ...(hasSmall && smallGears ? smallGears.map((g) => g.pwr) : []), userPwr * 1.1);
  const yStep = maxPwr > 500 ? 100 : maxPwr > 250 ? 50 : 25;
  const yMax = Math.ceil(maxPwr / yStep + 1) * yStep;

  const sx = (i: number) => pL + (n < 2 ? cW / 2 : (i / (n - 1)) * cW);
  const sy = (w: number) => pT + cH * (1 - w / yMax);

  let grid = '';
  const yLbls: { y: number; v: number }[] = [];
  for (let v = 0; v <= yMax; v += yStep) {
    const y = sy(v);
    grid += `<line x1="${pL}" x2="${pL + cW}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
    yLbls.push({ y, v });
  }

  const bot = pT + cH;
  const bigCoords = bigPlot.map((g, i) => ({ x: sx(i), y: sy(g.pwr) }));
  const smallCoords = hasSmall ? smallPlot.map((g, i) => ({ x: sx(i), y: sy(g.pwr) })) : null;
  const bigLine = smoothPath(bigCoords);
  const smallLine = hasSmall && smallCoords ? smoothPath(smallCoords) : null;

  const pyLine = sy(userPwr);
  const midY = pT + cH / 2;

  function makeDots(plot: ClimbGearPoint[], lineCol: string, ring: 'big' | 'small') {
    return plot.map((g, i) => {
      const x = sx(i), y = sy(g.pwr);
      const s = 6, cross = g.cross;
      const col = dotColor(g.pwr, cross, userPwr);
      const key = `${ring}-${g.cog}-${i}`;
      return (
        <g key={key}>
          {cross ? (
            <>
              <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke={lineCol} strokeWidth={3.5} strokeLinecap="round" />
              <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke={lineCol} strokeWidth={3.5} strokeLinecap="round" />
            </>
          ) : (
            <circle cx={x} cy={y} r={5.5} fill={col ?? undefined} />
          )}
          <circle
            cx={x}
            cy={y}
            r={18}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, ring, cog: g.cog, pwr: g.pwr, spd: g.spd, cross })}
            onMouseLeave={() => setTooltip(null)}
          />
        </g>
      );
    });
  }

  const showPwrLabel = pyLine >= pT && pyLine <= bot;
  const isBigTip = tooltip?.ring === 'big';
  const tipLineCol = isBigTip ? bigCol : smallCol;
  const tipRatio = tooltip ? tooltip.pwr / userPwr : 0;
  const tipStatusCol = tooltip?.cross ? 'var(--muted)' : tipRatio <= 1 ? '#12b05f' : tipRatio <= 1.15 ? '#ffcd00' : '#ee1c28';
  const tipStatusLbl = tooltip?.cross ? 'cross-chain' : tipRatio <= 1 ? 'achievable' : tipRatio <= 1.15 ? 'near limit' : 'too hard';

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" overflow="visible" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <clipPath id="climb-chart-clip">
            <rect x={pL} y={pT} width={cW} height={cH} />
          </clipPath>
        </defs>
        <g dangerouslySetInnerHTML={{ __html: grid }} />
        <line x1={pL} x2={pL} y1={pT} y2={bot} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
        <line x1={pL} x2={pL + cW} y1={bot} y2={bot} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />
        <path d={bigLine} fill="none" stroke={bigCol} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {hasSmall && smallLine && <path d={smallLine} fill="none" stroke={smallCol} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {makeDots(bigPlot, bigCol, 'big')}
        {hasSmall && makeDots(smallPlot, smallCol, 'small')}
        {showPwrLabel && (
          <>
            <line x1={pL} x2={pL + cW} y1={pyLine} y2={pyLine} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} strokeDasharray="8 5" />
            <rect x={pL + cW - 58} y={pyLine - 12} width={56} height={16} rx={4} fill="rgba(6,12,30,0.85)" />
            <text x={pL + cW - 30} y={pyLine - 4} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="rgba(255,255,255,0.80)">
              {userPwr}W
            </text>
          </>
        )}
        {yLbls.map((l, i) => (
          <text key={i} x={pL - 9} y={l.y + 5} textAnchor="end" fontSize={14} fill="#94a3b8">{l.v}</text>
        ))}
        {bigPlot.map((g, i) => (
          <text key={i} x={sx(i)} y={pT + cH + 20} textAnchor="middle" fontSize={n > 12 ? 12 : 14} fill="#94a3b8">{g.cog}T</text>
        ))}
        <text x={pL + cW / 2} y={pT + cH + 42} textAnchor="middle" fontSize={14} fontWeight={600} fill="#64748b">
          Cassette sprocket size (teeth)
        </text>
        <text transform={`rotate(-90,14,${midY.toFixed(0)})`} x={14} y={midY + 5} textAnchor="middle" fontSize={13} fill="#94a3b8">
          watts
        </text>
      </svg>

      {tooltip && (
        <div
          className="chart-tooltip show"
          style={{ left: Math.min(tooltip.x + 16, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 220), top: Math.max(10, tooltip.y - 80) }}
        >
          <div className="ct-ring" style={{ color: tipLineCol }}>
            {isBigTip ? (isSingle ? 'Single Ring' : 'Big Ring') : 'Small Ring'} &middot; {tooltip.cog}T
          </div>
          <div className="ct-speed" style={{ color: tipStatusCol }}>
            {Math.round(tooltip.pwr)}
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sec)', marginLeft: 4 }}>W required</span>
          </div>
          <div className="ct-detail">
            {tooltip.spd.toFixed(2)} km/h &middot; <span style={{ color: tipStatusCol }}>{tipStatusLbl}</span>
          </div>
        </div>
      )}
    </div>
  );
}
