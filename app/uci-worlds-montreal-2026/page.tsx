import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import Stay22Embed from '@/components/affiliate/Stay22Embed';
import BikesBookingCard from '@/components/affiliate/BikesBookingCard';
import { MONTREAL_WORLDS_ROUTES, type MontrealWorldsRoute } from '@/data/montrealWorldsRoutes';
import '@/components/climb/climb.css';
import '@/components/climbs/climbs-index.css';
import '@/components/affiliate/affiliate.css';

// Robin's own Stay22 Hub link for Montréal, 2026-09-18 — same
// letmeallez/lmaID partner account as every other Stay22 embed on the
// site (see data/stay22.json / RpiRouteDetailClient.tsx's RPI_STAY22_SRC).
// Lives on the hub page, not per-route — moved off the TT/RR pages
// 2026-09-18 (Robin: "move the stay22 and bike hire... below the rr
// categorys box") — one stay/bike-hire section for the whole event reads
// better than a duplicate on both route pages.
const MONTREAL_STAY22_SRC = 'https://www.stay22.com/embed/6aadab8c45261ada6ba406a1';

const SITE = 'https://polkadotbike.com';
const PAGE_URL = `${SITE}/uci-worlds-montreal-2026`;
// Rewritten 2026-09-18 (Robin: "highlight our gear calculator, the worlds
// RR and TT races and the 3D mapping") — leads with the two real-world
// search terms (UCI Worlds 2026 Montréal, TT & Road Race) before the
// site's own two differentiators (3D course visualiser, gear ratio
// calculator — same "Gear Calculator" phrasing as the homepage's own
// title, for consistent keyword targeting sitewide). Kept under ~160
// chars so Google doesn't truncate the description.
const TITLE = 'UCI Worlds 2026 Montréal — TT & Road Race in 3D, Gear Calculator — Polka Dot Bike';
const DESCRIPTION =
  'The Montréal 2026 UCI Road World Championships time trial and road race courses in 3D — plus our free gear ratio calculator for your ideal setup.';

// Indexable from the start — unlike RPI/Chequamegon's staged noindex ->
// index rollout, the ITT is 20 Sept 2026, two days after this page was
// built (2026-09-18), so there's no local-only review window to wait out.
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
        name: 'UCI Road World Championships 2026, Montréal — 3D Courses',
        description: DESCRIPTION,
        isPartOf: { '@id': `${SITE}/#website` },
        author: { '@type': 'Person', name: 'Robin Gillingham', url: `${SITE}/about` },
        mainEntity: { '@id': `${PAGE_URL}#list` },
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
        about: {
          '@type': 'SportsEvent',
          name: 'UCI Road World Championships 2026',
          startDate: '2026-09-20',
          endDate: '2026-09-27',
          eventStatus: 'https://schema.org/EventScheduled',
          location: { '@type': 'City', name: 'Montréal, Québec, Canada' },
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#list`,
        name: 'Montréal 2026 Worlds 3D courses',
        numberOfItems: MONTREAL_WORLDS_ROUTES.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: MONTREAL_WORLDS_ROUTES.map((r, i) => ({
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
          { '@type': 'ListItem', position: 2, name: 'UCI Worlds 2026, Montréal', item: PAGE_URL },
        ],
      },
    ],
  };
}

function RouteCard({ r }: { r: MontrealWorldsRoute }) {
  return (
    <Link
      href={`/uci-worlds-montreal-2026/${r.slug}`}
      prefetch={false}
      className="glass"
      style={{ display: 'block', padding: '18px 20px', color: 'inherit', textDecoration: 'none' }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{r.name}</div>
      <div style={{ fontSize: 13, color: 'var(--sec)', marginBottom: 4 }}>
        {r.lengthKm.toFixed(1)} km ({r.lengthMi.toFixed(1)} mi) · {r.ascentM.toLocaleString()} m (
        {r.ascentFt.toLocaleString()} ft) gain
      </div>
      <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 700, marginBottom: 10 }}>{r.eventLabel}</div>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{r.blurb}</p>
    </Link>
  );
}

interface ScheduleRow {
  category: string;
  type: string;
  date: string;
  time: string;
  distance: string;
  elevation: string;
  laps?: string;
}

// Full schedule via montreal2026.org/en/challenges (checked 2026-09-18) —
// every category on the page, not just Elite. Lap counts for the Mount
// Royal finishing circuit (13.4km/lap) confirmed per-category via the
// UCI's own course reveal (flobikes.com/articles/16184384 + further
// reporting, checked 2026-09-18): each category's own published distance
// divides out to a whole number of laps of that same circuit (e.g. Men
// U23 174.2km / 13.4km = 13 laps), which is also how the ITT/TTT rows
// below are confirmed NOT to touch the circuit (their distances don't
// divide out the same way — they're separate point-to-point courses).
const ITT_SCHEDULE: ScheduleRow[] = [
  { category: "Women Elite", type: 'ITT', date: 'Sun 20 Sept', time: '9:00am', distance: '39.2km', elevation: '220m' },
  { category: "Men Elite", type: 'ITT', date: 'Sun 20 Sept', time: '12:45pm', distance: '39.2km', elevation: '220m' },
  { category: "Women U23", type: 'ITT', date: 'Mon 21 Sept', time: '9:00am', distance: '20.3km', elevation: '145m' },
  { category: "Men U23", type: 'ITT', date: 'Mon 21 Sept', time: '12:00pm', distance: '31.3km', elevation: '197m' },
  { category: "Mixed Relay", type: 'TTT', date: 'Tue 22 Sept', time: '8:30am', distance: '40.6km', elevation: '290m' },
  { category: "Men Junior", type: 'ITT', date: 'Tue 22 Sept', time: '12:15pm', distance: '20.3km', elevation: '145m' },
  { category: "Women Junior", type: 'ITT', date: 'Tue 22 Sept', time: '3:15pm', distance: '10.7km', elevation: '91m' },
];

const RR_SCHEDULE: ScheduleRow[] = [
  { category: "Women U23", type: 'RR', date: 'Thu 24 Sept', time: '9:00am', distance: '134km', elevation: '2,690m', laps: '10' },
  { category: "Men Junior", type: 'RR', date: 'Thu 24 Sept', time: '1:30pm', distance: '134km', elevation: '2,690m', laps: '10' },
  { category: "Men U23", type: 'RR', date: 'Fri 25 Sept', time: '9:00am', distance: '174.2km', elevation: '3,497m', laps: '13' },
  { category: "Women Junior", type: 'RR', date: 'Fri 25 Sept', time: '2:15pm', distance: '80.4km', elevation: '1,614m', laps: '6' },
  { category: "Women Elite", type: 'RR', date: 'Sat 26 Sept', time: '9:00am', distance: '180.4km', elevation: '2,570m', laps: '8' },
  { category: "Men Elite", type: 'RR', date: 'Sun 27 Sept', time: '9:00am', distance: '273.7km', elevation: '3,803m', laps: '12' },
];

function ScheduleTable({ rows, showLaps }: { rows: ScheduleRow[]; showLaps?: boolean }) {
  const headers = showLaps
    ? ['Category', 'Type', 'Date', 'Start', 'Distance', 'Elevation', 'Circuit Laps']
    : ['Category', 'Type', 'Date', 'Start', 'Distance', 'Elevation'];
  return (
    <div className="climb-guide-box" style={{ overflowX: 'auto', padding: '10px 16px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--accent-light)', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.8 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.category}-${r.date}-${r.time}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 600 }}>{r.category}</td>
              <td style={{ padding: '8px 10px', color: 'var(--sec)' }}>{r.type}</td>
              <td style={{ padding: '8px 10px', color: 'var(--sec)' }}>{r.date}</td>
              <td style={{ padding: '8px 10px', color: 'var(--sec)' }}>{r.time}</td>
              <td style={{ padding: '8px 10px', color: 'var(--sec)' }}>{r.distance}</td>
              <td style={{ padding: '8px 10px', color: 'var(--sec)' }}>{r.elevation}</td>
              {showLaps && <td style={{ padding: '8px 10px', color: 'var(--sec)' }}>{r.laps ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MontrealWorldsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <div className="hero">
        <h1>
          UCI Road World Championships 2026
          <br />
          <span className="cl-sub">Montréal, Québec — 20&ndash;27 September 2026</span>
        </h1>
      </div>

      <div className="container" style={{ maxWidth: 1100 }}>
        <p className="climb-summary">
          The road-race World Championships come to Montréal for the first time since 1974, thirteen events across
          eight days, every one of them finishing on the same rising Avenue du Parc false flat. Six road races lap
          Mount Royal&apos;s punishing finishing circuit — Voie Camillien-Houde then the steep ramps of Chemin de la
          Polytechnique — anywhere from 6 times (Women Junior) up to 13 (Men U23). Six individual time trials plus
          the Mixed Relay share a single decisive climb of their own in the closing kilometres, run into that same
          finish line. Full schedule via{' '}
          <a href="https://www.montreal2026.org/en/challenges/" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>
            montreal2026.org
          </a>
          .
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 8 }}>
          {MONTREAL_WORLDS_ROUTES.map((r) => (
            <RouteCard key={r.slug} r={r} />
          ))}
        </div>

        <div className="climb-guide-box" style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginBottom: 10 }}>
            Get your own numbers on both courses
          </div>
          <ul className="controls" style={{ margin: 0 }}>
            <li>Open either course above, then switch to its <b>Setup</b> tab and enter your groupset, weight, power and cadence.</li>
            <li>Switch to <b>Gears</b> to see which of your gears are achievable as you drag the slider along the route — flagged if they&apos;re too hard or too easy.</li>
            <li>Your Personalised Climb Report (above the map) turns that same setup into an estimated time and average speed, plus a check on whether your easiest gear will grind on the steepest section.</li>
            <li>Enter your setup once and it carries over to every course here, and to the Gear Calculator, Climb Planner and Grand Tour climb pages too.</li>
          </ul>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginTop: 32, marginBottom: 14 }}>
          Time Trials — Sunday 20 to Tuesday 22 September
        </h2>
        <ScheduleTable rows={ITT_SCHEDULE} />

        <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--accent-light)', marginTop: 32, marginBottom: 14 }}>
          Road Races — Thursday 24 to Sunday 27 September
        </h2>
        <ScheduleTable rows={RR_SCHEDULE} showLaps />
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
          Every road race finishes on the same 13.4km Mount Royal circuit featured in 3D below — each category&apos;s
          own published distance divides out exactly to its lap count above.
        </p>

        <div className="stay-row mtl-stay-row" style={{ marginTop: 24 }}>
          <div className="stay-col">
            <div className="stage-header glass stay-card">
              <div className="stay-card-title">🏨 Where to stay in Montréal</div>
              <Stay22Embed src={MONTREAL_STAY22_SRC} />
            </div>
          </div>
          <div className="bike-hire-card">
            <BikesBookingCard blurb="Riding either course yourself, or just want wheels while you're in Montréal? Compare rental rates worldwide." />
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 24 }}>
          Schedule via montreal2026.org. Circuit lap counts and climb names via the UCI&apos;s own course reveal.
        </p>
      </div>

      <AADSUnit />

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
