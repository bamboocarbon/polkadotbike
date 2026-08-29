'use client';

import { useEffect, useRef, useState } from 'react';
import { renderCalendarDocument } from '@/lib/calendar/renderCalendarDocument';
import type { CalendarStoreData } from '@/lib/calendar/types';

export default function AdminCalendar() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pdb_admin_pw');
    if (stored) { setPassword(stored); load(stored); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(pw: string) {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/calendar', { headers: { Authorization: `Bearer ${pw}` } });
      if (res.status === 401) { setAuthError('Incorrect password.'); setLoading(false); return; }
      if (!res.ok) { setAuthError('Something went wrong.'); setLoading(false); return; }
      const data = (await res.json()) as CalendarStoreData;
      sessionStorage.setItem('pdb_admin_pw', pw);
      setAuthed(true);
      setLoading(false);
      // Wait a tick for the iframe to exist, then inject the shared document.
      requestAnimationFrame(() => {
        if (iframeRef.current) iframeRef.current.srcdoc = renderCalendarDocument(data, { editable: true });
      });
    } catch {
      setAuthError('Something went wrong.');
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <form
          onSubmit={e => { e.preventDefault(); load(password); }}
          style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '380px' }}
        >
          <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>Season Calendar</h1>
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
    <iframe
      ref={iframeRef}
      title="Season calendar"
      style={{ position: 'fixed', zIndex: 1, inset: 0, width: '100%', height: '100%', border: 0 }}
    />
  );
}
