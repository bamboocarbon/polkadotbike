import type { ReactNode } from 'react';
import climbsData from '@/data/climbs.json';
import stay22Data from '@/data/stay22.json';
import tdfMap from '@/data/tdf-map.json';
import giroMap from '@/data/giro-map.json';
import vueltaMap from '@/data/vuelta-map.json';
import { raceIntro, type RaceData, type Climb, type RaceIntro } from '@/lib/raceHelpers';
import type { MapConfig, LegendItem } from '@/components/race/RacePageClient';
import type { StageCoord, CityLabel } from '@/components/race/RaceMapInner';
import type { FooterLink } from '@/components/Footer';

export const RACE_SLUGS = ['tdf', 'giro26', 'vuelta'] as const;
export type RaceSlug = (typeof RACE_SLUGS)[number];

export interface HeroStat {
  val: string | number;
  label: string;
}

export interface RaceConfig {
  slug: RaceSlug;
  race: RaceData;
  climbs: Climb[];
  stay22Links: Record<string, string>;
  pageUrl: string;
  title: string;
  description: string;
  jsonLdDescription: string;
  jsonLdDatePublished: string;
  themeColor: string;
  accent: string;
  accentLight: string;
  accentActiveBg: string;
  h1: string;
  heroSub: string;
  heroStats: HeroStat[];
  intro: RaceIntro;
  mapConfig: MapConfig;
  legend?: LegendItem[];
  h2Color: string;
  sidebarLabel: string;
  footerAttribution: ReactNode;
  footerLinks: FooterLink[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// ---------------------------------------------------------------------------
// TDF
// ---------------------------------------------------------------------------
const tdfRace = climbsData.races.tdf as RaceData;
const tdfClimbs = climbsData.climbs.filter((c) => c.race === 'tdf') as Climb[];
const tdfStats = {
  stages: tdfRace.stages.length,
  mountainStages: tdfRace.stages.filter((s) => s.type === 'Mountain').length,
  specialClimbCount: tdfClimbs.filter((c) => c.cat === 'HC').length,
  specialSummitFinishes: tdfClimbs.filter((c) => c.cat === 'HC' && c.kbf === 0).length,
  startLabel: shortDate(tdfRace.startDate),
  endLabel: shortDate(tdfRace.endDate),
};

const tdfConfig: RaceConfig = {
  slug: 'tdf',
  race: tdfRace,
  climbs: tdfClimbs,
  stay22Links: stay22Data.tdf,
  pageUrl: 'https://polkadotbike.com/tdf',
  title: 'Tour de France 2026 Climbs & Gearing · Polka Dot Bike',
  description:
    "Every major climb of the 2026 Tour de France — gradient, length and category. Pick a col and plan the exact gearing you'll need with the Climb Planner.",
  jsonLdDescription:
    "Every categorised climb of the 2026 Tour de France — gradient, length, summit altitude and the gearing you'd need to ride it.",
  jsonLdDatePublished: '2026-07-04',
  themeColor: '#ef4444',
  accent: '#3b82f6',
  accentLight: '#93c5fd',
  accentActiveBg: 'rgba(59,130,246,0.12)',
  h1: 'Tour de France 2026 Climbs',
  heroSub: 'Pick a climb — see the gradient, length, and category, then send it straight to the Climb Planner with your setup.',
  heroStats: [
    { val: tdfStats.stages, label: 'Stages' },
    { val: tdfStats.mountainStages, label: 'Mountain stages' },
    { val: tdfStats.specialClimbCount, label: 'HC passes' },
    { val: tdfStats.specialSummitFinishes, label: 'HC summit finishes' },
    { val: tdfStats.startLabel, label: 'Race start' },
    { val: tdfStats.endLabel, label: 'Paris' },
  ],
  intro: raceIntro(tdfRace, tdfClimbs, 'HC', 'hors-catégorie'),
  mapConfig: {
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
    zoomInOnDesktop: true,
  },
  // No legend override — RacePageClient's own default is TDF's exact legend.
  h2Color: '#ffe94d',
  sidebarLabel: 'Tour Stages',
  footerAttribution:
    'Polka Dot Bike · Tour de France 2026 · Stage and climb data from the official Tour de France roadbook; gradients are average values.',
  footerLinks: [
    { href: '/', label: '← Gear Calculator' },
    { href: '/wkg', label: 'W/KG and FTP' },
    { href: '/guide', label: 'Guide' },
    { href: '/glossary', label: 'Glossary' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy.html', label: 'Privacy' },
    { href: '/disclaimer.html', label: 'Disclaimer' },
  ],
};

// ---------------------------------------------------------------------------
// Giro
// ---------------------------------------------------------------------------
const giroRace = climbsData.races.giro as RaceData;
const giroClimbs = climbsData.climbs.filter((c) => c.race === 'giro') as Climb[];
// Giro's hero shows a different stat set from TDF's (time trial count and
// the Cima Coppi instead of HC-pass/HC-summit-finish counts — verified
// against the live giro26.html, not assumed to match TDF's shape).
const giroMountainStages = giroRace.stages.filter((s) => s.type === 'Mountain').length;
const giroTimeTrials = giroRace.stages.filter((s) => s.type === 'ITT' || s.type === 'TTT').length;
const giroCimaCoppi = giroClimbs
  .filter((c) => c.cat !== 'TBC' && c.elev)
  .sort((a, b) => (b.elev as number) - (a.elev as number))[0];

const giro26Config: RaceConfig = {
  slug: 'giro26',
  race: giroRace,
  climbs: giroClimbs,
  stay22Links: stay22Data.giro,
  pageUrl: 'https://polkadotbike.com/giro26',
  title: "Giro d'Italia 2026 Climbs & Gearing · Polka Dot Bike",
  description:
    "Every major climb of the 2026 Giro d'Italia — gradient, length and category. Send any climb straight to the Climb Planner to work out your ideal gearing.",
  jsonLdDescription:
    "Every categorised climb of the 2026 Giro d'Italia — gradient, length, summit altitude and the gearing you'd need to ride it.",
  jsonLdDatePublished: '2026-07-04',
  themeColor: '#ef4444',
  accent: '#ec4899',
  accentLight: '#f9a8d4',
  accentActiveBg: 'rgba(236,72,153,0.12)',
  h1: "Giro d'Italia 2026 Climbs",
  heroSub: 'Every stage and climb from the 2026 Giro — Grande Partenza in Bulgaria, then 18 stages through Italy. Send any ascent to the Climb Planner with your setup.',
  heroStats: [
    { val: giroRace.stages.length, label: 'Stages' },
    { val: giroMountainStages, label: 'Mountain stages' },
    { val: giroTimeTrials, label: 'Time trial' },
    { val: `${giroCimaCoppi.elev}m`, label: `Cima Coppi (${giroCimaCoppi.name})` },
    { val: shortDate(giroRace.startDate), label: 'Grand Départ · Bulgaria' },
    { val: shortDate(giroRace.endDate), label: 'Roma' },
  ],
  intro: raceIntro(giroRace, giroClimbs, 'HC', 'hors-catégorie'),
  mapConfig: {
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
  },
  // Giro's legend says "ITT" not TDF's "TTT / ITT" — the Giro only has one
  // ITT stage and no TTT, verified against the source's own map-legend markup.
  legend: [
    { cls: 'ml-m', label: 'Mountain' },
    { cls: 'ml-h', label: 'Hilly' },
    { cls: 'ml-s', label: 'Sprint' },
    { cls: 'ml-t', label: 'ITT' },
  ],
  h2Color: '#ec4899',
  sidebarLabel: 'Giro Stages',
  footerAttribution:
    "Polka Dot Bike · Giro d'Italia 2026 · Stage and climb data from official race roadbooks; gradients are average values.",
  footerLinks: [
    { href: '/', label: '← Gear Calculator' },
    { href: '/tdf', label: 'TDF 2026' },
    { href: '/vuelta', label: 'Vuelta 2026' },
    { href: '/guide', label: 'Guide' },
    { href: '/glossary', label: 'Glossary' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy.html', label: 'Privacy' },
    { href: '/disclaimer.html', label: 'Disclaimer' },
  ],
};

// ---------------------------------------------------------------------------
// Vuelta
// ---------------------------------------------------------------------------
const vueltaRace = climbsData.races.vuelta as RaceData;
const vueltaClimbs = climbsData.climbs.filter((c) => c.race === 'vuelta') as Climb[];
// "Mountain days" specifically means Mountain + Medium combined (6 Mountain
// + 4 Medium = 10, matching the source's hardcoded value exactly) — a
// broader count than raceIntro's own "6 mountain stages" text, which
// deliberately stays strict-Mountain-only. Both are independently correct.
const vueltaMountainDays = vueltaRace.stages.filter((s) => s.type === 'Mountain' || s.type === 'Medium').length;
const vueltaEspecialClimbs = vueltaClimbs.filter((c) => c.cat === 'ESP').length;
const vueltaTimeTrials = vueltaRace.stages.filter((s) => s.type === 'ITT' || s.type === 'TTT').length;

const vueltaConfig: RaceConfig = {
  slug: 'vuelta',
  race: vueltaRace,
  climbs: vueltaClimbs,
  stay22Links: stay22Data.vuelta,
  pageUrl: 'https://polkadotbike.com/vuelta',
  title: 'La Vuelta a España 2026 Climbs & Gearing · Polka Dot Bike',
  description:
    "Every major climb of the 2026 Vuelta a España — gradient, length and category. Pick a puerto and plan the exact gearing you'll need with the Climb Planner.",
  jsonLdDescription:
    "Every categorised climb of the 2026 Vuelta a España — gradient, length, summit altitude and the gearing you'd need to ride it.",
  jsonLdDatePublished: '2026-07-30',
  themeColor: '#ef4444',
  accent: '#f59e0b',
  accentLight: '#fcd34d',
  accentActiveBg: 'rgba(245,158,11,0.12)',
  h1: 'La Vuelta a España 2026 Climbs',
  heroSub: 'Pick a puerto — see the gradient, length, and category, then send it straight to the Climb Planner with your setup.',
  heroStats: [
    { val: vueltaRace.stages.length, label: 'Stages' },
    { val: vueltaMountainDays, label: 'Mountain days' },
    { val: vueltaEspecialClimbs, label: 'Especial climbs' },
    { val: vueltaTimeTrials, label: 'Time trials' },
    { val: shortDate(vueltaRace.startDate), label: 'Monaco start' },
    { val: shortDate(vueltaRace.endDate), label: 'Granada' },
  ],
  intro: raceIntro(vueltaRace, vueltaClimbs, 'ESP', 'especial-category'),
  mapConfig: {
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
    // No zoomInOnDesktop — confirmed the source never zooms in an extra
    // step here, unlike TDF.
    typeDotCls: { Mountain: 'md-vm', Medium: 'md-mm', Hilly: 'md-h', Flat: 'md-s', ITT: 'md-t' },
    tooltipDirection: 'auto',
    labelPlacement: 'dynamic',
  },
  legend: [
    { cls: 'ml-vm', label: 'Mountain' },
    { cls: 'ml-h', label: 'Hilly' },
    { cls: 'ml-s', label: 'Flat' },
    { cls: 'ml-t', label: 'ITT' },
  ],
  h2Color: '#f59e0b',
  sidebarLabel: 'Vuelta Stages',
  footerAttribution: (
    <>
      Polka Dot Bike · La Vuelta a España 2026 · Stage list, dates and climb categories from the official Vuelta roadbook.
      <br />
      Per-stage elevation gain and some climb lengths/gradients come from Komoot&apos;s route data and CyclingCols; the rest are independently researched
      <br />
      or reconstructed estimates from the official stage profile. All gradients are average values.
    </>
  ),
  footerLinks: [
    { href: '/', label: '← Gear Calculator' },
    { href: '/wkg', label: 'W/KG and FTP' },
    { href: '/guide', label: 'Guide' },
    { href: '/glossary', label: 'Glossary' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy.html', label: 'Privacy' },
    { href: '/disclaimer.html', label: 'Disclaimer' },
  ],
};

export const RACE_CONFIGS: Record<RaceSlug, RaceConfig> = {
  tdf: tdfConfig,
  giro26: giro26Config,
  vuelta: vueltaConfig,
};

export function getRaceConfig(slug: string): RaceConfig | undefined {
  return RACE_CONFIGS[slug as RaceSlug];
}
