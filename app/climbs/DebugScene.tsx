'use client';

/**
 * SCRATCH debug scene for Phase 3 geometry verification — not part of the
 * shipped site. Delete once the ribbon shape is confirmed clean, or once
 * the real ClimbMorph3D component (Phase 5) supersedes it.
 *
 * Parameterized by `slug` (2026-08-13) so additional climbs can be pointed
 * at without code changes, once their GPX/roadbook-anchors/basemap/terrain
 * pipeline has been run — see project_cyclegear_climb_3d.md memory. Route
 * data is fetched at runtime from public/climbs/routes/{slug}.json (a
 * public/ copy build-climb-routes.ts now writes alongside its data/ output)
 * rather than a static import, since a static import can't be keyed by a
 * value only known at request time.
 */
import { Canvas, useThree, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text, Billboard } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { buildMorphGeometry, buildRibbonColors, smoothGradients, computeExaggeration, type RoutePoint } from '@/lib/climbs/morphGeometry';
import { colourForGradient } from '@/lib/climbs/gradientColour';
import { GPX_PARTIAL_CLIMB_SLUGS, GPX_PARTIAL_CLIMB_CAVEAT } from '@/lib/climbGpxCaveats';

// Gradient-coloured ahead-line + white terrain-following marker on every
// view, replacing the old flat yellow/red split — trialled on col-de-sarenne
// only (2026-08-26), rolled out to every climb (2026-08-27) once confirmed.

// The shared green/yellow/red bands (gradientColour.ts) are tuned for the
// Wedge/Route-flat ribbon and used site-wide — deliberately NOT edited here,
// so this stays scoped to the experiment. Robin: the same colours read as
// "glary" as a thin line over the terrain's own bright basemap (different
// context from the wide, unlit ribbon mesh they were tuned for). Desaturate
// toward grey and darken slightly, same hue, softer punch — tune
// MUTE_DESATURATE/MUTE_DARKEN further if still too strong.
const MUTE_DESATURATE = 0.15; // 0 = original colour, 1 = flat grey — was 0.35, eased off (Robin: "too much")
const MUTE_DARKEN = 0.92; // overall brightness multiplier after desaturating — was 0.82
function mutedGradientColour(pct: number): THREE.Color {
  const c = colourForGradient(pct);
  const grey = (c.r + c.g + c.b) / 3;
  return new THREE.Color(
    (c.r + (grey - c.r) * MUTE_DESATURATE) * MUTE_DARKEN,
    (c.g + (grey - c.g) * MUTE_DESATURATE) * MUTE_DARKEN,
    (c.b + (grey - c.b) * MUTE_DESATURATE) * MUTE_DARKEN
  );
}

// Same knock-back as mutedGradientColour, applied to the white marker
// (Robin: "knock back the white marker the same amount as the red, green,
// yellow") — desaturating white toward its own grey is a no-op (white IS
// already r=g=b), so only MUTE_DARKEN actually does anything here, same
// factor as the gradient colours.
const MUTED_WHITE = new THREE.Color(MUTE_DARKEN, MUTE_DARKEN, MUTE_DARKEN);

export type SceneState = 'A' | 'B' | 'C';
export type MapStyle = 'flat' | 'terrain';

interface RouteData {
  route: RoutePoint[];
  lengthM: number;
  totalAscentM: number;
  exaggeration: number;
}

// Per-climb landmark labels (name + distance-along-route) — found by
// matching the map's own place-name marker to where the route's elevation
// curve crosses that point's known altitude (e.g. Velefique's 925m). Add an
// entry here as each new climb gets this same research done; climbs
// without one still get the start/summit km markers, just no town names.
const LANDMARKS: Record<string, { distanceM: number; label: string }[]> = {
  'alto-de-velefique': [
    { distanceM: 0, label: 'Tabernas' },
    { distanceM: 16460, label: 'Velefique' },
  ],
  'alto-de-aitana': [
    { distanceM: 12073, label: 'Port de Tudons' }, // from the GPX's own embedded waypoint, 7m off the route
  ],
};

// Wider horizontal "footprint" than the raw GPX-projected x/z — validated
// on the two Stage 3 climbs (col-de-mont-louis, font-romeu) before rolling
// out here to every climb. Stretches x/z only, applied once here at the
// source so every consumer (ribbon geometry, terrain mesh/skirt, camera,
// markers) inherits the same wider layout automatically without needing its
// own scaling logic. Elevation (both the route's own exaggeration and the
// terrain heightmap) is untouched — this is the horizontal counterpart to
// computeExaggeration's vertical-only scale, not a general zoom.
const FOOTPRINT_SCALE = 2;

function useRouteData(slug: string): RouteData | null {
  const [data, setData] = useState<RouteData | null>(null);
  useEffect(() => {
    setData(null);
    let cancelled = false;
    fetch(`/climbs/routes/${slug}.json`)
      .then((r) => r.json())
      .then((raw: { points: RoutePoint[] }) => {
        if (cancelled) return;
        const route = raw.points.map((p) => ({ ...p, x: p.x * FOOTPRINT_SCALE, z: p.z * FOOTPRINT_SCALE }));
        const lengthM = route[route.length - 1].distanceM;
        const totalAscentM = route.reduce((sum, p, i) => (i === 0 ? 0 : sum + Math.max(0, p.elevationM - route[i - 1].elevationM)), 0);
        const exaggeration = computeExaggeration(lengthM, totalAscentM);
        setData({ route, lengthM, totalAscentM, exaggeration });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return data;
}

// True absolute (sea-level) elevation is only required where the geometry
// has to align with something *else* built from that same absolute value --
// the real terrain mesh, in Route (3D terrain). Everywhere else (Wedge and
// Route flat map, plus all the bounds/markers/camera math that follows
// them) is baseline-anchored to the climb's own start instead, matching
// centreForState's 'wedge'/'route' handling in morphGeometry.ts -- a climb
// starting high up (e.g. Mont-Louis at 744m) used to render as a tall blank
// wall down to sea level before the profile even began. Plan is its own
// case: always flat, no elevation shown at all.
function elevationY(state: SceneState, mapStyle: MapStyle | undefined, elevM: number, startElevM: number, exaggeration: number): number {
  if (state === 'A') return 0;
  if (state === 'B' && mapStyle === 'terrain') return elevM * exaggeration;
  return (elevM - startElevM) * exaggeration;
}

// Each state's geometry lives in a totally different part of 3D space (C in
// particular: x=distance along [0, lengthM], z~0 — nowhere near A/B's x/z
// footprint) — the camera has to be reframed per state, not just once on
// mount, or switching state leaves the camera pointed at empty space where
// the old state used to be.
function stateBounds(rd: RouteData, state: SceneState, mapStyle?: MapStyle) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  const startElev = rd.route[0].elevationM;
  for (const p of rd.route) {
    const x = state === 'C' ? p.distanceM : p.x;
    const y = elevationY(state, mapStyle, p.elevationM, startElev, rd.exaggeration);
    const z = state === 'C' ? 0 : p.z;
    xMin = Math.min(xMin, x); xMax = Math.max(xMax, x);
    yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
    zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
  }
  const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cz = (zMin + zMax) / 2;
  let diag = Math.hypot(xMax - xMin, yMax - yMin, zMax - zMin) || 1000;
  // Plan/Route show the basemap or terrain, which is padded ~35% wider than
  // the route's own bounding box (scripts/build-climb-basemaps.ts's
  // PAD_PCT) — frame for that wider extent, not just the tight route
  // corridor, or the default view reads as zoomed in relative to the map.
  if (state === 'A' || state === 'B') diag *= 1.7;
  return { cx, cy, cz, diag, yMin, yMax };
}

function RibbonMesh({
  rd,
  influences,
  smoothWindowM,
  visible,
}: {
  rd: RouteData;
  influences: [number, number];
  smoothWindowM: number;
  visible: boolean;
}) {
  // widthM feeds the ribbon MESH, which now only ever renders for Wedge
  // (Route-flat-map's button is gone everywhere, and Plan uses
  // RouteHighlight's thin gradient LINE, not this ribbon) — so unlike the
  // last time this was widened (30->40, 2026-08-13, which also affected
  // Plan/Route's road), this is cleanly scoped to just the Wedge chart
  // bands. Robin: "can we thicken the width of the wedge" (trialled on
  // col-de-sarenne 2026-08-26, rolled out everywhere 2026-08-27).
  const widthM = 500;
  const { geometry, exaggeration, slots } = useMemo(() => buildMorphGeometry(rd.route, { widthM }), [rd, widthM]);

  useEffect(() => {
    console.log('exaggeration:', exaggeration);
  }, [exaggeration]);

  // Only the colour attribute is rebuilt here — positions/normals/morph
  // targets (the expensive part) stay untouched, so dragging the smoothing
  // slider is cheap regardless of how often it fires.
  useEffect(() => {
    const gradients = smoothGradients(rd.route, smoothWindowM);
    // Muted colours to match the Plan/Route(terrain) gradient line, per
    // Robin: "copy the colours... to the wedge" (col-de-sarenne 2026-08-26,
    // rolled out everywhere 2026-08-27).
    const colors = buildRibbonColors(rd.route, slots, gradients, mutedGradientColour);
    const attr = geometry.getAttribute('color') as THREE.BufferAttribute;
    (attr.array as Float32Array).set(colors);
    attr.needsUpdate = true;
  }, [rd, slots, geometry, smoothWindowM]);

  return (
    // morphTargetInfluences set as a direct prop (not ref+useEffect): R3F
    // applies primitive props synchronously during commit, same phase as
    // `geometry`, so three.js's renderer never sees the mesh with morph
    // attributes but a still-undefined influences array — that gap is what
    // threw "objectInfluences.length" (three.js's WebGLMorphtargets reading
    // object.morphTargetInfluences before the old effect-based set ran).
    <mesh geometry={geometry} morphTargetInfluences={influences} visible={visible}>
      {/* Basic (unlit) so the bold green/yellow/red vertex colours render at
          their true, undimmed hex values — matching the flat Gear Calculator
          chart bars exactly — rather than being shaded by the scene's
          ambient/directional lights. Side-wall depth shading still comes
          through via the WALL_DARKEN multiplier already baked into the
          vertex colours themselves (buildRibbonColors), so it isn't lost. */}
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

// Basemap ground plane (Phase 2.2) — only meaningful in Plan view; the
// tasksheet fades it out through the A->B morph, but this debug tool only
// has discrete states, so it's a hard show/hide tied to `visible`.
function BasemapPlane({ slug, visible }: { slug: string; visible: boolean }) {
  const [bounds, setBounds] = useState<{ xMin: number; xMax: number; zMin: number; zMax: number } | null>(null);
  useEffect(() => {
    setBounds(null);
    fetch(`/climbs/basemaps/${slug}.json`)
      .then((r) => r.json())
      .then((d) => {
        // Same FOOTPRINT_SCALE as useRouteData/useTerrainData — this plane
        // is the *flat*-map basemap, a separate bounds source from the
        // terrain one, so it needs its own copy of the scale.
        const b = d.bounds;
        setBounds({ xMin: b.xMin * FOOTPRINT_SCALE, xMax: b.xMax * FOOTPRINT_SCALE, zMin: b.zMin * FOOTPRINT_SCALE, zMax: b.zMax * FOOTPRINT_SCALE });
      });
  }, [slug]);
  const texture = useLoader(THREE.TextureLoader, `/climbs/basemaps/${slug}.webp`);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16; // three.js clamps to the hardware max automatically
  }, [texture]);

  if (!bounds) return null;
  const w = bounds.xMax - bounds.xMin;
  const h = bounds.zMax - bounds.zMin;
  const cx = (bounds.xMin + bounds.xMax) / 2;
  const cz = (bounds.zMin + bounds.zMax) / 2;

  return (
    <mesh position={[cx, -0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} visible={visible}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

interface TerrainData {
  gridN: number;
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
  elevations: number[][];
}

// Shared per-slug so every consumer (TerrainMesh, RouteHighlight,
// SceneControls) reads the exact same data — one fetch each, cached by
// slug, rather than risking independently-loaded copies drifting apart.
const terrainPromises = new Map<string, Promise<TerrainData>>();
function useTerrainData(slug: string): TerrainData | null {
  const [terrain, setTerrain] = useState<TerrainData | null>(null);
  useEffect(() => {
    setTerrain(null);
    if (!terrainPromises.has(slug)) {
      terrainPromises.set(slug, fetch(`/climbs/basemaps/${slug}.terrain.json`).then((r) => r.json()));
    }
    terrainPromises.get(slug)!.then((t) => {
      // Same FOOTPRINT_SCALE as useRouteData — bounds only, so the terrain
      // mesh/skirt grow in step with the route's now-wider x/z. Grid
      // elevations (the height data) are untouched. Scaled about the
      // coordinate origin (0,0) — the same pivot useRouteData scales route
      // x/z about — not the bounds' own center, since those two centers
      // aren't generally the same point (the terrain is padded asymmetrically
      // around the route) and scaling about different pivots would shift the
      // route relative to the terrain instead of keeping them aligned.
      const { xMin, xMax, zMin, zMax } = t.bounds;
      setTerrain({
        ...t,
        bounds: {
          xMin: xMin * FOOTPRINT_SCALE,
          xMax: xMax * FOOTPRINT_SCALE,
          zMin: zMin * FOOTPRINT_SCALE,
          zMax: zMax * FOOTPRINT_SCALE,
        },
      });
    });
  }, [slug]);
  return terrain;
}

// Bilinear sample of the terrain heightmap at world (x,z) — this is what
// lets the highlight line sit exactly on the rendered terrain surface
// rather than at the GPX's own (independently-sourced) elevation, which
// doesn't precisely agree with the DEM at every point.
function terrainElevationAt(terrain: TerrainData, x: number, z: number): number {
  const { gridN, bounds, elevations } = terrain;
  const fx = ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (gridN - 1);
  const fz = ((z - bounds.zMin) / (bounds.zMax - bounds.zMin)) * (gridN - 1);
  const col0 = Math.max(0, Math.min(gridN - 2, Math.floor(fx)));
  const row0 = Math.max(0, Math.min(gridN - 2, Math.floor(fz)));
  const tx = Math.min(1, Math.max(0, fx - col0));
  const tz = Math.min(1, Math.max(0, fz - row0));
  const e00 = elevations[row0][col0];
  const e10 = elevations[row0][col0 + 1];
  const e01 = elevations[row0 + 1][col0];
  const e11 = elevations[row0 + 1][col0 + 1];
  return e00 * (1 - tx) * (1 - tz) + e10 * tx * (1 - tz) + e01 * (1 - tx) * tz + e11 * tx * tz;
}

// PROOF OF CONCEPT terrain relief (2026-08-12) — not a tasksheet phase, see
// project_cyclegear_climb_3d.md memory. Displaces a plane grid by real
// elevation sampled from free Terrarium DEM tiles (scripts/build-climb-
// terrain.ts), draped with the same basemap texture. Only shown in Route
// (state B) — Plan stays conceptually flat per the original design.
function TerrainMesh({ slug, rd, visible }: { slug: string; rd: RouteData; visible: boolean }) {
  const terrain = useTerrainData(slug);
  const texture = useLoader(THREE.TextureLoader, `/climbs/basemaps/${slug}.webp`);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16; // three.js clamps to the hardware max automatically
  }, [texture]);

  const geometry = useMemo(() => {
    if (!terrain) return null;
    const { gridN, bounds, elevations } = terrain;
    const geo = new THREE.PlaneGeometry(bounds.xMax - bounds.xMin, bounds.zMax - bounds.zMin, gridN - 1, gridN - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let row = 0; row < gridN; row++) {
      for (let col = 0; col < gridN; col++) {
        const idx = row * gridN + col;
        pos.setY(idx, elevations[row][col] * rd.exaggeration);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [terrain, rd]);

  if (!terrain || !geometry) return null;
  const cx = (terrain.bounds.xMin + terrain.bounds.xMax) / 2;
  const cz = (terrain.bounds.zMin + terrain.bounds.zMax) / 2;

  return (
    <mesh geometry={geometry} position={[cx, 0, cz]} visible={visible}>
      <meshLambertMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Solid grey walls around the terrain's perimeter (plus a bottom cap) —
// the terrain itself is a single displaced plane with no thickness, so from
// a low/side camera angle you could previously look straight past its edge
// and see the flat basemap plane, contour lines, and route markers floating
// underneath in empty space. This closes it into a "terrain in a box" —
// walls drop from each boundary vertex's actual (elevation-displaced)
// height down to a shared flat base well below the lowest point.
function TerrainSkirt({ slug, rd, visible }: { slug: string; rd: RouteData; visible: boolean }) {
  const terrain = useTerrainData(slug);
  const geometry = useMemo(() => {
    if (!terrain) return null;
    const { gridN, bounds, elevations } = terrain;
    let minY = Infinity;
    for (const row of elevations) for (const e of row) minY = Math.min(minY, e * rd.exaggeration);
    const baseY = minY - 600;

    const xAt = (col: number) => bounds.xMin + (col / (gridN - 1)) * (bounds.xMax - bounds.xMin);
    const zAt = (row: number) => bounds.zMin + (row / (gridN - 1)) * (bounds.zMax - bounds.zMin);
    const yAt = (row: number, col: number) => elevations[row][col] * rd.exaggeration;

    // Perimeter walked in order (top edge, right edge, bottom edge, left
    // edge) so consecutive points are always adjacent — each pair becomes
    // one wall quad, wrapping back to point 0 at the end to close the loop.
    const perim: { x: number; z: number; y: number }[] = [];
    for (let col = 0; col < gridN; col++) perim.push({ x: xAt(col), z: zAt(0), y: yAt(0, col) });
    for (let row = 1; row < gridN; row++) perim.push({ x: xAt(gridN - 1), z: zAt(row), y: yAt(row, gridN - 1) });
    for (let col = gridN - 2; col >= 0; col--) perim.push({ x: xAt(col), z: zAt(gridN - 1), y: yAt(gridN - 1, col) });
    for (let row = gridN - 2; row >= 1; row--) perim.push({ x: xAt(0), z: zAt(row), y: yAt(row, 0) });

    const positions: number[] = [];
    const n = perim.length;
    for (let i = 0; i < n; i++) {
      const a = perim[i];
      const b = perim[(i + 1) % n];
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, b.x, baseY, b.z);
      positions.push(a.x, a.y, a.z, b.x, baseY, b.z, a.x, baseY, a.z);
    }

    // Bottom cap, so looking up from below (or a very low grazing angle)
    // still finds a solid floor rather than the open underside.
    positions.push(bounds.xMin, baseY, bounds.zMin, bounds.xMax, baseY, bounds.zMin, bounds.xMax, baseY, bounds.zMax);
    positions.push(bounds.xMin, baseY, bounds.zMin, bounds.xMax, baseY, bounds.zMax, bounds.xMin, baseY, bounds.zMax);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [terrain, rd]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry} visible={visible}>
      <meshBasicMaterial color="#3c3c3c" side={THREE.DoubleSide} />
    </mesh>
  );
}

// A thick red stroke along the centreline, sitting just above the surface
// underneath it — makes the route legible against the pale basemap in Plan
// and against the terrain now shown in Route too, without fighting the
// green/amber/red gradient fill for attention. In Route mode this follows
// the *terrain's* own elevation, not the GPX's — the two are independent
// data sources that don't precisely agree at every point, so anchoring to
// the GPX left the line intermittently buried under the rendered terrain
// surface.
// The route line doubles as the "you are here" indicator: white from the
// start up to the current travel position, red from there to the summit —
// replaces an earlier separate floating arrow marker (removed) with a
// simpler progress-along-the-climb read. `travelM` splits the line at an
// exact interpolated point (not just the nearest sampled route vertex) so
// the white/red seam tracks the travel slider smoothly rather than jumping
// vertex-to-vertex.
function RouteHighlight({
  rd,
  slug,
  state,
  mapStyle,
  smoothWindowM,
}: {
  rd: RouteData;
  slug: string;
  state: SceneState;
  mapStyle: MapStyle;
  smoothWindowM: number;
}) {
  const terrain = useTerrainData(slug);
  const points = useMemo(() => {
    if (state === 'C') return null;
    // Route (flat map) is no longer reachable via the UI (its button was
    // removed sitewide — see STOPS in ClimbDetailClient.tsx), but this
    // component's props aren't statically guaranteed to exclude it.
    if (state === 'B' && mapStyle === 'flat') return null;
    if (state === 'B') {
      if (mapStyle === 'terrain') {
        if (!terrain) return null;
        return rd.route.map((p) => new THREE.Vector3(p.x, terrainElevationAt(terrain, p.x, p.z) * rd.exaggeration + 15, p.z));
      }
      return rd.route.map((p) => new THREE.Vector3(p.x, p.elevationM * rd.exaggeration + 15, p.z));
    }
    return rd.route.map((p) => new THREE.Vector3(p.x, 15, p.z));
  }, [rd, state, mapStyle, terrain]);

  // One flat colour per route point via the same colourForGradient bands
  // the Wedge/Route-flat ribbon uses. Smoothing window is the same live
  // `smoothWindowM` slider value the ribbon uses (Robin: "we will need the
  // smoothing slider on this screen too") rather than a fixed
  // FOLLOW_SMOOTH_M — see the smoothingSliderVisible gate below, which
  // shows that control on this view too.
  const gradColors = useMemo(() => {
    return smoothGradients(rd.route, smoothWindowM).map((g) => mutedGradientColour(g));
  }, [rd, smoothWindowM]);

  if (!points) return null;

  // Whole-route gradient line, no travelled/not-travelled split — Robin:
  // "can we not paint the route in yellow after we have passed through it,
  // stays the same gradient colours". Covers Plan too (Robin: "copy the
  // route colours, and white marker over to the plan view"), not just
  // Route (3D terrain) — the only two states `points` is ever non-null for.
  // A dedicated white marker (PlanTravelMarker/TerrainTravelMarker) is the
  // position indicator on these views instead of a colour split.
  return points.length > 1 ? <Line points={points} vertexColors={gradColors} lineWidth={6.4} transparent opacity={0.95} /> : null;
}

// Horizontal reference lines at start and summit altitude, offset to the
// side of the ribbon (not through it) so the total rise between them reads
// clearly at a glance.
function WedgeAltitudeLines({ rd, state }: { rd: RouteData; state: SceneState }) {
  const startElev = rd.route[0].elevationM;
  const endElev = rd.route[rd.route.length - 1].elevationM;
  // Relative to the wedge's own baseline-anchored geometry (see
  // centreForState) -- startY is always 0 by construction; the true
  // altitude is still shown in the label text, just not the line height.
  const startY = 0;
  const endY = (endElev - startElev) * rd.exaggeration;
  const zOffset = -80;
  const labelX = -600;

  if (state !== 'C') return null;

  return (
    <>
      <Line points={[[0, startY, zOffset], [rd.lengthM, startY, zOffset]]} color="#999" lineWidth={1.2} dashed dashSize={200} gapSize={150} />
      <Line points={[[0, endY, zOffset], [rd.lengthM, endY, zOffset]]} color="#999" lineWidth={1.2} dashed dashSize={200} gapSize={150} />
      <Billboard position={[labelX, startY, zOffset]}>
        <Text fontSize={180} color="#fff" anchorX="right" anchorY="middle" outlineWidth={3} outlineColor="#000">
          {`${Math.round(startElev)}m start`}
        </Text>
      </Billboard>
      <Billboard position={[labelX, endY, zOffset]}>
        <Text fontSize={180} color="#fff" anchorX="right" anchorY="middle" outlineWidth={3} outlineColor="#000">
          {`${Math.round(endElev)}m summit`}
        </Text>
      </Billboard>
    </>
  );
}

// Wedge-only "you are here" marker — RouteHighlight's white/red split line
// doesn't apply to the wedge (it's a straightened distance profile, not the
// turning route), so this is the only travel-position indicator there. A
// plain opaque cone rather than the Plan/Route views' billboarded arrow
// texture: the wedge is generally viewed from one fairly consistent angle,
// so it doesn't need to face the camera, and an opaque mesh sidesteps the
// whole alphaTest/transparent-queue class of bugs that texture ran into.
function WedgeTravelMarker({ rd, state, travelM }: { rd: RouteData; state: SceneState; travelM: number }) {
  if (state !== 'C') return null;
  const y = (smoothedElevationAt(rd, travelM, FOLLOW_SMOOTH_M) - rd.route[0].elevationM) * rd.exaggeration;
  // Knocked-back white to match the muted gradient ribbon (per Robin: "copy
  // the colours and marker to the wedge").
  return (
    <mesh position={[travelM, y + 160, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[110, 320, 16]} />
      <meshBasicMaterial color={MUTED_WHITE} />
    </mesh>
  );
}

// Same cone as WedgeTravelMarker but white, for the Route (3D terrain) view,
// since RouteHighlight's ahead-line no longer doubles as the position
// indicator once it's coloured by gradient instead of by
// travelled/not-travelled. Samples the terrain DEM directly (not
// positionAtDistance, which drives its elevation from the GPX's own
// smoothed elevation, not the terrain surface) — same terrainElevationAt
// lookup RouteHighlight's own terrain-mode points use, so the marker sits
// on the same surface the line and mesh are already drawn on.
function TerrainTravelMarker({ rd, slug, state, mapStyle, travelM }: { rd: RouteData; slug: string; state: SceneState; mapStyle: MapStyle; travelM: number }) {
  const terrain = useTerrainData(slug);
  if (state !== 'B' || mapStyle !== 'terrain' || !terrain) return null;
  const { route } = rd;
  let lo = 0;
  while (lo < route.length - 2 && route[lo + 1].distanceM < travelM) lo++;
  const p0 = route[lo];
  const p1 = route[Math.min(route.length - 1, lo + 1)];
  const f = p1.distanceM > p0.distanceM ? (travelM - p0.distanceM) / (p1.distanceM - p0.distanceM) : 0;
  const x = p0.x + (p1.x - p0.x) * f;
  const z = p0.z + (p1.z - p0.z) * f;
  const y = terrainElevationAt(terrain, x, z) * rd.exaggeration;
  return (
    <mesh position={[x, y + 160, z]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[110, 320, 16]} />
      <meshBasicMaterial color={MUTED_WHITE} />
    </mesh>
  );
}

// Same white cone as TerrainTravelMarker, for the Plan view. Plan's route
// sits on a fixed flat y=15 (see RouteHighlight's own `points` computation
// for state 'A') rather than a terrain lookup, so no useTerrainData
// dependency needed here.
function PlanTravelMarker({ rd, state, travelM }: { rd: RouteData; state: SceneState; travelM: number }) {
  if (state !== 'A') return null;
  const { route } = rd;
  let lo = 0;
  while (lo < route.length - 2 && route[lo + 1].distanceM < travelM) lo++;
  const p0 = route[lo];
  const p1 = route[Math.min(route.length - 1, lo + 1)];
  const f = p1.distanceM > p0.distanceM ? (travelM - p0.distanceM) / (p1.distanceM - p0.distanceM) : 0;
  const x = p0.x + (p1.x - p0.x) * f;
  const z = p0.z + (p1.z - p0.z) * f;
  return (
    <mesh position={[x, 15 + 160, z]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[110, 320, 16]} />
      <meshBasicMaterial color={MUTED_WHITE} />
    </mesh>
  );
}

interface WedgeMarker {
  distanceM: number;
  label: string;
  kind: 'km' | 'town';
}

function elevationAtDistance(rd: RouteData, distanceM: number): number {
  const { route } = rd;
  let lo = 0;
  while (lo < route.length - 2 && route[lo + 1].distanceM < distanceM) lo++;
  const p0 = route[lo];
  const p1 = route[Math.min(route.length - 1, lo + 1)];
  const f = p1.distanceM > p0.distanceM ? (distanceM - p0.distanceM) / (p1.distanceM - p0.distanceM) : 0;
  return p0.elevationM + (p1.elevationM - p0.elevationM) * f;
}

// Interpolates the route's own per-point gradientPct (Phase 1's centred
// finite-difference, same figure used everywhere else in the pipeline) —
// not re-derived here, just sampled at the slider's current position.
function gradientAtDistance(rd: RouteData, distanceM: number): number {
  const { route } = rd;
  let lo = 0;
  while (lo < route.length - 2 && route[lo + 1].distanceM < distanceM) lo++;
  const p0 = route[lo];
  const p1 = route[Math.min(route.length - 1, lo + 1)];
  const f = p1.distanceM > p0.distanceM ? (distanceM - p0.distanceM) / (p1.distanceM - p0.distanceM) : 0;
  return p0.gradientPct + (p1.gradientPct - p0.gradientPct) * f;
}

// How far to average over when "following the track" (camera flyTo target
// + the yellow travel markers) or reading the live gradient for the gear
// panel — the raw route is real GPX/DEM data resampled every ~15-30m with
// genuine small curvature/elevation noise, which read as jumpy camera
// motion and flickering gear badges when sampled point-by-point at travel
// speed. Doesn't touch the route LINE itself (RouteHighlight/ribbon still
// render full detail) — only these "where are we right now" queries.
const FOLLOW_SMOOTH_M = 200;

// Time constant (ms) for easing the camera toward flyTo's target during
// autoplay — FOLLOW_SMOOTH_M smooths *where* that target sits along the
// route, but says nothing about how the camera gets there frame to frame.
// Without this, flyTo teleports straight to the newly computed position on
// every RAF tick, so any residual noise (notably the terrain-clearance
// lookup, a raw single-point DEM sample under the camera's own x/z, not
// averaged the way the route target's elevation is) reads as visible
// jolting rather than smooth travel. Manual slider drags still call the
// unsmoothed flyTo directly — instant response is what you want there.
const FLY_SMOOTH_TAU_MS = 220;

// Trapezoidal average of elevation over [distanceM-half, distanceM+half],
// not just an interpolated point sample — same reasoning as
// lib/climbs/morphGeometry.ts's smoothGradients, but averaging elevation
// itself rather than deriving a slope, since this feeds a Y position that
// needs to move smoothly, not a colour band.
function smoothedElevationAt(rd: RouteData, distanceM: number, windowM: number): number {
  if (windowM <= 0) return elevationAtDistance(rd, distanceM);
  const { route } = rd;
  const total = route[route.length - 1].distanceM;
  const d0 = Math.max(0, distanceM - windowM / 2);
  const d1 = Math.min(total, distanceM + windowM / 2);
  if (d1 <= d0) return elevationAtDistance(rd, distanceM);

  let lo = 0;
  while (lo < route.length - 2 && route[lo + 1].distanceM < d0) lo++;
  let sum = 0;
  let span = 0;
  let prevD = d0;
  let prevE = elevationAtDistance(rd, d0);
  for (let i = lo; i < route.length && route[i].distanceM < d1; i++) {
    if (route[i].distanceM > prevD) {
      sum += ((prevE + route[i].elevationM) / 2) * (route[i].distanceM - prevD);
      span += route[i].distanceM - prevD;
      prevD = route[i].distanceM;
      prevE = route[i].elevationM;
    }
  }
  const endE = elevationAtDistance(rd, d1);
  if (d1 > prevD) {
    sum += ((prevE + endE) / 2) * (d1 - prevD);
    span += d1 - prevD;
  }
  return span > 0 ? sum / span : elevationAtDistance(rd, distanceM);
}

// Same window, but as a slope (endpoint elevation difference / span) rather
// than an average — this is what should feed the gear-achievability panel,
// same technique as smoothGradients just as a single-point query.
function smoothedGradientAt(rd: RouteData, distanceM: number, windowM: number): number {
  if (windowM <= 0) return gradientAtDistance(rd, distanceM);
  const total = rd.route[rd.route.length - 1].distanceM;
  const d0 = Math.max(0, distanceM - windowM / 2);
  const d1 = Math.min(total, distanceM + windowM / 2);
  const span = d1 - d0;
  if (span < 1e-6) return gradientAtDistance(rd, distanceM);
  return ((elevationAtDistance(rd, d1) - elevationAtDistance(rd, d0)) / span) * 100;
}

// Position at a given distance-along-route, per state: Wedge is a straight
// line along x (its whole point); Plan/Route follow the road's real (x,z),
// only differing in y (flat vs raised). y uses the smoothed elevation (see
// FOLLOW_SMOOTH_M above) so the camera/markers don't bob with every small
// real elevation bump; x/z stay exact so the tracked point never drifts
// off the visible route line.
function positionAtDistance(rd: RouteData, distanceM: number, state: SceneState, mapStyle?: MapStyle): { x: number; y: number; z: number } {
  const { route } = rd;
  const elev = smoothedElevationAt(rd, distanceM, FOLLOW_SMOOTH_M);
  const startElev = route[0].elevationM;
  if (state === 'C') return { x: distanceM, y: elevationY(state, mapStyle, elev, startElev, rd.exaggeration), z: 0 };
  let lo = 0;
  while (lo < route.length - 2 && route[lo + 1].distanceM < distanceM) lo++;
  const p0 = route[lo];
  const p1 = route[Math.min(route.length - 1, lo + 1)];
  const f = p1.distanceM > p0.distanceM ? (distanceM - p0.distanceM) / (p1.distanceM - p0.distanceM) : 0;
  return { x: p0.x + (p1.x - p0.x) * f, y: elevationY(state, mapStyle, elev, startElev, rd.exaggeration), z: p0.z + (p1.z - p0.z) * f };
}

// Kilometre ticks (each carrying both distance and altitude) + any curated
// town landmarks for this slug (LANDMARKS table above — climbs without an
// entry still get start/summit km markers, just no town names). Shown in
// all three states — Plan included, even though it has the basemap's own
// place-name labels too, since the km/altitude figures aren't on the map.
function RouteMarkers({ rd, slug, state, mapStyle }: { rd: RouteData; slug: string; state: SceneState; mapStyle: MapStyle }) {
  const markers: WedgeMarker[] = useMemo(() => {
    const towns = LANDMARKS[slug] ?? [];
    const ms: WedgeMarker[] = towns.map((t) => ({ distanceM: t.distanceM, label: t.label, kind: 'town' as const }));
    for (let km = 5; km < rd.lengthM / 1000; km += 5) {
      ms.push({ distanceM: km * 1000, label: `${km}km · ${Math.round(elevationAtDistance(rd, km * 1000))}m`, kind: 'km' });
    }
    const endElev = rd.route[rd.route.length - 1].elevationM;
    ms.push({ distanceM: rd.lengthM, label: `${(rd.lengthM / 1000).toFixed(1)}km · ${Math.round(endElev)}m · Summit`, kind: 'km' });
    return ms;
  }, [rd, slug]);

  // Same FOOTPRINT_SCALE as the route/terrain/basemap data — tick height,
  // label offset and font size are fixed world-space sizes, so with the
  // wider footprint the camera pulls back further to frame the bigger scene
  // and these would otherwise read as too small at that distance. Scaling
  // them by the same factor keeps them legible.

  return (
    <>
      {markers.map((m, i) => {
        const { x, y, z } = positionAtDistance(rd, m.distanceM, state, mapStyle);
        const isTown = m.kind === 'town';
        const tickTop = y + (isTown ? 900 : 500) * FOOTPRINT_SCALE;
        return (
          <group key={i}>
            <Line points={[[x, y, z], [x, tickTop, z]]} color={isTown ? '#ee1c28' : '#999'} lineWidth={isTown ? 3 : 1.5} />
            <Billboard position={[x, tickTop + 150 * FOOTPRINT_SCALE, z]}>
              <Text
                fontSize={(isTown ? 220 : 170) * FOOTPRINT_SCALE}
                color={isTown ? '#ee1c28' : '#fff'}
                anchorX="center"
                anchorY="bottom"
                outlineWidth={isTown ? 0 : 3}
                outlineColor="#000"
              >
                {m.label}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </>
  );
}

interface ControlsHandle {
  resetView: () => void;
  flyTo: (distanceM: number) => void;
  flyToSmooth: (distanceM: number, dt: number) => void;
}

// Rotates the HTML compass badge (rendered outside the Canvas, off the map
// itself) to track camera yaw every frame — a plain DOM ref write, not React
// state, same reasoning as the bobbing marker: this changes every frame
// during an orbit-drag and would be wasteful to push through re-renders.
// Axis convention (from scripts/build-climb-routes.ts's project()): +X is
// east, -Z is north — so a camera-forward vector's heading is
// atan2(dirX, -dirZ), 0° = looking north, 90° = looking east. Rotating the
// rose by the *negative* of that keeps its "N" pointing at true north on
// screen as the camera orbits.
function CompassUpdater({ compassRef }: { compassRef: React.RefObject<HTMLDivElement> }) {
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!compassRef.current) return;
    camera.getWorldDirection(dir);
    const headingDeg = Math.atan2(dir.x, -dir.z) * (180 / Math.PI);
    compassRef.current.style.transform = `rotate(${-headingDeg}deg)`;
  });
  return null;
}

// Real terrain-mesh extent (not just the route's own bounding box) — the
// terrain is both wider (basemap padding) and taller (its DEM elevation
// range runs beyond the route's own min/max) than the route alone, so
// framing off route bounds under-frames it.
function terrainAwareBounds(rd: RouteData, base: ReturnType<typeof stateBounds>, terrain: TerrainData | null): ReturnType<typeof stateBounds> {
  if (!terrain) return base;
  let yMin = Infinity, yMax = -Infinity;
  for (const row of terrain.elevations) for (const e of row) {
    yMin = Math.min(yMin, e * rd.exaggeration);
    yMax = Math.max(yMax, e * rd.exaggeration);
  }
  const { xMin, xMax, zMin, zMax } = terrain.bounds;
  return {
    cx: (xMin + xMax) / 2,
    cy: (yMin + yMax) / 2,
    cz: (zMin + zMax) / 2,
    diag: Math.hypot(xMax - xMin, yMax - yMin, zMax - zMin),
    yMin,
    yMax,
  };
}

const SceneControls = forwardRef<ControlsHandle, { rd: RouteData; slug: string; state: SceneState; mapStyle: MapStyle }>(
  function SceneControls({ rd, slug, state, mapStyle }, ref) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);
    const terrain = useTerrainData(slug);
    const isTerrain = state === 'B' && mapStyle === 'terrain';
    const bounds = useMemo(() => {
      const base = stateBounds(rd, state, mapStyle);
      return isTerrain ? terrainAwareBounds(rd, base, terrain) : base;
    }, [rd, state, mapStyle, isTerrain, terrain]);

    // Wedge (state 'C') camera distance — Robin: "side on projection, no
    // zoom no rotation... fully framed... does not show whole of climb"
    // (col-d'Ornon, 2026-08-27 — an earlier pass here only fit the height
    // and let flyTo pan sideways to reveal the rest of the length, which
    // read as "not the whole climb"; fixed by fitting BOTH dimensions so
    // the entire wedge is visible at once, permanently). Distance is
    // whichever of (fit the full rise vertically) / (fit the full length
    // horizontally, via the live camera aspect) needs the camera further
    // back — never both are just barely fit, so nothing crops on either
    // axis regardless of a climb's own length:height ratio.
    const WEDGE_FOV_DEG = 45; // must match the Canvas `camera={{ fov: 45 }}` prop below
    // Fixed world-space margins, not a percentage — WedgeAltitudeLines'
    // start/summit labels (both parked at labelX=-600, extending further
    // left via anchorX="right") and RouteMarkers' summit km-marker text
    // (centred on the route's own end point, so half its width overhangs
    // to the right) are a roughly CONSTANT size regardless of the climb's
    // own length, so a percentage-of-length padding badly under-covers
    // short climbs and over-covers long ones. Found by Robin on col-dornon
    // (2026-08-27): the previous 1.3x-of-length padding fit the wedge
    // shape itself but clipped both text labels at the frame edges.
    const WEDGE_MARGIN_X = 2800; // covers the wider of the two label overhangs (right, ~2270; left, ~2000), plus buffer
    const WEDGE_MARGIN_Y = 1800; // covers the summit km-marker's tick+label rising above the ribbon top
    const wedgeCamZ = useMemo(() => {
      if (state !== 'C') return 0;
      const vFovRad = (WEDGE_FOV_DEG * Math.PI) / 180;
      const distForHeight = ((bounds.yMax - bounds.yMin) / 2 + WEDGE_MARGIN_Y) / Math.tan(vFovRad / 2);
      const aspect = camera instanceof THREE.PerspectiveCamera ? camera.aspect : 16 / 9;
      const distForWidth = (rd.lengthM / 2 + WEDGE_MARGIN_X) / (aspect * Math.tan(vFovRad / 2));
      return Math.max(distForHeight, distForWidth);
    }, [state, bounds, rd, camera]);

    // The user's actual desired camera-to-target offset (angle + distance) —
    // updated only by genuine user interaction (handleControlsChange, wired
    // to OrbitControls' own onChange) or a fresh resetView. Deliberately NOT
    // updated by flyTo's terrain-safety clamp below: that clamp corrects
    // *this render's* position only. Writing the clamped result back in here
    // would let it compound — terrain rises overall along this climb, so
    // each clamp nudge would ratchet the effective distance down a little
    // more on every subsequent slider move, reading as progressive zoom-in.
    const desiredOffsetRef = useRef<THREE.Vector3 | null>(null);
    // On terrain, the camera's height is governed by this — its vertical
    // clearance above the actual DEM surface directly beneath it — not by
    // desiredOffsetRef's y-component. Terrain rises and falls a lot along
    // this climb; holding a fixed clearance means the camera rises and falls
    // with the ground (what was asked for), rather than either holding a
    // fixed absolute offset (which could bury it underground on a rise) or
    // the old hard 300-unit clamp (which discarded whatever height the user
    // had actually set).
    const desiredClearanceRef = useRef<number | null>(null);
    // OrbitControls' onChange fires on ANY change .update() produces —
    // including our own programmatic repositioning below, not just real user
    // drags/scrolls. Without this guard, flyTo's own position would get
    // captured straight back into these refs by its own update() call,
    // silently reintroducing the compounding-zoom bug.
    const isProgrammaticRef = useRef(false);

    const handleControlsChange = () => {
      if (isProgrammaticRef.current) return;
      if (controlsRef.current) {
        desiredOffsetRef.current = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
        if (isTerrain && terrain) {
          const camTerrainY = terrainElevationAt(terrain, camera.position.x, camera.position.z) * rd.exaggeration;
          desiredClearanceRef.current = camera.position.y - camTerrainY;
        }
      }
    };

    const resetView = () => {
      if (state === 'C') {
        // Pure side-on elevation — zero tilt, centred on and fully framing
        // the whole climb (see wedgeCamZ above). computeFlyTarget below
        // returns this exact same position for every travel distance, so
        // this is also the permanent view, not just an initial one.
        const camPos = new THREE.Vector3(bounds.cx, bounds.cy, wedgeCamZ);
        desiredOffsetRef.current = new THREE.Vector3(0, 0, wedgeCamZ);
        isProgrammaticRef.current = true;
        camera.position.copy(camPos);
        if (controlsRef.current) {
          controlsRef.current.target.set(bounds.cx, bounds.cy, 0);
          controlsRef.current.update();
        }
        isProgrammaticRef.current = false;
        return;
      }
      // A generic elevated 3/4 view — frames Plan/Route's quite different
      // shapes (spread-out plan, raised route) reasonably well without
      // needing a bespoke angle per state.
      const offset = new THREE.Vector3(0.6, 0.5, 0.6).normalize().multiplyScalar(bounds.diag * 0.8);
      desiredOffsetRef.current = offset.clone();
      const camPos = new THREE.Vector3(bounds.cx + offset.x, bounds.cy + offset.y, bounds.cz + offset.z);
      if (isTerrain && terrain) {
        const camTerrainY = terrainElevationAt(terrain, camPos.x, camPos.z) * rd.exaggeration;
        desiredClearanceRef.current = camPos.y - camTerrainY;
      }
      isProgrammaticRef.current = true;
      camera.position.copy(camPos);
      if (controlsRef.current) {
        controlsRef.current.target.set(bounds.cx, bounds.cy, bounds.cz);
        controlsRef.current.update();
      }
      isProgrammaticRef.current = false;
    };

    // Shared math for flyTo/flyToSmooth below — where the camera and its
    // look-at target *should* be for a given travel distance. Doesn't move
    // anything itself; callers decide whether to snap there instantly or
    // ease toward it.
    const computeFlyTarget = (distanceM: number) => {
      const p = positionAtDistance(rd, distanceM, state, mapStyle);

      if (state === 'C') {
        // Wedge is fully framed on both axes (see wedgeCamZ above) — the
        // whole climb is always visible, so the camera has nothing to
        // track and never moves; only WedgeTravelMarker's cone slides
        // sideways within this fixed frame as travel changes.
        return {
          camPos: new THREE.Vector3(bounds.cx, bounds.cy, wedgeCamZ),
          targetPos: new THREE.Vector3(bounds.cx, bounds.cy, 0),
        };
      }

      let offset = desiredOffsetRef.current;
      if (!offset || offset.lengthSq() < 1) {
        // Degenerate only if flyTo is somehow called before any view has
        // ever been set — fall back to a sensible preset per state. Plan
        // goes straight overhead, further back, since an oblique close-up
        // just magnifies the basemap texture past its native resolution and
        // reads as blurry; flat-map Route needs more room than terrain,
        // since the ribbon towers up as a tall thin wall over a flat plane
        // with nothing around it to give it scale.
        const dir = state === 'A' ? new THREE.Vector3(0, 1, 0.0001).normalize() : new THREE.Vector3(0.5, 0.4, 0.8).normalize();
        const flyDist = state === 'A' ? bounds.diag * 0.16 : bounds.diag * (isTerrain ? 0.14 : 0.22);
        offset = dir.multiplyScalar(flyDist);
        desiredOffsetRef.current = offset.clone();
      }

      const camX = p.x + offset.x;
      const camZ = p.z + offset.z;
      let camY = p.y + offset.y;
      let targetY = p.y;

      if (isTerrain && terrain) {
        const targetTerrainY = terrainElevationAt(terrain, p.x, p.z) * rd.exaggeration;
        targetY = Math.max(targetY, targetTerrainY + 20);
        const camTerrainY = terrainElevationAt(terrain, camX, camZ) * rd.exaggeration;
        const clearance = desiredClearanceRef.current ?? 300;
        camY = camTerrainY + clearance;
      }

      return {
        camPos: new THREE.Vector3(camX, camY, camZ),
        targetPos: new THREE.Vector3(p.x, targetY, p.z),
      };
    };

    // Travel along the route to a specific distance — a close-up view
    // (much nearer than resetView's whole-route framing), so this is the
    // control for actually moving along the climb rather than just orbiting
    // around a fixed point. Snaps instantly; used for direct manipulation
    // (the travel slider) where immediate response is what's wanted.
    const flyTo = (distanceM: number) => {
      const { camPos, targetPos } = computeFlyTarget(distanceM);
      isProgrammaticRef.current = true;
      camera.position.copy(camPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetPos);
        controlsRef.current.update();
      }
      isProgrammaticRef.current = false;
    };

    // Same as flyTo but eases toward the target over FLY_SMOOTH_TAU_MS
    // instead of snapping — see FLY_SMOOTH_TAU_MS for why. `dt` is the real
    // elapsed ms since the last call (the autoplay loop already tracks this
    // for its distance step), so the ease rate stays frame-rate independent.
    const flyToSmooth = (distanceM: number, dt: number) => {
      const { camPos, targetPos } = computeFlyTarget(distanceM);
      const alpha = 1 - Math.exp(-dt / FLY_SMOOTH_TAU_MS);
      isProgrammaticRef.current = true;
      camera.position.lerp(camPos, alpha);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetPos, alpha);
        controlsRef.current.update();
      }
      isProgrammaticRef.current = false;
    };

    useImperativeHandle(ref, () => ({ resetView, flyTo, flyToSmooth }));
    useEffect(resetView, [state, isTerrain, terrain]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        // Wedge: "side on projection, no zoom no rotation" — fully framed
        // and permanently fixed (see wedgeCamZ above), so there's nothing
        // left for the user to rotate or zoom anyway.
        enableRotate={state !== 'C'}
        enableZoom={state !== 'C'}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.02}
        maxPolarAngle={1.5}
        minDistance={bounds.diag * 0.03}
        maxDistance={bounds.diag * 4}
        onChange={handleControlsChange}
        makeDefault
      />
    );
  }
);

export interface TravelInfo {
  distanceM: number;
  gradientPct: number;
  elevationM: number;
}

export default function DebugScene({
  slug,
  influences,
  state,
  mapStyle,
  onTravelChange,
}: {
  slug: string;
  influences: [number, number];
  state: SceneState;
  mapStyle: MapStyle;
  /** Fires on mount (once route data loads) and on every slider move — lets
   *  a parent page (e.g. a gear-achievability panel) react to where the
   *  user currently is on the climb without re-fetching route data itself. */
  onTravelChange?: (info: TravelInfo) => void;
}) {
  const controlsRef = useRef<ControlsHandle>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const [travelKm, setTravelKm] = useState(0);
  // The slider thumb itself drags at fine (1m) granularity for a smooth
  // feel, but the value actually fed into the gradient-smoothing recompute
  // (and shown in the label) snaps to the nearest 50m — Robin: "make the
  // slider move smoothly but only change the smoothing amount in 50m
  // increments." Keeps native drag motion fluid while avoiding a re-smooth
  // recompute on every pixel of movement.
  const [smoothWindowMRaw, setSmoothWindowMRaw] = useState(0);
  const SMOOTH_STEP_M = 50;
  const smoothWindowM = Math.round(smoothWindowMRaw / SMOOTH_STEP_M) * SMOOTH_STEP_M;
  const [isPlaying, setIsPlaying] = useState(false);
  const rd = useRouteData(slug);

  useEffect(() => {
    setTravelKm(0);
    setIsPlaying(false);
  }, [slug]);

  // Play/pause: animates travelKm from wherever it currently sits up to the
  // route's end, whole climb in PLAY_DURATION_S regardless of route length,
  // via requestAnimationFrame (not setInterval) so speed doesn't drift with
  // frame rate — each tick advances by real elapsed time, not a fixed step.
  useEffect(() => {
    if (!isPlaying || !rd) return;
    const PLAY_DURATION_S = 25;
    const ratePerMs = rd.lengthM / (PLAY_DURATION_S * 1000);
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setTravelKm((prev) => {
        const next = Math.min(rd.lengthM, prev + dt * ratePerMs);
        controlsRef.current?.flyToSmooth(next, dt);
        if (next >= rd.lengthM) setIsPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, rd]);

  useEffect(() => {
    if (!rd || !onTravelChange) return;
    onTravelChange({ distanceM: travelKm, gradientPct: smoothedGradientAt(rd, travelKm, FOLLOW_SMOOTH_M), elevationM: elevationAtDistance(rd, travelKm) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rd, travelKm]);

  if (!rd) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'sans-serif' }}>
        Loading {slug}…
      </div>
    );
  }

  // Smoothing affects the Wedge ribbon and RouteHighlight's gradient-coloured
  // line on Plan/Route (3D terrain) — no point showing the control anywhere
  // else, where it has no effect. Route (flat map) no longer exists as a
  // reachable state (see the note in RouteHighlight above).
  const ribbonVisible = state === 'C';
  const smoothingSliderVisible = ribbonVisible || state === 'A' || (state === 'B' && mapStyle === 'terrain');

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 8 }}>
        <a
          className="map-gpx-btn"
          href={`/climbs/routes/${slug}.gpx`}
          download
          title={GPX_PARTIAL_CLIMB_SLUGS.has(slug) ? GPX_PARTIAL_CLIMB_CAVEAT : undefined}
        >
          Download GPX
        </a>
        <button
          onClick={() => controlsRef.current?.resetView()}
          style={{ padding: '8px 16px', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Reset view
        </button>
      </div>
      <div className="map-overlay-compass">
        <div ref={compassRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
          <span style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', color: '#ee1c28', fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif' }}>N</span>
          <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', color: '#ccc', fontSize: 11, fontFamily: 'sans-serif' }}>S</span>
          <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', color: '#ccc', fontSize: 11, fontFamily: 'sans-serif' }}>W</span>
          <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', color: '#ccc', fontSize: 11, fontFamily: 'sans-serif' }}>E</span>
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 2, height: 22, background: '#ee1c28', transform: 'translate(-50%, -100%)', transformOrigin: 'bottom' }} />
        </div>
      </div>
      <div className="map-overlay-stack">
        <div className="map-overlay">
          <span>Travel along route</span>
          <input
            type="range"
            min={0}
            max={rd.lengthM}
            step={50}
            value={travelKm}
            onChange={(e) => {
              const d = Number(e.target.value);
              setIsPlaying(false);
              setTravelKm(d);
              controlsRef.current?.flyTo(d);
            }}
            className="map-overlay-slider"
          />
          <span style={{ minWidth: 60, textAlign: 'right' }}>{(travelKm / 1000).toFixed(1)}km</span>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              padding: '4px 12px', background: isPlaying ? '#555' : '#12b05f', color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
        {smoothingSliderVisible && (
          <div className="map-overlay">
            <span>Smoothing</span>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={smoothWindowMRaw}
              onChange={(e) => setSmoothWindowMRaw(Number(e.target.value))}
              className="map-overlay-slider"
            />
            <span style={{ minWidth: 46, textAlign: 'right' }}>{smoothWindowM === 0 ? 'off' : `${smoothWindowM}m`}</span>
          </div>
        )}
      </div>
      <Canvas
        key={slug}
        camera={{ fov: 45, near: 1, far: 500000 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true }}
      >
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[-4000, 8000, 5000]} intensity={0.6} />
        <RibbonMesh rd={rd} influences={influences} smoothWindowM={smoothWindowM} visible={ribbonVisible} />
        <BasemapPlane slug={slug} visible={state === 'A' || (state === 'B' && mapStyle === 'flat')} />
        <TerrainMesh slug={slug} rd={rd} visible={state === 'B' && mapStyle === 'terrain'} />
        <TerrainSkirt slug={slug} rd={rd} visible={state === 'B' && mapStyle === 'terrain'} />
        <RouteHighlight rd={rd} slug={slug} state={state} mapStyle={mapStyle} smoothWindowM={smoothWindowM} />
        <TerrainTravelMarker rd={rd} slug={slug} state={state} mapStyle={mapStyle} travelM={travelKm} />
        <PlanTravelMarker rd={rd} state={state} travelM={travelKm} />
        <RouteMarkers rd={rd} slug={slug} state={state} mapStyle={mapStyle} />
        <WedgeAltitudeLines rd={rd} state={state} />
        <WedgeTravelMarker rd={rd} state={state} travelM={travelKm} />
        <SceneControls rd={rd} slug={slug} state={state} mapStyle={mapStyle} ref={controlsRef} />
        <CompassUpdater compassRef={compassRef} />
      </Canvas>
    </div>
  );
}
