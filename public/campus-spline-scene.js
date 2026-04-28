const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const lowPowerDevice = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const lowDetail = coarsePointer.matches || lowPowerDevice;

let stage;
let canvas;
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
let rayOrigin = "top-center";
let targetPointer = { x: 0.5, y: 0.5 };
let smoothPointer = { x: 0.5, y: 0.5 };
let orientationListening = false;
let orientationPromptBound = false;
let orientationBaseline = null;
let orientationLastAt = 0;
let orientationStatus = "unavailable";

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

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 rayPos;
uniform vec2 rayDir;
uniform vec3 raysColor;
uniform vec3 accentColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2 mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
uniform float rayIntensity;
uniform float rayOpacity;
uniform float vignetteStrength;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.82 + 0.18 * sin(iTime * speed * 3.0)) : 1.0;
  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.30 + 0.20 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0,
    1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 finalRayDir = rayDir;

  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
  vec4 rays3 = vec4(1.0) * rayStrength(rayPos + vec2(iResolution.x * 0.18, 0.0), normalize(finalRayDir + vec2(-0.12, 0.04)), coord, 18.174, 31.73, 0.78 * raysSpeed);

  fragColor = rays1 * 0.48 + rays2 * 0.34 + rays3 * 0.22;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= 1.0 - noiseAmount + noiseAmount * n;
  }

  float topBrightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.12 + topBrightness * 0.82;
  fragColor.y *= 0.32 + topBrightness * 0.62;
  fragColor.z *= 0.50 + topBrightness * 0.52;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  float accentMix = smoothstep(0.15, 0.95, vUv.x + vUv.y * 0.4);
  vec3 finalColor = mix(raysColor, accentColor, accentMix * 0.22);
  float vignette = 1.0 - distance(vUv, vec2(0.52, 0.48)) * vignetteStrength;

  fragColor.rgb *= finalColor * rayIntensity * max(vignette, 0.2);
  fragColor.a *= rayOpacity;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}`;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
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

function getAnchorAndDir(origin, width, height) {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * height], dir: [0, 1] };
    case "top-right":
      return { anchor: [width, -outside * height], dir: [0, 1] };
    case "left":
      return { anchor: [-outside * width, 0.5 * height], dir: [1, 0] };
    case "right":
      return { anchor: [(1 + outside) * width, 0.5 * height], dir: [-1, 0] };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * height], dir: [0, -1] };
    case "bottom-center":
      return { anchor: [0.5 * width, (1 + outside) * height], dir: [0, -1] };
    case "bottom-right":
      return { anchor: [width, (1 + outside) * height], dir: [0, -1] };
    default:
      return { anchor: [0.5 * width, -outside * height], dir: [0, 1] };
  }
}

function routeConfig(route) {
  if (route === "/search.html") {
    return {
      origin: "top-left",
      focus: 0.85,
      color: "#f7fbff",
      accent: "#91d8ff",
      intensity: 0.86,
      opacity: 0.78,
      spread: 0.95,
      speed: 0.58,
      distortion: 0.065,
    };
  }

  if (route === "/upload.html") {
    return {
      origin: "top-right",
      focus: 0.5,
      color: "#f9fbff",
      accent: "#ffbddb",
      intensity: 0.9,
      opacity: 0.8,
      spread: 0.98,
      speed: 0.54,
      distortion: 0.07,
    };
  }

  if (route === "/login") {
    return {
      origin: "top-center",
      focus: 0.18,
      color: "#ffffff",
      accent: "#b9ccff",
      intensity: 0.88,
      opacity: 0.76,
      spread: 0.9,
      speed: 0.52,
      distortion: 0.075,
    };
  }

  return {
    origin: "top-center",
    focus: 0,
    color: "#ffffff",
    accent: "#acdfff",
    intensity: 0.92,
    opacity: 0.82,
    spread: 0.92,
    speed: 0.56,
    distortion: 0.08,
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
        radial-gradient(circle at 18% 16%, rgba(140, 216, 255, .18), transparent 32%),
        radial-gradient(circle at 82% 14%, rgba(190, 168, 255, .14), transparent 31%),
        radial-gradient(circle at 50% 112%, rgba(52, 102, 151, .18), transparent 42%),
        linear-gradient(135deg, #050711, #07101d 48%, #130f21);
      transition: opacity .42s ease;
      isolation: isolate;
    }
    #campus-spline-stage.is-active { opacity: 1; }
    #campus-spline-canvas {
      width: 100%;
      height: 100%;
      display: block;
      transform: translateZ(0);
    }
    #campus-spline-stage::before,
    #campus-spline-stage::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    #campus-spline-stage::before {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, .035), transparent 28%),
        radial-gradient(circle at 50% -10%, rgba(255, 255, 255, .18), transparent 38%);
      mix-blend-mode: screen;
    }
    #campus-spline-stage::after {
      background:
        radial-gradient(circle at 50% 52%, transparent 0, rgba(4, 7, 14, .28) 68%, rgba(4, 7, 14, .54) 100%),
        linear-gradient(180deg, rgba(5, 7, 17, .03), rgba(5, 7, 17, .22));
    }
    #campus-spline-stage.campus-spline-fallback {
      background:
        linear-gradient(112deg, transparent 0 26%, rgba(255, 255, 255, .15) 34%, transparent 48%),
        linear-gradient(125deg, transparent 0 15%, rgba(138, 215, 255, .12) 29%, transparent 48%),
        linear-gradient(135deg, #050711, #07101d 48%, #130f21);
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
    console.warn("Light rays background failed to initialize:", error);
    stage.classList.add("campus-spline-fallback");
    gl = null;
  }

  return stage;
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
    "iTime",
    "iResolution",
    "rayPos",
    "rayDir",
    "raysColor",
    "accentColor",
    "raysSpeed",
    "lightSpread",
    "rayLength",
    "pulsating",
    "fadeDistance",
    "saturation",
    "mousePos",
    "mouseInfluence",
    "noiseAmount",
    "distortion",
    "rayIntensity",
    "rayOpacity",
    "vignetteStrength",
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
  pixelRatio = Math.min(window.devicePixelRatio || 1, lowDetail ? 1.25 : 1.75);
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
      y: clamp(event.clientY / height, 0.04, 0.96),
    };
  }
}

function handleScroll() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  scrollProgress = clamp(window.scrollY / maxScroll, 0, 1);
}

function updateUniforms(now) {
  const config = routeConfig(routeName);
  const elapsed = (now - startTime) / 1000;
  matchFocus += (matchFocusTarget - matchFocus) * (prefersReducedMotion.matches ? 0.16 : 0.055);
  smoothPointer.x += (targetPointer.x - smoothPointer.x) * (lowDetail ? 0.105 : 0.075);
  smoothPointer.y += (targetPointer.y - smoothPointer.y) * (lowDetail ? 0.105 : 0.075);

  const width = canvas.width;
  const height = canvas.height;
  const placement = getAnchorAndDir(rayOrigin, width, height);
  const color = hexToRgb(config.color);
  const accent = hexToRgb(config.accent);
  const speed = prefersReducedMotion.matches ? 0.04 : config.speed + matchFocus * 0.05;
  const intensity = config.intensity + matchFocus * 0.08 + scrollProgress * 0.045;
  const opacity = config.opacity + matchFocus * 0.04;
  const mouseInfluence = (lowDetail ? 0.1 : 0.16) + matchFocus * 0.05;

  gl.uniform1f(uniforms.iTime, elapsed);
  gl.uniform2f(uniforms.iResolution, width, height);
  gl.uniform2f(uniforms.rayPos, placement.anchor[0], placement.anchor[1]);
  gl.uniform2f(uniforms.rayDir, placement.dir[0], placement.dir[1]);
  gl.uniform3f(uniforms.raysColor, color[0], color[1], color[2]);
  gl.uniform3f(uniforms.accentColor, accent[0], accent[1], accent[2]);
  gl.uniform1f(uniforms.raysSpeed, speed);
  gl.uniform1f(uniforms.lightSpread, config.spread + scrollProgress * 0.04);
  gl.uniform1f(uniforms.rayLength, lowDetail ? 1.72 : 1.92);
  gl.uniform1f(uniforms.pulsating, prefersReducedMotion.matches ? 0 : 0.18);
  gl.uniform1f(uniforms.fadeDistance, lowDetail ? 0.92 : 1.08);
  gl.uniform1f(uniforms.saturation, 1.04);
  gl.uniform2f(uniforms.mousePos, smoothPointer.x, smoothPointer.y);
  gl.uniform1f(uniforms.mouseInfluence, mouseInfluence);
  gl.uniform1f(uniforms.noiseAmount, lowDetail ? 0.014 : 0.025);
  gl.uniform1f(uniforms.distortion, config.distortion + matchFocus * 0.012);
  gl.uniform1f(uniforms.rayIntensity, intensity);
  gl.uniform1f(uniforms.rayOpacity, opacity);
  gl.uniform1f(uniforms.vignetteStrength, lowDetail ? 0.55 : 0.72);
}

function renderFrame(now) {
  if (!active || !gl || !program || !canvas) {
    return;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.clear(gl.COLOR_BUFFER_BIT);
  updateUniforms(now);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function animate(now = performance.now()) {
  if (!active || !gl || document.hidden) {
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
  if (!active || rafId || document.hidden) {
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
  orientationLastAt = Date.now();
  orientationStatus = simulated ? "simulated" : "active";
}

function resetOrientationControl() {
  orientationBaseline = null;
  targetPointer = { x: 0.5, y: 0.5 };
  smoothPointer = { x: 0.5, y: 0.5 };
}

function setRoute(route) {
  const normalized = route || window.location.pathname;
  const config = routeConfig(normalized);
  routeName = normalized;
  rayOrigin = config.origin;
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
      mode: "light-rays",
      active,
      hasRenderer: Boolean(gl && program),
      canvasPixels: canvas ? canvas.width * canvas.height : 0,
      lowDetail,
      pixelRatio,
      frameBudget: frameBudget(),
      route: routeName,
      rayOrigin,
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
