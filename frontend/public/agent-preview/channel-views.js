const svgNamespace = "http://www.w3.org/2000/svg";

const iconPaths = {
  whatsapp: [
    "M20 11.6a8 8 0 0 1-11.9 7L4 20l1.3-4A8 8 0 1 1 20 11.6Z",
    "M8.8 7.5c-.7.1-.9.8-.8 1.6.3 2.7 2.3 4.8 5.1 5.5.8.2 1.7-.1 1.9-.8l.3-1-2-1-.6 1c-1.6-.6-2.6-1.5-3.2-3l1-.7-1-1.6Z"
  ],
  phone: [
    "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M10 6h4M11 18h2"
  ],
  arrow: ["M5 12h14m-5-5 5 5-5 5"],
  close: ["m6 6 12 12M18 6 6 18"],
  check: ["m5 12 4 4L19 6"],
  sparkle: ["m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z"],
  chat: ["M20 11a8 8 0 0 1-8 8H5l-3 3v-7a8 8 0 1 1 18-4Z", "M8 10h8M8 14h5"]
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name, className = "ch-icon") {
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", className);
  for (const d of iconPaths[name] || iconPaths.sparkle) {
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

function button(text, className, action, iconName) {
  const node = element("button", className);
  node.type = "button";
  node.append(element("span", "", text));
  if (iconName) node.append(icon(iconName));
  node.addEventListener("click", action);
  return node;
}

function illustrativeQr() {
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 140 140");
  svg.setAttribute("class", "ch-qr");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Ilustração de QR de exemplo, sem dados ou vínculo real"
  );
  // This decorative pattern deliberately is not a QR encoder or a scannable code.
  const cells = [
    [1, 0, 1, 1, 0, 1, 0],
    [1, 1, 0, 1, 0, 0, 1],
    [0, 1, 1, 0, 1, 1, 0],
    [1, 0, 0, 0, 0, 1, 1],
    [0, 1, 0, 1, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 0],
    [0, 1, 0, 1, 1, 0, 1]
  ];
  cells.forEach((row, y) => {
    row.forEach((active, x) => {
      if (!active) return;
      const rect = document.createElementNS(svgNamespace, "rect");
      rect.setAttribute("x", String(10 + x * 18));
      rect.setAttribute("y", String(10 + y * 18));
      rect.setAttribute("width", "12");
      rect.setAttribute("height", "12");
      rect.setAttribute("rx", "3");
      rect.setAttribute("fill", (x + y) % 3 ? "#172334" : "#ff6b24");
      svg.append(rect);
    });
  });
  return svg;
}

function phonePreview() {
  const phone = element("div", "ch-phone-preview");
  phone.setAttribute(
    "aria-label",
    "Prévia de uma conversa no celular, com dados fictícios"
  );
  phone.append(element("div", "ch-phone-notch"));
  const top = element("div", "ch-phone-top");
  const avatar = element("span", "ch-phone-avatar");
  avatar.append(icon("sparkle"));
  const title = element("div", "ch-phone-title");
  title.append(element("strong", "", "Agente Espaço"));
  title.append(element("span", "", "Seu atendimento, mais perto"));
  top.append(avatar, title);
  const conversation = element("div", "ch-phone-conversation");
  conversation.append(element("span", "ch-phone-day", "Hoje"));
  conversation.append(
    element(
      "p",
      "ch-phone-bubble ch-phone-bubble-user",
      "Como estão os atendimentos de hoje?"
    )
  );
  conversation.append(
    element(
      "p",
      "ch-phone-bubble",
      "Vamos organizar sua operação. Na prévia, temos 8 conversas em andamento e 3 aguardando retorno."
    )
  );
  const summary = element("div", "ch-phone-summary");
  summary.append(element("strong", "", "Um próximo passo"));
  summary.append(element("span", "", "Preparar uma mensagem de retorno"));
  summary.append(icon("arrow"));
  conversation.append(summary);
  phone.append(
    top,
    conversation,
    element("div", "ch-phone-composer", "Escreva sua mensagem…")
  );
  return phone;
}

/**
 * Standalone visual mock. No network, account linking, messages or QR payloads.
 * Views: channels / mais, whatsapp (opens dialog), mobile / movel (mobile preview).
 */
export function mountChannelViews(host, { onPrompt, onClose } = {}) {
  if (!host || typeof host.append !== "function") {
    throw new TypeError("mountChannelViews precisa de um elemento host.");
  }

  const shell = element("section", "ch-shell");
  shell.hidden = true;
  shell.setAttribute("aria-label", "Canais do Agente Espaço");
  const eyebrow = element("p", "ch-eyebrow", "SEU AGENTE, MAIS PERTO");
  const header = element("header", "ch-heading");
  header.append(button("Voltar ao agente", "ch-back", returnToAgent, "arrow"));
  header.append(eyebrow, element("h1", "", "Continue de onde estiver"));
  header.append(
    element(
      "p",
      "ch-description",
      "Converse com o Agente Espaço pelo canal que combina com a sua rotina."
    )
  );
  shell.append(header);

  const cards = element("div", "ch-cards");
  const whatsappCard = element("article", "ch-card");
  const whatsappMark = element("div", "ch-card-mark ch-card-mark-whatsapp");
  whatsappMark.append(icon("whatsapp"));
  whatsappCard.append(whatsappMark, element("h2", "", "WhatsApp"));
  whatsappCard.append(
    element(
      "p",
      "",
      "Seu agente ao lado das conversas que já fazem parte do seu dia."
    )
  );
  whatsappCard.append(
    element("span", "ch-card-detail", "Respostas, contexto e próximos passos")
  );
  whatsappCard.append(
    button("Conhecer o WhatsApp", "ch-primary", openWhatsApp, "arrow")
  );

  const mobileCard = element("article", "ch-card");
  const mobileMark = element("div", "ch-card-mark");
  mobileMark.append(icon("phone"));
  mobileCard.append(mobileMark, element("h2", "", "No celular"));
  mobileCard.append(
    element(
      "p",
      "",
      "Uma experiência que acompanha você, com tudo no seu lugar."
    )
  );
  mobileCard.append(
    element("span", "ch-card-detail", "Uma prévia pensada para telas menores")
  );
  mobileCard.append(
    button("Ver experiência no celular", "ch-secondary", showMobile, "arrow")
  );
  cards.append(whatsappCard, mobileCard);
  shell.append(cards);

  const mobileSection = element("section", "ch-mobile-section");
  mobileSection.hidden = true;
  mobileSection.setAttribute("aria-label", "Experiência no celular");
  const mobileCopy = element("div", "ch-mobile-copy");
  mobileCopy.append(element("span", "ch-label", "NO CELULAR"));
  mobileCopy.append(element("h2", "", "Seu espaço cabe na sua rotina."));
  mobileCopy.append(
    element(
      "p",
      "",
      "Acompanhe a operação e prepare respostas em uma conversa simples. A interface se adapta ao celular para você continuar de onde parou."
    )
  );
  const mobileList = element("ul", "ch-benefits ch-mobile-benefits");
  for (const text of [
    "Conversas fáceis de acompanhar",
    "Respostas com contexto do atendimento",
    "Ações importantes ao alcance da mão"
  ]) {
    const item = element("li", "");
    item.append(icon("check"), element("span", "", text));
    mobileList.append(item);
  }
  mobileCopy.append(mobileList);
  mobileCopy.append(
    button(
      "Simular conversa",
      "ch-primary",
      () =>
        prompt(
          "Simule um resumo dos atendimentos de hoje para eu acompanhar pelo celular."
        ),
      "chat"
    )
  );
  mobileCopy.append(
    element("p", "ch-simulation-note", "Prévia visual com dados fictícios.")
  );
  mobileSection.append(mobileCopy, phonePreview());
  shell.append(mobileSection);

  const dialog = element("dialog", "ch-dialog");
  dialog.setAttribute("aria-labelledby", "ch-whatsapp-title");
  dialog.setAttribute("aria-describedby", "ch-whatsapp-description");
  const dialogTop = element("div", "ch-dialog-top");
  dialogTop.append(element("span", "ch-label", "AGENTE ESPAÇO NO WHATSAPP"));
  const closeButton = button("", "ch-close", returnToAgent);
  closeButton.setAttribute("aria-label", "Fechar prévia do WhatsApp");
  closeButton.replaceChildren(icon("close"));
  dialogTop.append(closeButton);
  const dialogGrid = element("div", "ch-dialog-grid");
  const dialogCopy = element("div", "ch-dialog-copy");
  const dialogMark = element("div", "ch-card-mark ch-card-mark-whatsapp");
  dialogMark.append(icon("whatsapp"));
  const dialogHeading = element("h2", "", "Seu atendimento, em boa companhia.");
  dialogHeading.id = "ch-whatsapp-title";
  const dialogDescription = element(
    "p",
    "ch-dialog-description",
    "Imagine ter o Agente Espaço no WhatsApp para conversar sobre sua operação e organizar o próximo passo."
  );
  dialogDescription.id = "ch-whatsapp-description";
  dialogCopy.append(dialogMark, dialogHeading, dialogDescription);
  const benefits = element("ul", "ch-benefits");
  const entries = [
    ["Contexto à mão", "Retome o assunto sem começar tudo de novo."],
    ["Uma resposta mais fácil", "Prepare mensagens para seus atendimentos."],
    ["Mais clareza no seu dia", "Veja um resumo e organize os próximos passos."]
  ];
  for (const [title, description] of entries) {
    const item = element("li", "");
    const text = element("div", "");
    text.append(element("strong", "", title), element("p", "", description));
    item.append(icon("check"), text);
    benefits.append(item);
  }
  dialogCopy.append(benefits);
  const qrPanel = element("div", "ch-qr-panel");
  qrPanel.append(element("span", "ch-example-tag", "EXEMPLO VISUAL"));
  qrPanel.append(illustrativeQr());
  qrPanel.append(element("strong", "", "QR ilustrativo"));
  qrPanel.append(
    element(
      "p",
      "",
      "Este desenho não conecta uma conta e não pode ser usado para escanear ou iniciar uma conversa real."
    )
  );
  dialogGrid.append(dialogCopy, qrPanel);
  const dialogFooter = element("footer", "ch-dialog-footer");
  dialogFooter.append(
    element(
      "p",
      "ch-simulation-note",
      "Explore uma conversa fictícia, sem enviar mensagens."
    )
  );
  dialogFooter.append(
    button(
      "Simular conversa",
      "ch-primary",
      () => {
        dialog.close();
        prompt(
          "Simule uma conversa pelo WhatsApp para preparar uma mensagem de retorno a um cliente."
        );
      },
      "chat"
    )
  );
  dialog.append(dialogTop, dialogGrid, dialogFooter);
  shell.append(dialog);
  host.append(shell);

  function prompt(text) {
    close();
    if (typeof onPrompt === "function") onPrompt(text);
  }

  function openWhatsApp() {
    if (!dialog.open) dialog.showModal();
  }

  function showMobile() {
    mobileSection.hidden = false;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    mobileSection.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth"
    });
  }

  function close() {
    if (dialog.open) dialog.close();
    shell.hidden = true;
    host.hidden = true;
  }

  function returnToAgent() {
    close();
    if (typeof onClose === "function") onClose();
  }

  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      returnToAgent();
  });

  dialog.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      returnToAgent();
    },
    true
  );

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    returnToAgent();
  });

  return {
    show(view = "channels") {
      host.hidden = false;
      shell.hidden = false;
      mobileSection.hidden = true;
      if (view === "whatsapp") openWhatsApp();
      else if (view === "mobile" || view === "movel" || view === "móvel")
        showMobile();
      else mobileSection.hidden = true;
    },
    close
  };
}
