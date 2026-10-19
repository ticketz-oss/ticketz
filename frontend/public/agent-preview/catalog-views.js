/** Interactive catalog views for the visual mock; no network or persistent storage. */

export const SKILLS = Object.freeze([
  {
    id: "summary",
    title: "Resumo dos atendimentos",
    description:
      "Transforme o movimento do dia em um panorama fácil de acompanhar.",
    category: "analysis",
    mine: true,
    icon: "chart",
    prompt: "Resuma os atendimentos de hoje e destaque o que merece atenção."
  },
  {
    id: "follow-up",
    title: "Mensagem de retorno",
    description:
      "Prepare uma resposta com o tom certo para retomar uma conversa.",
    category: "create",
    mine: true,
    icon: "message",
    prompt:
      "Prepare uma mensagem de retorno para um cliente que aguarda atendimento."
  },
  {
    id: "priorities",
    title: "Organizar prioridades",
    description:
      "Encontre os próximos passos para os atendimentos da sua equipe.",
    category: "organize",
    mine: true,
    icon: "list",
    prompt:
      "Organize as prioridades da equipe com base nos atendimentos em aberto."
  },
  {
    id: "queue",
    title: "Analisar a fila",
    description:
      "Veja gargalos, tempo de espera e pontos de atenção da operação.",
    category: "analysis",
    icon: "chart",
    prompt:
      "Analise a fila de atendimento e sugira onde a equipe pode focar agora."
  },
  {
    id: "quality",
    title: "Qualidade das respostas",
    description:
      "Revise clareza, acolhimento e próximos passos de uma conversa.",
    category: "analysis",
    icon: "spark",
    prompt: "Me ajude a revisar a qualidade das respostas de um atendimento."
  },
  {
    id: "templates",
    title: "Criar respostas rápidas",
    description: "Monte mensagens úteis para as dúvidas que mais aparecem.",
    category: "create",
    icon: "message",
    prompt:
      "Crie três respostas rápidas para dúvidas frequentes dos nossos clientes."
  },
  {
    id: "campaign",
    title: "Escrever uma campanha",
    description: "Rascunhe uma mensagem comercial clara, próxima e objetiva.",
    category: "create",
    icon: "spark",
    prompt:
      "Me ajude a escrever uma mensagem comercial para uma campanha no WhatsApp."
  },
  {
    id: "handoff",
    title: "Preparar uma transferência",
    description:
      "Reúna o contexto para outro atendente continuar de onde parou.",
    category: "organize",
    icon: "list",
    prompt:
      "Prepare um resumo para transferir um atendimento para outra pessoa da equipe."
  },
  {
    id: "routine",
    title: "Planejar a rotina",
    description: "Organize uma sequência de ações para o próximo turno.",
    category: "organize",
    icon: "calendar",
    prompt:
      "Monte um plano simples para a rotina de atendimento do próximo turno."
  }
]);

export const CONNECTIONS = Object.freeze([
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Conversas, contatos e contexto dos atendimentos.",
    category: "Mensagens",
    popular: true,
    icon: "message",
    hue: "green"
  },
  {
    id: "crm",
    title: "CRM Espaço",
    description: "Oportunidades, etapas comerciais e histórico do cliente.",
    category: "Vendas",
    popular: true,
    icon: "chart",
    hue: "orange"
  },
  {
    id: "calendar",
    title: "Google Calendar",
    description: "Compromissos e disponibilidade da equipe.",
    category: "Agenda",
    popular: true,
    icon: "calendar",
    hue: "blue"
  },
  {
    id: "drive",
    title: "Google Drive",
    description: "Documentos e materiais de apoio para sua equipe.",
    category: "Arquivos",
    popular: true,
    icon: "folder",
    hue: "yellow"
  },
  {
    id: "sheets",
    title: "Google Sheets",
    description: "Planilhas para acompanhar sua operação.",
    category: "Dados",
    popular: true,
    icon: "grid",
    hue: "green"
  },
  {
    id: "slack",
    title: "Slack",
    description: "Atualizações e conversas entre os times.",
    category: "Equipe",
    popular: true,
    icon: "grid",
    hue: "purple"
  },
  {
    id: "notion",
    title: "Notion",
    description: "Base de conhecimento e processos do negócio.",
    category: "Conhecimento",
    icon: "folder",
    hue: "neutral"
  },
  {
    id: "gmail",
    title: "Gmail",
    description: "E-mails e informações de contatos.",
    category: "Mensagens",
    icon: "mail",
    hue: "red"
  },
  {
    id: "outlook",
    title: "Outlook",
    description: "Correspondências e compromissos em um só lugar.",
    category: "Mensagens",
    icon: "mail",
    hue: "blue"
  },
  {
    id: "hubspot",
    title: "HubSpot",
    description: "Contexto comercial e relacionamento com clientes.",
    category: "Vendas",
    icon: "chart",
    hue: "orange"
  },
  {
    id: "trello",
    title: "Trello",
    description: "Tarefas e acompanhamento dos próximos passos.",
    category: "Organização",
    icon: "list",
    hue: "blue"
  },
  {
    id: "zendesk",
    title: "Zendesk",
    description: "Solicitações e informações de suporte.",
    category: "Atendimento",
    icon: "headset",
    hue: "green"
  }
]);

export const SPECIALISTS = Object.freeze([
  {
    id: "triage",
    title: "Triagem",
    role: "A primeira conversa, no caminho certo",
    description:
      "Entende o pedido, reúne o contexto e sugere o destino ideal para cada atendimento.",
    icon: "route",
    hue: "orange",
    prompt:
      "Quero a ajuda do especialista de triagem para organizar os próximos atendimentos."
  },
  {
    id: "support",
    title: "Suporte",
    role: "Clareza para resolver dúvidas",
    description:
      "Ajuda a investigar dúvidas e preparar respostas acolhedoras, com passos fáceis de seguir.",
    icon: "headset",
    hue: "blue",
    prompt:
      "Quero a ajuda do especialista de suporte para preparar uma resposta a um cliente."
  },
  {
    id: "sales",
    title: "Comercial",
    role: "Conversas que criam oportunidades",
    description:
      "Apoia a abordagem, a qualificação e o retorno a clientes interessados no seu negócio.",
    icon: "chart",
    hue: "orange",
    prompt:
      "Quero a ajuda do especialista comercial para retomar uma oportunidade de venda."
  },
  {
    id: "after-sales",
    title: "Pós-venda",
    role: "Cuidado que continua depois da compra",
    description:
      "Prepara acompanhamentos e ajuda a manter o relacionamento próximo com seus clientes.",
    icon: "heart",
    hue: "pink",
    prompt:
      "Quero a ajuda do especialista de pós-venda para preparar um acompanhamento com o cliente."
  },
  {
    id: "management",
    title: "Gestão",
    role: "Um olhar sobre toda a operação",
    description:
      "Resume indicadores e sugere prioridades para organizar o trabalho da sua equipe.",
    icon: "grid",
    hue: "purple",
    prompt:
      "Quero a ajuda do especialista de gestão para resumir a operação e definir prioridades."
  },
  {
    id: "knowledge",
    title: "Conhecimento",
    role: "As respostas da equipe, bem organizadas",
    description:
      "Transforma dúvidas recorrentes em orientações e materiais para o time consultar.",
    icon: "folder",
    hue: "green",
    prompt:
      "Quero a ajuda do especialista de conhecimento para organizar nossas respostas frequentes."
  }
]);

export function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function filterCatalog(items, query) {
  const term = normalizeSearch(query);
  return items.filter(item =>
    normalizeSearch(
      `${item.title} ${item.description} ${item.category ?? ""} ${item.role ?? ""}`
    ).includes(term)
  );
}

export function validateMcpEndpoint(value) {
  try {
    const url = new URL(String(value).trim());
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const PATHS = {
  spark: "m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z",
  message:
    "M21 11.5a8.4 8.4 0 0 1-8.5 8.5H5l-3 2v-8.5A8.5 8.5 0 1 1 21 11.5ZM8 10h8m-8 4h5",
  chart: "M4 20h16M6 16v-5m6 5V5m6 11V8",
  list: "M8 6h12M8 12h12M8 18h12M3 6h1m-1 6h1m-1 6h1",
  calendar:
    "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2-2v4m10-4v4M4 10h16m-12 4h3m3 0h2",
  folder:
    "M3 7V5a1 1 0 0 1 1-1h5l3 3h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  mail: "M4 5h16v14H4V5Zm0 2 8 6 8-6",
  headset:
    "M4 13v-2a8 8 0 0 1 16 0v2M4 12H3v6h4v-6H4Zm16 0h1v6h-4v-6h3Zm0 6v1a2 2 0 0 1-2 2h-5",
  route: "M5 4v16m0-8h7a6 6 0 0 0 6-6V4m-3 3 3-3 3 3M2 17l3 3 3-3",
  heart: "M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 8 15 8 15s13-10 8-15Z",
  search: "M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 6 6",
  plus: "M12 5v14M5 12h14",
  arrow: "M19 12H5m6-6-6 6 6 6",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4 10-10",
  plug: "M9 3v5m6-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v4"
};

function icon(name, className = "cv-icon") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", PATHS[name] ?? PATHS.spark);
  svg.append(path);
  return svg;
}

function button(label, className, callback, iconName) {
  const node = el("button", className);
  node.type = "button";
  if (iconName) node.append(icon(iconName));
  node.append(el("span", "", label));
  node.addEventListener("click", callback);
  return node;
}

/** host should be positioned and have the dimensions of the agent panel. */
export function mountCatalogViews(
  host,
  { onPrompt = () => {}, onClose = () => {} } = {}
) {
  const root = el("section", "cv-surface");
  root.hidden = true;
  const header = el("header", "cv-header");
  const back = button(
    "",
    "cv-icon-button",
    () => close({ notify: true }),
    "arrow"
  );
  back.setAttribute("aria-label", "Voltar para a conversa");
  const heading = el("h2", "cv-heading");
  const exit = button(
    "",
    "cv-icon-button",
    () => close({ notify: true }),
    "close"
  );
  exit.setAttribute("aria-label", "Fechar catálogo");
  header.append(back, heading, exit);
  const body = el("div", "cv-body");
  const notification = el("div", "cv-notification");
  notification.setAttribute("role", "status");
  notification.setAttribute("aria-live", "polite");
  notification.hidden = true;
  root.append(header, body, notification);
  host.append(root);
  let view = "skills";
  let tab = "mine";
  let query = "";
  let notificationTimer;
  let modal = null;
  let previouslyFocused = null;
  let counter = 0;
  const customSkills = [];
  const customConnections = [];
  const connected = new Set();

  function notify(text) {
    notification.textContent = text;
    notification.hidden = false;
    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
      notification.hidden = true;
    }, 3500);
  }

  function close({ notify: shouldNotify = false } = {}) {
    const wasOpen = !root.hidden;
    closeModal();
    root.hidden = true;
    clearTimeout(notificationTimer);
    notification.hidden = true;
    if (wasOpen && shouldNotify) {
      onClose();
      root.dispatchEvent(new CustomEvent("catalog-close", { bubbles: true }));
      previouslyFocused?.focus();
    }
  }

  function prompt(text) {
    close();
    onPrompt(text);
  }

  function tabs(options) {
    const group = el("div", "cv-tabs");
    group.setAttribute("role", "tablist");
    group.setAttribute("aria-label", "Filtrar catálogo");
    options.forEach(([id, title]) => {
      const item = button(title, "cv-tab", () => {
        tab = id;
        render();
        body.querySelector(`[data-cv-tab="${id}"]`)?.focus();
      });
      item.dataset.cvTab = id;
      item.setAttribute("role", "tab");
      item.setAttribute("aria-selected", String(tab === id));
      item.setAttribute("aria-controls", "cv-results");
      item.tabIndex = tab === id ? 0 : -1;
      group.append(item);
    });
    group.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const current = options.findIndex(([id]) => id === tab);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : (current +
                (event.key === "ArrowRight" ? 1 : -1) +
                options.length) %
              options.length;
      tab = options[next][0];
      render();
      body.querySelector(`[data-cv-tab="${tab}"]`)?.focus();
    });
    return group;
  }

  function toolbar(placeholder) {
    const search = el("label", "cv-search");
    search.append(icon("search"));
    const input = el("input", "cv-search-input");
    input.type = "search";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    input.value = query;
    input.addEventListener("input", () => {
      query = input.value;
      renderCards();
    });
    search.append(input);
    return search;
  }

  function badge(item) {
    const node = el("div", `cv-card-icon cv-hue-${item.hue ?? "orange"}`);
    node.append(icon(item.icon));
    return node;
  }

  function render() {
    closeModal();
    body.replaceChildren();
    const intro = el("div", "cv-intro");
    const title =
      view === "skills"
        ? "Uma ajuda para cada tarefa"
        : view === "connections"
          ? "Seu contexto, mais próximo"
          : "Encontre a ajuda certa";
    const description =
      view === "skills"
        ? "Escolha uma habilidade e transforme seu próximo pedido em um bom começo."
        : view === "connections"
          ? "Explore as ferramentas que podem fazer parte da rotina do seu agente."
          : "Especialistas para apoiar cada momento do relacionamento com seus clientes.";
    intro.append(el("h3", "", title), el("p", "", description));
    body.append(intro);
    if (view === "skills") {
      body.append(
        button(
          "Criar habilidade",
          "cv-create-skill",
          () => openSkillModal(),
          "plus"
        )
      );
      body.append(toolbar("Pesquisar habilidades"));
      body.append(
        tabs([
          ["mine", "Suas habilidades"],
          ["analysis", "Analisar"],
          ["create", "Criar"],
          ["organize", "Organizar"]
        ])
      );
    } else if (view === "connections") {
      body.append(toolbar("Pesquisar conexões"));
      body.append(
        tabs([
          ["popular", "Populares"],
          ["all", "Todos"],
          ["mcp", "MCP personalizado"]
        ])
      );
      body.append(
        el("p", "cv-simulation-note", "Conexões simuladas nesta prévia visual.")
      );
      if (tab === "mcp")
        body.append(
          button(
            "Adicionar MCP personalizado",
            "cv-create-skill",
            () => openMcpModal(),
            "plus"
          )
        );
    } else {
      body.append(toolbar("Pesquisar especialistas"));
    }
    const results = el("div", "cv-results");
    results.id = "cv-results";
    results.setAttribute("role", "tabpanel");
    body.append(results);
    renderCards();
  }

  function renderCards() {
    const results = body.querySelector(".cv-results");
    if (!results) return;
    results.replaceChildren();
    let items =
      view === "skills"
        ? [...SKILLS, ...customSkills].filter(item =>
            tab === "mine" ? item.mine : item.category === tab
          )
        : view === "connections"
          ? [...CONNECTIONS, ...customConnections].filter(item =>
              tab === "popular" ? item.popular : tab === "mcp" ? item.mcp : true
            )
          : [...SPECIALISTS];
    items = filterCatalog(items, query);
    const noun =
      view === "skills"
        ? items.length === 1
          ? "habilidade"
          : "habilidades"
        : view === "connections"
          ? items.length === 1
            ? "conexão"
            : "conexões"
          : items.length === 1
            ? "especialista"
            : "especialistas";
    const total = el("p", "cv-results-count", `${items.length} ${noun}`);
    results.append(total);
    if (!items.length) {
      const empty = el("div", "cv-empty");
      empty.append(
        icon(view === "connections" ? "plug" : "search"),
        el(
          "h4",
          "",
          query ? "Nenhum resultado por aqui" : "Comece com o seu contexto"
        ),
        el(
          "p",
          "",
          query
            ? "Tente buscar por outra palavra ou trocar de categoria."
            : "Adicione um MCP personalizado para explorar essa conexão na prévia."
        )
      );
      results.append(empty);
      return;
    }
    const cards = el(
      "div",
      view === "specialists" ? "cv-grid cv-grid-specialists" : "cv-grid"
    );
    items.forEach(item => {
      const card = el(
        "article",
        `cv-card${view === "specialists" ? " cv-specialist" : ""}`
      );
      const top = el("div", "cv-card-top");
      top.append(badge(item));
      if (view === "connections")
        top.append(el("span", "cv-category", item.mcp ? "MCP" : item.category));
      else if (item.custom)
        top.append(el("span", "cv-category", "Sua habilidade"));
      card.append(top, el("h4", "", item.title));
      if (item.role) card.append(el("div", "cv-specialist-role", item.role));
      card.append(el("p", "cv-description", item.description));
      if (view === "connections") {
        const active = connected.has(item.id);
        const action = button(
          active ? "Conectado" : "Conectar",
          active ? "cv-action cv-action-connected" : "cv-action",
          () => {
            if (connected.has(item.id)) connected.delete(item.id);
            else connected.add(item.id);
            notify(
              `${item.title}: ${connected.has(item.id) ? "conexão simulada" : "conexão removida da prévia"}.`
            );
            renderCards();
            results.querySelector(`[data-connection-id="${item.id}"]`)?.focus();
          },
          active ? "check" : "plus"
        );
        action.dataset.connectionId = item.id;
        action.setAttribute("aria-pressed", String(active));
        action.setAttribute(
          "aria-label",
          `${active ? "Remover conexão simulada com" : "Simular conexão com"} ${item.title}`
        );
        card.append(action);
      } else
        card.append(
          button(
            view === "specialists"
              ? "Conversar com especialista"
              : "Usar habilidade",
            "cv-action",
            () => prompt(item.prompt),
            "spark"
          )
        );
      cards.append(card);
    });
    results.append(cards);
  }

  function closeModal() {
    if (!modal) return;
    modal.remove();
    modal = null;
    body.inert = false;
    header.inert = false;
  }

  function formField(label, tag, placeholder) {
    const wrap = el("label", "cv-form-label", label);
    const input = el(tag, "cv-form-input");
    input.placeholder = placeholder;
    input.required = true;
    if (tag === "input") input.type = "text";
    wrap.append(input);
    return { wrap, input };
  }

  function dialog(title, subtitle, onSubmit) {
    closeModal();
    modal = el("div", "cv-modal-backdrop");
    const box = el("section", "cv-modal");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", title);
    const top = el("div", "cv-modal-heading");
    const dismiss = button(
      "",
      "cv-icon-button",
      () => {
        closeModal();
        back.focus();
      },
      "close"
    );
    dismiss.setAttribute("aria-label", "Fechar janela");
    top.append(el("h3", "", title), dismiss);
    const form = el("form", "cv-form");
    form.addEventListener("submit", event => {
      event.preventDefault();
      onSubmit(form);
    });
    box.append(top, el("p", "cv-modal-subtitle", subtitle), form);
    modal.append(box);
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal();
        back.focus();
      }
    });
    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeModal();
        back.focus();
      }
      if (event.key === "Tab") {
        const focusable = [
          ...box.querySelectorAll("button, input, textarea")
        ].filter(node => !node.disabled);
        if (event.shiftKey && document.activeElement === focusable[0]) {
          event.preventDefault();
          focusable.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === focusable.at(-1)
        ) {
          event.preventDefault();
          focusable[0]?.focus();
        }
      }
    });
    body.inert = true;
    header.inert = true;
    root.append(modal);
    return form;
  }

  function submitButton(text) {
    const submit = el("button", "cv-submit", text);
    submit.type = "submit";
    return submit;
  }

  function openSkillModal() {
    const name = formField(
      "Nome da habilidade",
      "input",
      "Ex.: Resposta para dúvidas sobre entrega"
    );
    const instructions = formField(
      "Como o agente deve ajudar?",
      "textarea",
      "Descreva a tarefa, o tom da resposta e o que deve ser considerado."
    );
    name.input.maxLength = 80;
    instructions.input.maxLength = 2000;
    const form = dialog(
      "Criar uma habilidade",
      "Ensine uma tarefa que faz parte da sua rotina.",
      () => {
        const title = name.input.value.trim();
        const description = instructions.input.value.trim();
        if (!title || !description) return;
        customSkills.push({
          id: `custom-skill-${++counter}`,
          title,
          description,
          category: "create",
          mine: true,
          custom: true,
          icon: "spark",
          prompt: `${title}: ${description}`
        });
        tab = "mine";
        query = "";
        render();
        notify("Habilidade criada nesta prévia.");
        back.focus();
      }
    );
    form.append(
      name.wrap,
      instructions.wrap,
      el(
        "p",
        "cv-form-note",
        "Esta habilidade fica disponível durante a prévia, sem alterar sua conta."
      ),
      submitButton("Criar habilidade")
    );
    name.input.focus();
  }

  function openMcpModal() {
    const name = formField(
      "Nome da conexão",
      "input",
      "Ex.: Base de conhecimento da equipe"
    );
    const endpoint = formField(
      "Endereço do servidor MCP",
      "input",
      "https://exemplo.com/mcp"
    );
    name.input.maxLength = 80;
    endpoint.input.type = "url";
    endpoint.input.maxLength = 1000;
    const error = el("p", "cv-form-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    const form = dialog(
      "MCP personalizado",
      "Dê um nome à conexão que deseja visualizar.",
      () => {
        if (!validateMcpEndpoint(endpoint.input.value)) {
          error.textContent =
            "Informe um endereço válido com http:// ou https://.";
          error.hidden = false;
          endpoint.input.focus();
          return;
        }
        if (!name.input.value.trim()) return;
        const id = `custom-mcp-${++counter}`;
        customConnections.push({
          id,
          title: name.input.value.trim(),
          description: "Seu servidor MCP personalizado.",
          endpoint: endpoint.input.value.trim(),
          category: "MCP",
          mcp: true,
          icon: "plug",
          hue: "orange"
        });
        connected.add(id);
        tab = "mcp";
        query = "";
        render();
        notify("MCP adicionado à prévia. Nenhuma conexão real foi realizada.");
        back.focus();
      }
    );
    endpoint.input.addEventListener("input", () => {
      error.hidden = true;
    });
    form.append(
      name.wrap,
      endpoint.wrap,
      error,
      el(
        "p",
        "cv-form-note",
        "O endereço não será acessado. A conexão é simulada nesta prévia."
      ),
      submitButton("Adicionar à prévia")
    );
    name.input.focus();
  }

  root.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal) {
      event.preventDefault();
      event.stopPropagation();
      close({ notify: true });
    }
  });

  function show(nextView) {
    const aliases = {
      habilidades: "skills",
      conexoes: "connections",
      conexões: "connections",
      especialistas: "specialists"
    };
    view = aliases[nextView] ?? nextView;
    if (!["skills", "connections", "specialists"].includes(view))
      throw new TypeError(`Catálogo desconhecido: ${nextView}`);
    previouslyFocused = document.activeElement;
    tab = view === "skills" ? "mine" : "popular";
    query = "";
    heading.textContent =
      view === "skills"
        ? "Habilidades"
        : view === "connections"
          ? "Conexões"
          : "Especialistas";
    root.setAttribute("aria-label", heading.textContent);
    root.hidden = false;
    render();
    back.focus();
  }

  return { show, close };
}

export default mountCatalogViews;
