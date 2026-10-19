import { montarPassos } from "./steps";

const t = key => key;

const sidebar = html => {
  document.body.innerHTML = html;
  // jsdom has no layout; treat every element as visible unless hidden.
  document.querySelectorAll("*").forEach(element => {
    element.getClientRects = () => (element.hidden ? [] : [{}]);
  });
  return document.body;
};

afterEach(() => {
  document.body.innerHTML = "";
});

test("explains only the sidebar areas this user can see, in sidebar order", () => {
  const root = sidebar(`
    <div class="nav-perfil"></div>
    <a data-tour="/tickets"></a>
    <button class="nav-abrir-atendimento"></button>
    <a data-tour="/connections"></a>
    <a data-tour="/cobranca" hidden></a>
  `);
  const passos = montarPassos(root, t);
  expect(passos.map(passo => passo.popover.title)).toEqual([
    "welcomeTour.intro.title",
    "welcomeTour.steps.newTicket.title",
    "welcomeTour.steps.tickets.title",
    "welcomeTour.steps.connections.title",
    "welcomeTour.steps.profile.title",
    "welcomeTour.finish.title"
  ]);
  expect(passos[2].element).toBe(root.querySelector('[data-tour="/tickets"]'));
  expect(passos.map(passo => passo.reacao)).toEqual([
    "excited",
    "excited",
    "working",
    "excited",
    "proud",
    "celebrate"
  ]);
  // Each area opens its screen behind the balloon; the end opens Connections.
  expect(passos.map(passo => passo.rota)).toEqual([
    undefined,
    undefined,
    "/tickets",
    "/connections",
    undefined,
    "/connections"
  ]);
  expect(passos[0].element).toBeUndefined();
  expect(passos[5].element).toBeUndefined();
});

test("matches grouped menus by their translation key", () => {
  const root = sidebar(
    '<li><div data-tour="mainDrawer.listItems.campaigns"></div></li>'
  );
  const [, campanhas] = montarPassos(root, t);
  expect(campanhas.popover.description).toBe(
    "welcomeTour.steps.campaigns.description"
  );
  expect(campanhas.rota).toBe("/campaigns");
});

test("returns no steps when the sidebar is not on screen", () => {
  expect(montarPassos(sidebar("<main></main>"), t)).toEqual([]);
});
