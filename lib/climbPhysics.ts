// Ported verbatim from climb.html's PHYSICS block. (speedAtPower() exists in
// the source too but is never actually called anywhere in that file — dead
// code, not ported here, consistent with not carrying forward unused code.)

export function calcPower(speedKmh: number, mass: number, gradePct: number, cda: number, crr: number): number {
  const v = speedKmh / 3.6;
  const g = 9.81, Crr = crr ?? 0.004, rho = 1.225;
  const gr = Math.atan(gradePct / 100);
  const Fg = mass * g * Math.sin(gr);
  const Fr = Crr * mass * g * Math.cos(gr);
  const Fa = 0.5 * rho * cda * v * v;
  return Math.max(0, (Fg + Fr + Fa) * v);
}

// Inverse of calcPower: the speed a fixed power output actually sustains at
// a given gradient. calcPower(v) is monotonic non-decreasing in v (the drag
// term is v^3 and always adds; the gravity+rolling term is a constant force
// times v, non-negative on a climb) even where calcPower's own Math.max(0,
// ...) clamp makes it flat at exactly 0 up to some v (a low/negative
// gradient where gravity alone would carry the rider) — bisection still
// converges correctly through that flat region since a flat power(0)=power
// segment just means "any v up to the clamp point also satisfies power=0",
// and bisection naturally lands on the boundary. Used to turn a rider's
// power+weight into a real climb-time estimate (lib/climbTimeEstimate.ts).
export function speedFromPower(powerW: number, mass: number, gradePct: number, cda: number, crr: number): number {
  if (powerW <= 0) return 0;
  let lo = 0, hi = 150; // km/h — far beyond any real climbing speed
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (calcPower(mid, mass, gradePct, cda, crr) < powerW) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
