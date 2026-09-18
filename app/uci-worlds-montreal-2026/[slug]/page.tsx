import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findMontrealWorldsRoute, type MontrealWorldsRoute } from '@/data/montrealWorldsRoutes';
import MontrealWorldsRouteDetailClient from './MontrealWorldsRouteDetailClient';

const SITE = 'https://polkadotbike.com';

// Indexable from the start (see app/uci-worlds-montreal-2026/page.tsx).
// Rewritten 2026-09-18 (Robin: "highlight our gear calculator, the worlds
// RR and TT races and the 3D mapping") — title/description lead with the
// real-world race (TT finishing climb / RR circuit, branched on
// route.kind) and the "3D" visualiser, then close on "gear ratio
// calculator" — same phrasing as the homepage's own title, for
// consistent keyword targeting sitewide. Both kept under ~155 chars so
// Google doesn't truncate the description.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = findMontrealWorldsRoute(slug);
  if (!route) return {};

  const PAGE_URL = `${SITE}/uci-worlds-montreal-2026/${slug}`;
  const raceLabel = route.kind === 'tt' ? 'ITT Finishing Climb' : 'Road Race Circuit';
  const rideDescription =
    route.kind === 'tt'
      ? "Ride the Montréal 2026 UCI Worlds time trial's finishing climb in 3D"
      : 'Ride the Mount Royal circuit from the Montréal 2026 UCI Worlds road race in 3D';
  const TITLE = `Montréal 2026 Worlds ${raceLabel} — 3D Map & Gear Calculator — Polka Dot Bike`;
  const DESCRIPTION = `${rideDescription}, then use our free gear ratio calculator to find your ideal setup for it.`;

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

function buildJsonLd(route: MontrealWorldsRoute) {
  const PAGE_URL = `${SITE}/uci-worlds-montreal-2026/${route.slug}`;
  const INDEX_URL = `${SITE}/uci-worlds-montreal-2026`;

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
        { '@type': 'ListItem', position: 2, name: 'UCI Worlds 2026, Montréal', item: INDEX_URL },
        { '@type': 'ListItem', position: 3, name: route.name, item: PAGE_URL },
      ],
    },
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

export default async function MontrealWorldsRouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = findMontrealWorldsRoute(slug);
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
      <MontrealWorldsRouteDetailClient route={route} />
    </>
  );
}
