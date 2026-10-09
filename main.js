import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  wall: 0x9b1b1b,
  wallDark: 0x6e1212,
  roof: 0xd4a017,
  roofDeep: 0xb8860b,
  stone: 0xc4b7a0,
  stoneDark: 0x8a7f6c,
  ground: 0xb8a48a,
  courtyard: 0xc9b896,
  wood: 0x4a2c0a,
  trim: 0xf0d78c,
  sky: 0x87a8c4,
  fog: 0xc8d4e0,
};

const targets = {
  overview: {
    pos: new THREE.Vector3(0, 55, 95),
    look: new THREE.Vector3(0, 8, -20),
  },
  meridian: {
    pos: new THREE.Vector3(0, 28, 78),
    look: new THREE.Vector3(0, 10, 42),
  },
  courtyard: {
    pos: new THREE.Vector3(18, 32, 20),
    look: new THREE.Vector3(0, 6, -5),
  },
  taihe: {
    pos: new THREE.Vector3(0, 22, 8),
    look: new THREE.Vector3(0, 10, -38),
  },
};

let cameraAnim = null;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function animateCamera(controls, camera, key, duration = 1.35) {
  const t = targets[key];
  if (!t) return;
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  cameraAnim = {
    startPos,
    startTarget,
    endPos: t.pos.clone(),
    endTarget: t.look.clone(),
    t0: performance.now(),
    duration: duration * 1000,
  };
}

function updateCameraAnim(controls, camera) {
  if (!cameraAnim) return;
  const u = Math.min(
    1,
    (performance.now() - cameraAnim.t0) / cameraAnim.duration
  );
  const e = easeInOut(u);
  camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, e);
  controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, e);
  controls.update();
  if (u >= 1) cameraAnim = null;
}

function makeMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    flatShading: opts.flat ?? true,
  });
}

function addBox(parent, w, h, d, x, y, z, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoof(parent, w, d, x, y, z, mats) {
  const group = new THREE.Group();
  // Hip-style simplified: peaked box + overhang slabs
  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.92, 0.35, d * 0.18),
    mats.roofDeep
  );
  ridge.position.set(0, 1.6, 0);
  ridge.castShadow = true;
  group.add(ridge);

  const peak = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.55, 2.2, 4),
    mats.roof
  );
  peak.rotation.y = Math.PI / 4;
  peak.position.y = 1.1;
  peak.castShadow = true;
  group.add(peak);

  // Eaves platform
  const eave = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.12, 0.25, d * 1.12),
    mats.roofDeep
  );
  eave.position.y = 0.15;
  eave.castShadow = true;
  group.add(eave);

  // Decorative yellow rim
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.14, 0.12, d * 1.14),
    mats.trim
  );
  rim.position.y = 0.02;
  group.add(rim);

  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function buildPalaceHall(parent, opts) {
  const {
    width,
    depth,
    height,
    x,
    z,
    mats,
    tiers = 1,
    name = "",
  } = opts;
  const g = new THREE.Group();
  g.name = name;

  // Raised stone platform
  const platH = 1.4 + tiers * 0.9;
  addBox(g, width + 4, platH, depth + 3.5, 0, platH / 2, 0, mats.stone);
  // Steps front
  addBox(g, width * 0.35, platH * 0.55, 2.2, 0, (platH * 0.55) / 2, depth / 2 + 2.4, mats.stoneDark);

  // Main hall body
  addBox(g, width, height, depth, 0, platH + height / 2, 0, mats.wall);

  // Columns suggestion (front)
  const colMat = mats.wood;
  const colCount = Math.max(5, Math.floor(width / 3.2));
  for (let i = 0; i < colCount; i++) {
    const cx = -width / 2 + 1.2 + (i * (width - 2.4)) / (colCount - 1);
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, height * 0.95, 8),
      colMat
    );
    col.position.set(cx, platH + height * 0.48, depth / 2 - 0.35);
    col.castShadow = true;
    g.add(col);
  }

  // Door panel
  addBox(
    g,
    width * 0.22,
    height * 0.55,
    0.2,
    0,
    platH + height * 0.35,
    depth / 2 + 0.05,
    mats.wood
  );

  // Roof
  addRoof(
    g,
    width + 1.5,
    depth + 1.2,
    0,
    platH + height + 0.2,
    0,
    mats
  );

  // Side wings for larger halls
  if (width > 18) {
    addBox(g, 3.5, height * 0.75, depth * 0.7, -width / 2 - 2.2, platH + (height * 0.75) / 2, 0, mats.wall);
    addBox(g, 3.5, height * 0.75, depth * 0.7, width / 2 + 2.2, platH + (height * 0.75) / 2, 0, mats.wall);
    addRoof(g, 5, depth * 0.85, -width / 2 - 2.2, platH + height * 0.75 + 0.15, 0, mats);
    addRoof(g, 5, depth * 0.85, width / 2 + 2.2, platH + height * 0.75 + 0.15, 0, mats);
  }

  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

function buildGate(parent, opts) {
  const { width, height, depth, x, z, mats, towers = false, name = "" } = opts;
  const g = new THREE.Group();
  g.name = name;

  // Base wall / gate body
  addBox(g, width, height, depth, 0, height / 2, 0, mats.wall);

  // Arch opening (darker inset)
  addBox(
    g,
    width * 0.28,
    height * 0.55,
    depth + 0.4,
    0,
    height * 0.28,
    0,
    mats.wallDark
  );

  // Roof on gate
  addRoof(g, width + 1, depth + 1.5, 0, height + 0.15, 0, mats);

  if (towers) {
    // Meridian Gate style protruding wings / towers
    const tw = 8;
    const th = height + 4;
    const td = 10;
    for (const side of [-1, 1]) {
      addBox(g, tw, th, td, side * (width / 2 + tw / 2 - 1), th / 2, -2, mats.wall);
      addRoof(g, tw + 1.2, td + 1, side * (width / 2 + tw / 2 - 1), th + 0.15, -2, mats);
      // Side wing walls extending south
      addBox(g, 3.5, height * 0.85, 22, side * (width / 2 + tw + 1), (height * 0.85) / 2, 8, mats.wall);
      addRoof(g, 5, 8, side * (width / 2 + tw + 1), height * 0.85 + 0.1, 14, mats);
    }
  }

  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

function buildWallSegment(parent, length, height, thickness, x, y, z, rotY, mat) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, thickness),
    mat
  );
  mesh.position.set(x, y + height / 2, z);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildCourtyardDecor(parent, mats) {
  // Central stone path / axis
  addBox(parent, 8, 0.12, 130, 0, 0.06, -10, mats.stone);

  // Side paths
  addBox(parent, 3.5, 0.1, 100, -22, 0.05, -15, mats.stoneDark);
  addBox(parent, 3.5, 0.1, 100, 22, 0.05, -15, mats.stoneDark);

  // Bronze ding / censers (stylized cylinders)
  for (const [x, z] of [
    [-10, -32],
    [10, -32],
    [-10, -48],
    [10, -48],
  ]) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.3, 1.8, 10),
      mats.roofDeep
    );
    body.position.y = 1.2;
    body.castShadow = true;
    g.add(body);
    const lid = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.8, 8), mats.trim);
    lid.position.y = 2.4;
    g.add(lid);
    g.position.set(x, 0, z);
    parent.add(g);
  }

  // Small corner watchtowers suggestion along outer rim (north of meridian)
  for (const [x, z] of [
    [-48, 55],
    [48, 55],
    [-48, -70],
    [48, -70],
  ]) {
    addBox(parent, 5, 10, 5, x, 5, z, mats.wall);
    addRoof(parent, 6.5, 6.5, x, 10.2, z, mats);
  }
}

function buildSideHalls(parent, mats) {
  // East / West flanking halls along axis
  const zs = [5, -15, -55];
  for (const z of zs) {
    buildPalaceHall(parent, {
      width: 14,
      depth: 8,
      height: 5.5,
      x: -32,
      z,
      mats,
      tiers: 0,
    });
    buildPalaceHall(parent, {
      width: 14,
      depth: 8,
      height: 5.5,
      x: 32,
      z,
      mats,
      tiers: 0,
    });
  }
}

function buildScene(root) {
  const mats = {
    wall: makeMat(COLORS.wall),
    wallDark: makeMat(COLORS.wallDark),
    roof: makeMat(COLORS.roof, { roughness: 0.55, metalness: 0.15 }),
    roofDeep: makeMat(COLORS.roofDeep, { roughness: 0.5, metalness: 0.2 }),
    stone: makeMat(COLORS.stone, { flat: false, roughness: 0.95 }),
    stoneDark: makeMat(COLORS.stoneDark, { flat: false, roughness: 0.95 }),
    ground: makeMat(COLORS.ground, { flat: false, roughness: 1 }),
    courtyard: makeMat(COLORS.courtyard, { flat: false, roughness: 1 }),
    wood: makeMat(COLORS.wood, { roughness: 0.9 }),
    trim: makeMat(COLORS.trim, { roughness: 0.4, metalness: 0.25 }),
  };

  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 220),
    mats.ground
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // Inner courtyard paving
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 140),
    mats.courtyard
  );
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.02;
  court.position.z = -10;
  court.receiveShadow = true;
  root.add(court);

  // Outer enclosing walls (simplified rectangle)
  const wallH = 9;
  const wallT = 2.2;
  buildWallSegment(root, 110, wallH, wallT, 0, 0, 70, 0, mats.wall); // south incomplete — gate sits here
  buildWallSegment(root, 110, wallH, wallT, 0, 0, -85, 0, mats.wall);
  buildWallSegment(root, 155, wallH, wallT, -55, 0, -7.5, Math.PI / 2, mats.wall);
  buildWallSegment(root, 155, wallH, wallT, 55, 0, -7.5, Math.PI / 2, mats.wall);

  // Meridian Gate 午门 (south, +Z)
  buildGate(root, {
    width: 36,
    height: 14,
    depth: 8,
    x: 0,
    z: 48,
    mats,
    towers: true,
    name: "meridian",
  });

  // Gate of Supreme Harmony 太和门
  buildGate(root, {
    width: 28,
    height: 11,
    depth: 6,
    x: 0,
    z: 8,
    mats,
    towers: false,
    name: "taihemen",
  });

  // Hall of Supreme Harmony 太和殿
  buildPalaceHall(root, {
    width: 28,
    depth: 14,
    height: 9,
    x: 0,
    z: -38,
    mats,
    tiers: 2,
    name: "taihe",
  });

  // Hall of Central / Preserving Harmony (simplified north of Taihe)
  buildPalaceHall(root, {
    width: 22,
    depth: 11,
    height: 7,
    x: 0,
    z: -62,
    mats,
    tiers: 1,
    name: "zhonghe",
  });

  buildSideHalls(root, mats);
  buildCourtyardDecor(root, mats);

  // Soft ambient trees / green accents as cones (optional decoration outside walls)
  const treeMat = makeMat(0x2d5a3d, { roughness: 0.9 });
  const trunkMat = makeMat(0x3b2414);
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const r = 72 + (i % 3) * 4;
    const tx = Math.cos(angle) * r;
    const tz = Math.sin(angle) * r * 0.85 - 5;
    if (Math.abs(tx) < 58 && Math.abs(tz) < 88) continue;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 2.2, 6),
      trunkMat
    );
    trunk.position.set(tx, 1.1, tz);
    trunk.castShadow = true;
    root.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 7), treeMat);
    crown.position.set(tx, 4.2, tz);
    crown.castShadow = true;
    root.add(crown);
  }

  return mats;
}

function init() {
  const canvas = document.getElementById("c");
  const loading = document.getElementById("loading");

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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.fog, 70, 210);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.5,
    400
  );
  camera.position.copy(targets.overview.pos);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(targets.overview.look);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 12;
  controls.maxDistance = 160;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = 0.12;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  controls.update();

  // Lights
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x8b5a3c, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d9, 1.35);
  sun.position.set(40, 70, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.bias = -0.0002;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xb8c8e0, 0.35);
  fill.position.set(-30, 25, -40);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  buildScene(world);

  // UI chips
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
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", () => setTimeout(onResize, 120));

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
