// The React host sends authenticated requests; credentials never enter this frame.
export function createLiveRun(
  messages,
  conversationId,
  { onStep, onComplete, onError, onCancel, labels = {}, timeout = 185000 } = {}
) {
  const requestId = crypto.randomUUID();
  let state = "working";
  let timer;
  let statusTimer;
  const statuses = [
    labels.progress,
    labels.progressConnecting,
    labels.progressWorking,
    labels.progressPreparing,
    labels.progressContinuing
  ].filter(label => typeof label === "string" && label.trim());
  let statusIndex = 0;
  const cleanup = () => {
    clearTimeout(timer);
    clearInterval(statusTimer);
    window.removeEventListener("message", receive);
  };
  const fail = error => {
    if (state !== "working") return;
    state = "failed";
    cleanup();
    onError?.(error);
  };
  function receive(event) {
    if (
      event.origin !== location.origin ||
      event.source !== parent ||
      event.data?.type !== "agent-preview-chat-response" ||
      event.data.requestId !== requestId
    )
      return;
    if (state !== "working") return;
    if (event.data.error) {
      fail(event.data.error);
      return;
    }
    if (typeof event.data.reply !== "string" || !event.data.reply.trim()) {
      fail({ code: "ERR_HERMES_EMPTY_REPLY", message: labels.error });
      return;
    }
    state = "completed";
    cleanup();
    onComplete?.({
      kind: "live",
      title: "",
      paragraphs: [event.data.reply],
      sources: Array.isArray(event.data.sources) ? event.data.sources : [],
      sourcesLabel: labels.sources,
      footer: labels.connected || ""
    });
  }
  window.addEventListener("message", receive);
  timer = setTimeout(() => {
    parent.postMessage(
      { type: "agent-preview-chat-cancel", requestId },
      location.origin
    );
    fail({ code: "ERR_HERMES_TIMEOUT", message: labels.timeout });
  }, timeout);
  if (statuses.length) onStep?.(statuses[0]);
  if (statuses.length > 1) {
    statusTimer = setInterval(() => {
      if (state !== "working") return;
      statusIndex = (statusIndex + 1) % statuses.length;
      onStep?.(statuses[statusIndex]);
    }, 5500);
  }
  parent.postMessage(
    { type: "agent-preview-chat-request", requestId, messages, conversationId },
    location.origin
  );
  return {
    get state() {
      return state;
    },
    cancel() {
      if (state !== "working") return;
      state = "cancelled";
      cleanup();
      parent.postMessage(
        { type: "agent-preview-chat-cancel", requestId },
        location.origin
      );
      onCancel?.();
    }
  };
}
