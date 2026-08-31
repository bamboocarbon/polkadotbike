// Plain data module, deliberately NOT re-exported from RpiMapInner.tsx (a
// 'use client' file that imports leaflet) — a Server Component importing a
// named data export from a 'use client' file gets broken refs at
// prerender/build, not a lint error, so both the map and the page's own
// legend import the colour palette from here instead.
export const ROUTE_COLOR: Record<string, string> = {
  'rpi-harriman': '#22c55e',
  'rpi-dollarhide': '#3b82f6',
  'rpi-fully-loaded': '#ef4444',
  'rpi-baked-potato': '#f97316',
  'rpi-french-fry': '#eab308',
  'rpi-tater-tot': '#a855f7',
};
