'use client';

import { useState } from 'react';
import RaceMap from '@/components/race/RaceMap';
import type { Stage } from '@/lib/raceHelpers';
import type { StageCoord, CityLabel, CountryLabel } from '@/components/race/RaceMapInner';
import tdf27Map from '@/data/tdf27-map.json';

// Same route-line/dot palette as the 2026 TDF page (green/black/red for
// Flat/Hilly/Mountain) — kept consistent with the rest of the site rather
// than inventing new colours for a 3-stage subset of the same race.
const TYPE_COLOR: Record<string, string> = { Flat: '#12b05f', Hilly: '#000000', Mountain: '#ee1c28' };

// France (250) kept at exactly the fill the live 2026 TDF page uses — it's
// still fundamentally the Tour de France's home country, no route drawn
// through it yet. United Kingdom (826) gets a deliberately different,
// deeper gold so the confirmed stages read as the "active" part of the map.
const COUNTRY_FILL: Record<string, string> = {
  '826': '#e8b400',
  '250': '#ffe94d',
};

const COUNTRY_LABELS: CountryLabel[] = [
  { lat: 56.6, lng: -4.6, name: 'UNITED KINGDOM', color: 'rgba(122,94,10,0.5)' },
  { lat: 47.2, lng: 2.4, name: 'FRANCE', color: 'rgba(122,94,10,0.5)' },
];

// Paris only exists here to widen fitBounds/maxBounds so France is visible
// and reachable on the map — no stage is plotted there yet. See
// RaceMapInner's extraBoundsPoints (added for this page; the other 3 race
// maps don't pass it and are unaffected).
const EXTRA_BOUNDS_POINTS: [number, number][] = [[48.8566, 2.3522]];

const LEGEND = [
  { cls: 'ml-s', label: 'Flat' },
  { cls: 'ml-h', label: 'Hilly' },
  { cls: 'ml-m', label: 'Mountain' },
];

export default function Tdf27Map({ stages }: { stages: Stage[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="map-outer">
      <RaceMap
        mapId="tdf27-map"
        stages={stages}
        stageCoords={tdf27Map.STAGE_COORDS as StageCoord[]}
        cityLabels={tdf27Map.CITY_LABELS as CityLabel[]}
        countryLabels={COUNTRY_LABELS}
        countryFill={COUNTRY_FILL}
        typeColor={TYPE_COLOR}
        activeStage={active}
        onStageClick={(num) => {
          setActive(num);
          document.getElementById(`stage-${num}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        fitBoundsPadding={[30, 30]}
        extraBoundsPoints={EXTRA_BOUNDS_POINTS}
      />
      <div className="map-legend">
        {LEGEND.map((item) => (
          <div className="ml-item" key={item.cls}>
            <span className={`ml-dot ${item.cls}`} /> {item.label}
          </div>
        ))}
        <span style={{ color: 'var(--muted)' }}>— click a marker to jump to that stage</span>
      </div>
    </div>
  );
}
