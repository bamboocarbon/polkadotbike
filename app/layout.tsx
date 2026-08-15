import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { ConsentProvider } from '@/components/ConsentProvider';
import ConsentBanner from '@/components/ConsentBanner';
import Analytics from '@/components/Analytics';
import Stay22Script from '@/components/Stay22Script';

// Site-wide fallback metadata only. Page-specific title/description/OG/
// Twitter tags (different per race, per tool) are set per page in Phase 3
// via each route's own `metadata` export, which Next merges over these
// defaults rather than replacing them wholesale.
export const metadata: Metadata = {
  title: {
    default: 'Polka Dot Bike',
    template: '%s · Polka Dot Bike',
  },
  description: 'Gear ratio, climb and groupset tools for cyclists, plus every categorised climb of the Tour de France, Giro d’Italia and Vuelta a España.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Every source page loads these two families the same way. The
            source used a media="print"/onload swap to make this non-render-
            blocking, but that needs a 'use client' component for the onload
            handler (this is a Server Component, so it can't hold one) — a
            plain blocking stylesheet link is the correct trade for a root
            layout. Without this link at all, every font-family declaration
            sitewide (body's Inter, the big stat numbers' IBM Plex Sans)
            silently falls through to the system font instead. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ConsentProvider>
          <div className="bg-scene">
            <div className="bg-sky" />
            <div className="bg-mountains" />
          </div>
          <Header />
          {children}
          {/* Footer is deliberately NOT mounted here, despite the tasksheet's
              description of the root layout. Its attribution line and its
              link row both genuinely differ per page today (verified: Giro's
              footer cross-links to TDF/Vuelta, TDF's and Vuelta's don't; the
              attribution text differs on every page). The App Router has no
              clean way for a page to hand content up into its parent layout
              short of a context bridge, which is more machinery than a
              two-line footer paragraph deserves. Each page mounts its own
              <Footer attribution=... links=... /> instead — same shared
              component (components/Footer.tsx), just composed from the page
              rather than the layout. See Phase 3 pages for the per-page
              values. */}
          <ConsentBanner />
          <Analytics />
          <Stay22Script />
        </ConsentProvider>
      </body>
    </html>
  );
}
