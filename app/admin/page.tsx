'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PageviewStats } from '@/lib/pageviewLog';

type Counts = Record<string, number>;

const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${DAY_LABEL[d.getUTCDay()]} ${d.getUTCDate()}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_LABEL[m - 1]} ${y}`;
}

function StatRow({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #1e2a3a' }}>
      <span style={{ color: '#e5e7eb', fontSize: '13px' }}>{label}</span>
      <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px' }}>{count.toLocaleString()}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '18px', marginBottom: '4px' }}>
      {children}
    </div>
  );
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Counts>({});
  const [pageviews, setPageviews] = useState<PageviewStats | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pdb_admin_pw');
    if (stored) { setPassword(stored); load(stored); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(pw: string) {
    setLoading(true);
    setAuthError('');
    try {
      const [gpxRes, pvRes] = await Promise.all([
        fetch('/api/admin/gpx-stats', { headers: { Authorization: `Bearer ${pw}` } }),
        fetch('/api/admin/pageview-stats', { headers: { Authorization: `Bearer ${pw}` } }),
      ]);
      if (gpxRes.status === 401 || pvRes.status === 401) { setAuthError('Incorrect password.'); setLoading(false); return; }
      if (!gpxRes.ok || !pvRes.ok) { setAuthError('Something went wrong.'); setLoading(false); return; }
      setCounts(await gpxRes.json());
      setPageviews(await pvRes.json());
      sessionStorage.setItem('pdb_admin_pw', pw);
      setAuthed(true);
    } catch {
      setAuthError('Something went wrong.');
    }
    setLoading(false);
  }

  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, n]) => sum + n, 0);

  if (!authed) {
    return (
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <form
          onSubmit={e => { e.preventDefault(); load(password); }}
          style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '380px' }}
        >
          <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Site Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e2a3a', background: '#0a0f1e', color: '#fff', fontSize: '15px', marginBottom: '12px' }}
          />
          {authError && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{authError}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
          <Link href="/admin/calendar" style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '13px' }}>
            Season Calendar →
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: '#0a0f1e', padding: '32px 20px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>Site Admin</h1>
          <Link href="/admin/calendar" style={{ color: '#9ca3af', fontSize: '13px', whiteSpace: 'nowrap' }}>
            Season Calendar →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
          {/* Page views — cookie-free counter, unaffected by GA4's consent gate */}
          <div style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: '12px', padding: '18px 20px' }}>
            <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, marginBottom: '2px' }}>Page views</h2>
            <p style={{ color: '#64748b', fontSize: '12.5px', marginBottom: '4px' }}>
              Server-side count of every real page load, no cookies — not gated by analytics consent the way GA4 is.
            </p>
            {!pageviews || pageviews.totalRecorded === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '12px' }}>No page views recorded yet.</div>
            ) : (
              <>
                <SectionLabel>Last 7 days</SectionLabel>
                {pageviews.daily.map((d) => <StatRow key={d.date} label={dayLabel(d.date)} count={d.count} />)}

                <SectionLabel>Last 4 weeks</SectionLabel>
                {pageviews.weekly.map((w, i) => <StatRow key={i} label={w.label} count={w.count} />)}

                <SectionLabel>By month</SectionLabel>
                {pageviews.monthly.map((m) => <StatRow key={m.month} label={monthLabel(m.month)} count={m.count} />)}

                <SectionLabel>Top 5 pages</SectionLabel>
                {pageviews.topPages.map((p) => <StatRow key={p.path} label={p.path} count={p.count} />)}
              </>
            )}
          </div>

          {/* GPX downloads */}
          <div style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: '12px', padding: '18px 20px' }}>
            <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, marginBottom: '2px' }}>GPX downloads</h2>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
              {total.toLocaleString()} total download{total === 1 ? '' : 's'} across {rows.length} climb{rows.length === 1 ? '' : 's'}.
            </p>
            {rows.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '13px' }}>No downloads recorded yet.</div>
            ) : (
              rows.map(([slug, count], i) => (
                <div key={slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #1e2a3a' }}>
                  <span style={{ color: '#e5e7eb', fontSize: '13px' }}>{slug}</span>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px' }}>{count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
