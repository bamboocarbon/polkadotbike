/* ============================================================
   PERFORMANCE BICYCLE — affiliate links
   Shared by index.html, climb.html, compare.html (and any other
   page with a "Buy These Components" box). Tracked Avelon links
   (performancebicycle.avln.me/c/...) to the exact product page for
   current-production groupsets. XX1/X01 Eagle have no working
   product URL yet (their pages 404'd when generating links — SKUs
   likely delisted) so they fall back, same as discontinued/vintage
   groupsets, to the brand's category page.

   scripts/check-affiliate-links.js parses this file directly, so
   keep the object literal format (quoted or bare keys, single-
   quoted string values) intact.
   ============================================================ */
const PB_LINKS = {
    'road|shimano|Dura-Ace R9200': 'https://performancebicycle.avln.me/c/YKwviJvoqEVW',
    'road|shimano|Ultegra R8100': 'https://performancebicycle.avln.me/c/uqinWGyBqfQK',
    'road|shimano|105 R7100': 'https://performancebicycle.avln.me/c/lNjvnJXXgdfP',
    'road|shimano|Claris R2000 (2017–)': 'https://performancebicycle.avln.me/c/dEMYzkXvpKxR',
    'road|sram|Red AXS (2019–)': 'https://performancebicycle.avln.me/c/XfydHERIXuZR',
    'road|sram|Force AXS (2019–)': 'https://performancebicycle.avln.me/c/SJQLzEMxGKFO',
    'road|sram|Rival AXS (2020–)': 'https://performancebicycle.avln.me/c/JkxSQIgAvQWV',
    'road|campagnolo|Super Record Wireless 13 (2022–)': 'https://performancebicycle.avln.me/c/sryymYrYyFln',
    'mtb|shimano|XTR M9100 (2018–)': 'https://performancebicycle.avln.me/c/QrAdxfMtxkle',
    'mtb|shimano|Deore XT M8100 (2020–)': 'https://performancebicycle.avln.me/c/NwRmppstoUEg',
    'mtb|shimano|Deore M6100 (2019–)': 'https://performancebicycle.avln.me/c/iTGEbftjIIso',
    'mtb|sram|XX SL Eagle Transmission AXS (2023–)': 'https://performancebicycle.avln.me/c/yhzxjkCyNpQk',
    'mtb|sram|XX Eagle Transmission AXS (2023–)': 'https://performancebicycle.avln.me/c/DndxMAiaOcKv',
    'mtb|sram|X0 Eagle Transmission AXS (2023–)': 'https://performancebicycle.avln.me/c/gkEyUEMyFRhn',
    'mtb|sram|GX Eagle Transmission AXS (2024–)': 'https://performancebicycle.avln.me/c/kuwEidikZGqF',
    'mtb|sram|GX Eagle (2017–)': 'https://performancebicycle.avln.me/c/SgLcBkzshhtd',
    'mtb|sram|NX Eagle (2017–)': 'https://performancebicycle.avln.me/c/XRbAdWLHDKIz',
    'gravel|shimano|GRX RX820 2× (2022–)': 'https://performancebicycle.avln.me/c/QoZGYKwpQFYN',
    'gravel|shimano|GRX RX820 1× (2022–)': 'https://performancebicycle.avln.me/c/wNQjdgfJMStT',
    'gravel|sram|Force XPLR AXS (2022–)': 'https://performancebicycle.avln.me/c/WiFZuaaWMFzH',
    'gravel|sram|Rival XPLR AXS (2022–)': 'https://performancebicycle.avln.me/c/YknJubPAFNpm',
    'gravel|sram|Apex XPLR AXS (2022–)': 'https://performancebicycle.avln.me/c/bwDyPCgmTywP',
    'gravel|campagnolo|Ekar (2021–)': 'https://performancebicycle.avln.me/c/XgHAQIpdMAZh'
};
const PB_BRAND_FALLBACK = {
    shimano: 'https://performancebicycle.avln.me/c/vxevSRiDwcZX',
    sram: 'https://performancebicycle.avln.me/c/oVHpASsHTmed',
    campagnolo: 'https://performancebicycle.avln.me/c/VtLxjTjGPCGw'
};
// Used on pages with no brand/groupset context (e.g. Derailleur Capacity,
// which works from raw teeth counts, not a named product).
const PB_GENERIC_LINK = 'https://performancebicycle.avln.me/c/HsLYCikcwgAz';
function pbLinkFor(discipline, brand, groupset) {
    const key = `${discipline}|${brand}|${groupset}`;
    if (PB_LINKS[key]) return { url: PB_LINKS[key], exact: true };
    return { url: PB_BRAND_FALLBACK[brand] || 'https://www.performancebike.com/bike-bicycle-groupsets/c16817', exact: false };
}

// The active brand tab's text colour is a more vivid override (wins via
// !important in the "bold palette" theme block) than its own border colour
// — accentMap matches the border, this matches the text, so the button can
// match both exactly instead of looking washed out next to the tabs.
const PB_VIVID_TEXT = { shimano: '#2b8bff', sram: '#ff1f2b', campagnolo: '#ffcf1a', custom: '#17c86c' };

// Recolours the "Shop this groupset" button to match the selected brand —
// full-saturation border/text like the active brand tab uses, translucent
// tint only on the background. Sets CSS custom properties rather than
// background/color directly so the existing :hover rule keeps working —
// inline styles would otherwise permanently override it.
function pbSetBrandColor(linkEl, hex, textHex) {
    hex = hex || '#e24c00';
    textHex = textHex || hex;
    const h = hex.replace('#', '');
    const rgb = `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
    linkEl.style.setProperty('--pb-rgb', rgb);
    linkEl.style.setProperty('--pb-hex', hex);
    linkEl.style.setProperty('--pb-text', textHex);
}
