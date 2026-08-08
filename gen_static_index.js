// Generates, for each race page:
//   1. a static, crawlable stage & climb index, injected directly after
//      <div class="container"> (the interactive explorer) and BEFORE the AADS
//      ad unit — the explorer is navigation plus real content and stays above
//      the fold; the display ad is what gets demoted, not the explorer; and
//   2. a single consolidated JSON-LD @graph in <head> (CollectionPage +
//      ItemList + BreadcrumbList), replacing the older pair of unlinked,
//      name-conflicting WebPage/Article blocks.
// Both are idempotent via marker comments — re-run after editing STAGES/CLIMBS.
const fs = require('fs');
const path = require('path');
const DIR = '/Users/robingillingham/cycle gears';
const ORIGIN = 'https://polkadotbike.com';

const RACES = [
  // h2col: race colour for the section title
  // specialCat/specialLabel: this race's top climb category and how to phrase it in the intro line
  // country: SportsEvent location. datePublished: preserved from the blocks this replaces.
  // Race start/end dates are derived from STAGES, never hardcoded here.
  { file: 'tdf.html',    name: 'Tour de France 2026',    slug: 'tdf',    h2col: '#ffe94d', specialCat: 'HC',  specialLabel: 'hors-catégorie',   country: 'France', descName: '2026 Tour de France', datePublished: '2026-07-04', breadcrumb: 'Tour de France 2026 Climbs' },
  { file: 'giro26.html', name: "Giro d'Italia 2026",     slug: 'giro',   h2col: '#ec4899', specialCat: 'HC',  specialLabel: 'hors-catégorie',   country: 'Italy',  descName: "2026 Giro d'Italia", datePublished: '2026-07-04', breadcrumb: "Giro d'Italia 2026 Climbs" },
  { file: 'vuelta.html', name: 'La Vuelta a España 2026',slug: 'vuelta', h2col: '#ef4444', specialCat: 'ESP', specialLabel: 'especial-category', country: 'Spain',  descName: '2026 Vuelta a España', datePublished: '2026-07-30', breadcrumb: 'Vuelta a España 2026 Climbs' },
];

const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
const TYPE_LABEL = { Mountain: 'Mountain stage', Hilly: 'Hilly stage', Medium: 'Medium mountain stage', Sprint: 'Sprint stage', Flat: 'Flat stage', TTT: 'Team time trial', ITT: 'Individual time trial' };
const CAT_CLS = { HC: 'cat-hc', ESP: 'cat-esp', Cat1: 'cat-cat1', Cat2: 'cat-cat2', Cat3: 'cat-cat3', Cat4: 'cat-cat4', TBC: 'cat-tbc' };

const cssFor = race => `
.static-index { position:relative; z-index:1; max-width:1160px; margin:30px auto 0; padding:0 20px; }
.static-index h2 { font-size:1.45rem; margin:0 0 6px; color:${race.h2col}; }
.si-intro { color:var(--muted); font-size:0.95rem; line-height:1.55; margin:0 0 14px; }
.si-stage { border-radius:12px; padding:16px 18px; margin-bottom:12px; }
.si-stage h3 { margin:0 0 3px; font-size:1.04rem; }
.si-stage h3 a { color:inherit; text-decoration:none; }
.si-stage h3 a:hover { text-decoration:underline; }
.si-meta { color:var(--muted); font-size:0.84rem; margin:0 0 8px; }
.si-notes { font-size:0.9rem; line-height:1.5; margin:0; }
.si-climbs { list-style:none; margin:8px 0 0; padding:0; }
.si-climbs li { padding:7px 0 0; margin-top:7px; border-top:1px solid rgba(255,255,255,0.08); font-size:0.9rem; line-height:1.55; }
.si-climbs a { color:#3b8ef0; text-decoration:none; }
.si-climbs a:hover { text-decoration:underline; }
.si-climbs .cc-cat { margin-right:6px; }
`.trim();

function buildSection(race, STAGES, CLIMBS) {
  const climbsByStage = {};
  for (const c of CLIMBS) (climbsByStage[c.stage] = climbsByStage[c.stage] || []).push(c);

  const catCount = CLIMBS.filter(c => c.cat !== 'TBC').length;
  const hcCount = CLIMBS.filter(c => c.cat === race.specialCat).length;
  const mtnCount = STAGES.filter(s => s.type === 'Mountain').length;
  const first = STAGES[0], last = STAGES[STAGES.length - 1];
  const highest = CLIMBS.filter(c => c.cat !== 'TBC' && c.elev).sort((a, b) => b.elev - a.elev)[0];

  const intro = `The ${race.name} runs from ${fmtDate(first.date)} (${esc(first.start)}) to ${fmtDate(last.date)} (${esc(last.finish)}) — ${STAGES.length} stages, ${mtnCount} of them mountain stages, with ${catCount} categorised climbs including ${hcCount} ${race.specialLabel} ascents. The highest point of the race is ${esc(highest.name)} at ${highest.elev.toLocaleString('en-GB')}&#8202;m. Every stage and climb is listed below with its length, average gradient and summit altitude — follow any climb's link to open it in the <a href="climb.html" style="color:#3b8ef0">Climb Planner</a> and work out the gearing you'd need to ride it yourself.`;

  const stagesHtml = STAGES.map(s => {
    const climbs = (climbsByStage[s.num] || []).slice().sort((a, b) => {
      if (a.kbf === null) return -1; if (b.kbf === null) return 1; return b.kbf - a.kbf;
    });
    // Stages where every detected climb is uncategorised (TBC) collapse to a one-line
    // note rather than individual entries — matches the interactive page's own rule
    // (climb-by-climb stats for those aren't confirmed/reliable enough to publish).
    const catClimbCount = climbs.filter(c => c.cat !== 'TBC').length;
    const allTBC = climbs.length > 0 && catClimbCount === 0;

    let climbsBlock = '';
    if (allTBC) {
      climbsBlock = `    <p class="si-notes">Rolling stage with ${climbs.length} uncategorised climb${climbs.length !== 1 ? 's' : ''}.</p>`;
    } else if (climbs.length) {
      const climbLis = climbs.map(c => {
        const badge = `<span class="cc-cat ${CAT_CLS[c.cat] || 'cat-tbc'}">${esc(c.cat)}</span>`;
        const hasData = c.len !== null && c.grad !== null;
        const nameHtml = hasData
          ? `<a href="climb.html?gr=${Math.round(c.grad)}&amp;dst=${c.len}"><strong>${esc(c.name)}</strong></a>`
          : `<strong>${esc(c.name)}</strong>`;
        const stats = hasData
          ? ` — ${c.len}&#8202;km at ${c.grad}%` +
            (c.elev ? `, summit ${c.elev.toLocaleString('en-GB')}&#8202;m` : '') +
            (c.kbf === 0 ? ', stage finish' : (c.kbf > 0 ? `, ${c.kbf}&#8202;km from the finish` : ''))
          : ' — details to be confirmed';
        const notes = c.notes ? ` ${esc(c.notes)}` : '';
        return `      <li>${badge}${nameHtml}${stats}.${notes}</li>`;
      }).join('\n');
      climbsBlock = `    <ul class="si-climbs">\n${climbLis}\n    </ul>`;
    }

    const meta = `${TYPE_LABEL[s.type] || esc(s.type)} · ${s.dist}&#8202;km · ${s.vgain.toLocaleString('en-GB')}&#8202;m of climbing`;
    return `  <article class="si-stage glass" id="stage-${s.num}">
    <h3><a href="${race.file}?s=${s.num}">Stage ${s.num} · ${fmtDate(s.date)} · ${esc(s.start)} → ${esc(s.finish)}</a></h3>
    <p class="si-meta">${meta}</p>
    <p class="si-notes">${esc(s.notes)}</p>
${climbsBlock}
  </article>`;
  }).join('\n');

  return `<!-- STATIC-STAGE-INDEX START (generated by gen_static_index.js — do not hand-edit; re-run the script) -->
<style>
${cssFor(race)}
</style>
<section class="static-index" id="all-stages">
  <h2>Every stage and climb of the ${race.name}</h2>
  <p class="si-intro">${intro}</p>
${stagesHtml}
</section>
<!-- STATIC-STAGE-INDEX END -->
`;
}

/* ============================================================================
   JSON-LD @graph
   One graph per race page, replacing the previous pair of unlinked blocks
   (a WebPage named "… Climbs & Gearing" and an Article headlined with just the
   race name — that name conflict is what the GSC "Events: non-critical issues"
   warning was picking up). Article is dropped entirely: this is a reference
   collection, not an article. ItemList is the type that actually describes
   60+ named items carrying numeric attributes.
============================================================================ */
function buildGraph(race, STAGES, CLIMBS) {
  // Mirror exactly what the static index renders as individual named entries:
  // climbs on a stage whose climbs are ALL uncategorised collapse to a single
  // summary line there, so they are not list items here either.
  const byStage = {};
  for (const c of CLIMBS) (byStage[c.stage] = byStage[c.stage] || []).push(c);
  const listed = CLIMBS.filter(c => byStage[c.stage].some(x => x.cat !== 'TBC'));

  const pageUrl = `${ORIGIN}/${race.file}`;
  const startDate = STAGES[0].date;
  const endDate = STAGES[STAGES.length - 1].date;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: `${race.name} Climbs`,
        description: `Every categorised climb of the ${race.descName} — gradient, length, summit altitude and the gearing you'd need to ride it.`,
        isPartOf: { '@id': `${ORIGIN}/#website` },
        author: { '@id': `${ORIGIN}/about.html#robin` },
        datePublished: race.datePublished,
        dateModified: BUILD_DATE,
        mainEntity: { '@id': `${pageUrl}#climblist` },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        about: {
          '@type': 'SportsEvent',
          name: race.name,
          startDate,
          endDate,
          eventStatus: 'https://schema.org/EventScheduled',
          location: { '@type': 'Country', name: race.country }
        }
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#climblist`,
        name: `Climbs of the ${race.descName}`,
        numberOfItems: listed.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        // Interim: each item points at its stage anchor on this page. Phase 3
        // repoints these at the individual /climbs/<slug>.html pages.
        itemListElement: listed.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: `${pageUrl}#stage-${c.stage}`
        }))
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: race.breadcrumb, item: pageUrl }
        ]
      }
    ]
  };
}

function buildJsonLdBlock(race, STAGES, CLIMBS) {
  const graph = buildGraph(race, STAGES, CLIMBS);
  return `<!-- RACE-JSONLD START (generated by gen_static_index.js — do not hand-edit; re-run the script) -->
<script type="application/ld+json">
${JSON.stringify(graph, null, 2)}
</script>
<!-- RACE-JSONLD END -->
`;
}

for (const race of RACES) {
  const fp = path.join(DIR, race.file);
  let html = fs.readFileSync(fp, 'utf8');

  const grab = name => {
    const m = html.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
    if (!m) throw new Error(`${name} not found in ${race.file}`);
    return eval(m[1]);
  };
  const STAGES = grab('STAGES');
  const CLIMBS = grab('CLIMBS');

  const section = buildSection(race, STAGES, CLIMBS);

  /* ---- 1. static stage index: always strip, then re-insert directly before
     the AADS ad unit ---- Stripping first and re-anchoring means the block
     relocates itself even on a file where it's still sitting in the wrong
     position. The interactive explorer (.container) is navigation plus real
     content and stays where it is, above the fold; only the display ad gets
     demoted, so the index is anchored to the ad, not to the explorer. */
  // Strip, then normalise the seam to exactly one blank line, then insert.
  // Consuming surrounding newlines on strip and re-establishing them on insert
  // is what keeps repeated runs byte-identical rather than growing whitespace.
  html = html.replace(/\n*<!-- STATIC-STAGE-INDEX START[\s\S]*?<!-- STATIC-STAGE-INDEX END -->\n*/, '\n');

  const AADS = '<!-- BEGIN AADS AD UNIT';
  if (!html.includes(AADS)) throw new Error(`${race.file}: '${AADS}' anchor not found`);
  html = html.replace(new RegExp(`\\n*${AADS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `\n\n${AADS}`);
  html = html.replace(AADS, `${section}\n${AADS}`);

  /* ---- 2. JSON-LD: strip our own marker block, then any legacy standalone
     WebPage / Article / BreadcrumbList blocks, then insert the @graph in <head>. */
  html = html.replace(/\n*<!-- RACE-JSONLD START[\s\S]*?<!-- RACE-JSONLD END -->\n*/, '\n');

  let dropped = [];
  html = html.replace(
    /[ \t]*<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>\n?/g,
    (whole, body) => {
      let parsed;
      try { parsed = JSON.parse(body); } catch { return whole; }   // leave unparseable alone
      if (parsed['@graph']) return whole;                          // never eat a graph
      if (['WebPage', 'Article', 'BreadcrumbList'].includes(parsed['@type'])) {
        dropped.push(parsed['@type']);
        return '';
      }
      return whole;
    }
  );

  const jsonLd = buildJsonLdBlock(race, STAGES, CLIMBS);
  if (!html.includes('</head>')) throw new Error(`${race.file}: no </head>`);
  html = html.replace(/\n*<\/head>/, '\n</head>');
  html = html.replace('</head>', `${jsonLd}</head>`);

  fs.writeFileSync(fp, html);

  const graph = buildGraph(race, STAGES, CLIMBS);
  const nItems = graph['@graph'][1].numberOfItems;
  console.log(
    `${race.file}: ${STAGES.length} stages, ${CLIMBS.length} climbs injected · ` +
    `ItemList ${nItems} items · dateModified ${BUILD_DATE} · ` +
    `replaced legacy JSON-LD [${dropped.join(', ') || 'none'}]`
  );
}
