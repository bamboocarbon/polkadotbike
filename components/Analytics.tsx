'use client';

import Script from 'next/script';
import { useConsent } from './ConsentProvider';
import affiliates from '@/data/affiliates.json';

const GA_ID = affiliates.ga.measurementId;

// Deliberately not @next/third-parties/google — it doesn't respect a
// consent gate without extra work, and the whole point here is that GA
// must not load until the user has accepted.
export default function Analytics() {
  const { choice } = useConsent();

  if (choice !== 'accepted') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
