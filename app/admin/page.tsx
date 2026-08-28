'use client';

import { useEffect, useState } from 'react';

type Counts = Record<string, number>;

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    const stored = sessionStorage.getItem('pdb_admin_pw');
    if (stored) { setPassword(stored); load(stored); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(pw: string) {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/gpx-stats', { headers: { Authorization: `Bearer ${pw}` } });
      if (res.status === 401) { setAuthError('Incorrect password.'); setLoading(false); return; }
      if (!res.ok) { setAuthError('Something went wrong.'); setLoading(false); return; }
      const data = await res.json();
      setCounts(data);
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
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', padding: '32px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>GPX downloads</h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
          {total.toLocaleString()} total download{total === 1 ? '' : 's'} across {rows.length} climb{rows.length === 1 ? '' : 's'}.
        </p>
        {rows.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>No downloads recorded yet.</div>
        ) : (
          <div style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: '12px', overflow: 'hidden' }}>
            {rows.map(([slug, count], i) => (
              <div
                key={slug}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', borderTop: i === 0 ? 'none' : '1px solid #1e2a3a',
                }}
              >
                <span style={{ color: '#e5e7eb', fontSize: '14px' }}>{slug}</span>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '15px' }}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
