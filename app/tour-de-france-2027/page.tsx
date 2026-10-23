import type { Metadata, Viewport } from 'next';
import { Fragment } from 'react';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import Tdf27Explorer from '@/components/tdf2027/Tdf27Explorer';
import ClimbCard from '@/components/race/ClimbCard';
import type { Stage as MapStage, Climb } from '@/lib/raceHelpers';
import { STAGES, REST_DAYS, OFFICIAL_TOTALS, type Stage, type StageClimb, type RestDay } from '@/data/tdf2027-official/stages';
import '@/components/content/content.css';
import '@/components/race/race.css';
import '@/components/tdf2027/tdf2027.css';

const PAGE_URL = 'https://polkadotbike.com/tour-de-france-2027';
const TITLE = '2027 Tour de France Route — All 21 Stages & Climbs · Polka Dot Bike';
const DESCRIPTION =
  'The official 2027 Tour de France route: Grand Départ in Edinburgh on 2 July, 21 stages and 3,479 km through the Alps, Jura, Massif Central and Pyrenees to Paris on 25 July. Stage-by-stage map, profiles and climbs.';

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

// Reference cities for the initial map view — chosen so none overlaps a stage dot, route line
// or label (checked at several zoom scales); hidden again once the map is zoomed in.
const PLACE_LABELS = [
  { lat: 48.39, lng: -4.49, name: 'Brest', side: 'left' as const },
  { lat: 50.63, lng: 3.06, name: 'Lille' },
  { lat: 49.26, lng: 4.03, name: 'Reims' },
  { lat: 43.7, lng: 7.26, name: 'Nice' },
];

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
      endDate: '2027-07-25',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: [
        { '@type': 'Place', name: 'United Kingdom' },
        { '@type': 'Place', name: 'France' },
      ],
      organizer: { '@type': 'Organization', name: 'Amaury Sport Organisation (ASO)' },
      image: 'https://polkadotbike.com/og-card-tdf-red.png',
      subEvent: STAGES.map((s) => ({
        '@type': 'SportsEvent',
        name: `2027 Tour de France — Stage ${s.num}: ${s.start} to ${s.finish}`,
        description: `${s.dateLabel} · ${s.start} to ${s.finish}, ${s.dist}km, ${s.terrain.toLowerCase()}.`,
        startDate: s.date,
        endDate: s.date,
        eventStatus: 'https://schema.org/EventScheduled',
        organizer: { '@type': 'Organization', name: 'Amaury Sport Organisation (ASO)' },
        image: 'https://polkadotbike.com/og-card-tdf-red.png',
        location: {
          '@type': 'Place',
          name: s.finish,
          address: { '@type': 'PostalAddress', addressLocality: s.finish, addressCountry: s.num <= 3 ? 'GB' : 'FR' },
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: '2027 Tour de France', item: PAGE_URL },
      ],
    },
  ];
}

function ClimbRow({ c, scaleUp }: { c: StageClimb; scaleUp: boolean }) {
  const hasData = c.len != null && c.grad != null;
  const climbObj: Climb = {
    race: 'tdf27', stage: 0, name: c.name, range: c.position ?? '',
    len: hasData ? c.len! : null, grad: hasData ? c.grad! : null, elev: null,
    // 'TBC' rather than 'Uncat' — the climbs are real and on the official route; categories aren't entered yet.
    cat: 'TBC', kbf: null, profile: c.profile, notes: c.history ?? '',
  };
  // The 3 UK stages are short, sharp climbs that need the enlarged profile to read properly;
  // the continental climbs use the site's standard ClimbCard scale.
  return scaleUp
    ? <ClimbCard climb={climbObj} hideGpxDownload profileWidthScale={2} profileHeightScale={2} />
    : <ClimbCard climb={climbObj} hideGpxDownload />;
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
        <span>{s.dist != null ? `${s.dist}km` : 'Distance TBC'}</span>
        <span>{s.vgain != null ? `~${s.vgain.toLocaleString()}m elevation gain` : 'Elevation TBC'}</span>
      </div>
      <p className="stage-summary">{s.summary}</p>

      {s.climbCount > 0 && (
        <>
          <h3 className="climb-list-head">Climbs ({s.climbCount})</h3>
          <div className="climb-list">
            {s.climbs.map((c, i) => (
              <ClimbRow key={i} c={c} scaleUp={s.num <= 3} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RestDayCard({ r }: { r: RestDay }) {
  return (
    <div className="glass sec stage-card" style={{ textAlign: 'center', padding: '14px 20px', opacity: 0.85 }}>
      <strong>Rest day</strong> — {r.dateLabel}{r.location ? ` — ${r.location}` : ''}
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

// Climb categories aren't entered yet, so no "HC passes" stat — summit finishes (4 named in the
// intro copy: Grand Colombier, Les Saisies, Mende, Col du Portet) and total distance stand in.
const HERO_STATS = [
  { val: OFFICIAL_TOTALS.stages, label: 'Stages' },
  { val: OFFICIAL_TOTALS.mountain, label: 'Mountain stages' },
  { val: 4, label: 'Summit finishes' },
  { val: `${OFFICIAL_TOTALS.distanceKm.toLocaleString('en-GB')} km`, label: 'Total distance' },
  { val: '2 Jul', label: 'Race start' },
  { val: '25 Jul', label: 'Paris' },
];

export default function Tdf2027Page() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hero { flex-direction: column; align-items: center; text-align: center; gap: 6px; }
        .hero > h1 { margin: 0 0 2px; text-align: center; font-size: clamp(26px, 5vw, 46px); }
        .hero > p { text-align: center; max-width: min(340px, 100%); }
        .hero-stats { width: 100%; }
      `,
        }}
      />

      <div className="hero">
        <h1>Tour de France 2027 Climbs</h1>
        <p>Pick a climb — see the gradient, length, and category, then send it straight to the Climb Planner with your setup.</p>
        <div className="hero-stats">
          {HERO_STATS.map((h) => (
            <div className="hs-item" key={h.label}>
              <div className="hs-val">{h.val}</div>
              <div className="hs-lbl">{h.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tdf27Explorer stages={STAGES_FOR_MAP} placeLabels={PLACE_LABELS}>
        <div className="glass intro" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)' }}>
            The 2027 Tour de France opens with its Grand Départ in Scotland — the first time the race has started north of the border, and only the
            third UK start in its history. Three stages take the peloton from Edinburgh through the Lake District and North West England into
            Wales, before the race crosses to Cherbourg-en-Cotentin and heads south through the Loire, the Alps, the Massif Central and the
            Pyrenees, finishing on the Champs-Élysées on Sunday 25 July.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)', marginTop: 12 }}>
            There are {OFFICIAL_TOTALS.itts.count} individual time trials ({OFFICIAL_TOTALS.itts.totalKm}km in all), {OFFICIAL_TOTALS.sprint} flat stages,{' '}
            {OFFICIAL_TOTALS.hilly} hilly stages and {OFFICIAL_TOTALS.mountain} mountain stages, with summit finishes at the Grand Colombier, Les Saisies,
            Mende and the Col du Portet. Climb lengths and gradients below are from ASO&apos;s official stage profiles; official climb categories
            haven&apos;t been entered yet.
          </p>
        </div>

        {STAGES.map((s) => (
          <Fragment key={s.num}>
            {REST_DAYS.filter((r) => r.beforeStage === s.num).map((r) => (
              <RestDayCard key={r.beforeStage} r={r} />
            ))}
            <StageCard s={s} />
          </Fragment>
        ))}
      </Tdf27Explorer>

      <div className="container" style={{ maxWidth: 1100 }}>
        <AADSUnit />

        <Footer
          attribution="Polka Dot Bike · 2027 Tour de France · Stage data from the official ASO route presentation (22 October 2026); gradients are average values."
          links={[
            { href: '/', label: '← Gear Calculator' },
            { href: '/tdf', label: 'TDF 2026' },
            { href: '/giro-ditalia-2027', label: 'Giro 2027' },
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
