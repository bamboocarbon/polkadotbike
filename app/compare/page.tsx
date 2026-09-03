import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import CompareTool from '@/components/compare/CompareTool';
import '@/components/compare/compare.css';

const PAGE_URL = 'https://polkadotbike.com/compare';
const TITLE = 'Bike Groupset & Cassette Comparator · Polka Dot Bike';
const DESCRIPTION =
  'Compare groupsets and cassettes side by side from a database of 117 Shimano, SRAM and Campagnolo groupsets — road, MTB and gravel — to pick the right setup.';

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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        nav a.active { color: var(--accent); }
        .logo span { color: #fff; }
        .hero { flex-direction: column; align-items: center; text-align: center; gap: 6px; }
        .hero > h1 { font-size: clamp(26px, 4.5vw, 44px); margin: 0 0 2px; text-align: center; }
        .hero > p { text-align: center; max-width: min(340px, 100%); }
      `,
        }}
      />

      <div className="hero">
        <h1>Groupset Comparator</h1>
        <p>Plot two drivetrains side by side. The coloured band shows where they match — and where they diverge.</p>
        <p style={{ marginTop: 6, opacity: 0.72 }}>Drawn from 117 groupsets — Shimano, SRAM and Campagnolo, road to gravel.</p>
        <div
          className="hero-bikes"
          style={{
            width: '100%', maxWidth: 1120, margin: '12px auto 0', display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center', gap: '4px clamp(12px, 4vw, 32px)',
            fontSize: 'clamp(18px, 5.5vw, 28px)', fontWeight: 900,
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
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
