/* ============================================================================
   Generates one page per named climb at /climbs/<slug>.html, plus the shared
   data/climbs.json artifact.

   Why these pages exist: every climb on the race pages previously linked to the
   same URL with different query strings (climb.html?gr=7&dst=13.7), so nothing
   on the site could rank for "Alpe d'Huez gearing" or "Col du Tourmalet
   gradient profile" — the long-tail queries a young domain can actually win.

   Do not hand-edit anything under /climbs/. Fix the generator and re-run.
============================================================================ */
const fs = require('fs');
const path = require('path');
const { buildDataset, DIR, ORIGIN } = require('./lib/climbs');

const OUT_DIR = path.join(DIR, 'climbs');
const DATA_DIR = path.join(DIR, 'data');
const CHROME_DONOR = 'glossary.html';   // a plain content page — same chrome, no map/tool JS
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CAT_CLS = { HC: 'cat-hc', ESP: 'cat-esp', Cat1: 'cat-cat1', Cat2: 'cat-cat2', Cat3: 'cat-cat3', Cat4: 'cat-cat4', Uncat: 'cat-tbc', TBC: 'cat-tbc' };
const num = n => (n % 1 === 0 ? String(n) : String(parseFloat(n.toFixed(2))));

/* ---- elevation profile --------------------------------------------------
   Byte-for-byte the same renderer the race pages use, so a climb's profile
   looks identical wherever it appears. Pure function — safe to run at build. */
function renderProfile(c) {
  if (!c.profile || !c.profile.length) return '';
  const p = c.profile;
  let cum = 0;
  const elev = [0, ...p.map(g => (cum += g * 10, cum))];
  const totalElev = elev[elev.length - 1];
  const KM_PX = 12, PX_PER_100M = 6, H = 90, pad = 4;
  const W = p.length * KM_PX + pad * 2;
  const iH = H - pad * 2, yb = H - pad;
  const useH = Math.min(iH, totalElev / 100 * PX_PER_100M);
  const fills = p.map((g, i) => {
    const col = g < 5 ? '#12b05f' : g < 7 ? '#ffcd00' : g < 9 ? '#ff6600' : '#ee1c28';
    const x1 = (pad + i * KM_PX).toFixed(1), x2 = (pad + (i + 1) * KM_PX).toFixed(1);
    const y1 = (pad + iH - elev[i] / totalElev * useH).toFixed(1);
    const y2 = (pad + iH - elev[i + 1] / totalElev * useH).toFixed(1);
    return `<polygon points="${x1},${yb} ${x1},${y1} ${x2},${y2} ${x2},${yb}" fill="${col}"/>`;
  }).join('');
  const outline = elev.map((e, i) =>
    `${(pad + i * KM_PX).toFixed(1)},${(pad + iH - e / totalElev * useH).toFixed(1)}`).join(' ');
  return `<div class="cc-profile"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gradient profile, kilometre by kilometre" style="display:block;width:100%;max-width:${W}px;height:auto;border-radius:4px;overflow:hidden"><rect width="${W}" height="${H}" fill="rgba(0,0,0,0.28)" rx="4"/>${fills}<polyline points="${outline}" fill="none" stroke="rgba(255,255,255,0.72)" stroke-width="1.5" stroke-linejoin="round"/></svg><div class="profile-meta" style="max-width:${W}px"><span>▲ ${Math.round(totalElev)}m gain</span><span>${num(c.len)}km</span></div></div>`;
}

/* ---- physics ------------------------------------------------------------
   Same model as the Climb Planner: gravity + rolling resistance + aero drag,
   solved for speed by Newton-Raphson. */
function speedAtPower(watts, mass, gradePct, cda, crr) {
  const g = 9.81, Crr = crr ?? 0.004, rho = 1.225;
  const gr = Math.atan(gradePct / 100);
  const B = mass * g * (Math.sin(gr) + Crr * Math.cos(gr));
  const A = 0.5 * rho * cda;
  if (watts <= 0 || (B <= 0 && A <= 0)) return 0;
  let v = Math.max(0.1, Math.cbrt(watts / A));
  for (let i = 0; i < 80; i++) {
    const fv = A * v * v * v + B * v - watts;
    const dfv = 3 * A * v * v + B;
    if (Math.abs(dfv) < 1e-9) break;
    const dv = fv / dfv;
    v = Math.max(0.01, v - dv);
    if (Math.abs(dv) < 1e-6) break;
  }
  return v * 3.6;
}

// A deliberately ordinary rider, stated on the page so the numbers can be
// judged. 200W at 75kg is ~2.7 W/kg — a solid club rider, not a racer.
const RIDER = { watts: 200, riderKg: 75, bikeKg: 8, cda: 0.36, crr: 0.004, cadence: 85, wheelCircM: 2.136 };
const RINGS = [34, 36, 39];
const COGS  = [25, 27, 28, 30, 32, 34, 36];

function gearingFor(gradPct, lenKm) {
  const mass = RIDER.riderKg + RIDER.bikeKg;
  const speed = speedAtPower(RIDER.watts, mass, gradPct, RIDER.cda, RIDER.crr);
  // Largest gear ratio that still lets you turn RIDER.cadence at that speed.
  const maxRatio = (speed * 1000 / 60) / RIDER.cadence / RIDER.wheelCircM;
  const combos = [];
  for (const r of RINGS) for (const c of COGS) combos.push({ ring: r, cog: c, ratio: r / c });
  combos.sort((a, b) => b.ratio - a.ratio);
  const pick = combos.find(c => c.ratio <= maxRatio) || null;
  const timeMin = speed > 0 && lenKm ? (lenKm / speed) * 60 : null;
  const vam = gradPct > 0 ? Math.round(speed * gradPct * 10) : null;
  return { speed, maxRatio, pick, timeMin, vam, easiest: combos[combos.length - 1] };
}

const fmtTime = m => m == null ? null : (m >= 60 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.round(m)} min`);

/* ---- chrome -------------------------------------------------------------
   Lifted from a real page at build time rather than duplicated here, so the
   climb pages inherit nav items, consent banner, analytics and the seasonal
   polka-dot switch automatically. Relative links are rewritten root-relative
   because these pages live one directory down. */
function loadChrome() {
  const h = fs.readFileSync(path.join(DIR, CHROME_DONOR), 'utf8');
  const grab = (re, label) => {
    const m = h.match(re);
    if (!m) throw new Error(`chrome: ${label} not found in ${CHROME_DONOR}`);
    return m[0];
  };
  const rootRelative = s => s
    .replace(/(href|src)="(?!https?:|\/\/|\/|#|mailto:|data:)([^"]+)"/g, '$1="/$2"');
  // The donor is a real page, so it carries its own nav highlight and its own
  // footer tagline. Neither belongs on a climb page.
  const deActivate = s => s.replace(/\s*class="active"/g, '');
  const reTagline = s => s.replace(
    /(<span class="pdb-brand">Polka<span class="pdb-dot">DOT<\/span>Bike<\/span>)[^<]*/,
    '$1 — Climb profiles, gradients and the gearing you need. Figures are indicative.');

  return {
    baseStyle:   grab(/<style>[\s\S]*?<\/style>/, 'base <style>'),
    dotsStyle:   grab(/<style id="polka-hero-dots">[\s\S]*?<\/style>/, 'polka-hero-dots'),
    dotSwitch:   grab(/<!-- VUELTA-DOT-SWITCH -->\s*<script>[\s\S]*?<\/script>/, 'dot switch'),
    brandStyle:  grab(/<style id="pdb-inline-brand">[\s\S]*?<\/style>/, 'pdb-inline-brand'),
    navStyle:    grab(/<style id="polka-mobile-nav">[\s\S]*?<\/style>/, 'polka-mobile-nav'),
    dcyStyle:    grab(/<style id="dcy-inline-brand">[\s\S]*?<\/style>/, 'dcy-inline-brand'),
    ga:          grab(/<!-- GA-CONSENT-LOADER START -->[\s\S]*?<!-- GA-CONSENT-LOADER END -->/, 'GA loader'),
    consent:     rootRelative(grab(/<style>\s*#pdb-consent\{[\s\S]*?<\/script>/, 'consent banner')),
    noscript:    rootRelative(grab(/<noscript>[\s\S]*?<\/noscript>/, 'noscript')),
    header:      deActivate(rootRelative(grab(/<header>[\s\S]*?<\/header>/, 'header'))),
    footer:      reTagline(rootRelative(grab(/<footer>[\s\S]*?<\/footer>/, 'footer'))),
  };
}

const PAGE_CSS = `
    .cl-wrap { position:relative; z-index:1; max-width:900px; margin:0 auto; padding:0 20px 60px; }
    .cl-head { margin-bottom:18px; }
    .cl-head h1 { font-size:clamp(28px,5vw,44px); font-weight:900; letter-spacing:-1.2px; line-height:1.08; color:#0f172a; }
    .cl-sub { margin-top:8px; font-size:14px; color:rgba(15,23,42,0.72); font-weight:600; }
    .cl-card { background:var(--glass); border:1px solid rgba(255,255,255,0.12); border-radius:16px; padding:18px 20px; margin-bottom:16px; }
    .cl-card h2 { font-size:1.05rem; margin:0 0 10px; color:#fff; }
    .cl-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(96px,1fr)); gap:14px; }
    .cl-stat .v { font-family:'IBM Plex Sans',Inter,system-ui,sans-serif; font-size:23px; font-weight:700; color:#fff; line-height:1; }
    .cl-stat .l { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-top:5px; }
    .cl-note { font-size:0.92rem; line-height:1.6; color:var(--sec); margin-top:10px; }
    .cl-note + .cl-note { margin-top:8px; }
    table.cl-km { width:100%; border-collapse:collapse; font-size:0.86rem; margin-top:4px; }
    table.cl-km th, table.cl-km td { padding:5px 8px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.08); }
    table.cl-km th { color:var(--muted); font-size:9.5px; text-transform:uppercase; letter-spacing:0.08em; font-weight:700; }
    table.cl-km td { color:var(--sec); }
    table.cl-km td.g { font-weight:700; }
    .cl-asc { border-top:1px solid rgba(255,255,255,0.08); padding-top:10px; margin-top:10px; }
    .cl-asc:first-of-type { border-top:none; padding-top:0; margin-top:0; }
    .cl-asc-h { font-size:0.95rem; font-weight:700; color:#fff; }
    .cl-asc-h a { color:#3b8ef0; text-decoration:none; }
    .cl-asc-h a:hover { text-decoration:underline; }
    .cl-asc-m { font-size:0.86rem; color:var(--muted); margin-top:3px; }
    .cl-cta { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; background:#1a72e0; border-radius:9px; color:#fff; font-size:13px; font-weight:700; text-decoration:none; margin-top:12px; }
    .cl-cta:hover { background:#3b8ef0; color:#fff; }
    .cl-links { font-size:0.9rem; line-height:1.9; }
    .cl-links a { color:#3b8ef0; text-decoration:none; }
    .cl-links a:hover { text-decoration:underline; }
    .cl-assume { font-size:0.8rem; color:var(--muted); margin-top:10px; line-height:1.5; }
    .cc-cat { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; padding:3px 8px; border-radius:5px; white-space:nowrap; border:none; display:inline-block; vertical-align:middle; }
    .cat-hc { background:#ee1c28; color:#fff; } .cat-esp { background:#ee1c28; color:#fff; }
    .cat-cat1 { background:#ffcd00; color:#000; } .cat-cat2 { background:#12b05f; color:#fff; }
    .cat-cat3 { background:#1a72e0; color:#fff; } .cat-cat4 { background:#000; color:#fff; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.25); }
    .cat-tbc { background:#475569; color:#fff; }
    .cc-profile { margin:8px 0 4px; }
    .cc-profile svg { display:block; }
    .profile-meta { display:flex; justify-content:space-between; margin-top:3px; font-size:9.5px; color:var(--muted); }
`.trim();

/* ---- page ---------------------------------------------------------------- */
function buildPage(c, chrome, dataset) {
  const url = `${ORIGIN}/climbs/${c.slug}.html`;
  const catCls = CAT_CLS[c.cat] || 'cat-tbc';
  const gearing = (c.grad != null && c.grad > 0) ? gearingFor(c.grad, c.len) : null;

  const title = `${c.name} — Gradient, Profile & Gearing · Polka Dot Bike`;
  const descBits = [];
  if (c.len != null && c.grad != null) descBits.push(`${num(c.len)}km at ${num(c.grad)}%`);
  if (c.elev) descBits.push(`summit ${c.elev.toLocaleString('en-GB')}m`);
  const metaDesc = `${c.name}: ${descBits.join(', ')}. Gradient profile, every race ascent, and the gearing you'd need to ride it yourself.`;

  /* stats */
  const stats = [];
  if (c.len != null)  stats.push([`${num(c.len)}`, 'km long']);
  if (c.grad != null) stats.push([`${num(c.grad)}%`, 'avg gradient']);
  if (c.elev)         stats.push([`${c.elev.toLocaleString('en-GB')}m`, 'summit']);
  if (c.profile && c.profile.length) {
    stats.push([`${Math.round(c.profile.reduce((s, g) => s + g * 10, 0))}m`, 'elevation gain']);
    stats.push([`${num(Math.max(...c.profile))}%`, 'steepest km']);
  }
  const statsHtml = stats.map(([v, l]) => `<div class="cl-stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');

  /* per-km table — the differentiator, only where real profile data exists */
  let kmTable = '';
  if (c.profile && c.profile.length) {
    let cum = 0;
    const rows = c.profile.map((g, i) => {
      cum += g * 10;
      const col = g < 5 ? '#12b05f' : g < 7 ? '#ffcd00' : g < 9 ? '#ff6600' : '#ee1c28';
      return `<tr><td>km ${i + 1}</td><td class="g" style="color:${col}">${num(g)}%</td><td>+${Math.round(g * 10)}m</td><td>${Math.round(cum)}m</td></tr>`;
    }).join('');
    kmTable = `<div class="cl-card"><h2>Gradient, kilometre by kilometre</h2>
      ${renderProfile(c)}
      <table class="cl-km"><thead><tr><th>Section</th><th>Gradient</th><th>Gain</th><th>Cumulative</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="cl-assume">Per-kilometre averages. Short ramps within a kilometre can be considerably steeper than the figure shown.</p></div>`;
  }

  /* ascents */
  const ascHtml = c.ascents.map(a => {
    const bits = [];
    if (a.len != null && a.grad != null) bits.push(`${num(a.len)}km at ${num(a.grad)}%`);
    if (a.elev) bits.push(`summit ${a.elev.toLocaleString('en-GB')}m`);
    if (a.kbf === 0) bits.push('stage finish');
    else if (a.kbf > 0) bits.push(`${num(a.kbf)}km from the finish`);
    const route = a.route ? ` <em>(${esc(a.route)})</em>` : '';
    const ord = a.ordinal ? ` — ${a.ordinal} ascent` : '';
    const stageLabel = `Stage ${a.stage}${a.stageStart ? `: ${esc(a.stageStart)} → ${esc(a.stageFinish)}` : ''}`;
    return `<div class="cl-asc">
      <div class="cl-asc-h"><span class="cc-cat ${CAT_CLS[a.cat] || 'cat-tbc'}">${esc(a.cat)}</span>
        <a href="/${a.raceFile}?s=${a.stage}">${esc(a.raceName)} — ${stageLabel}</a>${ord}${route}</div>
      <div class="cl-asc-m">${bits.join(' · ')}</div>
      ${a.notes ? `<div class="cl-note">${esc(a.notes)}</div>` : ''}
    </div>`;
  }).join('');

  const variesNote = c.ascentsVary
    ? `<p class="cl-assume">The ascents below differ in length and gradient because they are ridden from different sides or by different roads — they are not the same climb twice.</p>`
    : '';

  /* gearing */
  let gearHtml = '';
  if (gearing) {
    const planUrl = `/climb.html?gr=${num(c.grad)}&amp;dst=${num(c.len ?? 5)}`;
    const g = gearing;
    const pick = g.pick
      ? `a <strong>${g.pick.ring}×${g.pick.cog}</strong> (ratio ${g.pick.ratio.toFixed(2)}:1) or easier`
      : `something easier than a ${g.easiest.ring}×${g.easiest.cog} — this gradient is beyond a standard road setup at that cadence`;
    const extra = [];
    if (g.timeMin) extra.push(`about <strong>${fmtTime(g.timeMin)}</strong> to the top`);
    if (g.vam) extra.push(`a VAM of roughly <strong>${g.vam.toLocaleString('en-GB')} m/hr</strong>`);
    gearHtml = `<div class="cl-card"><h2>What gearing do you need?</h2>
      <p class="cl-note">Riding ${esc(c.name)} at a steady <strong>${RIDER.watts}W</strong>, a ${RIDER.riderKg}kg rider on an ${RIDER.bikeKg}kg bike would climb at roughly <strong>${g.speed.toFixed(1)} km/h</strong>${extra.length ? ` — ${extra.join(' and ')}` : ''}.</p>
      <p class="cl-note">To turn <strong>${RIDER.cadence} rpm</strong> at that speed you want ${pick}. Anything harder and you will be grinding below ${RIDER.cadence} rpm for ${c.len != null ? `${num(c.len)}km` : 'the whole climb'}.</p>
      <a class="cl-cta" href="${planUrl}">Plan this climb with your own setup →</a>
      <p class="cl-assume">Assumes ${RIDER.watts}W sustained, ${RIDER.riderKg + RIDER.bikeKg}kg all-in, hoods position (CdA ${RIDER.cda}), asphalt (Crr ${RIDER.crr}) and 700×28c wheels. Change any of those in the <a href="/climb.html" style="color:#3b8ef0">Climb Planner</a> — the figures move a lot with weight and power.</p></div>`;
  }

  /* schema — Place carries elevation; no geo, since the dataset holds no
     coordinates and inventing them would be worse than omitting the property */
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': `${url}#page`, url,
        name: `${c.name} — Gradient, Profile & Gearing`,
        description: metaDesc,
        isPartOf: { '@id': `${ORIGIN}/#website` },
        author: { '@id': `${ORIGIN}/about.html#robin` },
        dateModified: BUILD_DATE,
        mainEntity: { '@id': `${url}#climb` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'Place', '@id': `${url}#climb`, name: c.name,
        ...(c.range ? { containedInPlace: { '@type': 'Place', name: c.range } } : {}),
        ...(c.elev ? { elevation: { '@type': 'QuantitativeValue', value: c.elev, unitCode: 'MTR' } } : {}),
      },
      {
        '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: c.ascents[0].raceName + ' Climbs', item: `${ORIGIN}/${c.ascents[0].raceFile}` },
          { '@type': 'ListItem', position: 3, name: c.name, item: url },
        ],
      },
    ],
  };

  const subBits = [c.range, c.races.map(r => dataset.races.find(x => x.key === r).short).join(' · ')].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(metaDesc)}">
    <link rel="canonical" href="${url}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#ef4444">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Polka Dot Bike">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(metaDesc)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${ORIGIN}/og-card.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(metaDesc)}">
    <meta name="twitter:image" content="${ORIGIN}/og-card.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
${chrome.baseStyle}
<style>
${PAGE_CSS}
</style>
${chrome.dotsStyle}
${chrome.dotSwitch}
${chrome.brandStyle}
${chrome.navStyle}
${chrome.dcyStyle}
${chrome.ga}
<script type="application/ld+json">
${JSON.stringify(graph, null, 2)}
</script>
</head>
<body>
${chrome.consent}
${chrome.noscript}
<div class="bg-scene"><div class="bg-sky"></div><div class="bg-mountains"></div></div>
${chrome.header}

<div class="hero">
    <h1>${esc(c.name)}</h1>
    ${subBits.length ? `<p class="cl-sub">${esc(subBits.join(' · '))}</p>` : ''}
</div>

<div class="cl-wrap">

    <div class="cl-card">
        <h2><span class="cc-cat ${catCls}">${esc(c.cat)}</span> &nbsp;The numbers</h2>
        <div class="cl-stats">${statsHtml}</div>
    </div>

${kmTable}
${gearHtml}

    <div class="cl-card">
        <h2>Where it appears${c.ascents.length > 1 ? ` — ${c.ascents.length} ascents` : ''}</h2>
        ${variesNote}
        ${ascHtml}
    </div>

    <div class="cl-card cl-links">
        <h2>Work out your own numbers</h2>
        <a href="/climb.html">Climb Planner</a> — speed, time and gearing for any gradient with your power and weight.<br>
        <a href="/index.html">Gear Ratio Calculator</a> — every gear your bike actually has, in order.<br>
        <a href="/wkg.html">W/kg &amp; FTP</a> — the number that really predicts how you climb.<br>
        <a href="/glossary.html">Glossary</a> — gradient, VAM, gear inches and the rest, explained.
    </div>

</div>

${chrome.footer}
</body>
</html>
`;
}

/* ---- run ----------------------------------------------------------------- */
const dataset = buildDataset();

if (dataset.collisions.length) {
  console.error('SLUG COLLISIONS — two different climbs would share one page:');
  dataset.collisions.forEach(c => console.error(`  ${c.slug}: "${c.a}" vs "${c.b}"`));
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const chrome = loadChrome();
const pages = dataset.climbs.filter(c => c.hasPage);

// Remove any stale pages from a previous run whose climb no longer qualifies.
const keep = new Set(pages.map(c => `${c.slug}.html`));
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.html') && !keep.has(f)) { fs.unlinkSync(path.join(OUT_DIR, f)); console.log(`  removed stale ${f}`); }
}

for (const c of pages) fs.writeFileSync(path.join(OUT_DIR, `${c.slug}.html`), buildPage(c, chrome, dataset));

fs.writeFileSync(path.join(DATA_DIR, 'climbs.json'), JSON.stringify({
  generated: BUILD_DATE,
  source: 'Extracted from the CLIMBS arrays in tdf.html, giro26.html and vuelta.html by lib/climbs.js. Do not hand-edit — edit the race pages and re-run.',
  counts: { distinctClimbs: dataset.climbs.length, pagesGenerated: pages.length },
  climbs: dataset.climbs,
}, null, 2));

const withProfile = pages.filter(c => c.profile).length;
const topNoProfile = pages.filter(c => ['HC', 'ESP', 'Cat1'].includes(c.cat) && !c.profile);
console.log(`climbs: ${dataset.climbs.length} distinct · ${pages.length} pages written to /climbs/`);
console.log(`  with per-km profile : ${withProfile}/${pages.length}`);
console.log(`  HC/ESP/Cat1 missing a profile (pre-launch backfill): ${topNoProfile.length}`);
topNoProfile.forEach(c => console.log(`     ${c.cat.padEnd(4)} ${c.name}`));
console.log(`  data/climbs.json written (${dataset.climbs.length} climbs)`);
