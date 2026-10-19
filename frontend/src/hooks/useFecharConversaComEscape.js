import { useEffect, useRef } from "react";

const camadas = [
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  ".MuiModal-root",
  ".emoji-mart",
  ".yarl__root",
  "[data-conversation-escape-layer]",
  '[data-conversation-escape-block="true"]',
  '[role="combobox"][aria-expanded="true"]',
  'input[aria-expanded="true"]'
].join(",");

const estaVisivel = elemento => {
  for (let atual = elemento; atual; atual = atual.parentElement) {
    // Radix forceMount keeps closed popovers (and nested menus) in the DOM.
    if (
      atual.hidden ||
      atual.getAttribute("aria-hidden") === "true" ||
      atual.getAttribute("data-state") === "closed"
    )
      return false;
    const estilo = window.getComputedStyle(atual);
    if (estilo.display === "none" || estilo.visibility === "hidden")
      return false;
  }
  return true;
};

// Capture records overlays before their own Escape handlers remove them. The
// bubble listener lets inputs and dialogs consume the key before navigation.
export default function useFecharConversaComEscape(aoFechar, ativo = true) {
  const callback = useRef(aoFechar);
  callback.current = aoFechar;

  useEffect(() => {
    if (!ativo) return undefined;
    const protegidos = new WeakSet();
    const capturar = evento => {
      if (evento.key !== "Escape") return;
      if (Array.from(document.querySelectorAll(camadas)).some(estaVisivel)) {
        protegidos.add(evento);
      }
    };
    const fechar = evento => {
      if (
        evento.key !== "Escape" ||
        evento.defaultPrevented ||
        evento.isComposing ||
        evento.keyCode === 229 ||
        evento.repeat ||
        evento.altKey ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.target?.tagName === "SELECT" ||
        protegidos.has(evento)
      )
        return;
      evento.preventDefault();
      callback.current();
    };
    window.addEventListener("keydown", capturar, true);
    window.addEventListener("keydown", fechar);
    return () => {
      window.removeEventListener("keydown", capturar, true);
      window.removeEventListener("keydown", fechar);
    };
  }, [ativo]);
}
