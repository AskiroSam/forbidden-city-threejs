import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* ── Palette ─────────────────────────────────────────────── */
const C = {
  wall: 0x8b1e1e,
  wallDark: 0x5c1212,
  wallLite: 0xa42828,
  roof: 0xd4a017,
  roofDeep: 0xb8860b,
  roofEdge: 0x8b6914,
  stone: 0xd8d0c4,
  stoneDark: 0xa89f90,
  marble: 0xe8e4dc,
  ground: 0x6b7a4a,
  courtyard: 0xb5a88c,
  pave: 0x9a9080,
  wood: 0x3d1f08,
  pillar: 0x7a1515,
  trim: 0xf0d78c,
  water: 0x1a3a4a,
  waterDeep: 0x0e2430,
  sky: 0x7eabcf,
  fog: 0xb8cce0,
  earth: 0x5a4a38,
};

const targets = {
  overview: { pos: new THREE.Vector3(55, 70, 120), look: new THREE.Vector3(0, 5, -10) },
  meridian: { pos: new THREE.Vector3(0, 32, 95), look: new THREE.Vector3(0, 12, 55) },
  bridges: { pos: new THREE.Vector3(18, 22, 48), look: new THREE.Vector3(0, 2, 28) },
  taihe: { pos: new THREE.Vector3(0, 28, 5), look: new THREE.Vector3(0, 12, -45) },
  inner: { pos: new THREE.Vector3(0, 24, -70), look: new THREE.Vector3(0, 8, -105) },
};

let cameraAnim = null;
let infoTimer = null;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function animateCamera(controls, camera, key, duration = 1.4) {
  const t = targets[key];
  if (!t) return;
  cameraAnim = {
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    endPos: t.pos.clone(),
    endTarget: t.look.clone(),
    t0: performance.now(),
    duration: duration * 1000,
  };
}

function updateCameraAnim(controls, camera) {
  if (!cameraAnim) return;
  const u = Math.min(1, (performance.now() - cameraAnim.t0) / cameraAnim.duration);
  const e = easeInOut(u);
  camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, e);
  controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, e);
  controls.update();
  if (u >= 1) cameraAnim = null;
}

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.04,
    flatShading: opts.flat ?? false,
  });
}

function box(parent, w, h, d, x, y, z, m, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cyl(parent, rt, rb, h, x, y, z, m, seg = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/* ── Chinese hip roof (simplified) ───────────────────────── */
function addHipRoof(parent, w, d, x, y, z, mats, tiers = 1) {
  const g = new THREE.Group();
  for (let t = 0; t < tiers; t++) {
    const tw = w * (1 - t * 0.12);
    const td = d * (1 - t * 0.12);
    const ty = t * 1.35;

    // Eave slab
    const eave = new THREE.Mesh(
      new THREE.BoxGeometry(tw * 1.18, 0.22, td * 1.18),
      mats.roofDeep
    );
    eave.position.y = ty;
    eave.castShadow = true;
    g.add(eave);

    // Gold trim ring
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(tw * 1.2, 0.1, td * 1.2),
      mats.trim
    );
    rim.position.y = ty - 0.12;
    g.add(rim);

    // Hip slopes via rotated boxes (4 sides)
    const slopeH = 1.15;
    const halfW = tw * 0.52;
    const halfD = td * 0.52;

    // Front / back slopes
    for (const side of [-1, 1]) {
      const slope = new THREE.Mesh(
        new THREE.BoxGeometry(tw * 1.05, 0.18, halfD * 1.15),
        mats.roof
      );
      slope.position.set(0, ty + slopeH * 0.45, side * halfD * 0.55);
      slope.rotation.x = side * 0.42;
      slope.castShadow = true;
      g.add(slope);
    }
    // Left / right slopes
    for (const side of [-1, 1]) {
      const slope = new THREE.Mesh(
        new THREE.BoxGeometry(halfW * 1.15, 0.18, td * 1.05),
        mats.roof
      );
      slope.position.set(side * halfW * 0.55, ty + slopeH * 0.45, 0);
      slope.rotation.z = -side * 0.42;
      slope.castShadow = true;
      g.add(slope);
    }

    // Ridge beam
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(tw * 0.55, 0.28, 0.35),
      mats.roofEdge
    );
    ridge.position.y = ty + slopeH * 0.85;
    ridge.castShadow = true;
    g.add(ridge);

    // Ridge end ornaments (simplified chiwei)
    for (const sx of [-1, 1]) {
      const orn = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.7, 5),
        mats.trim
      );
      orn.position.set(sx * tw * 0.28, ty + slopeH * 0.95, 0);
      orn.rotation.z = sx * 0.3;
      g.add(orn);
    }
  }

  // Top peak cap
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.35, 0.35, 0.4),
    mats.trim
  );
  cap.position.y = tiers * 1.35 + 0.2;
  g.add(cap);

  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/* ── Raised marble terrace ───────────────────────────────── */
function addTerrace(parent, w, d, h, x, z, mats, steps = true) {
  const g = new THREE.Group();
  // Multi-tier white marble
  const layers = Math.max(1, Math.round(h / 1.2));
  for (let i = 0; i < layers; i++) {
    const lw = w - i * 1.6;
    const ld = d - i * 1.2;
    const ly = i * (h / layers) + (h / layers) / 2;
    box(g, lw, h / layers, ld, 0, ly, 0, mats.marble);
    // Balustrade hint on top tier
    if (i === layers - 1) {
      const railH = 0.55;
      box(g, lw, railH, 0.25, 0, ly + h / layers / 2 + railH / 2, ld / 2 - 0.15, mats.stone);
      box(g, lw, railH, 0.25, 0, ly + h / layers / 2 + railH / 2, -ld / 2 + 0.15, mats.stone);
      box(g, 0.25, railH, ld, -lw / 2 + 0.15, ly + h / layers / 2 + railH / 2, 0, mats.stone);
      box(g, 0.25, railH, ld, lw / 2 - 0.15, ly + h / layers / 2 + railH / 2, 0, mats.stone);
    }
  }
  if (steps) {
    const sh = h * 0.85;
    box(g, w * 0.28, sh, 3.5, 0, sh / 2, d / 2 + 1.5, mats.stoneDark);
  }
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

/* ── Palace hall ─────────────────────────────────────────── */
function buildHall(parent, opts) {
  const {
    width, depth, height, x, z, mats,
    roofTiers = 1, terraceH = 2.5, name = "", label = "",
  } = opts;
  const g = new THREE.Group();
  g.name = name;
  g.userData.label = label;

  addTerrace(g, width + 6, depth + 5, terraceH, 0, 0, mats, true);

  // Main body
  box(g, width, height, depth, 0, terraceH + height / 2, 0, mats.wall);

  // Red pillars along front facade
  const cols = Math.max(5, Math.floor(width / 3));
  for (let i = 0; i < cols; i++) {
    const cx = -width / 2 + 1.4 + (i * (width - 2.8)) / (cols - 1);
    cyl(g, 0.28, 0.32, height * 0.92, cx, terraceH + height * 0.46, depth / 2 - 0.4, mats.pillar, 8);
  }
  // Back pillars
  for (let i = 0; i < cols; i++) {
    const cx = -width / 2 + 1.4 + (i * (width - 2.8)) / (cols - 1);
    cyl(g, 0.22, 0.26, height * 0.92, cx, terraceH + height * 0.46, -depth / 2 + 0.4, mats.pillar, 8);
  }

  // Central door
  box(g, width * 0.18, height * 0.52, 0.25, 0, terraceH + height * 0.32, depth / 2 + 0.05, mats.wood);

  // Window panels (dark insets)
  for (const sx of [-0.32, 0.32]) {
    box(g, width * 0.14, height * 0.35, 0.15, sx * width, terraceH + height * 0.48, depth / 2 + 0.02, mats.wallDark);
  }

  // Dougong-ish eave brackets (simplified repeating boxes)
  const bracketCount = Math.max(6, Math.floor(width / 2.5));
  for (let i = 0; i < bracketCount; i++) {
    const bx = -width / 2 + 1 + (i * (width - 2)) / (bracketCount - 1);
    box(g, 0.55, 0.45, 0.7, bx, terraceH + height + 0.1, depth / 2 + 0.15, mats.trim, false);
  }

  addHipRoof(g, width + 1.8, depth + 1.4, 0, terraceH + height + 0.35, 0, mats, roofTiers);

  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

/* ── Gate building ───────────────────────────────────────── */
function buildGate(parent, opts) {
  const { width, height, depth, x, z, mats, towers = false, name = "", label = "" } = opts;
  const g = new THREE.Group();
  g.name = name;
  g.userData.label = label;

  box(g, width, height, depth, 0, height / 2, 0, mats.wall);

  // Triple arch openings (Meridian style)
  const archW = width * 0.14;
  const archH = height * 0.48;
  for (const ox of [-width * 0.28, 0, width * 0.28]) {
    box(g, archW, archH, depth + 0.5, ox, archH / 2 + 0.3, 0, mats.wallDark);
  }

  // Upper gallery body
  box(g, width * 0.95, height * 0.35, depth * 0.85, 0, height * 0.78, 0, mats.wallLite);
  addHipRoof(g, width + 1.2, depth + 1.5, 0, height + 0.2, 0, mats, 2);

  if (towers) {
    // U-shaped protruding wings (午门 classic form)
    const tw = 9;
    const th = height + 5;
    const td = 12;
    for (const side of [-1, 1]) {
      const wx = side * (width / 2 + tw / 2 - 0.5);
      box(g, tw, th, td, wx, th / 2, -3, mats.wall);
      addHipRoof(g, tw + 1.5, td + 1.2, wx, th + 0.15, -3, mats, 2);
      // South-extending wing walls
      box(g, 4, height * 0.9, 28, side * (width / 2 + tw + 2), (height * 0.9) / 2, 10, mats.wall);
      addHipRoof(g, 5.5, 10, side * (width / 2 + tw + 2), height * 0.9 + 0.1, 18, mats, 1);
      // Corner pavilion on wing tip
      box(g, 6, height * 0.7, 6, side * (width / 2 + tw + 2), height * 0.35, 22, mats.wall);
      addHipRoof(g, 7.5, 7.5, side * (width / 2 + tw + 2), height * 0.7 + 0.1, 22, mats, 1);
    }
  }

  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

/* ── Walls with merlons ──────────────────────────────────── */
function buildWallWithMerlons(parent, length, height, thickness, x, z, rotY, mats, gapCenter = 0) {
  const g = new THREE.Group();
  if (gapCenter > 0) {
    const sideLen = (length - gapCenter) / 2;
    const offset = gapCenter / 2 + sideLen / 2;
    for (const s of [-1, 1]) {
      box(g, sideLen, height, thickness, s * offset, height / 2, 0, mats.wall);
    }
  } else {
    box(g, length, height, thickness, 0, height / 2, 0, mats.wall);
  }

  // Merlons (crenellations)
  const merlonW = 1.4;
  const merlonGap = 1.1;
  const count = Math.floor(length / (merlonW + merlonGap));
  const startX = -((count - 1) * (merlonW + merlonGap)) / 2;
  for (let i = 0; i < count; i++) {
    const mx = startX + i * (merlonW + merlonGap);
    if (gapCenter > 0 && Math.abs(mx) < gapCenter / 2 + 1) continue;
    box(g, merlonW, 1.1, thickness * 0.85, mx, height + 0.55, 0, mats.wall, false);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

/* ── Golden Water Bridges ────────────────────────────────── */
function buildBridges(parent, mats) {
  const g = new THREE.Group();
  g.name = "bridges";
  g.userData.label = "金水桥 Golden Water Bridges";

  // Curved water channel (approximate with boxes + cylinder bends)
  const channel = new THREE.Mesh(
    new THREE.BoxGeometry(70, 0.8, 10),
    mats.water
  );
  channel.position.set(0, -0.15, 0);
  channel.receiveShadow = true;
  g.add(channel);

  // Darker water surface
  const waterTop = new THREE.Mesh(
    new THREE.BoxGeometry(68, 0.15, 8.5),
    mats.waterDeep
  );
  waterTop.position.set(0, 0.2, 0);
  g.add(waterTop);

  // Stone embankments
  box(g, 72, 0.9, 1.2, 0, 0.35, 5.2, mats.stone);
  box(g, 72, 0.9, 1.2, 0, 0.35, -5.2, mats.stone);

  // 5 arched bridges (simplified barrel arches)
  const bridgeXs = [-22, -11, 0, 11, 22];
  const bridgeWs = [4.5, 4.5, 6, 4.5, 4.5];
  bridgeXs.forEach((bx, i) => {
    const bw = bridgeWs[i];
    // Deck
    box(g, bw, 0.5, 14, bx, 1.4, 0, mats.marble);
    // Arch body (two piers + curved suggestion)
    box(g, bw * 0.9, 1.2, 2.5, bx, 0.6, 4.5, mats.stoneDark);
    box(g, bw * 0.9, 1.2, 2.5, bx, 0.6, -4.5, mats.stoneDark);
    // Arch ring (half-cylinder)
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, bw * 0.85, 12, 1, false, 0, Math.PI),
      mats.stone
    );
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.set(bx, 0.15, 0);
    arch.castShadow = true;
    g.add(arch);
    // Railings
    box(g, bw, 0.7, 0.2, bx, 1.9, 6.5, mats.stone);
    box(g, bw, 0.7, 0.2, bx, 1.9, -6.5, mats.stone);
  });

  g.position.set(0, 0, 30);
  parent.add(g);
  return g;
}

/* ── Side colonnades ─────────────────────────────────────── */
function buildColonnade(parent, x, zStart, zEnd, mats) {
  const g = new THREE.Group();
  const len = Math.abs(zEnd - zStart);
  const midZ = (zStart + zEnd) / 2;
  // Raised walkway
  box(g, 5, 1.2, len, 0, 0.6, 0, mats.stone);
  // Roof corridor
  box(g, 4.5, 3.5, len - 2, 0, 1.2 + 1.75, 0, mats.wall);
  addHipRoof(g, 6, len - 1, 0, 1.2 + 3.5 + 0.15, 0, mats, 1);
  // Pillars
  const step = 6;
  const count = Math.floor(len / step);
  for (let i = 0; i < count; i++) {
    const pz = -len / 2 + 2 + i * step;
    cyl(g, 0.22, 0.25, 3.2, -1.6, 1.2 + 1.6, pz, mats.pillar, 8);
    cyl(g, 0.22, 0.25, 3.2, 1.6, 1.2 + 1.6, pz, mats.pillar, 8);
  }
  g.position.set(x, 0, midZ);
  parent.add(g);
  return g;
}

/* ── Corner watchtowers ──────────────────────────────────── */
function buildWatchtower(parent, x, z, mats) {
  const g = new THREE.Group();
  box(g, 8, 12, 8, 0, 6, 0, mats.wall);
  box(g, 7, 4, 7, 0, 13, 0, mats.wallLite);
  addHipRoof(g, 10, 10, 0, 15.2, 0, mats, 2);
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

/* ── Main scene assembly ─────────────────────────────────── */
function buildScene(root) {
  const mats = {
    wall: mat(C.wall),
    wallDark: mat(C.wallDark),
    wallLite: mat(C.wallLite),
    roof: mat(C.roof, { roughness: 0.5, metalness: 0.18 }),
    roofDeep: mat(C.roofDeep, { roughness: 0.48, metalness: 0.22 }),
    roofEdge: mat(C.roofEdge, { roughness: 0.55, metalness: 0.15 }),
    stone: mat(C.stone, { roughness: 0.95 }),
    stoneDark: mat(C.stoneDark, { roughness: 0.95 }),
    marble: mat(C.marble, { roughness: 0.7 }),
    ground: mat(C.ground, { roughness: 1 }),
    courtyard: mat(C.courtyard, { roughness: 1 }),
    pave: mat(C.pave, { roughness: 0.98 }),
    wood: mat(C.wood, { roughness: 0.9 }),
    pillar: mat(C.pillar, { roughness: 0.75 }),
    trim: mat(C.trim, { roughness: 0.35, metalness: 0.3 }),
    water: mat(C.water, { roughness: 0.25, metalness: 0.4 }),
    waterDeep: mat(C.waterDeep, { roughness: 0.2, metalness: 0.5 }),
    earth: mat(C.earth, { roughness: 1 }),
  };

  // Outer earth / grass
  const earth = new THREE.Mesh(new THREE.PlaneGeometry(320, 360), mats.ground);
  earth.rotation.x = -Math.PI / 2;
  earth.position.y = -0.5;
  earth.receiveShadow = true;
  root.add(earth);

  // Moat ring (4 water strips around walls)
  const moatMat = mats.water;
  const moatW = 14;
  const innerW = 120;
  const innerD = 200;
  // South moat
  box(root, innerW + moatW * 2 + 20, 0.6, moatW, 0, -0.2, innerD / 2 + moatW / 2 + 8, moatMat, false);
  // North moat
  box(root, innerW + moatW * 2 + 20, 0.6, moatW, 0, -0.2, -innerD / 2 - moatW / 2 - 8, moatMat, false);
  // East / West moats
  box(root, moatW, 0.6, innerD + 16, innerW / 2 + moatW / 2 + 8, -0.2, 0, moatMat, false);
  box(root, moatW, 0.6, innerD + 16, -innerW / 2 - moatW / 2 - 8, -0.2, 0, moatMat, false);

  // Courtyard paving with subtle grid
  const court = new THREE.Mesh(new THREE.PlaneGeometry(100, 180), mats.courtyard);
  court.rotation.x = -Math.PI / 2;
  court.position.set(0, 0.02, -15);
  court.receiveShadow = true;
  root.add(court);

  // Central axis stone path
  box(root, 10, 0.1, 170, 0, 0.08, -10, mats.pave, false);
  // Grid lines on paving (instanced thin boxes)
  for (let i = -8; i <= 8; i++) {
    box(root, 0.08, 0.05, 160, i * 5.5, 0.06, -15, mats.stoneDark, false);
  }
  for (let i = -14; i <= 10; i++) {
    box(root, 90, 0.05, 0.08, 0, 0.06, i * 6, mats.stoneDark, false);
  }

  // Outer walls (+Z = south in traditional orientation for this scene we use +Z south-ish entry)
  // Layout: Meridian Gate at +Z (south entrance), halls toward -Z (north)
  const wallH = 11;
  const wallT = 3.2;
  buildWallWithMerlons(root, 130, wallH, wallT, 0, 72, 0, mats, 42); // south, gap for 午门
  buildWallWithMerlons(root, 130, wallH, wallT, 0, -118, 0, mats, 0); // north
  buildWallWithMerlons(root, 190, wallH, wallT, -65, -23, Math.PI / 2, mats, 0);
  buildWallWithMerlons(root, 190, wallH, wallT, 65, -23, Math.PI / 2, mats, 0);

  // Corner watchtowers
  buildWatchtower(root, -60, 68, mats);
  buildWatchtower(root, 60, 68, mats);
  buildWatchtower(root, -60, -114, mats);
  buildWatchtower(root, 60, -114, mats);

  // 午门 Meridian Gate
  buildGate(root, {
    width: 42, height: 16, depth: 10, x: 0, z: 58,
    mats, towers: true, name: "meridian", label: "午门 Meridian Gate",
  });

  // 金水桥
  buildBridges(root, mats);

  // 太和门 Gate of Supreme Harmony
  buildGate(root, {
    width: 30, height: 12, depth: 7, x: 0, z: 12,
    mats, towers: false, name: "taihemen", label: "太和门 Gate of Supreme Harmony",
  });

  // Three Great Halls on shared raised marble platform area
  // Shared three-tier marble base spanning the halls
  addTerrace(root, 48, 72, 3.8, 0, -52, mats, false);
  // Central imperial ramp
  box(root, 8, 3.2, 6, 0, 1.6, -18, mats.marble);

  // 太和殿 Hall of Supreme Harmony (largest)
  buildHall(root, {
    width: 32, depth: 16, height: 10, x: 0, z: -38,
    mats, roofTiers: 2, terraceH: 4.5,
    name: "taihe", label: "太和殿 Hall of Supreme Harmony",
  });

  // 中和殿 Hall of Central Harmony (smallest, square)
  buildHall(root, {
    width: 16, depth: 16, height: 7, x: 0, z: -58,
    mats, roofTiers: 1, terraceH: 4.2,
    name: "zhonghe", label: "中和殿 Hall of Central Harmony",
  });

  // 保和殿 Hall of Preserving Harmony
  buildHall(root, {
    width: 26, depth: 14, height: 8.5, x: 0, z: -78,
    mats, roofTiers: 2, terraceH: 4.2,
    name: "baohe", label: "保和殿 Hall of Preserving Harmony",
  });

  // Side halls / east-west wings
  const sideZs = [5, -20, -50, -75];
  for (const sz of sideZs) {
    buildHall(root, {
      width: 12, depth: 7, height: 5, x: -38, z: sz,
      mats, roofTiers: 1, terraceH: 1.5, name: "side", label: "配殿 Side Hall",
    });
    buildHall(root, {
      width: 12, depth: 7, height: 5, x: 38, z: sz,
      mats, roofTiers: 1, terraceH: 1.5, name: "side", label: "配殿 Side Hall",
    });
  }

  // Colonnade corridors
  buildColonnade(root, -48, 20, -90, mats);
  buildColonnade(root, 48, 20, -90, mats);

  // Northern inner palace hint (乾清宫 area — lighter, fewer buildings)
  buildGate(root, {
    width: 22, height: 9, depth: 5, x: 0, z: -95,
    mats, towers: false, name: "qianqingmen", label: "乾清门 Gate of Heavenly Purity",
  });
  buildHall(root, {
    width: 20, depth: 11, height: 7, x: 0, z: -110,
    mats, roofTiers: 1, terraceH: 2.2,
    name: "inner", label: "乾清宫 Palace of Heavenly Purity",
  });
  // Small side residences
  buildHall(root, {
    width: 10, depth: 8, height: 5, x: -28, z: -110,
    mats, roofTiers: 1, terraceH: 1.2, name: "inner-side", label: "东六宫 East Chambers",
  });
  buildHall(root, {
    width: 10, depth: 8, height: 5, x: 28, z: -110,
    mats, roofTiers: 1, terraceH: 1.2, name: "inner-side", label: "西六宫 West Chambers",
  });

  // Bronze censers in front of Taihe
  for (const [cx, cz] of [[-12, -28], [12, -28], [-12, -48], [12, -48]]) {
    const cg = new THREE.Group();
    cyl(cg, 1.0, 1.2, 1.6, 0, 1.0, 0, mats.roofDeep, 10);
    const lid = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.7, 8), mats.trim);
    lid.position.y = 2.1;
    cg.add(lid);
    // Legs
    for (const a of [0, 2.1, 4.2]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.6, 6), mats.roofDeep);
      leg.position.set(Math.cos(a) * 0.7, 0.25, Math.sin(a) * 0.7);
      cg.add(leg);
    }
    cg.position.set(cx, 4.5, cz);
    root.add(cg);
  }

  // Trees outside walls
  const treeMat = mat(0x2d5a3d, { roughness: 0.9 });
  const trunkMat = mat(0x3b2414);
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    const r = 90 + (i % 4) * 5;
    const tx = Math.cos(angle) * r;
    const tz = Math.sin(angle) * r * 0.9 - 20;
    if (Math.abs(tx) < 78 && Math.abs(tz) < 130) continue;
    cyl(root, 0.3, 0.4, 2.0, tx, 0.5, tz, trunkMat, 6);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 7), treeMat);
    crown.position.set(tx, 4.0, tz);
    crown.castShadow = true;
    root.add(crown);
  }

  return mats;
}

/* ── Boot ────────────────────────────────────────────────── */
function init() {
  const canvas = document.getElementById("c");
  const loading = document.getElementById("loading");
  const infoEl = document.getElementById("info");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.sky);
  scene.fog = new THREE.Fog(C.fog, 90, 280);

  const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.5,
    500
  );
  camera.position.copy(targets.overview.pos);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(targets.overview.look);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 15;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minPolarAngle = 0.1;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  controls.update();

  // Lighting
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x8b5a3c, 0.5));

  const sun = new THREE.DirectionalLight(0xfff2d9, 1.4);
  sun.position.set(50, 80, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 250;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.bias = -0.00025;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xb8c8e0, 0.32);
  fill.position.set(-40, 30, -50);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  buildScene(world);

  // Click / tap to identify buildings
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function showInfo(text) {
    infoEl.textContent = text;
    infoEl.classList.remove("hidden");
    clearTimeout(infoTimer);
    infoTimer = setTimeout(() => infoEl.classList.add("hidden"), 2200);
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const cx = (event.clientX ?? event.touches?.[0]?.clientX) - rect.left;
    const cy = (event.clientY ?? event.touches?.[0]?.clientY) - rect.top;
    pointer.x = (cx / rect.width) * 2 - 1;
    pointer.y = -(cy / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(world.children, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData?.label) obj = obj.parent;
      if (obj?.userData?.label) showInfo(obj.userData.label);
    }
  }

  let tapStart = null;
  canvas.addEventListener("pointerdown", (e) => {
    tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!tapStart) return;
    const dt = performance.now() - tapStart.t;
    const dx = e.clientX - tapStart.x;
    const dy = e.clientY - tapStart.y;
    if (dt < 280 && dx * dx + dy * dy < 36) onPointer(e);
    tapStart = null;
  });

  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      animateCamera(controls, camera, btn.dataset.target);
    });
  });

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", () => setTimeout(onResize, 150));

  loading.classList.add("hidden");

  function frame() {
    requestAnimationFrame(frame);
    updateCameraAnim(controls, camera);
    if (!cameraAnim) controls.update();
    renderer.render(scene, camera);
  }
  frame();
}

init();
