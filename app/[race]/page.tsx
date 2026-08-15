import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import RacePageClient from '@/components/race/RacePageClient';
import StaticIndex from '@/components/race/StaticIndex';
import '@/components/race/race.css';
import { RACE_SLUGS, getRaceConfig, type RaceConfig } from '@/lib/raceConfigs';
import { staticDefaultStage, type Climb } from '@/lib/raceHelpers';

interface PageProps {
  params: { race: string };
}

export function generateStaticParams() {
  return RACE_SLUGS.map((race) => ({ race }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const config = getRaceConfig(params.race);
  if (!config) return {};

  return {
    // {absolute} bypasses the root layout's title template ('%s · Polka
    // Dot Bike') — each config's title already ends in "· Polka Dot Bike"
    // itself (needed verbatim for openGraph/twitter below, which get no
    // template applied), so without this the suffix would render twice.
    title: { absolute: config.title },
    description: config.description,
    alternates: { canonical: config.pageUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: 'Polka Dot Bike',
      title: config.title,
      description: config.description,
      url: config.pageUrl,
      images: [{ url: 'https://polkadotbike.com/og-card.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: ['https://polkadotbike.com/og-card.png'],
    },
  };
}

export function generateViewport({ params }: PageProps): Viewport {
  const config = getRaceConfig(params.race);
  return { themeColor: config?.themeColor ?? '#ef4444' };
}

// Build-time snapshot — every race route is statically generated, so this
// evaluates once per build, which is exactly what "build timestamp, not a
// hardcoded string" (3.7) asks for. Shared across all 3 races rather than
// recomputed per page, since it's the same build.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

function buildJsonLd(config: RaceConfig) {
  const { race, climbs, pageUrl } = config;
  const byStage: Record<number, Climb[]> = {};
  for (const c of climbs) (byStage[c.stage] ||= []).push(c);
  const listed = climbs.filter((c) => byStage[c.stage].some((x) => x.cat !== 'TBC'));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: `${race.name} Climbs`,
        description: config.jsonLdDescription,
        isPartOf: { '@id': 'https://polkadotbike.com/#website' },
        author: { '@id': 'https://polkadotbike.com/about.html#robin' },
        datePublished: config.jsonLdDatePublished,
        dateModified: BUILD_DATE,
        mainEntity: { '@id': `${pageUrl}#climblist` },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
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
        '@id': `${pageUrl}#climblist`,
        name: `Climbs of the ${race.name}`,
        numberOfItems: listed.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: listed.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: `${pageUrl}#stage-${c.stage}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
          { '@type': 'ListItem', position: 2, name: `${race.name} Climbs`, item: pageUrl },
        ],
      },
    ],
  };
}

export default function RacePage({ params }: PageProps) {
  const config = getRaceConfig(params.race);
  if (!config) notFound();

  const { race, climbs, stay22Links, mapConfig, legend, h2Color, sidebarLabel, intro } = config;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(config)) }}
      />

      {/* Each race's own theme colour, used for its on-page charts/borders.
          globals.css defaults --accent to TDF's blue as a safe fallback
          rather than guessing at a value for pages that aren't migrated yet
          (see the comment there) — every real race route sets its own
          explicitly. Giro's source page also carried a stray
          `--accent:#1a72e0` override further down that clobbered its own
          pink with blue on the live site; that override is deliberately not
          ported here, since it reads as an unintentional cascade collision
          (leftover Climb-Planner CSS pasted wholesale into the page) rather
          than a design choice. The nav active-tab colour intentionally does
          NOT follow this — it stays the fixed blue from globals.css so
          Giro/TDF/Vuelta read as one consistent nav, not three. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root { --accent: ${config.accent}; --accent-light: ${config.accentLight}; }
        .hero > h1 { font-size: clamp(26px, 5vw, 46px); }
      `,
        }}
      />

      <div className="hero">
        <h1>{config.h1}</h1>
        <p>{config.heroSub}</p>
        <div className="hero-stats">
          {config.heroStats.map((s) => (
            <div className="hs-item" key={s.label}>
              <div className="hs-val">{s.val}</div>
              <div className="hs-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <RacePageClient
        race={race}
        climbs={climbs}
        staticDefaultStage={staticDefaultStage(race, new Date())}
        stay22Links={stay22Links || {}}
        mapConfig={mapConfig}
        sidebarLabel={sidebarLabel}
        legend={legend}
      />

      <StaticIndex race={race} climbs={climbs} intro={intro} h2Color={h2Color} />

      <AADSUnit />

      <Footer attribution={config.footerAttribution} links={config.footerLinks} />
    </>
  );
}
