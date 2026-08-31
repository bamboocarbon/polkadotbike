import type { ClimbBuyInfo } from '@/lib/climbGearCalc';
import { pbBrandColorStyle } from '@/lib/pbLinks';

// Extracted out of ClimbDetailClient.tsx (2026-08-31) so RpiRouteDetailClient
// can reuse it too — same setup-driven Performance Bicycle affiliate link,
// just fed by whichever page's own S/gears.
export default function BuyCard({ buyInfo }: { buyInfo: ClimbBuyInfo }) {
  return (
    <div className="rail-card" id="buy-card">
      <div className="rail-head">Buy These Components</div>
      <div className="rail-body" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <img src="/pb-logo.png" alt="Performance Bicycle" style={{ width: 190, maxWidth: '100%', height: 'auto', flexShrink: 0 }} />
          <div
            style={{ fontSize: 19, fontWeight: 700, color: '#fff', flex: '1 1 180px', minWidth: 160 }}
            title={buyInfo.label}
          >
            {buyInfo.label}
          </div>
          <a
            className="pb-buy-link"
            href={buyInfo.url}
            target="_blank"
            rel="noopener sponsored"
            style={{ ...pbBrandColorStyle(buyInfo.color, buyInfo.text), flexShrink: 0, padding: '14px 30px', gap: 8, fontSize: 16 }}
          >
            <span className="pb-text" style={{ whiteSpace: 'nowrap' }}>
              {buyInfo.exact ? 'Shop this groupset' : 'Browse similar groupsets'}
            </span>
            <span className="pb-arrow">→</span>
          </a>
        </div>
        <p className="pb-note" style={{ marginTop: 10 }}>Affiliate link — I may earn a small commission at no extra cost to you.</p>
      </div>
    </div>
  );
}
