const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const lowDetail = coarsePointer.matches || lowPowerDevice;
const backgroundModeKey = "campus-background-mode";
const backgroundModes = ["iridescence", "light-rays", "ballpit"];
const backgroundModeMeta = {
  iridescence: { label: "虹", title: "虹彩" },
  "light-rays": { label: "光", title: "光线" },
  ballpit: { label: "球", title: "球池" },
};

const videoBackgroundSources = [
  { src: "/assets/video/campus-liquid-bg.webm", type: "video/webm" },
  { src: "/assets/video/campus-liquid-bg.mp4", type: "video/mp4" },
];
const videoBackgroundPoster = "/assets/video/campus-liquid-bg-poster.jpg";

let stage;
let canvas;
let video;
let switcher;
let gl;
let program;
let vertexBuffer;
let active = false;
let rafId = 0;
let resizeRafId = 0;
let lastFrameTime = 0;
let startTime = performance.now();
let pixelRatio = 1;
let viewportWidth = 1;
let viewportHeight = 1;
let scrollProgress = 0;
let matchFocus = 0;
let matchFocusTarget = 0;
let routeName = window.location.pathname;
let backgroundMode = readBackgroundMode();
let targetPointer = { x: 0.5, y: 0.5 };
let smoothPointer = { x: 0.5, y: 0.5 };
let orientationListening = false;
let orientationPromptBound = false;
let orientationBaseline = null;
let orientationLastAt = 0;
let orientationStatus = "unavailable";
let videoReady = false;
let videoFailed = false;
let failedVideoSources = 0;

const uniforms = Object.create(null);

const vertexShaderSource = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uColor;
uniform vec3 uTintA;
uniform vec3 uTintB;
uniform float uAmplitude;
uniform float uSpeed;
uniform float uIntensity;
uniform float uDarkness;
uniform float uSaturation;
uniform float uVignette;
uniform float uScroll;
uniform float uFocus;
uniform float uMode;

varying vec2 vUv;

vec3 saturateColor(vec3 color, float amount) {
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(gray), color, amount);
}

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  float spreadFactor = pow(max(cosAngle, 0.0), 1.05);
  float distance = length(sourceToCoord);
  float maxDistance = uResolution.x * 2.0;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff = clamp((uResolution.x * 1.08 - distance) / (uResolution.x * 1.08), 0.5, 1.0);
  float baseStrength = clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + uTime * speed)) +
    (0.30 + 0.20 * cos(-cosAngle * seedB + uTime * speed)),
    0.0,
    1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor;
}

vec3 renderIridescence(vec2 frag, vec2 screenUv) {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (frag * 2.0 - uResolution.xy) / mr;

  vec2 mouseOffset = (uMouse - vec2(0.5)) * uAmplitude;
  uv += mouseOffset;
  uv.x += sin(screenUv.y * 4.0 + uTime * 0.18) * 0.025;
  uv.y += uScroll * 0.28;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;

  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;

  float tintMix = smoothstep(-0.85, 0.95, uv.x + uv.y * 0.28);
  vec3 tint = mix(uTintA, uTintB, tintMix);
  col = mix(col, col * tint, 0.34 + uFocus * 0.08);
  col = saturateColor(col, uSaturation);

  float glow = pow(max(0.0, 1.0 - length(uv - vec2(0.0, 0.18)) * 0.58), 2.2);
  float edge = smoothstep(1.25, 0.18, length(uv));
  float topSheen = pow(screenUv.y, 2.6) * 0.2;
  vec3 base = vec3(0.015, 0.025, 0.055);
  vec3 sheen = mix(uTintA, uTintB, screenUv.x) * topSheen;

  col = base + col * uIntensity * max(edge, 0.34) + sheen + glow * vec3(0.12, 0.18, 0.24);
  col = mix(col, base, uDarkness);
  col *= 1.0 - distance(screenUv, vec2(0.5, 0.52)) * uVignette;
  col = max(col, base);

  return col;
}

vec3 renderLightRays(vec2 frag, vec2 screenUv) {
  vec2 coord = vec2(frag.x, uResolution.y - frag.y);
  vec2 rayPos = vec2(0.5 * uResolution.x, -0.2 * uResolution.y);
  vec2 baseDir = vec2(0.0, 1.0);
  vec2 mouseDir = normalize(uMouse * uResolution.xy - rayPos);
  vec2 finalRayDir = normalize(mix(baseDir, mouseDir, 0.14 + uFocus * 0.04));
  float speed = max(uSpeed, 0.2);
  float rays =
    rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * speed) * 0.56 +
    rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * speed) * 0.42 +
    rayStrength(rayPos + vec2(uResolution.x * 0.18, 0.0), normalize(finalRayDir + vec2(-0.10, 0.04)), coord, 18.174, 31.73, 0.88 * speed) * 0.30 +
    rayStrength(rayPos - vec2(uResolution.x * 0.24, uResolution.y * 0.03), normalize(finalRayDir + vec2(0.18, 0.02)), coord, 44.73, 12.48, 0.72 * speed) * 0.22;
  float topBrightness = 1.0 - (coord.y / uResolution.y);
  vec3 col = vec3(rays) * vec3(0.55 + topBrightness * 0.55, 0.70 + topBrightness * 0.42, 0.90 + topBrightness * 0.32);
  float crownGlow = pow(screenUv.y, 3.0) * 0.18;
  vec3 base = vec3(0.015, 0.025, 0.055);
  col = base + col * (1.18 + uFocus * 0.08) + crownGlow * vec3(0.72, 0.9, 1.0);
  col *= 1.0 - distance(screenUv, vec2(0.5, 0.5)) * 0.72;
  return max(col, base);
}

vec3 renderBallpit(vec2 frag, vec2 screenUv) {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (screenUv - vec2(0.5)) * aspect;
  vec2 cursor = (uMouse - vec2(0.5)) * aspect;
  vec3 col = mix(vec3(0.012, 0.018, 0.035), vec3(0.025, 0.045, 0.075), screenUv.y);
  col += vec3(0.03, 0.04, 0.06) * pow(max(0.0, 1.0 - length(p - cursor * 0.22) * 1.2), 2.2);

  for (float i = 0.0; i < 32.0; i += 1.0) {
    float h1 = hash11(i + 1.7);
    float h2 = hash11(i * 2.31 + 5.1);
    float h3 = hash11(i * 4.17 + 2.4);
    vec2 center = (vec2(h1, h2) - vec2(0.5)) * vec2(aspect.x * 1.34, 1.22);
    center.x += sin(uTime * (0.18 + h3 * 0.12) + i * 0.61) * 0.045;
    center.y += cos(uTime * (0.16 + h1 * 0.1) + i * 0.74) * 0.04 - uScroll * 0.12;
    center += cursor * (0.06 + h2 * 0.06);
    float radius = mix(0.055, 0.13, h3);
    vec2 delta = p - center;
    float distanceToBall = length(delta);
    float mask = smoothstep(radius, radius * 0.78, distanceToBall);
    float z = sqrt(max(0.0, 1.0 - pow(distanceToBall / radius, 2.0)));
    vec3 normal = normalize(vec3(delta / radius, z));
    vec3 light = normalize(vec3(-0.45, 0.64, 0.84));
    float diffuse = max(dot(normal, light), 0.0);
    float rim = pow(1.0 - max(z, 0.0), 2.0);
    vec3 tint = mix(vec3(0.12, 0.46, 0.72), vec3(0.74, 0.28, 0.64), h1);
    vec3 ball = mix(vec3(0.018, 0.035, 0.055), tint, 0.36) + diffuse * vec3(0.46, 0.68, 0.9) + rim * vec3(0.2, 0.14, 0.26);
    float highlight = smoothstep(radius * 0.22, 0.0, length(delta + vec2(radius * 0.28, -radius * 0.24)));
    ball += highlight * vec3(0.55, 0.75, 0.95);
    col = mix(col, ball, mask * 0.9);
  }

  col *= 1.0 - distance(screenUv, vec2(0.5, 0.52)) * 0.58;
  return max(col, vec3(0.008, 0.012, 0.024));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 screenUv = frag / uResolution.xy;
  vec3 col;

  if (uMode < 0.5) {
    col = renderIridescence(frag, screenUv);
  } else if (uMode < 1.5) {
    col = renderLightRays(frag, screenUv);
  } else {
    col = renderBallpit(frag, screenUv);
  }

  gl_FragColor = vec4(col, 1.0);
}`;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readBackgroundMode() {
  try {
    const saved = window.localStorage?.getItem(backgroundModeKey);
    return backgroundModes.includes(saved) ? saved : "iridescence";
  } catch {
    return "iridescence";
  }
}

function writeBackgroundMode(mode) {
  try {
    window.localStorage?.setItem(backgroundModeKey, mode);
  } catch {
    // Storage may be unavailable in private or embedded contexts.
  }
}

function backgroundModeIndex() {
  return Math.max(0, backgroundModes.indexOf(backgroundMode));
}

function frameBudget() {
  if (prefersReducedMotion.matches) {
    return 1000;
  }

  return lowDetail ? 1000 / 36 : 1000 / 54;
}

function angleDelta(value, baseline) {
  let delta = value - baseline;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function routeConfig(route) {
  if (route === "/search.html") {
    return {
      focus: 0.82,
      speed: 0.86,
      amplitude: 0.18,
      intensity: 0.84,
      darkness: 0.34,
      saturation: 1.24,
      color: [0.92, 0.98, 1],
      tintA: [0.36, 1, 0.9],
      tintB: [1, 0.58, 0.92],
    };
  }

  if (route === "/upload.html") {
    return {
      focus: 0.46,
      speed: 0.8,
      amplitude: 0.17,
      intensity: 0.82,
      darkness: 0.35,
      saturation: 1.2,
      color: [0.96, 0.96, 1],
      tintA: [0.46, 0.88, 1],
      tintB: [1, 0.64, 0.8],
    };
  }

  if (route === "/login") {
    return {
      focus: 0.18,
      speed: 0.78,
      amplitude: 0.16,
      intensity: 0.78,
      darkness: 0.36,
      saturation: 1.18,
      color: [0.94, 0.98, 1],
      tintA: [0.42, 0.94, 1],
      tintB: [0.98, 0.58, 0.94],
    };
  }

  return {
    focus: 0,
    speed: 0.84,
    amplitude: 0.18,
    intensity: 0.82,
    darkness: 0.35,
    saturation: 1.22,
    color: [0.96, 0.98, 1],
    tintA: [0.38, 0.96, 1],
    tintB: [1, 0.58, 0.88],
  };
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
        radial-gradient(circle at 16% 12%, rgba(82, 226, 255, .26), transparent 32%),
        radial-gradient(circle at 80% 18%, rgba(255, 113, 208, .22), transparent 30%),
        radial-gradient(circle at 48% 100%, rgba(152, 126, 255, .18), transparent 44%),
        linear-gradient(135deg, #050711, #07101d 48%, #140d20);
      transition: opacity .42s ease;
      isolation: isolate;
    }
    #campus-spline-stage.is-active { opacity: 1; }
    #campus-spline-video,
    #campus-spline-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    #campus-spline-video {
      object-fit: cover;
      opacity: 0;
      filter: saturate(1.18) contrast(1.06) brightness(.86);
      transform: scale(1.055) translateZ(0);
      transition: opacity .65s ease, transform .18s linear;
      will-change: opacity, transform;
    }
    #campus-spline-canvas {
      opacity: 1;
      transform: translateZ(0);
      transition: opacity .65s ease;
    }
    #campus-spline-stage.is-video-ready #campus-spline-video {
      opacity: 1;
    }
    #campus-spline-stage.is-video-ready #campus-spline-canvas {
      opacity: 0;
    }
    #campus-spline-stage::before,
    #campus-spline-stage::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }
    #campus-spline-stage::before {
      background:
        linear-gradient(115deg, rgba(93, 233, 255, .16), transparent 28%, rgba(255, 139, 224, .12) 62%, transparent),
        radial-gradient(circle at 50% -12%, rgba(255, 255, 255, .18), transparent 40%);
      mix-blend-mode: screen;
    }
    #campus-spline-stage::after {
      background:
        radial-gradient(circle at 50% 52%, transparent 0, rgba(4, 7, 14, .24) 68%, rgba(4, 7, 14, .58) 100%),
        linear-gradient(180deg, rgba(5, 7, 17, .02), rgba(5, 7, 17, .26));
    }
    #campus-spline-stage.campus-spline-fallback {
      background:
        conic-gradient(from 220deg at 48% 34%, rgba(80, 232, 255, .42), rgba(255, 128, 224, .34), rgba(173, 142, 255, .28), rgba(80, 232, 255, .42)),
        linear-gradient(135deg, #050711, #07101d 48%, #140d20);
    }
    body[data-campus-spline="active"] {
      background: #050711 !important;
    }
    body[data-campus-spline="active"] > main,
    body[data-campus-spline="active"] #root {
      position: relative;
      z-index: 2;
    }
    .campus-bg-switcher {
      position: fixed;
      right: max(14px, env(safe-area-inset-right));
      top: 50%;
      z-index: 30;
      display: grid;
      gap: 8px;
      padding: 8px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 999px;
      background: rgba(9, 16, 32, .42);
      box-shadow: 0 22px 70px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.18);
      backdrop-filter: blur(22px) saturate(1.3);
      -webkit-backdrop-filter: blur(22px) saturate(1.3);
      transform: translate3d(0, -50%, 0);
      pointer-events: auto;
    }
    #campus-spline-stage.is-video-ready ~ .campus-bg-switcher {
      display: none;
    }
    .campus-bg-switcher button {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 999px;
      color: rgba(232,242,255,.74);
      background: transparent;
      font: 800 14px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      cursor: pointer;
      transition: transform .18s ease, color .18s ease, background .18s ease, box-shadow .18s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .campus-bg-switcher button:hover {
      color: rgba(255,255,255,.96);
      background: rgba(255,255,255,.10);
      transform: scale(1.04);
    }
    .campus-bg-switcher button.is-active {
      color: #06101d;
      background: linear-gradient(180deg, #fff, #d8efff 58%, #ffd7ea);
      box-shadow: 0 12px 28px rgba(99,191,255,.24), inset 0 1px rgba(255,255,255,.75);
    }
    @media (max-width: 640px) {
      .campus-bg-switcher {
        top: auto;
        right: 50%;
        bottom: calc(10px + env(safe-area-inset-bottom));
        transform: translateX(50%);
        grid-auto-flow: column;
        padding: 6px;
        gap: 6px;
      }
      .campus-bg-switcher button {
        width: 34px;
        height: 34px;
        font-size: 13px;
      }
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

  createVideoBackground();
  canvas = document.createElement("canvas");
  canvas.id = "campus-spline-canvas";
  stage.appendChild(canvas);
  document.body.prepend(stage);
  createBackgroundSwitcher();

  gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });

  if (!gl) {
    stage.classList.add("campus-spline-fallback");
    return stage;
  }

  try {
    buildProgram();
    resizeScene();
    window.addEventListener("resize", requestResizeScene, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("orientationchange", resetOrientationControl, { passive: true });
    window.screen?.orientation?.addEventListener?.("change", resetOrientationControl);
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    prefersReducedMotion.addEventListener?.("change", handleMotionPreferenceChange);
    setupOrientationControl();
  } catch (error) {
    console.warn("Iridescence background failed to initialize:", error);
    stage.classList.add("campus-spline-fallback");
    gl = null;
  }

  return stage;
}

function createVideoBackground() {
  if (!stage || video) {
    return video;
  }

  video = document.createElement("video");
  video.id = "campus-spline-video";
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.poster = videoBackgroundPoster;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("aria-hidden", "true");

  videoBackgroundSources.forEach((sourceConfig) => {
    const source = document.createElement("source");
    source.src = sourceConfig.src;
    source.type = sourceConfig.type;
    source.addEventListener("error", handleVideoSourceError);
    video.appendChild(source);
  });

  video.addEventListener("canplay", handleVideoReady);
  video.addEventListener("playing", handleVideoReady);
  video.addEventListener("error", handleVideoError);
  video.addEventListener("stalled", handleVideoStalled);
  stage.appendChild(video);
  return video;
}

function canUseVideoBackground() {
  return Boolean(video && videoReady && !videoFailed && !prefersReducedMotion.matches);
}

function usingVideoBackground() {
  return Boolean(stage?.classList.contains("is-video-ready"));
}

function tryPlayVideo() {
  if (!active || !video || !canUseVideoBackground() || document.hidden) {
    return;
  }

  const playPromise = video.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      stage?.classList.remove("is-video-ready");
      scheduleAnimation();
    });
  }
}

function syncVideoBackgroundState() {
  if (!stage || !video) {
    return;
  }

  const shouldUseVideo = active && canUseVideoBackground() && !document.hidden;
  stage.classList.toggle("is-video-ready", shouldUseVideo);
  updateVideoMotion();

  if (shouldUseVideo) {
    tryPlayVideo();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    return;
  }

  video.pause();
  renderFrame(performance.now());
  scheduleAnimation();
}

function handleVideoReady() {
  videoReady = true;
  videoFailed = false;
  syncVideoBackgroundState();
}

function handleVideoSourceError() {
  failedVideoSources += 1;
  if (failedVideoSources >= videoBackgroundSources.length) {
    handleVideoError();
  }
}

function handleVideoError() {
  videoFailed = true;
  stage?.classList.remove("is-video-ready");
  renderFrame(performance.now());
  scheduleAnimation();
}

function handleVideoStalled() {
  if (!videoReady) {
    stage?.classList.remove("is-video-ready");
    scheduleAnimation();
  }
}

function updateVideoMotion() {
  if (!video) {
    return;
  }

  const x = (targetPointer.x - 0.5) * (lowDetail ? 18 : 28);
  const y = (0.5 - targetPointer.y) * (lowDetail ? 14 : 24) + scrollProgress * 10;
  video.style.transform = `scale(1.055) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
}

function createBackgroundSwitcher() {
  if (switcher) {
    updateBackgroundSwitcher();
    return switcher;
  }

  switcher = document.createElement("div");
  switcher.className = "campus-bg-switcher";
  switcher.setAttribute("aria-label", "背景切换");

  backgroundModes.forEach((mode) => {
    const meta = backgroundModeMeta[mode];
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = meta.label;
    button.title = meta.title;
    button.setAttribute("aria-label", meta.title);
    button.dataset.mode = mode;
    button.addEventListener("click", () => {
      setBackgroundMode(mode);
    });
    switcher.appendChild(button);
  });

  document.body.appendChild(switcher);
  updateBackgroundSwitcher();
  return switcher;
}

function updateBackgroundSwitcher() {
  if (!switcher) {
    return;
  }

  switcher.querySelectorAll("button").forEach((button) => {
    const selected = button.dataset.mode === backgroundMode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function setBackgroundMode(mode) {
  if (!backgroundModes.includes(mode) || backgroundMode === mode) {
    return;
  }

  backgroundMode = mode;
  writeBackgroundMode(mode);
  updateBackgroundSwitcher();
  renderFrame(performance.now());
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Unable to compile shader.");
  }

  return shader;
}

function buildProgram() {
  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || "Unable to link shader program.");
  }

  gl.useProgram(program);
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  [
    "uTime",
    "uResolution",
    "uMouse",
    "uColor",
    "uTintA",
    "uTintB",
    "uAmplitude",
    "uSpeed",
    "uIntensity",
    "uDarkness",
    "uSaturation",
    "uVignette",
    "uScroll",
    "uFocus",
    "uMode",
  ].forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);
}

function resizeScene() {
  if (!canvas || !gl) {
    return;
  }

  const rect = stage?.getBoundingClientRect();
  viewportWidth = Math.max(1, Math.round(rect?.width || window.innerWidth || 1));
  viewportHeight = Math.max(1, Math.round(rect?.height || window.innerHeight || 1));
  pixelRatio = Math.min(window.devicePixelRatio || 1, lowDetail ? 1.2 : 1.65);
  canvas.width = Math.max(1, Math.round(viewportWidth * pixelRatio));
  canvas.height = Math.max(1, Math.round(viewportHeight * pixelRatio));
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function requestResizeScene() {
  if (resizeRafId) {
    return;
  }

  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = 0;
    resizeScene();
    renderFrame(performance.now());
  });
}

function handlePointerMove(event) {
  if (event.pointerType === "mouse" || !orientationListening) {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    targetPointer = {
      x: clamp(event.clientX / width, 0.04, 0.96),
      y: clamp(1 - event.clientY / height, 0.04, 0.96),
    };
    updateVideoMotion();
  }
}

function handleScroll() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  scrollProgress = clamp(window.scrollY / maxScroll, 0, 1);
  updateVideoMotion();
}

function updateUniforms(now) {
  const config = routeConfig(routeName);
  const elapsed = (now - startTime) / 1000;
  matchFocus += (matchFocusTarget - matchFocus) * (prefersReducedMotion.matches ? 0.14 : 0.055);
  smoothPointer.x += (targetPointer.x - smoothPointer.x) * (lowDetail ? 0.12 : 0.08);
  smoothPointer.y += (targetPointer.y - smoothPointer.y) * (lowDetail ? 0.12 : 0.08);

  const speed = prefersReducedMotion.matches ? 0.035 : config.speed + matchFocus * 0.05;
  const amplitude = config.amplitude + matchFocus * 0.02;
  const intensity = config.intensity + matchFocus * 0.05 + scrollProgress * 0.03;

  gl.uniform1f(uniforms.uTime, elapsed);
  gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
  gl.uniform2f(uniforms.uMouse, smoothPointer.x, smoothPointer.y);
  gl.uniform3f(uniforms.uColor, config.color[0], config.color[1], config.color[2]);
  gl.uniform3f(uniforms.uTintA, config.tintA[0], config.tintA[1], config.tintA[2]);
  gl.uniform3f(uniforms.uTintB, config.tintB[0], config.tintB[1], config.tintB[2]);
  gl.uniform1f(uniforms.uAmplitude, amplitude);
  gl.uniform1f(uniforms.uSpeed, speed);
  gl.uniform1f(uniforms.uIntensity, intensity);
  gl.uniform1f(uniforms.uDarkness, config.darkness);
  gl.uniform1f(uniforms.uSaturation, config.saturation);
  gl.uniform1f(uniforms.uVignette, lowDetail ? 0.62 : 0.78);
  gl.uniform1f(uniforms.uScroll, scrollProgress);
  gl.uniform1f(uniforms.uFocus, matchFocus);
  gl.uniform1f(uniforms.uMode, backgroundModeIndex());
}

function renderFrame(now) {
  if (!active || usingVideoBackground() || !gl || !program || !canvas) {
    return;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.clear(gl.COLOR_BUFFER_BIT);
  updateUniforms(now);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function animate(now = performance.now()) {
  if (!active || !gl || document.hidden || usingVideoBackground()) {
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
  if (!active || rafId || document.hidden || usingVideoBackground()) {
    return;
  }

  lastFrameTime = 0;
  rafId = requestAnimationFrame(animate);
}

function start() {
  createStage();
  active = true;
  stage?.classList.add("is-active");
  handleScroll();
  syncVideoBackgroundState();
  renderFrame(performance.now());
  scheduleAnimation();
}

function stop() {
  active = false;
  stage?.classList.remove("is-active");
  stage?.classList.remove("is-video-ready");
  video?.pause();
  resetOrientationControl();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function handleVisibilityChange() {
  if (!active) {
    return;
  }

  if (document.hidden) {
    video?.pause();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    return;
  }

  syncVideoBackgroundState();
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
  syncVideoBackgroundState();
  renderFrame(performance.now());
  scheduleAnimation();
}

function handleContextLost(event) {
  event.preventDefault();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function handleContextRestored() {
  if (!canvas) {
    return;
  }

  gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) {
    stage?.classList.add("campus-spline-fallback");
    return;
  }

  buildProgram();
  resizeScene();
  renderFrame(performance.now());
  scheduleAnimation();
}

function startOrientationListening() {
  if (orientationListening || typeof DeviceOrientationEvent === "undefined") {
    return;
  }

  window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
  orientationListening = true;
  orientationStatus = "listening";
}

async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent === "undefined") {
    orientationStatus = "unavailable";
    return;
  }

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      orientationStatus = permission === "granted" ? "granted" : "denied";
      if (permission === "granted") {
        startOrientationListening();
      }
      return;
    } catch {
      orientationStatus = "denied";
      return;
    }
  }

  orientationStatus = "granted";
  startOrientationListening();
}

function setupOrientationControl() {
  if (typeof DeviceOrientationEvent === "undefined") {
    orientationStatus = "unavailable";
    return;
  }

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    orientationStatus = "permission-required";
    if (!orientationPromptBound) {
      orientationPromptBound = true;
      window.addEventListener("pointerdown", requestOrientationPermission, { once: true, passive: true });
      window.addEventListener("touchstart", requestOrientationPermission, { once: true, passive: true });
    }
    return;
  }

  requestOrientationPermission();
}

function handleDeviceOrientation(event) {
  applyOrientation(event.beta, event.gamma, false);
}

function applyOrientation(beta, gamma, simulated) {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) {
    return;
  }

  if (simulated) {
    orientationBaseline = { beta: 0, gamma: 0 };
  } else if (!orientationBaseline) {
    orientationBaseline = { beta, gamma };
  }

  const deltaBeta = angleDelta(beta, orientationBaseline.beta);
  const deltaGamma = angleDelta(gamma, orientationBaseline.gamma);
  targetPointer = {
    x: clamp(0.5 + deltaGamma / 42, 0.1, 0.9),
    y: clamp(0.5 + deltaBeta / 58, 0.12, 0.88),
  };
  updateVideoMotion();
  orientationLastAt = Date.now();
  orientationStatus = simulated ? "simulated" : "active";
}

function resetOrientationControl() {
  orientationBaseline = null;
  targetPointer = { x: 0.5, y: 0.5 };
  smoothPointer = { x: 0.5, y: 0.5 };
  updateVideoMotion();
}

function setRoute(route) {
  const normalized = route || window.location.pathname;
  const config = routeConfig(normalized);
  routeName = normalized;
  matchFocusTarget = config.focus;
  document.body.dataset.campusSpline = "active";
  start();
}

window.addEventListener("campus:route", (event) => {
  setRoute(event.detail?.route);
});

setRoute(window.location.pathname);

window.CampusSplineScene = {
  setRoute,
  setBackgroundMode,
  getBackgroundMode() {
    return backgroundMode;
  },
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
  stop,
  inspect() {
    return {
      mode: backgroundMode,
      availableModes: [...backgroundModes],
      active,
      renderer: usingVideoBackground() ? "video" : "webgl",
      hasVideo: Boolean(video),
      videoReady,
      videoFailed,
      videoPaused: video ? video.paused : true,
      videoCurrentTime: video ? Number(video.currentTime.toFixed(2)) : 0,
      hasRenderer: Boolean(gl && program),
      canvasPixels: canvas ? canvas.width * canvas.height : 0,
      lowDetail,
      pixelRatio,
      frameBudget: frameBudget(),
      route: routeName,
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
