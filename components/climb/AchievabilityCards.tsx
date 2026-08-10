'use client';

import { ClimbGearPoint } from './ClimbChart';

interface AchievabilityCardsProps {
  bigGears: ClimbGearPoint[];
  smallGears: ClimbGearPoint[] | null;
  outer: number;
  inner: number | null;
  isSingle: boolean;
  userPwr: number;
}

function cardClass(g: ClimbGearPoint, userPwr: number): 'cross' | 'ok' | 'warn' | 'hard' {
  if (g.cross) return 'cross';
  const r = g.pwr / userPwr;
  if (r <= 1.0) return 'ok';
  if (r <= 1.15) return 'warn';
  return 'hard';
}

function badgeLabel(g: ClimbGearPoint, userPwr: number): string {
  if (g.cross) return 'Cross-chain';
  const r = g.pwr / userPwr;
  if (r <= 1.0) return '✓ OK';
  if (r <= 1.15) return '~ Limit';
  return '✕ Hard';
}

function Column({ gears, ring, ringLabel, userPwr }: { gears: ClimbGearPoint[]; ring: 'big' | 'small'; ringLabel: string; userPwr: number }) {
  return (
    <div className="achieve-col">
      <div className="achieve-col-head" style={{ color: `var(--accent${ring === 'small' ? '-light' : ''})` }}>
        {ringLabel}
      </div>
      {gears.map((g, i) => {
        const cls = cardClass(g, userPwr);
        return (
          <div key={g.cog + '-' + i} className={`gcard ${cls}`}>
            <div className="gc-cog">{g.cog}T</div>
            <div className="gc-mid">
              <div className="gc-watts">{Math.round(g.pwr)}W</div>
              <div className="gc-spd">{g.spd.toFixed(1)} km/h</div>
            </div>
            <div className="gc-badge">{badgeLabel(g, userPwr)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AchievabilityCards({ bigGears, smallGears, outer, inner, isSingle, userPwr }: AchievabilityCardsProps) {
  const bigLabel = isSingle ? `${outer}T Single Ring` : `${outer}T Big Ring`;
  return (
    <div className="achieve-cols">
      <Column gears={bigGears} ring="big" ringLabel={bigLabel} userPwr={userPwr} />
      {!isSingle && smallGears && <Column gears={smallGears} ring="small" ringLabel={`${inner}T Small Ring`} userPwr={userPwr} />}
    </div>
  );
}
