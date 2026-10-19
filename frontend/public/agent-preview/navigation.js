const entries = [
  ["chat", "Chat", "chat"],
  ["history", "Histórico", "history"],
  ["files", "Arquivos", "clip"],
  ["skills", "Habilidades", "zap"],
  ["tasks", "Tarefas", "clock"],
  ["projects", "Projetos", "grid"],
  ["connections", "Conexões", "link"],
  ["specialists", "Especialistas", "users"]
];

export function mountNavigation(panel, { onNavigate }) {
  const toggle = panel.querySelector("#agent-menu");
  const menu = document.createElement("nav");
  menu.id = "agent-navigation";
  menu.className = "agent-navigation";
  menu.setAttribute("aria-label", "Ferramentas do agente");
  menu.hidden = true;
  let current = "chat";
  let expandedChannels = false;
  function item(id, text, icon) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "agent-nav-entry";
    button.dataset.view = id;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#i-${icon}`);
    svg.append(use);
    const label = document.createElement("span");
    label.textContent = text;
    button.append(svg, label);
    button.addEventListener("click", () => {
      close();
      onNavigate(id);
    });
    return button;
  }
  entries.forEach(([id, text, icon]) => menu.append(item(id, text, icon)));
  const more = document.createElement("button");
  more.type = "button";
  more.className = "agent-nav-entry agent-nav-more";
  more.textContent = "···  Mais";
  more.setAttribute("aria-expanded", "false");
  more.setAttribute("aria-controls", "agent-channels");
  const channels = document.createElement("div");
  channels.id = "agent-channels";
  channels.className = "agent-nav-channels";
  channels.hidden = true;
  channels.append(
    item("whatsapp", "WhatsApp", "chat"),
    item("mobile", "No celular", "link")
  );
  more.addEventListener("click", () => {
    expandedChannels = !expandedChannels;
    channels.hidden = !expandedChannels;
    more.setAttribute("aria-expanded", String(expandedChannels));
  });
  const footer = document.createElement("p");
  footer.className = "agent-nav-footer";
  footer.append(item("plans", "44 créditos · Ver planos", "spark"));
  const creditNote = document.createElement("small");
  creditNote.textContent = "Créditos e valores simulados";
  footer.append(creditNote);
  menu.append(more, channels, footer);
  panel.append(menu);
  function close() {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector(`[data-view="${current}"]`)?.focus();
  });
  document.addEventListener("click", event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
  document.addEventListener(
    "keydown",
    event => {
      if (menu.hidden) return;
      const buttons = [...menu.querySelectorAll("button")].filter(
        button => button.offsetParent !== null
      );
      const index = buttons.indexOf(document.activeElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (index +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  buttons.length) %
                buttons.length;
        buttons[next]?.focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
        toggle.focus();
      }
    },
    true
  );
  return {
    close,
    setCredits(credits) {
      footer.querySelector("[data-view=plans] span").textContent =
        `${credits.toLocaleString("pt-BR")} créditos · Ver planos`;
    },
    select(id) {
      current = id;
      menu.querySelectorAll("[data-view]").forEach(button => {
        if (button.dataset.view === id)
          button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
      panel.querySelector("#agent-view-caption").textContent =
        id === "chat"
          ? "Do seu lado, na operação"
          : id === "plans"
            ? "Planos e créditos"
            : entries.find(entry => entry[0] === id)?.[1] || "Canais";
    }
  };
}
