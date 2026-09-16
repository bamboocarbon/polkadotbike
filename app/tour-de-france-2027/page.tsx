import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import Tdf27Map from '@/components/tdf2027/Tdf27Map';
import ClimbCard from '@/components/race/ClimbCard';
import type { Stage as MapStage, Climb } from '@/lib/raceHelpers';
import '@/components/content/content.css';
import '@/components/tdf2027/tdf2027.css';

const PAGE_URL = 'https://polkadotbike.com/tour-de-france-2027';
const TITLE = '2027 Tour de France — UK Grand Départ (Stages 1–3) · Polka Dot Bike';
const DESCRIPTION =
  'The 2027 Tour de France opens with a Grand Départ in Scotland: three confirmed UK stages, Edinburgh to Carlisle, Keswick to Liverpool and Welshpool to Cardiff, 2–4 July 2027. Full route into France expected October 2026.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Polka Dot Bike',
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [{ url: 'https://polkadotbike.com/og-card-tdf-red.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://polkadotbike.com/og-card-tdf-red.png'],
  },
};

export const viewport: Viewport = { themeColor: '#ef4444' };

interface StageClimb {
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

interface Stage {
  num: 1 | 2 | 3;
  date: string; // ISO, for JSON-LD
  dateLabel: string;
  start: string;
  finish: string;
  dist: number;
  terrain: 'Flat' | 'Hilly' | 'Mountainous';
  /** Same terrain, in the type key the map's route-line colours use ('Mountain', not 'Mountainous') */
  mapType: 'Flat' | 'Hilly' | 'Mountain';
  badgeCls: string;
  vgain: number;
  climbCount: number;
  summary: string;
  climbs: StageClimb[];
}

const STAGES: Stage[] = [
  {
    num: 1,
    date: '2027-07-02',
    dateLabel: 'Friday 2 July 2027',
    start: 'Edinburgh',
    finish: 'Carlisle',
    dist: 184,
    terrain: 'Flat',
    mapType: 'Flat',
    badgeCls: 'badge-s',
    vgain: 2000,
    climbCount: 1,
    summary: 'Likely bunch sprint finish.',
    climbs: [
      {
        name: 'Côte de Melrose (Dingleton)', position: 'early in the stage', len: 2.2, grad: 6.7, profile: [6.4, 6.7, 7.9], gain: 146,
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
      { name: 'Côte de Jubilee Tower', position: 'km 88, after Lancaster', len: 3.8, grad: 6.1, profile: [4.1, 10.4, 4.2, 5.7], gain: 232 },
      { name: 'Côte de Trough of Bowland', position: 'km 98.5', len: 1.9, grad: 5.2, profile: [2.9, 7.7], gain: 98 },
      {
        name: 'Côte de Waddington Fell', position: 'km 112', len: 3.4, grad: 6.4, profile: [5.4, 6.1, 7.0, 8.1], gain: 220,
        history: "The opening Category 1 climb of Stage 2, 2026 Tour of Britain Women.",
      },
      {
        name: 'Côte de Belmont', position: 'km 152.5, after Blackburn', len: 2, grad: 4, profile: [2.5, 5.5, 0.6], gain: 80,
        history: 'Part of the Tour of Britain men\'s Stage 1 route through Greater Manchester in 2023, climbing out of the village on Rivington Road.',
      },
      { name: 'Côte de Parbold', position: 'km 183', len: 1.8, grad: 5.6, profile: [3.9, 7.8], gain: 101 },
    ],
  },
  {
    num: 3,
    date: '2027-07-04',
    dateLabel: 'Sunday 4 July 2027',
    start: 'Welshpool',
    finish: 'Cardiff',
    dist: 223,
    terrain: 'Mountainous',
    mapType: 'Mountain',
    badgeCls: 'badge-m',
    vgain: 3000,
    climbCount: 8,
    summary: 'GC / puncheur stage.',
    climbs: [
      { name: "Côte d'Épynt", position: 'km 85.5', len: 3.7, grad: 7.9, profile: [5.4, 7.7, 9.8, 9.0], gain: 293 },
      { name: 'Côte de Bannau Brycheiniog', position: 'km 121.5', len: 6.6, grad: 3.5, profile: [3.1, 3.3, 3.4, 3.7, 3.8, 3.8, 3.2], gain: 231 },
      {
        name: 'Côte de Rhigos', position: 'km 145.5', len: 4.6, grad: 5.8, profile: [4.9, 6.1, 6.5, 5.4, 6.2], gain: 266,
        history: 'A Category 1 KOM on Stage 8 of the 2023 Tour of Britain, en route to a finish on the Côte de Caerffili below.',
      },
      { name: 'Côte de Penrhys', position: 'km 160.5', len: 1.3, grad: 10.1, profile: [9.8, 10.9], gain: 130 },
      { name: 'Côte de Maerdy', position: 'km 169', len: 1.5, grad: 8.7, profile: [9.1, 7.3], gain: 126 },
      { name: 'Côte de Gelligaer', position: 'km 193', len: 1.4, grad: 4.9, profile: [5.7, 2.9], gain: 68 },
      { name: 'Côte de Hengoed', position: 'km 197.5', len: 0.7, grad: 11, profile: [10.7], gain: 73 },
      {
        name: 'Côte de Caerffili', position: 'final climb, km 210.5', len: 2, grad: 8.1, profile: [4.6, 11.6], gain: 162,
        history: 'A regular Tour of Britain finishing climb — used in 2012, 2013 (Sam Bennett won there) and 2023, its fourth appearance in the race.',
      },
    ],
  },
];

// UPDATE IN OCTOBER 2026 once the full route into France is announced:
//  - add `endDate` to the main SportsEvent below (omitted for now — the
//    race's actual finish date isn't public yet)
//  - broaden `location` beyond "United Kingdom" once later stages are known
//  - append a subEvent entry per additional stage as they're confirmed
function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      '@id': `${PAGE_URL}#event`,
      name: '2027 Tour de France',
      description: DESCRIPTION,
      url: PAGE_URL,
      startDate: '2027-07-02',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: 'United Kingdom' },
      organizer: { '@type': 'Organization', name: 'Amaury Sport Organisation (ASO)' },
      subEvent: STAGES.map((s) => ({
        '@type': 'SportsEvent',
        name: `2027 Tour de France — Stage ${s.num}: ${s.start} to ${s.finish}`,
        description: `${s.dateLabel} · ${s.start} to ${s.finish}, ${s.dist}km, ${s.terrain.toLowerCase()}.`,
        startDate: s.date,
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Place',
          name: s.finish,
          address: { '@type': 'PostalAddress', addressLocality: s.finish, addressCountry: 'GB' },
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: '2027 Tour de France — UK Grand Départ', item: PAGE_URL },
      ],
    },
  ];
}

function ClimbRow({ c }: { c: StageClimb }) {
  const hasData = c.len != null && c.grad != null;
  const climbObj: Climb = {
    race: 'tdf27', stage: 0, name: c.name, range: c.position ?? '',
    len: hasData ? c.len! : null, grad: hasData ? c.grad! : null, elev: null,
    // 'TBC' rather than 'Uncat' — these climbs are real and confirmed, just not
    // yet officially categorised by ASO (expected alongside the full route reveal).
    cat: 'TBC', kbf: null, profile: c.profile, notes: c.history ?? '',
  };
  return <ClimbCard climb={climbObj} hideGpxDownload profileScale={4} />;
}

function StageCard({ s }: { s: Stage }) {
  return (
    <div className="glass sec stage-card" id={`stage-${s.num}`}>
      <div className="stage-card-head">
        <span className={`type-badge ${s.badgeCls}`}>{s.terrain}</span>
        <h2>
          Stage {s.num}: {s.start} → {s.finish}
        </h2>
      </div>
      <div className="stage-meta-row">
        <span>{s.dateLabel}</span>
        <span>{s.dist}km</span>
        <span>~{s.vgain.toLocaleString()}m elevation gain</span>
      </div>
      <p className="stage-summary">{s.summary}</p>

      <h3 className="climb-list-head">Climbs ({s.climbCount})</h3>
      <div className="climb-list">
        {s.climbs.map((c, i) => (
          <ClimbRow key={i} c={c} />
        ))}
      </div>
    </div>
  );
}

const STAGES_FOR_MAP: MapStage[] = STAGES.map((s) => ({
  num: s.num,
  date: s.date,
  start: s.start,
  finish: s.finish,
  dist: s.dist,
  type: s.mapType,
  vgain: s.vgain,
  notes: s.summary,
}));

export default function TdfUk2027Page() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hero { flex-direction: column; align-items: center; text-align: center; gap: 6px; }
        .hero > h1 { margin: 0 0 2px; text-align: center; font-size: clamp(24px, 4.6vw, 42px); }
        .hero > p { text-align: center; max-width: min(460px, 100%); }
      `,
        }}
      />

      <div className="hero">
        <h1>2027 Tour de France — UK Grand Départ</h1>
        <p>Stages 1–3: Edinburgh to Cardiff, 2–4 July 2027.</p>
      </div>

      <Tdf27Map stages={STAGES_FOR_MAP} />

      <div className="container" style={{ maxWidth: 880 }}>
        <div className="status-banner">
          <span>
            <strong>UK stages confirmed January 2026.</strong> Full route into France expected October 2026 — this page will be updated then.
          </span>
        </div>

        <div className="glass intro" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)' }}>
            The 2027 Tour de France opens with its Grand Départ in Scotland — the first time the race has started north of the border, and only the
            third UK start in the Tour&apos;s history, after London in 2007 and Yorkshire in 2014. As with those, both the men&apos;s and
            women&apos;s races begin here: three confirmed stages taking the peloton from Edinburgh down through the Lake District and North West
            England into Wales, before the race crosses into France for the rest of the route.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)', marginTop: 12 }}>
            Only the UK portion is confirmed so far — a likely sprint finish in Carlisle, a hilly stage into Liverpool suited to a breakaway, and a
            punchy finish over the Côte de Caerffili in Cardiff that could shake up the GC early. What comes after that, into France, isn&apos;t
            known yet.
          </p>
        </div>

        {STAGES.map((s) => (
          <StageCard key={s.num} s={s} />
        ))}

        <AADSUnit />

        <Footer
          attribution="Polka Dot Bike · 2027 Tour de France · UK Grand Départ stage data confirmed January 2026; full route pending official announcement."
          links={[
            { href: '/', label: '← Gear Calculator' },
            { href: '/tdf', label: 'TDF 2026' },
            { href: '/climbs', label: 'Climbs' },
            { href: '/guide', label: 'Guide' },
            { href: '/about', label: 'About' },
            { href: '/contact', label: 'Contact' },
            { href: '/privacy', label: 'Privacy' },
            { href: '/disclaimer', label: 'Disclaimer' },
          ]}
        />
      </div>
    </>
  );
}
