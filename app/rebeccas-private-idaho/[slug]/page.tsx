import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findRpiRoute } from '@/data/rpiRoutes';
import RpiRouteDetailClient from './RpiRouteDetailClient';

// Indexable since 2026-08-31 (Robin: "turn the pages on so they are
// seen and indexable" — affiliates/ads stay off separately, see
// RPI_AFFILIATES_ENABLED in components/rpi/rpiFeatureFlags.ts). Was
// noindex as a safety default while local-only/unreviewed, same
// reasoning as the parent /rebeccas-private-idaho page.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = findRpiRoute(slug);
  if (!route) return {};
  return {
    title: `${route.name} — Rebecca's Private Idaho — Polka Dot Bike`,
    robots: { index: true, follow: true },
  };
}

export default async function RpiRouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = findRpiRoute(slug);
  if (!route) notFound();

  return <RpiRouteDetailClient route={route} />;
}
