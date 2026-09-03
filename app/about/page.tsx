import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';

const PAGE_URL = 'https://polkadotbike.com/about';
const TITLE = 'About — Polka Dot Bike';
const DESCRIPTION =
  "The story behind the Polka Dot Bike calculators — a project by a long-time road rider and engineer who wanted clean, trustworthy cycling tools.";

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
      '@type': 'AboutPage',
      url: PAGE_URL,
      mainEntity: {
        '@type': 'Person',
        '@id': 'https://polkadotbike.com/about#robin',
        name: 'Robin Gillingham',
        url: PAGE_URL,
        knowsAbout: ['Bicycle gearing', 'Road cycling', 'Drivetrain compatibility'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'About', item: PAGE_URL },
      ],
    },
  ];
}

export default function AboutPage() {
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
        <h1>About</h1>
        <p>The project behind the calculators.</p>
      </div>

      <div className="container" style={{ maxWidth: 880 }}>
        <div className="glass intro" style={{ padding: '24px 26px', marginBottom: 14 }}>
          <p style={{ fontSize: '15.5px', lineHeight: 1.64 }}>
            Hello, I&apos;m Robin and I created <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> — I built it, ride with it and maintain it. I&apos;ve been on road bikes a long time: long enough to remember when a 53/39 chainset and an 11–23 block was simply what you got, and when fitting a triple was how you found a climbing gear that wouldn&apos;t break you. I ran a 52/42/32 for exactly that reason.
          </p>
          <p style={{ fontSize: '15.5px', lineHeight: 1.64, marginTop: 12 }}>
            My background is in engineering, and it shapes how I approach all of this: I like numbers I can trust and machines I understand. I maintain my own bikes too — fitting the cassettes, setting the derailleurs, riding the result — so the calculations on this site come from someone who works on the actual hardware, not just the maths.
          </p>
          <p style={{ fontSize: '15.5px', lineHeight: 1.64, marginTop: 12 }}>
            Gearing has moved on a long way since — compact chainsets, wide-range cassettes, 1x drivetrains — and a fair bit of this site comes from wanting to make proper sense of how far, and to help other riders do the same.
          </p>
        </div>

        <div className="glass sec">
          <h2>Why I built it</h2>
          <p>The reason is that I keep wanting these numbers for my own riding. Power meters have become far more prevalent, and since I started using one I&apos;ve found a real interest in seeing what my numbers are as I climb — and how they&apos;d stack up on the climbs of the Grand Tours. This site is my way of assessing what I can actually achieve, and the gear calculator lets me try different combinations before spending any money on them: what would work, what might work, and what definitely won&apos;t.</p>
          <p>So I built the calculators I wanted instead: clean, quick, and able to answer all the questions. I hope they&apos;re beneficial to you too.</p>
        </div>

        <div className="glass sec">
          <h2>The Polka Dot Reference</h2>
          <p>
            The name is of course taken from the iconic Tour de France King of the Mountains jersey — first worn at the 1975 Tour — because the climbing side of the sport is what I enjoy most. It&apos;s why the site has full <a href="/tdf">Tour</a>, <a href="/giro26">Giro</a> and <a href="/vuelta">Vuelta</a> climb browsers — every stage, with gradients and profiles — and a <a href="/climb">planner</a> that tells you what a climb will take for <em>you</em>, not for a professional. If a stage finishes on a brutal ramp, I want to know what gear I&apos;d need to get up it. Now I can, and so can you.
          </p>
        </div>

        <div className="glass sec">
          <h2>The groupset database</h2>
          <p>
            Every calculator on this site runs off one database I built and maintain myself — 117 groupsets from Shimano, SRAM and Campagnolo, across road, MTB and gravel. I&apos;ve worked through it against each manufacturer&apos;s own spec sheets rather than copying numbers from aggregator sites, and that process has already caught real mistakes: a fabricated Campagnolo groupset that never existed, cassette spacings that were simply wrong. I&apos;d rather find those myself than have them feed your numbers.
          </p>
          <p>It&apos;s not finished — older, discontinued groupsets are the next job — but every current and recent-generation groupset from all three brands is in there now, checked, not guessed at.</p>
        </div>

        <div className="glass sec">
          <h2>How it works</h2>
          <p>The gearing side of the maths is exact — a given chainring, cog and wheel size produce the same result every time, and that part you control completely with your selections. It&apos;s the rider side that moves: power, aerodynamics, weight, wind and road surface. The inputs let you set those as realistically as you can, but they&apos;re estimates of variables that change from ride to ride and can&apos;t be pinned down by a website, so treat the speed and power figures as a very good guide rather than gospel. If something looks wrong, or you can think of a way to make a tool better, I&apos;d genuinely like to hear it.</p>
        </div>
      </div>

      <AADSUnit />

      <Footer
        attribution={<span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span>}
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
