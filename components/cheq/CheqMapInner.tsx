'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CheqRoute } from '@/data/cheqRoutes';
import { ROUTE_COLOR } from './cheqRouteColors';

export interface CheqMapProps {
  mapId: string;
  routes: CheqRoute[];
}

interface RouteGpxPoint {
  lat: number;
  lon: number;
}

// Same decimation as RpiMapInner — an overview map doesn't need the GPX's
// full per-~10m-point precision.
const MAX_POINTS_PER_ROUTE = 300;

function decimate(points: RouteGpxPoint[], max: number): RouteGpxPoint[] {
  if (points.length <= max) return points;
  const stride = Math.ceil(points.length / max);
  const out: RouteGpxPoint[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  out.push(points[points.length - 1]);
  return out;
}

export default function CheqMapInner({ mapId, routes }: CheqMapProps) {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const routesRef = useRef(routes);
  routesRef.current = routes;

  useEffect(() => {
    let cancelled = false;

    const map = L.map(mapId, { scrollWheelZoom: false, zoomSnap: 0.5 });
    mapRef.current = map;

    // Esri World Topo — same choice as RpiMapInner (bigger, bolder place
    // labels than OpenTopoMap at any given zoom), useful here too since
    // Hayward/Cable are small Northwoods towns that need to stay legible.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles: Esri, HERE, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, GIS User Community',
      maxZoom: 17,
    }).addTo(map);

    // A neutral view of the Hayward/Cable, WI area while the real route
    // data (fetched below) is still loading — fitBounds below replaces it
    // as soon as the routes are in.
    map.setView([46.1, -91.37], 11);

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

        // Longest first, shortest last — the 40/40-Pro courses share most
        // of their finishing miles with each other, so drawing the
        // shortest (Short & Fat) on top keeps every route's own colour
        // visible on shared sections instead of the longest line burying
        // the rest. Same convention as RpiMapInner.
        results.sort((a, b) => b.route.lengthKm - a.route.lengthKm);

        const allLatLngs: [number, number][] = [];
        results.forEach(({ route, points }) => {
          const latLngs: [number, number][] = points.map((p) => [p.lat, p.lon]);
          allLatLngs.push(...latLngs);
          const color = ROUTE_COLOR[route.slug] || '#94a3b8';

          L.polyline(latLngs, { color: '#0b1220', weight: 7, opacity: 0.65 }).addTo(map);
          L.polyline(latLngs, { color, weight: 4, opacity: 1 }).addTo(map);

          const start = points[0];
          const marker = L.marker([start.lat, start.lon], {
            icon: L.divIcon({
              className: '',
              html: `<div class="cheq-map-dot" style="background:${color}"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
              tooltipAnchor: [0, -10],
            }),
          }).addTo(map);
          marker.bindTooltip(
            `<b>${route.name}</b><br>${route.lengthMi.toFixed(1)}mi / ${route.ascentFt.toLocaleString()}ft gain`,
            { className: 'cheq-map-tip', direction: 'top' }
          );
          marker.on('click', () => router.push(`/chequamegon/${route.slug}`));
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
