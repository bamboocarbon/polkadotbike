import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import RacePageClient from '@/components/race/RacePageClient';
import StaticIndex from '@/components/race/StaticIndex';
import '@/components/race/race.css';
import climbsData from '@/data/climbs.json';
import stay22Data from '@/data/stay22.json';
import vueltaMap from '@/data/vuelta-map.json';
import {
  raceIntro,
  staticDefaultStage,
  type RaceData,
  type Climb,
} from '@/lib/raceHelpers';
import type { MapConfig, LegendItem } from '@/components/race/RacePageClient';
import type { StageCoord, CityLabel } from '@/components/race/RaceMapInner';

const race = climbsData.races.vuelta as RaceData;
const climbs = climbsData.climbs.filter((c) => c.race === 'vuelta') as Climb[];
const stay22Links: Record<string, string> = stay22Data.vuelta;

const PAGE_URL = 'https://polkadotbike.com/vuelta';
const TITLE = 'La Vuelta a España 2026 Climbs & Gearing · Polka Dot Bike';
const DESCRIPTION =
  "Every major climb of the 2026 Vuelta a España — gradient, length and category. Pick a puerto and plan the exact gearing you'll need with the Climb Planner.";

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

const intro = raceIntro(race, climbs, 'ESP', 'especial-category');

// Vuelta's hero shows its own stat set too (verified against the live
// vuelta.html, not assumed from TDF/Giro's shape — see the Giro build's
// own note on this). "Mountain days" specifically means Mountain + Medium
// combined (6 Mountain + 4 Medium = 10, matching the source's hardcoded
// value exactly) — a broader count than raceIntro's own "6 mountain
// stages" text, which deliberately stays strict-Mountain-only.
const mountainDays = race.stages.filter((s) => s.type === 'Mountain' || s.type === 'Medium').length;
const especialClimbs = climbs.filter((c) => c.cat === 'ESP').length;
const timeTrials = race.stages.filter((s) => s.type === 'ITT' || s.type === 'TTT').length;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
const startLabel = shortDate(race.startDate);
const endLabel = shortDate(race.endDate);

const BUILD_DATE = new Date().toISOString().slice(0, 10);

function buildJsonLd() {
  const byStage: Record<number, Climb[]> = {};
  for (const c of climbs) (byStage[c.stage] ||= []).push(c);
  const listed = climbs.filter((c) => byStage[c.stage].some((x) => x.cat !== 'TBC'));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        url: PAGE_URL,
        name: `${race.name} Climbs`,
        description: "Every categorised climb of the 2026 Vuelta a España — gradient, length, summit altitude and the gearing you'd need to ride it.",
        isPartOf: { '@id': 'https://polkadotbike.com/#website' },
        author: { '@id': 'https://polkadotbike.com/about.html#robin' },
        datePublished: '2026-07-30',
        dateModified: BUILD_DATE,
        mainEntity: { '@id': `${PAGE_URL}#climblist` },
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
        about: {
          '@type': 'SportsEvent',
          name: race.name,
          startDate: race.startDate,
          endDate: race.endDate,
          eventStatus: 'https://schema.org/EventScheduled',
          location: { '@type': 'Country', name: race.country },
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE_URL}#climblist`,
        name: `Climbs of the ${race.name}`,
        numberOfItems: listed.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: listed.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: `${PAGE_URL}#stage-${c.stage}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
          { '@type': 'ListItem', position: 2, name: 'La Vuelta a España 2026 Climbs', item: PAGE_URL },
        ],
      },
    ],
  };
}

const mapConfig: MapConfig = {
  mapId: 'vuelta-map',
  stageCoords: vueltaMap.STAGE_COORDS as StageCoord[],
  cityLabels: vueltaMap.CITY_LABELS as CityLabel[],
  countryLabels: [
    { lat: 44.1, lng: 3.0, name: 'FRANCE', color: 'rgba(140,20,26,0.55)' },
    { lat: 40.0, lng: -3.5, name: 'SPAIN', color: 'rgba(255,255,255,0.65)' },
  ],
  countryFill: {
    '724': '#c81e2c', // Spain — leader jersey red
    '250': '#f2a89a', // France — pale warm red
    '20': '#f2a89a', // Andorra — pale warm red like France
  },
  typeColor: { Mountain: '#ffe600', Medium: '#ffe600', Hilly: '#000000', Flat: '#12b05f', ITT: '#1a72e0' },
  fitBoundsPadding: [36, 36],
  // topright + panBy — matches TDF's defaults exactly, verified against
  // the source rather than assumed (Giro's map differs on both).
  zoomControl: { position: 'topright' },
  mobileView: { type: 'panBy', dx: -16 },
  // No zoomInOnDesktop — confirmed the source never zooms in an extra step
  // here, unlike TDF (the old shared inference from mobileView.type would
  // have wrongly added one; see the RaceMapInner prop's own comment).
  typeDotCls: { Mountain: 'md-vm', Medium: 'md-mm', Hilly: 'md-h', Flat: 'md-s', ITT: 'md-t' },
  tooltipDirection: 'auto',
  labelPlacement: 'dynamic',
};

const legend: LegendItem[] = [
  { cls: 'ml-vm', label: 'Mountain' },
  { cls: 'ml-h', label: 'Hilly' },
  { cls: 'ml-s', label: 'Flat' },
  { cls: 'ml-t', label: 'ITT' },
];

export default function VueltaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      {/* Vuelta's own theme (amber) — unlike Giro, the source page never
          carried a stray --accent override further down (confirmed by
          grep), so this isn't fixing a bug, just supplying the value the
          shared globals.css deliberately defaults to TDF's blue instead of
          guessing at. */}
      <style>{`
        :root { --accent: #f59e0b; --accent-light: #fcd34d; }
        nav a.active { background: rgba(245,158,11,0.12); }
      `}</style>

      <div className="hero">
        <h1>La Vuelta a España 2026 Climbs</h1>
        <p>Pick a puerto — see the gradient, length, and category, then send it straight to the Climb Planner with your setup.</p>
        <div className="hero-stats">
          <div className="hs-item"><div className="hs-val">{race.stages.length}</div><div className="hs-lbl">Stages</div></div>
          <div className="hs-item"><div className="hs-val">{mountainDays}</div><div className="hs-lbl">Mountain days</div></div>
          <div className="hs-item"><div className="hs-val">{especialClimbs}</div><div className="hs-lbl">Especial climbs</div></div>
          <div className="hs-item"><div className="hs-val">{timeTrials}</div><div className="hs-lbl">Time trials</div></div>
          <div className="hs-item"><div className="hs-val">{startLabel}</div><div className="hs-lbl">Monaco start</div></div>
          <div className="hs-item"><div className="hs-val">{endLabel}</div><div className="hs-lbl">Granada</div></div>
        </div>
      </div>

      <RacePageClient
        race={race}
        climbs={climbs}
        staticDefaultStage={staticDefaultStage(race, new Date())}
        stay22Links={stay22Links || {}}
        mapConfig={mapConfig}
        sidebarLabel="Vuelta Stages"
        legend={legend}
      />

      <StaticIndex race={race} climbs={climbs} intro={intro} h2Color="#f59e0b" />

      <AADSUnit />

      <Footer
        attribution={
          <>
            Polka Dot Bike · La Vuelta a España 2026 · Stage list, dates and climb categories from the official Vuelta roadbook.
            <br />
            Per-stage elevation gain and some climb lengths/gradients come from Komoot&apos;s route data and CyclingCols; the rest are independently researched
            <br />
            or reconstructed estimates from the official stage profile. All gradients are average values.
          </>
        }
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/wkg', label: 'W/KG and FTP' },
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
