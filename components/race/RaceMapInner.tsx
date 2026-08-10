'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import 'leaflet/dist/leaflet.css';
import type { Stage } from '@/lib/raceHelpers';

export interface StageCoord {
  num: number;
  sLat: number;
  sLng: number;
  fLat: number;
  fLng: number;
  anchor?: [number, number];
}

export interface CityLabel {
  num: number;
  end: 's' | 'f';
  name: string;
  cls?: string;
}

export interface CountryLabel {
  lat: number;
  lng: number;
  name: string;
  color: string;
  size?: string;
}

export interface RaceMapProps {
  mapId: string;
  stages: Stage[];
  stageCoords: StageCoord[];
  cityLabels: CityLabel[];
  countryLabels: CountryLabel[];
  /** Natural Earth numeric country id (as a string key) -> fill colour.
   *  A plain object rather than a function deliberately — this crosses
   *  the server/client boundary as a prop (RacePageClient is rendered
   *  from a server component), and functions aren't serializable there. */
  countryFill: Record<string, string>;
  typeColor: Record<string, string>;
  activeStage: number;
  onStageClick: (num: number) => void;
  fitBoundsPadding: [number, number];
  /** TDF/Vuelta: default topright zoom control, mobile view just pans left
   *  by 16px. Giro differs on both (bottomleft control, mobile re-centres
   *  and zooms in on Italy) — pass that config here when Giro is built,
   *  rather than hardcoding TDF's behaviour as if it were universal. */
  zoomControl?: { position: 'topright' | 'bottomleft'; separate?: boolean };
  mobileView?: { type: 'panBy'; dx: number } | { type: 'setView'; center: [number, number]; zoomOffset: number };
  /** Giro's source used 0.5 (matches its zoomSnap) so the +/- buttons step
   *  the same amount as scroll/pinch; TDF/Vuelta never set this, leaving
   *  Leaflet's default of 1. Omit to keep that default. */
  zoomDelta?: number;
}

const TYPE_DOT_CLS: Record<string, string> = {
  Mountain: 'md-m',
  Hilly: 'md-h',
  Sprint: 'md-s',
  TTT: 'md-t',
  ITT: 'md-t',
};

export default function RaceMapInner({
  mapId,
  stages,
  stageCoords,
  cityLabels,
  countryLabels,
  countryFill,
  typeColor,
  activeStage,
  onStageClick,
  fitBoundsPadding,
  zoomControl = { position: 'topright' },
  mobileView = { type: 'panBy', dx: -16 },
  zoomDelta,
}: RaceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, { marker: L.Marker; stage: Stage; anchor?: [number, number] }>>({});
  const activeStageRef = useRef(activeStage);

  // Init once. Leaflet touches `window`/`document` on import, hence this
  // whole component only ever runs client-side (see RaceMap.tsx's
  // dynamic(..., { ssr: false })).
  useEffect(() => {
    let cancelled = false;

    const map = L.map(mapId, {
      scrollWheelZoom: false,
      zoomControl: zoomControl.position === 'topright' && !zoomControl.separate,
      zoomSnap: 0.5,
      ...(zoomDelta !== undefined ? { zoomDelta } : {}),
    });
    if (zoomControl.separate) {
      L.control.zoom({ position: zoomControl.position }).addTo(map);
    }
    mapRef.current = map;
    map.attributionControl.addAttribution('Map data: Natural Earth');

    map.createPane('countries');
    map.getPane('countries')!.style.zIndex = '300';
    map.getPane('countries')!.style.pointerEvents = 'none';
    map.createPane('maplabels');
    map.getPane('maplabels')!.style.zIndex = '450';
    map.getPane('maplabels')!.style.pointerEvents = 'none';

    function makeIcon(num: number, type: string, active: boolean, anchor?: [number, number]) {
      const a = anchor || [11, 11];
      return L.divIcon({
        className: '',
        html: `<div class="map-dot ${TYPE_DOT_CLS[type] || 'md-s'}${active ? ' active' : ''}">${num}</div>`,
        iconSize: [22, 22],
        iconAnchor: a,
        tooltipAnchor: [0, -14],
      });
    }

    const markers: Record<number, { marker: L.Marker; stage: Stage; anchor?: [number, number] }> = {};

    stageCoords.forEach((sc, i) => {
      const stage = stages.find((s) => s.num === sc.num);
      if (!stage) return;
      const col = typeColor[stage.type] || '#94a3b8';

      L.polyline([[sc.sLat, sc.sLng], [sc.fLat, sc.fLng]], { color: col, weight: 3.5, opacity: 0.85 }).addTo(map);

      if (i < stageCoords.length - 1) {
        const nx = stageCoords[i + 1];
        if (Math.hypot(sc.fLat - nx.sLat, sc.fLng - nx.sLng) > 0.02) {
          L.polyline([[sc.fLat, sc.fLng], [nx.sLat, nx.sLng]], {
            color: '#000000', weight: 2, opacity: 0.85, dashArray: '4 6',
          }).addTo(map);
        }
      }

      const marker = L.marker([sc.fLat, sc.fLng], {
        icon: makeIcon(sc.num, stage.type, sc.num === activeStageRef.current, sc.anchor),
        zIndexOffset: sc.num * 10,
      }).addTo(map);

      marker.bindTooltip(
        `<b>Stage ${sc.num}</b> · ${stage.start} → ${stage.finish}<br>${stage.dist} km · ${stage.type}`,
        { className: 'map-tip', direction: 'top', offset: [0, -12] }
      );
      marker.on('click', () => onStageClick(sc.num));
      markers[sc.num] = { marker, stage, anchor: sc.anchor };
    });
    markersRef.current = markers;

    const pts = stageCoords.flatMap((sc) => [[sc.sLat, sc.sLng], [sc.fLat, sc.fLng]] as [number, number][]);
    map.fitBounds(pts, { padding: fitBoundsPadding });

    if (window.innerWidth <= 768) {
      if (mobileView.type === 'panBy') {
        map.panBy([mobileView.dx, 0], { animate: false });
      } else {
        map.setView(mobileView.center, map.getZoom() + mobileView.zoomOffset, { animate: false });
      }
    } else if (mobileView.type === 'panBy') {
      map.zoomIn(0.5, { animate: false });
    }
    map.setMinZoom(map.getZoom());

    cityLabels.forEach((c) => {
      const sc = stageCoords.find((x) => x.num === c.num);
      if (!sc) return;
      const lat = c.end === 's' ? sc.sLat : sc.fLat;
      const lng = c.end === 's' ? sc.sLng : sc.fLng;
      L.marker([lat, lng], {
        pane: 'maplabels', interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', html: `<div class="map-city ${c.cls || ''}">${c.name}</div>`, iconSize: [0, 0] }),
      }).addTo(map);
    });

    countryLabels.forEach((c) => {
      const style = `color:${c.color}${c.size ? `;font-size:${c.size};letter-spacing:0.12em` : ''}`;
      L.marker([c.lat, c.lng], {
        pane: 'maplabels', interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', html: `<div class="map-country" style="${style}">${c.name}</div>`, iconSize: [0, 0] }),
      }).addTo(map);
    });

    (async () => {
      try {
        const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then((r) => r.json());
        // Guard against the effect having been torn down while this fetch
        // was in flight (React 18 StrictMode double-invokes effects in dev,
        // and the first invocation's cleanup can fire before its own fetch
        // resolves) — without this, .addTo() throws trying to touch an
        // already-removed map's panes.
        if (cancelled) return;
        L.geoJSON(topojson.feature(world as any, (world as any).objects.countries) as any, {
          pane: 'countries',
          filter: (f: any) => countryFill[String(f.id)] !== undefined,
          style: (f: any) => ({ fillColor: countryFill[String(f.id)] || '#fff3b8', fillOpacity: 1, weight: 0 }),
        }).addTo(map);
      } catch (e) {
        if (!cancelled) console.warn(`${mapId} country layer unavailable:`, (e as Error).message);
      } finally {
        if (!cancelled) {
          // Applied only after fills are in — doing it earlier skews the
          // polygons against the markers (confirmed source-code comment,
          // ported verbatim as a real footgun, not overcautious).
          map.setMaxBounds(L.latLngBounds(pts).pad(0.6));
        }
      }
    })();

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // Keep the active marker in sync with the selected stage without
  // rebuilding the whole map.
  useEffect(() => {
    const prev = activeStageRef.current;
    const markers = markersRef.current;
    if (prev !== activeStage) {
      if (markers[prev]) {
        const { marker, stage, anchor } = markers[prev];
        marker.setIcon(
          L.divIcon({
            className: '',
            html: `<div class="map-dot ${TYPE_DOT_CLS[stage.type] || 'md-s'}">${prev}</div>`,
            iconSize: [22, 22], iconAnchor: anchor || [11, 11], tooltipAnchor: [0, -14],
          })
        );
      }
      if (markers[activeStage]) {
        const { marker, stage, anchor } = markers[activeStage];
        marker.setIcon(
          L.divIcon({
            className: '',
            html: `<div class="map-dot ${TYPE_DOT_CLS[stage.type] || 'md-s'} active">${activeStage}</div>`,
            iconSize: [22, 22], iconAnchor: anchor || [11, 11], tooltipAnchor: [0, -14],
          })
        );
      }
      activeStageRef.current = activeStage;
    }
  }, [activeStage]);

  return <div id={mapId} />;
}
