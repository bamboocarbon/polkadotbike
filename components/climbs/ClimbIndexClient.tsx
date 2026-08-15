'use client';

import { useMemo, useState } from 'react';

export interface ClimbIndexItem {
  slug: string;
  name: string;
  cat: string;
  len: number;
  grad: number;
  elev: number;
  race: 'tdf' | 'giro' | 'vuelta';
  raceLabel: string;
  /** True once this climb has real, verified route data and its own detail
   *  page. Only Vuelta climbs qualify so far — Giro/Tour rows render
   *  greyed out and non-clickable until their pages land. */
  ready: boolean;
  /** Pre-folded "name + range", lowercase, accents stripped — matches the
   *  source's own data-h attribute, computed once rather than per keystroke. */
  haystack: string;
}

const RACE_CHIPS: { key: 'all' | 'tdf' | 'giro' | 'vuelta'; label: string; disabled?: boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'giro', label: 'Giro', disabled: true },
  { key: 'tdf', label: 'Tour', disabled: true },
  { key: 'vuelta', label: 'Vuelta' },
];

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function ClimbIndexClient({ climbs }: { climbs: ClimbIndexItem[] }) {
  const [query, setQuery] = useState('');
  const [race, setRace] = useState<'all' | 'tdf' | 'giro' | 'vuelta'>('all');

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return climbs.filter((c) => {
      const okQ = !q || c.haystack.indexOf(q) !== -1;
      const okR = race === 'all' || c.race === race;
      return okQ && okR;
    });
  }, [climbs, query, race]);

  return (
    <>
      <div className="ci-tools">
        <input
          id="ci-search"
          type="search"
          autoComplete="off"
          placeholder="Search a climb — try Galibier, Tourmalet, Aitana…"
          aria-label="Search climbs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {RACE_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            disabled={chip.disabled}
            title={chip.disabled ? 'Climb pages for this race are still being built' : undefined}
            data-race={chip.key}
            className={`ci-chip${race === chip.key ? ' active' : ''}${chip.disabled ? ' ci-chip-disabled' : ''}`}
            onClick={() => setRace(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="ci-count">{filtered.length} {filtered.length === 1 ? 'climb' : 'climbs'}</div>

      <ul className="ci-list">
        {filtered.map((c) => {
          const inner = (
            <>
              <span className={`cc-cat cat-${c.cat.toLowerCase()}`}>{c.cat}</span>
              <span className="ci-name">{c.name}</span>
              <span className="ci-meta">
                {c.len}km · {c.grad}% · {c.elev.toLocaleString()}m · {c.raceLabel}
                {!c.ready && ' · coming soon'}
              </span>
            </>
          );
          return (
            <li key={c.slug}>
              {c.ready ? (
                <a href={`/climbs/${c.slug}`}>{inner}</a>
              ) : (
                <div className="ci-row-disabled" aria-disabled="true">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="ci-none">No climb matches that. Try part of the name — &ldquo;tourmalet&rdquo;, &ldquo;aitana&rdquo;, &ldquo;giau&rdquo;.</div>
      )}
    </>
  );
}
