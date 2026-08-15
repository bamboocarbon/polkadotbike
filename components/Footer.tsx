import type { ReactNode } from 'react';

export type FooterLink = { href: string; label: string };

interface FooterProps {
  /** The first line — differs per page (race name, data source, or the
   *  Climb Planner's physics-model note). No sane single default exists,
   *  so this is required rather than guessed at. */
  attribution: ReactNode;
  /** The second line's link row. Genuinely differs per page today — e.g.
   *  Giro's footer cross-links to TDF/Vuelta, TDF's and Vuelta's don't.
   *  Pass the exact set the source page currently shows. */
  links: FooterLink[];
}

export default function Footer({ attribution, links }: FooterProps) {
  return (
    <footer>
      <p>{attribution}</p>
      <p style={{ marginTop: 6 }}>
        {links.map((l, i) => (
          <span key={l.href}>
            {i > 0 && ' · '}
            <a href={l.href}>{l.label}</a>
          </span>
        ))}
      </p>
      <p style={{ marginTop: 8, fontSize: '0.85em', opacity: 0.65 }}>
        Also by me:{' '}
        <a
          href="https://digitalcredityield.com"
          target="_blank"
          rel="noopener"
          className="dcy-brand"
        >
          <span className="dcy-square" />
          Digital Credit Yield
        </a>{' '}
        — Bitcoin &amp; Ethereum treasury income, explained.
      </p>
      <p style={{ marginTop: 10 }}>
        <a
          href="https://www.instagram.com/polkadotbike.cc/"
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
          style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 7px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="2" y="2" width="20" height="20" rx="5.5" />
            <circle cx="12" cy="12" r="4.3" />
            <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61591463441672"
          target="_blank"
          rel="noopener"
          aria-label="Facebook"
          style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 7px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 21.9v-8.4h2.82l.42-3.27h-3.24V8.03c0-.95.26-1.6 1.63-1.6h1.74V3.55C16.55 3.47 15.6 3.4 14.5 3.4c-2.33 0-3.93 1.42-3.93 4.03v2.8H7.74v3.27h2.83v8.4h2.93z" />
          </svg>
        </a>
      </p>
    </footer>
  );
}
