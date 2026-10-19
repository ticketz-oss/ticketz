// Built using Hyperiux Vault: https://vault.hyperiux.com

"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";

/* ------------------------------------------------------------------ *
 * Inlined from ./webgl-context-recovery
 *
 * A raw WebGL2 context gets no automatic recovery. On `webglcontextlost`
 * the handler must call preventDefault() or the browser never fires
 * `webglcontextrestored`, leaving the canvas blank until a full reload.
 * ------------------------------------------------------------------ */
interface WebGLContextRecoveryHandlers {
  onLost?: (event: Event) => void;
  onRestored?: (event: Event) => void;
}

function attachWebGLContextRecovery(
  canvas: HTMLCanvasElement | null | undefined,
  handlers: WebGLContextRecoveryHandlers = {}
) {
  if (!canvas) return () => {};

  const { onLost, onRestored } = handlers;

  const handleLost = (event: Event) => {
    event.preventDefault();
    if (onLost) onLost(event);
  };

  const handleRestored = (event: Event) => {
    if (onRestored) onRestored(event);
  };

  canvas.addEventListener("webglcontextlost", handleLost, false);
  canvas.addEventListener("webglcontextrestored", handleRestored, false);

  return () => {
    canvas.removeEventListener("webglcontextlost", handleLost, false);
    canvas.removeEventListener("webglcontextrestored", handleRestored, false);
  };
}

/* ------------------------------------------------------------------ *
 * Inlined from ./createSuspendedRaf
 *
 * Owns a requestAnimationFrame loop that auto-pauses when the tab is
 * hidden or the root element is scrolled offscreen.
 * ------------------------------------------------------------------ */
const DEFAULT_ROOT_MARGIN = "256px";

type RafRoot =
  | Element
  | null
  | { current: Element | null }
  | (() => Element | null);

function resolveElement(root: RafRoot): Element | null {
  if (!root) return null;
  if (typeof root === "function") return root() ?? null;
  if (typeof root === "object" && "current" in root)
    return root.current ?? null;
  return root;
}

interface VisibilityGateOptions {
  root?: RafRoot;
  rootMargin?: string;
  threshold?: number;
  observeTab?: boolean;
  observeOffscreen?: boolean;
  onChange?: (active: boolean) => void;
}

interface VisibilityGate {
  readonly isActive: boolean;
  observe: (nextRoot?: RafRoot) => void;
  destroy: () => void;
}

function createVisibilityGate({
  root = null,
  rootMargin = DEFAULT_ROOT_MARGIN,
  threshold = 0,
  observeTab = true,
  observeOffscreen = true,
  onChange
}: VisibilityGateOptions = {}): VisibilityGate {
  let tabVisible = typeof document === "undefined" ? true : !document.hidden;
  let onscreen = true;
  let destroyed = false;
  let observer: IntersectionObserver | null = null;

  const isActive = () => {
    if (destroyed) return false;
    if (observeTab && !tabVisible) return false;
    if (observeOffscreen && resolveElement(root) && !onscreen) return false;
    return true;
  };

  let lastActive = isActive();

  const emit = () => {
    if (destroyed) return;
    const next = isActive();
    if (next === lastActive) return;
    lastActive = next;
    onChange?.(next);
  };

  const onVisibilityChange = () => {
    tabVisible = !document.hidden;
    emit();
  };

  if (observeTab && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  const bindObserver = () => {
    if (!observeOffscreen || typeof IntersectionObserver === "undefined") {
      return;
    }

    const el = resolveElement(root);
    if (!el) return;

    observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          onscreen = entry.isIntersecting;
        }
        emit();
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
  };

  bindObserver();

  return {
    get isActive() {
      return isActive();
    },

    observe(nextRoot?: RafRoot) {
      if (destroyed) return;
      if (nextRoot != null) root = nextRoot;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      onscreen = true;
      bindObserver();
      emit();
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (observeTab && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  };
}

interface SuspendedRafOptions {
  onFrame: (time: number) => void;
  root?: RafRoot;
  rootMargin?: string;
  threshold?: number;
  observeTab?: boolean;
  observeOffscreen?: boolean;
}

interface SuspendedRaf {
  start: () => void;
  stop: () => void;
  readonly isRunning: boolean;
  readonly isActive: boolean;
  observe: (nextRoot?: RafRoot) => void;
  destroy: () => void;
}

function createSuspendedRaf({
  onFrame,
  root = null,
  rootMargin = DEFAULT_ROOT_MARGIN,
  threshold = 0,
  observeTab = true,
  observeOffscreen = true
}: SuspendedRafOptions): SuspendedRaf {
  if (typeof onFrame !== "function") {
    throw new TypeError("createSuspendedRaf: onFrame is required");
  }

  let rafId: number | null = null;
  let running = false;
  let destroyed = false;

  const stopRaf = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const tick = (time: number) => {
    rafId = null;
    if (destroyed || !running || !gate.isActive) return;
    onFrame(time);
    if (!destroyed && running && gate.isActive) {
      rafId = requestAnimationFrame(tick);
    }
  };

  const sync = () => {
    if (destroyed) return;
    if (running && gate.isActive) {
      if (rafId == null) {
        rafId = requestAnimationFrame(tick);
      }
    } else {
      stopRaf();
    }
  };

  const gate = createVisibilityGate({
    root,
    rootMargin,
    threshold,
    observeTab,
    observeOffscreen,
    onChange: sync
  });

  return {
    start() {
      if (destroyed) return;
      running = true;
      sync();
    },

    stop() {
      running = false;
      stopRaf();
    },

    get isRunning() {
      return running;
    },

    get isActive() {
      return gate.isActive;
    },

    observe(nextRoot?: RafRoot) {
      gate.observe(nextRoot);
      sync();
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      running = false;
      stopRaf();
      gate.destroy();
    }
  };
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return prefersReducedMotion;
}

const FULLSCREEN_TRIANGLE_VERTICES = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
]);

const TEXTURE_UNIT_BASE = 0;
const TEXTURE_UNIT_NOISE = 1;
const TEXTURE_UNIT_MASK = 2;

const DEFAULT_POINTER_POSITION = 0.5;
const DEFAULT_FRAME_TIME_MS = 16.67;
const MAX_FRAME_DELTA_MS = 64;

const POINTER_LERP_FACTOR = 0.001;
const STOP_VELOCITY_EPSILON = 0.00008;

const MASK_FADE_ALPHA = 0.015;
const MASK_IDLE_FADE_ALPHA = 0.085;

const DEFAULT_MOUSE_RADIUS = 180;
const DEFAULT_DURATION = 0.3;

// Keep the defaults same-origin; remote replacement textures must allow CORS.
const DEFAULT_NOISE_TEXTURE = "/branding/reveal-noise.png";

// The original Hyperiux shader and pointer trail are retained below.
const DEFAULT_BASE_TEXTURE = "/branding/login-desert.jpg";

const BLUR_REVEAL_VERT = /* glsl */ `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BLUR_REVEAL_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform vec2      iResolution;
uniform vec2      iImageSize;
uniform float     iTime;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iMask;

out vec4 fragColor;

vec2 distortUv(vec2 uv) {
  vec2 noiseUv = uv * 2.2;
  vec2 noiseOffset = texture(iChannel1, noiseUv).xy - 0.5;

  return uv + noiseOffset * 0.012;
}

vec4 blur21(sampler2D tex, vec2 uv, float radiusPx) {
  vec2 px = radiusPx / iResolution;
  vec4 color = vec4(0.0);

  color += texture(tex, uv) * 0.12;

  color += texture(tex, uv + px * vec2(1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(-1.0, 0.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, 1.0)) * 0.08;
  color += texture(tex, uv + px * vec2(0.0, -1.0)) * 0.08;

  color += texture(tex, uv + px * vec2(1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, 1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(1.0, -1.0)) * 0.065;
  color += texture(tex, uv + px * vec2(-1.0, -1.0)) * 0.065;

  color += texture(tex, uv + px * vec2(2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(-2.0, 0.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, 2.0)) * 0.045;
  color += texture(tex, uv + px * vec2(0.0, -2.0)) * 0.045;

  color += texture(tex, uv + px * vec2(3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, 1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(3.0, -1.0)) * 0.025;
  color += texture(tex, uv + px * vec2(-3.0, -1.0)) * 0.025;

  return color;
}

vec3 filmGrain(vec2 uv) {
  vec2 coarseUv = uv * (iResolution.xy / 260.0) + vec2(iTime * 0.035, -iTime * 0.028);
  vec2 fineUv = uv * (iResolution.xy / 120.0) + vec2(-iTime * 0.055, iTime * 0.041);

  vec3 coarse = texture(iChannel1, coarseUv).rgb - 0.5;
  float fine = texture(iChannel1, fineUv).r - 0.5;
  vec3 chroma = vec3(coarse.r, coarse.g * 0.9, coarse.b * 1.1);

  return chroma * 0.95 + fine * 0.65;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / iResolution.xy;
  screenUv.y = 1.0 - screenUv.y;

  float viewAspect = iResolution.x / iResolution.y;
  float imageAspect = iImageSize.x / iImageSize.y;
  vec2 coverScale = vec2(min(1.0, viewAspect / imageAspect), min(1.0, imageAspect / viewAspect));
  vec2 imageUv = (screenUv - 0.5) * coverScale + 0.5;

  vec4 frostedImage = blur21(iChannel0, distortUv(imageUv), 42.0);
  vec4 clearImage = texture(iChannel0, imageUv);

  float mask = texture(iMask, screenUv).a;

  float cloudNoise = texture(iChannel1, screenUv * 7.0).r;
  float fineNoise = texture(iChannel1, screenUv * 22.0).r;

  float revealMask = smoothstep(
    0.04,
    0.95,
    mask + cloudNoise * 0.08 + fineNoise * 0.035
  );

  frostedImage.rgb = mix(frostedImage.rgb, vec3(0.70, 0.76, 0.78), 0.18);
  frostedImage.rgb *= 0.96;

  vec4 mixed = mix(frostedImage, clearImage, revealMask);

  float grainAmount = mix(0.24, 0.12, revealMask);
  mixed.rgb += filmGrain(screenUv) * grainAmount;

  vec2 vignetteDelta = screenUv - 0.5;
  float vignette = smoothstep(0.85, 0.25, dot(vignetteDelta, vignetteDelta) * 1.35);
  mixed.rgb *= mix(0.96, 1.0, vignette);

  fragColor = vec4(clamp(mixed.rgb, 0.0, 1.0), 1.0);
}
`;

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type) as WebGLShader;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const errorMessage =
      gl.getShaderInfoLog(shader) || "Shader compilation failed.";

    gl.deleteShader(shader);
    throw new Error(errorMessage);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  try {
    shaders.push(createShader(gl, gl.VERTEX_SHADER, vertexSource));
    shaders.push(createShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
    program = gl.createProgram();
    if (!program) throw new Error("Unable to allocate WebGL program.");
    shaders.forEach(shader => gl.attachShader(program!, shader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Program linking failed.");
    return program;
  } catch (error) {
    if (program) gl.deleteProgram(program);
    throw error;
  } finally {
    shaders.forEach(shader => gl.deleteShader(shader));
  }
}

function loadImage(
  source: string,
  signal: AbortSignal
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      image.src = "";
      reject(new Error("Image load canceled."));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    if (!source.startsWith("data:") && !source.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
      image.referrerPolicy = "no-referrer";
    }
    image.onload = () => {
      cleanup();
      if (!image.naturalWidth || !image.naturalHeight)
        reject(new Error("Empty texture image."));
      else resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error("Texture image unavailable."));
    };
    signal.addEventListener("abort", abort, { once: true });
    image.src = source;
  });
}

function createImageTexture(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement,
  unit: number,
  shouldRepeat = false,
  register: (texture: WebGLTexture) => void = () => {}
) {
  const texture = gl.createTexture() as WebGLTexture;
  if (!texture) throw new Error("Texture unavailable.");
  register(texture);

  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    shouldRepeat ? gl.REPEAT : gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

function createMaskTexture(
  gl: WebGL2RenderingContext,
  maskCanvas: HTMLCanvasElement,
  unit: number,
  register: (texture: WebGLTexture) => void = () => {}
) {
  const texture = gl.createTexture() as WebGLTexture;
  if (!texture) throw new Error("Mask texture unavailable.");
  register(texture);

  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    maskCanvas
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

function isPointInsideRect(clientX: number, clientY: number, rect: DOMRect) {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function getNormalizedPointer(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height
  };
}

function drawTrailStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  softRadius: number
) {
  const gradient = ctx.createRadialGradient(
    x,
    y,
    radius * 0.1,
    x,
    y,
    softRadius
  );

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.72)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, softRadius, 0, Math.PI * 2);
  ctx.fill();
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numericValue));
}

interface PointerState {
  isInside: boolean;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  lastTime: number;
  lastMoveTime: number;
  hasDrawn: boolean;
}

export interface InteractiveBlurRevealProps {
  /** Base image: a URL (must allow CORS) or a data URI. */
  iChannel0?: string;
  /** Tiling noise texture: a URL (must allow CORS) or a data URI. */
  iChannel1?: string;
  /** Disable WebGL entirely and show a static image. */
  enabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Radius of the cursor reveal mask, in canvas pixels. */
  mouseRadius?: number;
  /** Enable pointer-driven reveal drawing. */
  mouseInteraction?: boolean;
  /** Trail persistence and fade duration, in seconds. */
  duration?: number;
}

function InteractiveBlurReveal({
  iChannel0 = DEFAULT_BASE_TEXTURE,
  iChannel1 = DEFAULT_NOISE_TEXTURE,
  mouseRadius = DEFAULT_MOUSE_RADIUS,
  mouseInteraction = true,
  duration = DEFAULT_DURATION,
  enabled = true,
  className,
  style
}: InteractiveBlurRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [renderer, setRenderer] = useState<"static" | "webgl">("static");
  const [failedImage, setFailedImage] = useState("");
  const prefersReducedMotion = usePrefersReducedMotion();
  const configRef = useRef({
    mouseRadius: DEFAULT_MOUSE_RADIUS,
    mouseInteraction: true,
    duration: DEFAULT_DURATION
  });

  useEffect(() => {
    configRef.current = {
      mouseRadius: clampNumber(mouseRadius, 40, 420, DEFAULT_MOUSE_RADIUS),
      mouseInteraction,
      duration: clampNumber(duration, 0.08, 1.5, DEFAULT_DURATION)
    };
  }, [duration, mouseInteraction, mouseRadius]);

  const pointerRef = useRef<PointerState>({
    isInside: false,
    targetX: DEFAULT_POINTER_POSITION,
    targetY: DEFAULT_POINTER_POSITION,
    x: DEFAULT_POINTER_POSITION,
    y: DEFAULT_POINTER_POSITION,
    previousX: DEFAULT_POINTER_POSITION,
    previousY: DEFAULT_POINTER_POSITION,
    lastTime: 0,
    lastMoveTime: 0,
    hasDrawn: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    setRenderer("static");
    if (!canvas || !root || !enabled || prefersReducedMotion) return;

    let disposed = false;
    let generation = 0;
    let cleanupCurrent: (() => void) | null = null;
    const invalidate = () => {
      generation += 1;
      cleanupCurrent?.();
      cleanupCurrent = null;
    };

    const boot = async () => {
      invalidate();
      const ownGeneration = generation;
      let cleaned = false;
      const disposers: Array<() => void> = [];
      const abortController = new AbortController();
      const valid = () => !disposed && !cleaned && generation === ownGeneration;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        abortController.abort();
        disposers
          .splice(0)
          .reverse()
          .forEach(dispose => {
            try {
              dispose();
            } catch (_) {
              /* A lost GPU context may already own no resources. */
            }
          });
      };
      cleanupCurrent = cleanup;
      setRenderer("static");
      try {
        const gl = canvas.getContext("webgl2", {
          alpha: false,
          antialias: false,
          preserveDrawingBuffer: false
        });
        if (!gl) throw new Error("WebGL2 unavailable.");
        const maskCanvas = document.createElement("canvas");
        const maskCtx = maskCanvas.getContext("2d", {
          alpha: true,
          willReadFrequently: false
        });
        if (!maskCtx) throw new Error("Canvas mask unavailable.");
        const program = createProgram(gl, BLUR_REVEAL_VERT, BLUR_REVEAL_FRAG);
        disposers.push(() => gl.deleteProgram(program));
        const positionBuffer = gl.createBuffer();
        if (!positionBuffer) throw new Error("Buffer unavailable.");
        disposers.push(() => gl.deleteBuffer(positionBuffer));
        const positionLocation = gl.getAttribLocation(program, "position");
        const resolutionLocation = gl.getUniformLocation(
          program,
          "iResolution"
        );
        const imageSizeLocation = gl.getUniformLocation(program, "iImageSize");
        const timeLocation = gl.getUniformLocation(program, "iTime");
        const channel0Location = gl.getUniformLocation(program, "iChannel0");
        const channel1Location = gl.getUniformLocation(program, "iChannel1");
        const maskLocation = gl.getUniformLocation(program, "iMask");
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          FULLSCREEN_TRIANGLE_VERTICES,
          gl.STATIC_DRAW
        );
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const [baseImage, noiseImage] = await Promise.all([
          loadImage(iChannel0, abortController.signal),
          loadImage(iChannel1, abortController.signal)
        ]);
        if (!valid()) return;
        const textures: WebGLTexture[] = [];
        disposers.push(() =>
          textures.forEach(texture => gl.deleteTexture(texture))
        );
        const registerTexture = (texture: WebGLTexture) => {
          textures.push(texture);
        };
        createImageTexture(
          gl,
          baseImage,
          TEXTURE_UNIT_BASE,
          false,
          registerTexture
        );
        createImageTexture(
          gl,
          noiseImage,
          TEXTURE_UNIT_NOISE,
          true,
          registerTexture
        );
        const maskTexture = createMaskTexture(
          gl,
          maskCanvas,
          TEXTURE_UNIT_MASK,
          registerTexture
        );
        gl.uniform1i(channel0Location, TEXTURE_UNIT_BASE);
        gl.uniform1i(channel1Location, TEXTURE_UNIT_NOISE);
        gl.uniform1i(maskLocation, TEXTURE_UNIT_MASK);
        gl.uniform2f(
          imageSizeLocation,
          baseImage.naturalWidth,
          baseImage.naturalHeight
        );

        const resize = () => {
          const rect = root!.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
          const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
          if (
            canvas!.width === nextWidth &&
            canvas!.height === nextHeight &&
            maskCanvas.width === nextWidth &&
            maskCanvas.height === nextHeight
          )
            return;
          canvas!.width = nextWidth;
          canvas!.height = nextHeight;
          maskCanvas.width = nextWidth;
          maskCanvas.height = nextHeight;
          maskCtx!.clearRect(0, 0, nextWidth, nextHeight);
          gl!.viewport(0, 0, nextWidth, nextHeight);
          gl!.activeTexture(gl!.TEXTURE0 + TEXTURE_UNIT_MASK);
          gl!.bindTexture(gl!.TEXTURE_2D, maskTexture);
          gl!.texImage2D(
            gl!.TEXTURE_2D,
            0,
            gl!.RGBA,
            gl!.RGBA,
            gl!.UNSIGNED_BYTE,
            maskCanvas
          );
        };

        const updatePointerFromClient = (clientX: number, clientY: number) => {
          const rect = root.getBoundingClientRect();
          const pointer = pointerRef.current;
          const isInside =
            rect.width > 0 &&
            rect.height > 0 &&
            isPointInsideRect(clientX, clientY, rect);

          pointer.isInside = isInside;

          if (!isInside) return;

          const normalized = getNormalizedPointer(clientX, clientY, rect);

          pointer.targetX = normalized.x;
          pointer.targetY = normalized.y;
          pointer.lastMoveTime = performance.now();
        };

        const onWindowPointerMove = (event: PointerEvent) => {
          updatePointerFromClient(event.clientX, event.clientY);
        };

        const onWindowPointerLeave = (event: MouseEvent) => {
          if (!event.relatedTarget) {
            const pointer = pointerRef.current;

            pointer.isInside = false;
            pointer.hasDrawn = false;
          }
        };

        const fadeMask = (now: number, pointer: PointerState) => {
          const durationMs = configRef.current.duration * 1000;
          const idleAge = now - pointer.lastMoveTime;
          const idleFade = clampNumber(
            MASK_IDLE_FADE_ALPHA *
              (DEFAULT_DURATION / configRef.current.duration),
            0.015,
            0.22,
            MASK_IDLE_FADE_ALPHA
          );
          const activeFade = clampNumber(
            MASK_FADE_ALPHA * (DEFAULT_DURATION / configRef.current.duration),
            0.003,
            0.08,
            MASK_FADE_ALPHA
          );
          const fadeAlpha = idleAge > durationMs ? idleFade : activeFade;

          maskCtx.save();
          maskCtx.globalCompositeOperation = "destination-out";
          maskCtx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
          maskCtx.restore();
        };

        const drawTrail = (
          pointer: PointerState,
          velocity: number,
          now: number
        ) => {
          const durationMs = configRef.current.duration * 1000;
          const radius = configRef.current.mouseRadius;
          const softRadius = radius * 1.17;
          const lineWidth = radius * 1.05;
          const idleAge = now - pointer.lastMoveTime;

          const shouldDraw =
            configRef.current.mouseInteraction &&
            pointer.isInside &&
            idleAge <= durationMs &&
            velocity > STOP_VELOCITY_EPSILON;

          if (!shouldDraw) {
            pointer.hasDrawn = false;
            return;
          }

          const currentX = pointer.x * maskCanvas.width;
          const currentY = pointer.y * maskCanvas.height;
          const previousX = pointer.previousX * maskCanvas.width;
          const previousY = pointer.previousY * maskCanvas.height;

          maskCtx.save();

          maskCtx.globalCompositeOperation = "source-over";
          maskCtx.lineCap = "round";
          maskCtx.lineJoin = "round";
          maskCtx.strokeStyle = "rgba(255,255,255,0.72)";
          maskCtx.lineWidth = lineWidth;

          if (pointer.hasDrawn) {
            maskCtx.beginPath();
            maskCtx.moveTo(previousX, previousY);
            maskCtx.lineTo(currentX, currentY);
            maskCtx.stroke();
          }

          drawTrailStamp(maskCtx, currentX, currentY, radius, softRadius);

          maskCtx.restore();

          pointer.hasDrawn = true;
        };

        const uploadMaskTexture = () => {
          gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNIT_MASK);
          gl.bindTexture(gl.TEXTURE_2D, maskTexture);

          gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            maskCanvas
          );
        };

        const render = () => {
          const now = performance.now();
          const pointer = pointerRef.current;

          const frameDelta = pointer.lastTime
            ? Math.min(MAX_FRAME_DELTA_MS, now - pointer.lastTime)
            : DEFAULT_FRAME_TIME_MS;

          pointer.lastTime = now;

          const smoothing = configRef.current.mouseInteraction
            ? 1.0 - Math.pow(POINTER_LERP_FACTOR, frameDelta / 1000)
            : 0;

          pointer.previousX = pointer.x;
          pointer.previousY = pointer.y;

          pointer.x += (pointer.targetX - pointer.x) * smoothing;
          pointer.y += (pointer.targetY - pointer.y) * smoothing;

          const velocityX = pointer.x - pointer.previousX;
          const velocityY = pointer.y - pointer.previousY;
          const velocity = Math.hypot(velocityX, velocityY);

          fadeMask(now, pointer);
          drawTrail(pointer, velocity, now);
          uploadMaskTexture();

          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
          gl.uniform1f(timeLocation, now / 1000);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        };

        const onResize = () => {
          if (valid()) resize();
        };
        if (typeof ResizeObserver !== "undefined") {
          const observer = new ResizeObserver(onResize);
          observer.observe(root);
          disposers.push(() => observer.disconnect());
        }
        window.addEventListener("resize", onResize);
        disposers.push(() => window.removeEventListener("resize", onResize));
        window.addEventListener("pointermove", onWindowPointerMove, {
          passive: true
        });
        window.addEventListener("mouseout", onWindowPointerLeave);
        disposers.push(() => {
          window.removeEventListener("pointermove", onWindowPointerMove);
          window.removeEventListener("mouseout", onWindowPointerLeave);
        });
        const loop = createSuspendedRaf({
          root,
          rootMargin: "0px",
          onFrame: () => {
            if (!valid()) return;
            try {
              render();
            } catch (_) {
              cleanup();
              if (!disposed && generation === ownGeneration)
                setRenderer("static");
            }
          }
        });
        disposers.push(() => loop.destroy());
        resize();
        render();
        if (!valid()) return;
        setRenderer("webgl");
        loop.start();
      } catch (_) {
        cleanup();
        if (!disposed && generation === ownGeneration) setRenderer("static");
      }
    };
    const detachRecovery = attachWebGLContextRecovery(canvas, {
      onLost: () => {
        invalidate();
        if (!disposed) setRenderer("static");
      },
      onRestored: () => {
        if (!disposed) void boot();
      }
    });
    void boot();
    return () => {
      disposed = true;
      invalidate();
      detachRecovery();
    };
  }, [iChannel0, iChannel1, enabled, prefersReducedMotion]);

  const activeRenderer = enabled && !prefersReducedMotion ? renderer : "static";
  return (
    <div
      ref={rootRef}
      className={className}
      data-renderer={activeRenderer}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        ...style
      }}
    >
      <img
        src={failedImage === iChannel0 ? DEFAULT_BASE_TEXTURE : iChannel0}
        alt=""
        aria-hidden="true"
        onError={() => setFailedImage(iChannel0)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block"
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          opacity: activeRenderer === "webgl" ? 1 : 0
        }}
      />
    </div>
  );
}

export default InteractiveBlurReveal;
