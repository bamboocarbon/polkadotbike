// The site's cross-tool shared setup, stored under localStorage key
// 'cg_shared'. Written and read by index.html/climb.html/compare.html/
// wkg.html (and their Next.js equivalents as they migrate) — a growing bag
// of key-value pairs, not a fixed schema owned by any one tool: each page
// only reads the fields it cares about and merges its own fields back in,
// exactly like the original inline-script pattern
// (`JSON.parse(localStorage.getItem('cg_shared')||'{}')`, mutate, write
// back) — so a page must never overwrite the whole object, only merge.
//
// Known fields so far (wkg.html only, until climb/compare/index migrate):
//   pw     — FTP, watts
//   wt     — system weight (body + bike), kg, always kg regardless of display unit
//   bwt    — body weight, kg
//   bkw    — bike weight, kg
//   gender — 'male' | 'female'
//   wunit  — 'kg' | 'lbs', the display unit (weights are still stored in kg)
//   age    — years
// Other fields (d/b/g/cr/cs/w/cad/cda/ck — drivetrain/groupset/wheel/
// cadence/CdA/custom-config, referenced by lib/raceHelpers.ts's
// buildPlanUrl) belong to climb.html/index.html/compare.html and aren't
// modelled here yet — untyped fields pass through this helper untouched.

export type SharedSetup = Record<string, unknown>;

export function readSharedSetup(): SharedSetup {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('cg_shared') || '{}');
  } catch {
    return {};
  }
}

export function writeSharedSetup(partial: SharedSetup): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readSharedSetup();
    localStorage.setItem('cg_shared', JSON.stringify({ ...current, ...partial }));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the page
    // still works, it just won't carry the setup to the other tools.
  }
}
