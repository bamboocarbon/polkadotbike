/* ============================================================
   CYCLEGEAR — SHARED GROUPSET DATABASE
   Ported verbatim from public/db.js (shared by index.html /
   climb.html / compare.html). Structure unchanged:
   DB[discipline][brand][groupsetName] = { era, chainrings, cassettes }
   _eras: ordered array of era labels (used for <optgroup> headers)
   ============================================================ */

export interface GearChainring {
  label: string;
  outer: number;
  inner: number | null;
}

export interface GearCassette {
  label: string;
  teeth: number[];
}

export interface Groupset {
  era: string;
  chainrings: GearChainring[];
  cassettes: GearCassette[];
}

export interface BrandGroupsets {
  _eras: string[];
  [groupsetName: string]: Groupset | string[];
}

export type Discipline = 'road' | 'mtb' | 'gravel';
export type Brand = 'shimano' | 'sram' | 'campagnolo' | 'custom';

export const DB: Record<Discipline, Partial<Record<Exclude<Brand, 'custom'>, BrandGroupsets>>> = {

/* ══════════════════════════════════════════════════════════════
   ROAD
══════════════════════════════════════════════════════════════ */
road: {

  shimano: {
    _eras: [
      '12-speed · 2021–present',
      '11-speed · 2012–2022',
      'Tiagra 10-speed · 2015–present',
      'Sora 9-speed · 2017–present',
      'Claris 8-speed · 2017–present',
      '10-speed · 2004–2015',
      '9-speed · 1997–2010',
      '8-speed · 1991–2004',
      '7-speed · 1984–1994',
      '6-speed · 1978–1988',
      '5-speed · pre-1984',
    ],
    // ── 12-speed ───────────────────────────────────────────
    // 2026-09-02: corrected from Shimano's own official parts-diagram PDFs
    // (dassets.shimano.com/.../EV-CS-*.pdf — one per cassette, exact
    // exploded-diagram tooth tables, same primary-source pattern as
    // Campagnolo's Spare Parts Catalogue and SRAM's product pages; Robin
    // asked for the same audit across all three brands). Dura-Ace/Ultegra/
    // 105 share IDENTICAL tooth progressions at matching range labels
    // (confirmed directly, same as Campagnolo/SRAM's shared-family
    // pattern) — only 11-30 was already correct anywhere in this section.
    'Dura-Ace R9200': {
      era:'12-speed · 2021–present',
      chainrings:[{label:'54/40',outer:54,inner:40},{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,19,21,24,28]},
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,21,24,27,30]},
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
      ]
    },
    'Ultegra R8100': {
      era:'12-speed · 2021–present',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,21,24,27,30]},
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
      ]
    },
    // 105 R7100 itself only has ONE cassette (11-34, identical to Dura-
    // Ace/Ultegra's) — the wider '11-36' option is really a separate,
    // cheaper cassette (CS-HG710-12) that Shimano markets alongside/
    // compatible with R7100/R8100/R9200 derailleurs (confirmed via its own
    // parts PDF's interchangeability table), not a second true "105"
    // cassette — kept as a second option here since that's how it's sold
    // and used, but with its real (different) tooth progression.
    '105 R7100': {
      era:'12-speed · 2021–present',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
        {label:'11-36',teeth:[11,12,13,14,15,17,19,21,24,28,32,36]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    // Dura-Ace 9000/R9100 share one cassette family (confirmed via the
    // R9100 PDF's own title grouping them together); Ultegra R8000/6800
    // and 105 R7000/5800 likewise share cassettes within their own pairs
    // (confirmed via the R7000 PDF's interchangeability table listing
    // CS-6800/CS-5800/CS-R8000 as compatible with CS-R7000). None of the
    // 4 relevant official PDFs show an 11-34 option anywhere in this
    // 11-speed generation — it looks to have been a 12-speed-only addition;
    // removed rather than left unconfirmed on R8000/R7000 below.
    'Dura-Ace R9100 (2016–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,23,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,17,19,21,24,27,30]},
      ]
    },
    'Dura-Ace 9000 (2012–16)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,23,25,28]},
      ]
    },
    'Ultegra R8000 (2017–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,23,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,17,19,21,24,27,30]},
        {label:'11-32',teeth:[11,12,13,14,16,18,20,22,25,28,32]},
      ]
    },
    'Ultegra 6800 (2013–17)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,18,19,21,23]},
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,23,25,28]},
        {label:'11-32',teeth:[11,12,13,14,16,18,20,22,25,28,32]},
      ]
    },
    '105 R7000 (2018–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,23,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,17,19,21,24,27,30]},
        {label:'11-32',teeth:[11,12,13,14,16,18,20,22,25,28,32]},
      ]
    },
    '105 5800 (2014–18)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,23,25,28]},
        {label:'11-32',teeth:[11,12,13,14,16,18,20,22,25,28,32]},
      ]
    },
    // 2026-09-02: MAJOR CORRECTION — Robin filtered Shimano's own
    // compatibility page for "claris" (productinfo.shimano.com/en/
    // compatibility/C-454?q=claris) and it stated plainly that Claris is
    // an 8-speed system. That's real and correct — Claris has always been
    // Shimano's 8-speed entry tier. All three budget groupsets below were
    // filed under the 11-speed era with 11-sprocket cassette arrays, which
    // is wrong at a structural level (wrong rear speed count entirely),
    // not just wrong tooth spacing: real Tiagra 4700 is 10-speed, Sora
    // R3000 is 9-speed, Claris R2000 is 8-speed. Each moved to its own era
    // and given a real cassette at the correct sprocket count, sourced
    // from Shimano's own parts PDFs (CS-4600 for Tiagra's generation,
    // CS-HG400-9 for Sora's, CS-HG50-8 for Claris's — each covers several
    // regional "-group" spacing variants; picked the most representative
    // modern option(s) per tier). Chainring options unchanged — those
    // aren't tied to rear speed count and weren't in question.
    'Tiagra 4700 (2015–)': {
      era:'Tiagra 10-speed · 2015–present',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,17,19,21,23,25]},
        {label:'12-28',teeth:[12,13,14,15,17,19,21,23,25,28]},
        {label:'12-30',teeth:[12,13,14,15,17,19,21,24,27,30]},
      ]
    },
    'Sora R3000 (2017–)': {
      era:'Sora 9-speed · 2017–present',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/34',outer:46,inner:34}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,28,32]},
        {label:'11-34',teeth:[11,13,15,17,20,23,26,30,34]},
      ]
    },
    'Claris R2000 (2017–)': {
      era:'Claris 8-speed · 2017–present',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/34',outer:46,inner:34}],
      cassettes:[
        {label:'11-32',teeth:[11,13,15,18,21,24,28,32]},
        {label:'11-34',teeth:[11,13,15,18,21,24,28,34]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    // 2026-09-02: corrected from Shimano's own EV (exploded-parts) PDFs
    // via si.shimano.com/en/manual/search?input_model=<code> (the model-
    // search page — direct URL query works, no need to click filters).
    // EV-CS-7900-2869A + SI-1KY0A-003 (FC-7900/FC-7950). Real cassette
    // range is much wider than the file had (8 options, not 4) and tops
    // out at 12-27, not 12-25. Real chainrings: 53/42 and 53/39 (A/B-type
    // FC-7900) + 52/39 + 50/34 (FC-7950 compact) — the file's 52/36 and
    // 55/42 were fabricated (55/42 is a real FC-7900 option but only in
    // the TT/triathlon E-type build, out of scope like other TT variants
    // in this file).
    'Dura-Ace 7900 (2008–12)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,18,19,21]},
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'11-25',teeth:[11,12,13,14,15,17,19,21,23,25]},
        {label:'11-27',teeth:[11,12,13,14,15,17,19,21,24,27]},
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,24,28]},
        {label:'12-23',teeth:[12,13,14,15,16,17,18,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from EV-CS-7800-2253 + EV-FC-7800-2251E, same
    // source pass as 7900 above. Real cassette range tops out at 12-27
    // with 6 options total (file only had 4, missing 12-21 and had a
    // fabricated 11-25 that isn't real for this generation). Real
    // chainrings: 53/42 (A-type) + 50/39, 52/39, 53/39 (B-type) — 50/34
    // was fabricated (7800 predates the FC-6750-style road compact).
    'Dura-Ace 7800 (2004–08)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/39',outer:50,inner:39}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,18,19,21]},
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'12-21',teeth:[12,13,14,15,16,17,18,19,20,21]},
        {label:'12-23',teeth:[12,13,14,15,16,17,18,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from Shimano's own SI (Service Instructions)
    // PDFs — SI-1YX0A-001 (CS-6700 cassette) and SI-1M30A-003 (FC-6700/
    // FC-6703/FC-6750 chainwheel), read via screenshotting Robin's own
    // Safari (si.shimano.com Akamai-blocks curl/WebFetch, see
    // [[shimano-si-pdf-access]]). Real chainring options are 53/39 and
    // 52/39 (FC-6700 double) plus 50/34 (FC-6750 compact) — the file's
    // 52/36 was never a real 6700-series option. Real cassette range tops
    // out at 11-28 — the 12-30 option was fabricated.
    'Ultegra 6700 (2009–13)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'12-23',teeth:[12,13,14,15,16,17,18,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'11-25',teeth:[11,12,13,14,15,17,19,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,24,28]},
      ]
    },
    // 2026-09-02: corrected from EV-CS-6600-2370 + EV-FC-6600-2365E. Real
    // cassette range is wider (8 options) but 13-25/14-25/15-25/16-27 are
    // TT-oriented (16T smallest cog is impractical for a standard double)
    // so excluded, matching the FC-7900/7800 TT-variant exclusion
    // convention — kept the 4 standard-range options, adding the real
    // 11-23 that was missing and correcting 12-25's spacing. Chainrings:
    // FC-6600's parts list only lists 39T/52T/53T rings on a 130mm BCD —
    // no compact option exists on this model; the file's 50/34 was
    // actually FC-6650 (Ultegra's separate first compact crank, 110mm
    // BCD), wrongly merged into this entry.
    'Ultegra 6600 (2005–09)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'12-23',teeth:[12,13,14,15,16,17,18,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from Shimano's own SI PDFs — SI-1YN0A-001
    // (CS-5700 cassette) and SI-1M30A-003 (FC-5700/FC-5703/FC-5750
    // chainwheel), same source pass as Ultegra 6700 above. Real chainring
    // options are 53/39 and 52/39 (FC-5700 double) plus 50/34 (FC-5750
    // compact). Real cassette options are 11-25/11-28/12-25/12-27 — the
    // file's 12-28 and 12-30 were fabricated.
    '105 5700 (2010–14)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,17,19,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,17,19,21,24,28]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from EV-CS-5600-2455C + EV-FC-5600-2439C, same
    // source pass as Ultegra 6600 above. Cassette gains the real 11-23 and
    // 11-25 options (file only had 12-25/12-27, and 12-25's spacing was
    // wrong). Chainrings: FC-5600's parts list is 39T inner with 50/52/53T
    // outer options on a 130mm BCD, no compact — the file's 50/34 was
    // wrong for the same reason as Ultegra 6600 (that's FC-5650, a
    // separate compact model).
    '105 5600 (2005–10)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/39',outer:50,inner:39}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'11-25',teeth:[11,12,13,14,15,17,19,21,23,25]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    // Corrected 2026-09-02 from CS-4600's own parts PDF, found the same
    // pass as the Tiagra 4700 fix above — also gained the real 11-25
    // option, missing here entirely before.
    // Chainrings independently verified same day from EV-FC-4600-3144
    // (standard crank: 39T inner/52T-B outer only, BCD 130mm) and
    // EV-FC-4650-3146 (compact crank: 34T/50T-F, BCD 110mm) — real options
    // are 52/39 and 50/34; the file's 46/36 was fabricated, doesn't match
    // either real crank in this generation.
    'Tiagra 4600 (2010–15)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,17,19,21,23,25]},
        {label:'12-28',teeth:[12,13,14,15,17,19,21,23,25,28]},
        {label:'12-30',teeth:[12,13,14,15,17,19,21,24,27,30]},
      ]
    },
    // ── 9-speed ────────────────────────────────────────────
    // 2026-09-02: corrected from EV-CS-7700-1660 + EV-FC-7700-1655B. Real
    // cassette range is 11-21/11-23/12-21/12-23/12-25/12-27 (file had a
    // fabricated 13-26 that isn't real for this generation, and was
    // missing 11-23/12-21/12-23/12-27 entirely). Chainrings: A-type is
    // 53/42 (confirmed), B-type is 53/39 or 52/39 (also confirmed) — the
    // parts list also shows a 41T B-type inner ring but doesn't state
    // which outer ring(s) it pairs with, so that combo is left out rather
    // than guessed. Triathlon-specific inner/outer rings (42T/44T/45T
    // triathlon, 54-42T/55-42T/56-44T) excluded per this file's TT-variant
    // convention.
    'Dura-Ace 7700 (1997–04)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,19,21]},
        {label:'11-23',teeth:[11,12,13,14,15,17,19,21,23]},
        {label:'12-21',teeth:[12,13,14,15,16,17,18,19,21]},
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from EV-CS-6500-1680A + EV-FC-6500-1677A.
    // Cassette range is wider than the file had (6 options, not 3) —
    // 13-23/13-25/14-25 rows also exist in the source but are TT-oriented
    // (excluded per convention, same as Dura-Ace 7700 above). Chainrings:
    // A-type 53/42, B-type 52/39 — the file's 53/39 and 50/34 were both
    // fabricated (no compact existed yet in this generation; that's
    // FC-6650, introduced c.2008).
    'Ultegra 6500 (1999–05)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/39',outer:52,inner:39}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,19,21]},
        {label:'11-23',teeth:[11,12,13,14,15,17,19,21,23]},
        {label:'12-21',teeth:[12,13,14,15,16,17,18,19,21]},
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from EV-FC-5500-1732 + EV-CS-HG70-9-1746A. 105
    // 9-speed shared the generic HG70-9 cassette (not a 5500-branded part
    // number — CS-5500 doesn't exist in Shimano's archive) — confirmed
    // this is the right one from the doc's own "SHIMANO 105 Cassette
    // Sprocket" header. Real options are 12-23/12-25/13-23/13-25 — no
    // 12-27 exists for this cassette (fabricated in the file) and 13-25's
    // spacing was wrong. Chainrings: A-type 53/42, B-type 50/39, 52/39,
    // 53/39 — the file's 50/34 was fabricated (no compact existed yet).
    '105 5500 (2000–06)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/39',outer:50,inner:39}],
      cassettes:[
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,17,19,21,23,25]},
        {label:'13-23',teeth:[13,14,15,16,17,18,19,21,23]},
        {label:'13-25',teeth:[13,14,15,16,17,19,21,23,25]},
      ]
    },
    // 2026-09-02: corrected from EV-FC-4500-2593B + EV-FC-4550-2595B
    // (standard FC-4500 is 52/39 only, 130mm BCD; FC-4550 compact is
    // 50/34, 110mm BCD — the file's 46/38 didn't match either real crank)
    // and EV-CS-HG50-9-1880E for the cassette (the generic 9-speed
    // spare-parts cassette this tier used — no CS-4500-branded part
    // exists). Real range tops out at 11-30/12-27; the file's 11-32 isn't
    // a real HG50-9 option (13-25/14-25 close-ratio options also exist in
    // the source but excluded as non-representative for a touring-tier
    // groupset, matching this file's TT/close-ratio exclusion convention
    // elsewhere).
    'Tiagra 4500 (2004–10)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,15,17,19,21,23,25]},
        {label:'11-30',teeth:[11,12,14,16,18,20,23,26,30]},
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,17,19,21,24,27]},
      ]
    },
    // 2026-09-02: corrected from EV-FC-3300-1868. Real chainrings are
    // 52/39 and 50/39 (130mm BCD, no compact) — the file's 50/34 and
    // 46/38 were both fabricated. Note: "FC-3400" doesn't exist in
    // Shimano's SI archive (only FC-3300) — this may be a non-real model
    // number, similar to the "105 Golden Arrow" naming issue in the
    // 7-speed section below; only FC-3300 is confirmed. Cassette: no
    // CS-3300 exists either — reused the confirmed CS-HG50-9 data from
    // Tiagra 4500 above (same generic 9-speed spare-parts cassette,
    // commonly shared across Shimano's budget/mid tiers in this era) —
    // this is an inference about shared parts, not an independently
    // sourced Sora-specific document.
    'Sora 3300/3400 (2002–17)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/39',outer:50,inner:39}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,15,17,19,21,23,25]},
        {label:'11-30',teeth:[11,12,14,16,18,20,23,26,30]},
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,17,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,17,19,21,24,27]},
      ]
    },
    // ── 8-speed ────────────────────────────────────────────
    // 2026-09-02: corrected from EV-FC-7410-1256A + the CS-7401/HG90/HG70
    // shared 8-speed cassette family (each range is a separate EV doc —
    // 8S=12-21, 8U=12-23, 8T=13-23, 8V=13-26 checked; a 5th variant, 8W,
    // wasn't checked). Cassette range labels the file already had were
    // right, but internal tooth spacing was wrong in 2 of 3, and the real
    // 12-23 option was missing entirely. Chainrings gain the real A-type
    // 53/42 option alongside the file's existing 52/42 and 53/39.
    'Dura-Ace 7410 (1991–97)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42},{label:'53/39',outer:53,inner:39}],
      cassettes:[
        {label:'12-21',teeth:[12,13,14,15,16,17,19,21]},
        {label:'12-23',teeth:[12,13,14,15,17,19,21,23]},
        {label:'13-23',teeth:[13,14,15,16,17,19,21,23]},
        {label:'13-26',teeth:[13,14,15,17,19,21,23,26]},
      ]
    },
    // 2026-09-02: corrected from EV-FC-6400-SG-1150A, which is explicitly
    // titled "SHIMANO 600 Ultegra Front Chainwheel" — confirms this crank
    // covers both the 8-speed entry here and the separate '600 Ultegra
    // (1987–93)' 7-speed entry below. Real chainrings are 52/42 and 53/42
    // — no compact existed at this vintage, and inner ring is 42T not
    // 39T, so the file's 53/39 and 50/34 were both fabricated. No
    // CS-6400/CS-6401 8-speed cassette doc exists (CS-6400 itself turned
    // out to be the 7/6-speed variant) — reused the confirmed shared
    // CS-7401/HG90/HG70 8-speed cassette data from Dura-Ace 7410 above
    // (same inference-about-shared-parts pattern as Sora/Tiagra 9-speed).
    'Ultegra 6400/6401 (1991–99)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'12-21',teeth:[12,13,14,15,16,17,19,21]},
        {label:'12-23',teeth:[12,13,14,15,17,19,21,23]},
        {label:'13-23',teeth:[13,14,15,16,17,19,21,23]},
        {label:'13-26',teeth:[13,14,15,17,19,21,23,26]},
      ]
    },
    // 2026-09-02: STILL UNVERIFIED — no SI/EV documentation exists for
    // FC-5200/FC-5300/CS-5200/CS-5300 on si.shimano.com (this generation,
    // 1993-2000, predates the site's archive; same gap as the 7-speed
    // section below). The existing 50/34 compact is almost certainly
    // fabricated (no compact chainring existed at this vintage — every
    // other pre-2007 crank checked this session is a standard-BCD double
    // only), but left as-is rather than guessed at without a source.
    '105 5200/5300 (1993–2000)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'13-23',teeth:[13,14,15,16,17,18,20,23]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,26]},
        {label:'12-25',teeth:[12,13,14,15,16,17,20,25]},
      ]
    },
    // 2026-09-02: chainring corrected from EV-FC-4400-1866 — real options
    // are 52/39 and 50/39 (130mm BCD standard double), the file's 50/34
    // compact was fabricated (same pattern as every other pre-2007 crank
    // this session). Cassette (CS-4400) STILL UNVERIFIED — no SI/EV doc
    // exists for it on si.shimano.com, left as-is rather than guessed.
    'Tiagra 4400 (1999–2004)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/39',outer:50,inner:39}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,20,25]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,26]},
      ]
    },
    // ── 7-speed ────────────────────────────────────────────
    // 2026-09-02: EV-FC-7400-0681D exists but is a low-resolution 1980s
    // scan, illegible even at max zoom — couldn't confirm or contradict
    // the existing chainring/cassette values, left as-is (they already
    // show 53/42 + 52/42, consistent with the confirmed 600 Ultegra
    // chainring pattern below, for what that's worth). Cassette STILL
    // UNVERIFIED.
    'Dura-Ace 7400 (1984–91)': {
      era:'7-speed · 1984–1994',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,16,17,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,20,23]},
        {label:'14-28',teeth:[14,15,17,19,21,24,28]},
      ]
    },
    // 2026-09-02: chainring corrected from EV-FC-6400-SG-1150A ("SHIMANO
    // 600 Ultegra Front Chainwheel", the same crank confirmed for the
    // 8-speed Ultegra 6400/6401 entry above — one crank spans multiple
    // cassette speed counts) — gains the real 53/42 option alongside the
    // existing 52/42. Cassette (CS-6400-7) STILL UNVERIFIED: the doc
    // exists (EV-CS-6400-0837B) but gives a fixed parts diagram, not a
    // labeled tooth-range table like the newer-format docs, and reading
    // exact digits off the diagram risked a wrong guess — left as-is.
    '600 Ultegra (1987–93)': {
      era:'7-speed · 1984–1994',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,16,17,19,21]},
        {label:'14-24',teeth:[14,15,16,17,19,21,24]},
      ]
    },
    // 2026-09-02: real model number confirmed as FC-1055 (EV-FC-1055-1109
    // is explicitly titled "Front Chainwheel SHIMANO 105") — "Golden
    // Arrow" doesn't appear anywhere in Shimano's own documentation for
    // this part, likely a dealer/marketing nickname rather than the
    // official designation; kept as the display label since it's what
    // Robin's data was filed under, but the model number is now sourced.
    // Chainrings corrected: real options are 52/42 and 53/42 — the file's
    // 50/40 was fabricated (doesn't match anything in the parts list).
    // Cassette STILL UNVERIFIED — no matching CS-1055 or similar doc found
    // in the time available this pass.
    '105 Golden Arrow (7-speed)': {
      era:'7-speed · 1984–1994',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-23',teeth:[13,14,15,17,19,21,23]},
        {label:'14-28',teeth:[14,15,17,19,21,24,28]},
      ]
    },
    // ── 6-speed ────────────────────────────────────────────
    'Dura-Ace EX 7200 (1982–88)': {
      era:'6-speed · 1978–1988',
      chainrings:[{label:'53/42',outer:53,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,17,19,21]},
        {label:'14-24',teeth:[14,15,17,18,21,24]},
      ]
    },
    '600 EX (1978–88)': {
      era:'6-speed · 1978–1988',
      chainrings:[{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'14-24',teeth:[14,15,17,18,21,24]},
        {label:'14-28',teeth:[14,15,17,20,23,28]},
      ]
    },
    // ── 5-speed ────────────────────────────────────────────
    'Shimano 5-speed (pre-1984)': {
      era:'5-speed · pre-1984',
      chainrings:[{label:'52/42',outer:52,inner:42},{label:'50/40',outer:50,inner:40}],
      cassettes:[
        {label:'14-28',teeth:[14,17,19,23,28]},
        {label:'14-24',teeth:[14,16,19,22,24]},
      ]
    },
  }, // end shimano road

  sram: {
    _eras: [
      '12-speed AXS · 2019–present',
      '11-speed · 2013–2019',
      '10-speed · 2006–2013',
    ],
    // ── 12-speed ───────────────────────────────────────────
    // 2026-09-02: corrected from real sram.com product-page spec tables
    // (XG-1290/1270/1250 cassettes — Robin asked for the same audit that
    // caught fabricated Campagnolo data; SRAM's real-model-number entries
    // turned out mostly right on labels but wrong on internal tooth
    // spacing for 3 of Red's 4 cassette options, and Red's chainrings were
    // still the pre-2023-refresh set (54/41/52/39 no longer exist — real
    // current range tops out at 50/37). Red/Force/Rival's cassettes at
    // matching range labels share IDENTICAL tooth progressions (same
    // XG-129x/127x/125x cassette family, confirmed directly per tier).
    'Red AXS (2023–)': {
      era:'12-speed AXS · 2019–present',
      chainrings:[{label:'50/37',outer:50,inner:37},{label:'48/35',outer:48,inner:35},{label:'46/33',outer:46,inner:33}],
      cassettes:[
        {label:'10-28',teeth:[10,11,12,13,14,15,16,17,19,21,24,28]},
        {label:'10-30',teeth:[10,11,12,13,14,15,17,19,21,24,27,30]},
        {label:'10-33',teeth:[10,11,12,13,14,15,17,19,21,24,28,33]},
        {label:'10-36',teeth:[10,11,12,13,15,17,19,21,24,28,32,36]},
      ]
    },
    'Force AXS (2023–)': {
      era:'12-speed AXS · 2019–present',
      chainrings:[{label:'50/37',outer:50,inner:37},{label:'48/35',outer:48,inner:35},{label:'46/33',outer:46,inner:33}],
      cassettes:[
        {label:'10-28',teeth:[10,11,12,13,14,15,16,17,19,21,24,28]},
        {label:'10-30',teeth:[10,11,12,13,14,15,17,19,21,24,27,30]},
        {label:'10-33',teeth:[10,11,12,13,14,15,17,19,21,24,28,33]},
        {label:'10-36',teeth:[10,11,12,13,15,17,19,21,24,28,32,36]},
      ]
    },
    'Rival AXS (2022–)': {
      era:'12-speed AXS · 2019–present',
      chainrings:[{label:'48/35',outer:48,inner:35},{label:'46/33',outer:46,inner:33}],
      cassettes:[
        {label:'10-30',teeth:[10,11,12,13,14,15,17,19,21,24,27,30]},
        {label:'10-36',teeth:[10,11,12,13,15,17,19,21,24,28,32,36]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    // 2026-09-02: verified against real sram.com service pages (Robin
    // asked to finish the SRAM audit, same pass as the road/gravel/MTB
    // current-tier fixes earlier). Cross-checked Red 22's real cassette
    // (XG-1190), Force 22's (PG-1170), Rival 22's and Apex 1's (both
    // PG-1130) — Rival 22 and Apex 1 were already exactly right. Red 22's
    // 11-25 and Force 22's 11-26 both had one wrong internal digit each
    // (18→19 / 18,22,25→19,21,23) — fixed, everything else in this tier
    // (all chainrings, Red/Force's 11-28 and 11-32) already matched the
    // real spec exactly.
    'Red 22 (2013–19)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,22,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    'Force 22 (2013–19)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-26',teeth:[11,12,13,14,15,16,17,19,21,23,26]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,22,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    // Cross-checked against the real PG-1130 cassette (sram.com service
    // page) — already exactly right, no change needed.
    'Rival 22 (2013–19)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,22,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    // Cross-checked against the real PG-1130 11-42t option — already
    // exactly right, no change needed.
    'Apex 1 (2016–19 · 1×11)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'42T 1×',outer:42,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,22,25,28,32,36,42]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    // 2026-09-02: important lesson learned this pass — WebFetch on
    // sram.com's legacy /service/models/ product pages (e.g. PG-1070,
    // PG-1050, PG-1030) returned confident-looking "spec tables" that
    // turned out to be HALLUCINATED: visually opening the same pages in
    // Safari showed only a product image + a link to a generic manual, no
    // spec content on the page at all. Caught before committing by
    // cross-checking the visual render — do not trust WebFetch numeric
    // output on these specific legacy pages without a visual check.
    // What IS real and primary-sourced: SRAM's own "2018 Road Components
    // Compatibility Map" PDF (sram.com/globalassets/document-hierarchy/
    // compatibility-map/road/compatibility-map-road-2018.pdf) has a real
    // checkbox matrix confirming which cassette RANGE LABELS pair with
    // which model — Red's real cassette is XG-1090 (11-23/25/26/28
    // available), Force's is PG-1070 (11-23/28, 12-26 — NOT 12-28), Rival's
    // is PG-1050 (11-23/32, 12-27 — NOT 11-28/12-32). Force and Rival's
    // range labels below are corrected to match. Internal tooth-by-tooth
    // digit sequences are NOT independently confirmed from an official
    // SRAM spec table this pass (same category of gap as Campagnolo's
    // pre-cassette freewheel era) — left as reasonable HG-compatible
    // estimates, flagged rather than presented as verified.
    'Red (2009–13)': {
      era:'10-speed · 2006–2013',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,18,21,23]},
        {label:'11-26',teeth:[11,12,13,14,15,16,17,19,23,26]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
      ]
    },
    'Force (2009–13)': {
      era:'10-speed · 2006–2013',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,18,21,23]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
        {label:'12-26',teeth:[12,13,14,15,16,17,18,21,23,26]},
      ]
    },
    'Rival (2006–13)': {
      era:'10-speed · 2006–2013',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,26,32]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    // Apex doesn't appear at all in the 2018 compatibility map's 10-speed
    // cassette table (XG-1090/XG-1090CX/PG-1070/PG-1050 only) — its real
    // cassette model for this era is genuinely unidentified in the sources
    // checked this pass, not just the internal spacing. Left as-is.
    'Apex (2009–13)': {
      era:'10-speed · 2006–2013',
      chainrings:[{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-32',teeth:[12,13,14,15,17,19,21,24,28,32]},
        {label:'11-34',teeth:[11,12,13,15,17,20,23,26,30,34]},
      ]
    },
  }, // end sram road

  campagnolo: {
    _eras: [
      '13-speed · 2023–present',
      '12-speed · 2018–present',
      '11-speed · 2009–2020',
      '10-speed · 2000–2012',
      '9-speed · 1998–2006',
      '8-speed · 1994–2000',
      '7-speed · 1987–1996',
      '6-speed · pre-1990',
    ],
    // ── 13-speed ───────────────────────────────────────────
    // 2026-09-02: rebuilt from real campagnolo.com product pages (the old
    // 'Super Record Wireless 13 (2022–)' entry below had fabricated 9-tooth
    // options and wrong internal spacing — flagged when Robin compared it
    // against Campagnolo's own site). Super Record 13 launched 2023.
    'Super Record 13 (2023–)': {
      era:'13-speed · 2023–present',
      chainrings:[{label:'45/29',outer:45,inner:29},{label:'48/32',outer:48,inner:32},{label:'50/34',outer:50,inner:34},{label:'52/36',outer:52,inner:36},{label:'53/39',outer:53,inner:39},{label:'54/39',outer:54,inner:39},{label:'55/39',outer:55,inner:39}],
      cassettes:[
        {label:'10-29',teeth:[10,11,12,13,14,15,16,17,18,20,23,26,29]},
        {label:'10-33',teeth:[10,11,12,13,14,15,16,18,20,23,26,29,33]},
        {label:'11-32',teeth:[11,12,13,14,15,16,17,18,20,23,26,29,32]},
        {label:'11-36',teeth:[11,12,13,14,15,16,18,20,23,26,29,32,36]},
      ]
    },
    // Record 13 launched April 2026 — same 7 chainring options as Super
    // Record 13 (confirmed), narrower cassette range (2 options vs 4).
    'Record 13 (2026–)': {
      era:'13-speed · 2023–present',
      chainrings:[{label:'45/29',outer:45,inner:29},{label:'48/32',outer:48,inner:32},{label:'50/34',outer:50,inner:34},{label:'52/36',outer:52,inner:36},{label:'53/39',outer:53,inner:39},{label:'54/39',outer:54,inner:39},{label:'55/39',outer:55,inner:39}],
      cassettes:[
        {label:'10-33',teeth:[10,11,12,13,14,15,16,18,20,23,26,29,33]},
        {label:'11-36',teeth:[11,12,13,14,15,16,18,20,23,26,29,32,36]},
      ]
    },
    // ── 12-speed (still current — Campagnolo sells this generation
    // alongside 13-speed, it is not discontinued) ──────────────────
    // Super Record went 12-speed in 2018, four years before Chorus.
    // Chainrings confirmed via Campagnolo/press (50/34, 52/36, 53/39).
    // Cassette internals confirmed from Chorus 12's product page — Record/
    // Super Record/Chorus 12-speed mechanical share the same sprocket
    // progression across tiers (differ in material/weight, not spacing).
    'Super Record 12 (2018–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-29',teeth:[11,12,13,14,15,16,17,19,21,23,26,29]},
        {label:'11-32',teeth:[11,12,13,14,15,16,17,19,22,25,28,32]},
        {label:'11-34',teeth:[11,12,13,14,15,16,17,19,22,25,29,34]},
      ]
    },
    // Record retired as a 12-speed mechanical tier when Record 13 launched
    // (2026) — kept here as a discontinued/historical entry, cassette
    // spacing corrected to match the real shared 12-speed progression.
    'Record 12 (2020–26)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-29',teeth:[11,12,13,14,15,16,17,19,21,23,26,29]},
        {label:'11-32',teeth:[11,12,13,14,15,16,17,19,22,25,28,32]},
      ]
    },
    // Chorus 12 is still current — confirmed live on campagnolo.com,
    // 48/32 crank added since launch, 11-34 cassette confirmed as a real
    // (previously missing here) option alongside 11-29/11-32.
    'Chorus 12 (2020–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34},{label:'48/32',outer:48,inner:32}],
      cassettes:[
        {label:'11-29',teeth:[11,12,13,14,15,16,17,19,21,23,26,29]},
        {label:'11-32',teeth:[11,12,13,14,15,16,17,19,22,25,28,32]},
        {label:'11-34',teeth:[11,12,13,14,15,16,17,19,22,25,29,34]},
      ]
    },
    // Confirmed 2026-09-02 from Campagnolo's own 2025 Spare Parts Catalogue
    // - B (real exploded-diagram spec sheets, downloaded from the "Super
    // Record 12 Speed Wireless sprockets" product page's Downloads section)
    // — the exact per-sprocket sequence the live product page's text didn't
    // expose. This is the EPS/wireless electronic 12-speed tier, a distinct
    // cassette family from the mechanical Super Record 12 above.
    'Super Record Wireless 12 (2022–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'10-25',teeth:[10,11,12,13,14,15,16,17,19,21,23,25]},
        {label:'10-27',teeth:[10,11,12,13,14,15,16,17,19,21,24,27]},
        {label:'10-29',teeth:[10,11,12,13,14,15,16,18,20,23,26,29]},
        {label:'11-32',teeth:[11,12,13,14,15,16,17,19,22,25,28,32]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    // 2026-09-02: corrected from the same Spare Parts Catalogue - B (pages
    // 63-66, "Chorus 11S" and "Campagnolo 11S" — Campagnolo still stocks
    // spare sprockets for this discontinued generation, so the catalogue
    // has exact spec sheets). Real Super Record/Record 11 range is 11-25/
    // 11-27/11-29/11-32 — the old '12-29' option here didn't appear
    // anywhere in the catalogue and looks to have been invented; replaced
    // with the confirmed 11-32. Chorus 11 real range is FOUR options
    // (11-23/11-25/11-27/11-29), not two — 11-23 and 11-25 were missing.
    'Super Record 11 (2009–20)': {
      era:'11-speed · 2009–2020',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-27',teeth:[11,12,13,14,15,17,19,21,23,25,27]},
        {label:'11-29',teeth:[11,12,13,14,15,17,19,21,23,26,29]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    'Record 11 (2009–20)': {
      era:'11-speed · 2009–2020',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-27',teeth:[11,12,13,14,15,17,19,21,23,25,27]},
        {label:'11-29',teeth:[11,12,13,14,15,17,19,21,23,26,29]},
      ]
    },
    // 2026-09-02: the 3 additional ranges (12-25/12-27/12-29) confirmed
    // from catalogue page 64 — this WAS genuinely Chorus 11S (same CS-112/
    // CS-111 sprocket-carrier code as 11-23/25/27/29 on page 63), not a
    // mismatched table. Chorus 11 has 7 cassette options total.
    'Chorus 11 (2009–20)': {
      era:'11-speed · 2009–2020',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,18,19,21,23]},
        {label:'11-25',teeth:[11,12,13,14,15,16,17,19,21,23,25]},
        {label:'11-27',teeth:[11,12,13,14,15,17,19,21,23,25,27]},
        {label:'11-29',teeth:[11,12,13,14,15,17,19,21,23,26,29]},
        {label:'12-25',teeth:[12,13,14,15,16,17,18,19,21,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,23,25,27]},
        {label:'12-29',teeth:[12,13,14,15,16,17,19,21,23,26,29]},
      ]
    },
    // Cassette spacing confirmed real (identical to the shared Super
    // Record/Record 11 "Campagnolo 11S" cassette on catalogue p.65).
    // Chainrings: high confidence on 53/39 and 50/34 (2009/2010 launch);
    // 52/36 and 52/39 confirmed via retailer part listings + a contemporary
    // Bikerumor first-look rather than a single catalogue table — medium
    // confidence, not a primary-source read like the cassette numbers.
    'Athena 11 (2012–18)': {
      era:'11-speed · 2009–2020',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-29',teeth:[11,12,13,14,15,17,19,21,23,26,29]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    // 2026-09-02: 'Super Record' as a nameplate did not exist in this era —
    // confirmed absent from Campagnolo's own official Spare Parts & Tools
    // Catalogues for 2001, 2002, and 2006 (checked cranksets AND sprockets
    // in all three, cover to cover — no "Super Record" tier alongside
    // Record/Chorus/Centaur/Veloce/Mirage). The name was retired after the
    // 6-speed era and only reintroduced in 2008 as the (real) 11-speed
    // flagship already listed above. The 'Super Record 10 (2004–09)' entry
    // that used to be here was fabricated; removed rather than kept as a
    // misleading product name on a public site.
    'Record 10 (2000–09)': {
      era:'10-speed · 2000–2012',
      // Fully modular Z39/Z41/Z42 inner x Z52/Z53 outer system at this
      // tier — no 50/34 compact yet. Confirmed from the 2001 catalogue.
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,18,19,21]},
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'13-26',teeth:[13,14,15,16,17,18,19,21,23,26]},
        {label:'13-29',teeth:[13,14,15,16,17,19,21,23,26,29]},
      ]
    },
    'Chorus 10 (2000–09)': {
      era:'10-speed · 2000–2012',
      // Same modular system as Record 10 at this tier — no 50/34 yet.
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'13-26',teeth:[13,14,15,16,17,18,19,21,23,26]},
        {label:'13-29',teeth:[13,14,15,16,17,19,21,23,26,29]},
      ]
    },
    // Cassette spacing confirmed identical to Record/Chorus 10 (shared
    // architecture). Chainrings: 50/34 not found in the 2006 catalogue —
    // may have been added later in this generation's run; flagged as
    // possibly incomplete rather than assumed.
    'Centaur 10 (2006–12)': {
      era:'10-speed · 2000–2012',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,23,25]},
        {label:'13-26',teeth:[13,14,15,16,17,18,19,21,23,26]},
        {label:'13-29',teeth:[13,14,15,16,17,19,21,23,26,29]},
      ]
    },
    // ── 9-speed ────────────────────────────────────────────
    'Record 9 (1998–2004)': {
      era:'9-speed · 1998–2006',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,17,19,21,23]},
        {label:'12-21',teeth:[12,13,14,15,16,17,18,19,21]},
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'13-23',teeth:[13,14,15,16,17,18,19,21,23]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,23,26]},
      ]
    },
    // No 38t/50t ring existed at this tier — the old '50/38' option here
    // was wrong.
    'Chorus 9 (1999–2004)': {
      era:'9-speed · 1998–2006',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'12-21',teeth:[12,13,14,15,16,17,18,19,21]},
        {label:'12-23',teeth:[12,13,14,15,16,17,19,21,23]},
        {label:'13-23',teeth:[13,14,15,16,17,18,19,21,23]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,23,26]},
      ]
    },
    // STILL UNVERIFIED — Centaur doesn't appear at all in the 2001
    // catalogue, and by 2002 Campagnolo had already dropped 9-speed
    // sprocket listings entirely.
    // 2026-09-02 follow-up: tried again — the real "Daytona→Centaur" road
    // rename happened in this exact 2000-2002 window, but the 1990-era
    // "Centaur" hits found via web/archive search are a wholly different,
    // unrelated off-road group from a decade earlier (same name reused,
    // see [[cyclegear-campagnolo-data]] for the disraeligears.co.uk 1990
    // catalogue detail — Record/Chorus/Croce d'Aune from that catalogue
    // don't touch this entry). campybike.com hosts a 2000-2004 spare-parts
    // archive but it's a 500MB+ multi-year zip, not worth the download for
    // one groupset's data — abandoned rather than spend an unreasonable
    // amount of bandwidth chasing it.
    // Cross-checked against this file's own confirmed 'Record 9'/'Chorus 9'
    // entries (same era, real Ultra Drive cassette data): their teeth
    // sequences do NOT match this entry's 13-26/13-29 rows at all (e.g.
    // Record 9's confirmed 13-26 is 13-14-15-16-17-19-21-23-26, not this
    // entry's 13-14-15-16-17-18-20-23-26) — so this can't be cross-
    // validated as a shared part, it's still a bare guess. The 50/34
    // chainring is also suspect on its face: Record 9/Chorus 9 (same era)
    // only ever had 53/39, 52/39, 52/42 — no compact existed at this tier
    // yet, real Campagnolo compacts came years later. Left as-is rather
    // than guess a replacement.
    'Centaur 9 (2000–06)': {
      era:'9-speed · 1998–2006',
      chainrings:[{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'13-26',teeth:[13,14,15,16,17,18,20,23,26]},
        {label:'13-29',teeth:[13,14,15,16,18,20,22,25,29]},
      ]
    },
    // ── 8-speed ────────────────────────────────────────────
    // 2026-09-02: Record and Chorus 8 share ONE cassette system at this
    // era — Campagnolo's "Exa-Drive" sprockets, one official exploded-
    // diagram table covering Record/Chorus/Athena together, confirmed
    // directly (7 range options, not the 2-3 previously listed here with
    // unconfirmed spacing). Chainrings also fully modular across both
    // tiers: Z39/Z41/Z42 inner x Z52/Z53 outer.
    'Record 8 (1994–2000)': {
      era:'8-speed · 1994–2000',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'53/41',outer:53,inner:41},{label:'53/42',outer:53,inner:42},{label:'52/39',outer:52,inner:39},{label:'52/41',outer:52,inner:41},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'12-19',teeth:[12,13,14,15,16,17,18,19]},
        {label:'12-21',teeth:[12,13,14,15,16,17,19,21]},
        {label:'12-23',teeth:[12,13,14,15,17,19,21,23]},
        {label:'13-21',teeth:[13,14,15,16,17,18,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,19,21,23]},
        {label:'13-26',teeth:[13,14,15,17,19,21,23,26]},
        {label:'14-26',teeth:[14,15,16,17,19,21,23,26]},
      ]
    },
    'Chorus 8 (1994–2000)': {
      era:'8-speed · 1994–2000',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'53/41',outer:53,inner:41},{label:'53/42',outer:53,inner:42},{label:'52/39',outer:52,inner:39},{label:'52/41',outer:52,inner:41},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'12-19',teeth:[12,13,14,15,16,17,18,19]},
        {label:'12-21',teeth:[12,13,14,15,16,17,19,21]},
        {label:'12-23',teeth:[12,13,14,15,17,19,21,23]},
        {label:'13-21',teeth:[13,14,15,16,17,18,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,19,21,23]},
        {label:'13-26',teeth:[13,14,15,17,19,21,23,26]},
        {label:'14-26',teeth:[14,15,16,17,19,21,23,26]},
      ]
    },
    // ── 7-speed ────────────────────────────────────────────
    // 2026-09-02: found and read Campagnolo's actual June 1990 catalogue
    // (scanned original, disraeligears.co.uk archive — screenshotted via
    // Chrome + cropped/upscaled with sips for exact digit reading, same
    // technique used for si.shimano.com this session, see
    // [[shimano-si-pdf-access]]). It has a real per-groupset spec table
    // (crank length / chainring / hub / seatpost options, dot=standard,
    // circle=upon-request) for both Record and Chorus — but Campagnolo
    // never spec'd exact freewheel tooth combinations themselves at this
    // era; the freewheel was a third-party Regina part ("Campagnolo
    // approved chain and freewheel by Regina" per the catalogue's own
    // Chorus copy), so cassette teeth genuinely can't be confirmed from
    // Campagnolo's own documentation — still a bare guess below, treat
    // with real suspicion.
    // What the catalogue DID confirm: 52/42 is the real standard chainring
    // for both tiers (matches what was already coded) — inner ring is a
    // modular 39-47T range (42T standard) on both, outer ring modular
    // 48-54T on Chorus / 48-57T on Record (52T standard on both, Record's
    // range goes wider). Crank lengths: Chorus only 170/172.5mm, Record
    // the full 165-180mm range.
    // Also a real era-boundary correction: by this June 1990 printing,
    // Chorus's 7-speed was already being phased out (this catalogue is
    // the last one to show it — Anaheim 1990, shortly after, dropped it
    // for 8-speed) and Record's STANDARD configuration had already become
    // an 8-speed cassette hub, with the old 7-speed hub relegated to
    // "upon request" only. By the 1992 catalogue both are "all 8-speed",
    // no 7-speed option left at all. So '1987–96' below is wrong at the
    // end (real cutoff is ~1990, not 1996) — start year still unconfirmed
    // (predates this catalogue, not researched this pass).
    'Record 7 (1987–96)': {
      era:'7-speed · 1987–1996',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,16,17,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,20,23]},
        {label:'13-26',teeth:[13,14,15,16,18,21,26]},
      ]
    },
    'Chorus 7 (1988–96)': {
      era:'7-speed · 1987–1996',
      chainrings:[{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,16,17,19,21]},
        {label:'14-24',teeth:[14,15,16,17,19,21,24]},
      ]
    },
    // ── 6-speed ────────────────────────────────────────────
    // 2026-09-02: two of the (real, physically-verified) 6-speed freewheel
    // ranges got confirmed exact tooth sequences (13-23, 14-20) from
    // vintage-parts listings — swapped in for the old 13-21/14-24 entries,
    // which had no confirming source at all. Other real period ranges
    // (13-21, 13-24, 14-24) exist but their exact spacing is still
    // unconfirmed; not added rather than guessed.
    'Record 6 (pre-1990)': {
      era:'6-speed · pre-1990',
      chainrings:[{label:'53/42',outer:53,inner:42}],
      cassettes:[
        {label:'13-23',teeth:[13,15,17,19,21,23]},
        {label:'14-20',teeth:[14,15,16,17,18,20]},
      ]
    },
  }, // end campagnolo road

}, // end road

/* ══════════════════════════════════════════════════════════════
   MTB
══════════════════════════════════════════════════════════════ */
mtb: {

  shimano: {
    _eras: [
      '12-speed · 2018–present',
      'Deore 11-speed · 2019–present',
      'Deore 10-speed · 2019–present',
      '11-speed · 2014–2020',
      '10-speed · 2007–2016',
      '9-speed · 2004–2012',
      '8-speed · 1998–2006',
      '7-speed · 1992–2002',
    ],
    // ── 12-speed ───────────────────────────────────────────
    // 2026-09-02: corrected from Shimano's official parts-diagram PDFs
    // (dassets.shimano.com/.../EV-CS-M*.pdf, same source used for the road
    // section fix) — the 10-45 cassette was missing two sprockets (32/36/40
    // collapsed into an 11-value list instead of the real 12), shared
    // identically across XTR/XT/SLX/Deore (confirmed per tier). 10-51 was
    // already correct everywhere it appeared.
    //
    // Same day, spotted via Shimano's own compatibility matrix
    // (productinfo.shimano.com/en/compatibility/C-433, which Robin had
    // open): a newer generation — XTR M9200 (launched Aug 2025) and Deore
    // XT M8200 (Di2 Jun 2025, mechanical 2026) — was missing entirely.
    // Confirmed via Shimano's own product copy that CS-M9200-12/CS-M8200-12
    // use "the same tooth configuration" as M9100/M8100 (refined
    // HYPERGLIDE+ tooth PROFILE, not a different tooth COUNT), so added
    // reusing the same confirmed cassette values; chainring options assumed
    // unchanged from M9100/M8100 (not independently confirmed).
    'XTR M9200 (2025–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'34T 1×',outer:34,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null},{label:'36/26 2×',outer:36,inner:26}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,32,36,40,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'Deore XT M8200 (2025–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,32,36,40,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'XTR M9100 (2018–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'34T 1×',outer:34,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null},{label:'36/26 2×',outer:36,inner:26}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,32,36,40,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'Deore XT M8100 (2020–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,32,36,40,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'SLX M7100 (2020–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,32,36,40,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'Deore M6100 (2019–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,32,36,40,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    // Launched June 2026 (found the same session, via the same Shimano
    // compatibility matrix that turned up M9200/M8200) — Shimano retired
    // the SLX brand name here: CS-M7200 is literally "the SLX M7100
    // cassette reworked into the Deore lineup" per contemporary press
    // coverage, both M7200 and M6200 now badged Deore. Real, confirmed:
    // BOTH only ship the 10-51 range (no 10-45 option, unlike the tiers
    // above) — a genuine simplification, not a gap in this data. Chainring
    // options assumed unchanged from SLX M7100 / Deore M6100 respectively
    // — not independently confirmed.
    'Deore M7200 (2026–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'Deore M6200 (2026–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    // Confirmed shared across XTR/Deore XT/SLX (CS-M9000/M8000/M7000 all
    // interchangeable per their own parts PDFs) — 11-42 was already
    // correct everywhere; 11-40 and 11-46 both had the wrong tail.
    'XTR M9000 (2014–20)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'28/38 2×',outer:38,inner:28},{label:'26/36 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-40',teeth:[11,13,15,17,19,21,24,27,31,35,40]},
        {label:'11-46',teeth:[11,13,15,17,19,21,24,28,32,37,46]},
      ]
    },
    'Deore XT M8000 (2016–20)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'28/38 2×',outer:38,inner:28}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
        {label:'11-46',teeth:[11,13,15,17,19,21,24,28,32,37,46]},
      ]
    },
    'SLX M7000 (2016–20)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'28/38 2×',outer:38,inner:28}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
      ]
    },
    // 2026-09-02: chainring corrected from Shimano's official current spec
    // handbook (productinfo.shimano.com master PDF) — FC-M6000-2's real
    // chainring combination is 36-26T only, not the invented 36/22+38/24
    // pair that was on file. Cassette rows are unconfirmed (M6000 doesn't
    // appear in the current spec handbook's MTB cassette tables — likely
    // discontinued spare — left as-is, flagged not verified).
    'Deore M6000 (2014–19)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'36/26 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-42',teeth:[11,12,13,14,16,18,21,24,28,34,42]},
        {label:'11-36',teeth:[11,13,15,17,19,21,24,28,32,34,36]},
      ]
    },
    // Added 2026-09-02 — found via Shimano's own current-products spec
    // page (productinfo.shimano.com/en/spec/mtb-cassette, which still
    // lists it) and confirmed exact from its own parts PDF: CS-M5100 is
    // Deore's real 11-speed cassette from 2019 on, effectively M6000's
    // successor at this tier (M6000's own era already ends 2019). The
    // 11-42 option is the SAME cassette confirmed for XTR/XT/SLX M9000/
    // M8000/M7000 above; 11-51 (not previously in this file at all, at
    // ANY 11-speed tier) is unique to this one. Chainring options assumed
    // 1x-only, matching the era's XT/SLX pattern — not independently
    // confirmed for M5100 specifically.
    // Chainrings confirmed 2026-09-02 from the MTB crankset spec page
    // (productinfo.shimano.com/en/spec/mtb-crankset, which Robin found) —
    // FC-M5100-1 (1x, 32T/30T) matches what was already here exactly, plus
    // a real FC-M5100-2 (2x, 36/26) that was missing.
    'Deore M5100 (2019–)': {
      era:'Deore 11-speed · 2019–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null},{label:'36/26 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
        {label:'11-51',teeth:[11,13,15,18,21,24,28,33,39,45,51]},
      ]
    },
    // CS-M4100, a Deore-branded 10-speed cassette still sold today (dated
    // May 2020, same as M5100 above) — likely aimed at cost-sensitive OEM
    // builds. Genuinely different tooth counts from the 11-speed family
    // despite similar-looking numbers (10 sprockets, not 11). CORRECTED
    // 2026-09-02: the crankset spec page shows FC-M4100 is 2x-ONLY
    // (36/26) — there is no 1x variant at all. The 1x 32T/30T guessed here
    // originally was wrong, not just unconfirmed.
    'Deore M4100 (2019–)': {
      era:'Deore 10-speed · 2019–present',
      chainrings:[{label:'36/26 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,18,21,24,28,32,37,42]},
        {label:'11-46',teeth:[11,13,15,18,21,24,28,32,37,46]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    // 2026-09-02: cassette corrected from EV-CS-M980-3019A — real options
    // are 11-34 (bj-group) and 11-36 (bk-group); the file's 11-32 wasn't
    // real (should be 11-34) and 11-36's internal spacing was wrong.
    // Chainrings not independently re-checked this pass — left as-is.
    'XTR M985/980 (2010–14)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/36 2×',outer:36,inner:22},{label:'22/30/40 3×',outer:40,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,13,15,17,19,21,24,28,32,36]},
        {label:'11-34',teeth:[11,13,15,17,19,21,23,26,30,34]},
      ]
    },
    // 2026-09-02: MODEL NUMBER FLAG — CS-M770's own doc header says "9-
    // Speed" (SI-3CZ0A confirms it), not 10-speed. Real Shimano history:
    // Deore XT M770 was the 9-speed generation (should live in the
    // 9-speed era below); the real 10-speed XT is M780. Left this entry's
    // name/era as-is (a rename is a bigger structural change than a data
    // fix), but the cassette here is corrected using the real 10-speed
    // shared cassette (CS-HG81-10, bj/bk-group, which XT/SLX/Deore all
    // used at 10-speed) via EV-CS-HG81-10-3018B — real 11-34 and 11-36
    // spacing, both were wrong in the file.
    'Deore XT M770 (2007–12)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/30/40 3×',outer:40,inner:22}],
      cassettes:[
        {label:'11-34',teeth:[11,13,15,17,19,21,23,26,30,34]},
        {label:'11-36',teeth:[11,13,15,17,19,21,24,28,32,36]},
      ]
    },
    // 2026-09-02: 11-36 spacing corrected from the same EV-CS-HG81-10-3018B
    // shared cassette confirmed for Deore XT M770 above (SLX shared this
    // part too).
    'SLX M660 (2009–14)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/32/44 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,13,15,17,19,21,24,28,32,36]},
      ]
    },
    // 2026-09-02: 11-36 spacing corrected from the same shared CS-HG81-10
    // cassette. 11-42 not independently re-checked this pass (different,
    // wider-range part) — left as-is.
    'Deore M615 (2012–16)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/30/40 3×',outer:40,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,13,15,17,19,21,24,28,32,36]},
        {label:'11-42',teeth:[11,13,15,18,21,24,28,32,37,42]},
      ]
    },
    // ── 9-speed ────────────────────────────────────────────
    // 2026-09-02: cassette corrected from EV-CS-M970-2577 — real options
    // are THREE distinct cassettes, not two: ba-group 11-32
    // (11-12-14-16-18-21-24-28-32), be-group 11-34
    // (11-13-15-17-20-23-26-30-34, different internal spacing to ba —
    // not just a wider ba), and bd-group 12-34
    // (12-14-16-18-20-23-26-30-34). The file's old single "11-34" was a
    // wrong hybrid of the two real 11-range cassettes.
    // Chainring corrected from EV-FC-M970-2592 — real combos are 44-32-22T
    // (AA-group) and 44-32-24T (AB-group), both triples, BCD 104mm outer/
    // middle + 64mm inner. The file's 2×/26-36 option does NOT appear
    // anywhere in this parts doc (only single 22/24/32/44T rings listed,
    // no 26T or 36T) — flagged as unconfirmed rather than removed, since
    // this doc may just not cover a separate 2×-specific model code.
    'XTR M970 (2006–10)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'44/22 3×',outer:44,inner:22},{label:'44/24 3×',outer:44,inner:24},{label:'26/36 2× (UNCONFIRMED)',outer:36,inner:26}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,28,32]},
        {label:'11-34',teeth:[11,13,15,17,20,23,26,30,34]},
        {label:'12-34',teeth:[12,14,16,18,20,23,26,30,34]},
      ]
    },
    // 2026-09-02: cassette corrected from EV-CS-M760-2267 — real options
    // are aq-group 11-32 (11-12-14-16-18-21-24-28-32) and as-group 11-34
    // (11-13-15-17-20-23-26-30-34), identical spacing to XTR M970's
    // ba/be-groups above (shared 9-speed cassette architecture across
    // tiers) — no third/bd-group option exists for this tier though.
    // Chainring corrected from EV-FC-M760-2261D — real combo is a single
    // 44-32-22T triple (BCD 104mm outer/middle, 64mm inner); the parts
    // list only has 22T/32T/44T rings, no 24T variant and no 26T/34T
    // anywhere — the file's old "24/34 2×" was fabricated outright.
    'Deore XT M760 (2004–08)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'44/22 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,28,32]},
        {label:'11-34',teeth:[11,13,15,17,20,23,26,30,34]},
      ]
    },
    // 2026-09-02: cassette corrected from EV-CS-M580-2354 — real options
    // are ar-group 11-32 and au-group 11-34, same exact spacing as XTR
    // M970/Deore XT M760 above (shared 9-speed cassette architecture).
    // Chainring cross-checked against EV-FC-M580-2356C — confirmed
    // correct as-is (single 44-32-22T triple, same rings as M760's crank).
    'LX M580 (2003–09)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,28,32]},
        {label:'11-34',teeth:[11,13,15,17,20,23,26,30,34]},
      ]
    },
    // 2026-09-02: chainring corrected from EV-FC-M530-2463A — real combos
    // are 44-32-22T and 48-36-26T (both triples, BCD 104mm outer/middle,
    // 64mm inner); the file's 42T/34T/24T options don't match anything in
    // the real parts list. Cassette corrected from EV-CS-HG50-9M-ar-1904 —
    // explicitly labeled "SHIMANO DEORE Cassette Sprocket... ar-Group",
    // confirming it's the real Deore-tier part, same ar-group spacing as
    // XTR M970/XT M760/LX M580 above (11-32) — only the narrower option is
    // documented for Deore, no au-group (11-34) found for this tier.
    'Deore M530 (2004–10)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'44/22 3×',outer:44,inner:22},{label:'48/26 3×',outer:48,inner:26}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,28,32]},
      ]
    },
    // ── 8-speed ────────────────────────────────────────────
    // 2026-09-02: cassette corrected from EV-CS-M950-ak-1597 + EV-CS-M950-
    // P-1598, both explicitly "SHIMANO XTR Cassette Sprocket" — real
    // options are ak-group 11-30 (11-13-15-17-20-23-26-30) and P-group
    // 12-32 (12-14-16-18-21-24-28-32), completely different spacing to
    // what the file had (which also wrongly capped ak-group at 32T instead
    // of 30T). Chainring corrected from EV-FC-M950-1591 — real parts list
    // only has 24T/34T/46T rings (a single 46-34-24T triple), nothing
    // matching the file's old 22/32/44 or 26/36 options at all.
    'XTR M950/952 (1999–2004)': {
      era:'8-speed · 1998–2006',
      chainrings:[{label:'46/24 3×',outer:46,inner:24}],
      cassettes:[
        {label:'11-30',teeth:[11,13,15,17,20,23,26,30]},
        {label:'12-32',teeth:[12,14,16,18,21,24,28,32]},
      ]
    },
    // 2026-09-02: chainring corrected from EV-FC-M560-1257B, explicitly
    // "DEORE LX Front Chainwheel FC-M560" — real combo is a single
    // 46-36-26T triple (BCD 110mm outer/middle, 74mm inner), nothing like
    // the file's old 22/32/44. Cassette: no dedicated CS-M560 part exists
    // (direct model search returned nothing) — M560 shares the generic
    // 8-speed HG50/HG60 cassette family (EV-CS-HG60-8I(an)-1651A covers
    // both CS-HG60-8I and CS-HG50-8I under the same "an-group" part,
    // EV-CS-HG50-8I-2125A adds the wider "aw-group") — an inference about
    // shared parts, not an LX-specific document like the chainring above.
    // Real options: an-group 11-30 (matches XTR M950's ak-group exactly)
    // and aw-group 11-32 — different spacing to the file's old 11-32/13-32.
    'Deore LX M560 (2000–04)': {
      era:'8-speed · 1998–2006',
      chainrings:[{label:'46/26 3×',outer:46,inner:26}],
      cassettes:[
        {label:'11-30',teeth:[11,13,15,17,20,23,26,30]},
        {label:'11-32',teeth:[11,13,15,18,21,24,28,32]},
      ]
    },
    // 2026-09-02: chainring corrected from EV-FC-M510-S-1872A, explicitly
    // "SHIMANO DEORE Front Chainwheel FC-M510" — real combos are 44-32-22T
    // and 48-36-26T (both triples, BCD 104mm outer/middle, 64mm inner),
    // exactly matching Deore M530's 9-speed crank above — the file's old
    // 42T/36T/24T options didn't match anything real. Cassette: no
    // dedicated CS-M510 doc found (direct search returned nothing) —
    // reusing the same shared-parts inference as Deore LX M560 above
    // (generic 8-speed an-group 11-30 / aw-group 11-32), since M510 is
    // also an 8-speed Deore-tier bike; not an M510-specific document.
    'Deore M510 (2000–06)': {
      era:'8-speed · 1998–2006',
      chainrings:[{label:'44/22 3×',outer:44,inner:22},{label:'48/26 3×',outer:48,inner:26}],
      cassettes:[
        {label:'11-30',teeth:[11,13,15,17,20,23,26,30]},
        {label:'11-32',teeth:[11,13,15,18,21,24,28,32]},
      ]
    },
    // ── 7-speed ────────────────────────────────────────────
    // 2026-09-02: real model number researched first (web search) since
    // "Deore LX (7-speed)" isn't itself a Shimano part number — found
    // FC-M550, confirmed via EV-FC-M550-1101A ("Front Chainwheel DEORE
    // LX"). Unlike every other chainring doc this session, this one has
    // NO stated "combination" line — it's a fully modular parts list
    // (inner 24/25/28/30T, middle 36/37/38/40T, outer 46/47/48/50T,
    // including BIOPACE oval-ring variants), so no single small set of
    // "the real combos" exists to cite. The file's 28/38/48 IS at least a
    // real, valid combination of existing sizes (kept). Its 26/36/46 is
    // NOT valid — 26T isn't in the parts list at all (closest real inner
    // options are 24/25/28/30) — swapped for 25/37/47, another valid
    // modular combo, but treat both as illustrative rather than a
    // confirmed factory-standard pairing.
    // Cassette corrected from EV-CS-HG90_HG70_HG50-7E/7F-1128A/1129A —
    // both doc titles confirm CS-HG50-7(x) is IDENTICAL across HG90/HG70/
    // HG50 tiers (XT/mid/Deore all share the same physical part), so tier
    // doesn't matter here. Real E-group is 12-28, F-group is 14-32 — used
    // both as the two listed options; other letter groups (G/H/I/J/K/M)
    // exist in the same doc family but weren't individually checked this
    // pass.
    'Deore LX (7-speed 1992–99)': {
      era:'7-speed · 1992–2002',
      chainrings:[{label:'28/38/48 3× (illustrative)',outer:48,inner:28},{label:'25/37/47 3× (illustrative)',outer:47,inner:25}],
      cassettes:[
        {label:'12-28',teeth:[12,14,16,18,21,24,28]},
        {label:'14-32',teeth:[14,16,18,21,24,28,32]},
      ]
    },
    // 2026-09-02: real model number researched first (web search) — found
    // FC-M410, confirmed via EV-FC-M410-2465A ("ALIVIO Front Chainwheel
    // FC-M410"). Real combo is a single 42-32-22T triple (BCD 104mm outer/
    // middle, 64mm inner) — parts list only has 22T/32T/42T rings, nothing
    // matching the file's old 28/38/48. Cassette: same shared 7-speed
    // HG-series parts as Deore LX above (EV-CS-HG90_HG70_HG50-7E/7F —
    // doc titles confirm these are identical across HG90/HG70/HG50 tiers,
    // Alivio sits at the low end of that same shared range) — E-group
    // 12-28, F-group 14-32, replacing the file's old unconfirmed spacing.
    'Deore / Alivio (7-speed 1993–2001)': {
      era:'7-speed · 1992–2002',
      chainrings:[{label:'42/22 3×',outer:42,inner:22}],
      cassettes:[
        {label:'12-28',teeth:[12,14,16,18,21,24,28]},
        {label:'14-32',teeth:[14,16,18,21,24,28,32]},
      ]
    },
  }, // end shimano mtb

  sram: {
    _eras: [
      '12-speed Eagle Transmission (T-Type) · 2023–present',
      '12-speed Eagle · 2017–present',
      '11-speed · 2012–2018',
      '10-speed · 2006–2014',
    ],
    // ── 12-speed Eagle Transmission (T-Type) — direct-mount UDH, replaced XX1/X01 Eagle AXS ──
    'XX SL Eagle Transmission AXS (2023–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'36T 1×',outer:36,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    'XX Eagle Transmission AXS (2023–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'36T 1×',outer:36,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    'X0 Eagle Transmission AXS (2023–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'36T 1×',outer:36,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    'GX Eagle Transmission AXS (2023–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'36T 1×',outer:36,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    // Real launch was July 2023, alongside/shortly after XX SL/XX/X0 — not
    // 2024 as this entry previously said.
    //
    // 2026-09-02: two current tiers were missing entirely — Eagle 90 and
    // Eagle 70 Transmission (launched March 2025), SRAM's first MECHANICAL
    // (DoubleTap, not AXS electronic) Transmission drivetrains, sitting
    // below GX. Chainring range confirmed narrower than the AXS tiers
    // (30-34T only, not 30-38T). Cassette assumed to share the same 10-52
    // XG-1299-family progression as every other Eagle Transmission tier
    // (SRAM markets the whole Transmission line on that consistent 520%
    // range) — not independently confirmed for these two specific alloy
    // cassette SKUs (XS-1275/XS-1270), medium confidence on that one point.
    'Eagle 90 Transmission (2025–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    'Eagle 70 Transmission (2025–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    // ── 12-speed Eagle (cable/AXS, non-Transmission) ─────────────────────────────────────
    'XX1 Eagle (2017–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'34T 1×',outer:34,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'36T 1×',outer:36,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    'X01 Eagle (2017–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    'GX Eagle (2017–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'10-52',teeth:[10,12,14,16,18,21,24,28,32,36,42,52]},
      ]
    },
    // 2026-09-02: 11-50 spacing corrected from the real PG-1230 product
    // page (21,24 → confirmed real 22,25) — the 10-52 XG-1299 cassette
    // above was already accurate when checked against the same source.
    'NX Eagle (2017–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'11-50',teeth:[11,13,15,17,19,22,25,28,32,36,42,50]},
      ]
    },
    'SX Eagle (2019–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'11-50',teeth:[11,13,15,17,19,22,25,28,32,36,42,50]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    'XX1 (2012–17)': {
      era:'11-speed · 2012–2018',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null}],
      cassettes:[
        {label:'10-42',teeth:[10,12,14,16,18,21,24,28,32,36,42]},
      ]
    },
    'X01 (2013–17)': {
      era:'11-speed · 2012–2018',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-42',teeth:[10,12,14,16,18,21,24,28,32,36,42]},
      ]
    },
    'X1 / GX (2015–17)': {
      era:'11-speed · 2012–2018',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'10-42',teeth:[10,12,14,16,18,21,24,28,32,36,42]},
        {label:'11-42',teeth:[11,13,15,17,19,22,26,30,35,40,42]},
      ]
    },
    'NX (2016–17)': {
      era:'11-speed · 2012–2018',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,22,26,30,35,40,42]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    'XX (2010–14)': {
      era:'10-speed · 2006–2014',
      chainrings:[{label:'39/26 2×',outer:39,inner:26},{label:'36/22 2×',outer:36,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
      ]
    },
    'X0 / X9 (2007–14)': {
      era:'10-speed · 2006–2014',
      chainrings:[{label:'38/24 2×',outer:38,inner:24},{label:'42/28 2×',outer:42,inner:28},{label:'22/32/44 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
        {label:'11-32',teeth:[11,12,13,15,17,20,23,26,29,32]},
      ]
    },
    'X7 / X5 (2008–14)': {
      era:'10-speed · 2006–2014',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22},{label:'24/34/42 3×',outer:42,inner:24}],
      cassettes:[
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
        {label:'12-36',teeth:[12,13,14,16,18,21,24,28,32,36]},
      ]
    },
  }, // end sram mtb

}, // end mtb

/* ══════════════════════════════════════════════════════════════
   GRAVEL
══════════════════════════════════════════════════════════════ */
gravel: {

  shimano: {
    _eras: [
      'GRX 12-speed · 2022–present',
      'GRX 11-speed · 2019',
    ],
    // 2026-09-02: GRX RX820 (current) borrows the road 12-speed cassette
    // family directly — confirmed 11-34 is the same CS-R8101 (Ultegra)
    // cassette as the road section, and 11-36 the same CS-HG710-12 —
    // corrected to match those confirmed values exactly.
    // Chainrings corrected same session against Shimano's own current spec
    // handbook: FC-RX820-2 is 48-31T ONLY (the 46/30 option here was
    // actually RX610's crank, now split into its own entries below), and
    // FC-RX820-1 really offers 40T/42T/44T/46T, not the 38T that was here.
    'GRX RX820 2× (2022–)': {
      era:'GRX 12-speed · 2022–present',
      chainrings:[{label:'48/31',outer:48,inner:31}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
        {label:'11-36',teeth:[11,12,13,14,15,17,19,21,24,28,32,36]},
      ]
    },
    'GRX RX820 1× (2022–)': {
      era:'GRX 12-speed · 2022–present',
      chainrings:[{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'46T 1×',outer:46,inner:null}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
        {label:'11-36',teeth:[11,12,13,14,15,17,19,21,24,28,32,36]},
      ]
    },
    // Added 2026-09-02 — GRX RX610 was missing entirely. Confirmed from
    // Shimano's current spec handbook crankset table: FC-RX610-2 is
    // 46-30T, FC-RX610-1 is 38T/40T; "Compatible chain: HG 12-speed" (not
    // LINKGLIDE) means it shares RX820's standard cassette family.
    'GRX RX610 2× (2022–)': {
      era:'GRX 12-speed · 2022–present',
      chainrings:[{label:'46/30',outer:46,inner:30}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
        {label:'11-36',teeth:[11,12,13,14,15,17,19,21,24,28,32,36]},
      ]
    },
    'GRX RX610 1× (2022–)': {
      era:'GRX 12-speed · 2022–present',
      chainrings:[{label:'38T 1×',outer:38,inner:null},{label:'40T 1×',outer:40,inner:null}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,27,30,34]},
        {label:'11-36',teeth:[11,12,13,14,15,17,19,21,24,28,32,36]},
      ]
    },
    // RX810 (2019, 11-speed) predates GRX-specific cassettes — it borrowed
    // MTB cassettes instead: 11-34 is CS-HG700 (confirmed, MTB-style skip
    // spacing, very different from the road 11-34 above), 11-42 is the
    // same CS-M7000/M8000 cassette as 11-speed SLX/Deore XT MTB (already
    // correct here). RX810's own rear derailleur (RD-RX810) is only rated
    // for 11-30/32/34T — the '11-36' 1x option below has no confirmed real
    // product behind it this pass, kept but flagged rather than removed.
    // 2x chainring corrected 2026-09-02: FC-RX810-2 is 48-31T only per
    // Shimano's current spec handbook — the 46/30 pairing here was actually
    // RX610's crank (now its own entry in the 12-speed section above).
    'GRX RX810 2× (2019)': {
      era:'GRX 11-speed · 2019',
      chainrings:[{label:'48/31',outer:48,inner:31}],
      cassettes:[
        {label:'11-34',teeth:[11,13,15,17,19,21,23,25,27,30,34]},
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
      ]
    },
    'GRX RX810 1× (2019)': {
      era:'GRX 11-speed · 2019',
      chainrings:[{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
        // UNCONFIRMED — see comment above.
        {label:'11-36',teeth:[11,12,13,14,16,18,20,22,25,30,36]},
      ]
    },
  }, // end shimano gravel

  sram: {
    _eras: [
      'XPLR 13-speed · 2025–present',
      'XPLR 12-speed · 2022–2025',
      'Apex 12-speed · 2023–present',
    ],
    // 2026-09-02: SRAM's whole flagship XPLR family moved to 13-speed with
    // a single shared 10-46 cassette (confirmed exact from sram.com product
    // pages + cross-checked against an independent Cyclingnews/BikeRadar
    // review quoting the identical sequence) — replaces the old 2022
    // 12-speed generation's per-tier 10-44/10-36 options below, which are
    // now historical (Robin asked for the same audit that caught fabricated
    // Campagnolo data; 'Red XPLR AXS' was also missing here entirely).
    'Red XPLR AXS (2025–)': {
      era:'XPLR 13-speed · 2025–present',
      chainrings:[{label:'46T 1×',outer:46,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-46',teeth:[10,11,12,13,15,17,19,21,24,28,32,38,46]},
      ]
    },
    'Force XPLR AXS (2025–)': {
      era:'XPLR 13-speed · 2025–present',
      chainrings:[{label:'46T 1×',outer:46,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-46',teeth:[10,11,12,13,15,17,19,21,24,28,32,38,46]},
      ]
    },
    'Rival XPLR AXS (2025–)': {
      era:'XPLR 13-speed · 2025–present',
      chainrings:[{label:'46T 1×',outer:46,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-46',teeth:[10,11,12,13,15,17,19,21,24,28,32,38,46]},
      ]
    },
    // Superseded by the 13-speed generation above — not re-verified against
    // a primary source this pass (only the naming/era was corrected), left
    // as a lower-confidence historical entry rather than deleted outright.
    'Force XPLR AXS (2022–25)': {
      era:'XPLR 12-speed · 2022–2025',
      chainrings:[{label:'43T 1×',outer:43,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-44',teeth:[10,11,12,13,15,17,19,22,26,30,35,44]},
        {label:'10-36',teeth:[10,11,12,13,14,15,17,19,22,25,30,36]},
      ]
    },
    'Rival XPLR AXS (2022–25)': {
      era:'XPLR 12-speed · 2022–2025',
      chainrings:[{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'10-44',teeth:[10,11,12,13,15,17,19,22,26,30,35,44]},
        {label:'10-36',teeth:[10,11,12,13,14,15,17,19,22,25,30,36]},
      ]
    },
    // Real current naming is just 'Apex' (not 'Apex XPLR AXS') — launched
    // 2023, mechanical AND AXS variants, 1x12 only. Uses its own 11-44
    // cassette (exact spacing confirmed from sram.com), distinct from the
    // flagship XPLR family's 10-46. Apex can also be built with MTB Eagle
    // Transmission parts (10-52 cassette) for wide-range "mullet" setups —
    // not modelled here, out of scope for a road/gravel gear calculator.
    'Apex (2023–)': {
      era:'Apex 12-speed · 2023–present',
      chainrings:[{label:'44T 1×',outer:44,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'11-44',teeth:[11,12,13,15,17,19,21,24,28,32,38,44]},
      ]
    },
  }, // end sram gravel

  campagnolo: {
    _eras: [
      '13-speed · 2021–present',
    ],
    // 2026-09-02: cassette spacing corrected + missing options added, then
    // cross-checked against Campagnolo's own 2025 Spare Parts Catalogue - B
    // (exact exploded-diagram spec sheets — the primary source, more
    // reliable than the product page's summarised text). The catalogue
    // caught a real error the product-page text had introduced: Ekar's
    // 10-44 spacing below was wrong until this pass. Ekar's real three
    // sprocket sets are named Endurance/Gravel Race/Gravel Adventure by
    // Campagnolo; only two (with wrong spacing) were here before this
    // session's fixes.
    'Ekar (2021–)': {
      era:'13-speed · 2021–present',
      chainrings:[{label:'38T 1×',outer:38,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'46T 1×',outer:46,inner:null}],
      cassettes:[
        {label:'9-36 Endurance',       teeth:[9,10,11,12,13,14,16,18,20,23,27,31,36]},
        {label:'9-42 Gravel Race',     teeth:[9,10,11,12,13,14,16,18,21,25,30,36,42]},
        {label:'10-44 Gravel Adventure',teeth:[10,11,12,13,14,15,17,19,22,26,32,38,44]},
      ]
    },
    // Launched 2024 — same 1x crank options as Ekar. Its 10-44 is NOT the
    // same cassette as standard Ekar's 10-44 above (confirmed from the
    // catalogue: different part number, "13S-1012G" vs "13S-1012", and a
    // genuinely different tooth progression) — a mistake in this site's
    // first pass at this fix was reusing Ekar's 10-44 numbers here; real
    // Ekar GT 10-44 and 10-48 both confirmed from the catalogue directly.
    'Ekar GT (2024–)': {
      era:'13-speed · 2021–present',
      chainrings:[{label:'38T 1×',outer:38,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'46T 1×',outer:46,inner:null}],
      cassettes:[
        {label:'9-36 Endurance',       teeth:[9,10,11,12,13,14,16,18,20,23,27,31,36]},
        {label:'9-42 Gravel Race',     teeth:[9,10,11,12,13,14,16,18,21,25,30,36,42]},
        {label:'10-44 Gravel Adventure',teeth:[10,11,12,13,14,16,18,21,24,28,33,38,44]},
        {label:'10-48',teeth:[10,11,12,13,14,16,18,21,25,30,36,42,48]},
      ]
    },
    // 1x13 hybrid road/gravel tier (Super Record X launched 2023 alongside
    // Super Record 13; Record X launched with Record 13 in 2026). Not
    // chainring-compatible with 2x Super Record/Record 13 — single-ring
    // only, hence listed here under gravel rather than the road section.
    'Super Record X (2023–)': {
      era:'13-speed · 2021–present',
      chainrings:[{label:'38T 1×',outer:38,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'46T 1×',outer:46,inner:null},{label:'48T 1×',outer:48,inner:null},{label:'50T 1×',outer:50,inner:null},{label:'52T 1×',outer:52,inner:null}],
      cassettes:[
        {label:'9-42',teeth:[9,10,11,12,13,14,16,18,21,25,30,36,42]},
        {label:'10-48',teeth:[10,11,12,13,14,16,18,21,25,30,36,42,48]},
      ]
    },
    // Record X's crankset shares the same platform/chainring range as
    // Super Record X (confirmed: Campagnolo's "Record X crankset" and
    // "1x Super Record crankset" are the same 1x13 architecture).
    'Record X (2026–)': {
      era:'13-speed · 2021–present',
      chainrings:[{label:'38T 1×',outer:38,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'44T 1×',outer:44,inner:null},{label:'46T 1×',outer:46,inner:null},{label:'48T 1×',outer:48,inner:null},{label:'50T 1×',outer:50,inner:null},{label:'52T 1×',outer:52,inner:null}],
      cassettes:[
        {label:'10-48',teeth:[10,11,12,13,14,16,18,21,25,30,36,42,48]},
      ]
    },
  }, // end campagnolo gravel

}, // end gravel

};

/* ── Brands available per discipline ── */
export const DISC_BRANDS: Record<Discipline, Exclude<Brand, 'custom'>[]> = {
  road:   ['shimano','sram','campagnolo'],
  mtb:    ['shimano','sram'],
  gravel: ['shimano','sram','campagnolo'],
};

export interface WheelOption {
  label: string;
  circ: number;
  dflt?: boolean;
}

/* ── Wheel circumference options per discipline (mm) ── */
export const WHEELS: Record<Discipline, WheelOption[]> = {
  road: [
    {label:'700c × 23mm', circ:2097},
    {label:'700c × 25mm', circ:2105},
    {label:'700c × 28mm', circ:2136, dflt:true},
    {label:'700c × 30mm', circ:2155},
    {label:'700c × 32mm', circ:2174},
    {label:'700c × 35mm', circ:2200},
  ],
  mtb: [
    {label:'29" × 2.1"',  circ:2288, dflt:true},
    {label:'29" × 2.25"', circ:2300},
    {label:'29" × 2.35"', circ:2326},
    {label:'27.5" × 2.0"', circ:2148},
    {label:'27.5" × 2.25"',circ:2182},
    {label:'27.5" × 2.5"', circ:2215},
    {label:'26" × 2.0"',   circ:2055},
    {label:'26" × 2.25"',  circ:2086},
  ],
  gravel: [
    {label:'700c × 35mm', circ:2200, dflt:true},
    {label:'700c × 38mm', circ:2224},
    {label:'700c × 40mm', circ:2236},
    {label:'700c × 42mm', circ:2249},
    {label:'700c × 45mm', circ:2262},
    {label:'650b × 42mm', circ:2088},
    {label:'650b × 47mm', circ:2106},
    {label:'650b × 50mm', circ:2122},
  ],
};
