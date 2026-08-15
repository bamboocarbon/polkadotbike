import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';

const PAGE_URL = 'https://polkadotbike.com/disclaimer';
const TITLE = 'Disclaimer — Polka Dot Bike';
const DESCRIPTION =
  "The disclaimer for Polka Dot Bike's calculators — what the numbers can and can't promise, and where your own judgement (and your bike shop) comes first.";

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
        { '@type': 'ListItem', position: 2, name: 'Disclaimer', item: PAGE_URL },
      ],
    },
  ];
}

export default function DisclaimerPage() {
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
        <h1>Disclaimer</h1>
      </div>

      <div className="container" style={{ maxWidth: 760 }}>
        <div className="glass intro">
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>
            Last updated: 3 July 2026
          </p>
          <p><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> is a set of cycling calculators built and run by one person. They exist to help you think about gearing, climbs and effort, and I&apos;ve made them as accurate as I can. But they are informational tools, not professional advice, and this page sets out exactly where their limits are.</p>
        </div>

        <div className="glass sec">
          <h2>Indicative numbers, not promises</h2>
          <p>The gearing side of the maths is exact — a given chainring, cog and wheel size produce the same development every time. The rider side is not: power, aerodynamics, weight, wind and road surface all vary from ride to ride, and the site can only work from the estimates you type into the inputs. Speed, power and time figures are therefore a very good guide, never a guarantee. Real-world results will differ.</p>
        </div>

        <div className="glass sec">
          <h2>Not training or medical advice</h2>
          <p>The W/kg, FTP and power figures on this site are for general information. They are not medical advice, coaching advice or a training plan. Riding hard — especially climbing at your limit — is a serious physical effort, and you know your own health better than a web page does. If you&apos;re starting or significantly changing training, or you have any health condition, talk to a doctor or a qualified coach first, and always ride within your own limits.</p>
        </div>

        <div className="glass sec">
          <h2>Equipment decisions are yours</h2>
          <p>The comparator and derailleur-capacity tools are there to help you shortlist, not to replace the manufacturer&apos;s word. Specifications change, and compatibility has edge cases no calculator fully captures — so before you buy or fit anything, check the manufacturer&apos;s published specifications, and if in doubt ask a professional mechanic. I maintain my own bikes and I still check; you should too. Any work you do on your own bike is at your own risk.</p>
        </div>

        <div className="glass sec">
          <h2>Race data</h2>
          <p>The Tour de France, Giro d&apos;Italia and Vuelta a España stage and climb data is compiled carefully from publicly available route information, but organisers change routes, and lengths, gradients and altitudes are rounded and sometimes disputed between sources. Treat them as a faithful guide to each race, not an official document.</p>
        </div>

        <div className="glass sec">
          <h2>Links and adverts</h2>
          <p>The site links to external websites I don&apos;t control, and I&apos;m not responsible for their content. The site carries advertising (see the <a href="/privacy">privacy policy</a> for how that works). Some retailer links — currently the &quot;Shop at Performance Bicycle&quot; link on the gear calculator — are affiliate links, meaning I earn a small commission on purchases at no extra cost to you. Any affiliate link on the site is marked as such next to the link itself.</p>
        </div>

        <div className="glass sec">
          <h2>No warranties</h2>
          <p>The site and its calculators are provided as they are, free of charge, with no warranties of any kind. To the fullest extent permitted by law, I accept no liability for any loss, damage or injury arising from reliance on the site&apos;s figures — whether that&apos;s a purchase that didn&apos;t fit, a climb that went worse than predicted, or anything else. Nothing on this page limits any liability that cannot lawfully be limited.</p>
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
          { href: '/privacy', label: 'Privacy' },
        ]}
      />
    </>
  );
}
