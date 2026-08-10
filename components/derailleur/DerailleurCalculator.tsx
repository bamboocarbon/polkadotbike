'use client';

import { useEffect, useMemo, useState } from 'react';
import derailleurs from '@/data/derailleurs.json';
import { PB_GENERIC_LINK, pbBrandColorStyle } from '@/lib/pbLinks';

interface Derailleur {
  brand: string;
  name: string;
  speed: number;
  disc: string[];
  cage: string;
  maxSprocket: number;
  totalCap: number;
}

const DB = derailleurs as Derailleur[];

type Mode = '2x' | '1x';
type StatusKey = 'ok' | 'warn' | 'no-cap' | 'no-sprocket' | 'no-both';
type Tier = 'ok' | 'warn' | 'no';

const LIMITS = {
  bigRing: [32, 70],
  smallRing: [24, 52],
  bigCog: [11, 53],
  smallCog: [10, 16],
} as const;

const BRAND_COLOR: Record<string, string> = { shimano: '#1a72e0', sram: '#ee1c28', campagnolo: '#ffcd00' };

const GROUP_DEFS: { key: Tier; icon: string; label: string }[] = [
  { key: 'ok', icon: '✓', label: 'Within Spec' },
  { key: 'warn', icon: '⚠', label: 'Marginal — within 3T of limit' },
  { key: 'no', icon: '✕', label: 'Exceeds Capacity' },
];

function statusTier(s: StatusKey): Tier {
  if (s === 'ok') return 'ok';
  if (s === 'warn') return 'warn';
  return 'no';
}

function clamp(key: keyof typeof LIMITS, value: number): number {
  const [min, max] = LIMITS[key];
  return Math.min(max, Math.max(min, value));
}

export default function DerailleurCalculator() {
  const [mode, setModeState] = useState<Mode>('2x');
  const [bigRing, setBigRing] = useState(50);
  const [smallRing, setSmallRing] = useState(34);
  const [bigCog, setBigCog] = useState(32);
  const [smallCog, setSmallCog] = useState(11);
  const [brandFilter, setBrandFilter] = useState('all');
  const [discFilter, setDiscFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  // Matches the source's `window.addEventListener('resize', positionBuyCard)`
  // — the breakpoint (720px) is the same one .calc-grid collapses to a
  // single column at.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 720);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function adj(key: keyof typeof LIMITS, delta: number) {
    const next = clamp(key, (({ bigRing, smallRing, bigCog, smallCog } as Record<string, number>)[key]) + delta);
    if (key === 'bigRing') {
      setBigRing(next);
      if (next <= smallRing) setSmallRing(next - 1);
    } else if (key === 'smallRing') {
      setSmallRing(next);
      if (next >= bigRing) setBigRing(next + 1);
    } else if (key === 'bigCog') {
      setBigCog(next);
      if (next <= smallCog) setSmallCog(next - 1);
    } else if (key === 'smallCog') {
      setSmallCog(next);
      if (next >= bigCog) setBigCog(next + 1);
    }
  }

  const { frontDiff, rearDiff, total } = useMemo(() => {
    const frontDiff = mode === '1x' ? 0 : Math.max(0, bigRing - smallRing);
    const rearDiff = Math.max(0, bigCog - smallCog);
    return { frontDiff, rearDiff, total: frontDiff + rearDiff };
  }, [mode, bigRing, smallRing, bigCog, smallCog]);

  function checkDerailleur(d: Derailleur): StatusKey {
    const sprocketOk = bigCog <= d.maxSprocket;
    const capOk = total <= d.totalCap;
    const marginal = capOk && total > d.totalCap - 3;
    if (!sprocketOk && !capOk) return 'no-both';
    if (!sprocketOk) return 'no-sprocket';
    if (!capOk) return 'no-cap';
    if (marginal) return 'warn';
    return 'ok';
  }

  const groups = useMemo(() => {
    const list = DB.filter((d) => {
      if (brandFilter !== 'all' && d.brand !== brandFilter) return false;
      if (discFilter !== 'all' && !d.disc.includes(discFilter)) return false;
      return true;
    }).map((d) => ({ ...d, status: checkDerailleur(d) }));

    const g: Record<Tier, (Derailleur & { status: StatusKey })[]> = { ok: [], warn: [], no: [] };
    list.forEach((d) => g[statusTier(d.status)].push(d));
    return { list, g };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFilter, discFilter, total, bigCog]);

  const okCount = groups.g.ok.length;

  const buyCard = (
    <div className="rail-card" id="buy-card">
      <div className="rail-head">Buy These Components</div>
      <div className="rail-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pb-logo-chip" src="/pb-logo.png" alt="Performance Bicycle" />
        <a
          className="pb-buy-link"
          href={PB_GENERIC_LINK}
          target="_blank"
          rel="noopener sponsored"
          style={pbBrandColorStyle('#12b05f', '#17c86c')}
        >
          <span className="pb-text">Shop groupsets<small>Opens in a new tab</small></span>
          <span className="pb-arrow">→</span>
        </a>
        <p className="pb-note">Affiliate link — I may earn a small commission at no extra cost to you.</p>
      </div>
    </div>
  );

  function renderGroup(key: Tier) {
    const def = GROUP_DEFS.find((d) => d.key === key)!;
    const items = groups.g[key];
    if (!items.length) return null;
    return (
      <div className={`dr-group ${key}`} key={key}>
        <div className="dr-group-head">
          <span className="dr-group-icon">{def.icon}</span>
          <span className="dr-group-label">{def.label}</span>
          <span className="dr-group-count">{items.length}</span>
        </div>
        {items.map((d) => {
          const spare = d.totalCap - total;
          const discStr = d.disc.map((dc) => (dc === 'mtb' ? 'MTB' : dc[0].toUpperCase() + dc.slice(1))).join('/');
          let detail: string;
          if (key === 'ok' || key === 'warn') {
            detail = `${d.totalCap}T capacity · max ${d.maxSprocket}T cog${spare >= 0 ? ' · ' + (spare > 0 ? '+' : '') + spare + 'T to spare' : ''}`;
          } else {
            const parts: string[] = [];
            if (d.status === 'no-cap' || d.status === 'no-both') parts.push(`needs ${total}T, rated ${d.totalCap}T`);
            if (d.status === 'no-sprocket' || d.status === 'no-both') parts.push(`your ${bigCog}T cog exceeds ${d.maxSprocket}T max`);
            detail = parts.join(' · ');
          }
          return (
            <div className="dr-card" key={`${d.brand}-${d.name}`}>
              <div className="dr-dot" style={{ background: BRAND_COLOR[d.brand] }} />
              <div className="dr-info">
                <div className="dr-name">{d.name}</div>
                <div className="dr-detail">{detail}</div>
              </div>
              <div className="dr-tags">
                <span className="dr-tag">{d.speed}s</span>
                <span className="dr-tag">{d.cage}</span>
                <span className="dr-tag">{discStr}</span>
              </div>
              <div className="dr-status">{def.icon}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // On mobile, the buy-card sits right before the "Exceeds Capacity" (red)
  // group so it's seen before the bad news — falls back to the end of the
  // results list if there's no red group this render. On desktop it's
  // always the first thing in the rail sidebar (rendered separately below,
  // never inside this list).
  const hasNoGroup = groups.g.no.length > 0;
  const resultBlocks: React.ReactNode[] = [];
  (['ok', 'warn'] as Tier[]).forEach((k) => {
    const el = renderGroup(k);
    if (el) resultBlocks.push(el);
  });
  if (isMobile) {
    resultBlocks.push(<div key="buy-card-mobile" style={{ margin: '12px 0' }}>{buyCard}</div>);
  }
  const noEl = renderGroup('no');
  if (noEl) resultBlocks.push(noEl);

  return (
    <div className="calc-grid">
      <div className="input-panel glass">
        <div className="panel-head">Your Drivetrain</div>
        <div className="form-body">
          <div>
            <div className="form-label">Drivetrain Type</div>
            <div className="mode-toggle">
              <button type="button" className={`mode-btn${mode === '2x' ? ' active' : ''}`} onClick={() => setModeState('2x')}>2× Double</button>
              <button type="button" className={`mode-btn${mode === '1x' ? ' active' : ''}`} onClick={() => setModeState('1x')}>1× Single</button>
            </div>
          </div>

          <div>
            <div className="form-label">Chainrings</div>
            <div className="teeth-row">
              <div className="teeth-cell">
                <div className="form-label">Big Ring</div>
                <div className="teeth-spinner">
                  <button type="button" className="teeth-btn" onClick={() => adj('bigRing', -1)}>−</button>
                  <div className="teeth-val">{bigRing}<span className="teeth-unit">T</span></div>
                  <button type="button" className="teeth-btn" onClick={() => adj('bigRing', 1)}>+</button>
                </div>
              </div>
              <div className="teeth-sep" style={{ visibility: mode === '2x' ? 'visible' : 'hidden' }}>−</div>
              <div className="teeth-cell" style={{ visibility: mode === '2x' ? 'visible' : 'hidden' }}>
                <div className="form-label">Small Ring</div>
                <div className="teeth-spinner">
                  <button type="button" className="teeth-btn" onClick={() => adj('smallRing', -1)}>−</button>
                  <div className="teeth-val">{smallRing}<span className="teeth-unit">T</span></div>
                  <button type="button" className="teeth-btn" onClick={() => adj('smallRing', 1)}>+</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="form-label">Cassette Range</div>
            <div className="teeth-row">
              <div className="teeth-cell">
                <div className="form-label">Big Cog</div>
                <div className="teeth-spinner">
                  <button type="button" className="teeth-btn" onClick={() => adj('bigCog', -1)}>−</button>
                  <div className="teeth-val">{bigCog}<span className="teeth-unit">T</span></div>
                  <button type="button" className="teeth-btn" onClick={() => adj('bigCog', 1)}>+</button>
                </div>
              </div>
              <div className="teeth-sep">−</div>
              <div className="teeth-cell">
                <div className="form-label">Small Cog</div>
                <div className="teeth-spinner">
                  <button type="button" className="teeth-btn" onClick={() => adj('smallCog', -1)}>−</button>
                  <div className="teeth-val">{smallCog}<span className="teeth-unit">T</span></div>
                  <button type="button" className="teeth-btn" onClick={() => adj('smallCog', 1)}>+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="cap-box">
            <div className="cap-formula">
              {mode === '1x' ? (
                <div className="cap-term"><div className="cap-num">{rearDiff}T</div><div className="cap-sub">{bigCog}T − {smallCog}T cassette</div></div>
              ) : (
                <>
                  <div className="cap-term"><div className="cap-num">{frontDiff}T</div><div className="cap-sub">{bigRing}−{smallRing} front</div></div>
                  <div className="cap-op">+</div>
                  <div className="cap-term"><div className="cap-num">{rearDiff}T</div><div className="cap-sub">{bigCog}−{smallCog} rear</div></div>
                  <div className="cap-op">=</div>
                  <div className="cap-term"><div className="cap-num" style={{ color: '#12b05f' }}>{total}T</div><div className="cap-sub">total</div></div>
                </>
              )}
            </div>
            <div className="cap-total">
              <div className="cap-total-num">{total}T</div>
              <div className="cap-total-lbl">Required Capacity</div>
            </div>
          </div>
        </div>
      </div>

      <div className="results">
        <div className="filter-bar">
          <div className="filter-group">
            <button type="button" className={`filter-btn${brandFilter === 'all' ? ' active' : ''}`} onClick={() => setBrandFilter('all')}>All Brands</button>
            <button type="button" data-fbrand="shimano" className={`filter-btn${brandFilter === 'shimano' ? ' active' : ''}`} onClick={() => setBrandFilter('shimano')}>Shimano</button>
            <button type="button" data-fbrand="sram" className={`filter-btn${brandFilter === 'sram' ? ' active' : ''}`} onClick={() => setBrandFilter('sram')}>SRAM</button>
            <button type="button" data-fbrand="campagnolo" className={`filter-btn${brandFilter === 'campagnolo' ? ' active' : ''}`} onClick={() => setBrandFilter('campagnolo')}>Campagnolo</button>
          </div>
          <div className="filter-group">
            <button type="button" className={`filter-btn${discFilter === 'all' ? ' active' : ''}`} onClick={() => setDiscFilter('all')}>All Types</button>
            <button type="button" className={`filter-btn${discFilter === 'road' ? ' active' : ''}`} onClick={() => setDiscFilter('road')}>Road</button>
            <button type="button" className={`filter-btn${discFilter === 'mtb' ? ' active' : ''}`} onClick={() => setDiscFilter('mtb')}>MTB</button>
            <button type="button" className={`filter-btn${discFilter === 'gravel' ? ' active' : ''}`} onClick={() => setDiscFilter('gravel')}>Gravel</button>
          </div>
        </div>

        <div className="result-summary">
          <strong>{okCount}</strong> of <strong>{groups.list.length}</strong> derailleurs within spec for <strong>{total}T</strong> required capacity
        </div>

        <div id="results-list">
          {resultBlocks.length ? resultBlocks : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No derailleurs match your filters</div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="rail">
          {buyCard}
          <div className="rail-card">
            <div className="rail-head">How It Works</div>
            <div className="rail-body">
              <div className="tip-text">
                <p><strong>Required capacity</strong> = (big ring − small ring) + (big cog − small cog). Your derailleur&apos;s rated total capacity must be at or above this number.</p>
                <p><strong>Max sprocket</strong> is a separate hard limit — the derailleur arm must physically reach your biggest cog regardless of the capacity figure.</p>
                <p><strong>Marginal</strong> means within 3T of the limit. May shift fine with B-screw adjustment, but you&apos;re outside the manufacturer&apos;s guaranteed range.</p>
                <p><strong>1× drivetrains</strong> have no front chainring difference, so required capacity equals cassette range only.</p>
              </div>
            </div>
          </div>
          <div className="rail-card">
            <div className="rail-head">Cage Lengths</div>
            <div className="rail-body">
              <div className="tip-text">
                <p><strong>SS (short cage)</strong> — lighter, stiffer. For compact doubles (50/34) with tight cassettes (11–28T). Lower total capacity.</p>
                <p><strong>GS (medium cage)</strong> — standard for most road and gravel. Handles typical 2× setups and moderately wide cassettes to ~36T.</p>
                <p><strong>SGS / long cage</strong> — MTB and touring. Required for large cassettes (40T+).</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
