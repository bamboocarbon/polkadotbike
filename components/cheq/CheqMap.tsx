'use client';

import dynamic from 'next/dynamic';
import type { CheqMapProps } from './CheqMapInner';

// Same reasoning as components/rpi/RpiMap.tsx: Leaflet touches
// window/document on import and crashes under SSR, and dynamic(...,
// { ssr: false }) is only valid inside a Client Component.
const CheqMapInner = dynamic(() => import('./CheqMapInner'), {
  ssr: false,
  loading: () => <div className="map-skeleton" aria-hidden="true" />,
});

export default function CheqMap(props: CheqMapProps) {
  return <CheqMapInner {...props} />;
}
