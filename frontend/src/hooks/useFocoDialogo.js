import { useLayoutEffect, useRef } from "react";

export default function useFocoDialogo(aberto) {
  const origem = useRef(null);

  useLayoutEffect(() => {
    if (aberto) {
      origem.current = document.activeElement;
    }
    if (origem.current) {
      document.activeElement?.blur();
    }
  }, [aberto]);

  return () => {
    const elemento = origem.current;
    origem.current = null;
    if (elemento?.isConnected && !elemento.closest('[aria-hidden="true"]')) {
      elemento.focus();
    }
  };
}
