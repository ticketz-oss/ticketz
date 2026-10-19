// Mostra a previa do jeito que a Meta entrega: com as variaveis aplicadas, nao
// com `{{1}}`. Mesma substituicao que o backend faz ao gravar a mensagem.
export const renderTemplateBody = (body, parameters = []) =>
  String(body || "").replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index) => {
    const value = parameters[Number(index) - 1];
    return value ? value : match;
  });
