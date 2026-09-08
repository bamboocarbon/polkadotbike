import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findCheqRoute, type CheqRoute } from '@/data/cheqRoutes';
import CheqRouteDetailClient from './CheqRouteDetailClient';

const SITE = 'https://polkadotbike.com';

// Went index:true 2026-09-08 alongside app/chequamegon/page.tsx — see its
// comment for the launch note.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = findCheqRoute(slug);
  if (!route) return {};

  const PAGE_URL = `${SITE}/chequamegon/${slug}`;
  const TITLE = `${route.name} — 3D Profile, Your Time & Gears — Polka Dot Bike`;
  const DESCRIPTION = `Get your personalised time and pace for ${route.name} at the Chequamegon MTB Festival — ${route.lengthKm.toFixed(1)}km, ${route.ascentM.toLocaleString()}m of climbing. Ride it in 3D, pick your gearing, download the GPX.`;

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

function buildJsonLd(route: CheqRoute) {
  const PAGE_URL = `${SITE}/chequamegon/${route.slug}`;
  const INDEX_URL = `${SITE}/chequamegon`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: PAGE_URL,
      name: `${route.name} — 3D course profile, personalised time estimate & gear ratios`,
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
        { '@type': 'ListItem', position: 2, name: 'Chequamegon MTB Festival', item: INDEX_URL },
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
        "A personalised time and pace estimate for this exact course, built from the rider's own power and weight against its real per-point GPX gradient data — plus a 3D terrain view, gear ratios for any groupset, and a downloadable GPX route.",
      author: { '@type': 'Person', name: 'Robin Gillingham', url: `${SITE}/about` },
      isPartOf: { '@id': `${SITE}/#website` },
    },
  ];
}

export default async function CheqRouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = findCheqRoute(slug);
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
      <CheqRouteDetailClient route={route} />
    </>
  );
}
