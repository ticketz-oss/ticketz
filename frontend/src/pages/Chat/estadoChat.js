export const mesclarMensagens = (atuais, novas) => {
  const mensagens = new Map(atuais.map(mensagem => [mensagem.id, mensagem]));
  novas.forEach(mensagem => mensagens.set(mensagem.id, mensagem));
  return [...mensagens.values()].sort((a, b) => a.id - b.id);
};

export const mesclarConversa = (atual, nova) => ({
  ...atual,
  ...nova,
  users:
    nova.users?.map(participante => ({
      ...atual?.users?.find(
        anterior => anterior.userId === participante.userId
      ),
      ...participante
    })) ||
    atual?.users ||
    []
});

export const atualizarConversas = (atuais, nova) => {
  const existe = atuais.some(conversa => conversa.id === nova.id);
  const conversas = existe
    ? atuais.map(conversa =>
        conversa.id === nova.id ? mesclarConversa(conversa, nova) : conversa
      )
    : [nova, ...atuais];
  return conversas.sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
};
