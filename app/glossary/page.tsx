import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import AADSUnit from '@/components/AADSUnit';
import '@/components/content/content.css';

const PAGE_URL = 'https://polkadotbike.com/glossary';
const TITLE = 'Cycling Glossary — Gearing & Climbing Terms · Polka Dot Bike';
const DESCRIPTION =
  'A cycling glossary: gear inches, gain ratio, cadence, derailleur capacity, VAM, FTP and W/kg — the words behind the calculators, explained.';

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

const TERMS: { name: string; description: string }[] = [
  { name: 'Gear inches', description: "The oldest way to compare gears. It goes back to penny-farthings: it's the diameter, in inches, of the single direct-drive wheel you'd need to travel the same distance per pedal stroke. Bigger number, harder gear, more speed per turn of the cranks." },
  { name: 'Gain ratio', description: 'A more modern, crank-aware cousin of gear inches, worked out by the late Sheldon Brown. It folds in how long your cranks are, because longer cranks give you more leverage at the pedal.' },
  { name: 'Metres of development (rollout)', description: 'How far the bike actually rolls forward for one full turn of the pedals.' },
  { name: 'Cadence', description: 'Your pedalling speed, measured in revolutions per minute (rpm).' },
  { name: 'Top & bottom gear', description: 'Your top gear is the hardest — big chainring, smallest sprocket — the one you push on a fast descent or a tailwind. Your bottom gear is the easiest — small ring, biggest sprocket — the one that gets you up the steep stuff.' },
  { name: 'Cross-chaining (chainline)', description: 'Running the chain at a sharp diagonal — big ring to the biggest sprocket, or small ring to the smallest. It works, but it wears the chain faster and costs you a little efficiency.' },
  { name: 'Wheel circumference (rollout)', description: 'The actual distance your wheel covers in one rotation, which depends on tyre size and, a little, on pressure.' },
  { name: 'Groupset', description: 'The matched set of components from one maker that work together: shifters, both derailleurs, chainset, cassette, chain and usually brakes.' },
  { name: 'Chainring / chainset (crankset)', description: 'The toothed ring (or rings) bolted to your cranks at the front. The chainset is the whole assembly — cranks plus rings.' },
  { name: 'Cassette / sprocket / cog', description: 'The stack of sprockets on your back wheel. A cassette is written smallest-to-largest, so "11–34" runs from an 11-tooth hardest sprocket to a 34-tooth easiest.' },
  { name: 'Compact / semi-compact / sub-compact', description: 'Shorthand for chainset sizes. Standard is 53/39; compact is 50/34; semi-compact sits between at 52/36; sub-compact (the gravel-leaning option) is often 48/32 or smaller.' },
  { name: '1x vs 2x', description: '2x is the traditional road setup — two rings, a wide overall range and small steps between gears. 1x drops the front derailleur for a single ring: simpler, lighter and quieter, but with bigger jumps and usually less total range.' },
  { name: 'Triple (3x)', description: 'Three chainrings up front. For a long time it was the only way to get a genuinely low climbing gear — the same hill gearing you now get from a modern wide-range cassette.' },
  { name: 'Derailleur capacity (total capacity)', description: 'The total number of teeth a rear derailleur can take up across your whole gear range. The sum is (big ring − small ring) + (big sprocket − small sprocket).' },
  { name: 'Gradient', description: 'How steep the road is, written as a percentage. 5% means it rises 5 metres for every 100 you travel along.' },
  { name: 'Crr (rolling resistance coefficient)', description: 'How much the road surface itself fights you, separate from gravity and wind. A smooth, hard surface has a low Crr; loose or rough ground has a much higher one, because more of your energy goes into deforming the surface and your tyres instead of moving you forward.' },
  { name: 'VAM', description: "Short for Velocità Ascensionale Media — Italian for average ascent speed. It's how many vertical metres you climb in an hour, which lets you compare two efforts on completely different gradients." },
  { name: 'FTP (Functional Threshold Power)', description: "Roughly the highest power, in watts, you can hold for about an hour. It's the anchor for almost all power-based training — your training zones are set as percentages of it." },
  { name: 'W/kg (watts per kilo)', description: "Your power divided by your body weight. It's the number that really predicts how you'll climb, because gravity doesn't care about raw watts — it cares about watts per kilo." },
  { name: 'Threshold', description: "Shorthand for that roughly one-hour effort — the same thing your FTP measures." },
];

function buildJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      '@id': PAGE_URL,
      name: 'Cycling Gearing Glossary',
      hasDefinedTerm: TERMS.map((t) => ({
        '@type': 'DefinedTerm',
        name: t.name,
        description: t.description,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://polkadotbike.com/' },
        { '@type': 'ListItem', position: 2, name: 'Glossary', item: PAGE_URL },
      ],
    },
  ];
}

export default function GlossaryPage() {
  return (
    <>
      {buildJsonLd().map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hero { flex-direction: column; align-items: center; text-align: center; gap: 6px; }
        .hero > h1 { margin: 0 0 2px; text-align: center; }
        .hero > p { text-align: center; max-width: min(340px, 100%); }
      `,
        }}
      />

      <div className="hero">
        <h1>Cycling Glossary</h1>
        <p>The words behind the calculators — gearing, climbing and power — explained.</p>
      </div>

      <div className="container" style={{ maxWidth: 880 }}>
        <div className="glass intro">
          <p>When I started riding seriously, your chainset was a 53/39 and your cassette an 11–23 — and that was that. A 39×23 was your bailout gear whether the climb liked it or not. Gearing&apos;s come a long way since: compact chainsets, wide-range cassettes, 1x drivetrains. Kinder on the hills now, but a lot more to get your head round — even today I&apos;ll read a modern spec sheet and only half-know what it&apos;ll feel like on a 12% ramp. The numbers were everywhere; the meaning wasn&apos;t, and that gap is half the reason I built the tools on this site.</p>
          <p>So this is the glossary I wish I&apos;d had: every technical word the calculators use, written the way I&apos;d explain it to a mate on a club run rather than the way a textbook would. Where a term feeds into one of the tools, I&apos;ve linked straight through to it.</p>
        </div>

        <div className="glass jump">
          <h2>Jump to a word</h2>
          <div className="jump-links">
            <a href="#one-by-two-by">1x vs 2x</a>
            <a href="#cadence">Cadence</a>
            <a href="#cassette">Cassette</a>
            <a href="#chainring">Chainring</a>
            <a href="#compact">Compact</a>
            <a href="#cross-chaining">Cross-chaining</a>
            <a href="#crr">Crr</a>
            <a href="#derailleur-capacity">Derailleur capacity</a>
            <a href="#ftp">FTP</a>
            <a href="#gain-ratio">Gain ratio</a>
            <a href="#gear-inches">Gear inches</a>
            <a href="#gradient">Gradient</a>
            <a href="#groupset">Groupset</a>
            <a href="#development">Metres of development</a>
            <a href="#threshold">Threshold</a>
            <a href="#top-bottom-gear">Top &amp; bottom gear</a>
            <a href="#triple">Triple (3x)</a>
            <a href="#vam">VAM</a>
            <a href="#wkg">W/kg</a>
            <a href="#circumference">Wheel circumference</a>
          </div>
        </div>

        <h2 className="group-title">Reading your gears</h2>

        <div className="glass term" id="gear-inches">
          <h3>Gear inches</h3>
          <p>The oldest way to compare gears, and the one I still reach for first. It goes back to penny-farthings: it&apos;s the diameter, in inches, of the single direct-drive wheel you&apos;d need to travel the same distance per pedal stroke. Bigger number, harder gear, more speed per turn of the cranks.</p>
          <p>A 50×11 top gear is up around 120 gear inches; a 34×34 climbing gear drops to roughly 27. <span className="take">I find it the most intuitive single figure for sizing one setup against another — once you&apos;ve ridden a few, the numbers start to mean something in your legs.</span></p>
          <p className="where"><strong>On the site:</strong> the <a href="/">Gear Calculator</a> plots every gear in inches, lined up slowest to fastest.</p>
        </div>

        <div className="glass term" id="gain-ratio">
          <h3>Gain ratio</h3>
          <p>A more modern, crank-aware cousin of gear inches, worked out by the late Sheldon Brown. It folds in how long your cranks are, because longer cranks give you more leverage at the pedal. The result is a plain dimensionless number rather than an imaginary wheel.</p>
          <p className="take">For most riders, gear inches tells you everything you need. Gain ratio earns its keep when you&apos;re comparing bikes with genuinely different crank lengths.</p>
        </div>

        <div className="glass term" id="development">
          <h3>Metres of development <span className="alt">(rollout)</span></h3>
          <p>How far the bike actually rolls forward for one full turn of the pedals. Your hardest road gear covers around 9–10 metres; your easiest climbing gear might be down at 2–3.</p>
          <p className="take">It&apos;s the most &ldquo;real-world&rdquo; of the three measures, because it&apos;s a distance you can picture rolling out in front of your wheel.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/compare">Groupset Comparator</a> works in development — (chainring ÷ cog) × wheel circumference.</p>
        </div>

        <div className="glass term" id="cadence">
          <h3>Cadence</h3>
          <p>Your pedalling speed, measured in revolutions per minute (rpm). Most road riders settle somewhere around 85–95 rpm on the flat, though it&apos;s a personal thing.</p>
          <p>Cadence is the hidden variable in every gear: the same gear feels easy spinning at 70 rpm and frantic at 110. <span className="take">That&apos;s why there&apos;s a cadence slider on the Gear Calculator rather than a fixed speed — change it and watch every figure move.</span></p>
          <p className="where"><strong>On the site:</strong> the cadence slider on the <a href="/">Gear Calculator</a> sets the speed shown for each gear.</p>
        </div>

        <div className="glass term" id="top-bottom-gear">
          <h3>Top &amp; bottom gear</h3>
          <p>Plain rider&apos;s shorthand. Your <em>top gear</em> is the hardest — big chainring, smallest sprocket — the one you push on a fast descent or a tailwind. Your <em>bottom gear</em> is the easiest — small ring, biggest sprocket — the one that gets you up the steep stuff.</p>
          <p className="take">When people ask &ldquo;have I got enough gear?&rdquo;, they almost always mean the bottom one. Getting the bottom gear right is what makes a long climb enjoyable instead of survival.</p>
        </div>

        <div className="glass term" id="cross-chaining">
          <h3>Cross-chaining <span className="alt">(chainline)</span></h3>
          <p>Running the chain at a sharp diagonal — big ring to the biggest sprocket, or small ring to the smallest. It works, but it wears the chain faster and costs you a little efficiency. <em>Chainline</em> is simply how straight the chain runs from front to back; the straighter, the better.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/">Gear Calculator</a> flags the overlapping gears so you can see which ones to avoid.</p>
        </div>

        <div className="glass term" id="circumference">
          <h3>Wheel circumference <span className="alt">(rollout)</span></h3>
          <p>The actual distance your wheel covers in one rotation, which depends on tyre size and, a little, on pressure. It&apos;s the conversion factor that turns a bare gear ratio into a real speed.</p>
          <p className="take">The calculators use standard figures for common tyres, but if you want to be exact you can measure your own with a rollout test — mark the valve, roll one full turn, measure the line on the floor.</p>
        </div>

        <h2 className="group-title">Your kit</h2>

        <div className="glass term" id="groupset">
          <h3>Groupset</h3>
          <p>The matched set of components from one maker that work together: shifters, both derailleurs, chainset, cassette, chain and usually brakes. Shimano 105, SRAM Rival, Campagnolo Chorus — those are groupsets.</p>
          <p className="take">Choosing a groupset is mostly choosing a gearing range and a shifting feel; the badge matters far less than the spread of gears it gives you.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/compare">Groupset Comparator</a> lets you put two side by side.</p>
        </div>

        <div className="glass term" id="chainring">
          <h3>Chainring / chainset <span className="alt">(crankset)</span></h3>
          <p>The toothed ring (or rings) bolted to your cranks at the front. The <em>chainset</em> is the whole assembly — cranks plus rings. A &ldquo;50/34&rdquo; means a 50-tooth outer ring and a 34-tooth inner. More teeth on the front means a harder gear.</p>
        </div>

        <div className="glass term" id="cassette">
          <h3>Cassette / sprocket / cog</h3>
          <p>The stack of sprockets on your back wheel. &ldquo;Sprocket&rdquo; and &ldquo;cog&rdquo; both mean one of those rings — I use them interchangeably, and so does most of the bike trade. A cassette is written smallest-to-largest, so &ldquo;11–34&rdquo; runs from an 11-tooth hardest sprocket to a 34-tooth easiest.</p>
          <p className="take">The big sprockets at the back are your climbing gears. When someone fits a wider cassette, the easiest gear is what they&apos;re chasing.</p>
        </div>

        <div className="glass term" id="compact">
          <h3>Compact / semi-compact / sub-compact</h3>
          <p>Shorthand for chainset sizes. Standard is 53/39; <em>compact</em> is 50/34; <em>semi-compact</em> sits between at 52/36; <em>sub-compact</em> (the gravel-leaning option) is often 48/32 or smaller.</p>
          <p className="take">Compact is the sensible default for most riders now — you keep plenty of top-end for the flat and get a far friendlier bottom gear for the hills. I&apos;d only go standard if I genuinely spin out my top gear on the descents.</p>
        </div>

        <div className="glass term" id="one-by-two-by">
          <h3>1x vs 2x <span className="alt">(&quot;one-by&quot; / &quot;two-by&quot;)</span></h3>
          <p>How many chainrings you&apos;ve got up front. <em>2x</em> is the traditional road setup — two rings, a wide overall range and small steps between gears. <em>1x</em> drops the front derailleur for a single ring: simpler, lighter and quieter, but with bigger jumps and usually less total range.</p>
          <p className="take">Gravel and time-trial bikes have made 1x mainstream, and for off-road it makes real sense. On the road I still prefer 2x for the closer gaps — being able to fine-tune your effort matters more to me than shedding a derailleur.</p>
        </div>

        <div className="glass term" id="triple">
          <h3>Triple <span className="alt">(3x)</span></h3>
          <p>Three chainrings up front. In my early days I rode a 52/42/32 triple, and for a long time it was the only way to get a genuinely low climbing gear — the same hill gearing you now get from a modern wide-range cassette.</p>
          <p>Triples have all but vanished, but the low gear isn&apos;t really what we lost with them. With three rings up front you could run a tight, close-ratio cassette at the back and still cover a huge range, so the jumps between gears stayed small and even — you could nearly always drop into the exact gear you wanted. Today&apos;s wide cassettes get their range from the sprockets themselves, which means bigger steps between gears.</p>
          <p className="take">We&apos;ve gained simplicity and kept the low gear; what we gave up is that fine, close spacing. On a long steady climb I still miss being able to trim my effort by a couple of rpm rather than a lurch.</p>
        </div>

        <div className="glass term" id="derailleur-capacity">
          <h3>Derailleur capacity <span className="alt">(total capacity)</span></h3>
          <p>The total number of teeth a rear derailleur can take up across your whole gear range. The sum is (big ring − small ring) + (big sprocket − small sprocket). Go past the derailleur&apos;s rated capacity and the chain hangs slack in the easy gears, or won&apos;t quite reach the hard ones.</p>
          <p className="take">This is the spec people forget until their new wide cassette doesn&apos;t shift cleanly. Worth checking <em>before</em> you buy, not after.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/derailleur">Derailleur Capacity</a> page does the sum and tells you whether your combination fits.</p>
        </div>

        <h2 className="group-title">On the climb</h2>

        <div className="glass term" id="gradient">
          <h3>Gradient</h3>
          <p>How steep the road is, written as a percentage. 5% means it rises 5 metres for every 100 you travel along. Anything over 10% is properly hard work; the cruellest ramps in the Grand Tours tip past 20%.</p>
          <p className="take">Gradient is the number that decides whether your bottom gear is enough. A climb&apos;s average can hide a lot — it&apos;s the steep pitches, not the average, that empty your legs.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/climb">Climb Planner</a> and the <a href="/tdf">TDF</a> / <a href="/giro26">Giro</a> / <a href="/vuelta">Vuelta</a> climb browsers all work in gradients.</p>
        </div>

        <div className="glass term" id="crr">
          <h3>Crr <span className="alt">(rolling resistance coefficient)</span></h3>
          <p>How much the road surface itself fights you, separate from gravity and wind. A smooth, hard surface has a low Crr; loose or rough ground has a much higher one, because more of your energy goes into deforming the surface and your tyres instead of moving you forward.</p>
          <p className="take">It rises faster than most riders expect once you leave tarmac — roughly 2–5× higher on loose gravel than smooth asphalt, sometimes more on genuinely rough ground. On a climb, that shows up as real, unavoidable extra watts on top of whatever the gradient already demands.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/climb">Climb Planner</a>&apos;s <strong>Surface</strong> selector (Asphalt / Hardpack / Gravel / Rocky) sets Crr directly, so gravel and off-road climbs get a realistic power estimate instead of an asphalt-only one.</p>
        </div>

        <div className="glass term" id="vam">
          <h3>VAM</h3>
          <p>Short for <em>Velocità Ascensionale Media</em> — Italian for average ascent speed, and a number the pros live by. It&apos;s how many vertical metres you climb in an hour, which lets you compare two efforts on completely different gradients.</p>
          <p className="take">A strong amateur might hold around 1,000 VAM on a steady climb; on the big mountain days the best in the world push well past 1,800. It&apos;s the cleanest single yardstick I know for raw climbing form.</p>
        </div>

        <h2 className="group-title">Power &amp; fitness</h2>

        <div className="glass term" id="ftp">
          <h3>FTP <span className="alt">(Functional Threshold Power)</span></h3>
          <p>Roughly the highest power, in watts, you can hold for about an hour. It&apos;s the anchor for almost all power-based training — your training zones are set as percentages of it.</p>
          <p className="take">A rising FTP is the clearest single sign that the training is working. It&apos;s the number I&apos;d watch above any other if I were trying to get quicker.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/wkg">W/KG &amp; FTP</a> page turns your FTP into the figures that actually predict climbing.</p>
        </div>

        <div className="glass term" id="wkg">
          <h3>W/kg <span className="alt">(watts per kilo)</span></h3>
          <p>Your power divided by your body weight. It&apos;s the number that really predicts how you&apos;ll climb, because gravity doesn&apos;t care about raw watts — it cares about watts per kilo.</p>
          <p className="take">A fit club rider is somewhere around 3–4 W/kg at threshold; World-Tour pros live up near 6. It&apos;s also why losing a kilo can do as much for your climbing as finding a few more watts.</p>
          <p className="where"><strong>On the site:</strong> the <a href="/wkg">W/KG &amp; FTP</a> page converts between watts, weight and W/kg.</p>
        </div>

        <div className="glass term" id="threshold">
          <h3>Threshold</h3>
          <p>Shorthand for that roughly one-hour effort — the same thing your FTP measures. &ldquo;Riding at threshold&rdquo; means sitting right at the edge of what&apos;s sustainable: the controlled burn you can just about hold, but not much longer.</p>
        </div>
      </div>

      <AADSUnit />

      <Footer
        attribution={<><span className="pdb-brand">Polka<span className="pdb-dot">DOT</span>Bike</span> — A glossary for road, gravel and mountain bike riders. Figures are indicative.</>}
        links={[
          { href: '/', label: '← Gear Calculator' },
          { href: '/guide', label: 'Guide' },
          { href: '/about', label: 'About' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/disclaimer', label: 'Disclaimer' },
        ]}
      />
    </>
  );
}
