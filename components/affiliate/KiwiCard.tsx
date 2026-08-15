'use client';

import { useEffect, useState } from 'react';
import affiliates from '@/data/affiliates.json';

const KIWI_LINKS: Record<string, string> = affiliates.kiwi.links;

export default function KiwiCard() {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((d) => setCountry(d.country))
      .catch(() => {}); // silent failure → falls back to KIWI_LINKS.default, which is the tracked GB link, never a broken/untracked one
  }, []);

  const href = (country && KIWI_LINKS[country]) || KIWI_LINKS.default;

  return (
    <div className="stage-header glass stay-card">
      <div className="stay-card-title">✈️ Fly to the race</div>
      <img className="kiwi-logo-chip" src={affiliates.kiwi.logo} alt="Kiwi.com" />
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Following the race from further afield? Compare flights to the nearest stage town.
      </p>
      <a className="plan-btn kiwi-flight-link" href={href} target="_blank" rel="noopener sponsored">
        Compare flights →
      </a>
      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '10px 0 0' }}>
        Affiliate link — I may earn a small commission at no extra cost to you.
      </p>
    </div>
  );
}
