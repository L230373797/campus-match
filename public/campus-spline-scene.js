import {
  ACESFilmicToneMapping,
  AmbientLight,
  Clock,
  Color,
  InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "./assets/vendor/three.module.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const lowDetail = coarsePointer.matches || lowPowerDevice;
const palette = [0xdff7ff, 0x8ccfff, 0xb58cff, 0xffa9d8, 0xf5f7ff];
const dummy = new Object3D();
const raycaster = new Raycaster();
const planePoint = new Vector3();
const pointer = new Vector2(0, 0);
const targetPointer = new Vector2(0, 0);
const worldPointer = new Vector3(0, 0, 0);

let stage;
let canvas;
let renderer;
let scene;
let camera;
let clock;
let mesh;
let material;
let ambientLight;
let pointerLight;
let rafId = 0;
let resizeRafId = 0;
let active = false;
let matchFocus = 0;
let matchFocusTarget = 0;
let lastFrameTime = 0;
let scrollProgress = 0;
let count = 0;
let positions;
let velocities;
let sizes;
let maxX = 8;
let maxY = 5;
let maxZ = 3;
let orientationListening = false;
let orientationPromptBound = false;
let orientationBaseline = null;
let orientationLastAt = 0;
let orientationStatus = "unavailable";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function angleDelta(value, baseline) {
  let delta = value - baseline;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function randomSpread(range) {
  return (Math.random() - 0.5) * range;
}

function ensureStageStyles() {
  if (document.querySelector("style[data-campus-spline-style='true']")) {
    return;
  }

  const style = document.createElement("style");
  style.dataset.campusSplineStyle = "true";
  style.textContent = `
    #campus-spline-stage {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      opacity: 0;
      contain: strict;
      background:
        radial-gradient(circle at 20% 18%, rgba(98, 171, 255, .24), transparent 31%),
        radial-gradient(circle at 78% 12%, rgba(255, 141, 214, .18), transparent 28%),
        linear-gradient(135deg, #050711, #0a1024 46%, #171126);
      transition: opacity .42s ease;
    }
    #campus-spline-stage.is-active { opacity: 1; }
    #campus-spline-canvas {
      width: 100%;
      height: 100%;
      display: block;
      transform: translateZ(0);
    }
    #campus-spline-stage::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 84%, rgba(116, 196, 255, .10), transparent 34%),
        radial-gradient(circle at 78% 88%, rgba(255, 155, 216, .09), transparent 34%),
        linear-gradient(180deg, rgba(5, 7, 17, .02), rgba(5, 7, 17, .2));
    }
    body[data-campus-spline="active"] {
      background: #050711 !important;
    }
    body[data-campus-spline="active"] > main,
    body[data-campus-spline="active"] #root {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);
}

function createStage() {
  if (stage) {
    return stage;
  }

  ensureStageStyles();
  stage = document.createElement("div");
  stage.id = "campus-spline-stage";
  stage.setAttribute("aria-hidden", "true");

  canvas = document.createElement("canvas");
  canvas.id = "campus-spline-canvas";
  stage.appendChild(canvas);
  document.body.prepend(stage);

  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !lowDetail,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
      precision: lowDetail ? "mediump" : "highp",
    });
  } catch {
    stage.classList.add("campus-spline-fallback");
    return stage;
  }

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  scene = new Scene();
  clock = new Clock();
  camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.8, lowDetail ? 21 : 20);

  buildScene();
  resizeScene();

  window.addEventListener("resize", requestResizeScene, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("orientationchange", resetOrientationControl, { passive: true });
  window.screen?.orientation?.addEventListener?.("change", resetOrientationControl);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  prefersReducedMotion.addEventListener?.("change", handleMotionPreferenceChange);
  setupOrientationControl();

  return stage;
}

function buildScene() {
  ambientLight = new AmbientLight(0xd4ebff, 2.15);
  scene.add(ambientLight);

  pointerLight = new PointLight(0x9ddcff, lowDetail ? 120 : 170, 30, 1.6);
  pointerLight.position.set(0, 3, 5);
  scene.add(pointerLight);

  const geometry = new SphereGeometry(1, lowDetail ? 18 : 28, lowDetail ? 12 : 18);
  material = new MeshStandardMaterial({
    color: 0x101827,
    metalness: 0.05,
    roughness: 0.24,
    vertexColors: false,
    transparent: true,
    opacity: 0.94,
    emissive: 0x08152a,
    emissiveIntensity: 0.2,
  });

  count = lowDetail ? 54 : 86;
  mesh = new InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(35048);
  scene.add(mesh);

  positions = new Float32Array(count * 3);
  velocities = new Float32Array(count * 3);
  sizes = new Float32Array(count);
  seedBalls();
}

function seedBalls() {
  if (!mesh) {
    return;
  }

  const colorA = new Color();
  const colorB = new Color();
  for (let index = 0; index < count; index += 1) {
    const base = index * 3;
    const layer = index / Math.max(1, count - 1);
    positions[base] = randomSpread(maxX * 1.55);
    positions[base + 1] = randomSpread(maxY * 1.28) + maxY * 0.12;
    positions[base + 2] = randomSpread(maxZ * 1.6);
    velocities[base] = randomSpread(0.04);
    velocities[base + 1] = randomSpread(0.04);
    velocities[base + 2] = randomSpread(0.04);
    sizes[index] = MathUtils.lerp(lowDetail ? 0.42 : 0.38, lowDetail ? 0.95 : 1.05, Math.random());

    const start = palette[Math.floor(layer * (palette.length - 1))] ?? palette[0];
    const end = palette[Math.min(palette.length - 1, Math.floor(layer * (palette.length - 1)) + 1)] ?? palette.at(-1);
    const local = (layer * (palette.length - 1)) % 1;
    colorA.set(start);
    colorB.set(end);
    mesh.setColorAt(index, colorA.lerp(colorB, local));
  }

  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
  material.needsUpdate = true;
  updateBallMatrices();
}

function handlePointerMove(event) {
  if (!active || coarsePointer.matches || document.hidden) {
    return;
  }

  targetPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  targetPointer.y = (event.clientY / window.innerHeight - 0.5) * -2;
}

function applyOrientation(betaValue, gammaValue, force = false) {
  if (!active || document.hidden || (!force && !coarsePointer.matches)) {
    return;
  }

  const beta = Number(betaValue);
  const gamma = Number(gammaValue);
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) {
    return;
  }

  if (!orientationBaseline) {
    orientationBaseline = { beta, gamma };
  }

  orientationLastAt = performance.now();
  orientationStatus = "active";
  targetPointer.x = clamp(angleDelta(gamma, orientationBaseline.gamma) / 24, -1, 1);
  targetPointer.y = clamp(-angleDelta(beta, orientationBaseline.beta) / 30, -1, 1);

  if (prefersReducedMotion.matches) {
    renderFrame(performance.now());
  }
}

function handleOrientation(event) {
  applyOrientation(event.beta, event.gamma);
}

function startOrientationListening() {
  if (orientationListening || !("DeviceOrientationEvent" in window)) {
    return;
  }

  orientationListening = true;
  orientationStatus = "listening";
  window.addEventListener("deviceorientation", handleOrientation, { passive: true });
}

function bindOrientationPrompt() {
  if (orientationPromptBound) {
    return;
  }

  orientationPromptBound = true;
  const requestOnGesture = async () => {
    document.removeEventListener("pointerdown", requestOnGesture);
    document.removeEventListener("touchstart", requestOnGesture);

    try {
      const response = await window.DeviceOrientationEvent.requestPermission();
      if (response === "granted") {
        orientationStatus = "granted";
        startOrientationListening();
      } else {
        orientationStatus = "denied";
      }
    } catch {
      orientationStatus = "denied";
    }
  };

  document.addEventListener("pointerdown", requestOnGesture, { passive: true, once: true });
  document.addEventListener("touchstart", requestOnGesture, { passive: true, once: true });
}

function setupOrientationControl() {
  if (!coarsePointer.matches || !("DeviceOrientationEvent" in window)) {
    orientationStatus = "unavailable";
    return;
  }

  orientationStatus = "ready";
  if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
    bindOrientationPrompt();
    return;
  }

  startOrientationListening();
}

function resetOrientationControl() {
  orientationBaseline = null;
  orientationLastAt = 0;
  targetPointer.set(0, 0);
}

function handleScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));

  if (active && prefersReducedMotion.matches) {
    renderFrame(performance.now());
  }
}

function pixelRatioForViewport() {
  const base = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.25 : 1.45);
  return lowDetail ? Math.min(base, 1.1) : base;
}

function frameBudget() {
  return lowDetail ? 1000 / 30 : 1000 / 45;
}

function requestResizeScene() {
  if (resizeRafId) {
    return;
  }

  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = 0;
    resizeScene();
    seedBalls();
    if (active) {
      renderFrame(performance.now());
    }
  });
}

function resizeScene() {
  if (!renderer || !camera) {
    return;
  }

  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  renderer.setPixelRatio(pixelRatioForViewport());
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 640 ? 48 : 42;
  camera.position.z = width < 640 ? 22 : 20;
  camera.updateProjectionMatrix();
  updateBounds();
}

function updateBounds() {
  const fov = MathUtils.degToRad(camera.fov);
  const wHeight = 2 * Math.tan(fov / 2) * camera.position.z;
  const wWidth = wHeight * camera.aspect;
  maxX = wWidth * (window.innerWidth < 640 ? 0.64 : 0.56);
  maxY = wHeight * (window.innerWidth < 640 ? 0.58 : 0.54);
  maxZ = window.innerWidth < 640 ? 2.8 : 3.2;
}

function updateWorldPointer() {
  pointer.lerp(targetPointer, prefersReducedMotion.matches ? 0.08 : 0.075);
  raycaster.setFromCamera(pointer, camera);
  const distance = -camera.position.z / raycaster.ray.direction.z;
  planePoint.copy(raycaster.ray.direction).multiplyScalar(distance).add(raycaster.ray.origin);
  worldPointer.copy(planePoint);
  worldPointer.x += matchFocus * maxX * 0.16;
  worldPointer.y += 1.2 - scrollProgress * 1.4;
  worldPointer.z = 0;
}

function updatePhysics(delta, elapsed) {
  if (!positions || !velocities) {
    return;
  }

  const reduced = prefersReducedMotion.matches;
  const gravity = reduced ? 0.04 : 0.12;
  const friction = reduced ? 0.992 : 0.986;
  const bounce = 0.78;
  const centerRadius = lowDetail ? 2.2 : 2.5;

  for (let index = 0; index < count; index += 1) {
    const base = index * 3;
    const radius = sizes[index];
    const dx = positions[base] - worldPointer.x;
    const dy = positions[base + 1] - worldPointer.y;
    const dz = positions[base + 2] - worldPointer.z;
    const distance = Math.max(0.001, Math.hypot(dx, dy, dz));
    const influence = Math.max(0, centerRadius + radius - distance);

    velocities[base + 1] -= delta * gravity * radius;
    velocities[base] += Math.sin(elapsed * 0.54 + index * 0.31) * delta * 0.008;
    velocities[base + 2] += Math.cos(elapsed * 0.42 + index * 0.23) * delta * 0.006;

    if (influence > 0) {
      const push = influence * (reduced ? 0.34 : 0.52);
      velocities[base] += (dx / distance) * push;
      velocities[base + 1] += (dy / distance) * push;
      velocities[base + 2] += (dz / distance) * push * 0.6;
    }

    velocities[base] *= friction;
    velocities[base + 1] *= friction;
    velocities[base + 2] *= friction;
    const speed = Math.hypot(velocities[base], velocities[base + 1], velocities[base + 2]);
    const maxSpeed = reduced ? 0.08 : 0.16;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      velocities[base] *= scale;
      velocities[base + 1] *= scale;
      velocities[base + 2] *= scale;
    }

    positions[base] += velocities[base];
    positions[base + 1] += velocities[base + 1];
    positions[base + 2] += velocities[base + 2];

    if (Math.abs(positions[base]) + radius > maxX) {
      positions[base] = Math.sign(positions[base]) * (maxX - radius);
      velocities[base] *= -bounce;
    }
    if (positions[base + 1] - radius < -maxY) {
      positions[base + 1] = -maxY + radius;
      velocities[base + 1] *= -bounce;
    }
    if (positions[base + 1] + radius > maxY) {
      positions[base + 1] = maxY - radius;
      velocities[base + 1] *= -bounce * 0.72;
    }
    if (Math.abs(positions[base + 2]) + radius > maxZ) {
      positions[base + 2] = Math.sign(positions[base + 2]) * (maxZ - radius);
      velocities[base + 2] *= -bounce;
    }
  }

  resolveBallCollisions();
}

function resolveBallCollisions() {
  const passes = lowDetail ? 1 : 2;
  for (let pass = 0; pass < passes; pass += 1) {
    for (let index = 0; index < count; index += 1) {
      const base = index * 3;
      const radius = sizes[index];
      for (let other = index + 1; other < count; other += 1) {
        const otherBase = other * 3;
        const otherRadius = sizes[other];
        const dx = positions[otherBase] - positions[base];
        const dy = positions[otherBase + 1] - positions[base + 1];
        const dz = positions[otherBase + 2] - positions[base + 2];
        const distance = Math.max(0.001, Math.hypot(dx, dy, dz));
        const minDistance = (radius + otherRadius) * 0.9;
        if (distance >= minDistance) {
          continue;
        }

        const overlap = (minDistance - distance) * 0.5;
        const nx = dx / distance;
        const ny = dy / distance;
        const nz = dz / distance;
        positions[base] -= nx * overlap;
        positions[base + 1] -= ny * overlap;
        positions[base + 2] -= nz * overlap;
        positions[otherBase] += nx * overlap;
        positions[otherBase + 1] += ny * overlap;
        positions[otherBase + 2] += nz * overlap;
        velocities[base] -= nx * overlap * 0.05;
        velocities[base + 1] -= ny * overlap * 0.05;
        velocities[base + 2] -= nz * overlap * 0.05;
        velocities[otherBase] += nx * overlap * 0.05;
        velocities[otherBase + 1] += ny * overlap * 0.05;
        velocities[otherBase + 2] += nz * overlap * 0.05;
      }
    }
  }
}

function updateBallMatrices() {
  if (!mesh) {
    return;
  }

  for (let index = 0; index < count; index += 1) {
    const base = index * 3;
    dummy.position.set(positions[base], positions[base + 1], positions[base + 2]);
    dummy.scale.setScalar(sizes[index]);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function renderFrame(now) {
  if (!active || !renderer || !scene || !camera || !mesh) {
    return;
  }

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = now / 1000;
  matchFocus += (matchFocusTarget - matchFocus) * (prefersReducedMotion.matches ? 0.08 : 0.045);
  updateWorldPointer();
  updatePhysics(delta, elapsed);
  updateBallMatrices();

  mesh.rotation.y = pointer.x * 0.07 + matchFocus * 0.1;
  mesh.rotation.x = -scrollProgress * 0.06 + pointer.y * 0.04;
  pointerLight.position.lerp(worldPointer.clone().add(new Vector3(0, 2.4, 5.5)), 0.16);
  camera.position.x += (pointer.x * 0.32 - camera.position.x) * 0.04;
  camera.position.y += (1.8 + pointer.y * 0.2 - camera.position.y) * 0.04;
  camera.lookAt(matchFocus * 0.5, 0, 0);
  renderer.render(scene, camera);
}

function animate(now = performance.now()) {
  if (!active || !renderer || !scene || !camera || document.hidden || prefersReducedMotion.matches) {
    rafId = 0;
    return;
  }

  if (now - lastFrameTime >= frameBudget()) {
    lastFrameTime = now;
    renderFrame(now);
  }

  rafId = requestAnimationFrame(animate);
}

function scheduleAnimation() {
  if (!active || rafId || document.hidden || prefersReducedMotion.matches) {
    return;
  }

  lastFrameTime = 0;
  clock?.getDelta();
  rafId = requestAnimationFrame(animate);
}

function start() {
  createStage();
  active = true;
  stage?.classList.add("is-active");
  handleScroll();
  renderFrame(performance.now());
  scheduleAnimation();
}

function stop() {
  active = false;
  stage?.classList.remove("is-active");
  resetOrientationControl();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function routeFocus(route) {
  if (route === "/search.html") {
    return 1;
  }

  if (route === "/upload.html") {
    return 0.46;
  }

  return route === "/login" ? 0.16 : 0;
}

function handleVisibilityChange() {
  if (!active) {
    return;
  }

  if (document.hidden) {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    return;
  }

  renderFrame(performance.now());
  scheduleAnimation();
}

function handleMotionPreferenceChange() {
  if (!active) {
    return;
  }

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  renderFrame(performance.now());
  scheduleAnimation();
}

function setRoute(route) {
  const normalized = route || window.location.pathname;
  matchFocusTarget = routeFocus(normalized);
  document.body.dataset.campusSpline = "active";
  start();
}

window.addEventListener("campus:route", (event) => {
  setRoute(event.detail?.route);
});

setRoute(window.location.pathname);

window.CampusSplineScene = {
  setRoute,
  focusMatch() {
    matchFocusTarget = 1;
  },
  renderNow() {
    renderFrame(performance.now());
  },
  simulateOrientation(beta, gamma) {
    applyOrientation(beta, gamma, true);
    renderFrame(performance.now());
  },
  resetOrientation() {
    resetOrientationControl();
    renderFrame(performance.now());
  },
  inspect() {
    return {
      mode: "ballpit",
      active,
      hasRenderer: Boolean(renderer),
      ballCount: count,
      canvasPixels: renderer ? renderer.domElement.width * renderer.domElement.height : 0,
      lowDetail,
      pixelRatio: renderer?.getPixelRatio?.() || 0,
      frameBudget: frameBudget(),
      orientationStatus,
      orientationListening,
      orientationPointer: {
        x: Number(targetPointer.x.toFixed(3)),
        y: Number(targetPointer.y.toFixed(3)),
      },
      orientationLastAt,
    };
  },
};
