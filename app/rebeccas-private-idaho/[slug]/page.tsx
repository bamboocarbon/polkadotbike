import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findRpiRoute } from '@/data/rpiRoutes';
import RpiRouteDetailClient from './RpiRouteDetailClient';

// Local-only for now (2026-08-30) — noindex as a safety default, same
// reasoning as the parent /rebeccas-private-idaho page.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = findRpiRoute(slug);
  if (!route) return {};
  return {
    title: `${route.name} — Rebecca's Private Idaho — Polka Dot Bike`,
    robots: { index: false, follow: false },
  };
}

export default async function RpiRouteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = findRpiRoute(slug);
  if (!route) notFound();

  return <RpiRouteDetailClient route={route} />;
}
