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
      '10-speed · 2004–2015',
      '9-speed · 1997–2010',
      '8-speed · 1991–2004',
      '7-speed · 1984–1994',
      '6-speed · 1978–1988',
      '5-speed · pre-1984',
    ],
    // ── 12-speed ───────────────────────────────────────────
    'Dura-Ace R9200': {
      era:'12-speed · 2021–present',
      chainrings:[{label:'54/40',outer:54,inner:40},{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,21,23,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,21,24,27,30]},
        {label:'11-34',teeth:[11,12,13,14,16,18,20,22,25,28,32,34]},
      ]
    },
    'Ultegra R8100': {
      era:'12-speed · 2021–present',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,21,24,27,30]},
        {label:'11-34',teeth:[11,12,13,14,16,18,20,22,25,28,32,34]},
      ]
    },
    '105 R7100': {
      era:'12-speed · 2021–present',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,16,18,20,22,25,28,32,34]},
        {label:'11-36',teeth:[11,12,13,14,16,18,20,22,25,28,32,36]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    'Dura-Ace R9100 (2016–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,21,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,22,25,30]},
      ]
    },
    'Dura-Ace 9000 (2012–16)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,21,25,28]},
      ]
    },
    'Ultegra R8000 (2017–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,21,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,22,25,30]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,21,24,28,32]},
        {label:'11-34',teeth:[11,12,13,14,15,17,19,21,24,28,34]},
      ]
    },
    'Ultegra 6800 (2013–17)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,21,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,21,24,28,32]},
      ]
    },
    '105 R7000 (2018–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,21,25,28]},
        {label:'11-30',teeth:[11,12,13,14,15,16,17,19,22,25,30]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,21,24,28,32]},
        {label:'11-34',teeth:[11,12,13,14,15,17,19,22,25,30,34]},
      ]
    },
    '105 5800 (2014–18)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,18,21,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,21,24,28,32]},
      ]
    },
    'Tiagra 4700 (2015–22)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,16,18,20,23,26,34]},
        {label:'12-28',teeth:[12,13,14,15,16,17,19,21,24,28]},
      ]
    },
    'Sora R3000 (2017–)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/34',outer:46,inner:34}],
      cassettes:[
        {label:'11-34',teeth:[11,13,15,17,19,21,23,26,30,34]},
        {label:'11-32',teeth:[11,12,14,16,18,21,24,28,32]},
      ]
    },
    'Claris R2000 (2017–)': {
      era:'11-speed · 2012–2022',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/34',outer:46,inner:34}],
      cassettes:[
        {label:'11-34',teeth:[11,13,15,17,19,21,23,26,30,34]},
        {label:'11-32',teeth:[11,13,15,17,19,21,24,28,32]},
        {label:'11-28',teeth:[11,13,15,17,19,21,23,26,28]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    'Dura-Ace 7900 (2008–12)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34},{label:'55/42',outer:55,inner:42}],
      cassettes:[
        {label:'11-23',teeth:[11,12,13,14,15,16,17,18,21,23]},
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
        {label:'12-25',teeth:[12,13,14,15,16,17,18,20,23,25]},
      ]
    },
    'Dura-Ace 7800 (2004–08)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,18,19,21]},
        {label:'11-23',teeth:[11,12,13,14,15,16,17,18,20,23]},
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,18,20,24,27]},
      ]
    },
    'Ultegra 6700 (2009–13)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
        {label:'12-30',teeth:[12,13,14,15,16,17,18,21,26,30]},
      ]
    },
    'Ultegra 6600 (2005–09)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-23',teeth:[12,13,14,15,16,17,18,19,21,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,18,19,22,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    '105 5700 (2010–14)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
        {label:'12-28',teeth:[12,13,14,15,16,17,19,21,24,28]},
        {label:'12-30',teeth:[12,13,14,15,16,17,18,21,26,30]},
      ]
    },
    '105 5600 (2005–10)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,18,20,23,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,21,24,27]},
      ]
    },
    'Tiagra 4600 (2010–15)': {
      era:'10-speed · 2004–2015',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'12-28',teeth:[12,13,14,15,16,17,19,21,24,28]},
        {label:'12-30',teeth:[12,13,14,15,17,19,21,23,26,30]},
      ]
    },
    // ── 9-speed ────────────────────────────────────────────
    'Dura-Ace 7700 (1997–04)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'11-21',teeth:[11,12,13,14,15,16,17,19,21]},
        {label:'12-23',teeth:[12,13,14,15,16,17,18,20,23]},
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,25]},
        {label:'13-26',teeth:[13,14,15,16,17,18,20,23,26]},
      ]
    },
    'Ultegra 6500 (1999–05)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/42',outer:52,inner:42},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,22,27]},
        {label:'13-26',teeth:[13,14,15,16,17,18,20,23,26]},
      ]
    },
    '105 5500 (2000–06)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,25]},
        {label:'13-25',teeth:[13,14,15,16,17,18,20,22,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,19,22,27]},
      ]
    },
    'Tiagra 4500 (2004–10)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/38',outer:46,inner:38}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,25]},
        {label:'12-27',teeth:[12,13,14,15,16,17,20,24,27]},
        {label:'11-32',teeth:[11,13,15,17,19,21,23,26,32]},
      ]
    },
    'Sora 3300/3400 (2002–17)': {
      era:'9-speed · 1997–2010',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/38',outer:46,inner:38}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,19,21,25]},
        {label:'11-32',teeth:[11,13,15,17,19,21,23,26,32]},
        {label:'12-30',teeth:[12,13,15,17,19,21,23,26,30]},
      ]
    },
    // ── 8-speed ────────────────────────────────────────────
    'Dura-Ace 7410 (1991–97)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'12-21',teeth:[12,13,14,15,16,17,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,18,20,23]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,26]},
      ]
    },
    'Ultegra 6400/6401 (1991–99)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-21',teeth:[12,13,14,15,16,17,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,18,20,23]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,26]},
      ]
    },
    '105 5200/5300 (1993–2000)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'52/39',outer:52,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'13-23',teeth:[13,14,15,16,17,18,20,23]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,26]},
        {label:'12-25',teeth:[12,13,14,15,16,17,20,25]},
      ]
    },
    'Tiagra 4400 (1999–2004)': {
      era:'8-speed · 1991–2004',
      chainrings:[{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'12-25',teeth:[12,13,14,15,16,17,20,25]},
        {label:'13-26',teeth:[13,14,15,16,17,19,21,26]},
      ]
    },
    // ── 7-speed ────────────────────────────────────────────
    'Dura-Ace 7400 (1984–91)': {
      era:'7-speed · 1984–1994',
      chainrings:[{label:'53/42',outer:53,inner:42},{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,16,17,19,21]},
        {label:'13-23',teeth:[13,14,15,16,17,20,23]},
        {label:'14-28',teeth:[14,15,17,19,21,24,28]},
      ]
    },
    '600 Ultegra (1987–93)': {
      era:'7-speed · 1984–1994',
      chainrings:[{label:'52/42',outer:52,inner:42}],
      cassettes:[
        {label:'13-21',teeth:[13,14,15,16,17,19,21]},
        {label:'14-24',teeth:[14,15,16,17,19,21,24]},
      ]
    },
    '105 Golden Arrow (7-speed)': {
      era:'7-speed · 1984–1994',
      chainrings:[{label:'52/42',outer:52,inner:42},{label:'50/40',outer:50,inner:40}],
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
    'Red 22 (2013–19)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'52/36',outer:52,inner:36},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-25',teeth:[11,12,13,14,15,16,17,18,21,23,25]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,22,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    'Force 22 (2013–19)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'53/39',outer:53,inner:39},{label:'50/34',outer:50,inner:34}],
      cassettes:[
        {label:'11-26',teeth:[11,12,13,14,15,16,17,18,22,25,26]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,22,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    'Rival 22 (2013–19)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,22,25,28]},
        {label:'11-32',teeth:[11,12,13,14,15,17,19,22,25,28,32]},
      ]
    },
    'Apex 1 (2016–19 · 1×11)': {
      era:'11-speed · 2013–2019',
      chainrings:[{label:'42T 1×',outer:42,inner:null},{label:'40T 1×',outer:40,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,22,25,28,32,36,42]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
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
        {label:'11-26',teeth:[11,12,13,14,15,16,17,19,23,26]},
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
        {label:'12-28',teeth:[12,13,14,15,16,17,18,21,25,28]},
      ]
    },
    'Rival (2006–13)': {
      era:'10-speed · 2006–2013',
      chainrings:[{label:'50/34',outer:50,inner:34},{label:'46/36',outer:46,inner:36}],
      cassettes:[
        {label:'11-28',teeth:[11,12,13,14,15,16,17,19,23,28]},
        {label:'12-32',teeth:[12,13,14,15,17,19,21,24,28,32]},
      ]
    },
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
    // UNVERIFIED this pass — Centaur doesn't appear at all in the 2001
    // catalogue, and by 2002 Campagnolo had already dropped 9-speed
    // sprocket listings entirely. Left as-is (an existing unconfirmed
    // guess, not improved or worsened) rather than replace with an
    // equally-unconfirmed alternative.
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
    // UNVERIFIED this pass — no official spec table found for either tier
    // at 7-speed (Campagnolo's own archival documentation for this era is
    // marketing brochures, not spare-parts tooth-count tables). Left as-is
    // rather than guess further; treat both entries with real suspicion
    // until a primary source turns up.
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
      '11-speed · 2014–2020',
      '10-speed · 2007–2016',
      '9-speed · 2004–2012',
      '8-speed · 1998–2006',
      '7-speed · 1992–2002',
    ],
    // ── 12-speed ───────────────────────────────────────────
    'XTR M9100 (2018–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'34T 1×',outer:34,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null},{label:'36/26 2×',outer:36,inner:26}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,33,39,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'Deore XT M8100 (2020–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,33,39,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'SLX M7100 (2020–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'32T 1×',outer:32,inner:null},{label:'30T 1×',outer:30,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,33,39,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    'Deore M6100 (2019–)': {
      era:'12-speed · 2018–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'10-45',teeth:[10,12,14,16,18,21,24,28,33,39,45]},
        {label:'10-51',teeth:[10,12,14,16,18,21,24,28,33,39,45,51]},
      ]
    },
    // ── 11-speed ───────────────────────────────────────────
    'XTR M9000 (2014–20)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'28/38 2×',outer:38,inner:28},{label:'26/36 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-40',teeth:[11,13,15,17,19,21,24,28,32,37,40]},
        {label:'11-46',teeth:[11,13,15,18,21,24,28,32,37,40,46]},
      ]
    },
    'Deore XT M8000 (2016–20)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'28/38 2×',outer:38,inner:28}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
        {label:'11-46',teeth:[11,13,15,18,21,24,28,32,37,40,46]},
      ]
    },
    'SLX M7000 (2016–20)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'28/38 2×',outer:38,inner:28}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
      ]
    },
    'Deore M6000 (2014–19)': {
      era:'11-speed · 2014–2020',
      chainrings:[{label:'36/22 2×',outer:36,inner:22},{label:'38/24 2×',outer:38,inner:24}],
      cassettes:[
        {label:'11-42',teeth:[11,12,13,14,16,18,21,24,28,34,42]},
        {label:'11-36',teeth:[11,13,15,17,19,21,24,28,32,34,36]},
      ]
    },
    // ── 10-speed ───────────────────────────────────────────
    'XTR M985/980 (2010–14)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/36 2×',outer:36,inner:22},{label:'22/30/40 3×',outer:40,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
        {label:'11-32',teeth:[11,12,13,14,16,18,21,24,28,32]},
      ]
    },
    'Deore XT M770 (2007–12)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/30/40 3×',outer:40,inner:22}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,16,18,21,24,28,34]},
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
      ]
    },
    'SLX M660 (2009–14)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/32/44 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
      ]
    },
    'Deore M615 (2012–16)': {
      era:'10-speed · 2007–2016',
      chainrings:[{label:'26/36 2×',outer:36,inner:26},{label:'22/30/40 3×',outer:40,inner:22}],
      cassettes:[
        {label:'11-36',teeth:[11,12,14,16,18,21,24,28,32,36]},
        {label:'11-42',teeth:[11,13,15,18,21,24,28,32,37,42]},
      ]
    },
    // ── 9-speed ────────────────────────────────────────────
    'XTR M970 (2006–10)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22},{label:'26/36 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-34',teeth:[11,12,14,16,18,21,24,28,34]},
        {label:'12-34',teeth:[12,13,14,16,18,21,24,28,34]},
      ]
    },
    'Deore XT M760 (2004–08)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22},{label:'24/34 2×',outer:34,inner:24}],
      cassettes:[
        {label:'11-34',teeth:[11,12,14,16,18,21,24,28,34]},
        {label:'12-34',teeth:[12,13,14,16,18,21,24,28,34]},
      ]
    },
    'LX M580 (2003–09)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-34',teeth:[11,12,14,16,18,21,24,28,34]},
        {label:'12-34',teeth:[12,13,15,17,20,23,26,30,34]},
      ]
    },
    'Deore M530 (2004–10)': {
      era:'9-speed · 2004–2012',
      chainrings:[{label:'22/32/42 3×',outer:42,inner:22},{label:'24/34 2×',outer:34,inner:24}],
      cassettes:[
        {label:'11-34',teeth:[11,12,14,16,18,21,24,28,34]},
      ]
    },
    // ── 8-speed ────────────────────────────────────────────
    'XTR M950/952 (1999–2004)': {
      era:'8-speed · 1998–2006',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22},{label:'26/36 2×',outer:36,inner:26}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,32]},
        {label:'12-32',teeth:[12,13,14,16,18,21,24,32]},
      ]
    },
    'Deore LX M560 (2000–04)': {
      era:'8-speed · 1998–2006',
      chainrings:[{label:'22/32/44 3×',outer:44,inner:22}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,32]},
        {label:'13-32',teeth:[13,14,15,17,19,22,26,32]},
      ]
    },
    'Deore M510 (2000–06)': {
      era:'8-speed · 1998–2006',
      chainrings:[{label:'22/32/42 3×',outer:42,inner:22},{label:'24/36 2×',outer:36,inner:24}],
      cassettes:[
        {label:'11-32',teeth:[11,12,14,16,18,21,24,32]},
        {label:'13-32',teeth:[13,14,15,17,19,22,26,32]},
      ]
    },
    // ── 7-speed ────────────────────────────────────────────
    'Deore LX (7-speed 1992–99)': {
      era:'7-speed · 1992–2002',
      chainrings:[{label:'28/38/48 3×',outer:48,inner:28},{label:'26/36/46 3×',outer:46,inner:26}],
      cassettes:[
        {label:'13-30',teeth:[13,15,17,19,21,24,30]},
        {label:'14-28',teeth:[14,15,17,19,21,24,28]},
      ]
    },
    'Deore / Alivio (7-speed 1993–2001)': {
      era:'7-speed · 1992–2002',
      chainrings:[{label:'28/38/48 3×',outer:48,inner:28}],
      cassettes:[
        {label:'14-28',teeth:[14,16,18,20,22,24,28]},
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
    'GX Eagle Transmission AXS (2024–)': {
      era:'12-speed Eagle Transmission (T-Type) · 2023–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null},{label:'34T 1×',outer:34,inner:null},{label:'36T 1×',outer:36,inner:null},{label:'38T 1×',outer:38,inner:null}],
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
    'NX Eagle (2017–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'11-50',teeth:[11,13,15,17,19,21,24,28,32,36,42,50]},
      ]
    },
    'SX Eagle (2019–)': {
      era:'12-speed Eagle · 2017–present',
      chainrings:[{label:'30T 1×',outer:30,inner:null},{label:'32T 1×',outer:32,inner:null}],
      cassettes:[
        {label:'11-50',teeth:[11,13,15,17,19,21,24,28,32,36,42,50]},
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
    'GRX RX820 2× (2022–)': {
      era:'GRX 12-speed · 2022–present',
      chainrings:[{label:'48/31',outer:48,inner:31},{label:'46/30',outer:46,inner:30}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,16,18,20,22,25,28,32,34]},
        {label:'11-36',teeth:[11,12,13,14,16,18,20,22,25,28,32,36]},
      ]
    },
    'GRX RX820 1× (2022–)': {
      era:'GRX 12-speed · 2022–present',
      chainrings:[{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null},{label:'38T 1×',outer:38,inner:null}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,16,18,20,22,25,28,32,34]},
        {label:'11-36',teeth:[11,12,13,14,16,18,20,22,25,28,32,36]},
      ]
    },
    'GRX RX810 2× (2019)': {
      era:'GRX 11-speed · 2019',
      chainrings:[{label:'48/31',outer:48,inner:31},{label:'46/30',outer:46,inner:30}],
      cassettes:[
        {label:'11-34',teeth:[11,12,13,14,16,18,20,22,25,30,34]},
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
      ]
    },
    'GRX RX810 1× (2019)': {
      era:'GRX 11-speed · 2019',
      chainrings:[{label:'40T 1×',outer:40,inner:null},{label:'42T 1×',outer:42,inner:null}],
      cassettes:[
        {label:'11-42',teeth:[11,13,15,17,19,21,24,28,32,37,42]},
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
