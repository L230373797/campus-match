import * as THREE from "./assets/vendor/three.module.js";

const ACTIVE_ROUTES = new Set(["/login", "/", "/search.html"]);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

const pointer = new THREE.Vector2(0, 0);
const targetPointer = new THREE.Vector2(0, 0);
const viewport = { width: 1, height: 1 };

function createStage() {
  if (stage) {
    return stage;
  }

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
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
  } catch {
    stage.classList.add("campus-spline-fallback");
    return stage;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.25, 9.2);

  buildScene();
  resizeScene();

  window.addEventListener("resize", resizeScene, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });

  resizeObserver = new ResizeObserver(resizeScene);
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
    metalness: 0.06,
    roughness: 0.18,
    transmission: 0.35,
    thickness: 0.7,
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

  heroMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.55, 0.34, 180, 26), glassMaterial);
  heroMesh.position.set(1.72, 0.05, 0);
  heroMesh.rotation.set(0.62, 0.08, -0.18);
  rootGroup.add(heroMesh);

  ringMesh = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.025, 10, 160), lineMaterial);
  ringMesh.position.set(1.64, 0.02, -0.18);
  ringMesh.rotation.set(1.12, 0.42, 0.16);
  rootGroup.add(ringMesh);

  const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.018, 10, 160), lineMaterial.clone());
  ringTwo.material.opacity = 0.34;
  ringTwo.position.set(1.62, 0.02, -0.28);
  ringTwo.rotation.set(1.36, -0.42, 0.88);
  rootGroup.add(ringTwo);

  companionMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 2), violetMaterial);
  companionMesh.position.set(-2.48, -0.76, -0.32);
  companionMesh.rotation.set(0.3, 0.4, 0.2);
  rootGroup.add(companionMesh);

  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.4, 18, 32), pinkMaterial);
  capsule.position.set(-1.3, 1.58, -0.72);
  capsule.rotation.set(0.42, 0.12, -0.72);
  rootGroup.add(capsule);

  for (let i = 0; i < 18; i += 1) {
    const size = 0.055 + (i % 4) * 0.018;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(size, 18, 18),
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
  const count = 150;
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
  targetPointer.x = (event.clientX / viewport.width - 0.5) * 2;
  targetPointer.y = (event.clientY / viewport.height - 0.5) * -2;
}

function handleScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / max));
  document.documentElement.style.setProperty("--campus-spline-scroll", progress.toFixed(3));
}

function resizeScene() {
  if (!renderer || !camera) {
    return;
  }

  viewport.width = Math.max(1, window.innerWidth);
  viewport.height = Math.max(1, window.innerHeight);
  renderer.setSize(viewport.width, viewport.height, false);
  camera.aspect = viewport.width / viewport.height;
  camera.fov = viewport.width < 640 ? 43 : 36;
  camera.position.z = viewport.width < 640 ? 10.8 : 9.2;
  camera.updateProjectionMatrix();
}

function animate() {
  if (!active || !renderer || !scene || !camera) {
    rafId = 0;
    return;
  }

  const time = clock.getElapsedTime();
  const delta = Math.min(clock.getDelta(), 0.05);
  const reduced = prefersReducedMotion.matches;

  pointer.lerp(targetPointer, reduced ? 0.04 : 0.075);
  const scroll = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--campus-spline-scroll")) || 0;

  rootGroup.rotation.y = pointer.x * 0.18;
  rootGroup.rotation.x = pointer.y * 0.1 - scroll * 0.08;
  rootGroup.position.y = viewport.width < 640 ? -0.2 : 0.02;
  rootGroup.position.x = viewport.width < 640 ? 0.34 : 0.62;

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
  rafId = requestAnimationFrame(animate);
}

function start() {
  createStage();
  active = true;
  stage?.classList.add("is-active");
  handleScroll();
  if (!rafId) {
    clock?.getDelta();
    rafId = requestAnimationFrame(animate);
  }
}

function stop() {
  active = false;
  stage?.classList.remove("is-active");
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function setRoute(route) {
  const normalized = route || window.location.pathname;
  const shouldShow = ACTIVE_ROUTES.has(normalized);
  document.body.dataset.campusSpline = shouldShow ? "active" : "inactive";

  if (shouldShow) {
    start();
  } else {
    stop();
  }
}

window.addEventListener("campus:route", (event) => {
  setRoute(event.detail?.route);
});

setRoute(window.location.pathname);

window.CampusSplineScene = {
  setRoute,
  inspect() {
    return {
      active,
      hasRenderer: Boolean(renderer),
      canvasPixels: renderer ? renderer.domElement.width * renderer.domElement.height : 0,
    };
  },
};
