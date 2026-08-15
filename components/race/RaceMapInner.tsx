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
  /** Static placement mode only (TDF/Giro) — a fixed CSS offset class. */
  cls?: string;
  /** Dynamic placement mode only (Vuelta) — preferred side, overridden
   *  when it collides with a route line/dot/other label. */
  pref?: 'left' | 'right' | 'top' | 'bottom';
  /** Dynamic placement mode only — hidden until the user zooms in past the
   *  initial fitBounds view (Vuelta's southern cluster is too tightly
   *  packed to label at the default zoom). */
  dense?: boolean;
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
  /** TDF/Vuelta: `zoomControl: true`, no `separate`, mobile view just pans
   *  left by 16px. Giro differs on both (its own `L.control.zoom` at
   *  bottomleft, mobile re-centres and zooms in on Italy).
   *  Note `position: 'topright'` here is really just "not separate" —
   *  Leaflet's built-in `zoomControl: true` option always renders
   *  top-left regardless of this field; `position` only takes effect when
   *  `separate` is true and a real `L.control.zoom({position})` gets
   *  constructed (Giro's path). TDF's and Vuelta's own sources both just
   *  use the plain boolean too, so both genuinely render top-left — this
   *  isn't a gap, just a label that doesn't mean what it sounds like. */
  zoomControl?: { position: 'topright' | 'bottomleft'; separate?: boolean };
  mobileView?: { type: 'panBy'; dx: number } | { type: 'setView'; center: [number, number]; zoomOffset: number };
  /** Giro's source used 0.5 (matches its zoomSnap) so the +/- buttons step
   *  the same amount as scroll/pinch; TDF/Vuelta never set this, leaving
   *  Leaflet's default of 1. Omit to keep that default. */
  zoomDelta?: number;
  /** Marker dot CSS class per stage type. Defaults to TDF/Giro's shared
   *  palette; Vuelta needs its own (its Mountain is yellow, not red, and
   *  it has a Medium type TDF/Giro don't) — see race.css's md-vm/md-mm. */
  typeDotCls?: Record<string, string>;
  /** TDF/Giro's marker tooltips always open above the dot; Vuelta's source
   *  used Leaflet's 'auto' (flips near map edges) instead. Defaults to
   *  'top' to match the two pages already built. */
  tooltipDirection?: 'top' | 'auto';
  /** TDF's source zooms in one extra step on desktop after fitBounds;
   *  Giro/Vuelta's sources don't. This used to be inferred from
   *  `mobileView.type === 'panBy'`, which happened to be right for TDF but
   *  would have wrongly also fired for Vuelta (same panBy mobile config,
   *  no desktop zoomIn in its source) — now explicit per race instead of
   *  guessed from an unrelated field. */
  zoomInOnDesktop?: boolean;
  /** 'static' (default): TDF/Giro's fixed-offset city labels, positioned
   *  once via a CSS class. 'dynamic': Vuelta's collision-avoidance system —
   *  recomputes each label's side on every zoom/pan to dodge route lines,
   *  stage dots and other labels, and hides `dense` labels until zoomed
   *  in. A real behavioural difference in the source, not a gap. */
  labelPlacement?: 'static' | 'dynamic';
}

const TYPE_DOT_CLS: Record<string, string> = {
  Mountain: 'md-m',
  Hilly: 'md-h',
  Sprint: 'md-s',
  TTT: 'md-t',
  ITT: 'md-t',
};

// Vuelta's dynamic city-label placement — pure geometry helpers, ported
// verbatim from the source's own collision-avoidance functions.
type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Circle = { x: number; y: number; r: number };

function segsIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (d === 0) return false;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
function segIntersectsRect(p1: Pt, p2: Pt, rect: Rect): boolean {
  const segMinX = Math.min(p1.x, p2.x), segMaxX = Math.max(p1.x, p2.x);
  const segMinY = Math.min(p1.y, p2.y), segMaxY = Math.max(p1.y, p2.y);
  if (segMaxX < rect.x || segMinX > rect.x + rect.w || segMaxY < rect.y || segMinY > rect.y + rect.h) return false;
  const inside = (pt: Pt) => pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
  if (inside(p1) || inside(p2)) return true;
  const c1 = { x: rect.x, y: rect.y }, c2 = { x: rect.x + rect.w, y: rect.y };
  const c3 = { x: rect.x + rect.w, y: rect.y + rect.h }, c4 = { x: rect.x, y: rect.y + rect.h };
  return segsIntersect(p1, p2, c1, c2) || segsIntersect(p1, p2, c2, c3) ||
    segsIntersect(p1, p2, c3, c4) || segsIntersect(p1, p2, c4, c1);
}
function circleIntersectsRect(c: Circle, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(c.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(c.y, rect.y + rect.h));
  const dx = c.x - closestX, dy = c.y - closestY;
  return dx * dx + dy * dy <= c.r * c.r;
}
function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

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
  typeDotCls = TYPE_DOT_CLS,
  tooltipDirection = 'top',
  zoomInOnDesktop = false,
  labelPlacement = 'static',
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
        html: `<div class="map-dot ${typeDotCls[type] || 'md-s'}${active ? ' active' : ''}">${num}</div>`,
        iconSize: [22, 22],
        iconAnchor: a,
        // Zeroed deliberately: a fixed [0,-14] here would double up with
        // updateTooltipPlacements()'s own dynamic offset below (which owns
        // the gap for whichever direction it picks), under-counting the
        // space needed above the dot for 'top' and cancelling the gap
        // entirely for 'bottom'.
        tooltipAnchor: [0, 0],
      });
    }

    const markers: Record<number, { marker: L.Marker; stage: Stage; anchor?: [number, number] }> = {};
    // Only consumed in 'dynamic' label-placement mode, but cheap to collect
    // unconditionally rather than duplicate this loop.
    const obstacleSegments: [L.LatLngExpression, L.LatLngExpression][] = [];
    const obstaclePoints: L.LatLngExpression[] = [];

    // Stage tooltips: edge-avoidance below needs each one's real rendered
    // size — city names vary a lot in length, and a guessed box (canvas
    // text metrics, CSS line-height assumptions) undershot the actual
    // height, leaving some stages still clipped. Measured properly below,
    // once each tooltip has been opened onto the DOM.
    const tooltipEntries: { marker: L.Marker; w: number; h: number }[] = [];

    stageCoords.forEach((sc, i) => {
      const stage = stages.find((s) => s.num === sc.num);
      if (!stage) return;
      const col = typeColor[stage.type] || '#94a3b8';

      L.polyline([[sc.sLat, sc.sLng], [sc.fLat, sc.fLng]], { color: col, weight: 3.5, opacity: 0.85 }).addTo(map);
      obstacleSegments.push([[sc.sLat, sc.sLng], [sc.fLat, sc.fLng]]);

      if (i < stageCoords.length - 1) {
        const nx = stageCoords[i + 1];
        if (Math.hypot(sc.fLat - nx.sLat, sc.fLng - nx.sLng) > 0.02) {
          L.polyline([[sc.fLat, sc.fLng], [nx.sLat, nx.sLng]], {
            color: '#000000', weight: 2, opacity: 0.85, dashArray: '4 6',
          }).addTo(map);
          obstacleSegments.push([[sc.fLat, sc.fLng], [nx.sLat, nx.sLng]]);
        }
      }
      obstaclePoints.push([sc.fLat, sc.fLng]);

      const marker = L.marker([sc.fLat, sc.fLng], {
        icon: makeIcon(sc.num, stage.type, sc.num === activeStageRef.current, sc.anchor),
        zIndexOffset: sc.num * 10,
      }).addTo(map);

      marker.bindTooltip(
        `<b>Stage ${sc.num}</b> · ${stage.start} → ${stage.finish}<br>${stage.dist} km · ${stage.type}`,
        { className: 'map-tip', direction: tooltipDirection, offset: [0, -12] }
      );
      marker.on('click', () => onStageClick(sc.num));
      markers[sc.num] = { marker, stage, anchor: sc.anchor };
      tooltipEntries.push({ marker, w: 0, h: 0 });
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
    } else if (zoomInOnDesktop) {
      map.zoomIn(0.5, { animate: false });
    }
    map.setMinZoom(map.getZoom());
    const initialZoom = map.getZoom();

    // Force each tooltip onto the DOM once, synchronously open+close before
    // the browser paints, to read its real offsetWidth/offsetHeight — must
    // run after the map has a defined view (fitBounds above), since opening
    // a tooltip needs a center/zoom to project against.
    tooltipEntries.forEach((entry) => {
      entry.marker.openTooltip();
      const el = entry.marker.getTooltip()?.getElement();
      if (el) {
        entry.w = el.offsetWidth;
        entry.h = el.offsetHeight;
      }
      entry.marker.closeTooltip();
    });

    // Stage tooltips: Leaflet has no built-in edge-avoidance for tooltips
    // (unlike popups, which auto-pan) — a tooltip pinned to a fixed
    // direction can render partly or fully outside the visible map area
    // when its dot sits near an edge. Recomputed on every zoom/pan since
    // panning changes which dots are near an edge.
    const GAP = 14;
    function updateTooltipPlacements() {
      const size = map.getSize();
      tooltipEntries.forEach(({ marker, w, h }) => {
        const tooltip = marker.getTooltip();
        if (!tooltip) return;
        const pt = map.latLngToContainerPoint(marker.getLatLng());
        let direction: 'top' | 'bottom' | 'left' | 'right';

        if (tooltipDirection === 'auto') {
          const spaceLeft = pt.x, spaceRight = size.x - pt.x;
          direction = spaceRight >= spaceLeft ? 'right' : 'left';
          if (direction === 'right' && spaceRight < w + GAP && spaceLeft > spaceRight) direction = 'left';
          if (direction === 'left' && spaceLeft < w + GAP && spaceRight > spaceLeft) direction = 'right';
        } else {
          const spaceAbove = pt.y, spaceBelow = size.y - pt.y;
          direction = spaceAbove < h + GAP && spaceBelow > spaceAbove ? 'bottom' : 'top';
        }

        let offsetX = 0;
        let offsetY = direction === 'top' ? -GAP : direction === 'bottom' ? GAP : 0;
        if (direction === 'top' || direction === 'bottom') {
          const overflowRight = pt.x + w / 2 - size.x;
          const overflowLeft = w / 2 - pt.x;
          if (overflowRight > 0) offsetX = -overflowRight - 6;
          else if (overflowLeft > 0) offsetX = overflowLeft + 6;
        } else {
          const overflowBottom = pt.y + h / 2 - size.y;
          const overflowTop = h / 2 - pt.y;
          if (overflowBottom > 0) offsetY = -overflowBottom - 6;
          else if (overflowTop > 0) offsetY = overflowTop + 6;
        }

        tooltip.options.direction = direction;
        tooltip.options.offset = L.point([offsetX, offsetY]);
      });
    }
    updateTooltipPlacements();
    map.on('zoomend moveend', updateTooltipPlacements);

    if (labelPlacement === 'dynamic') {
      const cityLabelMarkers: { marker: L.Marker; name: string; pref: 'left' | 'right' | 'top' | 'bottom'; dense: boolean }[] = [];
      cityLabels.forEach((c) => {
        const sc = stageCoords.find((x) => x.num === c.num);
        if (!sc) return;
        const lat = c.end === 's' ? sc.sLat : sc.fLat;
        const lng = c.end === 's' ? sc.sLng : sc.fLng;
        const marker = L.marker([lat, lng], {
          pane: 'maplabels', interactive: false, keyboard: false,
          icon: L.divIcon({ className: '', html: `<div class="map-city">${c.name}</div>`, iconSize: [0, 0] }),
        }).addTo(map);
        cityLabelMarkers.push({ marker, name: c.name, pref: c.pref || 'right', dense: !!c.dense });
      });

      // City labels: exactly one fixed distance from their dot in one of 4
      // cardinal directions, chosen by checking each against route lines,
      // transit dashes, stage dots and already-placed labels — ported
      // verbatim from Vuelta's source, same algorithm as the geometry
      // helpers above.
      const measureCtx = document.createElement('canvas').getContext('2d')!;
      measureCtx.font = '600 10.5px Inter, system-ui, sans-serif';
      const textWidth = (str: string) => measureCtx.measureText(str).width;

      function placeCityLabels() {
        const DIST = map.getZoom() > initialZoom ? 20 : 10, DOT_R = 11, pad = 3;
        const segPx = obstacleSegments.map(([a, b]) => [map.latLngToContainerPoint(a), map.latLngToContainerPoint(b)] as [Pt, Pt]);
        const ptPx = obstaclePoints.map((p) => map.latLngToContainerPoint(p) as Pt);
        const placedRects: Rect[] = [];

        cityLabelMarkers.forEach(({ marker, name, pref, dense }) => {
          const el = marker.getElement();
          if (!el) return;
          const inner = el.querySelector('.map-city') as HTMLElement | null;
          if (!inner) return;

          if (dense && map.getZoom() <= initialZoom) {
            inner.style.display = 'none';
            return;
          }
          inner.style.display = '';

          const anchor = map.latLngToContainerPoint(marker.getLatLng());
          const w = textWidth(name), h = 14;
          const dirs: Record<string, { dx: number; dy: number }> = {
            right: { dx: DIST, dy: -h / 2 },
            left: { dx: -DIST - w, dy: -h / 2 },
            top: { dx: -w / 2, dy: -DIST - h },
            bottom: { dx: -w / 2, dy: DIST },
          };
          const order = [pref, ...Object.keys(dirs).filter((k) => k !== pref)];

          let chosen = dirs[order[0]], chosenRect: Rect | null = null, bestScore = Infinity;
          for (const key of order) {
            const o = dirs[key];
            const rect: Rect = { x: anchor.x + o.dx - pad, y: anchor.y + o.dy - pad, w: w + pad * 2, h: h + pad * 2 };
            const segHits = segPx.filter(([a, b]) => segIntersectsRect(a, b, rect)).length;
            const ptHits = ptPx.filter((p) => circleIntersectsRect({ x: p.x, y: p.y, r: DOT_R }, rect)).length;
            const labelHits = placedRects.filter((r) => rectsOverlap(rect, r)).length;
            const score = segHits + ptHits + labelHits;
            if (score < bestScore) { bestScore = score; chosen = o; chosenRect = rect; }
            if (score === 0) break;
          }
          if (chosenRect) placedRects.push(chosenRect);
          inner.style.transform = `translate(${chosen.dx}px, ${chosen.dy}px)`;
        });
      }

      placeCityLabels();
      map.on('zoomend moveend', placeCityLabels);
    } else {
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
    }

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
            html: `<div class="map-dot ${typeDotCls[stage.type] || 'md-s'}">${prev}</div>`,
            iconSize: [22, 22], iconAnchor: anchor || [11, 11], tooltipAnchor: [0, 0],
          })
        );
      }
      if (markers[activeStage]) {
        const { marker, stage, anchor } = markers[activeStage];
        marker.setIcon(
          L.divIcon({
            className: '',
            html: `<div class="map-dot ${typeDotCls[stage.type] || 'md-s'} active">${activeStage}</div>`,
            iconSize: [22, 22], iconAnchor: anchor || [11, 11], tooltipAnchor: [0, 0],
          })
        );
      }
      activeStageRef.current = activeStage;
    }
  }, [activeStage, typeDotCls]);

  return <div id={mapId} />;
}
