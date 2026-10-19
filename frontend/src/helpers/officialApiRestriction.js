// Fonte unica pra decidir se uma feature sem equivalente na Cloud API oficial
// da Meta deve ficar desabilitada (nunca escondida) numa conexao/ticket.
export const isOfficialApiConnection = whatsapp =>
  whatsapp?.apiMode === "official";
