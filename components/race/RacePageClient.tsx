'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RaceMap from './RaceMap';
import { StageSidebar, StageMobileSelect } from './StageSidebar';
import StageDetail from './StageDetail';
import { clientDefaultStage, type RaceData, type Climb } from '@/lib/raceHelpers';
import type { StageCoord, CityLabel, CountryLabel, RaceMapProps } from './RaceMapInner';

export interface MapConfig {
  mapId: string;
  stageCoords: StageCoord[];
  cityLabels: CityLabel[];
  countryLabels: CountryLabel[];
  countryFill: Record<string, string>;
  typeColor: Record<string, string>;
  fitBoundsPadding: [number, number];
  zoomControl?: RaceMapProps['zoomControl'];
  mobileView?: RaceMapProps['mobileView'];
  zoomDelta?: RaceMapProps['zoomDelta'];
}

interface RacePageClientProps {
  race: RaceData;
  climbs: Climb[];
  staticDefaultStage: number;
  stay22Links: Record<string, string>;
  mapConfig: MapConfig;
}

function RacePageClientInner({ race, climbs, staticDefaultStage, stay22Links, mapConfig }: RacePageClientProps) {
  const searchParams = useSearchParams();
  const [selectedStage, setSelectedStage] = useState(staticDefaultStage);

  // Runs once, on mount, matching the original's one-time
  // `renderStage(parseInt(...get('s')) || defaultStage())` call at page
  // load. Nothing in this app pushes a new ?s= into the URL after that —
  // clicking a stage just updates state — so there's no case where
  // searchParams changing later should re-trigger this.
  useEffect(() => {
    const sParam = parseInt(searchParams.get('s') || '', 10);
    if (sParam && race.stages.some((s) => s.num === sParam)) {
      setSelectedStage(sParam);
    } else {
      setSelectedStage(clientDefaultStage(race));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="map-outer">
        <RaceMap
          mapId={mapConfig.mapId}
          stages={race.stages}
          stageCoords={mapConfig.stageCoords}
          cityLabels={mapConfig.cityLabels}
          countryLabels={mapConfig.countryLabels}
          countryFill={mapConfig.countryFill}
          typeColor={mapConfig.typeColor}
          activeStage={selectedStage}
          onStageClick={setSelectedStage}
          fitBoundsPadding={mapConfig.fitBoundsPadding}
          zoomControl={mapConfig.zoomControl}
          mobileView={mapConfig.mobileView}
          zoomDelta={mapConfig.zoomDelta}
        />
        <div className="map-legend">
          <div className="ml-item"><span className="ml-dot ml-m" /> Mountain</div>
          <div className="ml-item"><span className="ml-dot ml-h" /> Hilly</div>
          <div className="ml-item"><span className="ml-dot ml-s" /> Sprint</div>
          <div className="ml-item"><span className="ml-dot ml-t" /> TTT / ITT</div>
          <span style={{ color: 'var(--muted)' }}>— click any marker to open that stage</span>
        </div>
      </div>
      <div className="container" id="stage-explorer">
        <StageMobileSelect stages={race.stages} selected={selectedStage} onSelect={setSelectedStage} />
        <div className="tdf-grid">
          <StageSidebar stages={race.stages} selected={selectedStage} onSelect={setSelectedStage} />
          <StageDetail race={race} climbs={climbs} stageNum={selectedStage} stay22Links={stay22Links} />
        </div>
      </div>
    </>
  );
}

// useSearchParams() must be wrapped in Suspense per the App Router, and
// per 3.2, deliberately NOT read in the server component — that would
// opt the whole route into dynamic rendering and lose static generation.
export default function RacePageClient(props: RacePageClientProps) {
  return (
    <Suspense fallback={null}>
      <RacePageClientInner {...props} />
    </Suspense>
  );
}
