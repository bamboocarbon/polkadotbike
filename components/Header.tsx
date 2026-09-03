'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

// Split into two rows (2026-08-31, Robin) now the nav has grown past what one
// row can hold: row 1 keeps the original five gear calculators, row 2 takes
// climbs/races/rides plus the info pages (About/Guide/Glossary/Contact —
// Robin's call: tacked onto the end of row 2, not a third row of their own).
const NAV_ROW_1: { href: string; label: ReactNode }[] = [
  { href: '/', label: <>Gear<br />Calculator</> },
  { href: '/climb', label: <>Climb<br />Planner</> },
  { href: '/compare', label: <>Groupset<br />Comparator</> },
  { href: '/derailleur', label: <>Derailleur<br />Capacity</> },
  { href: '/wkg', label: <>W/KG<br />and FTP</> },
];
const NAV_ROW_2: { href: string; label: ReactNode }[] = [
  { href: '/climbs', label: 'Climbs' },
  { href: '/vuelta', label: 'Vuelta 2026' },
  { href: '/tdf', label: 'TDF 2026' },
  { href: '/giro26', label: 'Giro 2026' },
  { href: '/rebeccas-private-idaho', label: <>Rebecca&apos;s<br />Private Idaho</> },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'Guide' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/contact', label: 'Contact' },
];

// Publishes the header's real rendered height as --header-h on the root
// element, since it's no longer a fixed 54px now the nav wraps onto two
// rows — and row 2 can itself wrap to a third line below ~1000px width
// (9 items + 2 social icons). Every sticky panel/scroll-anchor sitewide
// reads --header-h instead of a hardcoded 70px so it stays correctly
// offset at every width. ResizeObserver (not just a window resize
// listener) because the height change here is driven by content
// reflowing within a fixed-width header, not the header's own box
// resizing in a way a resize listener would catch on its own.
function useHeaderHeightVar() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return ref;
}

export default function Header() {
  const pathname = usePathname();
  const headerRef = useHeaderHeightVar();

  return (
    <header ref={headerRef}>
      <Link className="logo" href="/" prefetch={false}>
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
      <div className="nav-rows">
        <nav>
          {NAV_ROW_1.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={pathname === item.href ? 'active' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <nav>
          {NAV_ROW_2.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
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
          <a
            href="https://x.com/polkadotbike"
            target="_blank"
            rel="noopener"
            aria-label="X (Twitter)"
            style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', color: 'var(--sec)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}
