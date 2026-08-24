'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV: { href: string; label: ReactNode }[] = [
  { href: '/', label: <>Gear<br />Calculator</> },
  { href: '/climb', label: <>Climb<br />Planner</> },
  { href: '/compare', label: <>Groupset<br />Comparator</> },
  { href: '/derailleur', label: <>Derailleur<br />Capacity</> },
  { href: '/wkg', label: <>W/KG<br />and FTP</> },
  { href: '/climbs', label: 'Climbs' },
  { href: '/vuelta', label: 'Vuelta 2026' },
  { href: '/tdf', label: 'TDF 2026' },
  { href: '/giro26', label: 'Giro 2026' },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'Guide' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header>
      <Link className="logo" href="/">
        Polka
        <svg className="logo-dot-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="dotm">
              <rect width="32" height="32" fill="white" />
              <text
                x="16" y="21" textAnchor="middle"
                fontFamily="Inter,system-ui,sans-serif" fontSize="11"
                fontWeight="900" letterSpacing="1.5" fill="black"
              >
                DOT
              </text>
            </mask>
          </defs>
          <circle cx="16" cy="16" r="15" fill="#ef4444" mask="url(#dotm)" />
        </svg>
        <span>Bike</span>
      </Link>
      <nav>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : undefined}
          >
            {item.label}
          </Link>
        ))}
        <a
          href="https://www.instagram.com/polkadotbike.cc/"
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
          style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', color: 'var(--sec)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
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
          style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', color: 'var(--sec)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 21.9v-8.4h2.82l.42-3.27h-3.24V8.03c0-.95.26-1.6 1.63-1.6h1.74V3.55C16.55 3.47 15.6 3.4 14.5 3.4c-2.33 0-3.93 1.42-3.93 4.03v2.8H7.74v3.27h2.83v8.4h2.93z" />
          </svg>
        </a>
      </nav>
    </header>
  );
}
