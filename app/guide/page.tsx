import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';

const PAGE_URL = 'https://polkadotbike.com/guide';
const TITLE = 'Site Guide — How to Use the Calculators · Polka Dot Bike';
const DESCRIPTION =
  "A quick tour of every Polka Dot Bike tool — gear calculator, climb planner, comparator, W/kg and the Tour, Giro & Vuelta climb browsers — and how they link.";

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

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What does the Gear Calculator do?',
    a: 'See every gear your bike actually has, lined up in order. Pick your bike, and it lays out the whole range slowest-to-fastest so you can see your spread at a glance.',
  },
  {
    q: 'What does the Climb Planner do?',
    a: 'It shows how fast — and how long — a climb will take at a given power. Tell it the climb and your numbers, and it solves for your speed using real physics: gravity, rolling resistance and air drag.',
  },
  {
    q: 'What does the Groupset Comparator do?',
    a: 'Put two setups side by side before you buy. Build System A and System B — either one can be a stock groupset or a Custom setup you type in yourself: name it, set the chainrings, list the cassette cogs.',
  },
  {
    q: 'What does the Derailleur Capacity checker do?',
    a: 'Check a chainring and cassette combo will actually shift — before you order it. Every rear derailleur can only take up so much chain; this works out whether yours can cope with the range you want.',
  },
  {
    q: 'What does the W/kg & FTP calculator do?',
    a: 'Turn watts and weight into the number that predicts climbing. Enter your power and your weight and it gives you watts per kilo — the figure that actually decides how you\'ll go uphill — and shows where you sit against the standard tables.',
  },
  {
    q: 'What are the Giro, TDF & Vuelta climb browsers?',
    a: 'Every stage and climb of the 2026 Giro, Tour and Vuelta, with gradient profiles. Each climb card gives you its length, average gradient, category and an elevation profile, and can send that climb straight into the Climb Planner.',
  },
  {
    q: 'How many groupsets does the site cover?',
    a: "117, from Shimano, SRAM and Campagnolo, across road, MTB and gravel. It's built and checked by hand against each manufacturer's own spec sheets, not copied from a spares catalogue — see the About page for how that's put together.",
  },
  {
    q: 'Does my setup carry across the tools?',
    a: "Choose your groupset and wheels once on the Gear Calculator and they carry across to the Climb Planner, the Comparator and the race climb browsers. You're not re-entering your bike on every page — change it anywhere and the other tools pick it up.",
  },
  {
    q: 'Can I share or save a result?',
    a: 'The Copy link button packs your exact setup into the page address — send that link and the other person opens the precise gear chart, comparison or climb you were looking at. On the Gear Calculator, Climb Planner and Comparator, the Report button opens a clean, branded summary that you can print or save as a PDF.',
  },
];

function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'Guide', item: PAGE_URL },
      ],
    },
  ];
}

export default function GuidePage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      {/* guide.html's own jump-links pills use a literal blue (#1a72e0)
          slightly different from the other content pages' default
          (#3b82f6) — a real, pre-existing inconsistency in the source, not
          introduced by this port. The nav a.active override that used to
          sit alongside it has been dropped so this page's active tab
          matches every other page's fixed blue from globals.css. */}
      <style>{`
        .jump-links a { background: rgba(26,114,224,0.10); border-color: rgba(26,114,224,0.22); }
        .jump-links a:hover { background: rgba(26,114,224,0.22); }
        .hero { flex-direction: column; align-items: center; text-align: center; gap: 6px; }
        .hero > h1 { margin: 0 0 2px; text-align: center; }
        .hero > p { text-align: center; max-width: min(340px, 100%); }
      `}</style>

      <div className="hero">
        <h1>How to use the site</h1>
        <p>A quick tour of each tool — what it&apos;s for, what the controls do, and how to read what comes back.</p>
      </div>

      <div className="container" style={{ maxWidth: 880 }}>
        <div className="glass intro">
          <p>I built <span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> as a handful of small tools I actually wanted for my own riding: work out a gear, plan a climb, sanity-check a groupset before I spent money on it. None of them needs a manual — but a couple of useful touches are easy to miss, so here&apos;s the thirty-second tour of each.</p>
          <p>Two things are worth knowing up front. Your bike setup <em>follows you</em> from one tool to the next, so you only enter it once. And any result can be turned into a link you can share. More on both at the bottom.</p>
        </div>

        <div className="glass jump">
          <h2>Jump to a tool</h2>
          <div className="jump-links">
            <a href="#gear-calculator">Gear Calculator</a>
            <a href="#climb-planner">Climb Planner</a>
            <a href="#comparator">Groupset Comparator</a>
            <a href="#derailleur">Derailleur Capacity</a>
            <a href="#wkg">W/kg &amp; FTP</a>
            <a href="#races">Giro, TDF &amp; Vuelta climbs</a>
            <a href="#everywhere">Sharing, setup &amp; reports</a>
          </div>
        </div>

        <h2 className="group-title">The tools</h2>

        <div className="glass tool" id="gear-calculator">
          <h3>Gear Calculator</h3>
          <div className="lead">See every gear your bike actually has, lined up in order.</div>
          <p>Pick your bike, and it lays out the whole range slowest-to-fastest so you can see your spread at a glance.</p>
          <ul className="controls">
            <li><b>Discipline &amp; brand</b> — Road, Gravel or MTB, then Shimano, SRAM or Campagnolo. Pick <b>Custom</b> to type in any chainring and cassette by hand.</li>
            <li><b>Drivetrain</b> — 2× (double) or 1× (single); the chainring boxes follow.</li>
            <li><b>Chainring &amp; cassette</b> — your front rings and the sprocket sizes on the back.</li>
            <li><b>Wheel &amp; tyre</b> — sets the rollout, which turns a ratio into a real speed.</li>
            <li><b>Cadence slider</b> — your pedalling speed in rpm.</li>
          </ul>
          <p>The chart shows every gear in one of three modes — <b>m/rev</b> (metres rolled per pedal stroke), <b>speed</b> at your chosen cadence, or <b>gear inches</b>. Overlapping gears that cross-chain are flagged so you can see them.</p>
          <p>It also colour-codes the <b>step</b> — the size of the jump between one gear and the next — shown both as a percentage in the gear list and as shading on the chart: <b style={{ color: '#22c55e' }}>green</b> for a seamless step under 10%, <b style={{ color: '#f59e0b' }}>amber</b> from 10–14%, and <b style={{ color: '#ef4444' }}>red</b> for a wide jump of 14% or more. It&apos;s the quickest way to see where your gearing eases between gears and where it makes you lurch.</p>
          <p className="take">Set your real cadence before you read the speeds — the same gear reads very differently at 80 rpm and 100.</p>
          <p className="where"><a href="/">Open the Gear Calculator →</a></p>
        </div>

        <div className="glass tool" id="climb-planner">
          <h3>Climb Planner</h3>
          <div className="lead">How fast — and how long — a climb will take at a given power.</div>
          <p>Tell it the climb and your numbers, and it solves for your speed using real physics: gravity, rolling resistance and air drag.</p>
          <ul className="controls">
            <li><b>Your power</b> — the watts you expect to hold up the climb.</li>
            <li><b>System weight</b> — you, the bike and everything on it, in kg or lbs. This is the big lever on a climb.</li>
            <li><b>Road gradient &amp; climb distance</b> — how steep, and how long.</li>
            <li><b>Surface (Crr)</b> — Asphalt, Hardpack, Gravel or Rocky. Rolling resistance rises sharply off tarmac, so this adjusts how hard the surface itself fights you, on top of gravity and gradient.</li>
            <li><b>Riding position (CdA)</b> — how aero you are; matters less the steeper it gets.</li>
            <li><b>Groupset, crank length &amp; cadence</b> — carried over from the Gear Calculator so your gearing is already set.</li>
          </ul>
          <p className="take">If you only know your weight roughly, round up — kit and bottles add more than people expect, and weight is what the gradient charges you for.</p>
          <p className="where"><a href="/climb">Open the Climb Planner →</a></p>
        </div>

        <div className="glass tool" id="comparator">
          <h3>Groupset Comparator</h3>
          <div className="lead">Put two setups side by side before you buy.</div>
          <p>Build System A and System B — either one can be a stock groupset or a Custom setup you type in yourself: name it, set the chainrings, list the cassette cogs. Leave the small ring blank and it&apos;s treated as a 1×. Both are drawn on one chart, A in its brand colour, B in dashed white, and you can flip the whole thing between metres of development, speed and gear inches.</p>
          <p>The clever bit is the heat strips above and below the chart. They don&apos;t show the gaps between gears — they score how closely the two <em>systems</em> match at each point of the range, green where they&apos;re within 4% of each other through to red where they&apos;re 15% or more apart. Two 2× setups get two strips: big rings compared along the top, small rings along the bottom. Put a 1× against a 2× and the single ring is scored against both of the other bike&apos;s rings, one strip each. Two 1× bikes need just the one.</p>
          <p className="take">A strip that runs green end to end is telling you something the price tags won&apos;t: you&apos;d be buying the same gears with a different badge. It&apos;s the orange and red stretches — usually at the very top or very bottom — that show where one setup genuinely does something the other can&apos;t. (If the jargon trips you up, the <a href="/glossary" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>glossary</a> explains it.)</p>
          <p className="where"><a href="/compare">Open the Groupset Comparator →</a></p>
        </div>

        <div className="glass tool" id="derailleur">
          <h3>Derailleur Capacity</h3>
          <div className="lead">Check a chainring and cassette combo will actually shift — before you order it.</div>
          <p>Every rear derailleur can only take up so much chain. This works out whether yours can cope with the range you want.</p>
          <ul className="controls">
            <li><b>Drivetrain &amp; gears</b> — 2× or 1×, your big and small chainrings, and your smallest and largest sprockets.</li>
            <li><b>Brand &amp; type filter</b> — narrow the list to pull a specific derailleur&apos;s published capacity to check against.</li>
          </ul>
          <p>It adds up your <b>total capacity</b> — (big ring − small ring) + (big sprocket − small sprocket) — and tells you whether that&apos;s within the derailleur&apos;s rating or exceeds it.</p>
          <p className="take">If it exceeds capacity, the chain goes slack in your easiest gears. Worth checking <em>before</em> the new cassette arrives, not after.</p>
          <p className="where"><a href="/derailleur">Open the Derailleur Capacity checker →</a></p>
        </div>

        <div className="glass tool" id="wkg">
          <h3>W/kg &amp; FTP</h3>
          <div className="lead">Turn watts and weight into the number that predicts climbing.</div>
          <p>Enter your power and your weight and it gives you watts per kilo — the figure that actually decides how you&apos;ll go uphill — and shows where you sit against the standard tables.</p>
          <ul className="controls">
            <li><b>Sex &amp; weight</b> — used to place you on the right benchmark, in kg or lbs.</li>
            <li><b>FTP</b> — your roughly one-hour power, in watts.</li>
          </ul>
          <p>The result is your <b>W/kg</b> and a category placing, from Cat 5 up to World / Pro level, based on the Coggan power-profile tables.</p>
          <p className="take">Both halves count: dropping a kilo can move you up the table as surely as finding a few more watts.</p>
          <p className="where"><a href="/wkg">Open the W/kg &amp; FTP calculator →</a></p>
        </div>

        <div className="glass tool" id="races">
          <h3>Giro, TDF &amp; Vuelta climb browsers</h3>
          <div className="lead">Every stage and climb of the 2026 Giro, Tour and Vuelta, with gradient profiles.</div>
          <p>Browse the race stage by stage. During the race itself the list jumps to the day&apos;s stage automatically (and handles rest days); the rest of the year it opens on the start.</p>
          <p>Each climb card gives you its length, average gradient, category and an elevation profile. The <b>Plan this climb →</b> button on a card sends that climb&apos;s distance and gradient straight into the Climb Planner — pre-filled with the setup you&apos;ve already chosen — so you can see what it&apos;ll take for <em>you</em>.</p>
          <p className="where"><a href="/giro26">Giro d&apos;Italia 2026 →</a> &nbsp;·&nbsp; <a href="/tdf">Tour de France 2026 →</a> &nbsp;·&nbsp; <a href="/vuelta">La Vuelta a España 2026 →</a></p>
        </div>

        <h2 className="group-title">A few things worth knowing</h2>

        <div className="glass tool" id="everywhere">
          <h3>Your setup follows you</h3>
          <p>Choose your groupset and wheels once on the Gear Calculator and they carry across to the Climb Planner, the Comparator and the race climb browsers. You&apos;re not re-entering your bike on every page — change it anywhere and the other tools pick it up.</p>
          <h3 style={{ marginTop: 16 }}>Share any result</h3>
          <p>The <b>Copy link</b> button packs your exact setup into the page address. Send that link and the other person opens the precise gear chart, comparison or climb you were looking at — nothing to re-key. Handy for asking &ldquo;is this enough gear?&rdquo; without a paragraph of explanation.</p>
          <h3 style={{ marginTop: 16 }}>Print or save a report</h3>
          <p>On the Gear Calculator, Climb Planner and Comparator, the <b>⎙ Report</b> button opens a clean, branded summary of your setup and results that you can print or save as a PDF — handy for taking to the bike shop, or keeping a record of a setup before you change it.</p>
          <p className="take" style={{ marginTop: 11 }}>And if any word on the site is new to you — gear inches, CdA, capacity, VAM — it&apos;s explained in the <a href="/glossary" style={{ color: 'var(--accent-light)', fontStyle: 'normal', textDecoration: 'none', fontWeight: 600 }}>Glossary</a>.</p>
        </div>

        <div className="glass author">
          <p><strong>One last thing.</strong> These tools give indicative numbers, not promises — real speed and effort depend on the road, the wind and how you&apos;re sitting on the bike. If something here isn&apos;t clear, or a tool doesn&apos;t behave the way you&apos;d expect, <a href="/contact">tell me</a> and I&apos;ll sort it. — Robin</p>
        </div>
      </div>

      <AADSUnit />

      <Footer
        attribution={<><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> — A quick guide to the tools. Figures are indicative.</>}
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/glossary', label: 'Glossary' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
