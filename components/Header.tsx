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
  { href: '/giro26', label: 'Giro 2026' },
  { href: '/tdf', label: 'TDF 2026' },
  { href: '/vuelta', label: 'Vuelta 2026' },
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
      </nav>
    </header>
  );
}
