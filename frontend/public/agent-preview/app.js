import { createMockRun } from "./mock-agent.js";
import { createLiveRun } from "./live-chat.js";
import { ThoughtLine } from "./thought-line.js";
import { mountNavigation } from "./navigation.js";
import { mountToolViews } from "./tool-views.js";
import { mountCatalogViews } from "./catalog-views.js";
import { mountChannelViews } from "./channel-views.js";
import { mountPlanViews } from "./plan-views.js";
import {
  mountKirby,
  isKirbyAnimation,
  kirbyExpression
} from "./kirby.bundle.js";
import {
  animationForRequest,
  animationForReply,
  animationForError,
  animationWhileWaiting
} from "./kirby-reactions.js";

const el = id => document.getElementById(id);
const panel = el("agent-panel");
const embedded = new URLSearchParams(location.search).get("embedded") === "1";
let contextGreeting = "Olá, Guilherme!";
let liveChat = false;
let chatLabels = {};
if (embedded) {
  document.body.classList.add("embedded-preview");
  document.querySelector(".agent-context > span:last-child").textContent =
    "Prévia visual · dados fictícios";
}
const toggle = el("agent-toggle");
const input = el("message-input");
const sendButton = el("message-send");
const list = el("message-list");
const thoughtContainer = el("thought-container");
list.append(thoughtContainer);
const thought = new ThoughtLine(thoughtContainer);
const histories = [];
let conversation = freshConversation();
let run = null;
const avatarControllers = [
  ...document.querySelectorAll("[data-kirby-avatar]")
].map(target => ({ target, controller: mountKirby(target) }));
const messageAvatars = new Set();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let avatarStateName = "idle";
let avatarSettleTimer;
let avatarSequenceTimer;
let noticeTimer;
let currentView = "chat";
const viewHost = el("agent-view-host");
const viewSurfaces = Object.fromEntries(
  ["history", "tools", "catalog", "channels", "plans"].map(name => {
    const host = document.createElement("div");
    host.className = "agent-view-surface";
    host.hidden = true;
    viewHost.append(host);
    return [name, host];
  })
);
const viewOptions = {
  onPrompt: send,
  onClose: () => navigate("chat"),
  onOpenHistory: () => navigate("history")
};
const toolViews = mountToolViews(viewSurfaces.tools, viewOptions);
const catalogViews = mountCatalogViews(viewSurfaces.catalog, viewOptions);
const channelViews = mountChannelViews(viewSurfaces.channels, viewOptions);
const planViews = mountPlanViews(viewSurfaces.plans, {
  ...viewOptions,
  onCredits: credits => navigation.setCredits(credits)
});
const navigation = mountNavigation(panel, { onNavigate: navigate });
navigation.select("chat");
const sendIcon =
  '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19V5m-5 5 5-5 5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const stopIcon =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

function freshConversation() {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    title: "Nova conversa",
    messages: []
  };
}
function scrollLatest() {
  requestAnimationFrame(() => {
    list.scrollTop = list.scrollHeight;
  });
}
function playAvatar(controller, state, target) {
  if (!isKirbyAnimation(state)) return;
  if (target) target.dataset.animation = state;
  if (reducedMotion.matches) {
    controller.setExpression(kirbyExpression(state));
    controller.pause();
  } else {
    controller.play(state);
  }
}

function avatarState(state, settleAfter = 0) {
  if (!isKirbyAnimation(state)) return;
  clearTimeout(avatarSettleTimer);
  clearTimeout(avatarSequenceTimer);
  avatarStateName = state;
  if (embedded)
    parent.postMessage({ type: "agent-preview-state", state }, location.origin);
  avatarControllers.forEach(({ target, controller }) => {
    if (target.closest("[hidden]")) controller.pause();
    else playAvatar(controller, state, target);
  });
  panel.dataset.state = state;
  if (settleAfter) {
    avatarSettleTimer = setTimeout(
      () => avatarState(input.value.trim() ? "listening" : "idle"),
      settleAfter
    );
  }
}

function avatarSequence(states, hold = 2000, settleAfter = 6000) {
  const advance = index => {
    const last = index === states.length - 1;
    avatarState(states[index], last ? settleAfter : 0);
    if (!last && !reducedMotion.matches) {
      avatarSequenceTimer = setTimeout(() => advance(index + 1), hold);
    }
  };
  advance(reducedMotion.matches ? states.length - 1 : 0);
}

function reactToReply(animation) {
  if (["angry", "sad"].includes(animation)) avatarState(animation);
  else if (animation === "celebrate")
    avatarSequence(["excited", "celebrate", "proud"], 2200, 7000);
  else if (animation === "happy")
    avatarSequence(["happy", "playful", "happy"], 2400, 6000);
  else if (animation === "confused")
    avatarSequence(["surprised", "confused", "curious"], 1800, 7000);
  else avatarState(animation, 9000);
}
reducedMotion.addEventListener("change", () => {
  avatarState(avatarStateName);
  const recent = [...messageAvatars].at(-1);
  if (recent) {
    const lastAnswer = [...conversation.messages]
      .reverse()
      .find(message => ["agent", "error"].includes(message.role));
    if (reducedMotion.matches) {
      recent.setExpression(kirbyExpression(lastAnswer?.animation || "happy"));
      recent.pause();
    } else {
      recent.play(lastAnswer?.animation || "happy");
    }
  }
});
function notice(text) {
  const element = el("notice");
  element.textContent = text;
  element.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    element.hidden = true;
  }, 4000);
}
function popoversClose() {
  navigation.close();
  el("skills-popover").hidden = true;
  el("history-popover").hidden = true;
  el("skill-toggle").setAttribute("aria-expanded", "false");
  el("agent-history").setAttribute("aria-expanded", "false");
}
function setOpen(open) {
  if (embedded && !open)
    parent.postMessage({ type: "agent-preview-close" }, location.origin);
  document.body.classList.toggle("agent-closed", !open);
  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  if (!open) {
    document.body.classList.remove("agent-expanded");
    el("agent-expand").setAttribute("aria-expanded", "false");
    el("agent-expand").setAttribute("aria-pressed", "false");
    el("agent-expand").setAttribute("aria-label", "Expandir painel");
    popoversClose();
  }
  syncMobileSurface();
  if (!open) toggle.focus();
  else input.focus();
}
function syncMobileSurface() {
  const modal =
    !panel.hidden && window.matchMedia("(max-width: 480px)").matches;
  document.querySelector(".workspace").inert = modal;
  document.querySelector(".sidebar").inert = modal;
  panel.setAttribute("role", modal ? "dialog" : "complementary");
  if (modal) panel.setAttribute("aria-modal", "true");
  else panel.removeAttribute("aria-modal");
}
window.addEventListener("resize", syncMobileSurface);
window.addEventListener("message", event => {
  if (!embedded || event.origin !== location.origin || event.source !== parent)
    return;
  if (event.data?.type === "agent-preview-open") {
    document.body.classList.remove("agent-expanded");
    el("agent-expand").setAttribute("aria-label", "Expandir painel");
    el("agent-expand").setAttribute("aria-pressed", "false");
    el("agent-expand").setAttribute("aria-expanded", "false");
    setOpen(true);
  }
  if (
    event.data?.type === "agent-preview-context-reset" &&
    event.data.conversationId === conversation.id
  ) {
    conversation.messages = [
      { role: "user", text: String(event.data.message || "") }
    ];
    histories.splice(0, histories.length, conversation);
    showConversation();
    notice(event.data.notice);
  }
  if (event.data?.type === "agent-preview-context") {
    const data = event.data;
    document.documentElement.dataset.theme =
      data.theme === "dark" ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]').content =
      data.theme === "dark" ? "#151a20" : "#f7f7f8";
    liveChat = data.liveChat === true;
    if (data.chatLabels && typeof data.chatLabels === "object")
      chatLabels = data.chatLabels;
    if (liveChat && typeof chatLabels.badge === "string")
      document.querySelector(".agent-context > span:last-child").textContent =
        chatLabels.badge;
    syncComposer();
    if (typeof data.companyName === "string")
      document.querySelector(".agent-context > span:nth-child(2)").textContent =
        data.companyName;
    if (typeof data.greeting === "string") {
      contextGreeting = data.greeting;
      document.querySelector("#welcome h2").textContent = data.greeting;
    }
  }
});
function syncComposer() {
  const working = run?.state === "working";
  sendButton.disabled =
    !working && (!input.value.trim() || (embedded && !liveChat));
  sendButton.innerHTML = working ? stopIcon : sendIcon;
  sendButton.setAttribute(
    "aria-label",
    working ? "Interromper resposta" : "Enviar mensagem"
  );
  sendButton.title = working ? "Interromper resposta" : "Enviar mensagem";
  el("composer").classList.toggle("is-working", working);
  input.disabled = working;
  input.placeholder = working
    ? "O agente está preparando sua resposta…"
    : chatLabels.placeholder || "O que você quer resolver hoje?";
  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.disabled = working;
  });
}
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function appendAvatarIdentity(article, animation) {
  const label = node("div", "response-identity");
  const character = node("span", "response-kirby");
  character.setAttribute("aria-hidden", "true");
  messageAvatars.forEach(controller => controller.pause());
  list.querySelectorAll(".response-kirby").forEach(target => {
    target.dataset.resting = "true";
  });
  const controller = mountKirby(character, animation);
  if (reducedMotion.matches) playAvatar(controller, animation, character);
  messageAvatars.add(controller);
  label.append(character, node("span", "", "Agente Espaço"));
  article.append(label);
}
function renderMessage(message) {
  const article = node("article", `chat-message chat-message--${message.role}`);
  if (message.role === "user") {
    article.append(node("p", "user-bubble", message.text));
  } else if (message.role === "cancelled") {
    article.append(
      node(
        "p",
        "message-note",
        chatLabels.cancelled ||
          "Resposta interrompida. Você pode fazer outro pedido."
      )
    );
  } else if (message.role === "error") {
    appendAvatarIdentity(article, message.animation || "angry");
    const error = node(
      "p",
      "message-note message-error",
      message.error || chatLabels.error
    );
    error.setAttribute("role", "alert");
    const retry = node("button", "response-action", chatLabels.retry);
    retry.type = "button";
    retry.dataset.prompt = message.prompt;
    article.append(error, retry);
  } else {
    appendAvatarIdentity(article, message.animation || "happy");
    const result = message.result;
    if (result.title)
      article.append(node("h3", "response-title", result.title));
    result.paragraphs.forEach((text, index) =>
      article.append(
        node(
          result.kind === "draft" && index === 1 ? "blockquote" : "p",
          "response-paragraph",
          text
        )
      )
    );
    if (result.items) {
      const items = node("ul", "response-items");
      result.items.forEach(text => items.append(node("li", "", text)));
      article.append(items);
    }
    if (result.footer)
      article.append(node("p", "response-footer", result.footer));
    if (result.sources?.length) {
      const sources = node("details", "response-sources");
      sources.append(
        node("summary", "", result.sourcesLabel || chatLabels.sources)
      );
      result.sources.forEach(source => {
        const line = node(
          "p",
          "response-footer",
          `${source.module} · ${source.resource} · ${new Date(source.observedAt).toLocaleString()} · ${source.id}`
        );
        sources.append(line);
      });
      article.append(sources);
    }
    if (result.action) {
      const button = node("button", "response-action", result.action);
      button.type = "button";
      if (result.nextPrompt) {
        button.dataset.prompt = result.nextPrompt;
      } else if (result.copy) {
        button.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(result.copy);
            notice("Sugestão copiada.");
          } catch {
            notice("Selecione o texto da sugestão para copiar.");
          }
        });
      }
      article.append(button);
    }
    const feedback = node("div", "response-feedback");
    const positive = node("button", "feedback-button", "Útil");
    positive.type = "button";
    positive.setAttribute("aria-label", "Marcar resposta como útil");
    positive.setAttribute("aria-pressed", "false");
    positive.addEventListener("click", () => {
      const next = positive.getAttribute("aria-pressed") !== "true";
      positive.setAttribute("aria-pressed", String(next));
      positive.textContent = next ? "✓ Útil" : "Útil";
      if (next) avatarSequence(["surprised", "shy", "proud"], 1600, 6000);
    });
    feedback.append(positive, node("span", "response-time", message.time));
    article.append(feedback);
  }
  list.append(article);
}
function append(message) {
  conversation.messages.push(message);
  renderMessage(message);
  scrollLatest();
}
function showConversation() {
  messageAvatars.forEach(controller => controller.destroy());
  messageAvatars.clear();
  list.querySelectorAll(".chat-message").forEach(message => message.remove());
  el("welcome").hidden = conversation.messages.length !== 0;
  const suggestions = el("suggestions");
  if (suggestions) suggestions.hidden = conversation.messages.length !== 0;
  conversation.messages.forEach(renderMessage);
  list.append(thoughtContainer);
  scrollLatest();
}
function send(prompt) {
  const text = String(prompt).trim();
  if (!text || run?.state === "working") return;
  if (embedded && !liveChat) return;
  navigate("chat");
  setOpen(true);
  popoversClose();
  thought.clear();
  thoughtContainer.hidden = false;
  el("thinking-avatar").hidden = false;
  if (!conversation.messages.length) {
    conversation.title = text.slice(0, 64);
    histories.unshift(conversation);
  }
  el("welcome").hidden = true;
  const suggestions = el("suggestions");
  if (suggestions) suggestions.hidden = true;
  const userMessage = { role: "user", text };
  append(userMessage);
  messageAvatars.forEach(controller => controller.pause());
  list.querySelectorAll(".response-kirby").forEach(target => {
    target.dataset.resting = "true";
  });
  list.append(thoughtContainer);
  input.value = "";
  el("attachment-chip").hidden = true;
  avatarState(animationForRequest(text));
  let waitingStep = 0;
  const callbacks = {
    onStep: step => {
      if (liveChat) thought.setStatus(step);
      else thought.set(step);
      avatarState(
        waitingStep === 0
          ? animationForRequest(text)
          : animationWhileWaiting(waitingStep)
      );
      waitingStep += 1;
      scrollLatest();
    },
    onComplete: result => {
      el("thinking-avatar").hidden = true;
      if (
        embedded &&
        result.kind === "general" &&
        result.title.startsWith("Olá")
      )
        result = { ...result, title: contextGreeting };
      thought.settle(liveChat ? chatLabels.connected : "Resposta preparada");
      const animation = animationForReply(text, result.paragraphs.join("\n\n"));
      append({
        role: "agent",
        result,
        animation,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        })
      });
      reactToReply(animation);
      syncComposer();
    },
    onError: error => {
      const animation = animationForError(error?.code);
      el("thinking-avatar").hidden = true;
      userMessage.failed = true;
      thought.clear();
      thoughtContainer.hidden = true;
      append({
        role: "error",
        animation,
        error:
          typeof error?.message === "string" ? error.message : chatLabels.error,
        prompt: text
      });
      avatarState(animation);
      syncComposer();
    },
    onCancel: () => {
      el("thinking-avatar").hidden = true;
      userMessage.failed = true;
      thought.clear();
      thoughtContainer.hidden = true;
      append({ role: "cancelled" });
      avatarSequence(["surprised", "listening"], 900, 5000);
      syncComposer();
    }
  };
  const messages = conversation.messages
    .filter(
      message => !message.failed && ["user", "agent"].includes(message.role)
    )
    .map(message => ({
      role: message.role === "user" ? "user" : "assistant",
      content:
        message.role === "user"
          ? message.text
          : message.result.paragraphs.join("\n\n").slice(0, 8000)
    }))
    .slice(-40);
  while (
    messages.length > 1 &&
    messages.reduce((total, message) => total + message.content.length, 0) >
      50000
  ) {
    messages.shift();
  }
  run = embedded
    ? createLiveRun(messages, conversation.id, {
        ...callbacks,
        labels: chatLabels
      })
    : createMockRun(text, callbacks);
  syncComposer();
}
function newConversation() {
  if (embedded)
    parent.postMessage(
      {
        type: "agent-preview-new-conversation",
        conversationId: conversation.id
      },
      location.origin
    );
  run?.cancel();
  run = null;
  thought.clear();
  thoughtContainer.hidden = true;
  el("thinking-avatar").hidden = true;
  conversation = freshConversation();
  navigate("chat");
  showConversation();
  input.value = "";
  el("attachment-chip").hidden = true;
  popoversClose();
  avatarState("waking", 1700);
  syncComposer();
  input.focus();
}
toggle.addEventListener("click", () =>
  setOpen(document.body.classList.contains("agent-closed"))
);
el("agent-close").addEventListener("click", () => setOpen(false));
el("agent-expand").addEventListener("click", () => {
  const expanded = document.body.classList.toggle("agent-expanded");
  if (embedded)
    parent.postMessage(
      { type: "agent-preview-expand", expanded },
      location.origin
    );
  el("agent-expand").setAttribute(
    "aria-label",
    expanded ? "Recolher painel" : "Expandir painel"
  );
  el("agent-expand").setAttribute("aria-pressed", String(expanded));
  el("agent-expand").setAttribute("aria-expanded", String(expanded));
});
el("agent-new").addEventListener("click", newConversation);
el("composer").addEventListener("submit", event => {
  event.preventDefault();
  if (run?.state === "working") run.cancel();
  else send(input.value);
});
input.addEventListener("input", () => {
  syncComposer();
  if (run?.state !== "working")
    avatarState(input.value.trim() ? "listening" : "idle");
});
input.addEventListener("focus", () => {
  if (run?.state !== "working") avatarState("listening");
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send(input.value);
  }
});
document.addEventListener("click", event => {
  const suggestion = event.target.closest("[data-prompt]");
  if (suggestion && !suggestion.disabled) send(suggestion.dataset.prompt);
  if (
    !event.target.closest(
      "#skills-popover, #skill-toggle, #history-popover, #agent-history, #agent-menu, #agent-navigation"
    )
  )
    popoversClose();
});
el("skill-toggle").addEventListener("click", () => {
  const open = el("skills-popover").hidden;
  popoversClose();
  el("skills-popover").hidden = !open;
  el("skill-toggle").setAttribute("aria-expanded", String(open));
});
el("agent-history").addEventListener("click", () => {
  const open = el("history-popover").hidden;
  popoversClose();
  const popover = el("history-popover");
  popover.replaceChildren(node("strong", "popover-title", "Suas conversas"));
  if (!histories.length)
    popover.append(
      node(
        "p",
        "empty-history",
        "Seus pedidos aparecerão aqui durante esta prévia."
      )
    );
  histories.forEach(item => {
    const button = node("button", "history-entry", item.title);
    button.type = "button";
    if (item === conversation) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      run?.cancel();
      run = null;
      thought.clear();
      thoughtContainer.hidden = true;
      conversation = item;
      showConversation();
      popoversClose();
      avatarState("idle");
      syncComposer();
    });
    popover.append(button);
  });
  popover.hidden = !open;
  el("agent-history").setAttribute("aria-expanded", String(open));
});
el("attachment-toggle").addEventListener("click", () => {
  el("attachment-chip").hidden = !el("attachment-chip").hidden;
  if (!el("attachment-chip").hidden)
    notice("Contexto de exemplo adicionado à prévia.");
});
el("attachment-chip").addEventListener("click", () => {
  el("attachment-chip").hidden = true;
});
document.addEventListener("keydown", event => {
  if (event.defaultPrevented) return;
  if (event.key === "Tab" && panel.getAttribute("aria-modal") === "true") {
    const focusable = Array.from(
      panel.querySelectorAll(
        "button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]"
      )
    ).filter(element => element.offsetParent !== null);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  if (event.key !== "Escape") return;
  if (panel.querySelector('[role="dialog"]')) return;
  if (!el("skills-popover").hidden) {
    popoversClose();
    el("skill-toggle").focus();
  } else if (!el("history-popover").hidden) {
    popoversClose();
    el("agent-history").focus();
  } else if (currentView !== "chat") navigate("chat");
  else if (!panel.hidden) setOpen(false);
});

function navigate(view) {
  popoversClose();
  toolViews.close();
  catalogViews.close();
  channelViews.close();
  planViews.close();
  Object.values(viewSurfaces).forEach(host => {
    host.hidden = true;
  });
  currentView = view;
  navigation.select(view);
  const chat = view === "chat";
  list.hidden = !chat;
  document.querySelector(".composer-area").hidden = !chat;
  viewHost.hidden = chat;
  if (chat) return;
  if (view === "history") {
    viewSurfaces.history.hidden = false;
    renderHistory();
  } else if (["files", "tasks", "projects"].includes(view)) {
    viewSurfaces.tools.hidden = false;
    toolViews.show(view);
  } else if (["skills", "connections", "specialists"].includes(view)) {
    viewSurfaces.catalog.hidden = false;
    catalogViews.show(view);
  } else if (view === "plans") {
    viewSurfaces.plans.hidden = false;
    planViews.show(view);
  } else {
    viewSurfaces.channels.hidden = false;
    channelViews.show(view);
  }
}
function renderHistory() {
  const surface = node("div", "agent-history-view");
  surface.append(
    node("h2", "", "Histórico"),
    node("p", "", "Volte às conversas e continue de onde parou.")
  );
  const search = node("input", "agent-history-search");
  search.type = "search";
  search.placeholder = "Pesquisar conversas…";
  search.setAttribute("aria-label", "Pesquisar conversas");
  const rows = node("div");
  const examples = [
    {
      title: "Como estão as filas de atendimento?",
      date: "Conversa de exemplo",
      prompt: "Me ajude a organizar as filas de atendimento."
    },
    {
      title: "Preparar um retorno para o cliente",
      date: "Conversa de exemplo",
      prompt: "Prepare uma mensagem de retorno para um cliente."
    }
  ];
  function results() {
    rows.replaceChildren();
    const query = search.value.toLocaleLowerCase("pt-BR");
    const items = [
      ...histories.map(item => ({
        item,
        title: item.title,
        date: item.createdAt.toLocaleDateString("pt-BR")
      })),
      ...examples
    ].filter(item => item.title.toLocaleLowerCase("pt-BR").includes(query));
    let previousDate;
    items.forEach(record => {
      if (record.date !== previousDate)
        rows.append(node("p", "agent-history-date", record.date));
      previousDate = record.date;
      const button = node("button", "agent-history-row", record.title);
      button.type = "button";
      button.addEventListener("click", () => {
        if (record.item) {
          run?.cancel();
          run = null;
          thought.clear();
          thoughtContainer.hidden = true;
          conversation = record.item;
          showConversation();
          avatarState("idle");
          syncComposer();
          navigate("chat");
        } else {
          newConversation();
          send(record.prompt);
        }
      });
      rows.append(button);
    });
    if (!items.length) {
      const empty = node("div", "agent-history-empty");
      empty.append(
        node("strong", "", "Nenhuma conversa encontrada"),
        node("span", "", "Tente buscar por outro assunto.")
      );
      rows.append(empty);
    }
  }
  search.addEventListener("input", results);
  surface.append(
    search,
    rows,
    node(
      "p",
      "agent-history-example",
      "As conversas desta prévia ficam disponíveis enquanto ela estiver aberta."
    )
  );
  viewSurfaces.history.replaceChildren(surface);
  results();
}
// Dashboard and navigation are only scenery; keep their demo interactions explicit.
document
  .querySelectorAll("[data-demo]")
  .forEach(button =>
    button.addEventListener("click", () => notice(button.dataset.demo))
  );
toggle.setAttribute("aria-expanded", "true");
avatarState("idle");
syncComposer();
syncMobileSurface();
