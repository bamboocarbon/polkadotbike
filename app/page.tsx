import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import GearCalculator from '@/components/index/GearCalculator';
import '@/components/index/index.css';

const PAGE_URL = 'https://polkadotbike.com/';
const TITLE = 'Bike Gear Ratio & Gear Inches Calculator · Polka Dot Bike';
const DESCRIPTION =
  'Free bike gear ratio and gear-inches calculator, drawing on 117 Shimano, SRAM and Campagnolo groupsets across road, MTB and gravel.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  // Impact affiliate-network domain verification tag — index.html only.
  other: { 'impact-site-verification': '9d449fd5-72cb-4b4c-9ac1-d832e995bdd8' },
  openGraph: {
    type: 'website',
    siteName: 'Polka Dot Bike',
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: 'https://polkadotbike.com/og-card.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://polkadotbike.com/og-card.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#ef4444',
};

function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${PAGE_URL}#app`,
      name: 'Polka Dot Bike',
      url: PAGE_URL,
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      description:
        'Free road-cycling calculators: gear ratios and gear inches, a climb planner, groupset and cassette comparator, derailleur capacity checker, W/kg power profile, and Tour de France and Giro d’Italia 2026 climb browsers.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      author: { '@type': 'Person', name: 'Robin Gillingham', url: 'https://polkadotbike.com/about' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${PAGE_URL}#website`,
      url: PAGE_URL,
      name: 'Polka Dot Bike',
      description:
        'Free cycling gearing tools: gear ratio calculator, climb planner, groupset comparator, derailleur capacity checker and W/kg calculator.',
      publisher: { '@type': 'Person', name: 'Robin Gillingham', url: 'https://polkadotbike.com/about' },
    },
  ];
}

export default function HomePage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      {/* Same nav-active/logo override as the other calculator pages —
          the "bold UCI palette" block's own brand-tab rules are baked
          directly into index.css since they're genuinely load-bearing
          here (this page has real brand-tab elements). */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        nav a.active { color: var(--accent); }
        .logo span { color: #fff; }
        .hero > h1 { font-size: clamp(28px, 5vw, 48px); }
      `,
        }}
      />

      <div className="hero">
        <h1>Gear Ratio Calculator</h1>
        <p>Select your groupset and instantly see every gear, speed, development and steps.</p>
        <p style={{ marginTop: 6, opacity: 0.72 }}>117 groupsets in the database — Shimano, SRAM and Campagnolo, road to gravel.</p>
        <div
          className="hero-bikes"
          style={{
            flexBasis: '100%', maxWidth: 1120, margin: '12px auto 0', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', fontSize: 28, fontWeight: 900,
            letterSpacing: '-1px', color: '#0f172a',
          }}
        >
          <span>Road Bikes</span><span>Mountain Bikes</span><span>Gravel Bikes</span>
        </div>
      </div>

      <div className="container">
        <GearCalculator />
      </div>

      <AADSUnit />

      <Footer
        attribution={
          <>
            <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> — Calculations are indicative. Actual
            performance depends on conditions and rider position.
          </>
        }
        links={[
          { href: '/about', label: 'About' },
          { href: '/guide', label: 'Guide' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
          { href: '/contact', label: 'Contact' },
        ]}
      />
    </>
  );
}
