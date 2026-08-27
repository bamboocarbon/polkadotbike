import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import ClimbIndexClient, { type ClimbIndexItem } from '@/components/climbs/ClimbIndexClient';
import '@/components/race/race.css';
import '@/components/climbs/climbs-index.css';
import climbIndexData from '@/data/climb-index.json';
import { hasRouteData } from '@/lib/climbRouteData';

const PAGE_URL = 'https://polkadotbike.com/climbs';
// "Major" (not "Every") deliberately, since Cat3 climbs are filtered out
// below — Robin's call 2026-08-15: revisit this wording once Giro/Tour are
// mapped and the minor (Cat3) climbs get added back in.
const TITLE = 'Every Major Climb of the 2026 Grand Tours · Polka Dot Bike';
const DESCRIPTION =
  "All 80 major, categorised climbs of the 2026 Tour de France, Giro d'Italia and Vuelta a España — gradient, length, summit altitude and the gearing you'd need for each.";

// Added to the nav 2026-08-13 (Robin) so it's reachable while developing.
// Individual climb detail pages now exist at /climbs/<slug> (moved from
// app/climb-debug-3d 2026-08-15) for every "ready" (Vuelta) climb, though
// not all of those yet have real 3D terrain data built (data/climbs/) — see
// ClimbCard.tsx's CLIMB_3D_SLUGS gate. Indexable since the site went live
// 2026-08-15 (was noindex until then).
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

// "Major" categories only — HC, Cat1, Cat2 (Tour/Giro) and ESP (La
// Vuelta's own top tier, e.g. Sierra de la Pandera). Excludes Cat3, Cat4
// and Uncat, same "revisit once Giro/Tour are mapped" call as the page
// title above.
const MAJOR_CATS = new Set(['HC', 'Cat1', 'Cat2', 'ESP']);

const climbs: ClimbIndexItem[] = (climbIndexData.climbs as RawClimb[])
  .filter((c) => c.hasPage && MAJOR_CATS.has(c.cat))
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
      // Vuelta climbs are all ready; Giro climb pages still 404 by design
      // (see climbs-index.css's header comment) so stay greyed out
      // wholesale. TDF is now per-climb (2026-08-26, localhost-only TDF
      // batch in progress): only the ones with a real GPX-processed route
      // (data/climbs/routes/<slug>.json) are clickable, the rest still
      // show "coming soon" same as before.
      ready: race === 'vuelta' || (race === 'tdf' && hasRouteData(c.slug)),
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
        name: 'Every Major Climb of the 2026 Grand Tours',
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
        <h1>
          Every major climb of the 2026 Grand Tours
          <br />
          <span className="cl-sub">Giro d&apos;Italia · Tour de France · Vuelta a España</span>
        </h1>
      </div>

      <div className="ci-wrap">
        <p className="ci-intro">Every major categorised climb of the three 2026 Grand Tours, with its length, average gradient and summit altitude. Open any climb for its gradient profile kilometre by kilometre, every stage it appears on, and the gearing you&apos;d need to ride it yourself.</p>

        <ClimbIndexClient climbs={climbs} />
      </div>

      <Footer
        attribution="Polka Dot Bike — Climb profiles, gradients and the gearing you need. Figures are indicative."
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
