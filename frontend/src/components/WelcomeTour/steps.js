// Each sidebar area the tour can explain, in the order it appears on screen.
// `alvo` matches the `data-tour` attribute set by the navigation (route or
// group key) or a class of a fixed sidebar control; `reacao` is how the
// mascot guiding the tour reacts to that area.
export const PASSOS_TOUR = [
  { id: "agent", seletor: ".agent-preview-launcher", reacao: "proud" },
  { id: "newTicket", seletor: ".nav-abrir-atendimento", reacao: "excited" },
  { id: "dashboard", alvo: "/", reacao: "curious" },
  { id: "tickets", alvo: "/tickets", reacao: "working" },
  { id: "chats", alvo: "/chats", reacao: "playful" },
  { id: "tasks", alvo: "/todolist", reacao: "working" },
  { id: "contacts", alvo: "/contacts", reacao: "happy" },
  { id: "tags", alvo: "/tags", reacao: "playful" },
  {
    id: "campaigns",
    alvo: "mainDrawer.listItems.campaigns",
    reacao: "excited"
  },
  { id: "schedules", alvo: "/schedules", reacao: "thinking" },
  { id: "prospeccao", alvo: "/prospeccao", reacao: "searching" },
  { id: "flows", alvo: "/fluxos", reacao: "thinking" },
  { id: "queues", alvo: "/queues", reacao: "working" },
  { id: "chatgpt", alvo: "/chatgpt", reacao: "curious" },
  { id: "quickMessages", alvo: "/quick-messages", reacao: "laughing" },
  { id: "connections", alvo: "/connections", reacao: "excited" },
  { id: "users", alvo: "/users", reacao: "happy" },
  { id: "announcements", alvo: "/announcements", reacao: "surprised" },
  { id: "financeiro", alvo: "/financeiro", reacao: "shy" },
  { id: "cobranca", alvo: "/cobranca", reacao: "searching" },
  { id: "settings", alvo: "/settings", reacao: "working" },
  { id: "helps", alvo: "/helps", reacao: "curious" },
  { id: "theme", alvo: "theme", reacao: "playful" },
  { id: "profile", seletor: ".nav-perfil", reacao: "proud" }
];

// The screen opened behind the balloon while an area is explained: the
// route itself for menu items, the first page of a grouped menu.
const ROTAS_DE_GRUPO = { "mainDrawer.listItems.campaigns": "/campaigns" };
// The last step points at Connections, the first thing to set up.
export const ROTA_FINAL = "/connections";
const rotaDe = passo =>
  passo.alvo?.startsWith("/") ? passo.alvo : ROTAS_DE_GRUPO[passo.alvo];

const seletorDe = passo =>
  passo.seletor || `[data-tour="${passo.alvo.replace(/"/g, '\\"')}"]`;

// Builds driver.js steps only for the areas this user can see, so the tour
// never points at a menu hidden by profile, plan or screen permissions.
export const montarPassos = (raiz, t) => {
  const passos = PASSOS_TOUR.map(passo => ({
    passo,
    elemento: raiz.querySelector(seletorDe(passo))
  }))
    .filter(({ elemento }) => elemento && elemento.getClientRects().length)
    .map(({ passo, elemento }) => ({
      element: elemento,
      reacao: passo.reacao,
      rota: rotaDe(passo),
      popover: {
        title: t(`welcomeTour.steps.${passo.id}.title`),
        description: t(`welcomeTour.steps.${passo.id}.description`),
        side: "right",
        align: "center"
      }
    }));
  if (!passos.length) return passos;
  return [
    {
      reacao: "excited",
      popover: {
        title: t("welcomeTour.intro.title"),
        description: t("welcomeTour.intro.description")
      }
    },
    ...passos,
    {
      reacao: "celebrate",
      rota: ROTA_FINAL,
      popover: {
        title: t("welcomeTour.finish.title"),
        description: t("welcomeTour.finish.description")
      }
    }
  ];
};
