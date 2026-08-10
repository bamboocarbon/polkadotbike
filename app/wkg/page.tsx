import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import WkgCalculator from '@/components/wkg/WkgCalculator';
import '@/components/wkg/wkg.css';

const PAGE_URL = 'https://polkadotbike.com/wkg';
const TITLE = 'W/kg & Watts Power Calculator · Polka Dot Bike';
const DESCRIPTION =
  'Work out your power-to-weight ratio in watts per kilo, see where you sit from novice to pro, and the W/kg you need for any climb.';

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
      name: 'W/kg and FTP Calculator',
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
        { '@type': 'ListItem', position: 2, name: 'W/KG and FTP', item: PAGE_URL },
      ],
    },
  ];
}

export default function WkgPage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      {/* Same nav-active/logo override as /derailleur — this page's own
          --accent is #1a72e0 in the source (the "bold UCI palette" block),
          but unlike derailleur none of that block's other rules
          (.filter-btn/.brand-tab/.dr-group/.stat-green etc.) are ever
          referenced in this page's body, confirmed by grep — genuinely
          dead here, so only the two load-bearing rules are ported. */}
      <style>{`
        nav a.active { color: #1a72e0; }
        .logo span { color: #fff; }
      `}</style>

      <div className="hero">
        <h1>W/kg Power Profile</h1>
        <p>Enter your FTP and body weight — see where you rank and exactly what it takes to reach the next level.</p>
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
        <WkgCalculator />
      </div>

      <AADSUnit />

      <Footer
        attribution="Polka Dot Bike — Category benchmarks based on Coggan power profile tables. FTP-based values for sustained climbing performance."
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
