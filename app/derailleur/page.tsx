import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import DerailleurCalculator from '@/components/derailleur/DerailleurCalculator';
import '@/components/derailleur/derailleur.css';

const PAGE_URL = 'https://polkadotbike.com/derailleur';
const TITLE = 'Derailleur Capacity Calculator · Polka Dot Bike';
const DESCRIPTION =
  'Check whether a cassette and chainring combo fits your rear derailleur. Enter your ratios and see total capacity versus the maximum your mech can wrap.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
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
      name: 'Derailleur Capacity Checker',
      url: PAGE_URL,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      description: DESCRIPTION,
      author: { '@type': 'Person', name: 'Robin Gillingham', url: 'https://polkadotbike.com/about' },
      isPartOf: { '@id': 'https://polkadotbike.com/#website' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'Derailleur Capacity', item: PAGE_URL },
      ],
    },
  ];
}

export default function DerailleurPage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      {/* This page's own "bold UCI palette" theme is unconditional in the
          source (not a per-page accent choice like Giro/Vuelta's race
          pages) — its .filter-btn[data-fbrand] rules are genuinely load-
          bearing UI here, unlike the same block being dead weight on the
          content/race pages. Ported as the page's real, active styling. */}
      <style>{`
        nav a.active { color: #1a72e0; }
        .logo span { color: #fff; }
      `}</style>

      <div className="hero">
        <h1>Derailleur Capacity</h1>
        <p>Enter your chainring and cassette sizes — see instantly which derailleurs can handle your setup.</p>
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
        <DerailleurCalculator />
      </div>

      <AADSUnit />

      <Footer
        attribution="Polka Dot Bike — Capacity figures from published manufacturer specifications. Always verify with your derailleur's manual."
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/climb', label: 'Climb Planner' },
          { href: '/guide', label: 'Guide' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy.html', label: 'Privacy' },
          { href: '/disclaimer.html', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
