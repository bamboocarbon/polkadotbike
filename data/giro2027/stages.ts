// 2027 Giro d'Italia — official route data (RCS Sport route presentation, 3 Nov 2026, Rome).
// Every field comes from RCS's official stage profiles only, never from rumour. While STAGES is empty,
// app/giro-ditalia-2027/page.tsx shows the "route pending" placeholder. Same shapes as the 2027 TDF data so
// the explorer, stage cards and ClimbCard are shared. Climbs with built 3D data are linked by NAME via
// CLIMB_3D_SLUGS in components/race/ClimbCard.tsx.

import type { Stage, StageClimb, RestDay } from '@/data/tdf2027-official/stages';
export type { Stage, StageClimb, RestDay };

// Stages 1-9: RCS's route-presentation graphics (3 Nov 2026). Stages 4-21: RCS's route page
// (giroditalia.it/il-percorso), whose per-stage panels give the official altimetry, climb detail and 1-5 star
// rating. Terrain comes from the page's stage icons (flat / hilly / mountain / time trial); stages 1-3 are TBC
// because their icons weren't read. Elevation gain per stage is not published (null). Lengths, gradients and
// summit altitudes are RCS's own; where one of our built 3D climbs matches, the card shows our measurement and
// notes RCS's.

export const STAGES: Stage[] = [
  {
    num: 1, date: '2027-05-08', dateLabel: 'Saturday 8 May 2027', start: 'Trieste', finish: 'Trieste', dist: 172,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 2400,
    summary: 'An undulating opening stage of about 2,400 m of climbing, looping from Trieste into the hills behind the city and across the Slovenian border, with three short climbs in the final 40 km. Trieste last hosted the Giro’s finale in 2014. RCS rate it 3 of 5 stars.',
    climbCount: 3, climbs: [
      { name: 'Hrvatini', position: 'km 134.0 · summit 151 m' },
      { name: 'Prebeneg', position: 'km 142.6 · summit 246 m' },
      { name: 'Cattinara-Sella di Longera', position: 'km 158.7 · summit 283 m' },
    ],
  },
  {
    num: 2, date: '2027-05-09', dateLabel: 'Sunday 9 May 2027', start: 'Ljubljana', finish: 'Koper', dist: 166,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 2200,
    summary: 'A stage run entirely in Slovenia, from the capital Ljubljana to the Adriatic port of Koper: about 2,200 m of climbing in a series of ups and downs, with a chance for the more resilient sprinters. RCS rate it 3 of 5 stars.',
    climbCount: 3, climbs: [
      { name: 'Galantiči', position: 'km 106.4 · summit 317 m' },
      { name: 'Srgasi', position: 'km 130.8 · summit 214 m' },
      { name: 'Markovec', position: 'km 162.7 · summit 134 m' },
    ],
  },
  {
    num: 3, date: '2027-05-10', dateLabel: 'Monday 10 May 2027', start: 'Cervignano del Friuli', finish: 'Possagno', dist: 163,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: 1450,
    summary: 'A mostly smooth 163 km west across the Friuli and Veneto plain with about 1,450 m of climbing, enlivened late by the Santa Maria della Vittoria and Forcella Mostaccin. It finishes at Possagno, at the foot of Monte Grappa and birthplace of Antonio Canova. RCS rate it 3 of 5 stars.',
    climbCount: 2, climbs: [
      { name: 'Santa Maria della Vittoria', position: 'km 126.7 · summit 363 m' },
      { name: 'Forcella Mostaccin', position: 'km 147.9 · summit 372 m' },
    ],
  },
  {
    num: 4, date: '2027-05-11', dateLabel: 'Tuesday 11 May 2027', start: 'Argenta', finish: 'Misano Adriatico', dist: 151,
    terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: null,
    summary: 'A largely flat run through Emilia-Romagna from Argenta to Misano Adriatico, finishing at the Marco Simoncelli circuit, with one intermediate climb at Bertinoro. RCS rate it 1 of 5 stars.',
    climbCount: 1, climbs: [
      { name: 'Bertinoro', position: 'Intermediate climb (GPM)' },
    ],
  },
  {
    num: 5, date: '2027-05-12', dateLabel: 'Wednesday 12 May 2027', start: 'Filottrano', finish: 'Sarnano-Sassotetto', dist: 139,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: null,
    summary: 'RCS call it the first mountain stage: from Filottrano around Tolentino and Camerino to a finish at Sarnano-Sassotetto in the Monti Sibillini, up a 13.1 km climb at 7.4% (14% at its steepest). RCS rate it 3 of 5 stars.',
    climbCount: 4, climbs: [
      { name: 'Camerino', position: 'km 64.1 · summit 625 m' },
      { name: 'San Ginesio', position: 'km 97.3 · summit 634 m' },
      { name: 'Gualdo', position: 'km 116.1 · summit 621 m' },
      { name: 'Sassotetto (Sarnano side)', position: 'Summit finish · from Sarnano', len: 13.12, grad: 7.0, profile: [1.4, 0.6, 3.8, 5.7, 7.2, 5.7, 8.6, 11.5, 11.3, 13.1, 8.6, 5.0, 8.6], history: 'RCS’s profile: 13.1 km and 965 m of climbing at 7.4% from the foot at Sarnano, with a maximum gradient of 14%; our route measures 13.12 km at 7.0%, with the steepest ramps a little earlier than RCS’s smoother 8.1% middle section. The finish is at 1,445 m.' },
    ],
  },
  {
    num: 6, date: '2027-05-13', dateLabel: 'Thursday 13 May 2027', start: 'Alba Adriatica', finish: 'Lanciano', dist: 148,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: null,
    summary: 'South along the Adriatic coast from Alba Adriatica, then inland over the Abruzzo hills to finish in Lanciano, with two intermediate climbs. RCS rate it 3 of 5 stars.',
    climbCount: 2, climbs: [
      { name: 'Ripa Teatina', position: 'Intermediate climb (GPM)' },
      { name: 'Chieti', position: 'Intermediate climb (GPM)' },
    ],
  },
  {
    num: 7, date: '2027-05-14', dateLabel: 'Friday 14 May 2027', start: 'Sulmona', finish: 'Campo di Giove', dist: 19.6,
    terrain: 'ITT', mapType: 'ITT', badgeCls: 'badge-t', vgain: null,
    summary: 'A 19.6 km individual time trial (the TUDOR ITT) from Sulmona to Campo di Giove, with timing points at Cansano and the Campo di Giove junction; the second half climbs at about 5%. RCS rate it 4 of 5 stars.',
    climbCount: 1, climbs: [
      { name: 'Campo di Giove', position: 'Finish (GPM)' },
    ],
  },
  {
    num: 8, date: '2027-05-15', dateLabel: 'Saturday 15 May 2027', start: 'Trasacco', finish: 'Napoli', dist: 219,
    terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: null,
    summary: 'One of the longest stages of the Giro: 219 km from Abruzzo to Campania, Trasacco to Naples, with the Monte di Procida (Panoramica) climb to come. RCS rate it 2 of 5 stars.',
    climbCount: 1, climbs: [
      { name: 'Monte di Procida (Panoramica)', position: 'Intermediate climb (GPM)' },
    ],
  },
  {
    num: 9, date: '2027-05-16', dateLabel: 'Sunday 16 May 2027', start: 'Itri', finish: 'Subiaco-Monte Livata', dist: 180,
    terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: null,
    summary: 'From Itri on the Tyrrhenian coast through Lazio to a summit finish at Subiaco-Monte Livata: Bellegra and Colle Ferro on the way, then 13.9 km at 6.9% (17% at its steepest) from Subiaco. RCS rate it 4 of 5 stars.',
    climbCount: 3, climbs: [
      { name: 'Bellegra', position: 'km 128.0 · summit 760 m' },
      { name: 'Colle Ferro', position: 'km 151.5 · summit 665 m' },
      { name: 'Monte Livata (Subiaco side)', position: 'Summit finish · from Subiaco', len: 13.94, grad: 6.8, profile: [7.4, 10.4, 10.3, 11.1, 7.6, 7.3, 6.1, 5.7, 5.4, 6.0, 6.0, 5.8, 4.6, 1.2], history: 'RCS’s profile: 13.9 km and 960 m of climbing at 6.9% from Subiaco (408 m), with a maximum gradient of 17%; our route measures 13.94 km at 6.8%. The finish is at 1,352 m.' },
    ],
  },
  {
    num: 10, date: '2027-05-18', dateLabel: 'Tuesday 18 May 2027', start: 'Palombara Sabina', finish: 'Norcia', dist: 218,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: null,
    summary: 'A long 218 km Apennine stage from Palombara Sabina to Norcia, crossing the Forca di Presta and the Forca Ventolosa in the closing 35 km. RCS rate it 3 of 5 stars.',
    climbCount: 2, climbs: [
      { name: 'Forca di Presta (Arquata side)', position: 'km 184.7 · summit 1,536 m', len: 12.85, grad: 6.9, profile: [3.8, 7.2, 7.2, 7.6, 7.5, 6.6, 5.2, 5.7, 6.8, 6.5, 7.6, 10.0, 8.5], history: 'Measured from Piedilama (about 645 m) to the 1,536 m pass: 12.9 km at 6.9%. RCS publish no climb figures for it.' },
      { name: 'Forca Ventolosa', position: 'km 198.1 · summit 1,521 m' },
    ],
  },
  {
    num: 11, date: '2027-05-19', dateLabel: 'Wednesday 19 May 2027', start: 'Gualdo Tadino', finish: 'Scarperia', dist: 220,
    terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: null,
    summary: 'The longest stage on the route: 220 km through the Umbrian-Tuscan Apennines from Gualdo Tadino to Scarperia, with ups and downs in the middle, finishing at the Mugello circuit. RCS rate it 2 of 5 stars.',
    climbCount: 0, climbs: [],
  },
  {
    num: 12, date: '2027-05-20', dateLabel: 'Thursday 20 May 2027', start: 'Montecatini Terme', finish: 'Zeri', dist: 173,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: null,
    summary: 'From Montecatini Terme over the Foce Carpinelli to a summit finish at Passo dei Due Santi, Zeri: the closing climb from San Lorenzo is 8.4 km at 8.7% (14% at its steepest). RCS rate it 3 of 5 stars.',
    climbCount: 2, climbs: [
      { name: 'Foce Carpinelli', position: 'km 94.3 · summit 839 m' },
      { name: 'Passo dei Due Santi (San Lorenzo side)', position: 'Summit finish · from San Lorenzo', len: 8.17, grad: 8.8, profile: [8.8, 6.5, 7.8, 7.6, 8.5, 8.9, 12.5, 9.8], history: 'RCS’s profile: 8.4 km and 727 m of climbing at 8.7% from San Lorenzo (665 m), with a maximum gradient of 14%; our route measures 8.17 km at 8.8%. The finish is at 1,392 m.' },
    ],
  },
  {
    num: 13, date: '2027-05-21', dateLabel: 'Friday 21 May 2027', start: 'Borgo Val di Taro', finish: 'Reggio Emilia', dist: 176,
    terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: null,
    summary: '176 km from Borgo Val di Taro in the Parma Apennines, descending gradually to the plain at Reggio Emilia. RCS rate it 1 of 5 stars.',
    climbCount: 0, climbs: [],
  },
  {
    num: 14, date: '2027-05-22', dateLabel: 'Saturday 22 May 2027', start: 'Cantù', finish: 'Piani di Bobbio', dist: 187,
    terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: null,
    summary: 'From Cantù past the Madonna del Ghisallo, Culmine di San Pietro, Mirago and Alino to a summit finish at Piani di Bobbio (Valtorta): the final climb is 10.1 km at 9.0% (18% at its steepest). RCS rate it 4 of 5 stars.',
    climbCount: 5, climbs: [
      { name: 'Madonna del Ghisallo', position: 'km 25.7 · summit 754 m' },
      { name: 'Culmine di San Pietro', position: 'km 80.4 · summit 1,254 m' },
      { name: 'Mirago', position: 'km 129.0 · summit 945 m' },
      { name: 'Alino', position: 'km 150.0 · summit 687 m' },
      { name: 'Piani di Bobbio (Valtorta side)', position: 'Summit finish · Valtorta side', len: 10.09, grad: 9.4, profile: [5.5, 6.3, 6.3, 9.5, 9.9, 10.1, 9.3, 8.8, 14.6, 13.6], history: 'RCS’s profile: 10.1 km and 906 m of climbing at 9.0% from 776 m, with a maximum gradient of 18%; our route measures 10.09 km and 946 m at 9.4%, starting 46 m lower. The finish is at 1,682 m, reached via Valtorta (933 m).' },
    ],
  },
  {
    num: 15, date: '2027-05-23', dateLabel: 'Sunday 23 May 2027', start: 'Monza', finish: 'Milano', dist: 37.3,
    terrain: 'ITT', mapType: 'ITT', badgeCls: 'badge-t', vgain: null,
    summary: 'A 37.3 km individual time trial from the Monza circuit into Milan. RCS rate it 3 of 5 stars.',
    climbCount: 0, climbs: [],
  },
  {
    num: 16, date: '2027-05-25', dateLabel: 'Tuesday 25 May 2027', start: 'Sondrio', finish: 'Aprica', dist: 192,
    terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: 5700,
    summary: 'The race’s five-star mountain day: the Mortirolo from Mazzo di Valtellina, the Gavia from Ponte di Legno (the Cima Coppi, 2,618 m) and the Mortirolo from Mazzo again, then the run up to Aprica. RCS give it about 5,700 m of climbing and call it, on paper, the hardest stage of the whole Giro. RCS rate it 5 of 5 stars.',
    climbCount: 3, climbs: [
      { name: 'Mortirolo (Mazzo side)', position: 'km 45.2 · first ascent', len: 12.4, grad: 10.6, profile: [3.6, 9.5, 11.8, 11.7, 14.6, 13.5, 11.6, 13.1, 11.0, 9.1, 9.6, 8.4], history: 'Starts at Mazzo di Valtellina (552 m) and tops out at 1,854 m, matching RCS’s profile (12.4 km, about 10.5%). The race climbs it again from the same side at km 158.7.' },
      { name: 'Gavia (Ponte di Legno side)', position: 'km 91.5 · Cima Coppi', len: 16.5, grad: 8.0, profile: [4.9, 5.4, 6.1, 9.6, 5.6, 9.3, 11.3, 9.1, 8.5, 7.2, 8.6, 7.3, 8.7, 10.0, 9.3, 7.8], history: 'The Cima Coppi, 2,618 m. RCS’s profile measures from Ponte di Legno (1,240 m, km 72.2), 19.3 km to the summit; our figures are measured from the start of the sustained climb.' },
      { name: 'Mortirolo (Mazzo side)', position: 'km 158.7 · second ascent', len: 12.4, grad: 10.6, profile: [3.6, 9.5, 11.8, 11.7, 14.6, 13.5, 11.6, 13.1, 11.0, 9.1, 9.6, 8.4], history: 'The same climb from Mazzo di Valtellina, now with 158 km in the legs, before the descent through Monno and Edolo to the finish in Aprica.' },
    ],
  },
  {
    num: 17, date: '2027-05-26', dateLabel: 'Wednesday 26 May 2027', start: 'Chiari', finish: 'Vo’', dist: 194,
    terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: null,
    summary: '194 km from Lombardy to the Veneto, from Chiari to Vo’: flat at first, with a livelier finish. RCS rate it 2 of 5 stars.',
    climbCount: 0, climbs: [],
  },
  {
    num: 18, date: '2027-05-27', dateLabel: 'Thursday 27 May 2027', start: 'Rovereto', finish: 'Madonna di Campiglio', dist: 154,
    terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: null,
    summary: 'A 154 km mountain day, run entirely in Trentino, from Rovereto to Madonna di Campiglio: the Passo Ballino, Passo Durone, Passo Daone and the Durone again, then a 12.5 km finishing climb at 5.7% from Pinzolo. RCS rate it 4 of 5 stars.',
    climbCount: 5, climbs: [
      { name: 'Passo Ballino (Riva del Garda side)', position: 'km 34.6 · summit 763 m', len: 13.48, grad: 4.9, profile: [3.9, 5.2, 9.5, 7.6, 5.0, 7.3, 5.0, 6.9, 2.1, 2.6, 3.8, 5.1, 1.5], history: 'From the Riva del Garda side (100 m) to the 763 m pass: 13.5 km at 4.9%. RCS’s markers put Tenno (427 m) 8.8 km from the summit, against 8.3 km on our route, and Riva del Garda 16.3 km out, so RCS’s stage may start the climb slightly lower down.' },
      { name: 'Passo Durone (Ponte Arche side)', position: 'km 58.7 · summit 1,020 m · first ascent', len: 10.42, grad: 5.9, profile: [6.9, 3.5, 6.6, 6.2, 3.5, 4.8, 6.7, 8.0, 6.7, 5.9], history: 'From Ponte Arche (406 m) to the 1,020 m pass: 10.4 km at 5.9%, against about 10.6 km on RCS’s profile markers. The race climbs it twice from this side (km 58.7 and km 115.8).' },
      { name: 'Passo Daone (Spiazzo side)', position: 'km 83.3 · summit 1,292 m', len: 7.11, grad: 9.1, profile: [1.4, 10.3, 12.1, 11.6, 11.4, 10.7, 6.5], history: 'Measured from Spiazzo (about 644 m) to the 1,292 m pass, 7.1 km at 9.1% — in line with RCS’s profile markers (Spiazzo 652 m at 7.1 km from the summit). RCS publish no climb figures for it.' },
      { name: 'Passo Durone (Ponte Arche side)', position: 'km 115.8 · summit 1,020 m · second ascent', len: 10.42, grad: 5.9, profile: [6.9, 3.5, 6.6, 6.2, 3.5, 4.8, 6.7, 8.0, 6.7, 5.9], history: 'From Ponte Arche (406 m) to the 1,020 m pass: 10.4 km at 5.9%, against about 10.6 km on RCS’s profile markers. The race climbs it twice from this side (km 58.7 and km 115.8).' },
      { name: 'Madonna di Campiglio (Pinzolo side)', position: 'Summit finish · from Pinzolo-Carisolo', len: 12.35, grad: 5.6, profile: [0.9, 4.4, 7.7, 9.3, 8.6, 7.0, 7.4, 6.8, 6.0, 6.3, 2.9, 1.1], history: 'RCS’s profile: 12.5 km and 709 m of climbing at 5.7% from Pinzolo-Carisolo (805 m), with a maximum gradient of 9%; our route measures 12.35 km at 5.6%. The finish is at 1,514 m.' },
    ],
  },
  {
    num: 19, date: '2027-05-28', dateLabel: 'Friday 28 May 2027', start: 'Rovereto', finish: 'Sacile', dist: 199,
    terrain: 'Hilly', mapType: 'Hilly', badgeCls: 'badge-h', vgain: null,
    summary: '199 km from Rovereto to Sacile, with climbs at Vigolo Vattaro and Bieno early on and Montaner late. RCS rate it 2 of 5 stars.',
    climbCount: 3, climbs: [
      { name: 'Vigolo Vattaro', position: 'km 19.6 · summit 718 m' },
      { name: 'Bieno', position: 'km 57.9 · summit 887 m' },
      { name: 'Montaner', position: 'km 173.1 · summit 310 m' },
    ],
  },
  {
    num: 20, date: '2027-05-29', dateLabel: 'Saturday 29 May 2027', start: 'Pordenone', finish: 'Monte Zoncolan', dist: 180,
    terrain: 'Mountainous', mapType: 'Mountain', badgeCls: 'badge-m', vgain: null,
    summary: 'The five-star finale in the mountains: the Passo Duron and Sella Valcalda, then the Monte Zoncolan from Ovaro, which RCS measure at 10.1 km and 11.9% with pitches of 22%. RCS rate it 5 of 5 stars.',
    climbCount: 3, climbs: [
      { name: 'Passo Duron', position: 'km 141.4 · summit 1,069 m' },
      { name: 'Sella Valcalda', position: 'km 159.9 · summit 958 m' },
      { name: 'Zoncolan (Ovaro side)', position: 'Summit finish', len: 9.91, grad: 12.2, profile: [8.8, 6.4, 13.6, 16.7, 15.8, 14.7, 15.3, 13.6, 7.5, 9.2], history: 'RCS’s profile gives 10.1 km and 1,200 m of climbing at 11.9% from Ovaro (530 m) to the 1,730 m finish, with maximum gradients of 20% and 22%; our measurement of the same road is 9.91 km at 12.2%.' },
    ],
  },
  {
    num: 21, date: '2027-05-30', dateLabel: 'Sunday 30 May 2027', start: 'Roma', finish: 'Roma', dist: 131,
    terrain: 'Flat', mapType: 'Flat', badgeCls: 'badge-s', vgain: null,
    summary: 'A flat 131 km finale starting and finishing in Rome, with a city circuit of about 9 km to be ridden eight times. RCS rate it 1 of 5 stars.',
    climbCount: 0, climbs: [],
  },
];

export const REST_DAYS: RestDay[] = [
  // No stage on these Mondays; locations not published.
  { dateLabel: 'Monday 17 May 2027', beforeStage: 10 },
  { dateLabel: 'Monday 24 May 2027', beforeStage: 16 },
];

/** Headline figures from RCS's official key-information card — sanity-check the stage entries against these. */
export const OFFICIAL_TOTALS = {
  stages: 21,
  dates: 'Sat 8 – Sun 30 May 2027',
  distanceKm: 3418.9,
  elevationM: 50250,
  itts: { count: 2, totalKm: 56.9 },
};
