#!/usr/bin/env node
/*
 * Checks every Performance Bicycle affiliate link in data/pb-links.json
 * still resolves to a real, in-stock product page (or a valid category
 * fallback page). data/pb-links.json is read by lib/pbLinks.ts, imported
 * by every component with a "Buy These Components" box (DerailleurCalculator,
 * CompareTool, BuyCard, ...), so this checks all of them in one pass.
 *
 * 2026-09-02: repointed from the old root-level pb-links.js, a leftover
 * from the pre-Next.js static site (index.html/climb.html/compare.html —
 * none of which exist anymore since the 2026-08-15 migration). Nothing in
 * the current codebase imported that file — this weekly check had been
 * silently checking dead data with zero bearing on the live site since the
 * migration. See project_cyclegear_pb_links memory for the full story.
 *
 * Shells out to curl rather than using fetch(): performancebicycle.avln.me
 * fingerprints the client (not just User-Agent) and serves a 200 JS
 * interstitial instead of a clean 302 to Node's fetch/undici, but gives curl
 * a plain redirect. curl -I gets the Location header without following it.
 *
 * Exits non-zero if anything is broken, so CI can flag it.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PB_LINKS_JSON = path.join(__dirname, '..', 'data', 'pb-links.json');
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const DEAD_PAGE_PHRASES = [
    'page not found',
    'page does not exist',
    'product not found',
    'no longer available',
    "we couldn't find",
    'we could not find',
    "doesn't exist",
    'does not exist',
    'sorry, this item',
    '404 error',
];

// Checks a link regardless of whether it's currently a tracked avln.me
// redirect or a direct performancebike.com URL (covers links still on the
// TODO list to get a real tracking link generated for them).
function checkLink(key, url) {
    return url.includes('avln.me') ? checkTrackedLink(key, url) : checkDestination(key, url, url);
}

function curlHeaders(url) {
    // -I: HEAD-equivalent (curl still issues GET-like request line but no body needed for headers)
    // --max-redirs 0: do not follow, so we can inspect the Location on a 3xx ourselves
    const out = execFileSync('curl', ['-s', '-D', '-', '-o', '/dev/null', '--max-redirs', '0', url], {
        encoding: 'utf8',
        timeout: 15000,
    });
    const statusLine = out.split('\n')[0] || '';
    const statusMatch = statusLine.match(/\s(\d{3})\s/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
    const locMatch = out.match(/^location:\s*(\S+)/im);
    return { status, location: locMatch ? locMatch[1].trim() : null };
}

function curlBody(url) {
    const out = execFileSync(
        'curl',
        ['-s', '-L', '-w', '\n__STATUS__%{http_code}', '-A', BROWSER_UA, '-H', 'Accept: text/html', url],
        { encoding: 'utf8', timeout: 20000, maxBuffer: 20 * 1024 * 1024 }
    );
    const idx = out.lastIndexOf('__STATUS__');
    const status = idx >= 0 ? parseInt(out.slice(idx + '__STATUS__'.length), 10) : null;
    const body = idx >= 0 ? out.slice(0, idx) : out;
    return { status, body };
}

function checkTrackedLink(key, trackUrl) {
    let dest;
    try {
        const { status, location } = curlHeaders(trackUrl);
        if (status !== 302 && status !== 301) {
            return { key, trackUrl, ok: false, reason: `tracking link returned ${status}, expected a redirect` };
        }
        if (!location) return { key, trackUrl, ok: false, reason: 'redirect had no Location header' };
        dest = location;
    } catch (e) {
        return { key, trackUrl, ok: false, reason: `tracking link check failed: ${e.message}` };
    }
    return checkDestination(key, trackUrl, dest);
}

function checkDestination(key, trackUrl, dest) {
    try {
        const { status, body } = curlBody(dest);
        if (status !== 200) {
            return { key, trackUrl, dest, ok: false, reason: `destination returned HTTP ${status}` };
        }
        const lower = body.toLowerCase();
        const hit = DEAD_PAGE_PHRASES.find((p) => lower.includes(p));
        if (hit) {
            return { key, trackUrl, dest, ok: false, reason: `destination page contains "${hit}"` };
        }
        return { key, trackUrl, dest, ok: true };
    } catch (e) {
        return { key, trackUrl, dest, ok: false, reason: `destination fetch failed: ${e.message}` };
    }
}

function main() {
    const data = JSON.parse(fs.readFileSync(PB_LINKS_JSON, 'utf8'));
    const links = Object.entries(data.links);
    const fallbacks = Object.entries(data.brandFallback);
    const generic = data.genericLink;
    const categoryFallback = data.categoryFallback;

    console.log(`Checking ${links.length} exact groupset links + ${fallbacks.length} brand fallback pages + generic + category fallback...\n`);

    const results = [];
    for (const [key, url] of links) results.push(checkLink(key, url));
    for (const [brand, url] of fallbacks) results.push(checkLink(`fallback:${brand}`, url));
    results.push(checkLink('generic', generic));
    results.push(checkLink('categoryFallback', categoryFallback));

    let broken = 0;
    for (const r of results) {
        if (r.ok) {
            console.log(`OK      ${r.key}`);
        } else {
            broken++;
            console.log(`BROKEN  ${r.key}`);
            console.log(`        link: ${r.trackUrl}`);
            if (r.dest) console.log(`        dest: ${r.dest}`);
            console.log(`        reason: ${r.reason}`);
        }
    }

    console.log(`\n${results.length - broken}/${results.length} OK`);
    if (broken > 0) {
        console.log(`${broken} link(s) need attention.`);
        const failuresOut = results
            .filter((r) => !r.ok)
            .map((r) => {
                const lines = [`${r.key}`, `  link: ${r.trackUrl}`];
                if (r.dest) lines.push(`  dest: ${r.dest}`);
                lines.push(`  reason: ${r.reason}`);
                return lines.join('\n');
            })
            .join('\n\n');
        fs.writeFileSync(path.join(__dirname, '..', 'link-check-failures.txt'), failuresOut + '\n');
        process.exit(1);
    }
}

main();
