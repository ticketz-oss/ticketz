// Local visual demonstration. All records and answers are fictional.
export const mockMetrics = Object.freeze({
  active: 18,
  waiting: 7,
  resolved: 46,
  firstReply: "2min 14s",
});

export function scenarioFor(prompt) {
  const text = String(prompt).toLocaleLowerCase("pt-BR");
  if (/retorno|mensagem|resposta|cliente/.test(text))
    return {
      kind: "draft",
      steps: [
        "Entendendo sua mensagem",
        "Consultando o contexto de exemplo",
        "Ajustando o tom da resposta",
        "Preparando uma sugestão",
      ],
      title: "Um retorno simples e acolhedor",
      paragraphs: [
        "Você pode enviar uma mensagem assim:",
        "Olá! Passando para saber se ficou alguma dúvida sobre nosso atendimento. Estou por aqui para ajudar no que você precisar.",
      ],
      footer:
        "Sugestão preparada para você revisar. Nenhuma mensagem foi enviada.",
      action: "Copiar sugestão",
      copy: "Olá! Passando para saber se ficou alguma dúvida sobre nosso atendimento. Estou por aqui para ajudar no que você precisar.",
    };
  if (/fila|prioridade|aguard|suporte/.test(text))
    return {
      kind: "priority",
      steps: [
        "Entendendo seu pedido",
        "Consultando as filas de exemplo",
        "Identificando prioridades",
        "Organizando as recomendações",
      ],
      title: "Comece pela fila de Suporte",
      paragraphs: [
        "Há 7 pessoas aguardando. A maior concentração está no Suporte: 4 conversas, com a mais antiga há 12 minutos.",
      ],
      items: [
        "Suporte · 4 aguardando · até 12 min",
        "Comercial · 2 aguardando · até 6 min",
        "Financeiro · 1 aguardando · até 3 min",
      ],
      footer:
        "Sugestão: priorize as conversas mais antigas do Suporte antes de redistribuir a fila.",
    };
  if (/resum|hoje|atendimento|operação|operacao/.test(text))
    return {
      kind: "summary",
      steps: [
        "Entendendo seu pedido",
        "Consultando os atendimentos de exemplo",
        "Identificando os pontos de atenção",
        "Preparando seu resumo",
      ],
      title: "Seu atendimento, em um olhar",
      paragraphs: [
        "O dia está fluindo bem. Já são 46 atendimentos resolvidos e 18 em andamento. Há 7 pessoas aguardando um primeiro contato.",
      ],
      items: [
        "46 resolvidos hoje",
        "18 em atendimento",
        "2min 14s para a primeira resposta",
      ],
      footer:
        "O ponto de atenção é o Suporte, com 4 conversas na fila. Vale começar pelas mais antigas.",
      action: "Ver prioridades da fila",
      nextPrompt: "Quais são as prioridades da fila?",
    };
  return {
    kind: "general",
    steps: ["Entendendo sua mensagem", "Preparando uma resposta"],
    title: /^(ol[aá]|oi|bom dia|boa tarde|boa noite)[!.\s]*$/.test(text.trim())
      ? "Olá, Guilherme!"
      : "Vamos cuidar do seu atendimento",
    paragraphs: [
      "Posso ajudar você a resumir a operação, identificar prioridades nas filas e preparar mensagens de retorno. Escolha uma dessas opções para experimentar.",
    ],
    footer: "Esta prévia utiliza dados fictícios e respostas simuladas.",
    action: "Resumir os atendimentos de hoje",
    nextPrompt: "Resuma os atendimentos de hoje",
  };
}

export function createMockRun(
  prompt,
  {
    onStep = () => {},
    onComplete = () => {},
    onCancel = () => {},
    schedule = setTimeout,
    unschedule = clearTimeout,
    delay = 1700,
  } = {},
) {
  const scenario = scenarioFor(prompt);
  let index = 0;
  let timer;
  let state = "working";
  const tick = () => {
    if (state !== "working") return;
    if (index < scenario.steps.length) {
      onStep(scenario.steps[index], index, scenario.steps.length);
      index += 1;
      if (state === "working") timer = schedule(tick, delay);
    } else {
      state = "completed";
      onComplete(scenario);
    }
  };
  tick();
  return Object.freeze({
    get state() {
      return state;
    },
    cancel() {
      if (state !== "working") return false;
      state = "cancelled";
      unschedule(timer);
      onCancel();
      return true;
    },
  });
}
