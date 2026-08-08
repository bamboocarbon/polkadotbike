import affiliates from '@/data/affiliates.json';

// Verbatim port of the "with Stay22" copy variant. The source pages also had
// a second copy variant for stages with no Stay22 embed ("Rent a bike for
// race day" / slightly different wording) — checked data/stay22.json: all
// three races have all 21 stages covered, so that branch is currently dead
// code on every page. Not ported; if a future stage genuinely has no Stay22
// link, this card's copy would need revisiting, not silently reused as-is.
export default function BikesBookingCard() {
  return (
    <div className="stage-header glass stay-card">
      <div className="stay-card-title">
        <span className="title-icon-bright">🚲</span> Rent a bike
      </div>
      <img className="bb-logo-chip" src={affiliates.bikesbooking.logo} alt="BikesBooking.com" />
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Riding the route yourself, or just want wheels while following the race? Compare rental rates worldwide.
      </p>
      <a className="plan-btn" href={affiliates.bikesbooking.url} target="_blank" rel="noopener sponsored">
        Compare bike rentals →
      </a>
      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '10px 0 0' }}>
        Affiliate link — I may earn a small commission at no extra cost to you.
      </p>
    </div>
  );
}
