/**
 * ThoughtLine DOM port for the isolated Espaço Whats visual prototype.
 * Adapted from React Bits by David Haz, Copyright (c) 2026 David Haz.
 * MIT + Commons Clause; see LICENSE-react-bits.md and README-thought.md.
 * Original: https://reactbits.dev/micro/thought-line
 */

const create = (tag, className, text = "") => {
  const el = document.createElement(tag);
  el.className = className;
  if (text) el.textContent = text;
  return el;
};

const icon = kind => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute(
    "d",
    kind === "check"
      ? "m5 12 4 4 10-10"
      : kind === "chevron"
        ? "m6 9 6 6 6-6"
        : "m10 3 2.1 6.9L19 12l-6.9 2.1L10 21l-2.1-6.9L1 12l6.9-2.1L10 3Zm9-2 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
  );
  svg.append(path);
  return svg;
};

export function formatElapsed(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const tenths = Math.floor(safe * 10);
  const decimals = ((tenths % 600) / 10).toFixed(1).replace(".", ",");
  return tenths < 600
    ? `${decimals}s`
    : `${Math.floor(tenths / 600)}m ${decimals}s`;
}

export class ThoughtLine {
  constructor(container) {
    if (!container?.append)
      throw new TypeError("ThoughtLine precisa de um elemento de destino.");
    this.container = container;
    this.steps = [];
    this.timerId = null;
    this.startedAt = 0;
    this.elapsed = 0;
    this.working = false;
    this.open = false;
    this.destroyed = false;
    this.resizeFrame = null;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.root = create("div", "thought-line thought-line--espaco");
    this.root.hidden = true;
    this.head = create("button", "thought-line__head");
    this.head.type = "button";
    this.head.dataset.toggle = "";
    this.head.setAttribute("aria-label", "Ver etapas do pedido");
    this.glyph = create("span", "thought-line__glyph");
    this.glyph.setAttribute("aria-hidden", "true");
    this.glyph.append(icon("sparkle"));
    this.labelStack = create("span", "thought-line__label");
    this.labelStack.setAttribute("aria-hidden", "true");
    this.work = create("span", "thought-line__text");
    this.breath = create("span", "thought-line__breath");
    this.breath.dataset.shimmer = "";
    this.work.append(this.breath);
    this.done = create("span", "thought-line__text thought-line__text--done");
    this.labelStack.append(this.work, this.done);
    this.timer = create("span", "thought-line__timer", "0,0s");
    this.timer.setAttribute("aria-hidden", "true");
    this.chevron = create("span", "thought-line__chevron");
    this.chevron.dataset.on = "";
    this.chevron.setAttribute("aria-hidden", "true");
    this.chevron.append(icon("chevron"));
    this.sr = create("span", "thought-line__sr");
    this.sr.setAttribute("role", "status");
    this.sr.setAttribute("aria-live", "polite");
    this.sr.setAttribute("aria-atomic", "true");
    this.head.append(this.glyph, this.labelStack, this.timer, this.chevron);
    this.trace = create("div", "thought-line__trace");
    this.fold = create("div", "thought-line__fold");
    this.stepList = create("div", "thought-line__steps");
    this.fold.append(this.stepList);
    this.trace.append(this.fold);
    this.root.append(this.head, this.trace, this.sr);
    this.container.append(this.root);
    this.head.addEventListener("click", () => this.setOpen(!this.open));
    this.resize = new ResizeObserver(() => {
      // Apply layout writes after notification delivery, coalescing one frame.
      if (this.destroyed || this.resizeFrame !== null) return;
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = null;
        this.placeTimer(false);
      });
    });
    this.resize.observe(this.work);
    this.resize.observe(this.done);
  }

  setOpen(open) {
    this.open = Boolean(open) && this.steps.length > 0;
    this.root.toggleAttribute("data-open", this.open);
    this.trace.toggleAttribute("data-open", this.open);
    this.head.setAttribute("aria-expanded", String(this.open));
    this.trace.setAttribute("aria-hidden", String(!this.open));
  }

  /** Rotate a waiting label while keeping the same elapsed time and one status. */
  setStatus(text) {
    this.steps = [];
    this.set(text);
    this.setOpen(false);
  }

  placeTimer(glide = true) {
    if (this.root.hidden || this.destroyed) return;
    const active = this.working ? this.work : this.done;
    const shift = active.offsetWidth - this.labelStack.offsetWidth;
    if (!glide) this.timer.style.transition = "none";
    this.timer.style.transform = `translateX(${shift}px)`;
    if (!glide) {
      void this.timer.offsetWidth;
      this.timer.style.transition = "";
    }
  }

  paintTrace() {
    this.stepList.replaceChildren();
    this.steps.forEach((text, i) => {
      const done = !this.working || i < this.steps.length - 1;
      const row = create("div", "thought-line__step");
      row.toggleAttribute("data-done", done);
      const mark = create("span", "thought-line__mark");
      mark.setAttribute("aria-hidden", "true");
      mark.append(done ? icon("check") : create("i", "thought-line__pulse"));
      row.append(mark, create("span", "thought-line__step-text", text));
      this.stepList.append(row);
    });
  }

  /** Add a mock stage. Optional progress is a fraction from 0 to 1. */
  set(text, progress) {
    if (this.destroyed) return;
    const nextText = String(text ?? "").trim();
    if (!nextText) return;
    if (!this.working) {
      this.steps = [];
      this.startedAt = performance.now();
      this.elapsed = 0;
      this.working = true;
      this.timerId = setInterval(() => {
        this.elapsed = (performance.now() - this.startedAt) / 1000;
        this.timer.textContent = formatElapsed(this.elapsed);
      }, 100);
    }
    this.root.hidden = false;
    this.root.dataset.working = "";
    this.work.dataset.active = "";
    this.done.removeAttribute("data-active");
    this.timer.removeAttribute("data-done");
    this.breath.textContent = nextText;
    if (this.steps.at(-1) !== nextText) this.steps.push(nextText);
    if (Number.isFinite(progress))
      this.root.dataset.progress = String(Math.min(1, Math.max(0, progress)));
    this.sr.textContent = nextText;
    this.paintTrace();
    this.setOpen(true);
    this.placeTimer(false);
  }

  /** Finish the simulated task, freeze elapsed time, and collapse the trace. */
  settle(text = "Pedido concluído") {
    if (this.destroyed || this.root.hidden) return;
    clearInterval(this.timerId);
    this.timerId = null;
    if (this.working)
      this.elapsed = (performance.now() - this.startedAt) / 1000;
    this.working = false;
    this.root.removeAttribute("data-working");
    this.work.removeAttribute("data-active");
    this.done.textContent = String(text);
    this.done.dataset.active = "";
    this.timer.textContent = formatElapsed(this.elapsed);
    this.timer.dataset.done = "";
    this.sr.textContent = `${text}. Tempo: ${this.elapsed.toFixed(1).replace(".", ",")} segundos.`;
    this.paintTrace();
    this.setOpen(false);
    this.placeTimer(true);
  }

  clear() {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = null;
    clearInterval(this.timerId);
    this.timerId = null;
    this.working = false;
    this.elapsed = 0;
    this.steps = [];
    this.root.hidden = true;
    this.root.removeAttribute("data-working");
    this.root.removeAttribute("data-progress");
    this.breath.textContent = "";
    this.done.textContent = "";
    this.timer.textContent = "0,0s";
    this.sr.textContent = "";
    this.stepList.replaceChildren();
    this.setOpen(false);
  }

  destroy() {
    this.clear();
    this.resize.disconnect();
    this.root.remove();
    this.destroyed = true;
  }
}

export default ThoughtLine;
