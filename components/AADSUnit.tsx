'use client';

import affiliates from '@/data/affiliates.json';
import { useConsent } from './ConsentProvider';

// A-Ads' own iframe sets cookies and serves interest-based ads (see
// https://aads.com/privacy_policy/) — gated the same way as Google
// Analytics (components/Analytics.tsx), so it doesn't load for EEA/UK
// visitors before they accept. Outside that region, ConsentProvider
// already auto-sets choice to 'accepted' with no prompt.
export default function AADSUnit() {
  const { choice } = useConsent();
  if (choice !== 'accepted') return null;

  return (
    <div id="frame" style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
      <iframe
        data-aa={affiliates.aads.unitId}
        src={`${affiliates.aads.src}`}
        style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: 'auto' }}
      />
    </div>
  );
}
