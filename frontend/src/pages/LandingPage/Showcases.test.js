/* Camera transforms and SVG lines have no accessible role; inspect their
   rendered styles while exercising the story through scroll and controls. */
/* eslint-disable testing-library/no-node-access */
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { ProductExperience } from "./Showcases";

jest.mock("../../translate/i18n", () => {
  const copy = require("../../translate/languages/landingMotion").default;
  return {
    i18n: {
      t: (key, options = {}) => {
        const value = key
          .replace("landing.motion.", "")
          .split(".")
          .reduce((current, part) => current?.[part], copy);
        if (typeof value !== "string") return value || key;
        return value.replace(/{{(\w+)}}/g, (_, name) => options[name] || "");
      }
    }
  };
});

let root;
let viewport;
let frames;
let frameId;
let clock;
let mediaListeners;
let original;
const sectionStart = 1800;

function flushFrames(count = 100) {
  for (let index = 0; index < count && frames.size; index++) {
    const pending = [...frames.values()];
    frames.clear();
    clock += 16.67;
    const time = clock;
    act(() => pending.forEach(callback => callback(time)));
  }
}

function scrollTo(top, gesture = true, target = root) {
  if (gesture) fireEvent.touchMove(target);
  root.scrollTop = top;
  fireEvent.scroll(root);
  flushFrames();
}

function show(kind = "journey", reduced = false) {
  const view = render(<ProductExperience kind={kind} reduced={reduced} />, {
    container: root
  });
  flushFrames();
  return view;
}

const progress = () => Number(screen.getByRole("slider").value);

beforeEach(() => {
  viewport = { width: 390, height: 844 };
  frames = new Map();
  frameId = 0;
  clock = 0;
  mediaListeners = new Set();
  root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  Object.defineProperties(root, {
    clientWidth: { get: () => viewport.width },
    clientHeight: { get: () => viewport.height }
  });
  root.scrollTo = jest.fn(({ top }) => {
    root.scrollTop = top;
    fireEvent.scroll(root);
  });
  original = {
    matchMedia: window.matchMedia,
    intersection: window.IntersectionObserver,
    resize: window.ResizeObserver,
    request: window.requestAnimationFrame,
    cancel: window.cancelAnimationFrame,
    height: Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight"
    )
  };
  window.matchMedia = jest.fn(query => ({
    get matches() {
      return query.split(",").some(condition => {
        const minWidth = Number(
          condition.match(/min-width: (\d+)px/)?.[1] || 0
        );
        const maxWidth = Number(
          condition.match(/max-width: (\d+)px/)?.[1] || Infinity
        );
        const minHeight = Number(
          condition.match(/min-height: (\d+)px/)?.[1] || 0
        );
        return (
          viewport.width >= minWidth &&
          viewport.width <= maxWidth &&
          viewport.height >= minHeight
        );
      });
    },
    addEventListener: (_, listener) => mediaListeners.add(listener),
    removeEventListener: (_, listener) => mediaListeners.delete(listener)
  }));
  window.requestAnimationFrame = callback => {
    frames.set(++frameId, callback);
    return frameId;
  };
  window.cancelAnimationFrame = id => frames.delete(id);
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(target) {
      this.callback([{ target, isIntersecting: true }]);
    }
    disconnect() {}
  };
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      this.callback([
        { contentRect: { width: viewport.width - 20, height: 300 } }
      ]);
    }
    disconnect() {}
  };
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function () {
      return {
        top: this.classList.contains("lp-experience")
          ? sectionStart - root.scrollTop
          : 0,
        left: 0,
        width: viewport.width,
        height: viewport.height
      };
    });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return this.classList.contains("is-pinned") ? viewport.height * 3 : 850;
    }
  });
});

afterEach(() => {
  cleanup();
  root.remove();
  jest.restoreAllMocks();
  window.matchMedia = original.matchMedia;
  window.IntersectionObserver = original.intersection;
  window.ResizeObserver = original.resize;
  window.requestAnimationFrame = original.request;
  window.cancelAnimationFrame = original.cancel;
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", original.height);
});

test.each(["journey", "crm", "automation", "campaign"])(
  "%s follows phone scroll through different shots and story steps",
  kind => {
    show(kind);
    expect(progress()).toBe(0);
    expect(root.querySelector("section").classList.contains("is-pinned")).toBe(
      true
    );
    const camera = root.querySelector(".lp-scene-world").getAttribute("style");
    const caption = root.querySelector(".lp-scene-caption h3").textContent;
    scrollTo(sectionStart + 800);
    expect(progress()).toBeGreaterThan(300);
    expect(
      root.querySelector(".lp-scene-world").getAttribute("style")
    ).not.toBe(camera);
    expect(root.querySelector(".lp-scene-caption h3").textContent).not.toBe(
      caption
    );
    scrollTo(sectionStart + 2500);
    expect(progress()).toBe(1000);
    scrollTo(sectionStart - 110);
    expect(progress()).toBe(0);
  }
);

test("flow connections and cards reveal as the phone scrolls", () => {
  show();
  const line = root.querySelector("path[pathLength]");
  const lastCard = root.querySelector(".lp-flow-node--4");
  expect(line.style.strokeDashoffset).toBe("1");
  expect(lastCard.style.visibility).toBe("hidden");
  scrollTo(sectionStart + 1600);
  expect(line.style.strokeDashoffset).toBe("0");
  expect(lastCard.style.visibility).toBe("visible");
});

test.each([
  [375, 667, false],
  [320, 568, false],
  [390, 780, false],
  [844, 390, false],
  [768, 1024, true],
  [1440, 900, true]
])("scroll works at %s × %s, even without pinning", (width, height, pinned) => {
  viewport = { width, height };
  show();
  expect(root.querySelector("section").classList.contains("is-pinned")).toBe(
    pinned
  );
  scrollTo(sectionStart);
  const before = progress();
  scrollTo(sectionStart + 500);
  expect(progress()).toBeGreaterThan(before);
});

test("slider keeps its selection until a touch scroll, including over a card", () => {
  show();
  fireEvent.change(screen.getByRole("slider"), { target: { value: "500" } });
  flushFrames();
  expect(progress()).toBe(500);
  expect(root.scrollTo).toHaveBeenCalled();
  scrollTo(sectionStart + 1300, false);
  expect(progress()).toBe(500);
  scrollTo(sectionStart + 1400, true, root.querySelector(".lp-flow-node--0"));
  expect(progress()).toBeGreaterThan(700);
});

test("rotating the phone releases pinning and keeps scroll animation working", () => {
  show();
  scrollTo(sectionStart + 500);
  act(() => {
    viewport = { width: 844, height: 390 };
    mediaListeners.forEach(listener => listener());
  });
  fireEvent(window, new Event("resize"));
  flushFrames();
  expect(root.querySelector("section").classList.contains("is-pinned")).toBe(
    false
  );
  scrollTo(sectionStart);
  const before = progress();
  scrollTo(sectionStart + 400);
  expect(progress()).toBeGreaterThan(before);
});

test("reduced motion shows all cards without scroll-driven camera or particles", () => {
  show("journey", true);
  const camera = root.querySelector(".lp-scene-world").getAttribute("style");
  expect(root.querySelector("section").classList.contains("is-pinned")).toBe(
    false
  );
  expect(root.querySelector("animateMotion")).toBeNull();
  expect(root.querySelector(".lp-flow-node--4").style.visibility).toBe(
    "visible"
  );
  scrollTo(sectionStart + 1000);
  expect(root.querySelector(".lp-scene-world").getAttribute("style")).toBe(
    camera
  );
  expect(screen.getByRole("slider").value).toBe("0");
});
