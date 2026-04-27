import * as THREE from "./assets/vendor/three.module.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const lowDetail = coarsePointer.matches || lowPowerDevice;

let stage;
let renderer;
let scene;
let camera;
let clock;
let rafId = 0;
let active = false;
let rootGroup;
let heroMesh;
let ringMesh;
let companionMesh;
let particles;
let resizeObserver;
let matchFocus = 0;
let matchFocusTarget = 0;
let resizeRafId = 0;
let lastFrameTime = 0;
let scrollProgress = 0;
let orientationListening = false;
let orientationPromptBound = false;
let orientationBaseline = null;
let orientationLastAt = 0;
let orientationStatus = "unavailable";

const pointer = new THREE.Vector2(0, 0);
const targetPointer = new THREE.Vector2(0, 0);
const viewport = { width: 1, height: 1 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function angleDelta(value, baseline) {
  let delta = value - baseline;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
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
      background: linear-gradient(135deg, #050711, #0a1024 42%, #171126);
      transition: opacity .42s ease;
    }
    #campus-spline-stage.is-active { opacity: 1; }
    #campus-spline-canvas {
      width: 100%;
      height: 100%;
      display: block;
      transform: translateZ(0);
    }
    #campus-spline-stage::after,
    .campus-spline-fallback::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 18% 22%, rgba(84, 188, 255, .18), transparent 28%),
        radial-gradient(circle at 82% 18%, rgba(255, 141, 214, .14), transparent 26%),
        linear-gradient(180deg, rgba(5, 7, 17, .02), rgba(5, 7, 17, .36));
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

  const canvas = document.createElement("canvas");
  canvas.id = "campus-spline-canvas";
  stage.appendChild(canvas);
  document.body.prepend(stage);

  try {
    renderer = new THREE.WebGLRenderer({
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

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.25, 9.2);

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

  resizeObserver = new ResizeObserver(requestResizeScene);
  resizeObserver.observe(document.documentElement);

  return stage;
}

function buildScene() {
  const ambient = new THREE.AmbientLight(0xbfd7ff, 1.85);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0x84d8ff, 35, 18);
  keyLight.position.set(-4.4, 3.6, 5.2);
  scene.add(keyLight);

  const blushLight = new THREE.PointLight(0xff8bd5, 28, 18);
  blushLight.position.set(4.4, -1.4, 3.6);
  scene.add(blushLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 2.3);
  rimLight.position.set(0, 4, 3);
  scene.add(rimLight);

  rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc7f1ff,
    metalness: 0.08,
    roughness: 0.2,
    transparent: true,
    opacity: 0.86,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    iridescence: 0.38,
    iridescenceIOR: 1.8,
  });

  const violetMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb48cff,
    metalness: 0.02,
    roughness: 0.22,
    transparent: true,
    opacity: 0.62,
    clearcoat: 1,
    iridescence: 0.5,
  });

  const pinkMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff9bd2,
    metalness: 0.05,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
    clearcoat: 1,
    iridescence: 0.32,
  });

  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x6ab8ff,
    emissiveIntensity: 0.55,
    roughness: 0.32,
    metalness: 0.12,
    transparent: true,
    opacity: 0.78,
  });

  heroMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.55, 0.34, lowDetail ? 96 : 128, lowDetail ? 14 : 20), glassMaterial);
  heroMesh.position.set(1.72, 0.05, 0);
  heroMesh.rotation.set(0.62, 0.08, -0.18);
  rootGroup.add(heroMesh);

  ringMesh = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.025, 8, lowDetail ? 88 : 120), lineMaterial);
  ringMesh.position.set(1.64, 0.02, -0.18);
  ringMesh.rotation.set(1.12, 0.42, 0.16);
  rootGroup.add(ringMesh);

  const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.018, 8, lowDetail ? 88 : 120), lineMaterial.clone());
  ringTwo.material.opacity = 0.34;
  ringTwo.position.set(1.62, 0.02, -0.28);
  ringTwo.rotation.set(1.36, -0.42, 0.88);
  rootGroup.add(ringTwo);

  companionMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, lowDetail ? 1 : 2), violetMaterial);
  companionMesh.position.set(-2.48, -0.76, -0.32);
  companionMesh.rotation.set(0.3, 0.4, 0.2);
  rootGroup.add(companionMesh);

  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.4, lowDetail ? 10 : 14, lowDetail ? 18 : 24), pinkMaterial);
  capsule.position.set(-1.3, 1.58, -0.72);
  capsule.rotation.set(0.42, 0.12, -0.72);
  rootGroup.add(capsule);

  const dotCount = lowDetail ? 10 : 14;
  for (let i = 0; i < dotCount; i += 1) {
    const size = 0.055 + (i % 4) * 0.018;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(size, lowDetail ? 10 : 14, lowDetail ? 8 : 12),
      new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0xffffff : i % 3 === 1 ? 0x8bd3ff : 0xffa6d8,
        emissive: i % 3 === 0 ? 0x96d8ff : 0x2c8cff,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 0.78,
      }),
    );
    const angle = i * 0.82;
    const radius = 1.55 + (i % 5) * 0.28;
    dot.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.1) * 1.4, -0.6 - (i % 3) * 0.42);
    rootGroup.add(dot);
  }

  particles = createParticleField();
  rootGroup.add(particles);
}

function createParticleField() {
  const count = lowDetail ? 72 : 110;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const colorA = new THREE.Color(0x8bd3ff);
  const colorB = new THREE.Color(0xffb1dc);

  for (let i = 0; i < count; i += 1) {
    const index = i * 3;
    positions[index] = (Math.random() - 0.5) * 10;
    positions[index + 1] = (Math.random() - 0.5) * 6.4;
    positions[index + 2] = -1.2 - Math.random() * 5.4;

    const mix = i / count;
    const c = colorA.clone().lerp(colorB, mix);
    colors[index] = c.r;
    colors[index + 1] = c.g;
    colors[index + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.032,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

function handlePointerMove(event) {
  if (!active || coarsePointer.matches || document.hidden) {
    return;
  }

  targetPointer.x = (event.clientX / viewport.width - 0.5) * 2;
  targetPointer.y = (event.clientY / viewport.height - 0.5) * -2;
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
  const x = clamp(angleDelta(gamma, orientationBaseline.gamma) / 24, -1, 1);
  const y = clamp(-angleDelta(beta, orientationBaseline.beta) / 30, -1, 1);
  targetPointer.x = x;
  targetPointer.y = y;

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
  document.documentElement.style.setProperty("--campus-spline-scroll", scrollProgress.toFixed(3));

  if (active && prefersReducedMotion.matches) {
    renderFrame(performance.now());
  }
}

function pixelRatioForViewport() {
  const base = Math.min(window.devicePixelRatio || 1, viewport.width < 640 ? 1.35 : 1.6);
  return lowDetail ? Math.min(base, 1.15) : base;
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
    if (active) {
      renderFrame(performance.now());
    }
  });
}

function resizeScene() {
  if (!renderer || !camera) {
    return;
  }

  viewport.width = Math.max(1, window.innerWidth);
  viewport.height = Math.max(1, window.innerHeight);
  renderer.setPixelRatio(pixelRatioForViewport());
  renderer.setSize(viewport.width, viewport.height, false);
  camera.aspect = viewport.width / viewport.height;
  camera.fov = viewport.width < 640 ? 43 : 36;
  camera.position.z = viewport.width < 640 ? 10.8 : 9.2;
  camera.updateProjectionMatrix();
}

function renderFrame(now) {
  if (!active || !renderer || !scene || !camera) {
    return;
  }

  const time = now / 1000;
  const delta = Math.min(clock.getDelta(), 0.05);
  const reduced = prefersReducedMotion.matches;

  pointer.lerp(targetPointer, reduced ? 0.04 : 0.075);
  matchFocus += (matchFocusTarget - matchFocus) * (reduced ? 0.08 : 0.045);

  rootGroup.rotation.y = pointer.x * 0.18 + matchFocus * 0.24;
  rootGroup.rotation.x = pointer.y * 0.1 - scrollProgress * 0.08 + matchFocus * 0.08;
  rootGroup.position.y = (viewport.width < 640 ? -0.2 : 0.02) + matchFocus * 0.08;
  rootGroup.position.x = (viewport.width < 640 ? 0.34 : 0.62) - matchFocus * 0.18;
  rootGroup.scale.setScalar(1 + matchFocus * 0.12);

  if (!reduced) {
    heroMesh.rotation.x += delta * 0.18;
    heroMesh.rotation.y += delta * 0.28;
    ringMesh.rotation.z -= delta * 0.18;
    companionMesh.rotation.y -= delta * 0.22;
    companionMesh.position.y = -0.76 + Math.sin(time * 0.84) * 0.16;
    particles.rotation.y += delta * 0.025;
  }

  camera.position.x = pointer.x * 0.34;
  camera.position.y = 0.25 + pointer.y * 0.18;
  camera.lookAt(0.25, 0.05, 0);

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
      active,
      hasRenderer: Boolean(renderer),
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
