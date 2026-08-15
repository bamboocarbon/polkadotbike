import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';

const PAGE_URL = 'https://polkadotbike.com/privacy';
const TITLE = 'Privacy Policy — Polka Dot Bike';
const DESCRIPTION =
  'How Polka Dot Bike handles your data: no accounts or logins, your bike settings stored only on your own device, and almost nothing collected about you.';

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

export const viewport: Viewport = {
  themeColor: '#ef4444',
};

function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: PAGE_URL,
      name: TITLE,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'Privacy', item: PAGE_URL },
      ],
    },
  ];
}

export default function PrivacyPage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <div className="hero">
        <h1>Privacy Policy</h1>
      </div>

      <div className="container" style={{ maxWidth: 760 }}>
        <div className="glass intro">
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>
            Last updated: 30 June 2026
          </p>
          <p><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> is a one-person run website of cycling calculators. It has no accounts, no logins and no sign-up forms, so there is very little of your data for me to collect — and the little the calculators do remember stays on your own device. This page explains exactly what happens, including the third-party services the site relies on.</p>
        </div>

        <div className="glass sec">
          <h2>Who runs this site</h2>
          <p><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> is owned and run by Robin Gillingham as an individual. If you have any question about this policy or your data, you can reach me through the <a href="/contact">contact page</a>.</p>
        </div>

        <div className="glass sec">
          <h2>What I collect</h2>
          <p>Through normal use of the calculators, <b>I do not collect any personal information about you</b>. There is nothing to log in to, and no forms that ask for your details.</p>
          <p>The one time I receive any personal data is if <b>you choose to email me</b> via the contact page. In that case I receive your email address and whatever you write, and I use it only to reply to you. I don&apos;t add you to any list and I don&apos;t pass it to anyone else.</p>
          <p>Like most websites, the hosting service that serves these pages may automatically keep standard server logs (such as IP addresses and browser type) for security and reliability. I don&apos;t use these to identify individuals.</p>
        </div>

        <div className="glass sec">
          <h2>Settings stored on your device</h2>
          <p>The calculators save your chosen setup — things like your groupset, wheels and cadence — in your browser&apos;s <b>local storage</b> (under the keys <code style={{ color: 'var(--accent-light)' }}>cg_shared</code> and <code style={{ color: 'var(--accent-light)' }}>cg_cmp</code>). This is what lets your setup follow you from one tool to the next.</p>
          <p>This information lives only on your device. It is <b>never sent to me or to any server</b>, and it isn&apos;t used to track you. You can clear it at any time by clearing your browser&apos;s site data for <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span>. When you use the &quot;Copy link&quot; feature, your settings are encoded into the link itself so you can share an exact result — nothing is stored on my side.</p>
        </div>

        <div className="glass sec">
          <h2>Analytics</h2>
          <p>I use <b>Google Analytics</b>, a service provided by Google, to understand how the site is used — which pages are visited, roughly which country visits come from, and which tools people actually find useful. To do this, Google Analytics sets <b>cookies</b> in your browser and collects information about your device and your visit (such as pages viewed, browser type and an anonymised form of your IP address), which is processed on Google&apos;s servers. I only ever see aggregated statistics — I can&apos;t identify you from them.</p>
          <p>You can opt out of Google Analytics on all websites by installing Google&apos;s <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">opt-out browser add-on</a>, and you can read how Google handles this data at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a>.</p>
        </div>

        <div className="glass sec">
          <h2>Advertising and cookies</h2>
          <p><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> is supported by advertising. I use <b>Google AdSense</b>, an advertising service provided by Google, to display adverts on the site.</p>
          <ul>
            <li>Google and its partners use cookies and similar technologies to serve adverts based on your visits to this site and other sites on the internet.</li>
            <li>Google&apos;s use of advertising cookies enables it and its partners to serve adverts to you. This may include personalised advertising.</li>
            <li>The site itself does not set its own tracking cookies.</li>
          </ul>
          <p>You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>, or opt out of a wider range of vendors at <a href="https://www.aboutads.info" target="_blank" rel="noopener">aboutads.info</a> and <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener">Your Online Choices</a>. You can also block or delete cookies in your browser settings at any time, though some adverts may then be less relevant. For more detail, see <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">how Google uses information from sites that use its services</a>.</p>
        </div>

        <div className="glass sec">
          <h2>Other third-party services</h2>
          <p>To work, some pages load resources from other providers. When your browser fetches those resources, the provider necessarily receives your IP address as part of the request. These services are:</p>
          <ul>
            <li><b>Google Fonts</b> — serves the typeface used across the site.</li>
            <li><b>Map providers</b> — the Giro and Tour pages display interactive maps. The map software (Leaflet) and country outlines are loaded from content-delivery networks (Cloudflare, jsDelivr and unpkg), and the map tiles are provided by <b>CARTO</b> using <b>OpenStreetMap</b> data.</li>
          </ul>
          <p>Each of these has its own privacy policy governing how it handles the requests it receives.</p>
        </div>

        <div className="glass sec">
          <h2>Your rights</h2>
          <p>Because the site holds almost no personal data about you, there is usually nothing of yours for me to find, change or delete. If you have emailed me and would like me to delete that correspondence, just ask. If you are in the UK or EU, you have rights under data-protection law — including the right to access, correct or erase personal data I hold about you. To exercise any of these, contact me through the <a href="/contact">contact page</a>.</p>
        </div>

        <div className="glass sec">
          <h2>Children</h2>
          <p>This site is not directed at children, and I do not knowingly collect personal information from anyone under 16.</p>
        </div>

        <div className="glass sec">
          <h2>Changes to this policy</h2>
          <p>If the site changes in a way that affects this policy — for example, adding a new third-party service — I&apos;ll update this page and the &quot;last updated&quot; date at the top. Continuing to use the site after a change means you accept the revised policy.</p>
        </div>

        <div className="glass sec">
          <h2>Contact</h2>
          <p>Any questions about privacy or your data are welcome — please use the <a href="/contact">contact page</a> to reach me.</p>
        </div>
      </div>

      <AADSUnit />

      <Footer
        attribution={<span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span>}
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
