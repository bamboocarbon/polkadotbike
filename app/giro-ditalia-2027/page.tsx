import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import Tdf27Explorer from '@/components/tdf2027/Tdf27Explorer';
import ClimbCard from '@/components/race/ClimbCard';
import type { Stage as MapStage, Climb } from '@/lib/raceHelpers';
import { STAGES, REST_DAYS, OFFICIAL_TOTALS, type Stage, type StageClimb, type RestDay } from '@/data/giro2027/stages';
import giro27Map from '@/data/giro27-map.json';
import '@/components/content/content.css';
import '@/components/race/race.css';
import '@/components/tdf2027/tdf2027.css';

// PLACEHOLDER (created 2026-10-03, ahead of the official route reveal on 3 Nov 2026).
// Deliberately indexable from day one so the URL has crawl history by announcement day.
// Only facts Robin has confirmed are stated here (race dates, reveal date) — no host
// country, start town or stage data until the route is official. Build the stages into
// THIS URL when the route drops; do not move it.

const PAGE_URL = 'https://polkadotbike.com/giro-ditalia-2027';
const TITLE = '2027 Giro d’Italia Route — Stages, Climbs & 3D Maps · Polka Dot Bike';
const DESCRIPTION =
  'The official 2027 Giro d’Italia route: Grande Partenza in Trieste on 8 May, 21 stages and 3,418.9 km through Slovenia, the Apennines, the Mortirolo, Gavia and Zoncolan to Rome on 30 May. Stage-by-stage map, climbs and 3D climb maps.';

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
    images: [{ url: 'https://polkadotbike.com/og-card.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://polkadotbike.com/og-card.png'],
  },
};

export const viewport: Viewport = { themeColor: '#e0408f' };

// Breadcrumbs only, on purpose. A SportsEvent block needs a `location` for Google's Event
// validation, and the route (so the start/host location) isn't known until 3 Nov 2026 —
// no guessing. Add the SportsEvent (startDate 2027-05-08, endDate 2027-05-30, organiser
// RCS Sport, real location, subEvent stages) once the route is official.
function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: '2027 Giro d’Italia', item: PAGE_URL },
      ],
    },
  ];
}

function PendingGiro2027() {
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
        <h1>2027 Giro d’Italia Route</h1>
        <p>
          Saturday 8 – Sunday 30 May 2027.
          <br />
          Route announcement: 3 November 2026.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 880 }}>
        <div className="status-banner">
          <span>
            <strong>Route not yet announced.</strong> The official 2027 Giro d’Italia route is revealed on 3 November 2026 — this page will be
            filled in with the full stage-by-stage route as soon as it is.
          </span>
        </div>

        <div className="glass intro" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)' }}>
            The 2027 Giro d’Italia runs from Saturday 8 May to Sunday 30 May 2027, three weeks of racing. What isn’t known yet is the route itself:
            the start, the stages and the mountains are all still to be revealed, and Polka Dot Bike won’t guess at them. Only what is confirmed
            appears on this page.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)', marginTop: 12 }}>
            Once the route is official, this is the page that will carry it. The same URL will be updated, so you can bookmark it now.
          </p>
        </div>

        <div className="glass sec" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <h2 style={{ marginBottom: 10 }}>What this page will cover</h2>
          <ul style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', paddingLeft: 20 }}>
            <li>Every stage: date, start and finish, distance, terrain type and elevation gain.</li>
            <li>The categorised climbs, with length, average gradient and per-kilometre gradient profiles.</li>
            <li>3D climb maps of the major ascents, built from the published route, the same way as the Giro 2026 and Tour de France climbs.</li>
            <li>A personalised climb report: how long each ascent would take you at your own power-to-weight.</li>
          </ul>
        </div>

        <div className="glass sec" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <h2 style={{ marginBottom: 10 }}>While you wait</h2>
          <ul style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', paddingLeft: 20 }}>
            <li>
              <Link href="/giro26">The 2026 Giro d’Italia route and climbs</Link> — every stage and categorised climb from this year’s race.
            </li>
            <li>
              <Link href="/tour-de-france-2027">The 2027 Tour de France UK Grand Départ</Link> — the three confirmed British stages, with 3D climb maps.
            </li>
            <li>
              <Link href="/climbs">All climbs in 3D</Link> — explore any climb already on the site.
            </li>
          </ul>
        </div>

        <AADSUnit />

        <Footer
          attribution="Polka Dot Bike · 2027 Giro d’Italia · dates confirmed; full route pending official announcement on 3 November 2026."
          links={[
            { href: '/', label: '← Gear Calculator' },
            { href: '/giro26', label: 'Giro 2026' },
            { href: '/tour-de-france-2027', label: 'TDF 2027' },
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

// ── Full route page — used as soon as data/giro2027/stages.ts has stages ────────────────────────

const COUNTRY_FILL: Record<string, string> = {
  '380': '#ff8fc4', // Italy — maglia rosa pink
  '674': '#ff8fc4', // San Marino — blend into Italy
  '705': '#ffd3e6', // Slovenia — pale pink (rumoured stage 1; harmless if unused)
  '756': '#ffd3e6', // Switzerland
};
// Reference cities for the initial map view — shown only until the map is zoomed in (stage-town labels take
// over then), chosen to sit clear of the stage dots and route lines.
const PLACE_LABELS = [
  { lat: 45.07, lng: 7.69, name: 'Torino', side: 'left' as const },
  { lat: 44.41, lng: 8.93, name: 'Genova', side: 'left' as const },
  { lat: 41.12, lng: 16.87, name: 'Bari' },
];
const COUNTRY_LABELS = [{ lat: 43.4, lng: 12.0, name: 'ITALY', color: 'rgba(165,45,95,0.5)' }];

function ClimbRow({ c }: { c: StageClimb }) {
  const hasData = c.len != null && c.grad != null;
  const climbObj: Climb = {
    race: 'giro27', stage: 0, name: c.name, range: c.position ?? '',
    len: hasData ? c.len! : null, grad: hasData ? c.grad! : null, elev: null,
    cat: 'TBC', kbf: null, profile: c.profile, notes: c.history ?? '',
  };
  return <ClimbCard climb={climbObj} hideGpxDownload />;
}

function StageCard({ s }: { s: Stage }) {
  return (
    <div className="glass sec stage-card" id={`stage-${s.num}`}>
      <div className="stage-card-head">
        <span className={`type-badge ${s.badgeCls}`}>{s.terrain}</span>
        <h2>Stage {s.num}: {s.start} → {s.finish}</h2>
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
          <div className="climb-list">{s.climbs.map((c, i) => <ClimbRow key={i} c={c} />)}</div>
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

function FullGiro2027() {
  const stagesForMap: MapStage[] = STAGES.map((s) => ({
    num: s.num, date: s.date, start: s.start, finish: s.finish, dist: s.dist, type: s.mapType, vgain: s.vgain, notes: s.summary,
  }));
  // Until all 21 stages are published, totals would be wrong — show only what is confirmed.
  const complete = STAGES.length >= 21;
  const heroStats = complete ? [
    { val: STAGES.length, label: 'Stages' },
    { val: STAGES.filter((s) => s.terrain === 'ITT').length, label: 'Time trials' },
    { val: `${OFFICIAL_TOTALS.distanceKm.toLocaleString('en-GB')} km`, label: 'Total distance' },
    { val: `${OFFICIAL_TOTALS.elevationM.toLocaleString('en-GB')} m`, label: 'Climbing' },
    { val: '8 May', label: 'Race start' },
    { val: '30 May', label: 'Finish' },
  ] : [
    { val: `${STAGES.length} of 21`, label: 'Stages announced' },
    { val: STAGES[0].start, label: 'Grande Partenza' },
    { val: '8 May', label: 'Race start' },
    { val: '30 May', label: 'Finish' },
  ];
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      '@id': `${PAGE_URL}#event`,
      name: '2027 Giro d’Italia',
      description: DESCRIPTION,
      url: PAGE_URL,
      startDate: '2027-05-08',
      endDate: '2027-05-30',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: STAGES[0].start },
      organizer: { '@type': 'Organization', name: 'RCS Sport' },
      image: 'https://polkadotbike.com/og-card.png',
      subEvent: STAGES.map((s) => ({
        '@type': 'SportsEvent',
        name: `2027 Giro d’Italia — Stage ${s.num}: ${s.start} to ${s.finish}`,
        description: `${s.dateLabel} · ${s.start} to ${s.finish}, ${s.dist}km, ${s.terrain.toLowerCase()}.`,
        startDate: s.date,
        endDate: s.date,
        eventStatus: 'https://schema.org/EventScheduled',
        organizer: { '@type': 'Organization', name: 'RCS Sport' },
        image: 'https://polkadotbike.com/og-card.png',
        location: { '@type': 'Place', name: s.finish, address: { '@type': 'PostalAddress', addressLocality: s.finish } },
      })),
    },
    ...buildJsonLd(),
  ];
  return (
    <>
      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        .hero { flex-direction: column; align-items: center; text-align: center; gap: 6px; }
        .hero > h1 { margin: 0 0 2px; text-align: center; font-size: clamp(26px, 5vw, 46px); }
        .hero > p { text-align: center; max-width: min(340px, 100%); }
        .hero-stats { width: 100%; }
      ` }} />
      <div className="hero">
        <h1>Giro d’Italia 2027 Climbs</h1>
        <p>Pick a climb — see the gradient, length, and category, then send it straight to the Climb Planner with your setup.</p>
        <div className="hero-stats">
          {heroStats.map((h) => (
            <div className="hs-item" key={h.label}>
              <div className="hs-val">{h.val}</div>
              <div className="hs-lbl">{h.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tdf27Explorer stages={stagesForMap} mapData={giro27Map} mapId="giro27-map" countryFill={COUNTRY_FILL}
        countryLabels={COUNTRY_LABELS} placeLabels={PLACE_LABELS} sidebarLabel="Giro 2027 Route">
        <div className="glass intro" style={{ padding: '22px 24px', marginBottom: 18 }}>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)' }}>
            The 2027 Giro d’Italia starts in Trieste on Saturday 8 May, crosses into Slovenia for a stage from Ljubljana to Koper, then works south
            through the Marche, Abruzzo and Campania to Naples before climbing back up the peninsula. It finishes in Rome on Sunday 30 May after{' '}
            {OFFICIAL_TOTALS.stages} stages and {OFFICIAL_TOTALS.distanceKm.toLocaleString('en-GB')} km, with about{' '}
            {OFFICIAL_TOTALS.elevationM.toLocaleString('en-GB')} m of climbing in all.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.62, color: 'var(--text)', marginTop: 12 }}>
            There are two individual time trials: 19.6 km from Sulmona to Campo di Giove on stage 7 and 37.3 km from Monza to Milan on stage 15.
            Stage 16 takes in the Mortirolo, the Gavia and the Mortirolo again, and the Monte Zoncolan (10.1 km at 11.9%) closes the mountains on stage 20.
            Stage distances and climb names below are from RCS Sport; lengths, gradients and categories are added only where RCS have published them.
          </p>
        </div>

        {STAGES.map((s) => (
          <Fragment key={s.num}>
            {REST_DAYS.filter((r) => r.beforeStage === s.num).map((r) => <RestDayCard key={r.beforeStage} r={r} />)}
            <StageCard s={s} />
          </Fragment>
        ))}
      </Tdf27Explorer>

      <div className="container" style={{ maxWidth: 1100 }}>
        <AADSUnit />
        <Footer
          attribution="Polka Dot Bike · 2027 Giro d’Italia · Stage data from the official RCS Sport route presentation (3 November 2026); gradients are average values."
          links={[
            { href: '/', label: '← Gear Calculator' },
            { href: '/giro26', label: 'Giro 2026' },
            { href: '/tour-de-france-2027', label: 'TDF 2027' },
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

export default function Giro2027Page() {
  return STAGES.length > 0 ? <FullGiro2027 /> : <PendingGiro2027 />;
}
