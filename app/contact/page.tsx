import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';

const PAGE_URL = 'https://polkadotbike.com/contact';
const TITLE = 'Contact — Polka Dot Bike';
const DESCRIPTION =
  'Get in touch with Polka Dot Bike — corrections, gear questions, missing climbs or just to say hello. A one-person cycling-tools project run by Robin Gillingham.';

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
      '@type': 'ContactPage',
      url: PAGE_URL,
      name: 'Contact Polka Dot Bike',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: PAGE_URL },
      ],
    },
  ];
}

export default function ContactPage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <div className="hero">
        <h1>Get in touch</h1>
      </div>

      <div className="container" style={{ maxWidth: 680 }}>
        <div className="glass card">
          <p><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> is a one-person project — I build it, ride with it, and keep it running.</p>
        </div>

        <div className="glass mail-wrap">
          <div className="lead">Email me</div>
          <a className="mail-btn" href="mailto:contact@polkadotbike.com?subject=Polka%20Dot%20Bike">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
            contact@polkadotbike.com
          </a>
        </div>

        <div className="glass social-wrap">
          <div className="lead">Follow along</div>
          <div className="social-row">
            <a className="social-btn instagram" href="https://www.instagram.com/polkadotbike.cc/" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="2" width="20" height="20" rx="5.5" />
                <circle cx="12" cy="12" r="4.3" />
                <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
            <a className="social-btn facebook" href="https://www.facebook.com/profile.php?id=61591463441672" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 21.9v-8.4h2.82l.42-3.27h-3.24V8.03c0-.95.26-1.6 1.63-1.6h1.74V3.55C16.55 3.47 15.6 3.4 14.5 3.4c-2.33 0-3.93 1.42-3.93 4.03v2.8H7.74v3.27h2.83v8.4h2.93z" />
              </svg>
              Facebook
            </a>
          </div>
        </div>
      </div>

      <AADSUnit />

      <Footer
        attribution={<span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span>}
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/about', label: 'About' },
          { href: '/privacy.html', label: 'Privacy' },
          { href: '/disclaimer.html', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
