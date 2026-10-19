import dagre from "@dagrejs/dagre";

export const terminais = ["transferir", "humano"];

export const organizarBlocos = fluxo => {
  const grafo = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  grafo.setGraph({
    rankdir: "LR",
    nodesep: 48,
    ranksep: 100,
    marginx: 40,
    marginy: 40
  });
  fluxo.nodes.forEach(no => grafo.setNode(no.id, { width: 232, height: 176 }));
  fluxo.edges.forEach(aresta => grafo.setEdge(aresta.source, aresta.target));
  dagre.layout(grafo);
  return {
    ...fluxo,
    nodes: fluxo.nodes.map(no => ({
      ...no,
      position: { x: grafo.node(no.id).x - 116, y: grafo.node(no.id).y - 88 }
    }))
  };
};

export const filhosDe = (fluxo, id) => {
  const ids = new Set(
    fluxo.edges
      .filter(aresta => aresta.source === id)
      .map(aresta => aresta.target)
  );
  return fluxo.nodes.filter(no => ids.has(no.id));
};

export const podeConectar = (fluxo, source, target) => {
  const origem = fluxo.nodes.find(no => no.id === source);
  const destino = fluxo.nodes.find(no => no.id === target);
  if (
    !origem ||
    !destino ||
    source === target ||
    destino.kind === "inicio" ||
    terminais.includes(origem.kind)
  )
    return false;
  const visitar = [target];
  const vistos = new Set();
  while (visitar.length) {
    const id = visitar.pop();
    if (id === source) return false;
    if (vistos.has(id)) continue;
    vistos.add(id);
    visitar.push(...filhosDe(fluxo, id).map(no => no.id));
  }
  return true;
};

export const conectarBlocos = (fluxo, source, target) =>
  podeConectar(fluxo, source, target)
    ? {
        ...fluxo,
        edges: [
          ...fluxo.edges.filter(aresta => aresta.target !== target),
          { source, target }
        ]
      }
    : fluxo;

export const problemasFluxo = fluxo =>
  fluxo.nodes.filter(
    no =>
      !no.title.trim() ||
      (no.kind !== "inicio" &&
        !fluxo.edges.some(aresta => aresta.target === no.id)) ||
      (no.kind === "transferir" && !no.forwardQueueId)
  );

export const removerBloco = (fluxo, id) => ({
  ...fluxo,
  nodes: fluxo.nodes.filter(no => no.id !== id || no.kind === "inicio"),
  edges: fluxo.edges.filter(
    aresta => aresta.source !== id && aresta.target !== id
  )
});
