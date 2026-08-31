import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findRpiRoute, type RpiRoute } from '@/data/rpiRoutes';
import RpiRouteDetailClient from './RpiRouteDetailClient';

const SITE = 'https://polkadotbike.com';

// Indexable + full SEO metadata since 2026-08-31 (Robin: "turn the pages
// on so they are seen and indexable" then "do the SEOs and the X cards").
// Mirrors app/climbs/[slug]/page.tsx's pattern exactly (description leads
// with the personalised estimate — SERP/social truncation cuts the end of
// the string, not the start — same three JSON-LD blocks below), since RPI
// route pages have the identical feature set (3D plan/terrain/wedge,
// gear-ratio panel, personalised time/speed report, GPX download) that
// pattern was built for. Was noindex/no-metadata-at-all while
// local-only/unreviewed.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = findRpiRoute(slug);
  if (!route) return {};

  const PAGE_URL = `${SITE}/rebeccas-private-idaho/${slug}`;
  const TITLE = `${route.name} — 3D Profile, Your Time & Gears — Polka Dot Bike`;
  const DESCRIPTION = `Get your personalised time and pace for ${route.name} at Rebecca's Private Idaho — ${route.lengthKm.toFixed(1)}km, ${route.ascentM.toLocaleString()}m of climbing. Ride it in 3D, pick your gearing, download the GPX.`;

  return {
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
}

function buildJsonLd(route: RpiRoute) {
  const PAGE_URL = `${SITE}/rebeccas-private-idaho/${route.slug}`;
  const INDEX_URL = `${SITE}/rebeccas-private-idaho`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: PAGE_URL,
      name: `${route.name} — 3D route profile, personalised time estimate & gear ratios`,
      description: route.blurb,
      mainEntity: { '@id': `${PAGE_URL}#app` },
      breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${PAGE_URL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: "Rebecca's Private Idaho", item: INDEX_URL },
        { '@type': 'ListItem', position: 3, name: route.name, item: PAGE_URL },
      ],
    },
    // Same "this is an interactive tool, not an article" marker as the
    // Grand Tour climb pages (app/climbs/[slug]/page.tsx) — every RPI
    // route already has real GPX-built route data by construction (unlike
    // climbs, which gate this on hasRouteData), so no indexable check
    // needed here.
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${PAGE_URL}#app`,
      name: `${route.name} — Personalised Climb Report`,
      url: PAGE_URL,
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      description:
        "A personalised time and pace estimate for this exact route, built from the rider's own power and weight against its real per-point GPX gradient data — plus a 3D terrain view, gear ratios for any groupset, and a downloadable GPX route.",
      author: { '@type': 'Person', name: 'Robin Gillingham', url: `${SITE}/about` },
      isPartOf: { '@id': `${SITE}/#website` },
    },
  ];
}

export default async function RpiRouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = findRpiRoute(slug);
  if (!route) notFound();

  return (
    <>
      {buildJsonLd(route).map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <RpiRouteDetailClient route={route} />
    </>
  );
}
