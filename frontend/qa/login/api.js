export default {
  post: async (url, body) => {
    if (url !== "/auth/login/identify") {
      throw new Error("Operação não disponível nesta prévia local.");
    }
    if (body.email.startsWith("missing@")) {
      throw { response: { data: { error: "ERR_EMAIL_NOT_FOUND" } } };
    }
    return {
      data: body.email.startsWith("new@")
        ? { proxima_etapa: "criar_senha", ativacao_token: "local-preview-only" }
        : { proxima_etapa: "senha" }
    };
  }
};
