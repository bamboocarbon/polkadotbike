import type { MetadataRoute } from 'next';
import climbIndexData from '@/data/climb-index.json';
import { hasRouteData } from '@/lib/climbRouteData';
import { RPI_ROUTES } from '@/data/rpiRoutes';

const BASE = 'https://polkadotbike.com';

// Every static page that's actually index:true (see each page's own
// `metadata.robots`) — /climbs was noindex until the site went live
// 2026-08-15, now included too (see app/climbs/page.tsx).
const STATIC_PATHS = [
  '/',
  '/climb',
  '/compare',
  '/derailleur',
  '/wkg',
  '/tdf',
  '/giro26',
  '/vuelta',
  '/climbs',
  '/rebeccas-private-idaho',
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
  // Priority bumped from 0.6 alongside the 2026-08-28 SEO pass (title/
  // description/JSON-LD now foreground the Personalised Climb Report) —
  // these are differentiated interactive tools, not generic climb-stats
  // pages, so they rank just under the site's own calculator tools (0.7).
  const climbEntries: MetadataRoute.Sitemap = (climbIndexData.climbs as { slug: string }[])
    .filter((c) => hasRouteData(c.slug))
    .map((c) => ({
      url: `${BASE}/climbs/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    }));

  // Went index:true 2026-08-31 (were noindex while local-only/unreviewed) —
  // same priority tier as the Grand Tour climb pages, same reasoning
  // (differentiated interactive tools with real GPX-backed content, not
  // generic stats pages).
  const rpiEntries: MetadataRoute.Sitemap = RPI_ROUTES.map((r) => ({
    url: `${BASE}/rebeccas-private-idaho/${r.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.65,
  }));

  return [...staticEntries, ...climbEntries, ...rpiEntries];
}
