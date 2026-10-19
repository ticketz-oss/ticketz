const pt = {
  title: "Seu Espaço Whats no iPhone",
  description:
    "Entre com a conta Google cadastrada nesta empresa para continuar no aplicativo.",
  environment: "Ambiente de desenvolvimento",
  google: "Continuar com Google",
  loading: "Preparando acesso seguro…",
  returning: "Acesso autorizado. Volte ao aplicativo para concluir.",
  returnToApp: "Voltar ao app",
  cancel: "Cancelar acesso",
  canceled: "Acesso cancelado",
  canceledDescription:
    "Volte ao aplicativo e inicie um novo acesso quando quiser.",
  unavailable:
    "Este acesso não está disponível. Volte ao aplicativo e tente novamente.",
  expired: "Este acesso expirou. Volte ao aplicativo e inicie novamente.",
  membership:
    "Somente usuários já cadastrados nesta empresa podem entrar. Caso precise de acesso, peça ao administrador para cadastrar seu e-mail.",
  finishLegal: "Concluir acesso",
  noAutomaticSignup: "Nenhuma conta é criada automaticamente no Espaço Whats."
};

export const mobileLoginMessages = Object.fromEntries(
  ["pt", "pt_PT", "en", "es", "fr", "de", "it", "id"].map(language => [
    language,
    { mobileLogin: pt }
  ])
);
