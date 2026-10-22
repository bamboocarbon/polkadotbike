'use client';

import { useState, type ReactNode } from 'react';
import RaceMap from '@/components/race/RaceMap';
import { StageSidebar, StageMobileSelect } from '@/components/race/StageSidebar';
import type { Stage } from '@/lib/raceHelpers';
import type { StageCoord, CityLabel, CountryLabel, PlaceLabel } from '@/components/race/RaceMapInner';
import tdf27Map from '@/data/tdf27-map.json';

// Same route-line/dot palette as the 2026 TDF page (green/black/red for
// Flat/Hilly/Mountain), plus blue for ITT (matches the badge and legend dot) — this route has one (Stage 7),
// unlike the early UK-only 3-stage version of this page.
const TYPE_COLOR: Record<string, string> = {
  Flat: '#12b05f',
  Hilly: '#000000',
  Mountain: '#ee1c28',
  ITT: '#1a72e0',
};

// United Kingdom (826) keeps the live page's pale-lemon fill; France (250)
// keeps its own yellow.
const COUNTRY_FILL: Record<string, string> = {
  '826': '#fff3b8',
  '250': '#ffe94d',
};

const COUNTRY_LABELS: CountryLabel[] = [
  { lat: 56.6, lng: -4.6, name: 'UNITED KINGDOM', color: 'rgba(122,94,10,0.5)' },
  { lat: 47.2, lng: 2.4, name: 'FRANCE', color: 'rgba(122,94,10,0.5)' },
];

const LEGEND = [
  { cls: 'ml-s', label: 'Flat' },
  { cls: 'ml-h', label: 'Hilly' },
  { cls: 'ml-m', label: 'Mountain' },
  { cls: 'ml-t', label: 'ITT' },
];

/**
 * Full-route explorer for the 2027 Tour de France — map with all 21 stage
 * markers, plus a sticky left sidebar (StageSidebar, shared with the 2026
 * TDF/Giro/Vuelta pages) that scrolls the stage-card list.
 */
interface MapData {
  STAGE_COORDS: unknown[];
  CITY_LABELS: unknown[];
}

export default function Tdf27Explorer({
  stages,
  children,
  mapData = tdf27Map,
  mapId = 'tdf27-map',
  placeLabels,
}: {
  stages: Stage[];
  children: ReactNode;
  /** Defaults to the official route map (data/tdf27-map.json). */
  mapData?: MapData;
  mapId?: string;
  placeLabels?: PlaceLabel[];
}) {
  const [selected, setSelected] = useState(1);

  function selectAndScroll(num: number) {
    setSelected(num);
    document.getElementById(`stage-${num}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <div className="map-outer">
        <RaceMap
          mapId={mapId}
          stages={stages}
          stageCoords={mapData.STAGE_COORDS as StageCoord[]}
          cityLabels={mapData.CITY_LABELS as CityLabel[]}
          countryLabels={COUNTRY_LABELS}
          countryFill={COUNTRY_FILL}
          typeColor={TYPE_COLOR}
          activeStage={selected}
          onStageClick={selectAndScroll}
          fitBoundsPadding={[30, 30]}
          placeLabels={placeLabels}
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

      <div className="container" style={{ maxWidth: 1100 }}>
        <StageMobileSelect stages={stages} selected={selected} onSelect={selectAndScroll} />
        <div className="tdf-grid">
          <StageSidebar stages={stages} selected={selected} onSelect={selectAndScroll} label="2027 Route" />
          <div>{children}</div>
        </div>
      </div>
    </>
  );
}
