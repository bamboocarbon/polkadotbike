/**
 * Ribbon geometry builder with three morph-target states (tasksheet Phase 3):
 * A (flat plan), B (route raised by elevation), C (straightened wedge
 * profile). Same vertex count and topology across all three — only
 * positions differ. Topology is generated once from the plan-view geometry
 * (state A/B share the same x/z; only elevation differs), since that's the
 * only state where the road actually turns.
 */
import * as THREE from 'three';
import { colourForGradient } from './gradientColour';

export interface RoutePoint {
  lat: number;
  lon: number;
  x: number;
  z: number;
  distanceM: number;
  elevationM: number;
  gradientPct: number;
  radiusM: number;
  bearingDeg: number;
}

interface Vec2 {
  x: number;
  z: number;
}

const MITER_MAX_MULT = 2.5;
const SHARP_ANGLE_DEG = 100;
const FAN_VERTS = 4; // within the spec's 3-5 range
const WALL_DARKEN = 0.75; // ~25% darker than the top face

function sub2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, z: a.z - b.z };
}
function add2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}
function scale2(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, z: a.z * s };
}
function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.z * b.z;
}
function len2(a: Vec2): number {
  return Math.hypot(a.x, a.z);
}
function normalize2(a: Vec2): Vec2 {
  const l = len2(a);
  return l < 1e-9 ? { x: 0, z: 0 } : scale2(a, 1 / l);
}
// 90 degree rotation — an arbitrary but fixed handedness, consistently
// applied; which physical side it lands on doesn't matter as long as it's
// the same convention everywhere.
function rotate90(a: Vec2): Vec2 {
  return { x: -a.z, z: a.x };
}
function acosSafe(x: number): number {
  return Math.acos(Math.max(-1, Math.min(1, x)));
}

// Bisector miter: offset along the average of the two edge normals, scaled
// so its projection onto each edge normal equals halfWidth. Self-clamps via
// the cosHalf floor rather than a separate branch — algebraically identical
// to clamping miterLen to halfWidth*MITER_MAX_MULT directly.
function computeMiter(edgeIn: Vec2, edgeOut: Vec2, halfWidth: number): Vec2 {
  const sum = add2(edgeIn, edgeOut);
  const sumLen = len2(sum);
  if (sumLen < 1e-6) {
    // Near-180 degree reversal for this side — no meaningful bisector.
    return scale2(edgeIn, halfWidth * MITER_MAX_MULT);
  }
  const miterDir = scale2(sum, 1 / sumLen);
  const cosHalf = Math.max(dot2(miterDir, edgeIn), 1 / MITER_MAX_MULT);
  const miterLen = halfWidth / cosHalf;
  return scale2(miterDir, miterLen);
}

export interface Slot {
  routeIndex: number;
  offset: [Vec2, Vec2]; // [side +1, side -1], in the plan (x,z) plane
}

/** Built once from plan-view (x,z) — the only geometry where the road turns. */
function buildSlotPlan(route: RoutePoint[], halfWidth: number): Slot[] {
  const n = route.length;
  const pt = (i: number): Vec2 => ({ x: route[i].x, z: route[i].z });
  const slots: Slot[] = [];

  for (let i = 0; i < n; i++) {
    if (i === 0 || i === n - 1) {
      const dir = normalize2(i === 0 ? sub2(pt(1), pt(0)) : sub2(pt(n - 1), pt(n - 2)));
      const perp = rotate90(dir);
      slots.push({ routeIndex: i, offset: [scale2(perp, halfWidth), scale2(perp, -halfWidth)] });
      continue;
    }

    const dirIn = normalize2(sub2(pt(i), pt(i - 1)));
    const dirOut = normalize2(sub2(pt(i + 1), pt(i)));
    const perpIn = rotate90(dirIn);
    const perpOut = rotate90(dirOut);

    const vecToPrev = normalize2(sub2(pt(i - 1), pt(i)));
    const vecToNext = normalize2(sub2(pt(i + 1), pt(i)));
    const interiorAngleDeg = (acosSafe(dot2(vecToPrev, vecToNext)) * 180) / Math.PI;
    const crossVal = dirIn.x * dirOut.z - dirIn.z * dirOut.x;

    if (interiorAngleDeg >= SHARP_ANGLE_DEG) {
      const offsetPlus = computeMiter(perpIn, perpOut, halfWidth);
      const offsetMinus = computeMiter(scale2(perpIn, -1), scale2(perpOut, -1), halfWidth);
      slots.push({ routeIndex: i, offset: [offsetPlus, offsetMinus] });
      continue;
    }

    // Sharp bend: the convex (outer) side gets a round-join fan of evenly
    // spaced vertices on a halfWidth-radius arc from perpIn to perpOut; the
    // concave (inner) side reuses one clamped-miter vertex, repeated for
    // every fan slot, per (tasksheet 3.2) — the resulting degenerate quads
    // on that side are invisible and deliberately not optimised away, same
    // as the collapsed-hairpin joins in state C (1.1).
    const convexSide: 1 | -1 = crossVal > 0 ? -1 : 1;
    const concaveSide: 1 | -1 = convexSide === 1 ? -1 : 1;
    const concaveOffset = computeMiter(scale2(perpIn, concaveSide), scale2(perpOut, concaveSide), halfWidth);

    const edgeIn = scale2(perpIn, convexSide);
    const edgeOut = scale2(perpOut, convexSide);
    const angleIn = Math.atan2(edgeIn.z, edgeIn.x);
    const angleOut = Math.atan2(edgeOut.z, edgeOut.x);
    let delta = angleOut - angleIn;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;

    for (let k = 0; k < FAN_VERTS; k++) {
      const frac = k / (FAN_VERTS - 1);
      const ang = angleIn + delta * frac;
      const fanOffset: Vec2 = { x: Math.cos(ang) * halfWidth, z: Math.sin(ang) * halfWidth };
      const offset: [Vec2, Vec2] = convexSide === 1 ? [fanOffset, concaveOffset] : [concaveOffset, fanOffset];
      slots.push({ routeIndex: i, offset });
    }
  }

  return slots;
}

export type MorphState = 'plan' | 'route' | 'wedge';

/** Per-slot centre position for a given state — the only thing that differs. */
function centreForState(route: RoutePoint[], slot: Slot, state: MorphState, exaggeration: number): { x: number; y: number; z: number } {
  const p = route[slot.routeIndex];
  if (state === 'wedge' || state === 'route') {
    // Baseline-anchored, not sea-level-anchored: neither the wedge (a
    // synthetic straightened profile chart) nor this 'route' ribbon (the
    // Route flat-map view -- a real winding road, but over a flat 2D
    // basemap image, not a real elevation-mapped terrain mesh) has anything
    // to align with at true absolute altitude, so both read like the
    // site's own gradient-card charts, which always start flush against
    // the bottom axis regardless of the climb's true altitude. Without
    // this, a climb starting high up (e.g. Mont-Louis at 744m) rendered as
    // a tall blank wall down to y=0 before the profile even began. The
    // true start altitude is still shown as a label (WedgeAltitudeLines in
    // DebugScene.tsx), just not baked into the geometry's height. This is
    // the ONE 'route' user -- the real-terrain view (Route 3D terrain) is
    // built entirely separately (TerrainMesh + RouteHighlight in
    // DebugScene.tsx), never through this morph target, so it's
    // unaffected and correctly keeps true elevation.
    const y = (p.elevationM - route[0].elevationM) * exaggeration;
    if (state === 'wedge') return { x: p.distanceM, y, z: 0 };
    return { x: p.x, y, z: p.z };
  }
  return { x: p.x, y: 0, z: p.z }; // 'plan' -- always flat, no elevation shown
}

/** Per-slot plan-plane offset for a given state — fixed to +-z in wedge, since there's no turning once the road is a straight profile. */
function offsetForState(slot: Slot, side: 0 | 1, halfWidth: number, state: MorphState): Vec2 {
  if (state === 'wedge') return { x: 0, z: side === 0 ? halfWidth : -halfWidth };
  return slot.offset[side];
}

interface BuiltState {
  positions: Float32Array;
}

function buildStateArrays(
  route: RoutePoint[],
  slots: Slot[],
  state: MorphState,
  halfWidth: number,
  exaggeration: number
): BuiltState {
  const n = slots.length;
  // top[side][slot], bottom[side][slot] — 3 floats each.
  const top: [Float32Array, Float32Array] = [new Float32Array(n * 3), new Float32Array(n * 3)];
  const bottom: [Float32Array, Float32Array] = [new Float32Array(n * 3), new Float32Array(n * 3)];

  for (let i = 0; i < n; i++) {
    const c = centreForState(route, slots[i], state, exaggeration);
    for (const side of [0, 1] as const) {
      const off = offsetForState(slots[i], side, halfWidth, state);
      top[side][i * 3] = c.x + off.x;
      top[side][i * 3 + 1] = c.y;
      top[side][i * 3 + 2] = c.z + off.z;
      bottom[side][i * 3] = c.x + off.x;
      bottom[side][i * 3 + 1] = 0;
      bottom[side][i * 3 + 2] = c.z + off.z;
    }
  }

  const positions: number[] = [];

  function pushTri(a: number[], b: number[], c: number[]) {
    positions.push(...a, ...b, ...c);
  }

  function get(arr: Float32Array, i: number): number[] {
    return [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]];
  }

  for (let j = 0; j < n - 1; j++) {
    const j1 = j + 1;

    // Top face: side0[j], side0[j1], side1[j1], side1[j] — two triangles.
    const t00 = get(top[0], j);
    const t01 = get(top[0], j1);
    const t10 = get(top[1], j1);
    const t11 = get(top[1], j);
    pushTri(t00, t01, t10);
    pushTri(t00, t10, t11);

    // Side-0 wall: top0[j], top0[j1], bottom0[j1], bottom0[j].
    const b00 = get(bottom[0], j);
    const b01 = get(bottom[0], j1);
    pushTri(t01, t00, b00);
    pushTri(t01, b00, b01);

    // Side-1 wall: opposite winding (outward normal faces the other way).
    const b10 = get(bottom[1], j1);
    const b11 = get(bottom[1], j);
    pushTri(t10, t11, b11);
    pushTri(t10, b11, b10);
  }

  // End caps.
  {
    const t00 = get(top[0], 0);
    const t10 = get(top[1], 0);
    const b00 = get(bottom[0], 0);
    const b10 = get(bottom[1], 0);
    pushTri(t00, b00, b10);
    pushTri(t00, b10, t10);

    const last = n - 1;
    const t0n = get(top[0], last);
    const t1n = get(top[1], last);
    const b0n = get(bottom[0], last);
    const b1n = get(bottom[1], last);
    pushTri(t1n, b1n, b0n);
    pushTri(t1n, b0n, t0n);
  }

  return { positions: new Float32Array(positions) };
}

// Per-vertex ribbon colours, built to exactly match buildStateArrays'
// triangle order/count (18 verts/segment: 6 top + 6 + 6 side walls, then 12
// for the two end caps) so this can be regenerated on its own — independent
// of the (expensive, topology-rebuilding) position arrays — whenever the
// smoothing window changes. `gradients` is parallel to `route`.
export function buildRibbonColors(route: RoutePoint[], slots: Slot[], gradients: number[]): Float32Array {
  const n = slots.length;
  const colors: number[] = [];

  function pushColor(col: THREE.Color, darken: number, vertCount: number) {
    const r = col.r * darken;
    const g = col.g * darken;
    const b = col.b * darken;
    for (let k = 0; k < vertCount; k++) colors.push(r, g, b);
  }

  function segColor(j: number, j1: number): THREE.Color {
    const g = (gradients[slots[j].routeIndex] + gradients[slots[j1].routeIndex]) / 2;
    return colourForGradient(g);
  }

  for (let j = 0; j < n - 1; j++) {
    const col = segColor(j, j + 1);
    pushColor(col, 1, 6); // top face: 2 tris
    pushColor(col, WALL_DARKEN, 6); // side-0 wall: 2 tris
    pushColor(col, WALL_DARKEN, 6); // side-1 wall: 2 tris
  }

  const col0 = segColor(0, Math.min(1, n - 1));
  pushColor(col0, WALL_DARKEN, 6); // start cap: 2 tris

  const last = n - 1;
  const colN = segColor(Math.max(0, last - 1), last);
  pushColor(colN, WALL_DARKEN, 6); // end cap: 2 tris

  return new Float32Array(colors);
}

// Resamples each point's gradient over a wider `windowM` baseline (elevation
// change between distanceM-windowM/2 and distanceM+windowM/2, rather than
// the original build-time adjacent-point gradient) to smooth out small local
// changes — a slider control over this window lets the ribbon's colouring
// be de-noised interactively without re-fetching/rebuilding route data.
// windowM<=0 returns the original per-point gradients unchanged (max detail).
export function smoothGradients(route: RoutePoint[], windowM: number): number[] {
  const n = route.length;
  if (windowM <= 0 || n < 2) return route.map((p) => p.gradientPct);
  const total = route[n - 1].distanceM;
  const half = windowM / 2;

  // Monotonic cursors — d0/d1 only increase as we walk the route in order,
  // so each cursor advances at most n times total across the whole map()
  // rather than rescanning from 0 every call (O(n) total, not O(n^2)).
  const makeElevAt = () => {
    let i = 0;
    return (d: number): number => {
      d = Math.max(0, Math.min(total, d));
      while (i < n - 2 && route[i + 1].distanceM < d) i++;
      const p0 = route[i];
      const p1 = route[Math.min(i + 1, n - 1)];
      const t = p1.distanceM > p0.distanceM ? (d - p0.distanceM) / (p1.distanceM - p0.distanceM) : 0;
      return p0.elevationM + (p1.elevationM - p0.elevationM) * t;
    };
  };
  const elevAtLo = makeElevAt();
  const elevAtHi = makeElevAt();

  return route.map((p) => {
    const d0 = Math.max(0, p.distanceM - half);
    const d1 = Math.min(total, p.distanceM + half);
    const span = d1 - d0;
    if (span < 1e-6) return p.gradientPct;
    return ((elevAtHi(d1) - elevAtLo(d0)) / span) * 100;
  });
}

export function computeExaggeration(lengthM: number, totalAscentM: number): number {
  return Math.max(3, Math.min(15, (lengthM * 0.22) / totalAscentM));
}

export interface MorphBuildResult {
  geometry: THREE.BufferGeometry;
  exaggeration: number;
  slots: Slot[];
}

export function buildMorphGeometry(route: RoutePoint[], opts: { widthM: number; exaggeration?: number }): MorphBuildResult {
  const halfWidth = opts.widthM / 2;
  const lengthM = route[route.length - 1].distanceM;
  let totalAscentM = 0;
  for (let i = 1; i < route.length; i++) totalAscentM += Math.max(0, route[i].elevationM - route[i - 1].elevationM);
  const exaggeration = opts.exaggeration ?? computeExaggeration(lengthM, totalAscentM);

  const slots = buildSlotPlan(route, halfWidth);

  const planState = buildStateArrays(route, slots, 'plan', halfWidth, exaggeration);
  const routeState = buildStateArrays(route, slots, 'route', halfWidth, exaggeration);
  const wedgeState = buildStateArrays(route, slots, 'wedge', halfWidth, exaggeration);

  // Base geometry = state A (plan); morph targets = B, C. Normals computed
  // independently per state (three temporary geometries) so lighting
  // doesn't slide wrong mid-morph (3.3).
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(planState.positions, 3));
  const initialColors = buildRibbonColors(route, slots, route.map((p) => p.gradientPct));
  geometry.setAttribute('color', new THREE.BufferAttribute(initialColors, 3));
  geometry.computeVertexNormals();

  const routeGeom = new THREE.BufferGeometry();
  routeGeom.setAttribute('position', new THREE.BufferAttribute(routeState.positions, 3));
  routeGeom.computeVertexNormals();

  const wedgeGeom = new THREE.BufferGeometry();
  wedgeGeom.setAttribute('position', new THREE.BufferAttribute(wedgeState.positions, 3));
  wedgeGeom.computeVertexNormals();

  geometry.morphAttributes.position = [
    new THREE.BufferAttribute(routeState.positions, 3),
    new THREE.BufferAttribute(wedgeState.positions, 3),
  ];
  geometry.morphAttributes.normal = [
    routeGeom.getAttribute('normal') as THREE.BufferAttribute,
    wedgeGeom.getAttribute('normal') as THREE.BufferAttribute,
  ];
  geometry.morphTargetsRelative = false;

  return { geometry, exaggeration, slots };
}
