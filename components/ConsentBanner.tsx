'use client';

import { useConsent } from './ConsentProvider';

export default function ConsentBanner() {
  const { choice, accept, reject } = useConsent();

  // Render nothing until we know (undefined), and nothing once a choice has
  // already been made (accepted/rejected). Only the "no stored choice yet"
  // state (null) shows the banner.
  if (choice !== null) return null;

  return (
    <div id="pdb-consent" role="dialog" aria-label="Cookie consent">
      <p>
        I use Google Analytics cookies to see how the site&#8217;s used. See the{' '}
        <a href="/privacy">privacy policy</a> for details.
      </p>
      <div className="pdb-consent-btns">
        <button type="button" className="pdb-reject" onClick={reject}>
          Reject
        </button>
        <button type="button" className="pdb-accept" onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
}
