// 2027 Tour de France — official route data (ASO route presentation, 22 Oct 2026).
// Distances, elevation and terrain come from the official stage profiles only — never inferred.
// Known climbs are added per stage in the `climbs` array (+ climbCount).

export interface StageClimb {
  name: string;
  /** Where in the stage it falls, e.g. "after Lancaster", "~85.5km mark", "final climb" */
  position?: string;
  len?: number; // km
  grad?: number; // %
  /** Real per-km average-gradient profile, trimmed from Robin's GPX (data/tdf2027/routes/) — only
   *  set once a climb has been trimmed and matched against its official length/gradient. */
  profile?: number[];
  /** GPS elevation gain (m) over the trimmed GPX segment — cross-checked against len*grad, not a
   *  fabricated figure. No absolute summit altitude shown (GPS altitude itself isn't reliable enough). */
  gain?: number;
  /** Verified prior race history only (Tour of Britain etc.) — researched 2026-09-15, each claim
   *  checked against a real source before being added here. Left blank rather than guessed where
   *  nothing solid turned up; see the memory note for what came back unconfirmed. */
  history?: string;
}

export interface Stage {
  num: number;
  date: string; // ISO, for JSON-LD
  dateLabel: string;
  start: string;
  finish: string;
  dist: number;
  terrain: 'Flat' | 'Hilly' | 'Mountainous' | 'ITT';
  /** Same terrain, in the type key the map's route-line colours use ('Mountain', not 'Mountainous') */
  mapType: 'Flat' | 'Hilly' | 'Mountain' | 'ITT';
  badgeCls: string;
  vgain: number;
  climbCount: number;
  summary: string;
  climbs: StageClimb[];
}


export const STAGES: Stage[] = [
  {
    num: 1,
    date: '2027-07-02',
    dateLabel: 'Friday 2 July 2027',
    start: 'Edinburgh',
    finish: 'Carlisle',
    dist: 185,
    terrain: 'Flat',
    mapType: 'Flat',
    badgeCls: 'badge-s',
    vgain: 2000,
    climbCount: 1,
    summary: 'Likely bunch sprint finish.',
    climbs: [
      {
        name: 'Côte de Melrose (Dingleton)', position: 'km 65', len: 2.2, grad: 6.7, profile: [6.4, 6.7, 7.9], gain: 146,
        history: "Climbed twice as the race's final categorised ascent in the 2025 Tour of Britain Women.",
      },
    ],
  },
  {
    num: 2,
    date: '2027-07-03',
    dateLabel: 'Saturday 3 July 2027',
    start: 'Keswick',
    finish: 'Liverpool',
    dist: 223,
    terrain: 'Hilly',
    mapType: 'Hilly',
    badgeCls: 'badge-h',
    vgain: 2800,
    climbCount: 5,
    summary: 'Expected breakaway stage.',
    climbs: [
      {
        name: 'Côte de Jubilee Tower', position: 'km 88, after Lancaster', len: 3.8, grad: 6.1, profile: [4.1, 10.4, 4.2, 5.7], gain: 232,
        history: 'The steepest test comes early — a 10%+ second kilometre — before three gentler kilometres carry the road to the top.',
      },
      {
        name: 'Côte de Trough of Bowland', position: 'km 98.5', len: 1.9, grad: 5.2, profile: [2.9, 7.7], gain: 98,
        history: 'A gentle opening kilometre gives way to a much steeper final pitch near 8%.',
      },
      {
        name: 'Côte de Waddington Fell', position: 'km 112', len: 3.4, grad: 6.4, profile: [5.4, 6.1, 7.0, 8.1], gain: 220,
        history: "The opening Category 1 climb of Stage 2, 2026 Tour of Britain Women.",
      },
      {
        // The old note here ("Part of the 2023 Tour of Britain men's Stage 1
        // route... on Rivington Road") was checked and found false — that
        // stage's real categorised climbs were Grains Bar and Ramsbottom
        // Rake, no mention of Rivington Road anywhere (2026-09-16). Replaced
        // with a descriptive line grounded in this climb's own profile data.
        name: 'Côte de Belmont', position: 'km 152.5, after Blackburn', len: 2, grad: 4, profile: [2.5, 5.5, 0.6], gain: 80,
        history: 'A short, punchy middle kilometre near 5.5%, bookended by two much easier ones.',
      },
      {
        name: 'Côte de Parbold', position: 'km 183', len: 1.8, grad: 5.6, profile: [3.9, 7.8], gain: 101,
        history: 'Doubles in gradient for its second and final kilometre, close to 8%.',
      },
    ],
  },
  {
    num: 3,
    date: '2027-07-04',
    dateLabel: 'Sunday 4 July 2027',
    start: 'Welshpool',
    finish: 'Cardiff',
    dist: 223,
    terrain: 'Hilly',
    mapType: 'Hilly',
    badgeCls: 'badge-h',
    vgain: 3000,
    climbCount: 7,
    summary: 'GC / puncheur stage.',
    climbs: [
      {
        name: "Côte d'Épynt", position: 'km 85.5', len: 3.7, grad: 7.9, profile: [5.4, 7.7, 9.8, 9.0], gain: 293,
        history: 'Builds steadily to a genuinely hard third kilometre near 10%, and barely eases before the summit.',
      },
      {
        name: 'Côte de Bannau Brycheiniog', position: 'km 121.5', len: 6.6, grad: 3.5, profile: [3.1, 3.3, 3.4, 3.7, 3.8, 3.8, 3.2], gain: 231,
        history: 'The longest of the UK climbs, but remarkably steady — every kilometre sits within a point of 3.5%, with no real sting in the tail.',
      },
      {
        name: 'Côte de Rhigos', position: 'km 145.5', len: 4.6, grad: 5.8, profile: [4.9, 6.1, 6.5, 5.4, 6.2], gain: 266,
        history: 'A Category 1 KOM on Stage 8 of the 2023 Tour of Britain, en route to a finish on the Côte de Caerffili below.',
      },
      {
        name: 'Côte de Penrhys', position: 'km 160.5', len: 1.3, grad: 10.1, profile: [9.8, 10.9], gain: 130,
        history: 'Short and consistently brutal — both kilometres average close to 10%, with the second slightly steeper again.',
      },
      {
        name: 'Côte de Maerdy', position: 'km 169', len: 1.5, grad: 8.7, profile: [9.1, 7.3], gain: 126,
        history: 'Hardest right from the gun — over 9% in the opening kilometre — before easing slightly into the finish.',
      },
      {
        name: 'Côte de Hengoed', position: 'km 197.5', len: 0.7, grad: 11, profile: [10.7], gain: 73,
        history: 'Barely 700m long but averaging almost 11% throughout — a short, sharp shock of a climb.',
      },
      {
        name: 'Côte de Caerffili', position: 'final climb, km 210.5', len: 2, grad: 8.1, profile: [4.6, 11.6], gain: 162,
        history: 'A regular Tour of Britain finishing climb — used in 2012, 2013 (Sam Bennett won there) and 2023, its fourth appearance in the race.',
      },
    ],
  },
  {
    num: 4, date: '2027-07-06', dateLabel: 'Tuesday 6 July 2027', start: 'Cherbourg-en-Cotentin', finish: 'Cherbourg-en-Cotentin',
    dist: 171, terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 2200, climbCount: 0,
    summary: 'A loop that starts and finishes in Cherbourg-en-Cotentin, through the Manche.',
    climbs: [],
  },
  {
    num: 5, date: '2027-07-07', dateLabel: 'Wednesday 7 July 2027', start: 'Pontorson', finish: 'Plumelec',
    dist: 178, terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 1900, climbCount: 1,
    summary: 'From the Baie du Mont-Saint-Michel through Ille-et-Vilaine into Morbihan, finishing on the Côte de Cadoudal.',
    climbs: [{
      name: 'Côte de Cadoudal', position: 'km 164, and again at the finish', len: 1.7, grad: 6.2,
    }],
  },
  {
    num: 6, date: '2027-07-08', dateLabel: 'Thursday 8 July 2027', start: 'Vannes', finish: 'Angers',
    dist: 193, terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: 1500, climbCount: 0,
    summary: 'Morbihan to Maine-et-Loire across Ille-et-Vilaine and Loire-Atlantique, with no categorised climbs.',
    climbs: [],
  },
  {
    num: 7, date: '2027-07-09', dateLabel: 'Friday 9 July 2027', start: 'Blois', finish: 'Chambord',
    dist: 38, terrain: 'ITT', mapType: 'ITT', badgeCls: 'badge-t', vgain: 200, climbCount: 0,
    summary: 'Individual time trial in Loir-et-Cher, from Blois to the Château de Chambord.',
    climbs: [],
  },
  {
    num: 8, date: '2027-07-10', dateLabel: 'Saturday 10 July 2027', start: 'Bourges', finish: 'Le Creusot',
    dist: 224.5, terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 3100, climbCount: 2,
    summary: 'Cher through the Nièvre into Saône-et-Loire, with two categorised climbs in the last 40 km.',
    climbs: [
      { name: 'Côte de la Croix de la Libération', position: 'km 189', len: 4.6, grad: 5.3 },
      { name: "Signal d'Uchon", position: 'km 206.5', len: 5.7, grad: 5.7 },
    ],
  },
  {
    num: 9, date: '2027-07-11', dateLabel: 'Sunday 11 July 2027', start: 'Villars-les-Dombes Parc des Oiseaux', finish: 'Grand Colombier',
    dist: 162, terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 3750, climbCount: 4,
    summary: 'Out of the Ain plain into the Jura, finishing on a summit finish at the Grand Colombier.',
    climbs: [
      { name: 'Col du Berthiand', position: 'km 57.5', len: 6.3, grad: 7.5 },
      { name: 'Côte des Neyrolles', position: 'km 77', len: 3.6, grad: 7.7 },
      { name: 'Col de Richemond', position: 'km 115', len: 7.7, grad: 6 },
      { name: 'Grand Colombier', position: 'summit finish', len: 17.4, grad: 7.1 },
    ],
  },
  {
    num: 10, date: '2027-07-13', dateLabel: 'Tuesday 13 July 2027', start: 'Annecy', finish: 'Sallanches',
    dist: 171, terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 3750, climbCount: 6,
    summary: 'Haute-Savoie stage that passes through Sallanches at km 107 before finishing there after a second loop over the Côte de Domancy.',
    climbs: [
      { name: 'Col du Plan du Salève', position: 'km 26', len: 9.6, grad: 5.4 },
      { name: 'Montée de Brison', position: 'km 74', len: 5, grad: 10.2 },
      { name: 'Côte de Domancy', position: 'km 111.5, first passage', len: 2.5, grad: 9.4, profile: [7.5, 11.1, 7.0], gain: 221 },
      { name: 'Montée du Bettex', position: 'km 126.5', len: 5.5, grad: 8 },
      { name: "Côte du Plateau d'Assy", position: 'km 147.5', len: 5.1, grad: 7.5 },
      { name: 'Côte de Domancy', position: 'km 162, second passage', len: 2.5, grad: 9.4, profile: [7.5, 11.1, 7.0], gain: 221 },
    ],
  },
  {
    num: 11, date: '2027-07-14', dateLabel: 'Wednesday 14 July 2027', start: 'Cluses', finish: 'Les Saisies',
    dist: 150, terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 4750, climbCount: 5,
    summary: 'Five categorised climbs from Haute-Savoie into Savoie, ending on the Montée de Bisanne and a summit finish at Les Saisies.',
    climbs: [
      {
        name: "Col de la Colombière", position: "km 16", len: 14.4, grad: 7.5,
        profile: [5.3, 7.7, 8.3, 7.1, 7.5, 2.4, 3.3, 3.4, 8.6, 11.7, 10.3, 7.7, 10.0, 10.0, 10.0], gain: 1074,
        history: "Figures are our own GPX measurement from the foot of the climb in Cluses (14.4 km). ASO's official figures are 15.9 km at 7%, measured from an earlier start point.",
      },
      {
        name: "Col de la Croix Fry", position: "km 40", len: 7.2, grad: 6.3,
        profile: [2.2, 4.9, 8.7, 6.3, 7.6, 6.6, 7.6, 6.7], gain: 451,
        history: "Figures are our own GPX measurement. ASO's official figures are 7.2 km at 5.5%. Their start point differs slightly, which is why the two don't match exactly.",
      },
      {
        name: "Col de la Forclaz de Queige", position: "km 85", len: 5.1, grad: 7.0,
        profile: [7.1, 7.4, 8.8, 8.6, 4.2, -3.8], gain: 357,
        history: "Figures are our own GPX measurement. ASO's official figures are 5.1 km at 8.2%. Their start point differs slightly, which is why the two don't match exactly.",
      },
      {
        name: "Col du Pré", position: "km 113", len: 12.6, grad: 7.9,
        profile: [7.1, 7.6, 7.4, 5.4, 2.6, 8.5, 9.6, 9.8, 9.3, 10.1, 10.3, 9.7, 3.9], gain: 996,
        history: "Figures are our own GPX measurement. ASO's official figures are 12.6 km at 7.8%, which our measurement matches closely.",
      },
      {
        name: "Montée de Bisanne", position: "km 146, before the finish at Les Saisies", len: 12.4, grad: 8.2,
        profile: [6.1, 7.1, 7.9, 7.3, 8.2, 6.1, 8.7, 9.4, 9.0, 8.5, 9.7, 9.9, 8.6], gain: 1013,
        history: "Figures are our own GPX measurement. ASO's official figures are 12.4 km at 8.3%, which our measurement matches closely.",
      },
    ],
  },
  {
    num: 12, date: '2027-07-15', dateLabel: 'Thursday 15 July 2027', start: 'Chambéry', finish: 'Valence',
    dist: 162, terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: 1600, climbCount: 0,
    summary: 'From Savoie through Isère to Valence, in the Drôme.',
    climbs: [],
  },
  {
    num: 13, date: '2027-07-16', dateLabel: 'Friday 16 July 2027', start: 'Aubenas', finish: 'Montpellier',
    dist: 164, terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: 1500, climbCount: 0,
    summary: 'From the Ardèche through the Gard to Montpellier, in the Hérault.',
    climbs: [],
  },
  {
    num: 14, date: '2027-07-17', dateLabel: 'Saturday 17 July 2027', start: 'Montpellier', finish: 'Mende',
    dist: 199, terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 4300, climbCount: 4,
    summary: 'From the Hérault up into the Lozère, finishing on a summit finish at Mende via the Montée Jalabert.',
    climbs: [
      { name: 'Col du Vent', position: 'km 40.5', len: 8.4, grad: 5.8 },
      { name: 'Col de la Lusette', position: 'km 108.5', len: 11.6, grad: 7.3 },
      { name: "Côte de l'Estrade", position: 'km 175', len: 5.7, grad: 8.3 },
      { name: 'Côte de la Croix Neuve (Montée Jalabert)', position: 'km 197.5, summit finish', len: 3, grad: 10.1, profile: [9.1, 13.0, 8.9], gain: 311 },
    ],
  },
  {
    num: 15, date: '2027-07-18', dateLabel: 'Sunday 18 July 2027', start: 'Rodez', finish: 'Albi',
    dist: 169, terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 2500, climbCount: 0,
    summary: 'From the Aveyron into the Tarn, with no categorised climbs.',
    climbs: [],
  },
  {
    num: 16, date: '2027-07-20', dateLabel: 'Tuesday 20 July 2027', start: 'Toulouse', finish: 'Toulouse',
    dist: 33, terrain: 'ITT', mapType: 'ITT', badgeCls: 'badge-t', vgain: 200, climbCount: 1,
    summary: 'Second individual time trial, a loop from and back to Toulouse in the Haute-Garonne, with one short sharp climb at km 24.',
    climbs: [
      { name: 'Côte de Pech David', position: 'km 24', len: 0.8, grad: 12.4 },
    ],
  },
  {
    num: 17, date: '2027-07-21', dateLabel: 'Wednesday 21 July 2027', start: 'Muret', finish: 'Pau',
    dist: 186, terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: 2000, climbCount: 0,
    summary: 'From the Haute-Garonne through the Hautes-Pyrénées to Pau, in the Pyrénées-Atlantiques.',
    climbs: [],
  },
  {
    num: 18, date: '2027-07-22', dateLabel: 'Thursday 22 July 2027', start: 'Pau', finish: 'Saint-Lary-Soulan (Col du Portet)',
    dist: 174, terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 5400, climbCount: 4,
    summary: 'The big Pyrenean day: Soulor, Tourmalet and Hourquette d’Ancizan before a summit finish on the Col du Portet.',
    climbs: [
      {
        name: 'Col du Soulor', position: 'km 50', len: 11.8, grad: 7.7,
        profile: [8.0, 6.5, 6.0, 8.7, 8.2, 7.1, 9.7, 9.0, 8.3, 6.6, 8.6, 5.8], gain: 913,
        history: "Figures are our own GPX measurement over ASO's 11.8 km. ASO's official gradient for the climb is 7.3%; their start point is slightly different, which is why the two don't match exactly.",
      },
      { name: 'Col du Tourmalet (2027)', position: 'km 106.5, Souvenir Jacques Goddet', len: 19, grad: 7.4, profile: [4.4, 6.8, 6.8, 8.6, 6.9, 7.8, 8.0, 8.2, 8.2, 5.9, 6.7, 7.2, 8.3, 8.1, 6.9, 8.7, 6.3, 9.6, 9.1], gain: 1408 },
      {
        name: "Hourquette d'Ancizan", position: 'km 140.5', len: 15.2, grad: 4.7,
        profile: [4.9, 1.4, 3.8, 3.5, 3.4, 6.5, 1.0, 2.8, 3.6, 8.2, 6.7, 6.7, 5.5, 5.9, 8.0, 1.3], gain: 721,
        history: "Figures are our own GPX measurement, the full climb from Sainte-Marie-de-Campan. ASO's official figures for the categorised climb are 8.2 km at 5.1%; their start point is different, which is why the two don't match.",
      },
      { name: 'Col du Portet', position: 'summit finish, Souvenir Henri Desgrange', len: 16, grad: 8.7, profile: [8.5, 10.5, 10.7, 9.4, 10.0, 6.8, 10.2, 5.1, 8.5, 8.8, 8.8, 8.8, 9.3, 6.0, 8.8, 8.2], gain: 1384 },
    ],
  },
  {
    num: 19, date: '2027-07-23', dateLabel: 'Friday 23 July 2027', start: 'Hasparren', finish: 'Laruns',
    dist: 160, terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 4300, climbCount: 4,
    summary: 'Four categorised climbs through the Pyrénées-Atlantiques, ending with the Marie Blanque before the finish in Laruns.',
    climbs: [
      { name: 'Col de Burdincurutcheta', position: 'km 44.5', len: 8.7, grad: 9.3 },
      { name: 'Col de Bagargui', position: 'km 52.5', len: 4.8, grad: 6.4 },
      { name: 'Col de Soudet', position: 'km 95.5', len: 15.1, grad: 7.2 },
      { name: 'Col de Marie Blanque', position: 'km 141.5', len: 7.7, grad: 8.6, profile: [4.9, 5.3, 4.9, 8.5, 11.0, 12.4, 11.8, 11.4], gain: 669 },
    ],
  },
  {
    num: 20, date: '2027-07-24', dateLabel: 'Saturday 24 July 2027', start: 'Maubourguet', finish: 'Libourne',
    dist: 198, terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: 1700, climbCount: 0,
    summary: 'From the Hautes-Pyrénées through the Gers and Lot-et-Garonne to Libourne, in the Gironde.',
    climbs: [],
  },
  {
    num: 21, date: '2027-07-25', dateLabel: 'Sunday 25 July 2027', start: 'Saint-Quentin-en-Yvelines', finish: 'Paris Champs-Élysées',
    dist: 116, terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: 800, climbCount: 3,
    summary: 'The traditional finale: seven passages of the Champs-Élysées finish line, with the Butte Montmartre climbed three times.',
    climbs: [
      { name: 'Côte de la Butte Montmartre', position: 'km 74, first passage', len: 1, grad: 6.5 },
      { name: 'Côte de la Butte Montmartre', position: 'km 90, second passage', len: 1, grad: 6.5 },
      { name: 'Côte de la Butte Montmartre', position: 'km 106, third passage', len: 1, grad: 6.5 },
    ],
  },
];

export interface RestDay {
  dateLabel: string;
  location?: string;
  /** Renders the divider immediately before this stage number's card. */
  beforeStage: number;
}

export const REST_DAYS: RestDay[] = [
  // Locations not yet published — dates are the gaps in the official schedule.
  { dateLabel: 'Monday 5 July 2027', beforeStage: 4 },
  { dateLabel: 'Monday 12 July 2027', beforeStage: 10 },
  { dateLabel: 'Monday 19 July 2027', beforeStage: 16 },
];

/** Headline figures from ASO's official key-information card — use to sanity-check the stage entries. */
export const OFFICIAL_TOTALS = {
  stages: 21,
  dates: 'Fri 2 – Sun 25 July 2027',
  distanceKm: 3479,
  elevationM: 53450,
  itts: { count: 2, totalKm: 71 },
  sprint: 7,
  hilly: 6,
  mountain: 6,
  summitFinishes: 3,
  ranges: ['Massif Central', 'Jura', 'Alps', 'Pyrenees'],
};
