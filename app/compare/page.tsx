import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import CompareTool from '@/components/compare/CompareTool';
import '@/components/compare/compare.css';

const PAGE_URL = 'https://polkadotbike.com/compare';
const TITLE = 'Bike Groupset & Cassette Comparator · Polka Dot Bike';
const DESCRIPTION =
  'Compare road-bike groupsets and cassettes side by side — Shimano, SRAM and Campagnolo gear ranges, ratios and gaps — to pick the right setup for your riding.';

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
      name: 'Groupset Comparator',
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
        { '@type': 'ListItem', position: 2, name: 'Groupset Comparator', item: PAGE_URL },
      ],
    },
  ];
}

export default function ComparePage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      <style>{`
        nav a.active { color: #1a72e0; }
        .logo span { color: #fff; }
      `}</style>

      <div className="hero">
        <h1>Groupset Comparator</h1>
        <p>Plot two drivetrains side by side. The coloured band shows where they match — and where they diverge.</p>
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
        <CompareTool />
      </div>

      <AADSUnit />

      <Footer
        attribution={
          <>
            <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> &middot; development = (chainring ÷
            cog) × wheel circumference
          </>
        }
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
