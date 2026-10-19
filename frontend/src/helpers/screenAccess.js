export const screenOptions = [
  { id: "dashboard", path: "/", label: "redesign.visaoGeral" },
  { id: "tickets", path: "/tickets", label: "mainDrawer.listItems.tickets" },
  { id: "chats", path: "/chats", label: "mainDrawer.listItems.chats" },
  { id: "todolist", path: "/todolist", label: "mainDrawer.listItems.tasks" },
  { id: "contacts", path: "/contacts", label: "mainDrawer.listItems.contacts" },
  { id: "tags", path: "/tags", label: "mainDrawer.listItems.tags" },
  {
    id: "schedules",
    path: "/schedules",
    label: "mainDrawer.listItems.schedules"
  },
  {
    id: "quick-messages",
    path: "/quick-messages",
    label: "mainDrawer.listItems.quickMessages"
  },
  {
    id: "connections",
    path: "/connections",
    label: "mainDrawer.listItems.connections"
  },
  { id: "queues", path: "/queues", label: "mainDrawer.listItems.queues" },
  { id: "fluxos", path: "/fluxos", label: "fluxos.titulo" },
  { id: "users", path: "/users", label: "mainDrawer.listItems.users" },
  {
    id: "announcements",
    path: "/announcements",
    label: "mainDrawer.listItems.annoucements"
  },
  {
    id: "financeiro",
    path: "/financeiro",
    label: "mainDrawer.listItems.financeiro"
  },
  { id: "settings", path: "/settings", label: "mainDrawer.listItems.settings" },
  { id: "helps", path: "/helps", label: "mainDrawer.listItems.helps" },
  { id: "chatgpt", path: "/chatgpt", label: "mainDrawer.listItems.chatgpt" },
  {
    id: "campaigns",
    path: "/campaigns",
    label: "mainDrawer.listItems.campaigns"
  },
  {
    id: "contact-lists",
    path: "/contact-lists",
    label: "redesign.listasContatos"
  },
  {
    id: "campaigns-config",
    path: "/campaigns-config",
    label: "mainDrawer.listItems.settings"
  },
  {
    id: "subscription",
    path: "/subscription",
    label: "mainDrawer.listItems.subscription"
  }
];

export const defaultUserScreens = [
  "tickets",
  "chats",
  "todolist",
  "contacts",
  "tags",
  "schedules",
  "quick-messages",
  "helps",
  "subscription"
];

export const canSeeScreen = (user, screen) =>
  Array.isArray(user?.visibleScreens)
    ? user.visibleScreens.includes(screen)
    : user?.profile === "admin" || defaultUserScreens.includes(screen);

export const screenForPath = path => {
  const match = screenOptions
    .filter(
      option => path === option.path || path.startsWith(`${option.path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (match) return match.id;
  if (path.startsWith("/campaign/")) return "campaigns";
  return null;
};
