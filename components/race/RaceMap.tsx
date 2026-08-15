'use client';

import dynamic from 'next/dynamic';
import type { RaceMapProps } from './RaceMapInner';

// Leaflet touches `window`/`document` on import and crashes under SSR.
// dynamic(..., { ssr: false }) is only valid inside a Client Component in
// the App Router — hence this thin wrapper carrying 'use client', rather
// than calling dynamic() directly from a server component.
const RaceMapInner = dynamic(() => import('./RaceMapInner'), {
  ssr: false,
  loading: () => <div className="map-skeleton" aria-hidden="true" />,
});

export default function RaceMap(props: RaceMapProps) {
  return <RaceMapInner {...props} />;
}
