import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import RpiMap from '@/components/rpi/RpiMap';
import { ROUTE_COLOR } from '@/components/rpi/rpiRouteColors';
import Stay22Embed from '@/components/affiliate/Stay22Embed';
import { RPI_AFFILIATES_ENABLED } from '@/components/rpi/rpiFeatureFlags';
import { RPI_ROUTES, type RpiRoute } from '@/data/rpiRoutes';
import '@/components/climb/climb.css';
import '@/components/climbs/climbs-index.css';
import '@/components/rpi/rpi-map.css';
import '@/components/affiliate/affiliate.css';

// Same format as the Grand Tour race pages' embeds in data/stay22.json
// (https://stay22.com/embed/<id>, under the same letmeallez/lmaID
// partner account) — Robin's own Stay22 Hub link for Ketchum/Sun Valley,
// 2026-08-31. Stay22 auto-detects currency from the viewer's location by
// default (Robin saw GBP) — ?currency=USD forces it, per Stay22's own
// widget-parameter docs (dev.stay22.com/docs/maps/parameters). This is a
// site for a US event, so USD is the right fixed default regardless of
// where a given visitor is browsing from.
const RPI_STAY22_SRC = 'https://www.stay22.com/embed/6a9580e25681985ace979f5b?currency=USD';

const SITE = 'https://polkadotbike.com';
const PAGE_URL = `${SITE}/rebeccas-private-idaho`;
const TITLE = "Rebecca's Private Idaho — 3D Routes, Your Time & Gears — Polka Dot Bike";
const DESCRIPTION =
  "Get your personalised time and pace for every Rebecca's Private Idaho gravel route — Harriman, the Dollarhide Summit time trial, and the four Day 3 distance options. Ride each in 3D, pick your gearing, download the GPX.";

// Full SEO metadata since 2026-08-31 (Robin: "turn the pages on so they
// are seen and indexable" then "do the SEOs and the X cards") — mirrors
// app/climbs/page.tsx's pattern (description leads with the personalised
// estimate, same CollectionPage+ItemList+BreadcrumbList JSON-LD shape
// below in buildJsonLd). Was noindex/no-metadata-at-all while
// local-only/unreviewed, same pattern as the TDF batch used while
// localhost-only (see project_cyclegear_climb_3d.md memory). Affiliates/
// ads stay off separately — see RPI_AFFILIATES_ENABLED above.
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
        name: "Rebecca's Private Idaho — 3D Routes",
        description: DESCRIPTION,
        isPartOf: { '@id': `${SITE}/#website` },
        author: { '@type': 'Person', name: 'Robin Gillingham', url: `${SITE}/about` },
        mainEntity: { '@id': `${PAGE_URL}#list` },
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#list`,
        name: "Rebecca's Private Idaho routes",
        numberOfItems: RPI_ROUTES.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: RPI_ROUTES.map((r, i) => ({
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
          { '@type': 'ListItem', position: 2, name: "Rebecca's Private Idaho", item: PAGE_URL },
        ],
      },
    ],
  };
}

function RouteCard({ r }: { r: RpiRoute }) {
  return (
    <Link
      href={`/rebeccas-private-idaho/${r.slug}`}
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

export default function RebeccasPrivateIdahoPage() {
  const day1 = RPI_ROUTES.filter((r) => r.day === 1);
  const day2 = RPI_ROUTES.filter((r) => r.day === 2);
  const day3 = RPI_ROUTES.filter((r) => r.day === 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <div className="hero">
        <h1>
          Rebecca&apos;s Private Idaho
          <br />
          <span className="cl-sub">Gravel routes in 3D — plan, terrain and gradient wedge</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1100 }}>
        <p className="climb-summary">
          Three days of Rebecca&apos;s Private Idaho (
          <a href="https://rebeccasprivateidaho.com" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>
            rebeccasprivateidaho.com
          </a>
          ), out of Ketchum/Sun Valley —
          Harriman on Day 1, the Dollarhide Summit time trial on Day 2, then four distance options for the Day 3
          main event. Each route has a full 3D plan view, real 3D terrain relief, and a gradient wedge profile,
          built from the real GPX for that route.
        </p>

        <div className="map-outer">
          <RpiMap mapId="rpi-overview-map" routes={RPI_ROUTES} />
        </div>
        <div className="rpi-map-legend">
          {RPI_ROUTES.map((r) => (
            <span key={r.slug} className="rpi-map-legend-item">
              <span className="rpi-map-legend-dot" style={{ background: ROUTE_COLOR[r.slug] }} />
              {r.name}
            </span>
          ))}
        </div>

        <div className="climb-guide-box">
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
            Get your own numbers on every route
          </div>
          <ul className="controls" style={{ margin: 0 }}>
            <li>Open any route below, then switch to its <b>Setup</b> tab and enter your groupset, weight, power and cadence.</li>
            <li>Switch to <b>Gears</b> to see which of your gears are achievable as you drag the slider along the route — flagged if they&apos;re too hard or too easy.</li>
            <li>Your Personalised Climb Report (above the map) turns that same setup into an estimated time and average speed for the whole route, plus a check on whether your easiest gear will grind on the steepest section.</li>
            <li>Enter your setup once and it carries over to every route here, and to the Gear Calculator, Climb Planner and Grand Tour climb pages too.</li>
          </ul>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
          Route data via Rebecca&apos;s Private Idaho (rebeccasprivateidaho.com).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, marginTop: 32 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 14 }}>
              Day 1 — Wednesday
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {day1.map((r) => <RouteCard key={r.slug} r={r} />)}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 14 }}>
              Day 2 — Thursday
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {day2.map((r) => <RouteCard key={r.slug} r={r} />)}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginTop: 32, marginBottom: 14 }}>
          Day 3 — Saturday · main event, choose your distance
        </h2>
        <div className="rpi-day3-grid">
          {day3.map((r) => <RouteCard key={r.slug} r={r} />)}
        </div>

        {RPI_AFFILIATES_ENABLED && (
          <div className="rpi-stay-card stage-header glass stay-card" style={{ marginTop: 32 }}>
            <div className="stay-card-title">🏨 Where to stay in Ketchum / Sun Valley</div>
            <Stay22Embed src={RPI_STAY22_SRC} />
          </div>
        )}
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
