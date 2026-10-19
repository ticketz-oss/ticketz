import { useEffect, useRef } from "react";
import { Sortable } from "@shopify/draggable";

/**
 * Torna os filhos diretos de um container arrastáveis.
 *
 * Devolve a ref que deve ir no container. Os itens precisam ter o atributo
 * `data-sortable-item` e a alça de arrasto `data-drag-handle`.
 *
 * O callback recebe `(from, to)` — índices na lista — e só é chamado quando a
 * posição realmente muda.
 */
const useSortableList = (onMove, enabled = true) => {
  const containerRef = useRef(null);
  const onMoveRef = useRef(onMove);

  // O Sortable é criado uma única vez; sem esta ref ele seria destruído e
  // recriado a cada render, cancelando o arrasto em andamento.
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return undefined;

    const sortable = new Sortable(container, {
      draggable: "[data-sortable-item]",
      handle: "[data-drag-handle]",
      distance: 4,
      // O atraso no toque permite rolar a página sem arrastar sem querer.
      delay: { mouse: 0, drag: 0, touch: 140 },
      mirror: { constrainDimensions: true }
    });

    const handleStop = event => {
      if (event.oldIndex !== event.newIndex) {
        onMoveRef.current(event.oldIndex, event.newIndex);
      }
    };

    // Ao soltar, o Draggable moveria o nó original para a nova posição — mas o
    // React ainda acredita na ordem antiga, e os dois passariam a divergir
    // (principalmente ao desfazer um arrasto que falhou no servidor).
    // Cancelando, o DOM volta exatamente como estava e quem reordena é o
    // re-render. Durante o arrasto só o clone se move, então nada pisca.
    const keepDomForReact = event => event.cancel();

    sortable.on("sortable:stop", handleStop);
    sortable.on("drag:stop", keepDomForReact);

    return () => {
      sortable.off("sortable:stop", handleStop);
      sortable.off("drag:stop", keepDomForReact);
      sortable.destroy();
    };
  }, [enabled]);

  return containerRef;
};

export default useSortableList;
