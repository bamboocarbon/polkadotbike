// Generates, for each race page:
//   1. a static, crawlable stage & climb index, injected directly after the map
//      and BEFORE <div class="container"> so the climb data outranks the
//      interactive explorer, the affiliate units and the ad in DOM order; and
//   2. a single consolidated JSON-LD @graph in <head> (CollectionPage +
//      ItemList + BreadcrumbList), replacing the older pair of unlinked,
//      name-conflicting WebPage/Article blocks.
// Both are idempotent via marker comments — re-run after editing STAGES/CLIMBS.
const fs = require('fs');
const path = require('path');
const { RACES, ORIGIN, DIR, buildDataset } = require('./lib/climbs');

// Climb -> generated page lookup, so the index can link a climb's NAME at its
// own page while the "Plan this climb" action still goes to the Climb Planner.
const DATASET = buildDataset();
const PAGE_BY_RAW_NAME = new Map();
for (const c of DATASET.climbs) {
  if (!c.hasPage) continue;
  for (const a of c.ascents) PAGE_BY_RAW_NAME.set(`${a.race}|${a.rawName}`, c.slug);
}
const climbPageSlug = (raceKey, rawName) => PAGE_BY_RAW_NAME.get(`${raceKey}|${rawName}`) || null;

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
/* The static index sits above the interactive explorer in DOM order (so the climb
   data leads, ahead of the affiliate units and the ad). This skip link keeps the
   explorer one click away instead of a full page-scroll down. */
.si-skip { display:inline-block; margin:0 0 18px; padding:7px 14px; border-radius:9px;
           background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14);
           color:#3b8ef0; font-size:0.88rem; font-weight:600; text-decoration:none; }
.si-skip:hover { background:rgba(255,255,255,0.12); color:#fff; }
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
.si-plan { white-space:nowrap; font-size:0.82rem; font-weight:600; opacity:0.85; }
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
        // Two distinct actions, two destinations: the NAME opens the climb's own
        // page; "Plan" opens the Climb Planner pre-filled. Climbs that were
        // quality-gated out keep the old behaviour (name -> planner).
        const slug = climbPageSlug(race.key, c.name);
        const planHref = `climb.html?gr=${Math.round(c.grad)}&amp;dst=${c.len}`;
        const nameHtml = slug
          ? `<a href="climbs/${slug}.html"><strong>${esc(c.name)}</strong></a>`
          : (hasData ? `<a href="${planHref}"><strong>${esc(c.name)}</strong></a>`
                     : `<strong>${esc(c.name)}</strong>`);
        const planHtml = (slug && hasData) ? ` <a class="si-plan" href="${planHref}">Plan&nbsp;→</a>` : '';
        const stats = hasData
          ? ` — ${c.len}&#8202;km at ${c.grad}%` +
            (c.elev ? `, summit ${c.elev.toLocaleString('en-GB')}&#8202;m` : '') +
            (c.kbf === 0 ? ', stage finish' : (c.kbf > 0 ? `, ${c.kbf}&#8202;km from the finish` : ''))
          : ' — details to be confirmed';
        const notes = c.notes ? ` ${esc(c.notes)}` : '';
        return `      <li>${badge}${nameHtml}${stats}.${notes}${planHtml}</li>`;
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
  <a class="si-skip" href="#stage-explorer">Jump to the interactive stage explorer ↓</a>
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
        // Each item points at the climb's own page where one was generated;
        // climbs below the quality gate fall back to their stage anchor here.
        itemListElement: listed.map((c, i) => {
          const slug = climbPageSlug(race.key, c.name);
          return {
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            url: slug ? `${ORIGIN}/climbs/${slug}.html` : `${pageUrl}#stage-${c.stage}`
          };
        })
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

// Runtime lookup so the interactive explorer's climb cards can link a climb's
// name at its own page, exactly as the static index does.
function buildClimbPagesBlock(race, CLIMBS) {
  const map = {};
  for (const c of CLIMBS) {
    const slug = climbPageSlug(race.key, c.name);
    if (slug) map[c.name] = slug;
  }
  return `<!-- CLIMB-PAGES START (generated by gen_static_index.js — do not hand-edit; re-run the script) -->
<script>
/* climb name -> /climbs/<slug>.html, for climbs that cleared the quality gate */
const CLIMB_PAGES = ${JSON.stringify(map)};
</script>
<!-- CLIMB-PAGES END -->
`;
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

  /* ---- 1. static stage index: always strip, then re-insert above .container ----
     Stripping first and re-anchoring means the block relocates itself even on a
     file where it is still sitting in the old position below the ad. Because the
     AADS unit sits between .container and <footer> once the index is lifted out,
     this single move puts the climb data ahead of BOTH the affiliate units
     (which live inside #stage-detail, within .container) and the ad. */
  // Strip, then normalise the seam to exactly one blank line, then insert.
  // Consuming surrounding newlines on strip and re-establishing them on insert
  // is what keeps repeated runs byte-identical rather than growing whitespace.
  html = html.replace(/\n*<!-- STATIC-STAGE-INDEX START[\s\S]*?<!-- STATIC-STAGE-INDEX END -->\n*/, '\n');

  // NB: carries id="stage-explorer" — the skip link inside the generated index
  // targets it. Keep this string in sync with the markup in the race pages.
  const CONTAINER = '<div class="container" id="stage-explorer">';
  if (!html.includes(CONTAINER)) throw new Error(`${race.file}: '${CONTAINER}' anchor not found`);
  html = html.replace(new RegExp(`\\n*${CONTAINER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `\n\n${CONTAINER}`);
  html = html.replace(CONTAINER, `${section}${CONTAINER}`);

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

  html = html.replace(/\n*<!-- CLIMB-PAGES START[\s\S]*?<!-- CLIMB-PAGES END -->\n*/, '\n');

  const jsonLd = buildJsonLdBlock(race, STAGES, CLIMBS);
  const climbPages = buildClimbPagesBlock(race, CLIMBS);
  if (!html.includes('</head>')) throw new Error(`${race.file}: no </head>`);
  html = html.replace(/\n*<\/head>/, '\n</head>');
  html = html.replace('</head>', `${climbPages}${jsonLd}</head>`);

  fs.writeFileSync(fp, html);

  const graph = buildGraph(race, STAGES, CLIMBS);
  const nItems = graph['@graph'][1].numberOfItems;
  console.log(
    `${race.file}: ${STAGES.length} stages, ${CLIMBS.length} climbs injected · ` +
    `ItemList ${nItems} items · dateModified ${BUILD_DATE} · ` +
    `replaced legacy JSON-LD [${dropped.join(', ') || 'none'}]`
  );
}
