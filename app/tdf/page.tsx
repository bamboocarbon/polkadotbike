import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import RacePageClient from '@/components/race/RacePageClient';
import StaticIndex from '@/components/race/StaticIndex';
import '@/components/race/race.css';
import climbsData from '@/data/climbs.json';
import stay22Data from '@/data/stay22.json';
import tdfMap from '@/data/tdf-map.json';
import {
  raceStats,
  raceIntro,
  staticDefaultStage,
  type RaceData,
  type Climb,
} from '@/lib/raceHelpers';
import type { MapConfig } from '@/components/race/RacePageClient';
import type { StageCoord, CityLabel } from '@/components/race/RaceMapInner';

const race = climbsData.races.tdf as RaceData;
const climbs = climbsData.climbs.filter((c) => c.race === 'tdf') as Climb[];
const stay22Links: Record<string, string> = stay22Data.tdf;

const PAGE_URL = 'https://polkadotbike.com/tdf';
const TITLE = 'Tour de France 2026 Climbs & Gearing · Polka Dot Bike';
const DESCRIPTION =
  "Every major climb of the 2026 Tour de France — gradient, length and category. Pick a col and plan the exact gearing you'll need with the Climb Planner.";

export const metadata: Metadata = {
  // {absolute} bypasses the root layout's title template ('%s · Polka Dot
  // Bike') — TITLE here already ends in "· Polka Dot Bike" itself (needed
  // verbatim for openGraph/twitter below, which get no template applied),
  // so without this the suffix would render twice.
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

const stats = raceStats(race, climbs, 'HC');
const intro = raceIntro(race, climbs, 'HC', 'hors-catégorie');

// Build-time snapshot — this route is statically generated, so this
// evaluates once per build, which is exactly what "build timestamp, not a
// hardcoded string" (3.7) asks for.
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
        description: "Every categorised climb of the 2026 Tour de France — gradient, length, summit altitude and the gearing you'd need to ride it.",
        isPartOf: { '@id': 'https://polkadotbike.com/#website' },
        author: { '@id': 'https://polkadotbike.com/about.html#robin' },
        datePublished: '2026-07-04',
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
          { '@type': 'ListItem', position: 2, name: 'Tour de France 2026 Climbs', item: PAGE_URL },
        ],
      },
    ],
  };
}

const mapConfig: MapConfig = {
  mapId: 'tdf-map',
  stageCoords: tdfMap.STAGE_COORDS as StageCoord[],
  cityLabels: tdfMap.CITY_LABELS as CityLabel[],
  countryLabels: [
    { lat: 47.5, lng: 0.9, name: 'FRANCE', color: 'rgba(122,94,10,0.5)' },
    { lat: 42.0, lng: -3.0, name: 'SPAIN', color: 'rgba(122,94,10,0.5)' },
  ],
  countryFill: {
    '250': '#ffe94d', // France — lemon
    '724': '#fff3b8', // Spain — pale lemon
    '20': '#fff3b8', // Andorra — pale lemon like Spain
  },
  typeColor: { Mountain: '#ee1c28', Hilly: '#000000', Sprint: '#12b05f', TTT: '#1a72e0', ITT: '#1a72e0' },
  fitBoundsPadding: [28, 28],
  zoomControl: { position: 'topright' },
  mobileView: { type: 'panBy', dx: -16 },
};

export default function TdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <div className="hero">
        <h1>Tour de France 2026 Climbs</h1>
        <p>Pick a climb — see the gradient, length, and category, then send it straight to the Climb Planner with your setup.</p>
        <div className="hero-stats">
          <div className="hs-item"><div className="hs-val">{stats.stages}</div><div className="hs-lbl">Stages</div></div>
          <div className="hs-item"><div className="hs-val">{stats.mountainStages}</div><div className="hs-lbl">Mountain stages</div></div>
          <div className="hs-item"><div className="hs-val">{stats.specialClimbCount}</div><div className="hs-lbl">HC passes</div></div>
          <div className="hs-item"><div className="hs-val">{stats.specialSummitFinishes}</div><div className="hs-lbl">HC summit finishes</div></div>
          <div className="hs-item"><div className="hs-val">{stats.startLabel}</div><div className="hs-lbl">Race start</div></div>
          <div className="hs-item"><div className="hs-val">{stats.endLabel}</div><div className="hs-lbl">Paris</div></div>
        </div>
      </div>

      <RacePageClient
        race={race}
        climbs={climbs}
        staticDefaultStage={staticDefaultStage(race, new Date())}
        stay22Links={stay22Links || {}}
        mapConfig={mapConfig}
        sidebarLabel="Tour Stages"
      />

      <StaticIndex race={race} climbs={climbs} intro={intro} h2Color="#ffe94d" />

      <AADSUnit />

      <Footer
        attribution="Polka Dot Bike · Tour de France 2026 · Stage and climb data from the official Tour de France roadbook; gradients are average values."
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
