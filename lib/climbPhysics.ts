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
