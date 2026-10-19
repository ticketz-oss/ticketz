# WhatsApp Cloud API (Meta oficial) — status e continuação

Contexto: empresa **acnorte** tomou ban do número (histórico de API oficial da
Meta em outro sistema + reconexão via Baileys/não-oficial no Ticketz = ban).
Solução: segundo modo de conexão (Cloud API oficial da Meta), travado por
empresa, pra nunca mais misturar os dois.

Plano completo original: `.claude/plans/um-cliente-meu-tomou-effervescent-breeze.md`
(na máquina onde foi gerado — se não estiver aqui, este arquivo é o resumo
que basta pra continuar).

Commit com a Fase 1 já mergeado em `dev` e no `origin` (push feito):
`fe805794` (squash lógico, depois mergeado com o resto do dev em `989fba0f`).

## Decisões fechadas (não re-discutir)

1. Modo (`normal`/`meta`) é por **empresa**, decidido uma vez, **imutável**
   depois (nunca reverte — evita perder o número de cliente meta).
2. Planos comerciais (Básico/IA) não mudam em código — só precificação.
3. Autenticação é **Embedded Signup** (cliente loga com Facebook, escolhe a
   WABA/número dele) — nunca token colado manualmente.
4. Rollout restrito: só empresas na allowlist (`META_ALLOWED_COMPANY_IDS`)
   podem virar "meta". Por ora, só acnorte.
5. Atendimentos: texto **e mídia** via API oficial (mídia ainda não feita,
   é a Fase 2).
6. Agendamentos: **só texto** via API oficial, mesmo depois de pronto.
7. Botão/feature sem equivalente oficial: fica **visível, desabilitado,
   tooltip** — nunca escondido.

## Fase 1 — feita e mergeada

Backend:
- Migrations: `Company.whatsappMode`, `Whatsapp.apiMode` + campos
  `metaWabaId/metaPhoneNumberId/metaBusinessId/metaAccessToken(cifrado)/
  metaTokenExpiresAt/metaHealthStatus/metaHealthCheckedAt/metaWebhookVerifiedAt`.
- `helpers/cryptoSecret.ts` — AES-256-GCM pro `metaAccessToken` at-rest.
- `config/metaAllowlist.ts` + `helpers/EnsureCompanyChannelMode.ts` — nunca
  mistura modo dentro da mesma empresa.
- `services/CompanyService/SetCompanyWhatsAppModeService.ts` +
  `PUT /companies/:id/whatsapp-mode` (isSuper) — trava o modo.
- `services/MetaWhatsAppServices/` — módulo novo, paralelo ao `WbotServices`:
  - `ExchangeEmbeddedSignupCodeService`, `RegisterPhoneNumberService`,
    `SubscribeWabaWebhookService`/`UnsubscribeWabaWebhookService`,
    `ConnectMetaWhatsAppService` (orquestra o Embedded Signup completo).
  - `SendMetaTextMessageService` + `PersistMetaOutboundMessageService`
    (envio de texto via Graph API, persiste como `Message` normal).
  - `MetaWebhookSignatureService` (HMAC), `ProcessMetaWebhookEventService`
    + `HandleMetaInboundMessageService` (recepção — **só texto por
    enquanto**, mídia recebida é logada e ignorada).
- `controllers/MetaWhatsAppController.ts` (`connect`, `getConfig`) +
  `controllers/MetaWhatsAppWebhookController.ts` (`verify` GET,
  `handle` POST) + rotas `metaWhatsappRoutes.ts` / `metaWhatsappWebhookRoutes.ts`.
- `app.ts` — `express.json` agora guarda `req.rawBody` (raw buffer, usado
  pra validar assinatura HMAC do webhook).
- Branch pra oficial em `SendWhatsAppMessage.ts`; `CreateWhatsAppService.ts`
  deriva `apiMode` automaticamente da empresa; `WhatsAppController.ts`
  (store/remove) e `WhatsAppSessionController.ts` (store/update/remove/
  refresh/requestCaptureToken/reset) pulam lógica Baileys pra conexão
  oficial; `StartAllWhatsAppsSessions.ts` não boota Baileys pra oficial.
- `ShowWhatsAppService`/`ListWhatsAppsService` — nunca expõem
  `metaAccessToken`; expõem `apiMode`/`metaHealthStatus`.

Frontend:
- `components/MetaEmbeddedSignupButton/` — botão que carrega o SDK JS do
  Facebook e dispara `FB.login` com o Embedded Signup.
- `pages/Connections/index.js` — conexão `apiMode==="official"` mostra esse
  botão em vez do fluxo de QR code; ícone de Privacidade fica desabilitado
  com tooltip pra conexão oficial.
- `components/CompaniesManager/index.js` — seletor "Modo WhatsApp" +
  botão "Travar modo" (com confirmação, é irreversível).
- `hooks/useCompanies/index.js` — `updateWhatsappMode`.
- Chaves i18n novas em `pt.js`/`en.js` (`connections.buttons.connectMeta`,
  `connections.toasts.metaConnected`, `connections.toolTips.notAvailableOfficial`).

Env vars novas (documentadas em `backend/.env.dev`, comentadas):
`META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`,
`META_WEBHOOK_VERIFY_TOKEN`, `META_GRAPH_API_VERSION`,
`META_ALLOWED_COMPANY_IDS`, `ENCRYPTION_KEY`.

Backend `tsc --noEmit` limpo (os únicos erros de módulo hoje são
`@clerk/backend`/`sharp`/`web-push` faltando — vieram do merge com o resto
do `dev`, resolve com `npm install`, não é sobre o código da Meta).

## Fase 2 — mídia em Atendimentos (não feita)

- `UploadMetaMediaService` (`POST /{phoneNumberId}/media`, multipart).
- `SendMetaMediaMessageService` (envia `type: image|audio|document|video`
  com `media.id`).
- `getMetaMessageFileOptions` — mapear mimetype pros tipos/limites aceitos
  pela Graph API (imagem 5MB, áudio só aac/mp4/mpeg/ogg-opus/amr 16MB,
  documento 100MB, vídeo 16MB) — **não** reaproveitar
  `getMessageFileOptions` do `SendWhatsAppMedia.ts` direto, os limites/tipos
  são diferentes do Baileys.
- `DownloadMetaMediaService` (`GET /{media_id}` → url temporária → baixa
  com Bearer → `saveMediaToFile`).
- Branch em `SendWhatsAppMedia.ts` igual ao que já foi feito em
  `SendWhatsAppMessage.ts`.
- Completar `HandleMetaInboundMessageService.ts` pra tratar
  `message.type !== "text"` (hoje só loga e ignora).

## Fase 3 — Agendamentos, só texto (não feita)

- Branch em `helpers/SendMessage.ts` (usado por
  `queues.ts` → `handleSendScheduledMessage`): se `whatsapp.apiMode ===
  "official"`, usar `SendMetaTextMessageService`-like, e **rejeitar** se
  `messageData.mediaPath` estiver presente (`AppError` claro).
- Validar também em `ScheduleServices/CreateService.ts`/`UpdateService.ts`
  (bloquear criar agendamento com mídia se a conexão padrão da empresa for
  oficial) — cinto e suspensório com o branch acima.
- Frontend: desabilitar campo de mídia no form de Agendamento quando
  `whatsappMode === "meta"`.

## Fase 4 — health check (não feita)

- `GetMetaPhoneNumberHealthService` (`GET /{phoneNumberId}?fields=
  quality_rating,status,code_verification_status,name_status,throughput`).
- Endpoint sob demanda pra tela de Conexões + job periódico (padrão de
  `wbotMonitor.ts`) atualizando `metaHealthStatus`/`metaHealthCheckedAt` e
  alertando se `quality_rating` cair pra `RED` — é o sinal precoce de risco
  de ban que motivou o projeto todo.

## Fase 5 — desabilitar (não esconder) o resto do produto (não feita)

Quando `whatsappMode === "meta"`: Campanhas, Grupos de WhatsApp, Importar
contatos do telefone, CheckNumber/GetProfilePicUrl/editar-apagar mensagem
enviada. Mesmo padrão já usado em Conexões (disabled + Tooltip). Vale criar
um hook único (`useOfficialApiRestriction`) pra não duplicar em cada tela.

## Checklist manual pra ativar a acnorte (fora do código)

1. Criar App no Meta for Developers (Business → produto WhatsApp + Facebook
   Login for Business → Configuration de Embedded Signup) e pedir App
   Review de `whatsapp_business_management`/`whatsapp_business_messaging`.
2. Configurar webhook do App: `https://<dominio-producao>/webhooks/meta/whatsapp`,
   verify token = valor que vai em `META_WEBHOOK_VERIFY_TOKEN`.
3. Setar em produção: `META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`,
   `META_WEBHOOK_VERIFY_TOKEN`, `META_GRAPH_API_VERSION`,
   `META_ALLOWED_COMPANY_IDS=<id da acnorte>`, `ENCRYPTION_KEY`.
4. Rodar as migrations novas em produção.
5. **Remover/desativar a conexão Baileys banida da acnorte antes** de
   travar o modo — o sistema bloqueia virar "meta" enquanto existir conexão
   baileys ativa (`ERR_COMPANY_HAS_BAILEYS_CONNECTIONS`), de propósito.
6. Em Empresas (admin), selecionar "API Oficial (Meta)" pra acnorte e clicar
   "Travar modo" — não tem volta.
7. Criar a conexão WhatsApp da acnorte (nasce já `apiMode: "official"`) e
   clicar "Conectar via Meta" — cliente loga com o Facebook dele.

## Cuidado ao continuar em outra máquina

- Fazer `git pull` na `dev` antes de tocar em qualquer coisa — o merge feito
  aqui trouxe um monte de trabalho de outra pessoa (Clerk auth, mobile login,
  redesign, queue flow builder, web push, etc.), sem relação com Meta.
- Depois do pull, rodar `npm install` no backend e no frontend (o merge trouxe
  dependências novas — `@clerk/backend`, `sharp`, `web-push` — que ainda não
  estão instaladas aqui).
- `ENCRYPTION_KEY` precisa estar setada antes de criar qualquer conexão
  oficial — sem ela, `metaAccessToken` não cifra e a conexão falha.
