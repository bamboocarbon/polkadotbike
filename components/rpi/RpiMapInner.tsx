'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RpiRoute } from '@/data/rpiRoutes';
import { ROUTE_COLOR } from './rpiRouteColors';

export interface RpiMapProps {
  mapId: string;
  routes: RpiRoute[];
}

interface RouteGpxPoint {
  lat: number;
  lon: number;
}

// An overview map doesn't need the GPX's full per-~25m-point precision —
// decimating keeps 6 routes' worth of polylines (21k raw points combined)
// snappy to pan/zoom without any visible loss of shape at this zoom level.
const MAX_POINTS_PER_ROUTE = 300;

function decimate(points: RouteGpxPoint[], max: number): RouteGpxPoint[] {
  if (points.length <= max) return points;
  const stride = Math.ceil(points.length / max);
  const out: RouteGpxPoint[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  out.push(points[points.length - 1]);
  return out;
}

export default function RpiMapInner({ mapId, routes }: RpiMapProps) {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const routesRef = useRef(routes);
  routesRef.current = routes;

  useEffect(() => {
    let cancelled = false;

    const map = L.map(mapId, { scrollWheelZoom: false, zoomSnap: 0.5 });
    mapRef.current = map;

    // Esri World Topo, not OpenTopoMap (Robin, 2026-08-31: "mountain names,
    // towns etc are not big text to see even zoomed in") — that's baked
    // into OpenTopoMap's own tile rendering (label size doesn't scale up
    // with zoom the way the contour lines do), not something CSS can
    // touch. Esri's World Topo Map keeps the same terrain-shaded/contour
    // look but renders noticeably larger, bolder place labels — the
    // standard swap for this exact complaint (it's what leaflet-providers
    // lists as Esri.WorldTopoMap). Note the tile URL's {y}/{x} order —
    // Esri's REST tile scheme is level/row/col (z/y/x), the reverse of
    // the usual {x}/{y}.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles: Esri, HERE, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, GIS User Community',
      maxZoom: 17,
    }).addTo(map);

    // A neutral view of the Ketchum/Sun Valley area while the real route
    // data (fetched below) is still loading — fitBounds below replaces it
    // as soon as the routes are in.
    map.setView([43.7, -114.45], 11);

    (async () => {
      try {
        const results = await Promise.all(
          routesRef.current.map(async (r) => {
            const res = await fetch(`/climbs/routes/${r.slug}.json`);
            const raw: { points: RouteGpxPoint[] } = await res.json();
            return { route: r, points: decimate(raw.points, MAX_POINTS_PER_ROUTE) };
          })
        );
        if (cancelled) return;

        // Longest first, shortest last — Day 3's shorter options are mostly
        // subsets of the longer ones' roads, so drawing short-on-top keeps
        // every route's own colour visible on the shared sections instead
        // of the longest route's line burying the rest.
        results.sort((a, b) => b.route.lengthKm - a.route.lengthKm);

        const allLatLngs: [number, number][] = [];
        results.forEach(({ route, points }) => {
          const latLngs: [number, number][] = points.map((p) => [p.lat, p.lon]);
          allLatLngs.push(...latLngs);
          const color = ROUTE_COLOR[route.slug] || '#94a3b8';

          // A plain coloured line reads fine on the site's dark UI but
          // gets lost against OpenTopoMap's own busy contour/forest
          // texture — a dark casing underneath (wider, drawn first) gives
          // every route line a consistent edge so it stays legible over
          // any tile colour, at any zoom, the way route overlays on
          // Strava/RideWithGPS do it. Not a resolution problem, so
          // zooming in alone never fixed it.
          L.polyline(latLngs, { color: '#0b1220', weight: 7, opacity: 0.65 }).addTo(map);
          L.polyline(latLngs, { color, weight: 4, opacity: 1 }).addTo(map);

          const start = points[0];
          const marker = L.marker([start.lat, start.lon], {
            icon: L.divIcon({
              className: '',
              html: `<div class="rpi-map-dot" style="background:${color}"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
              tooltipAnchor: [0, -10],
            }),
          }).addTo(map);
          marker.bindTooltip(
            `<b>${route.name}</b><br>${route.dayLabel} · ${route.lengthKm.toFixed(0)}km / ${route.ascentM.toLocaleString()}m gain`,
            { className: 'rpi-map-tip', direction: 'top' }
          );
          marker.on('click', () => router.push(`/rebeccas-private-idaho/${route.slug}`));
        });

        if (allLatLngs.length) map.fitBounds(allLatLngs, { padding: [30, 30] });
      } catch (e) {
        if (!cancelled) console.warn(`${mapId} route data unavailable:`, (e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  return <div id={mapId} />;
}
