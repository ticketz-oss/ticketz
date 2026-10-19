// Leitura/escrita seguras do token no localStorage.
//
// O token e' persistido como JSON (JSON.stringify de uma string JWT). Se algum
// fluxo de auth gravasse um valor invalido (ex.: JSON.stringify(undefined), que
// vira a string literal "undefined"), qualquer JSON.parse posterior estouraria
// e derrubaria o app em cascata (socket, interceptors, etc.). Estes helpers
// garantem que so' token valido seja gravado e que valor corrompido seja
// descartado na leitura, caindo no fluxo de "sem sessao".

export const getStoredToken = () => {
  const raw = localStorage.getItem("token");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" && parsed ? parsed : null;
  } catch (_) {
    // valor corrompido (ex.: "undefined" ou JWT cru sem aspas) -> descarta
    localStorage.removeItem("token");
    return null;
  }
};

export const setStoredToken = token => {
  if (typeof token === "string" && token) {
    localStorage.setItem("token", JSON.stringify(token));
    return true;
  }

  // token ausente/invalido: nao corrompe o storage
  localStorage.removeItem("token");
  return false;
};
