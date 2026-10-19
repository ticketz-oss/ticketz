import { useEffect, useRef } from "react";

export const chaveDoRascunho = ticketId => `messageDraft-${ticketId}`;

// Mantém no sessionStorage o texto que ainda não foi enviado, por ticket.
//
// A ordem dos dois efeitos importa e foi origem de bug: o compositor é
// remontado a cada ticket (`key={ticket.id}` em Ticket/index.js), então na
// montagem o `ticketId` já é o definitivo e o efeito que grava rodava primeiro,
// com o texto ainda vazio, apagando um rascunho deixado por outra tela antes de
// alguém conseguir lê-lo. A trava garante que nada é apagado antes da leitura.
const useRascunhoDoTicket = (ticketId, inputMessage, setInputMessage) => {
  const carregado = useRef(false);

  useEffect(() => {
    if (!carregado.current) return;
    if (!inputMessage) {
      sessionStorage.removeItem(chaveDoRascunho(ticketId));
      return;
    }
    sessionStorage.setItem(chaveDoRascunho(ticketId), inputMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage]);

  useEffect(() => {
    const rascunho = sessionStorage.getItem(chaveDoRascunho(ticketId));
    if (rascunho) {
      setInputMessage(rascunho);
    }
    carregado.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);
};

export default useRascunhoDoTicket;
