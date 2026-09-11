'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'pdb_consent';

type Choice = 'accepted' | 'rejected' | null | undefined;
// undefined = not yet read (server render + first paint)
// null      = read, no stored choice — show the banner
// 'accepted' | 'rejected' = read, already decided

interface ConsentContextValue {
  choice: Choice;
  accept: () => void;
  reject: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  choice: undefined,
  accept: () => {},
  reject: () => {},
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Choice>(undefined);

  // localStorage doesn't exist on the server — reading it here, not during
  // render, is what avoids the hydration mismatch (three states, not two:
  // see the Choice type above).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      // storage blocked (private browsing, etc.) — treat as undecided
    }
    if (stored === 'accepted' || stored === 'rejected') {
      setChoice(stored);
      return;
    }
    // No explicit choice stored yet — outside the EEA/UK (see
    // middleware.ts: regionFor / REGULATED_COUNTRIES) cookies default on
    // with no prompt, so treat as accepted without persisting it as the
    // user's own choice. Inside it, fall through to null and show the
    // banner as before.
    let region = 'regulated';
    try {
      const match = document.cookie.match(/(?:^|; )consent_region=([^;]*)/);
      if (match) region = decodeURIComponent(match[1]);
    } catch {
      // cookie read blocked — fail safe to regulated (show the banner)
    }
    setChoice(region === 'open' ? 'accepted' : null);
  }, []);

  const persist = (value: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // storage blocked — choice still applies for this page view via state
    }
    setChoice(value);
  };

  return (
    <ConsentContext.Provider
      value={{
        choice,
        accept: () => persist('accepted'),
        reject: () => persist('rejected'),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
