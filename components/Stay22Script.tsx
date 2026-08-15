'use client';

import Script from 'next/script';
import affiliates from '@/data/affiliates.json';

declare global {
  interface Window {
    Stay22?: { params?: { lmaID: string } };
  }
}

// The tasksheet's premise was that the source pages load letmeallez.js
// twice (a plain <script async src> plus this IIFE). Checked all three
// race pages directly — that's not the case today, there's only ever the
// one IIFE. Porting it as a single next/script loader regardless, since
// that's the correct end state either way; noting the discrepancy rather
// than silently assuming the tasksheet's description was accurate.
export default function Stay22Script() {
  return (
    <Script
      src={affiliates.stay22.script}
      strategy="afterInteractive"
      onReady={() => {
        window.Stay22 = window.Stay22 || {};
        window.Stay22.params = { lmaID: affiliates.stay22.lmaID };
      }}
    />
  );
}
