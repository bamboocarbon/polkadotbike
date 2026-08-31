'use client';

import dynamic from 'next/dynamic';
import type { RpiMapProps } from './RpiMapInner';

// Same reasoning as components/race/RaceMap.tsx: Leaflet touches
// window/document on import and crashes under SSR, and dynamic(...,
// { ssr: false }) is only valid inside a Client Component.
const RpiMapInner = dynamic(() => import('./RpiMapInner'), {
  ssr: false,
  loading: () => <div className="map-skeleton" aria-hidden="true" />,
});

export default function RpiMap(props: RpiMapProps) {
  return <RpiMapInner {...props} />;
}
