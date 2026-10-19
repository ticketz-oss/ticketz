export const previewPlans = [
  {
    id: "essential",
    name: "Atendimento",
    monthly: 19.9,
    credits: 300,
    description:
      "Respostas melhores e menos tempo escrevendo para seus clientes.",
    unlocks: ["drafts", "rewrite", "conversation-summary", "history"],
    features: [
      "Rascunhos de respostas e mensagens de retorno",
      "Ajuste do tom e clareza das mensagens",
      "Resumo de uma conversa com o cliente",
      "Histórico das conversas com o agente"
    ]
  },
  {
    id: "team",
    name: "Equipe",
    monthly: 39.9,
    credits: 1000,
    description: "IA para organizar as filas e apoiar a rotina dos atendentes.",
    unlocks: [
      "operation-summary",
      "priorities",
      "custom-skills",
      "document-context"
    ],
    features: [
      "Tudo do Atendimento",
      "Panorama dos atendimentos e das filas",
      "Sugestões de prioridade e encaminhamento",
      "Habilidades com as instruções da empresa",
      "Documentos como contexto para as respostas"
    ]
  },
  {
    id: "operation",
    name: "Gestão",
    monthly: 69.9,
    credits: 2500,
    description: "Mais contexto e recursos para acompanhar toda a operação.",
    unlocks: ["specialists", "projects", "recurring-tasks", "connections"],
    features: [
      "Tudo do Equipe",
      "Especialistas em suporte, vendas e pós-venda",
      "Projetos com contexto compartilhado",
      "Tarefas recorrentes e resumos da operação",
      "Conexões da IA com CRM e agenda"
    ]
  }
];
export function getPlanCapabilities(planId) {
  const index = previewPlans.findIndex(plan => plan.id === planId);
  if (index < 0) throw new RangeError("Plano de IA desconhecido");
  return [
    ...new Set(previewPlans.slice(0, index + 1).flatMap(plan => plan.unlocks))
  ];
}
export function calculatePreviewTotal(monthly, months, coupon = "") {
  if (!Number.isFinite(monthly) || monthly < 0 || ![1, 3, 12].includes(months))
    throw new RangeError("Preço ou período de simulação inválido");
  const periodPercent = months === 12 ? 70 : months === 3 ? 85 : 100;
  const couponPercent =
    String(coupon ?? "")
      .trim()
      .toUpperCase() === "DEMO10"
      ? 90
      : 100;
  return (
    Math.round(
      (Math.round(monthly * 100) * months * periodPercent * couponPercent) /
        10000
    ) / 100
  );
}
const money = value =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};
const button = (text, className, action) => {
  const el = make("button", className, text);
  el.type = "button";
  el.addEventListener("click", action);
  return el;
};
export function mountPlanViews(host, { onClose, onCredits } = {}) {
  let modal;
  let returnFocus;
  let currentPlan;
  let credits = 44;
  function closeModal() {
    modal?.remove();
    modal = null;
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }
  function checkout(plan) {
    closeModal();
    returnFocus = document.activeElement;
    const overlay = make("div", "pv-overlay");
    modal = overlay;
    const dialog = make("section", "pv-dialog");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "pv-checkout-title");
    const close = button("×", "pv-close", closeModal);
    close.setAttribute("aria-label", "Fechar pagamento simulado");
    const title = make("h2", "", `Plano ${plan.name}`);
    title.id = "pv-checkout-title";
    const info = make(
      "p",
      "pv-muted",
      "Escolha um período para experimentar o fluxo de contratação."
    );
    const badge = make(
      "div",
      "pv-note",
      "Prévia visual · valores ilustrativos · nenhuma cobrança"
    );
    const periods = make("fieldset", "pv-periods");
    periods.append(make("legend", "", "Período de cobrança"));
    let months = 1;
    let coupon = "";
    let method = "Pix";
    const summary = make("div", "pv-summary");
    const total = make("strong", "pv-total");
    const renewal = make("p", "pv-muted pv-renewal");
    const drawTotal = () => {
      total.textContent = money(
        calculatePreviewTotal(plan.monthly, months, coupon)
      );
      renewal.textContent = `${months} ${months === 1 ? "mês" : "meses"} · ${plan.credits.toLocaleString("pt-BR")} créditos mensais na simulação.`;
      periods
        .querySelectorAll("label")
        .forEach(label =>
          label.classList.toggle(
            "pv-selected",
            label.querySelector("input").checked
          )
        );
    };
    [12, 3, 1].forEach(period => {
      const row = make("label", "pv-period");
      const radio = make("input");
      radio.type = "radio";
      radio.name = "preview-period";
      radio.value = String(period);
      radio.checked = period === 1;
      radio.addEventListener("change", () => {
        months = period;
        drawTotal();
      });
      const price = calculatePreviewTotal(plan.monthly, period) / period;
      row.append(
        radio,
        make("span", "", `${period} ${period === 1 ? "mês" : "meses"}`)
      );
      if (period > 1)
        row.append(
          make("small", "pv-save", `Economize ${period === 12 ? "30" : "15"}%`)
        );
      row.append(make("strong", "", `${money(price)}/mês`));
      periods.append(row);
    });
    const paymentLabel = make("label", "pv-label", "Forma de pagamento");
    const payment = make("select", "pv-input");
    payment.setAttribute("aria-label", "Forma de pagamento simulada");
    ["Pix", "Cartão", "Boleto"].forEach(text => {
      const option = make("option", "", text);
      payment.append(option);
    });
    payment.addEventListener("change", () => {
      method = payment.value;
    });
    paymentLabel.append(payment);
    const couponLabel = make("label", "pv-label", "Cupom de desconto");
    const couponInput = make("input", "pv-input");
    couponInput.setAttribute("aria-label", "Cupom de desconto");
    couponInput.placeholder = "Experimente DEMO10";
    couponInput.maxLength = 30;
    const couponMessage = make("span", "pv-coupon-message");
    const apply = button("Aplicar cupom", "pv-text-button", () => {
      const candidate = couponInput.value.trim().toUpperCase();
      coupon = candidate === "DEMO10" ? candidate : "";
      couponMessage.textContent = coupon
        ? "Desconto de 10% aplicado na simulação."
        : "Use DEMO10 para experimentar um desconto.";
      drawTotal();
    });
    couponLabel.append(couponInput, apply, couponMessage);
    summary.append(
      make("span", "", `${plan.name} · contratação simulada`),
      couponLabel
    );
    const totalRow = make("div", "pv-total-row");
    totalRow.append(make("strong", "", "Total"), total);
    summary.append(totalRow);
    const actions = make("div", "pv-actions");
    actions.append(
      button("Cancelar", "pv-secondary", closeModal),
      button("Simular pagamento", "pv-primary", () => {
        const paidTotal = calculatePreviewTotal(plan.monthly, months, coupon);
        currentPlan = plan;
        credits = plan.credits;
        onCredits?.(credits);
        dialog.replaceChildren(close);
        const successTitle = make("h2", "", "Simulação concluída");
        successTitle.id = "pv-checkout-title";
        dialog.append(
          make("div", "pv-success-icon", "✓"),
          successTitle,
          make(
            "p",
            "pv-muted",
            `Plano ${plan.name} selecionado · ${money(paidTotal)} por ${method}.`
          ),
          make(
            "div",
            "pv-note",
            "Nenhum pagamento foi realizado. O plano e os créditos abaixo são fictícios."
          ),
          make(
            "p",
            "pv-unlock-summary",
            `${getPlanCapabilities(plan.id).length} recursos de IA incluídos no plano ${plan.name}.`
          ),
          button("Voltar para os planos", "pv-primary", () => {
            closeModal();
            show();
          })
        );
        dialog.querySelector(".pv-primary").focus();
      })
    );
    dialog.append(
      close,
      title,
      info,
      badge,
      periods,
      paymentLabel,
      summary,
      renewal,
      actions
    );
    overlay.append(dialog);
    host.append(overlay);
    drawTotal();
    close.focus();
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeModal();
    });
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeModal();
      }
      if (event.key === "Tab") {
        const items = [
          ...dialog.querySelectorAll("button,input,select")
        ].filter(item => item.offsetParent !== null);
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
  function show() {
    host.hidden = false;
    const surface = make("div", "pv-surface");
    const heading = make("div", "pv-heading");
    heading.append(
      make("h2", "", "Planos do Agente Espaço"),
      button("Voltar", "pv-text-button", () => onClose?.())
    );
    surface.append(
      heading,
      make(
        "p",
        "pv-muted",
        "Comece com ajuda nas respostas. Libere mais recursos de IA conforme a sua operação cresce."
      ),
      make(
        "div",
        "pv-note",
        "Proposta de planos de IA · valores por empresa · contratação simulada."
      )
    );
    const balance = make("div", "pv-balance");
    balance.append(
      make(
        "span",
        "",
        currentPlan
          ? `Plano ${currentPlan.name} · simulado`
          : "Seu saldo na prévia"
      ),
      make("strong", "", `${credits.toLocaleString("pt-BR")} créditos`)
    );
    surface.append(balance);
    previewPlans.forEach(plan => {
      const card = make(
        "article",
        `pv-card${plan.id === "team" ? " pv-recommended" : ""}`
      );
      if (plan.id === "team")
        card.append(make("span", "pv-recommended-tag", "Para sua equipe"));
      card.append(
        make("h3", "", plan.name),
        make("p", "pv-muted", plan.description)
      );
      const price = make("div", "pv-price");
      price.append(
        make("strong", "", money(plan.monthly)),
        make("span", "", "/mês")
      );
      card.append(
        price,
        make("span", "pv-price-scope", "por empresa · Agente Espaço"),
        make(
          "p",
          "pv-unlock-summary",
          `${plan === previewPlans[0] ? "Comece com" : "Libera mais"} ${plan.unlocks.length} recursos de IA`
        ),
        make(
          "p",
          "pv-credit-count",
          `${plan.credits.toLocaleString("pt-BR")} créditos por mês`
        )
      );
      const features = make("ul", "pv-features");
      plan.features.forEach(feature =>
        features.append(make("li", "", feature))
      );
      card.append(
        features,
        button(
          currentPlan?.id === plan.id
            ? "Experimentar novamente"
            : "Escolher plano",
          "pv-primary",
          () => checkout(plan)
        )
      );
      surface.append(card);
    });
    host.replaceChildren(surface);
    host.scrollTop = 0;
  }
  return {
    show,
    close() {
      closeModal();
      host.hidden = true;
    }
  };
}
