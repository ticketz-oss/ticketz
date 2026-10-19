export const chaveRascunho = (user, chat) =>
  `chat-draft:${user.companyId}:${user.id}:${chat.id}`;

export const lerRascunho = chave => {
  try {
    return sessionStorage.getItem(chave) || "";
  } catch {
    return "";
  }
};

export const salvarRascunho = (chave, texto) => {
  try {
    if (texto) sessionStorage.setItem(chave, texto);
    else sessionStorage.removeItem(chave);
  } catch {
    // Editing and sending remain available when browser storage is disabled.
  }
};

export const limparRascunhoEnviado = (chave, texto) => {
  if (lerRascunho(chave) === texto) salvarRascunho(chave, "");
};
