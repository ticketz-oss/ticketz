// Visual reactions use only the current user's message and the reply shown in
// this chat. Waiting reactions describe mood, rather than completed actions.
const normalize = text =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function animationForRequest(text) {
  const message = normalize(text);
  if (
    /^(oi|ola|hey|hello|bom dia|boa tarde|boa noite)[!.,\s]*$/.test(message)
  ) {
    return "excited";
  }
  if (/\b(ideia|criativ[oa]|imagine|invente|brainstorm)\b/.test(message)) {
    return "playful";
  }
  if (
    /\b(resuma|resumir|organize|organizar|prepare|escreva|redija|crie)\b/.test(
      message
    )
  ) {
    return "working";
  }
  if (
    /\b(como|porque|por que|qual|duvida|explica|entender)\b|\?/.test(message)
  ) {
    return "curious";
  }
  return "thinking";
}

export function animationWhileWaiting(step) {
  return ["thinking", "curious", "working", "thinking", "working"][step % 5];
}

export function animationForError(code) {
  return [
    "ERR_AGENT_PERMISSION_DENIED",
    "ERR_AGENT_DISABLED",
    "ERR_AGENT_MODULE_BLOCKED",
    "ERR_HERMES_NOT_CONFIGURED",
    "ERR_SESSION_EXPIRED",
    "ERR_AGENT_INVALID_REQUEST"
  ].includes(code)
    ? "sad"
    : "angry";
}

export function animationForReply(userText, replyText) {
  const context = normalize(`${userText} ${replyText}`);
  const reply = normalize(replyText);
  if (
    /\bnao (?:posso|consigo|consegui|poderei|tenho (?:acesso|como|permissao)|sou capaz)\b|\b(?:fora do meu alcance|nao esta ao meu alcance|sem acesso a|i (?:cannot|can't|am unable))\b/.test(
      reply
    )
  ) {
    return "sad";
  }
  if (
    /\b(lamento|sinto muito|meus sentimentos|perda|falecimento)\b/.test(context)
  ) {
    return "sad";
  }
  if (
    /\b(?:ocorreu|houve|encontrei|deu|aconteceu) (?:um |uma )?(?:erro|falha)\b|\b(?:falhou|falha ao|esta indisponivel|deu errado)\b/.test(
      reply
    )
  ) {
    return "angry";
  }
  if (/\b(parabens|concluido|resolvido|deu certo|sucesso)\b/.test(reply)) {
    return "celebrate";
  }
  if (/\b(haha|kkkk|rsrs)\b|[😂😄]/u.test(reply)) {
    return "laughing";
  }
  if (/\b(golpe|fraude|suspeit[oa]|enganos[oa])\b/.test(reply)) {
    return "suspicious";
  }
  if (/\b(nao entendi|pode esclarecer|pode explicar melhor)\b/.test(reply)) {
    return "confused";
  }
  if (/\b(obrigad[oa]|excelente|otimo)\b/.test(context)) {
    return "proud";
  }
  if (/\b(como|qual|quer|posso ajudar|me conte)\b|\?/.test(reply)) {
    return "curious";
  }
  return "happy";
}
