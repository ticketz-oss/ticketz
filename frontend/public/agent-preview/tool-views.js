const iconPaths = {
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z",
    "M14 2v6h6",
    "M8 13h8M8 17h5"
  ],
  search: ["M21 21l-5-5", "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"],
  plus: ["M12 5v14M5 12h14"],
  close: ["M6 6l12 12M18 6 6 18"],
  grid: ["M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z"],
  list: ["M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"],
  clock: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "M12 7v5l3 2"],
  check: ["M5 12l4 4L19 6"],
  folder: [
    "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
  ],
  arrow: ["M5 12h14M13 6l6 6-6 6"],
  upload: ["M12 16V3M7 8l5-5 5 5M4 16v5h16v-5"],
  history: ["M3 11a9 9 0 1 1 3 8M3 4v7h7M12 7v5l3 2"],
  repeat: [
    "M17 2l4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3"
  ],
  chat: [
    "M21 11a9 9 0 0 1-9 9H5l-3 2v-9A9 9 0 0 1 11 4h2a8 8 0 0 1 8 7Z",
    "M7 9h9M7 13h6"
  ],
  more: ["M5 12h.01M12 12h.01M19 12h.01"]
};

const viewNames = { files: "Arquivos", tasks: "Tarefas", projects: "Projetos" };
const aliases = { arquivos: "files", tarefas: "tasks", projetos: "projects" };

function element(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "tv-icon");
  svg.setAttribute("aria-hidden", "true");
  for (const definition of iconPaths[name] || iconPaths.file) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", definition);
    svg.append(path);
  }
  return svg;
}

function button(text, className, action, iconName) {
  const item = element("button", className);
  item.type = "button";
  if (iconName) item.append(icon(iconName));
  if (text) item.append(element("span", "", text));
  item.addEventListener("click", action);
  return item;
}

function iconButton(label, iconName, action) {
  const item = button("", "tv-icon-button", action, iconName);
  item.setAttribute("aria-label", label);
  item.title = label;
  return item;
}

export function mountToolViews(
  host,
  { onPrompt, onOpenHistory, onClose } = {}
) {
  const files = [
    {
      id: 1,
      name: "Guia de atendimento.pdf",
      kind: "PDF",
      size: "248 KB",
      source: "uploaded",
      date: "Hoje, 09:12"
    },
    {
      id: 2,
      name: "Tom de voz da empresa.pdf",
      kind: "PDF",
      size: "126 KB",
      source: "uploaded",
      date: "Ontem, 16:40"
    },
    {
      id: 3,
      name: "Clientes de setembro.csv",
      kind: "CSV",
      size: "42 KB",
      source: "uploaded",
      date: "Ontem, 14:08"
    },
    {
      id: 4,
      name: "Resumo da operação.txt",
      kind: "TXT",
      size: "3 KB",
      source: "agent",
      date: "Hoje, 10:24"
    }
  ];
  const tasks = [
    {
      id: 1,
      title: "Resumo dos atendimentos de hoje",
      description: "Um panorama das filas e dos pontos de atenção.",
      frequency: "Uma vez",
      status: "Pronta para ver",
      date: "Hoje, 09:00",
      scheduled: false,
      prompt: "Resuma os atendimentos de hoje."
    },
    {
      id: 2,
      title: "Revisar mensagens de retorno",
      description: "Três sugestões de resposta para continuar as conversas.",
      frequency: "Uma vez",
      status: "Sugestão",
      date: "Hoje, 08:45",
      scheduled: false,
      prompt: "Prepare uma mensagem de retorno para um cliente."
    },
    {
      id: 3,
      title: "Panorama da equipe",
      description: "Acompanhar a distribuição dos atendimentos entre as filas.",
      frequency: "Todo dia",
      status: "Agendada",
      date: "Todos os dias · 09:00",
      scheduled: true,
      prompt: "Me ajude a organizar as filas de atendimento."
    }
  ];
  const projects = [
    {
      id: 1,
      name: "Atendimento com a nossa voz",
      instructions:
        "Use uma linguagem próxima e objetiva. Acolha a dúvida do cliente, explique o próximo passo e evite respostas longas.",
      conversations: 3,
      updated: "Atualizado hoje"
    },
    {
      id: 2,
      name: "Organização da operação",
      instructions:
        "Ajude a acompanhar as filas, organizar prioridades e preparar resumos claros para a equipe.",
      conversations: 1,
      updated: "Atualizado ontem"
    }
  ];
  const state = {
    view: "files",
    fileTab: "all",
    fileLayout: "list",
    fileQuery: "",
    taskTab: "inbox",
    projectQuery: "",
    nextId: 10
  };
  let root = null;
  let modal = null;
  let modalEscape = null;
  let returnFocus = null;
  let fieldSequence = 0;

  function closeModal() {
    if (modalEscape) document.removeEventListener("keydown", modalEscape, true);
    modalEscape = null;
    modal?.remove();
    modal = null;
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }

  function close() {
    closeModal();
    host.hidden = true;
  }

  function leave() {
    close();
    onClose?.();
  }

  function prompt(text) {
    close();
    onPrompt?.(text);
  }

  function notice(text) {
    const previous = root.querySelector(".tv-notice");
    previous?.remove();
    const status = element("div", "tv-notice", text);
    status.setAttribute("role", "status");
    root.querySelector(".tv-scroll").prepend(status);
  }

  function openModal(title, description, build) {
    closeModal();
    returnFocus = document.activeElement;
    modal = element("div", "tv-modal-layer");
    const dialog = element("section", "tv-modal");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    const headingId = `tv-modal-title-${++fieldSequence}`;
    dialog.setAttribute("aria-labelledby", headingId);
    const heading = element("div", "tv-modal-heading");
    const titleElement = element("h3", "", title);
    titleElement.id = headingId;
    heading.append(
      titleElement,
      iconButton("Fechar janela", "close", closeModal)
    );
    dialog.append(heading, element("p", "tv-modal-description", description));
    build(dialog);
    modal.append(dialog);
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal();
    });
    modalEscape = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeModal();
      }
      if (event.key === "Tab") {
        const focusable = [
          ...dialog.querySelectorAll(
            "button,input,select,textarea,[tabindex='0']"
          )
        ].filter(item => !item.disabled);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", modalEscape, true);
    root.append(modal);
    queueMicrotask(() =>
      dialog.querySelector("input,textarea,select,button")?.focus()
    );
  }

  function field(form, labelText, type = "text", placeholder = "") {
    const group = element("div", "tv-field");
    const label = element("label", "", labelText);
    const id = `tv-field-${++fieldSequence}`;
    label.htmlFor = id;
    const input = element(
      type === "textarea" ? "textarea" : "input",
      "tv-input"
    );
    input.id = id;
    input.placeholder = placeholder;
    if (type !== "textarea") input.type = type;
    else input.rows = 4;
    group.append(label, input);
    form.append(group);
    return input;
  }

  function modalActions(form, label) {
    const actions = element("div", "tv-modal-actions");
    const submit = element("button", "tv-button tv-button-primary", label);
    submit.type = "submit";
    actions.append(
      button("Cancelar", "tv-button tv-button-secondary", closeModal),
      submit
    );
    form.append(actions);
  }

  function tabs(items, active, onChange) {
    const container = element("div", "tv-tabs");
    container.setAttribute("role", "tablist");
    items.forEach(([value, label]) => {
      const tab = button(
        label,
        `tv-tab${value === active ? " tv-tab-active" : ""}`,
        () => {
          container.querySelectorAll("button").forEach(item => {
            const selected = item === tab;
            item.setAttribute("aria-selected", String(selected));
            item.classList.toggle("tv-tab-active", selected);
          });
          onChange(value);
        }
      );
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(value === active));
      container.append(tab);
    });
    return container;
  }

  function search(placeholder, value, action) {
    const container = element("label", "tv-search");
    container.append(icon("search"));
    const input = element("input", "");
    input.type = "search";
    input.placeholder = placeholder;
    input.value = value;
    input.setAttribute("aria-label", placeholder);
    input.addEventListener("input", () => action(input.value));
    container.append(input);
    return container;
  }

  function empty(container, title, description, iconName = "file") {
    const block = element("div", "tv-empty");
    const mark = element("span", "tv-empty-mark");
    mark.append(icon(iconName));
    block.append(mark, element("h3", "", title), element("p", "", description));
    container.append(block);
  }

  function fileDetail(file) {
    openModal(
      file.name,
      "Um arquivo para dar mais contexto ao seu agente.",
      dialog => {
        const info = element("div", "tv-file-info");
        info.append(
          icon("file"),
          element("strong", "", file.kind),
          element("span", "", `${file.size} · ${file.date}`)
        );
        dialog.append(
          info,
          element(
            "p",
            "tv-detail-copy",
            "Nesta prévia, o conteúdo do arquivo é ilustrativo. Você pode explorar como ele entra no contexto da conversa."
          )
        );
        const actions = element("div", "tv-modal-actions");
        actions.append(
          button(
            "Conversar sobre o arquivo",
            "tv-button tv-button-primary",
            () =>
              prompt(`Me ajude a usar o arquivo ${file.name} no atendimento.`),
            "chat"
          )
        );
        dialog.append(actions);
      }
    );
  }

  function addFile() {
    openModal(
      "Adicionar arquivo",
      "Explore o envio de um documento de exemplo.",
      dialog => {
        const drop = element("div", "tv-upload-area");
        drop.append(
          icon("upload"),
          element("strong", "", "Um pouco mais de contexto"),
          element(
            "span",
            "",
            "Selecione um arquivo ilustrativo para esta prévia."
          )
        );
        dialog.append(drop);
        const form = element("form", "tv-form");
        const selectGroup = element("div", "tv-field");
        const label = element("label", "", "Arquivo de exemplo");
        const select = element("select", "tv-input");
        select.id = `tv-upload-${++fieldSequence}`;
        label.htmlFor = select.id;
        [
          "Tabela de clientes.csv",
          "Perguntas frequentes.pdf",
          "Informações do produto.txt"
        ].forEach(name => {
          const option = element("option", "", name);
          option.value = name;
          select.append(option);
        });
        selectGroup.append(label, select);
        form.append(selectGroup);
        modalActions(form, "Adicionar à prévia");
        form.addEventListener("submit", event => {
          event.preventDefault();
          const name = select.value;
          files.unshift({
            id: state.nextId++,
            name,
            kind: name.split(".").pop().toUpperCase(),
            size: "24 KB",
            source: "uploaded",
            date: "Agora"
          });
          state.fileTab = "uploaded";
          state.fileQuery = "";
          closeModal();
          render();
          notice(
            "Arquivo de exemplo adicionado. Nenhum documento foi enviado para um servidor."
          );
        });
        dialog.append(form);
      }
    );
  }

  function renderFiles(body) {
    const toolbar = element("div", "tv-toolbar");
    const intro = element("div", "tv-intro");
    intro.append(
      element("p", "tv-overline", "Contexto compartilhado"),
      element("h2", "", "Tudo o que ajuda a conversa"),
      element(
        "p",
        "",
        "Documentos da equipe e arquivos preparados pelo agente, em um só lugar."
      )
    );
    body.append(intro);
    toolbar.append(
      button(
        "Adicionar arquivo",
        "tv-button tv-button-primary",
        addFile,
        "plus"
      )
    );
    const layouts = element("div", "tv-layout-toggle");
    const results = element("div", "tv-file-results");
    function fillResults() {
      results.replaceChildren();
      const matching = files.filter(
        file =>
          (state.fileTab === "all" || state.fileTab === file.source) &&
          file.name
            .toLocaleLowerCase("pt-BR")
            .includes(state.fileQuery.toLocaleLowerCase("pt-BR"))
      );
      results.className = `tv-file-results tv-file-results--${state.fileLayout}`;
      if (!matching.length) {
        empty(
          results,
          "Nenhum arquivo por aqui",
          "Experimente outra busca ou adicione um arquivo de exemplo."
        );
        return;
      }
      matching.forEach(file => {
        const item = button("", "tv-file-item", () => fileDetail(file));
        const mark = element(
          "span",
          `tv-file-mark tv-file-mark--${file.kind.toLowerCase()}`
        );
        mark.append(icon("file"));
        const copy = element("span", "tv-file-copy");
        copy.append(
          element("strong", "", file.name),
          element(
            "small",
            "",
            `${file.size} · ${file.source === "agent" ? "Criado pelo agente" : "Enviado por você"}`
          )
        );
        item.append(mark, copy, element("span", "tv-file-date", file.date));
        results.append(item);
      });
    }
    ["list", "grid"].forEach(layout => {
      const control = iconButton(
        layout === "list" ? "Exibir em lista" : "Exibir em grade",
        layout,
        () => {
          state.fileLayout = layout;
          layouts
            .querySelectorAll("button")
            .forEach(item =>
              item.setAttribute("aria-pressed", String(item === control))
            );
          fillResults();
        }
      );
      control.setAttribute("aria-pressed", String(state.fileLayout === layout));
      layouts.append(control);
    });
    toolbar.append(layouts);
    body.append(
      toolbar,
      search("Buscar arquivos", state.fileQuery, query => {
        state.fileQuery = query;
        fillResults();
      }),
      tabs(
        [
          ["all", "Todos"],
          ["uploaded", "Enviados por você"],
          ["agent", "Criados pelo agente"]
        ],
        state.fileTab,
        value => {
          state.fileTab = value;
          fillResults();
        }
      ),
      results
    );
    fillResults();
  }

  function createTask() {
    openModal(
      "Criar uma tarefa",
      "Deixe uma intenção clara. O agente ajuda a organizar o próximo passo.",
      dialog => {
        const form = element("form", "tv-form");
        const title = field(
          form,
          "Título",
          "text",
          "Ex.: Resumo das filas pela manhã"
        );
        title.required = true;
        title.maxLength = 90;
        const description = field(
          form,
          "O que o agente deve fazer?",
          "textarea",
          "Conte o que você espera desta tarefa."
        );
        description.maxLength = 1500;
        const group = element("div", "tv-field");
        const label = element("label", "", "Frequência");
        const frequency = element("select", "tv-input");
        frequency.id = `tv-frequency-${++fieldSequence}`;
        label.htmlFor = frequency.id;
        ["Uma vez", "Todo dia", "Toda semana"].forEach(value =>
          frequency.append(element("option", "", value))
        );
        group.append(label, frequency);
        form.append(
          group,
          element(
            "p",
            "tv-form-note",
            "A tarefa será salva apenas nesta prévia. Nenhuma execução automática será agendada."
          )
        );
        modalActions(form, "Criar tarefa");
        form.addEventListener("submit", event => {
          event.preventDefault();
          const taskTitle = title.value.trim();
          if (!taskTitle) {
            title.focus();
            return;
          }
          const recurring = frequency.value !== "Uma vez";
          tasks.unshift({
            id: state.nextId++,
            title: taskTitle,
            description:
              description.value.trim() || "Uma tarefa criada por você.",
            frequency: frequency.value,
            scheduled: recurring,
            status: recurring ? "Agendada" : "Pronta para ver",
            date: recurring ? `${frequency.value} · 09:00` : "Criada agora",
            prompt: description.value.trim() || taskTitle
          });
          state.taskTab = recurring ? "scheduled" : "inbox";
          closeModal();
          render();
          notice(
            "Tarefa adicionada à prévia. Você pode abrir o contexto para continuar a conversa."
          );
        });
        dialog.append(form);
      }
    );
  }

  function taskDetail(task) {
    openModal(task.title, task.description, dialog => {
      const details = element("div", "tv-task-details");
      details.append(
        element("span", "tv-status-badge", task.status),
        element("span", "", task.date)
      );
      dialog.append(
        details,
        element(
          "p",
          "tv-detail-copy",
          task.scheduled
            ? "Esta é uma agenda ilustrativa. Nesta prévia, você pode revisar a tarefa e explorar uma resposta simulada."
            : "Abra a conversa para revisar o contexto e continuar com o agente."
        )
      );
      const actions = element("div", "tv-modal-actions");
      actions.append(
        button(
          "Abrir conversa",
          "tv-button tv-button-primary",
          () => prompt(task.prompt),
          "arrow"
        )
      );
      dialog.append(actions);
    });
  }

  function renderTasks(body) {
    const intro = element("div", "tv-intro");
    intro.append(
      element("p", "tv-overline", "Um passo de cada vez"),
      element("h2", "", "Abra espaço para o que importa"),
      element(
        "p",
        "",
        "Acompanhe o que o agente preparou e organize as próximas tarefas."
      )
    );
    body.append(
      intro,
      button(
        "Criar tarefa",
        "tv-button tv-button-primary tv-create",
        createTask,
        "plus"
      )
    );
    const results = element("div", "tv-task-results");
    function fillResults() {
      results.replaceChildren();
      const matching = tasks.filter(
        task => task.scheduled === (state.taskTab === "scheduled")
      );
      if (!matching.length) {
        empty(
          results,
          "Tudo em dia por aqui",
          "Crie uma tarefa para começar a organizar os próximos passos.",
          "clock"
        );
        return;
      }
      matching.forEach(task => {
        const item = button("", "tv-task-item", () => taskDetail(task));
        const mark = element("span", "tv-task-mark");
        mark.append(icon(task.scheduled ? "repeat" : "check"));
        const copy = element("span", "tv-task-copy");
        copy.append(
          element("strong", "", task.title),
          element("small", "", task.description),
          element("span", "tv-task-date", task.date)
        );
        item.append(mark, copy, icon("arrow"));
        results.append(item);
      });
    }
    body.append(
      tabs(
        [
          ["inbox", "Caixa de entrada"],
          ["scheduled", "Agendadas"]
        ],
        state.taskTab,
        value => {
          state.taskTab = value;
          fillResults();
        }
      ),
      results
    );
    fillResults();
  }

  function createProject() {
    openModal(
      "Criar um projeto",
      "Um lugar para reunir contexto e manter suas conversas no mesmo caminho.",
      dialog => {
        const form = element("form", "tv-form");
        const name = field(
          form,
          "Nome do projeto",
          "text",
          "Ex.: Atendimento comercial"
        );
        name.required = true;
        name.maxLength = 80;
        const instructions = field(
          form,
          "Instruções para o agente",
          "textarea",
          "Como o agente deve ajudar? Descreva o contexto, o tom e o objetivo."
        );
        instructions.maxLength = 2000;
        modalActions(form, "Criar projeto");
        form.addEventListener("submit", event => {
          event.preventDefault();
          const projectName = name.value.trim();
          if (!projectName) {
            name.focus();
            return;
          }
          projects.unshift({
            id: state.nextId++,
            name: projectName,
            instructions:
              instructions.value.trim() ||
              "Você pode definir as instruções ao explorar este projeto.",
            conversations: 0,
            updated: "Criado agora"
          });
          state.projectQuery = "";
          closeModal();
          render();
          notice(
            "Projeto criado nesta prévia. O contexto fica disponível enquanto esta página estiver aberta."
          );
        });
        dialog.append(form);
      }
    );
  }

  function projectDetail(project) {
    openModal(
      project.name,
      "O contexto que acompanha as conversas deste projeto.",
      dialog => {
        const instruction = element("div", "tv-project-instructions");
        instruction.append(
          element("h4", "", "Instruções para o agente"),
          element("p", "", project.instructions)
        );
        dialog.append(instruction);
        const actions = element("div", "tv-modal-actions");
        actions.append(
          button(
            "Conversar neste projeto",
            "tv-button tv-button-primary",
            () =>
              prompt(
                `Vamos trabalhar no projeto ${project.name}. Contexto: ${project.instructions}`
              ),
            "chat"
          )
        );
        dialog.append(actions);
      }
    );
  }

  function renderProjects(body) {
    const intro = element("div", "tv-intro");
    intro.append(
      element("p", "tv-overline", "Conversas com continuidade"),
      element("h2", "", "Um espaço para cada objetivo"),
      element(
        "p",
        "",
        "Reúna instruções e conversas para o agente conhecer melhor o seu contexto."
      )
    );
    const results = element("div", "tv-project-results");
    function fillResults() {
      results.replaceChildren();
      const matching = projects.filter(project =>
        project.name
          .toLocaleLowerCase("pt-BR")
          .includes(state.projectQuery.toLocaleLowerCase("pt-BR"))
      );
      if (!matching.length) {
        empty(
          results,
          "Vamos abrir um novo espaço?",
          "Crie um projeto ou experimente outro nome na busca.",
          "folder"
        );
        return;
      }
      matching.forEach(project => {
        const item = button("", "tv-project-item", () =>
          projectDetail(project)
        );
        const mark = element("span", "tv-project-mark");
        mark.append(icon("folder"));
        const top = element("span", "tv-project-top");
        top.append(mark, icon("arrow"));
        const footer = element("span", "tv-project-footer");
        footer.append(
          element(
            "span",
            "",
            `${project.conversations} ${project.conversations === 1 ? "conversa" : "conversas"}`
          ),
          element("span", "", project.updated)
        );
        item.append(
          top,
          element("strong", "", project.name),
          element("p", "", project.instructions),
          footer
        );
        results.append(item);
      });
    }
    body.append(
      intro,
      button(
        "Criar projeto",
        "tv-button tv-button-primary tv-create",
        createProject,
        "plus"
      ),
      search("Buscar projetos", state.projectQuery, query => {
        state.projectQuery = query;
        fillResults();
      }),
      results
    );
    fillResults();
  }

  function render() {
    closeModal();
    root = element("section", "tv-root");
    const header = element("header", "tv-header");
    const title = element("div", "tv-header-title");
    title.append(
      icon(
        state.view === "files"
          ? "file"
          : state.view === "tasks"
            ? "clock"
            : "folder"
      ),
      element("h1", "", viewNames[state.view])
    );
    const actions = element("div", "tv-header-actions");
    if (onOpenHistory)
      actions.append(
        iconButton("Histórico de conversas", "history", () => {
          close();
          onOpenHistory();
        })
      );
    actions.append(iconButton("Voltar para o agente", "close", leave));
    header.append(title, actions);
    const body = element("div", "tv-scroll");
    if (state.view === "files") renderFiles(body);
    if (state.view === "tasks") renderTasks(body);
    if (state.view === "projects") renderProjects(body);
    root.append(header, body);
    host.replaceChildren(root);
    host.hidden = false;
  }

  function show(view) {
    const normalized = aliases[view] || view;
    if (!viewNames[normalized]) throw new Error(`View desconhecida: ${view}`);
    state.view = normalized;
    render();
  }

  return { show, close };
}
