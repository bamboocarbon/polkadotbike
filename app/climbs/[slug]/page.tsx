import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import climbIndexData from '@/data/climb-index.json';
import ClimbDetailClient from './ClimbDetailClient';
import { buildClimbSummary } from '@/lib/climbSummary';
import { hasRouteData } from '@/lib/climbRouteData';

interface RawClimb {
  slug: string;
  name: string;
  range: string;
  cat: string;
  len: number;
  grad: number;
  elev: number;
  races: string[];
}

function findClimb(slug: string): RawClimb | undefined {
  return (climbIndexData.climbs as RawClimb[]).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const climb = findClimb(slug);
  if (!climb) return {};

  const PAGE_URL = `https://polkadotbike.com/climbs/${slug}`;
  const TITLE = `${climb.name} — 3D Profile, Your Time & Gears — Polka Dot Bike`;
  // Leads with the personalised estimate (the differentiator worth ranking
  // and sharing on, per Robin) since SERP/social truncation cuts the end of
  // the string, not the start — the raw stats and GPX mention can afford to
  // be the part that gets clipped on a long climb name.
  const DESCRIPTION = `Get your personalised time and pace for ${climb.name} — ${climb.len}km at ${climb.grad}% to ${climb.elev.toLocaleString()}m in ${climb.range} — from your own power and weight. Ride it in 3D, pick your gearing, download the GPX.`;
  const indexable = hasRouteData(slug);

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    robots: { index: indexable, follow: indexable },
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
}

export const viewport: Viewport = {
  themeColor: '#ef4444',
};

function buildJsonLd(climb: RawClimb, slug: string, summary: string) {
  const PAGE_URL = `https://polkadotbike.com/climbs/${slug}`;
  const indexable = hasRouteData(slug);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: PAGE_URL,
      name: `${climb.name} — 3D climb profile, personalised time estimate & gear ratios`,
      description: summary,
      // Only ties to the WebApplication node below on climbs that actually
      // have the real GPX-built report to back the claim (see indexable
      // below and the noindex/nofollow already applied in generateMetadata
      // for the rest).
      ...(indexable ? { mainEntity: { '@id': `${PAGE_URL}#app` } } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'Climbs', item: 'https://polkadotbike.com/climbs' },
        { '@type': 'ListItem', position: 3, name: climb.name, item: PAGE_URL },
      ],
    },
    // Marks this as an interactive tool, not just an article — same pattern
    // as the site's other calculators (app/climb, app/derailleur, app/wkg,
    // app/compare) — so Google's understanding of the page (and anyone
    // scanning the source before sharing it) matches what it actually does:
    // a personalised time/pace estimate from the rider's own power and
    // weight against this climb's real GPX gradient data, not a static
    // climb-stats page.
    ...(indexable
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            '@id': `${PAGE_URL}#app`,
            name: `${climb.name} — Personalised Climb Report`,
            url: PAGE_URL,
            applicationCategory: 'SportsApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
            description:
              "A personalised time and pace estimate for this exact climb, built from the rider's own power and weight against its real per-kilometre GPX gradient data — plus a 3D terrain view, gear ratios for any groupset, and a downloadable GPX route.",
            author: { '@type': 'Person', name: 'Robin Gillingham', url: 'https://polkadotbike.com/about' },
            isPartOf: { '@id': 'https://polkadotbike.com/#website' },
          },
        ]
      : []),
  ];
}

export default async function ClimbDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const climb = findClimb(slug);
  if (!climb) notFound();

  const summary = buildClimbSummary({
    name: climb.name,
    range: climb.range,
    cat: climb.cat,
    len: climb.len,
    grad: climb.grad,
    elev: climb.elev,
    race: climb.races[0] as 'tdf' | 'giro' | 'vuelta',
  });

  return (
    <>
      {buildJsonLd(climb, slug, summary).map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <ClimbDetailClient name={climb.name} summary={summary} />
    </>
  );
}
