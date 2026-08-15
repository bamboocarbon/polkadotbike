/**
 * Gradient -> colour scale (tasksheet Phase 4). Bold, flat, no-fade UCI hex
 * values (same as the Gear Ratio Calculator's step-band chart), but with
 * thresholds tuned to match real climb-profile tools (climbfinder.com's own
 * Alto de Velefique profile + a Mt Teide reference, both supplied by Robin
 * 2026-08-13) rather than the Gear Calculator's own 10%/14% cutoffs — those
 * references put yellow starting around 5% and red starting around 9%.
 */
import * as THREE from 'three';

export interface GradientBand {
  maxPct: number | null; // null = open-ended (the top band)
  hex: string;
  label: string;
}

// The legend table, in order. `maxPct` is each band's upper (exclusive)
// bound.
export const GRADIENT_BANDS: GradientBand[] = [
  { maxPct: 5, hex: '#12b05f', label: 'Steady' },
  { maxPct: 9, hex: '#ffcd00', label: 'Hard' },
  { maxPct: null, hex: '#ee1c28', label: 'Brutal' },
];

const BAND_COLORS = GRADIENT_BANDS.map((b) => new THREE.Color(b.hex));

/** Gradient (%) -> flat band colour — no blending between bands. */
export function colourForGradient(pct: number): THREE.Color {
  for (let i = 0; i < GRADIENT_BANDS.length; i++) {
    const maxPct = GRADIENT_BANDS[i].maxPct;
    if (maxPct === null || pct < maxPct) return BAND_COLORS[i];
  }
  return BAND_COLORS[BAND_COLORS.length - 1];
}
