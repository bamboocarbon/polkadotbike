import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import ClimbIndexClient, { type ClimbIndexItem } from '@/components/climbs/ClimbIndexClient';
import '@/components/race/race.css';
import '@/components/climbs/climbs-index.css';
import climbIndexData from '@/data/climb-index.json';

const PAGE_URL = 'https://polkadotbike.com/climbs';
const TITLE = 'Every Climb of the 2026 Grand Tours · Polka Dot Bike';
const DESCRIPTION =
  "All 87 categorised climbs of the 2026 Tour de France, Giro d'Italia and Vuelta a España — gradient, length, summit altitude and the gearing you'd need for each.";

// Hidden deliberately (Robin, 2026-08-10): the individual climb detail
// pages this index links to (/climbs/<slug>) aren't converted yet — until
// they exist, this page stays unlinked from the nav and out of search
// results, but fully built so it's ready to switch on the moment they land.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: false },
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

const RACE_LABELS: Record<string, string> = {
  tdf: 'Tour de France',
  giro: "Giro d'Italia",
  vuelta: 'La Vuelta',
};

interface RawClimb {
  slug: string;
  name: string;
  range: string;
  cat: string;
  len: number;
  grad: number;
  elev: number;
  races: string[];
  hasPage: boolean;
}

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const climbs: ClimbIndexItem[] = (climbIndexData.climbs as RawClimb[])
  .filter((c) => c.hasPage)
  .map((c) => {
    const race = c.races[0] as 'tdf' | 'giro' | 'vuelta';
    return {
      slug: c.slug,
      name: c.name,
      cat: c.cat,
      len: c.len,
      grad: c.grad,
      elev: c.elev,
      race,
      raceLabel: RACE_LABELS[race] || race,
      haystack: fold(`${c.name} ${c.range}`),
    };
  });

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        url: PAGE_URL,
        name: 'Every Climb of the 2026 Grand Tours',
        description: DESCRIPTION,
        isPartOf: { '@id': 'https://polkadotbike.com/#website' },
        author: { '@id': 'https://polkadotbike.com/about#robin' },
        dateModified: '2026-08-07',
        mainEntity: { '@id': `${PAGE_URL}#list` },
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#list`,
        name: 'Climbs of the 2026 Grand Tours',
        numberOfItems: climbs.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: climbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: `${PAGE_URL}/${c.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
          { '@type': 'ListItem', position: 2, name: 'Climbs', item: PAGE_URL },
        ],
      },
    ],
  };
}

export default function ClimbsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <div className="hero">
        <h1>Every climb of the 2026 Grand Tours</h1>
        <p className="cl-sub">Tour de France · Giro d&apos;Italia · La Vuelta a España</p>
      </div>

      <div className="ci-wrap">
        <p className="ci-intro">Every categorised climb of the three 2026 Grand Tours, with its length, average gradient and summit altitude. Open any climb for its gradient profile kilometre by kilometre, every stage it appears on, and the gearing you&apos;d need to ride it yourself.</p>

        <ClimbIndexClient climbs={climbs} />
      </div>

      <Footer
        attribution="Polka Dot Bike — Climb profiles, gradients and the gearing you need. Figures are indicative."
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy.html', label: 'Privacy' },
          { href: '/disclaimer.html', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
