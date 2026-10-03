import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';
import '@/components/tdf2027/tdf2027.css';

// PLACEHOLDER (created 2026-10-03, ahead of the official route reveal on 12 Oct 2026).
// Deliberately indexable from day one so the URL has crawl history by announcement day.
// Only facts Robin has confirmed are stated here (race dates, reveal date) — no host
// country, start town or stage data until the route is official. Build the stages into
// THIS URL when the route drops; do not move it.

const PAGE_URL = 'https://polkadotbike.com/giro-ditalia-2027';
const TITLE = '2027 Giro d’Italia Route — Stages, Climbs & 3D Maps · Polka Dot Bike';
const DESCRIPTION =
  'The 2027 Giro d’Italia runs 8–30 May 2027, with the official route revealed on 12 October 2026. Stage profiles, categorised climbs and 3D climb maps will be added here as soon as it is announced.';

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

// Minimal structured data on purpose: the event with its confirmed dates only, plus
// breadcrumbs. No location, stages or offers until they are real.
function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: '2027 Giro d’Italia',
      description: DESCRIPTION,
      url: PAGE_URL,
      startDate: '2027-05-08',
      endDate: '2027-05-30',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@type': 'Organization', name: 'RCS Sport' },
      image: 'https://polkadotbike.com/og-card.png',
    },
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

export default function Giro2027Page() {
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
          Route announcement: 12 October 2026.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 880 }}>
        <div className="status-banner">
          <span>
            <strong>Route not yet announced.</strong> The official 2027 Giro d’Italia route is revealed on 12 October 2026 — this page will be
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
          attribution="Polka Dot Bike · 2027 Giro d’Italia · dates confirmed; full route pending official announcement on 12 October 2026."
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
