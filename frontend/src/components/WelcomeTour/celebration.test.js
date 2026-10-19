import { esvaziarApp, jogarConfetes, montarNavegacao } from "./celebration";

const estado = root =>
  [...root.querySelectorAll("[data-ew-montagem]")].map(el =>
    el.getAttribute("data-ew-montagem")
  );

beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = `
    <div class="estrutura-app">
      <div class="MuiDrawer-paper">
        <button class="nav-abrir-atendimento"></button>
        <nav>
          <li class="MuiListSubheader-root"></li>
          <a data-tour="/tickets"></a>
        </nav>
        <div class="nav-perfil"></div>
      </div>
      <main></main>
    </div>`;
});
afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = "";
});

const raiz = () => document.querySelector(".estrutura-app");

test("starts from an empty app and builds it piece by piece", () => {
  esvaziarApp(raiz());
  expect(raiz().hasAttribute("data-ew-vazio")).toBe(true);
  const pecas = [];
  const encerrar = montarNavegacao(raiz(), 1000, peca => pecas.push(peca));
  expect(raiz().hasAttribute("data-ew-vazio")).toBe(false);
  expect(estado(raiz())).toEqual(Array(6).fill("oculto"));

  jest.advanceTimersByTime(0);
  expect(raiz().querySelector(".MuiDrawer-paper").dataset.ewMontagem).toBe(
    "pronto"
  );

  // Each piece pops in as a sketch, then becomes real.
  jest.advanceTimersByTime(110);
  expect(
    raiz().querySelector(".nav-abrir-atendimento").dataset.ewMontagem
  ).toBe("esboco");
  jest.advanceTimersByTime(320);
  expect(
    raiz().querySelector(".nav-abrir-atendimento").dataset.ewMontagem
  ).toBe("pronto");

  jest.advanceTimersByTime(1000);
  expect(estado(raiz())).toEqual(Array(6).fill("pronto"));
  expect(pecas.map(peca => peca.grupo)).toEqual([false, true, false, false]);
  expect(pecas[3]).toEqual({ indice: 3, total: 4, grupo: false });

  encerrar();
  jest.advanceTimersByTime(700);
  expect(estado(raiz())).toEqual([]);
});

test("closing early shows everything at once", () => {
  esvaziarApp(raiz());
  const encerrar = montarNavegacao(raiz(), 5000);
  encerrar();
  expect(raiz().hasAttribute("data-ew-vazio")).toBe(false);
  expect(estado(raiz())).toEqual(Array(6).fill("pronto"));
});

test("throws confetti up and outwards from each of Luiza's hands", () => {
  const confetti = jest.fn();
  jogarConfetes(
    confetti,
    [
      { x: 0.4, y: 0.5 },
      { x: 0.3, y: 0.52 }
    ],
    ["#000"]
  );
  expect(confetti).toHaveBeenCalledTimes(2);
  expect(confetti.mock.calls[0][0]).toMatchObject({
    origin: { x: 0.4, y: 0.5 },
    angle: 65
  });
  expect(confetti.mock.calls[1][0]).toMatchObject({
    origin: { x: 0.3, y: 0.52 },
    angle: 115
  });
});
