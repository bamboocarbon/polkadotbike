import fs from 'fs';
import path from 'path';

// Every climb in climb-index.json gets a route at /climbs/<slug>, but only
// the ones with a real GPX-processed route file (data/climbs/routes/) have
// an actual 3D scene to show — the rest just sit on "move the slider"
// forever. Used to keep robots/sitemap honest: only index climbs with
// real content.
export function hasRouteData(slug: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'data/climbs/routes', `${slug}.json`));
}
