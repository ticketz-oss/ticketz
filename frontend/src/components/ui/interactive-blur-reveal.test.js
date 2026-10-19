import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import InteractiveBlurReveal from "./interactive-blur-reveal";

let gl,
  mask,
  images,
  mediaQuery,
  mediaChange,
  frames,
  nextFrame,
  resizeObservers,
  intersectionObservers;
let contextSpy, rectSpy, hiddenSpy;
const originalImage = window.Image;
const originalResize = window.ResizeObserver;
const originalIntersection = window.IntersectionObserver;
const originalRaf = window.requestAnimationFrame;
const originalCancelRaf = window.cancelAnimationFrame;
const originalMatchMedia = window.matchMedia;
const originalDpr = window.devicePixelRatio;

function makeGl() {
  const result = {};
  for (const name of [
    "shaderSource",
    "compileShader",
    "deleteShader",
    "attachShader",
    "linkProgram",
    "deleteProgram",
    "deleteBuffer",
    "useProgram",
    "bindBuffer",
    "bufferData",
    "enableVertexAttribArray",
    "vertexAttribPointer",
    "activeTexture",
    "bindTexture",
    "pixelStorei",
    "texImage2D",
    "texParameteri",
    "deleteTexture",
    "uniform1i",
    "uniform2f",
    "uniform1f",
    "viewport",
    "texSubImage2D",
    "clear",
    "drawArrays"
  ])
    result[name] = jest.fn();
  for (const name of [
    "createShader",
    "createProgram",
    "createBuffer",
    "createTexture"
  ])
    result[name] = jest.fn(() => ({}));
  result.getShaderParameter = jest.fn(() => true);
  result.getProgramParameter = jest.fn(() => true);
  result.getAttribLocation = jest.fn(() => 0);
  result.getUniformLocation = jest.fn((program, name) => name);
  for (const [index, name] of [
    "VERTEX_SHADER",
    "FRAGMENT_SHADER",
    "COMPILE_STATUS",
    "LINK_STATUS",
    "ARRAY_BUFFER",
    "STATIC_DRAW",
    "FLOAT",
    "TEXTURE0",
    "TEXTURE_2D",
    "UNPACK_FLIP_Y_WEBGL",
    "RGBA",
    "UNSIGNED_BYTE",
    "TEXTURE_WRAP_S",
    "TEXTURE_WRAP_T",
    "REPEAT",
    "CLAMP_TO_EDGE",
    "TEXTURE_MIN_FILTER",
    "TEXTURE_MAG_FILTER",
    "LINEAR",
    "COLOR_BUFFER_BIT",
    "TRIANGLES"
  ].entries())
    result[name] = index + 1;
  return result;
}
const renderer = container => container.querySelector("[data-renderer]");
async function loadPair(start = 0) {
  await act(async () => {
    images[start].onload?.();
    images[start + 1].onload?.();
  });
}

beforeEach(() => {
  gl = makeGl();
  mask = Object.fromEntries(
    [
      "clearRect",
      "save",
      "restore",
      "fillRect",
      "beginPath",
      "arc",
      "fill",
      "moveTo",
      "lineTo",
      "stroke"
    ].map(name => [name, jest.fn()])
  );
  mask.createRadialGradient = jest.fn(() => ({ addColorStop: jest.fn() }));
  images = [];
  window.Image = class {
    naturalWidth = 1200;
    naturalHeight = 800;
    onload = null;
    onerror = null;
    src = "";
    constructor() {
      images.push(this);
    }
  };
  mediaQuery = {
    matches: false,
    addEventListener: jest.fn((type, handler) => {
      mediaChange = handler;
    }),
    removeEventListener: jest.fn()
  };
  window.matchMedia = jest.fn(() => mediaQuery);
  contextSpy = jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(type => (type === "webgl2" ? gl : mask));
  rectSpy = jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({
      width: 600,
      height: 400,
      left: 0,
      top: 0,
      right: 600,
      bottom: 400
    });
  hiddenSpy = jest.spyOn(document, "hidden", "get").mockReturnValue(false);
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: 3
  });
  frames = new Map();
  nextFrame = 0;
  window.requestAnimationFrame = jest.fn(callback => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  window.cancelAnimationFrame = jest.fn(id => frames.delete(id));
  resizeObservers = [];
  intersectionObservers = [];
  window.ResizeObserver = class {
    observe = jest.fn();
    disconnect = jest.fn();
    constructor(callback) {
      this.callback = callback;
      resizeObservers.push(this);
    }
  };
  window.IntersectionObserver = class {
    observe = jest.fn();
    disconnect = jest.fn();
    constructor(callback) {
      this.callback = callback;
      intersectionObservers.push(this);
    }
  };
});

afterEach(() => {
  contextSpy.mockRestore();
  rectSpy.mockRestore();
  hiddenSpy.mockRestore();
  window.Image = originalImage;
  window.ResizeObserver = originalResize;
  window.IntersectionObserver = originalIntersection;
  window.requestAnimationFrame = originalRaf;
  window.cancelAnimationFrame = originalCancelRaf;
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(window, "devicePixelRatio", {
    configurable: true,
    value: originalDpr
  });
});

test("shows a same-origin static fallback while initializing, then exposes WebGL only after drawing", async () => {
  const { container, unmount } = render(<InteractiveBlurReveal />);
  expect(renderer(container).dataset.renderer).toBe("static");
  expect(container.querySelector("img").getAttribute("src")).toBe(
    "/branding/login-desert.jpg"
  );
  expect(images.map(image => image.src)).toEqual([
    "/branding/login-desert.jpg",
    "/branding/reveal-noise.png"
  ]);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  await loadPair();
  expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  expect(renderer(container).dataset.renderer).toBe("webgl");
  expect(container.querySelector("canvas").width).toBe(900);
  expect(container.querySelector("canvas").height).toBe(600);
  expect(gl.uniform2f).toHaveBeenCalledWith("iImageSize", 1200, 800);
  expect(renderer(container).style.position).toBe("absolute");
  expect(container.querySelector("canvas").style.width).toBe("100%");
  unmount();
});

test.each(["no-webgl", "disabled", "reduced"])(
  "does not schedule animation in static mode (%s)",
  mode => {
    if (mode === "no-webgl") contextSpy.mockReturnValue(null);
    if (mode === "reduced") mediaQuery.matches = true;
    const { container, unmount } = render(
      <InteractiveBlurReveal enabled={mode !== "disabled"} />
    );
    expect(renderer(container).dataset.renderer).toBe("static");
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    if (mode !== "no-webgl") expect(contextSpy).not.toHaveBeenCalled();
    unmount();
  }
);

test("releases initialization resources after texture failure and falls back to the default if the custom image also fails", async () => {
  const { container, unmount } = render(
    <InteractiveBlurReveal iChannel0="/missing.png" />
  );
  await act(async () => images[0].onerror());
  expect(renderer(container).dataset.renderer).toBe("static");
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  expect(images[1].onload).toBeNull();
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  fireEvent.error(container.querySelector("img"));
  expect(container.querySelector("img").getAttribute("src")).toBe(
    "/branding/login-desert.jpg"
  );
  fireEvent.error(container.querySelector("img"));
  expect(container.querySelector("img").getAttribute("src")).toBe(
    "/branding/login-desert.jpg"
  );
  unmount();
});

test("aborts pending images and ignores captured late image callbacks after unmount", async () => {
  const { unmount } = render(<InteractiveBlurReveal />);
  const oldCallbacks = images.map(image => image.onload);
  unmount();
  expect(
    images.every(image => image.onload === null && image.onerror === null)
  ).toBe(true);
  await act(async () => oldCallbacks.forEach(callback => callback()));
  expect(gl.createTexture).not.toHaveBeenCalled();
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
});

test("restores a lost context without letting the previous pending generation install resources", async () => {
  const { container, unmount } = render(<InteractiveBlurReveal />);
  const canvas = container.querySelector("canvas");
  const oldCallbacks = images.map(image => image.onload);
  const lost = new Event("webglcontextlost", { cancelable: true });
  fireEvent(canvas, lost);
  expect(lost.defaultPrevented).toBe(true);
  expect(renderer(container).dataset.renderer).toBe("static");
  fireEvent(canvas, new Event("webglcontextrestored"));
  expect(images).toHaveLength(4);
  await act(async () => oldCallbacks.forEach(callback => callback()));
  expect(gl.createTexture).not.toHaveBeenCalled();
  await loadPair(2);
  expect(gl.createTexture).toHaveBeenCalledTimes(3);
  expect(renderer(container).dataset.renderer).toBe("webgl");
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
  expect(gl.deleteTexture).toHaveBeenCalledTimes(3);
});

test("changing texture props cleans up the old renderer and waits for the new images", async () => {
  const { container, rerender, unmount } = render(
    <InteractiveBlurReveal iChannel0="/first.png" />
  );
  await loadPair();
  rerender(
    <InteractiveBlurReveal iChannel0="/second.png" iChannel1="/noise2.png" />
  );
  expect(renderer(container).dataset.renderer).toBe("static");
  expect(gl.deleteTexture).toHaveBeenCalledTimes(3);
  expect(images.slice(2).map(image => image.src)).toEqual([
    "/second.png",
    "/noise2.png"
  ]);
  await loadPair(2);
  expect(renderer(container).dataset.renderer).toBe("webgl");
  unmount();
});

test("turning on reduced motion tears down all animation immediately", async () => {
  const { container, unmount } = render(<InteractiveBlurReveal />);
  await loadPair();
  await act(async () => {
    mediaQuery.matches = true;
    mediaChange();
  });
  expect(renderer(container).dataset.renderer).toBe("static");
  expect(frames.size).toBe(0);
  expect(gl.deleteTexture).toHaveBeenCalledTimes(3);
  expect(resizeObservers[0].disconnect).toHaveBeenCalled();
  unmount();
});

test("suspends RAF in a hidden tab and offscreen, and resumes only when both gates allow", async () => {
  const { unmount } = render(<InteractiveBlurReveal />);
  await loadPair();
  expect(frames.size).toBe(1);
  hiddenSpy.mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(frames.size).toBe(0);
  intersectionObservers[0].callback([{ isIntersecting: false }]);
  hiddenSpy.mockReturnValue(false);
  fireEvent(document, new Event("visibilitychange"));
  expect(frames.size).toBe(0);
  intersectionObservers[0].callback([{ isIntersecting: true }]);
  expect(frames.size).toBe(1);
  unmount();
  expect(intersectionObservers[0].disconnect).toHaveBeenCalled();
});

test("resizes to the containing panel using ResizeObserver instead of viewport dimensions", async () => {
  const { container, unmount } = render(<InteractiveBlurReveal />);
  await loadPair();
  rectSpy.mockReturnValue({
    width: 320,
    height: 700,
    left: 0,
    top: 0,
    right: 320,
    bottom: 700
  });
  resizeObservers[0].callback();
  expect(container.querySelector("canvas").width).toBe(480);
  expect(container.querySelector("canvas").height).toBe(1050);
  expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 480, 1050);
  unmount();
});

test("cleans even a texture allocation whose upload fails halfway", async () => {
  gl.texImage2D.mockImplementationOnce(() => {
    throw new Error("Upload failed");
  });
  const { container, unmount } = render(<InteractiveBlurReveal />);
  await loadPair();
  expect(renderer(container).dataset.renderer).toBe("static");
  expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
  unmount();
});

test("draws the actual soft trail only for pointer movement inside the panel", async () => {
  const clock = jest.spyOn(performance, "now").mockReturnValue(1000);
  const { unmount } = render(<InteractiveBlurReveal mouseRadius={130} />);
  try {
    await loadPair();
    const next = () => {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(1016);
    };
    fireEvent(
      window,
      new MouseEvent("pointermove", { clientX: 850, clientY: 200 })
    );
    clock.mockReturnValue(1016);
    next();
    expect(mask.arc).not.toHaveBeenCalled();
    fireEvent(
      window,
      new MouseEvent("pointermove", { clientX: 560, clientY: 200 })
    );
    clock.mockReturnValue(1032);
    next();
    expect(mask.createRadialGradient).toHaveBeenCalled();
    expect(mask.arc).toHaveBeenCalled();
    expect(gl.texSubImage2D).toHaveBeenCalled();
    const fragmentSource = gl.shaderSource.mock.calls.find(([, source]) =>
      source.includes("blur21")
    )[1];
    expect(fragmentSource).toContain(
      "vec2 imageUv = (screenUv - 0.5) * coverScale + 0.5"
    );
    expect(fragmentSource).toContain(
      "vec4 mixed = mix(frostedImage, clearImage, revealMask)"
    );
  } finally {
    unmount();
    clock.mockRestore();
  }
});

test("stops an already running renderer on context loss and rebuilds only after restore", async () => {
  const { container, unmount } = render(<InteractiveBlurReveal />);
  await loadPair();
  const canvas = container.querySelector("canvas");
  fireEvent(canvas, new Event("webglcontextlost", { cancelable: true }));
  expect(frames.size).toBe(0);
  expect(gl.deleteTexture).toHaveBeenCalledTimes(3);
  expect(renderer(container).dataset.renderer).toBe("static");
  fireEvent(canvas, new Event("webglcontextrestored"));
  await loadPair(2);
  expect(renderer(container).dataset.renderer).toBe("webgl");
  expect(frames.size).toBe(1);
  unmount();
});

test.each(["context-restore", "image-change", "re-enable"])(
  "resizes a fresh 300x150 mask even when the existing canvas is already 900x600 (%s)",
  async restart => {
    const masks = [];
    contextSpy.mockImplementation(function (type) {
      if (type === "webgl2") return gl;
      masks.push(this);
      return mask;
    });
    const { container, rerender, unmount } = render(
      <InteractiveBlurReveal iChannel0="/first.png" />
    );
    await loadPair();
    const canvas = container.querySelector("canvas");
    expect([canvas.width, canvas.height]).toEqual([900, 600]);
    expect([masks[0].width, masks[0].height]).toEqual([900, 600]);
    if (restart === "context-restore") {
      fireEvent(canvas, new Event("webglcontextlost", { cancelable: true }));
      fireEvent(canvas, new Event("webglcontextrestored"));
    } else if (restart === "image-change") {
      rerender(<InteractiveBlurReveal iChannel0="/second.png" />);
    } else {
      rerender(
        <InteractiveBlurReveal iChannel0="/first.png" enabled={false} />
      );
      rerender(<InteractiveBlurReveal iChannel0="/first.png" enabled />);
    }
    expect(masks).toHaveLength(2);
    expect([canvas.width, canvas.height]).toEqual([900, 600]);
    expect([masks[1].width, masks[1].height]).toEqual([300, 150]);
    await loadPair(2);
    expect([masks[1].width, masks[1].height]).toEqual([900, 600]);
    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 900, 600);
    expect(renderer(container).dataset.renderer).toBe("webgl");
    unmount();
  }
);
