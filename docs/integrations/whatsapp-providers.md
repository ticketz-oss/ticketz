# Métodos WhatsApp por empresa

Issues: [#97](https://github.com/GuiZeroUm/ticketz/issues/97), [#98](https://github.com/GuiZeroUm/ticketz/issues/98).

## Contrato

A empresa nasce com `whatsappMode: "normal"` (não oficial/Baileys) ou `"meta"` (Cloud API oficial). A escolha aparece no cadastro do superadmin, do parceiro e no cadastro público, quando habilitado. Na edição o campo é somente leitura. Serviços de atualização e trigger PostgreSQL rejeitam mudança em qualquer direção, mesmo sem conexões ou depois de excluir uma conexão.

A API de empresas e parceiros usa `whatsappMode`; a API de plataforma aceita `whatsapp_mode` ou `whatsappMode` e devolve `whatsapp_mode`. Chamadores legados que omitem o campo continuam criando `normal`. Valores diferentes de `normal`/`meta` são inválidos.

Cada conexão deriva `apiMode` da empresa: `baileys` ou `official`. O cliente não escolhe nem altera o provedor da conexão. Excluir/recriar a conexão não muda o método da empresa. Isso impede a transição de método dentro da empresa; não representa garantia contra bloqueios externos de números pela Meta.

## Extração da ACNorte

Base do sistema geral: `origin/main` em `10bec24d`. Fonte da integração oficial: `origin/acnorte` em `f5a344cf`. O porte é seletivo; não mescla a branch inteira.

Compartilhados: conexão Meta, credenciais criptografadas, assinatura de webhook, entrada de mensagens e recibos, texto/mídia/reações/leitura, janela de atendimento, templates aprovados e integração com filas/chatbot de texto e menus.

Continuam exclusivos da branch ACNorte: SGA/Hinova, régua de cobrança e boletos, políticas particulares de acesso e nomes de contatos, autenticação mobile e configurações do runtime dedicado. Nenhuma dessas regras é ativada para novas empresas oficiais. A disponibilidade da Cloud API agora depende do método da empresa, sem allowlist de cliente.

## Configuração do servidor

Fornecer no ambiente do backend (secret manager ou env_file privado, nunca no Git):

- `META_APP_ID`, `META_APP_SECRET`: aplicativo da plataforma.
- `META_CONFIG_ID`: configuração Embedded Signup. Opcional na publicação por provisionamento manual; sem ela, a interface orienta procurar o administrador em vez de oferecer um login indisponível.
- `META_WEBHOOK_VERIFY_TOKEN`: segredo para verificar o webhook.
- `META_WEBHOOK_CALLBACK_URL`: URL HTTPS deste runtime para aplicar override por WABA ao conectar novas contas. A assinatura de uma WABA já pertencente a outro runtime é rejeitada antes de qualquer registro/alteração externa.
- `ENCRYPTION_KEY`: chave estável para criptografar os tokens persistidos. Não rotacionar sem migrar os tokens; ao reutilizar banco/credenciais existentes, preservar a chave correspondente.
- `META_GRAPH_API_VERSION`: versão usada no Graph client; padrão herdado `v21.0`.

O aplicativo Meta precisa estar configurado para os domínios e o onboarding comercial usado pela plataforma. Os IDs públicos são expostos por `GET /whatsapp/meta/config`, junto com `graphApiVersion` e `billingMode: "direct"`; segredos e tokens não são devolvidos à interface. O guia de [login pelo cliente e configuração da conta Meta](meta-self-service-setup.md) detalha os requisitos de habilitação do aplicativo e o pagamento direto pelo cliente.

Webhook: `<URL pública do backend>/webhooks/meta/whatsapp`, considerando o prefixo `/backend` quando usado no proxy. GET exige o verify token; POST exige assinatura HMAC sobre os bytes originais com o app secret. Preservar os filtros `TENANT_RUNTIME_*`: um runtime não processa empresas pertencentes a outro. Quando runtimes compartilham o aplicativo Meta, `META_WEBHOOK_CALLBACK_URL` configura o destino por WABA na assinatura das novas contas. Uma WABA não pode atravessar runtimes; conexões da mesma WABA podem compartilhar este runtime. A configuração global do aplicativo e o destino da conta ACNorte não são alterados por esse fluxo.

Criar empresa oficial, criar conexão e usar **Conectar via Meta**. O código retornado pelo Facebook Login for Business é trocado uma única vez pelo token empresarial do cliente. Antes de registrar/assinar, o backend verifica o aplicativo emissor, as permissões concedidas, a validade do token e o vínculo do número com a WABA selecionada. A conexão oferece **Pagamentos na Meta** para cadastrar/revisar o meio de pagamento da própria conta; conexão técnica não confirma pagamento. Nenhuma linha de crédito da plataforma é vinculada e nenhum dado de cartão é coletado. O fluxo manual existente permanece restrito a superadmin (`POST /whatsapp/:id/meta/manual-connect`) para provisionamento administrativo autorizado. O corpo do provisionamento manual exige `wabaId`, `phoneNumberId`, `accessToken` e `pin` (6 dígitos, escolhido para verificação em duas etapas ou o PIN existente; não é o código de SMS). O Embedded Signup também solicita esse PIN, sem persistir ou registrar seu valor. Nunca colar tokens em issues, logs ou chat.

Um `metaPhoneNumberId` não pode ser associado a duas conexões. Desconectar um número não deve remover a assinatura de outro número ativo da mesma WABA.

## Recursos e limites

| Recurso | Não oficial | Oficial |
| --- | --- | --- |
| Conexão | QR/pareamento existente | Embedded Signup ou provisionamento superadmin |
| Atendimento, texto, mídia manual, leitura e reações | Fluxo existente | Serviços Cloud API |
| Chatbot | Fluxo existente | Texto, menus e mídia pelos serviços Cloud API; texto de áudio enviado separadamente |
| Fora da janela de atendimento | Fluxo existente | Template aprovado; o backend valida a janela |
| Templates no chat | Não se aplica | Templates de texto aprovados; cabeçalhos de mídia não entram nessa seleção |
| Grupos, privacidade, importação de agenda do WhatsApp, edição/exclusão/encaminhamento de mensagens | Fluxo existente | Sem suporte nesta extração |
| Campanhas e agendamentos atuais | Fluxo existente | Bloqueados antes de criar envio incompatível |
| Chamadas por sessões QR (WaCalls/Wavoip) | Piloto existente | Bloqueadas para conexões oficiais |

A seleção de templates percorre as páginas da Meta e exclui componentes cujos parâmetros o chat não implementa (por exemplo, cabeçalho dinâmico e botões dinâmicos). A janela considera mensagens do mesmo contato e conexão na mesma empresa, incluindo tickets anteriores.

O processamento de webhook preserva o desenho herdado: responde ao provedor antes de concluir o processamento e registra falhas. Não há fila durável de reprocessamento adicionada nesta extração. Testes automatizados com Graph API simulada não substituem homologação com um número autorizado.

## Migrações e publicação

1. Fazer backup e verificar empresas com conexões de métodos diferentes antes do rollout. A migração interrompe com rollback ao encontrar uma empresa mista, sem tentar desconectar ou converter números.
2. A migração de campos Meta usa o mesmo identificador histórico da ACNorte. Em banco onde já foi executada, o Sequelize não a repete.
3. A migração de empresas preserva o campo existente quando presente, identifica conexões oficiais e mantém as demais empresas como `normal`. Acrescenta CHECK e trigger de imutabilidade.
4. A migração de unicidade exige IDs oficiais não duplicados. Inconsistências devem ser revisadas explicitamente, sem remover conexões automaticamente.
5. Publicar código e executar migrações pelo processo habitual. Não executar `npm test` do backend em banco existente: seus hooks migram, fazem seed e desfazem migrações.
6. Antes de liberar clientes, homologar entrada/saída de texto e mídia, recibos, template e desconexão/reconexão em um número oficial autorizado e no ambiente não oficial de teste. Não usar números ativos de clientes para testar transições.

Reverter apenas a aplicação exige manter os campos/provedor persistidos; não desfazer as migrações Meta em banco com credenciais/conexões oficiais. Retornar a um backend anterior sem guardas de provedor após cadastrar novas empresas oficiais é inseguro: o rollback deve ocorrer antes desse cadastro ou manter tais empresas fora do acesso e do runtime antigo. A publicação geral usa o workflow `release-production.yml` após validação do SHA em `main`; a edição ACNorte mantém seu runtime e sua branch de publicação independentes.

## Verificação reproduzível

- Backend: `cd backend && npm run build`.
- Testes Meta: `NODE_ENV=test npx jest --runInBand --coverage=false --testPathPattern='MetaWhatsAppServices|TicketServiceWindowService|FindOrCreateTicketServiceMeta|ShowTicketFromUUIDService|SendWhatsAppMedia.spec|SocketSendWhatsappUpdate.spec'`.
- Regressão: `NODE_ENV=test npx jest --runInBand --coverage=false --forceExit --testPathPattern='WbotServices/__tests__|ScheduleServices/__tests__|CampaignService/__tests__|VoiceServices/__tests__|WhatsappService/__tests__|CompanyLifecycle|PlatformTenantLifecycle|tenantRuntime'`. Essa seleção contém handles Redis legados; `--forceExit` encerra o runner após o resultado, sem mudar o código de produção.
- Frontend: `cd frontend && npm ci && npm run build` e `CI=true npm test -- --watchAll=false --runInBand --coverage=false --testPathPattern='CompanyWhatsAppModeField|MetaEmbeddedSignupButton|TemplateMessageModal|officialApiRestriction|MessageInputCustom'`.
- Migrações: executar `backend/scripts/test-whatsapp-provider-migrations.cjs` com `WHATSAPP_MIGRATION_TEST_URL` apontando exclusivamente para PostgreSQL descartável. O script cria e exclui seu próprio banco aleatório. Validado com PostgreSQL 16, incluindo schema novo, schema ACNorte, imutabilidade bidirecional, unicidade e rollback de empresa mista.

As chamadas externas nos testes são simuladas. O lint geral do backend contém erros anteriores de tipos `any` e variáveis não utilizadas; esses arquivos alheios à extração não foram reformulados.

Resultado da validação desta extração em 28/09/2026: build backend aprovado; build frontend aprovado com avisos existentes; seleção combinada backend com 55 suítes/239 testes aprovados; frontend com 9 suítes/32 testes aprovados; cenários de migração em PostgreSQL 16 aprovados. Backup real restaurado em PostgreSQL 18 descartável: 80 tabelas e 55.970 registros preservados, incluindo sessões e credenciais, com imutabilidade bidirecional aprovada. Consulta de leitura à Meta da conexão existente aprovada. Envio e onboarding de um novo número real continuam dependentes de uma conta autorizada.

## Revisão de publicação

A auditoria pré-produção está registrada na [issue #100](https://github.com/GuiZeroUm/ticketz/issues/100). Ela corrigiu lacunas herdadas de mídia do chatbot, janela entre tickets, templates paginados, PIN de registro e abertura do SDK no navegador. O Compose geral lê opcionalmente `/etc/dokploy/secrets/espaco_whats_meta.env`. O arquivo é provisionado fora do Git; a chave de criptografia deve corresponder ao banco compartilhado.

Fontes primárias: [Meta — registro de número e PIN](https://www.postman.com/meta/whatsapp-business-platform/request/zb2u18b/register-phone), [Meta — callback por WABA](https://www.postman.com/meta/whatsapp-business-platform/request/un84tul/override-callback-url).
