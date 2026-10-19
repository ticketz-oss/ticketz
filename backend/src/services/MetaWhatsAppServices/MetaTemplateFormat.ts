export const TEMPLATE_LANGUAGE = "pt_BR";
export const TEMPLATE_CATEGORY = "UTILITY";
// A Cloud API corta o corpo de um template em 1024 caracteres, bem abaixo do
// limite de 3000 que a tela de cobranca aceita para texto livre.
export const TEMPLATE_BODY_LIMIT = 1024;

export const PLACEHOLDERS = [
  "nome",
  "valor",
  "vencimento",
  "boleto",
  "referencia"
] as const;
export type TemplatePlaceholder = (typeof PLACEHOLDERS)[number];

// Exemplos exigidos pela Meta na aprovacao: sem eles o template e recusado
// por falta de amostra das variaveis.
export const PLACEHOLDER_EXAMPLES: Record<TemplatePlaceholder, string> = {
  nome: "Maria Silva",
  valor: "R$ 189,90",
  vencimento: "05/10/2026",
  boleto: "https://example.com/documento.pdf",
  referencia: "Pedido 12345"
};

// Converte o texto do painel ([nome], [valor]...) no formato da Meta ({{1}},
// {{2}}...). A ordem e a da primeira aparicao, e e ela que define a ordem dos
// parametros no envio - por isso submissao e envio usam esta mesma funcao.
export const toTemplateBody = (
  body: string
): { text: string; variables: TemplatePlaceholder[] } => {
  const variables: TemplatePlaceholder[] = [];

  const text = body
    .trim()
    .replace(/\[(nome|valor|vencimento|boleto|referencia)\]/g, (_, key) => {
      const placeholder = key as TemplatePlaceholder;
      let index = variables.indexOf(placeholder);

      if (index === -1) {
        variables.push(placeholder);
        index = variables.length - 1;
      }

      return `{{${index + 1}}}`;
    });

  return { text, variables };
};
