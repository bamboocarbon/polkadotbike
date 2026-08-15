import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import '@/components/content/content.css';

export const metadata: Metadata = {
  title: { absolute: 'Page not found — Polka Dot Bike' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#ef4444',
};

export default function NotFound() {
  return (
    <>
      <div className="hero">
        <h1>Page not found</h1>
        <p>That link has gone up the road without us — the page doesn&apos;t exist here.</p>
      </div>

      <div className="container" style={{ maxWidth: 680 }}>
        <div className="glass card">
          <p><b>404 — nothing at this address.</b> The page may have moved, or the link had a typo in it. Everything on the site is one click away:</p>
        </div>

        <div className="glass list">
          <h2>Try one of these</h2>
          <ul>
            <li><a href="/" style={{ color: 'var(--text)' }}>Gear Ratio Calculator</a> <span>— every gear, laid out visually</span></li>
            <li><a href="/tdf" style={{ color: 'var(--text)' }}>Tour de France 2026</a> <span>— every stage and climb of this year&apos;s route</span></li>
            <li><a href="/climb" style={{ color: 'var(--text)' }}>Climb Planner</a> <span>— the gearing you&apos;d need for any gradient</span></li>
            <li><a href="/compare" style={{ color: 'var(--text)' }}>Groupset Comparator</a> <span>— two setups side by side</span></li>
            <li><a href="/guide" style={{ color: 'var(--text)' }}>Site guide</a> <span>— what everything does</span></li>
          </ul>
        </div>
      </div>

      <Footer
        attribution={<span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span>}
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/about', label: 'About' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
