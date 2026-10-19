import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WelcomeTour from ".";
import api from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() }
}));
jest.mock("driver.js", () => ({ driver: jest.fn() }));
jest.mock("react-canvas-confetti", () => {
  const React = require("react");
  const MockConfetti = ({ onInit }) => {
    React.useEffect(() => onInit({ confetti: global.mockConfetti }), [onInit]);
    return null;
  };
  return { __esModule: true, default: MockConfetti };
});
jest.mock("../../translate/i18n", () => {
  const instance = require("i18next").createInstance();
  instance.init({
    initImmediate: false,
    lng: "pt",
    ns: ["translations"],
    defaultNS: "translations",
    resources: require("../../translate/languages").messages
  });
  return { i18n: instance };
});

// Radix tooltips measure their trigger; jsdom has no ResizeObserver.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const comEstado = value => ({
  id: 7,
  profile: "admin",
  company: {
    name: "Loja Azul",
    settings: value === undefined ? undefined : [{ key: "welcomeTour", value }]
  }
});

let sons;
const audioMock = tocar => src => {
  const audio = {
    src,
    play: jest.fn(tocar),
    pause: jest.fn(),
    removeAttribute: jest.fn()
  };
  sons.push(audio);
  return audio;
};
beforeEach(() => {
  jest.resetAllMocks();
  api.put.mockResolvedValue({});
  global.mockConfetti = jest.fn();
  sons = [];
  window.Audio = jest.fn(audioMock(() => Promise.resolve()));
  document.body.innerHTML = "";
});

let raiz;
const renderizar = (user, props = {}) => {
  raiz = document.createElement("div");
  raiz.className = "estrutura-app";
  raiz.innerHTML = '<div class="MuiDrawer-paper"></div><main></main>';
  document.body.appendChild(raiz);
  return render(
    <WelcomeTour
      user={user}
      abrirNavegacao={jest.fn()}
      duracaoMontagem={400}
      {...props}
    />,
    { container: raiz.appendChild(document.createElement("div")) }
  );
};
const appVazio = () => raiz.hasAttribute("data-ew-vazio");
const mascote = () => screen.getByTestId("mascote").getAttribute("data-reacao");

test("builds the empty app with a drum roll, then Luiza celebrates", async () => {
  renderizar(comEstado("pending"));
  // The state travels with the user: no extra request, empty from the start.
  expect(api.get).not.toHaveBeenCalled();
  expect(appVazio()).toBe(true);

  expect(
    await screen.findByRole("dialog", { name: "Montando o seu espaço" })
  ).toBeTruthy();
  expect(appVazio()).toBe(false);
  expect(screen.getByRole("progressbar")).toBeTruthy();
  expect(sons[0].src).toMatch(/\/sounds\/drumroll\.mp3$/);
  expect(api.put).toHaveBeenCalledWith("/settings/welcomeTour", {
    value: "celebrated"
  });

  expect(
    await screen.findByRole("dialog", {
      name: "Parabéns, seu espaço está pronto!"
    })
  ).toBeTruthy();
  expect(sons[1].src).toMatch(/\/sounds\/success\.mp3$/);
  expect(mascote()).toBe("celebrate");
  expect(screen.getByText("TCHARAM!")).toBeTruthy();
  expect(
    await screen.findByRole(
      "button",
      { name: "Bora, me mostra!" },
      { timeout: 3000 }
    )
  ).toBeTruthy();
  expect(
    screen.getAllByText(/Loja Azul está no ar e o seu teste grátis começou/)
      .length
  ).toBeGreaterThan(0);
});

test("keeps the app empty and asks for a click when the drum roll is blocked", async () => {
  window.Audio = jest.fn(
    audioMock(() => Promise.reject(new Error("NotAllowedError")))
  );
  renderizar(comEstado("pending"));
  const montar = await screen.findByRole("button", {
    name: "Monta aí, Luiza!"
  });
  expect(appVazio()).toBe(true);
  expect(mascote()).toBe("sleeping");
  expect(api.put).not.toHaveBeenCalled();

  window.Audio = jest.fn(audioMock(() => Promise.resolve()));
  fireEvent.click(montar);
  expect(
    await screen.findByRole("dialog", { name: "Montando o seu espaço" })
  ).toBeTruthy();
  expect(appVazio()).toBe(false);
  expect(window.Audio).toHaveBeenCalledWith(
    expect.stringMatching(/drumroll\.mp3$/)
  );
});

test("a reload after the celebration greets the customer again, without the build", async () => {
  renderizar(comEstado("celebrated"));
  expect(
    await screen.findByRole("button", { name: "Bora, me mostra!" })
  ).toBeTruthy();
  expect(appVazio()).toBe(false);
  expect(window.Audio).not.toHaveBeenCalled();
  expect(global.mockConfetti).not.toHaveBeenCalled();
  expect(screen.getAllByText(/Oi de novo!/).length).toBeGreaterThan(0);
});

test("Luiza reacts to the answer being considered", async () => {
  renderizar(comEstado("celebrated"));
  fireEvent.mouseEnter(
    await screen.findByRole("button", { name: "Agora não" })
  );
  expect(mascote()).toBe("sad");
  fireEvent.mouseEnter(
    screen.getByRole("button", { name: "Bora, me mostra!" })
  );
  expect(mascote()).toBe("excited");
});

test("stores the answer so the welcome is shown only once", async () => {
  renderizar(comEstado("celebrated"));
  fireEvent.click(await screen.findByRole("button", { name: "Agora não" }));
  expect(api.put).toHaveBeenCalledWith("/settings/welcomeTour", {
    value: "done"
  });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("asks the server when the session does not carry the state", async () => {
  api.get.mockResolvedValue({ data: "" });
  renderizar(comEstado(undefined));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith("/settings/welcomeTour")
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(appVazio()).toBe(false);
});

test("does nothing for agents", () => {
  renderizar({ id: 8, profile: "user" });
  expect(api.get).not.toHaveBeenCalled();
  expect(appVazio()).toBe(false);
});
