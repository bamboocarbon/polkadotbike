/* ============================================================================
   Shared climb dataset.

   The three race pages each carry a `const CLIMBS = [...]` JS array literal
   that is also read at runtime (renderStage, the map, renderClimbCard). Parsing
   those literals is fragile, so it happens exactly once — here — and every
   generator consumes the result instead of re-parsing the HTML itself.

   The HTML stays the editing surface; data/climbs.json is regenerated from it
   on every build, so the two can never drift.
============================================================================ */
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '..');
const ORIGIN = 'https://polkadotbike.com';

const RACES = [
  { key: 'tdf',    file: 'tdf.html',    name: 'Tour de France 2026',     descName: '2026 Tour de France',  short: 'Tour de France',   h2col: '#ffe94d', specialCat: 'HC',  specialLabel: 'hors-catégorie',    country: 'France', datePublished: '2026-07-04', breadcrumb: 'Tour de France 2026 Climbs' },
  { key: 'giro',   file: 'giro26.html', name: "Giro d'Italia 2026",      descName: "2026 Giro d'Italia",   short: "Giro d'Italia",    h2col: '#ec4899', specialCat: 'HC',  specialLabel: 'hors-catégorie',    country: 'Italy',  datePublished: '2026-07-04', breadcrumb: "Giro d'Italia 2026 Climbs" },
  { key: 'vuelta', file: 'vuelta.html', name: 'La Vuelta a España 2026', descName: '2026 Vuelta a España', short: 'La Vuelta',        h2col: '#ef4444', specialCat: 'ESP', specialLabel: 'especial-category', country: 'Spain',  datePublished: '2026-07-30', breadcrumb: 'Vuelta a España 2026 Climbs' },
];

/* ---- slugs -------------------------------------------------------------- */
// lowercase, ASCII-fold accents (Côte -> cote), strip apostrophes so
// "Col d'Aspin" -> col-daspin, everything else non-alphanumeric -> hyphen.
function slugify(name) {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip combining accents
    .replace(/[''’‘`]/g, '')                            // apostrophes vanish, not hyphenated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ---- name parsing ------------------------------------------------------- */
// Two kinds of parenthetical appear in the data and they mean different things:
//   "(1st ascent)" / "(2nd)"        -> an ordinal pass over the SAME climb; merge
//   "(via Roccamorice)" / "(X side)"-> the route/side taken; merge, record route
// Anything else — "(Collada de Toses)", "(Le Scale di Primolano)" — is an
// alternate NAME and stays part of the climb's identity.
const ORDINAL_RE = /\s*\((1st|2nd|3rd|4th|\d+(?:st|nd|rd|th))(?:\s+ascent)?\)\s*$/i;
const ROUTE_RE   = /\s*\((via\s+.+?|.+?\s+side)\)\s*$/i;

function parseName(raw) {
  let name = raw.trim(), ordinal = null, route = null;

  const o = name.match(ORDINAL_RE);
  if (o) { ordinal = o[1].toLowerCase(); name = name.replace(ORDINAL_RE, '').trim(); }

  const r = name.match(ROUTE_RE);
  if (r) { route = r[1].trim(); name = name.replace(ROUTE_RE, '').trim(); }

  return { base: name, ordinal, route };
}

/* ---- quality gate ------------------------------------------------------- */
// "Gate E". Length was deliberately dropped as a criterion: it is a poor proxy
// for difficulty (Gavarnie-Gèdre is 18.7km at 3.7%), and category already
// encodes difficulty properly because the organisers set it from the full
// profile rather than the average. Once category is a criterion, length adds
// noise only.
const TOP_CATS = ['HC', 'ESP', 'Cat1', 'Cat2'];
const EDITORIAL_RE = /souvenir|first (?:ever )?(?:time|ascent|used)|never before|legendary|historic|iconic|classic|scene of|famous|cima coppi|record|monument|tradition|brutal|queen stage|highest point|unprecedented/i;

function qualifies(c) {
  if (TOP_CATS.includes(c.cat)) return 'category';
  if (c.kbf === 0)              return 'summit finish';
  if (c.profile && c.profile.length) return 'has profile';
  if (EDITORIAL_RE.test(c.notes || '')) return 'editorial note';
  return null;
}

/* ---- extraction --------------------------------------------------------- */
function readArray(html, name, file) {
  const m = html.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
  if (!m) throw new Error(`${name} not found in ${file}`);
  return eval(m[1]);
}

function loadRaces() {
  return RACES.map(r => {
    const html = fs.readFileSync(path.join(DIR, r.file), 'utf8');
    return { ...r, STAGES: readArray(html, 'STAGES', r.file), CLIMBS: readArray(html, 'CLIMBS', r.file) };
  });
}

/* ---- dataset ------------------------------------------------------------ */
// One entry per named climb. Repeated ascents (same climb, different stage or a
// second pass on the same day) collapse into one entry carrying an `ascents`
// list. Merging is keyed on the base name alone, NOT scoped by race, so a climb
// used by two different Grand Tours — or by the same race in two editions —
// resolves to a single page. No cross-race duplicates exist in the 2026 data
// (the three routes use different mountain ranges by design); the axis this
// actually guards is years.
function buildDataset() {
  const races = loadRaces();
  const bySlug = new Map();
  const slugMap = [];   // every raw name -> slug, so collisions surface in the log

  for (const race of races) {
    for (const c of race.CLIMBS) {
      const { base, ordinal, route } = parseName(c.name);
      const slug = slugify(base);
      slugMap.push({ raw: c.name, base, slug, race: race.key, stage: c.stage });

      const stage = race.STAGES.find(s => s.num === c.stage) || null;
      const ascent = {
        race: race.key, raceName: race.name, raceShort: race.short, raceFile: race.file,
        stage: c.stage,
        stageStart: stage ? stage.start : null,
        stageFinish: stage ? stage.finish : null,
        stageDate: stage ? stage.date : null,
        ordinal, route,
        len: c.len ?? null, grad: c.grad ?? null, elev: c.elev ?? null,
        cat: c.cat, kbf: c.kbf ?? null,
        profile: c.profile || null,
        notes: (c.notes || '').trim() || null,
        rawName: c.name,
      };

      if (!bySlug.has(slug)) {
        bySlug.set(slug, { slug, name: base, range: c.range || null, ascents: [] });
      }
      bySlug.get(slug).ascents.push(ascent);
    }
  }

  const climbs = [...bySlug.values()].map(cl => {
    // Header stats come from the most complete ascent (longest); each ascent
    // still carries its own figures so genuine differences stay visible.
    const withLen = cl.ascents.filter(a => a.len != null);
    const primary = (withLen.length ? withLen : cl.ascents)
      .slice().sort((a, b) => (b.len || 0) - (a.len || 0))[0];

    const rank = c => ['ESP', 'HC', 'Cat1', 'Cat2', 'Cat3', 'Cat4', 'Uncat', 'TBC'].indexOf(c);
    const hardestCat = cl.ascents.slice().sort((a, b) => rank(a.cat) - rank(b.cat))[0].cat;

    const profileAscent = cl.ascents.find(a => a.profile && a.profile.length) || null;
    const reasons = [...new Set(cl.ascents.map(qualifies).filter(Boolean))];

    // Do the ascents actually differ in length/gradient? Drives the explicit
    // "these differ because it's a different side" callout on the page.
    const varies = withLen.length > 1 &&
      new Set(withLen.map(a => `${a.len}|${a.grad}`)).size > 1;

    return {
      slug: cl.slug,
      name: cl.name,
      range: cl.range,
      cat: hardestCat,
      len: primary.len, grad: primary.grad, elev: primary.elev,
      profile: profileAscent ? profileAscent.profile : null,
      isSummitFinish: cl.ascents.some(a => a.kbf === 0),
      ascentsVary: varies,
      races: [...new Set(cl.ascents.map(a => a.race))],
      hasPage: reasons.length > 0,
      gateReasons: reasons,
      notes: cl.ascents.map(a => a.notes).filter(Boolean),
      ascents: cl.ascents.sort((a, b) => a.stage - b.stage || (a.ordinal || '').localeCompare(b.ordinal || '')),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'en'));

  // Collision check: two DIFFERENT base names landing on one slug would silently
  // merge unrelated climbs, so surface it rather than letting it pass.
  const collisions = [];
  const seen = new Map();
  for (const s of slugMap) {
    if (seen.has(s.slug) && seen.get(s.slug) !== s.base) {
      collisions.push({ slug: s.slug, a: seen.get(s.slug), b: s.base });
    }
    seen.set(s.slug, s.base);
  }

  return { races, climbs, slugMap, collisions, ORIGIN };
}

module.exports = { RACES, ORIGIN, DIR, slugify, parseName, qualifies, loadRaces, buildDataset, TOP_CATS };
