# Fotos de contatos sem armazenamento de imagens

Correção global, compartilhada entre `dev` e `acnorte`.

- A primeira consulta de `GetProfilePicUrl` devolve a URL imediatamente.
- O cache Redis guarda apenas URLs, separado por conexão WhatsApp e tamanho, por até uma hora (limitado também pela validade do link assinado). Eventos de alteração invalidam os mesmos identificadores.
- `AvatarContato` usa a imagem diretamente do provedor, sem referrer, tenta a versão alternativa e solicita uma recuperação quando ambas falham ou não existem. Contatos, listas de tickets e painel do contato usam o mesmo componente.
- `POST /contacts/:contactId/picture/refresh` exige autenticação, consulta o contato pelo tenant autenticado e usa somente uma conexão WhatsApp já conectada desse tenant. Não aceita uma URL arbitrária, não faz proxy/download e não inicia sessões.
- Há limite de 120 solicitações por minuto por tenant, até quatro recuperações simultâneas no processo, deduplicação de solicitações simultâneas do mesmo contato e intervalo de cinco minutos entre consultas de um contato. A espera por uma vaga é limitada a 15 segundos.
- Somente `profilePicUrl` e `profileHiresPictureUrl` podem ser atualizados. Nenhuma imagem é salva em disco/banco; os únicos dados persistidos são endereços, como antes.
- Falhas temporárias, fotos privadas e sessões desconectadas preservam os dados anteriores e mostram as iniciais quando não há uma imagem acessível. Não há garantia de recuperar fotos sem conexão ativa ou contrariando a privacidade do WhatsApp.

Validação: testes de primeira consulta/cache/validade, isolamento de tenant, desconexão, privacidade, JID de grupo/LID, recuperação visual, fallback e resposta atrasada após troca de contato. A integração SGA não faz parte desta feature.
