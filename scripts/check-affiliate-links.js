#!/usr/bin/env node
/*
 * Checks every Performance Bicycle affiliate link in index.html still resolves
 * to a real, in-stock product page (or a valid category fallback page).
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

const INDEX_HTML = path.join(__dirname, '..', 'index.html');
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

function extractObjectLiteral(src, constName) {
    const re = new RegExp(`const ${constName} = \\{([\\s\\S]*?)\\n\\};`);
    const m = src.match(re);
    if (!m) throw new Error(`Could not find ${constName} in index.html`);
    const body = m[1];
    const entries = [];
    const entryRe = /(?:'((?:[^'\\]|\\.)*)'|(\w+))\s*:\s*'((?:[^'\\]|\\.)*)'/g;
    let em;
    while ((em = entryRe.exec(body))) entries.push([em[1] || em[2], em[3]]);
    return entries;
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
    const src = fs.readFileSync(INDEX_HTML, 'utf8');
    const links = extractObjectLiteral(src, 'PB_LINKS');
    const fallbacks = extractObjectLiteral(src, 'PB_BRAND_FALLBACK');

    console.log(`Checking ${links.length} exact groupset links + ${fallbacks.length} brand fallback pages...\n`);

    const results = [];
    for (const [key, url] of links) results.push(checkTrackedLink(key, url));
    for (const [brand, url] of fallbacks) results.push(checkTrackedLink(`fallback:${brand}`, url));

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
