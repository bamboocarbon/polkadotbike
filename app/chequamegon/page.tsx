import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import CheqMap from '@/components/cheq/CheqMap';
import { ROUTE_COLOR } from '@/components/cheq/cheqRouteColors';
import { CHEQ_ROUTES, type CheqRoute } from '@/data/cheqRoutes';
import '@/components/climb/climb.css';
import '@/components/climbs/climbs-index.css';
import '@/components/cheq/cheq-map.css';

const SITE = 'https://polkadotbike.com';
const PAGE_URL = `${SITE}/chequamegon`;
const TITLE = 'Chequamegon MTB Festival — 3D Courses, Your Time & Gears — Polka Dot Bike';
const DESCRIPTION =
  'Get your personalised time and pace for every Chequamegon MTB Festival course — the Chequamegon 40, its Pro/Elite course, and Short & Fat. Ride each in 3D, pick your gearing, download the GPX.';

// Deliberately NOT indexed and NOT in app/sitemap.ts — this page stays
// local-development-only for now (Robin, 2026-09-04: "this will remain
// only in development and not pushed live"), same "noindex/no-metadata
// while local-only/unreviewed" holding pattern the RPI and climb pages
// went through before their own launch (see app/rebeccas-private-idaho/
// page.tsx's comment). Full metadata/JSON-LD structure is built now
// anyway per Robin's own request ("add SEOs to each page") so flipping
// `index: true` and adding the three /chequamegon/* paths to
// STATIC_PATHS/a new route list in sitemap.ts is the only work needed
// to go live later.
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
    images: [{ url: `${SITE}/og-card.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE}/og-card.png`],
  },
};

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        url: PAGE_URL,
        name: 'Chequamegon MTB Festival — 3D Courses',
        description: DESCRIPTION,
        isPartOf: { '@id': `${SITE}/#website` },
        author: { '@type': 'Person', name: 'Robin Gillingham', url: `${SITE}/about` },
        mainEntity: { '@id': `${PAGE_URL}#list` },
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#list`,
        name: 'Chequamegon MTB Festival courses',
        numberOfItems: CHEQ_ROUTES.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: CHEQ_ROUTES.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.name,
          url: `${PAGE_URL}/${r.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Chequamegon MTB Festival', item: PAGE_URL },
        ],
      },
    ],
  };
}

function RouteCard({ r }: { r: CheqRoute }) {
  return (
    <Link
      href={`/chequamegon/${r.slug}`}
      prefetch={false}
      className="glass"
      style={{ display: 'block', padding: '18px 20px', color: 'inherit', textDecoration: 'none' }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{r.name}</div>
      <div style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 10 }}>
        {r.lengthMi.toFixed(1)} mi ({r.lengthKm.toFixed(1)} km) · {r.ascentFt.toLocaleString()} ft (
        {r.ascentM.toLocaleString()} m) gain
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{r.blurb}</p>
    </Link>
  );
}

export default function ChequamegonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <div className="hero">
        <h1>
          Chequamegon MTB Festival
          <br />
          <span className="cl-sub">Wisconsin Northwoods courses in 3D — plan, terrain and gradient wedge</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1100 }}>
        <p className="climb-summary">
          The Chequamegon MTB Festival (
          <a href="https://www.cheqmtb.com" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>
            cheqmtb.com
          </a>
          ), Saturday 19 September 2026, Hayward/Cable, Wisconsin — the Chequamegon 40 and its Pro/Elite course run the
          famed American Birkebeiner Ski Trail from Hayward to Cable, while Short & Fat is a shorter loop starting and
          finishing in Cable. Each course has a full 3D plan view, real 3D terrain relief, and a gradient wedge
          profile, built from the real GPX for that course.
        </p>

        <div className="map-outer">
          <CheqMap mapId="cheq-overview-map" routes={CHEQ_ROUTES} />
        </div>
        <div className="cheq-map-legend">
          {CHEQ_ROUTES.map((r) => (
            <span key={r.slug} className="cheq-map-legend-item">
              <span className="cheq-map-legend-dot" style={{ background: ROUTE_COLOR[r.slug] }} />
              {r.name}
            </span>
          ))}
        </div>

        <div className="climb-guide-box">
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
            Get your own numbers on every course
          </div>
          <ul className="controls" style={{ margin: 0 }}>
            <li>Open any course below, then switch to its <b>Setup</b> tab and enter your groupset, weight, power and cadence.</li>
            <li>Switch to <b>Gears</b> to see which of your gears are achievable as you drag the slider along the course — flagged if they&apos;re too hard or too easy.</li>
            <li>Your Personalised Climb Report (above the map) turns that same setup into an estimated time and average speed for the whole course, plus a check on whether your easiest gear will grind on the steepest section.</li>
            <li>Enter your setup once and it carries over to every course here, and to the Gear Calculator, Climb Planner and Grand Tour climb pages too.</li>
          </ul>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
          Course data via the Chequamegon MTB Festival (cheqmtb.com).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 32 }}>
          {CHEQ_ROUTES.map((r) => <RouteCard key={r.slug} r={r} />)}
        </div>
      </div>

      <Footer
        attribution="Polka Dot Bike — 3D route visualiser. Terrain and gradient are indicative."
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/climbs', label: 'Climbs' },
          { href: '/guide', label: 'Guide' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
        ]}
      />
    </>
  );
}
