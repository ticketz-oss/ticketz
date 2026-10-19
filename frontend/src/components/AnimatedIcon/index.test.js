/* eslint-disable testing-library/no-container, testing-library/no-node-access -- SVG geometry is decorative, so these regression tests inspect its actual paths/ref, not an accessible control. */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import AnimatedIcon, { MessageSquare, variantsFor } from "./index";
import { icons } from "./icons";

const mockControls = { start: jest.fn(), stop: jest.fn(), set: jest.fn() };
let mockReduced = false;
jest.mock("@material-ui/core/useMediaQuery", () => () => mockReduced);
jest.mock("framer-motion", () => {
  const React = require("react");
  const shape =
    tag =>
    ({ variants, initial, animate, custom, ...props }) =>
      React.createElement(tag, {
        ...props,
        "data-variant":
          typeof variants.animate === "function" ? "staggered" : "parts"
      });
  return {
    motion: {
      path: shape("path"),
      circle: shape("circle"),
      rect: shape("rect")
    },
    useAnimation: () => mockControls
  };
});
beforeEach(() => {
  jest.clearAllMocks();
  mockReduced = false;
});

it("anima pelo botão inteiro, preserva clique e restaura ao sair", () => {
  const click = jest.fn();
  render(
    <button onClick={click}>
      <span>Conversas</span>
      <MessageSquare />
    </button>
  );
  const button = screen.getByRole("button", { name: "Conversas" });
  fireEvent.mouseEnter(button);
  expect(mockControls.start).toHaveBeenCalledWith("animate");
  fireEvent.click(button);
  expect(click).toHaveBeenCalledTimes(1);
  fireEvent.mouseLeave(button);
  expect(mockControls.set).toHaveBeenCalledWith("normal");
});

it("anima ao focar pelo teclado e não interrompe ao retirar o mouse do botão focado", () => {
  render(
    <a href="/chats">
      <span>
        <MessageSquare />
      </span>
      Chat
    </a>
  );
  const link = screen.getByRole("link", { name: "Chat" });
  fireEvent.focusIn(link);
  expect(mockControls.start).toHaveBeenCalledTimes(1);
  fireEvent.mouseEnter(link);
  fireEvent.mouseLeave(link);
  expect(mockControls.set).not.toHaveBeenCalled();
  fireEvent.focusOut(link);
  expect(mockControls.set).toHaveBeenCalledWith("normal");
  expect(link.getAttribute("href")).toBe("/chats");
});

it.each(["disabled", "aria-disabled"])("não anima ações %s", attribute => {
  render(
    <button {...{ [attribute]: true }}>
      <MessageSquare />
      Enviar
    </button>
  );
  fireEvent.mouseEnter(screen.getByRole("button"));
  fireEvent.focusIn(screen.getByRole("button"));
  expect(mockControls.start).not.toHaveBeenCalled();
});

it("respeita movimento reduzido e remove os ouvintes ao desmontar", () => {
  mockReduced = true;
  const { unmount } = render(
    <button>
      <MessageSquare />
      Chat
    </button>
  );
  const button = screen.getByRole("button");
  fireEvent.mouseEnter(button);
  expect(mockControls.start).not.toHaveBeenCalled();
  expect(mockControls.set).toHaveBeenCalledWith("normal");
  unmount();
  jest.clearAllMocks();
  button.dispatchEvent(new MouseEvent("mouseenter"));
  expect(mockControls.start).not.toHaveBeenCalled();
});

it("mantém SVG externo estático, decora cada parte e preserva tamanho/ref", () => {
  const ref = React.createRef();
  const { container } = render(<MessageSquare ref={ref} size={28} />);
  const svg = container.querySelector("svg");
  expect(ref.current).toBe(svg);
  expect(svg.getAttribute("width")).toBe("28");
  expect(svg.style.transform).toBe("");
  expect(svg.getAttribute("aria-hidden")).toBe("true");
  expect(svg.querySelectorAll("[data-variant]")).toHaveLength(4);
  expect(variantsFor("MessageSquare", 1).animate(1).pathLength).toEqual([0, 1]);
  expect(
    variantsFor("MessageSquare", 2).animate(2).transition.delay
  ).toBeGreaterThan(
    variantsFor("MessageSquare", 1).animate(1).transition.delay
  );
  expect(variantsFor("LayoutDashboard", 0).animate(0).scale).toEqual([
    0.4, 1.04, 1
  ]);
});

it.each(Object.keys(icons))(
  "renderiza %s com geometria visível e sem animação de tremida",
  name => {
    const { container } = render(<AnimatedIcon name={name} />);
    expect(container.querySelector("svg").children.length).toBeGreaterThan(0);
    icons[name].forEach((_, index) => {
      const variants = variantsFor(name, index);
      expect(variants.normal.opacity).toBe(1);
      const animate =
        typeof variants.animate === "function"
          ? variants.animate(index)
          : variants.animate;
      expect(animate.rotate).toBeUndefined();
      expect(animate.pathLength || animate.scale).toBeDefined();
    });
  }
);
