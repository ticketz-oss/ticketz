# Instrução de implementação — Status (Stories) do WhatsApp no EspaçoWhats

> Cópia da instrução enviada por Guilherme Santos em 19/10/2026 no projeto Espaço Whats, com dois acréscimos dele no fim ("Acréscimos do pedido"). Design de referência: prancheta "Atendimentos – Stories WhatsApp" do artefato https://claude.ai/artifact/FUn4TvVDR1GG5DqYzCrVhq.

**Revisado em 18/10/2026.** Este documento trata da publicação e da visualização dos **próprios** Status da conta conectada. Não inclui ver Status de terceiros, enviar campanhas por mensagem privada nem publicar Stories do Instagram. O design da interface já existe: implemente-o sem redesenhá-lo.

## Resultado esperado

Permitir que um operador autorizado crie rascunhos de texto, imagem e vídeo; escolha uma conexão WhatsApp da sua empresa; publique ou agende a publicação quando o provedor permitir; e acompanhe o estado da tentativa. Cada publicação deve ficar persistida no banco, com a mídia em armazenamento durável da empresa. A lista de "meus Status" deve mostrar ao menos os registros criados no EspaçoWhats. Status publicados diretamente pelo telefone só entram na lista após uma sincronização própria comprovadamente funcional. A interface deve representar honestamente a capacidade de cada conexão.

## Decisão de capacidade por modo

| Conexão da empresa | Publicar Status automaticamente | Comportamento a implementar |
| --- | --- | --- |
| WhatsApp por QR, `apiMode=baileys` | **Viável em teste**, usando a sessão Web e `status@broadcast` | Habilitar após prova de ponta a ponta na versão exata de `libzapitu-rf` usada pelo projeto. Registrar ID e confirmação observável; falhar de forma explícita quando o protocolo não confirmar. |
| WhatsApp Cloud API da Meta, `apiMode=official` | **Sem endpoint público de publicação identificado na documentação oficial consultada** | Permitir rascunho, prévia e exportação da mídia para publicação manual quando a conta também tiver um aplicativo compatível. Não chamar `/messages` como se publicasse Status, nem usar uma sessão privada oculta nessa modalidade. Manter um adapter desabilitado até surgir uma API oficial documentada e validada. |

Na documentação da Meta, `statuses` significa **estado de entrega de mensagens** (`sent`, `delivered`, `read`), não a publicação de Status/Stories. A [coleção oficial da Cloud API](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api) documenta mensagens e seus estados; a [referência de `statuses`](https://www.postman.com/meta/whatsapp-business-platform/folder/fuaee8l/statuses-object) confirma esse significado. A [documentação do Baileys](https://github.com/WhiskeySockets/Baileys/blob/master/README.md) documenta `status@broadcast`, `statusJidList` e `broadcast`, mas há [falhas relatadas para certos cenários e versões](https://github.com/WhiskeySockets/Baileys/issues/2118). Não prometa publicação antes do teste real da biblioteca instalada.

## Leitura obrigatória do projeto antes de editar

- Repositório: `/etc/dokploy/compose/espaco-whats-7oyzgd/code`. Leia `AGENTS.md`; não altere a configuração de produção como parte desta tarefa.
- `backend/package.json` usa **`libzapitu-rf`**, não o pacote upstream `@whiskeysockets/baileys`. Verifique no código/artefato dessa versão se `sendMessage` aceita as opções de Status. Evite substituir o fork sem avaliar compatibilidade de sessão, chaves e listeners.
- `backend/src/libs/wbot.ts` cria as sessões; `backend/src/services/WbotServices/StartWhatsAppSession.ts` só inicia sessão para conexões não oficiais; `backend/src/helpers/GetWhatsappWbot.ts` obtém o socket.
- `backend/src/services/WbotServices/wbotMessageListener.ts` atualmente ignora `status@broadcast` na entrada. Preserve esse filtro para que Status não virem tickets nem campanhas.
- `backend/src/models/Whatsapp.ts` guarda `apiMode`; `backend/src/services/WhatsappService/CreateWhatsAppService.ts` deriva esse valor de `Company.whatsappMode`. Toda publicação deve conferir `companyId`, `whatsappId`, `apiMode` e conexão ativa no momento de executar o job.
- Inspecione o armazenamento de mídia em `backend/src/config/upload.ts`, o tratamento de arquivos privados e o pipeline existente antes de criar uma nova rota de upload.

## Modelo de dados proposto

Crie uma migration e modelo `WhatsappStatusPost` (nome ajustável à convenção do repositório) com, no mínimo: `id`, `companyId`, `whatsappId`, `createdByUserId`, `kind` (`text|image|video`), `body`, `mediaPath`, `mediaMime`, `backgroundColor`, `font`, `audienceMode`, `statusJidList` ou referência a audiência autorizada, `scheduledAt`, `state` (`draft|queued|publishing|published|failed|unsupported|cancelled`), `remoteMessageId`, `publishedAt`, `expiresAt`, `failureCode`, `idempotencyKey`, timestamps. Indexe empresa, conexão, estado e horário. Escopo de unicidade: `(companyId, idempotencyKey)`.

Armazene apenas metadados necessários para a publicação. Proteja `statusJidList` como dado pessoal; não grave sessões, chaves ou tokens no registro. Use mídia no storage durável existente, com caminho isolado por empresa, validação de tipo real, limites configuráveis, limpeza de órfãos e acesso autorizado. O `expiresAt` representa a janela de exibição esperada na UI; não equivale a uma confirmação de remoção no WhatsApp.

## Contrato de serviço

Defina um adapter com `capabilities(connection)`, `publish(post)`, `getOwnPosts(connection)` quando suportado e erros tipados. `capabilities` deve retornar `publishStatus=false` para Cloud API e `publishStatus=true` apenas depois de validar a sessão QR e a versão da biblioteca. A lista padrão lê `WhatsappStatusPost`; se houver requisito de importar Status publicados pelo telefone, faça prova separada de eventos próprios `status@broadcast` e implemente deduplicação por ID remoto. **Não use `fetchStatus(jid)` para isso:** na documentação do Baileys, ele consulta o texto "Sobre" do perfil. Separe o Status do fluxo de `SendWhatsAppMessage` e da tabela de `Message`: uma publicação de Status não é uma mensagem de ticket.

Fluxo no modo QR:

1. Validar autorização, empresa, conexão ativa, mídia e idempotência; criar `draft` ou `queued` no banco.
2. Em um worker Bull, obter o socket da **mesma** conexão e conferir novamente estado e empresa. Serializar publicações por conexão; usar retry limitado e identificar erros permanentes.
3. Montar conteúdo conforme a capacidade comprovada do fork. Como referência de protocolo, o upstream usa algo equivalente a `sock.sendMessage("status@broadcast", content, { broadcast: true, statusJidList, backgroundColor, font })`. O código final deve seguir as assinaturas reais de `libzapitu-rf` e passar as opções no terceiro argumento.
4. Formar a audiência a partir de identidades WhatsApp válidas e da configuração de privacidade escolhida. Não interpretar uma lista vazia como "todos"; não presumir que todos os contatos importados possam visualizar o Status. Exibir ao operador a audiência selecionada antes de publicar.
5. Persistir `remoteMessageId`, horários e resultado; emitir evento Socket.IO com escopo da empresa. Evitar repetição após timeout: antes de retry, consultar o estado do job e o retorno da sessão para não duplicar a publicação.

Fluxo no modo oficial: criar/editar rascunho, mostrar prévia e oferecer download/compartilhamento manual do arquivo quando aplicável. O botão de publicação automática deve ficar indisponível com motivo claro. Uma futura integração oficial entra como novo adapter após comprovação em documentação da Meta; ela não muda automaticamente o modo da empresa.

## API e interface

Crie rotas autenticadas de listagem, criação, edição, upload, agendamento, publicação, cancelamento e `capabilities` por conexão. Confira `companyId` em cada consulta, arquivo e job; não aceite IDs de outra empresa. Reaproveite o design fornecido: seletores de conexão, editor, prévia, agenda, lista de próprios Status e estado da publicação. A UI deve distinguir "agendado", "enviado à sessão", "confirmado" e "falhou" conforme a evidência que o provedor realmente fornece; não invente métricas de visualizações.

## Bibliotecas e escolha técnica

- **Prioridade:** testar `libzapitu-rf` já instalado e auditar suas opções de Status. O [Baileys upstream](https://github.com/WhiskeySockets/Baileys) é referência técnica, não substituição automática.
- `sharp`, `@ffmpeg-installer/ffmpeg`, Bull e Sequelize já constam do backend; reaproveite somente onde fizer sentido. Verifique mídia em dispositivos reais antes de aceitar formatos; um retorno sem erro do socket pode não significar que o Status apareceu no aparelho.
- Não há biblioteca que transforme a Cloud API em API oficial de Status. Nenhuma frequência ou atraso garante evitar restrições de conta.

## Ordem de execução e critérios de aceite

1. Faça um experimento controlado em conta de teste QR: texto, imagem e vídeo, com destinatários de teste e confirmação em WhatsApp móvel. Documente versão do fork, opções exatas, resultado e falhas. Se falhar, mantenha a publicação automática desligada.
2. Implemente migration, serviço, worker, rotas e integração com o design, respeitando os dois modos.
3. Teste isolamento entre empresas, conexão desconectada, reconexão, duplicação de job, falha/timeout, mídia inválida, agendamento e estado `unsupported` no modo oficial. Verifique que Status recebido não cria ticket.
4. Execute build e testes relevantes do backend/frontend; revise diferenças antes de deploy. Não publique Status reais de clientes durante testes automatizados.

**Aceite:** um Status de teste aparece no aparelho no modo QR e fica associado somente à empresa e à conexão corretas; a modalidade Cloud API informa sua indisponibilidade de publicação automática; nenhum caminho usa mensagens privadas como substituto silencioso do Status.

## Acréscimos do pedido (19/10/2026)

- "Vamos testar localmente primeiro": todo o trabalho roda e é validado no ambiente Docker local do Mac antes de qualquer deploy.
- "Quero poder ativar e desativar essa funcionalidade na tela de configurações, para os tenants que eu escolher": o super admin liga/desliga Status por empresa na tela de Configurações. Empresa desligada não vê a faixa de stories nem acessa as rotas.
