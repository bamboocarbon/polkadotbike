import type { MetadataRoute } from 'next';
import climbIndexData from '@/data/climb-index.json';
import { hasRouteData } from '@/lib/climbRouteData';

const BASE = 'https://polkadotbike.com';

// Every static page that's actually index:true (see each page's own
// `metadata.robots`) — /climbs itself is deliberately excluded, it's
// noindex until the whole site goes live (see app/climbs/page.tsx).
const STATIC_PATHS = [
  '/',
  '/climb',
  '/compare',
  '/derailleur',
  '/wkg',
  '/tdf',
  '/giro26',
  '/vuelta',
  '/about',
  '/guide',
  '/glossary',
  '/contact',
  '/privacy',
  '/disclaimer',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === '/' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : 0.7,
  }));

  // Only climbs with a real GPX-processed route (see hasRouteData) are
  // indexable — the rest 404 to a working page but with no actual 3D
  // content, so they're deliberately left out of both robots and here.
  const climbEntries: MetadataRoute.Sitemap = (climbIndexData.climbs as { slug: string }[])
    .filter((c) => hasRouteData(c.slug))
    .map((c) => ({
      url: `${BASE}/climbs/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

  return [...staticEntries, ...climbEntries];
}
