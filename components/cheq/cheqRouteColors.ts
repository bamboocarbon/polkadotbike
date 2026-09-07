// Plain data module, deliberately NOT re-exported from CheqMapInner.tsx (a
// 'use client' file that imports leaflet) — a Server Component importing a
// named data export from a 'use client' file gets broken refs at
// prerender/build, not a lint error, so both the map and the page's own
// legend import the colour palette from here instead. Same pattern as
// components/rpi/rpiRouteColors.ts.
export const ROUTE_COLOR: Record<string, string> = {
  'cheq-40': '#ef4444',
  'cheq-40-pro': '#f97316',
  'cheq-short-fat': '#3b82f6',
};
