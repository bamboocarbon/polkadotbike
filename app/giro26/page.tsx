import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import RacePageClient from '@/components/race/RacePageClient';
import StaticIndex from '@/components/race/StaticIndex';
import '@/components/race/race.css';
import climbsData from '@/data/climbs.json';
import stay22Data from '@/data/stay22.json';
import giroMap from '@/data/giro-map.json';
import {
  raceIntro,
  staticDefaultStage,
  type RaceData,
  type Climb,
} from '@/lib/raceHelpers';
import type { MapConfig, LegendItem } from '@/components/race/RacePageClient';
import type { StageCoord, CityLabel } from '@/components/race/RaceMapInner';

const race = climbsData.races.giro as RaceData;
const climbs = climbsData.climbs.filter((c) => c.race === 'giro') as Climb[];
const stay22Links: Record<string, string> = stay22Data.giro;

const PAGE_URL = 'https://polkadotbike.com/giro26';
const TITLE = "Giro d'Italia 2026 Climbs & Gearing · Polka Dot Bike";
const DESCRIPTION =
  "Every major climb of the 2026 Giro d'Italia — gradient, length and category. Send any climb straight to the Climb Planner to work out your ideal gearing.";

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

const intro = raceIntro(race, climbs, 'HC', 'hors-catégorie');

// Giro's hero shows a different stat set from TDF's (time trial count and
// the Cima Coppi instead of HC-pass/HC-summit-finish counts — verified
// against the live giro26.html, not assumed to match TDF's shape), so it's
// computed here rather than through the shared raceStats() helper.
const mountainStages = race.stages.filter((s) => s.type === 'Mountain').length;
const timeTrials = race.stages.filter((s) => s.type === 'ITT' || s.type === 'TTT').length;
const cimaCoppi = climbs
  .filter((c) => c.cat !== 'TBC' && c.elev)
  .sort((a, b) => (b.elev as number) - (a.elev as number))[0];
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
        description: "Every categorised climb of the 2026 Giro d'Italia — gradient, length, summit altitude and the gearing you'd need to ride it.",
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
          { '@type': 'ListItem', position: 2, name: "Giro d'Italia 2026 Climbs", item: PAGE_URL },
        ],
      },
    ],
  };
}

const mapConfig: MapConfig = {
  mapId: 'giro-map',
  stageCoords: giroMap.STAGE_COORDS as StageCoord[],
  cityLabels: giroMap.CITY_LABELS as CityLabel[],
  countryLabels: [
    { lat: 43.4, lng: 12.0, name: 'ITALY', color: 'rgba(165,45,95,0.5)' },
    { lat: 41.82, lng: 25.0, name: 'BULGARIA', color: 'rgba(165,45,95,0.5)' },
    { lat: 46.95, lng: 8.1, name: 'SWITZERLAND', color: 'rgba(165,45,95,0.5)', size: '9px' },
  ],
  countryFill: {
    '380': '#ff8fc4', // Italy — maglia rosa pink
    '100': '#ffd3e6', // Bulgaria — pale pink
    '674': '#ff8fc4', // San Marino — blend into Italy
    '756': '#ffd3e6', // Switzerland — pale pink (stage 16)
  },
  typeColor: { Mountain: '#ee1c28', Hilly: '#000000', Sprint: '#12b05f', ITT: '#1a72e0', TTT: '#1a72e0' },
  fitBoundsPadding: [28, 28],
  // bottomleft, not topright — topright collides with the Aosta/Pila
  // markers at this map width (verified against the original's own comment).
  zoomControl: { position: 'bottomleft', separate: true },
  // Mobile re-centres on Italy and zooms in, rather than TDF/Vuelta's plain
  // pan — Bulgaria's 3 stages going off-view on mobile is fine once the
  // race is a known shape (verified: this is the original's own tradeoff,
  // not a gap in the port).
  mobileView: { type: 'setView', center: [42.6, 12.5], zoomOffset: 1 },
  zoomDelta: 0.5,
};

// Giro's legend says "ITT" not TDF's "TTT / ITT" — the Giro only has one
// ITT stage and no TTT, verified against the source's own map-legend markup.
const legend: LegendItem[] = [
  { cls: 'ml-m', label: 'Mountain' },
  { cls: 'ml-h', label: 'Hilly' },
  { cls: 'ml-s', label: 'Sprint' },
  { cls: 'ml-t', label: 'ITT' },
];

export default function Giro26Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      {/* Giro's own theme (pink, matching its live giro26.html) — the shared
          globals.css intentionally defaults --accent to TDF's blue rather
          than guess a value for pages not yet migrated (see the comment
          there). The source page's own copy of this block also carried a
          stray `--accent:#1a72e0` override further down that clobbered this
          exact same pink with blue on the live site — not ported here,
          since it reads as an unintentional cascade collision (leftover
          Climb-Planner CSS pasted wholesale into the page), not a deliberate
          design choice, and TDF's build already made the same "drop it"
          call for the same reason. */}
      <style>{`
        :root { --accent: #ec4899; --accent-light: #f9a8d4; }
        nav a.active { background: rgba(236,72,153,0.12); }
      `}</style>

      <div className="hero">
        <h1>Giro d&apos;Italia 2026 Climbs</h1>
        <p>Every stage and climb from the 2026 Giro — Grande Partenza in Bulgaria, then 18 stages through Italy. Send any ascent to the Climb Planner with your setup.</p>
        <div className="hero-stats">
          <div className="hs-item"><div className="hs-val">{race.stages.length}</div><div className="hs-lbl">Stages</div></div>
          <div className="hs-item"><div className="hs-val">{mountainStages}</div><div className="hs-lbl">Mountain stages</div></div>
          <div className="hs-item"><div className="hs-val">{timeTrials}</div><div className="hs-lbl">Time trial</div></div>
          <div className="hs-item"><div className="hs-val">{cimaCoppi.elev}m</div><div className="hs-lbl">Cima Coppi ({cimaCoppi.name})</div></div>
          <div className="hs-item"><div className="hs-val">{startLabel}</div><div className="hs-lbl">Grand Départ · Bulgaria</div></div>
          <div className="hs-item"><div className="hs-val">{endLabel}</div><div className="hs-lbl">Roma</div></div>
        </div>
      </div>

      <RacePageClient
        race={race}
        climbs={climbs}
        staticDefaultStage={staticDefaultStage(race, new Date())}
        stay22Links={stay22Links || {}}
        mapConfig={mapConfig}
        sidebarLabel="Giro Stages"
        legend={legend}
      />

      <StaticIndex race={race} climbs={climbs} intro={intro} h2Color="#ec4899" />

      <AADSUnit />

      <Footer
        attribution="Polka Dot Bike · Giro d'Italia 2026 · Stage and climb data from official race roadbooks; gradients are average values."
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/tdf', label: 'TDF 2026' },
          { href: '/vuelta', label: 'Vuelta 2026' },
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
