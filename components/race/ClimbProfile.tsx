import type { Climb } from '@/lib/raceHelpers';

export default function ClimbProfile({ climb, scale = 1 }: { climb: Climb; /** Multiplies only the per-km (width) pixel scale — for a page whose climbs are all much shorter than the site's usual major-race climbs (2027 TDF UK), where so few km-segments render an illegibly narrow sliver at the default width. Height stays standard: it's already a fixed, legible size regardless of climb length, and scaling it by the same factor turned short/steep climbs into a tall thin spike instead of a wider wedge. Deliberately not "to scale" against other races' climbs when raised; that's the point Robin asked for here. */ scale?: number }) {
  const p = climb.profile;
  if (!p || !p.length) return null;

  // Cumulative elevation: 1km at g% = g*10m
  let cum = 0;
  const elev = [0, ...p.map((g) => (cum += g * 10, cum))];
  const totalElev = elev[elev.length - 1];

  const KM_PX = 12 * scale; // fixed display pixels per km
  const PX_PER_100M = 6; // fixed display pixels per 100m elevation gain
  const H = 90;
  const pad = 4;
  const W = p.length * KM_PX + pad * 2; // total width scales with climb length
  const iH = H - pad * 2; // = 82px — fits all profiled climbs at 6px/100m
  const yb = H - pad;

  // Standardised vertical scale: every 100m gain = PX_PER_100M pixels
  const useH = Math.min(iH, (totalElev / 100) * PX_PER_100M);

  const fills = p.map((g, i) => {
    const col = g < 5 ? '#12b05f' : g < 7 ? '#ffcd00' : g < 9 ? '#ff8800' : '#ee1c28';
    const x1 = (pad + i * KM_PX).toFixed(1);
    const x2 = (pad + (i + 1) * KM_PX).toFixed(1);
    const y1 = (pad + iH - (elev[i] / totalElev) * useH).toFixed(1);
    const y2 = (pad + iH - (elev[i + 1] / totalElev) * useH).toFixed(1);
    return (
      <polygon
        key={i}
        points={`${x1},${yb} ${x1},${y1} ${x2},${y2} ${x2},${yb}`}
        fill={col}
      />
    );
  });

  return (
    <div className="cc-profile">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', width: W, maxWidth: '100%', height: 'auto', borderRadius: 4, overflow: 'hidden' }}
      >
        <rect width={W} height={H} fill="rgba(0,0,0,0.28)" rx={4} />
        {fills}
      </svg>
      <div className="profile-meta" style={{ width: W, maxWidth: '100%' }}>
        <span>▲ {Math.round(totalElev)}m gain</span>
        <span>{climb.len}km</span>
      </div>
    </div>
  );
}
