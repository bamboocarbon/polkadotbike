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
  const TITLE = `${climb.name} — 3D Climb Profile & Gear Ratios — Polka Dot Bike`;
  const DESCRIPTION = `${climb.name} (${climb.range}): ${climb.len}km at ${climb.grad}% average gradient to ${climb.elev.toLocaleString()}m. Pick your groupset — Shimano, SRAM, Campagnolo or a custom setup — and see exactly which gears get you up it, kilometre by kilometre in 3D.`;
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
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: PAGE_URL,
      name: `${climb.name} — 3D climb profile & gear ratios`,
      description: summary,
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
