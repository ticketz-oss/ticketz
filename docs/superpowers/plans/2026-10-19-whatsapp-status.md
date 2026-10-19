# Status (Stories) do WhatsApp — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Operadores de empresas habilitadas pelo super admin criam, agendam e publicam Status (texto, imagem, vídeo) na própria conta WhatsApp QR, com estado persistido e honesto, seguindo o design "Atendimentos – Stories WhatsApp".

**Architecture:** Nova tabela `WhatsappStatusPosts` separada de `Messages`. Um serviço de domínio valida e grava os posts; uma fila Bull própria (`WhatsappStatusPublish`) publica pelo adapter do modo da conexão (`BaileysStatusProvider` ativo só para versões do `libzapitu-rf` aprovadas no experimento; `OfficialStatusProvider` sempre `publishStatus=false`). Um campo `Companies.whatsappStatusEnabled` liga a função por tenant, controlado numa seção nova da Central de Configurações (super admin).

**Tech Stack:** Express + Sequelize-typescript + Bull + `libzapitu-rf@1.0.0-alpha.16` + `sharp` no backend; React 17 + Material-UI v4 + Radix (Central de Configurações) no frontend; Jest (ts-jest no backend, CRA no frontend).

**Spec:** `docs/superpowers/specs/2026-10-19-whatsapp-status.md` (design: prancheta "Atendimentos – Stories WhatsApp", arquivo `project/AtendimentosStories.dc.html` do artefato https://claude.ai/artifact/FUn4TvVDR1GG5DqYzCrVhq).

## Global Constraints

- Tudo roda e é validado primeiro no Docker local do Mac: `docker compose -f docker-compose-local.yaml -f docker-compose.localruntime.yaml up -d --build` (front :3000, backend :8080). Não alterar configuração de produção nem fazer deploy neste plano.
- Biblioteca: `libzapitu-rf` exatamente `1.0.0-alpha.16` (versão do `package-lock.json`). Não trocar pelo `@whiskeysockets/baileys`.
- Auditoria já feita do `alpha.16`: `MiscMessageGenerationOptions` aceita `statusJidList`, `backgroundColor`, `font`, `broadcast` (`lib/Types/Message.d.ts:205-247`); `sendMessage` repassa `statusJidList` ao `relayMessage` (`lib/Socket/messages-send.js:1012`), que trata `jid === "status@broadcast"` (`:321-541`); `backgroundColor`/`font` viram `backgroundArgb`/`font` no `extendedTextMessage` (`lib/Utils/messages.js:296-300`).
- `publishStatus=true` só quando a versão instalada estiver em `VERIFIED_LIBZAPITU_VERSIONS` (preenchida só se o experimento da Task 1 passar) **e** a conexão for `apiMode="baileys"` com `status="CONNECTED"`.
- Cloud API (`apiMode="official"`): nunca chamar `/messages` nem abrir sessão Web para Status. Rascunho, prévia e download apenas.
- Status nunca passa por `SendWhatsAppMessage`, `Message` ou `Ticket`. O filtro `remoteJid === "status@broadcast"` em `wbotMessageListener.ts:1061` e `:2310` fica intacto.
- Estados do post: `draft | queued | publishing | published | failed | unsupported | cancelled`. Rótulos na UI: `queued` com `scheduledAt` futuro = "Agendado"; `queued`/`publishing` = "Enviando à sessão"; `published` = "Enviado à sessão" (não "confirmado": o fork só devolve o `key.id`, e nenhum evento de confirmação está provado); `failed` = "Falhou"; `unsupported` = "Indisponível nesta conexão". "Confirmado" só aparece se a Task 1 provar um sinal observável (ver Task 1, passo 4).
- Nenhuma métrica de visualização. Texto fixo do design: "O WhatsApp não informa quem visualizou stories publicados pela plataforma."
- Limites configuráveis por env: `WHATSAPP_STATUS_MAX_IMAGE_MB` (padrão 5), `WHATSAPP_STATUS_MAX_VIDEO_MB` (padrão 16), `WHATSAPP_STATUS_MAX_AUDIENCE` (padrão 5000). Texto: até 700 caracteres (design).
- Formatos aceitos (verificados por bytes, não pela extensão): imagem JPEG/PNG/WEBP (convertida para JPEG com `sharp`); vídeo MP4 (`ftyp` no offset 4).
- Mídia em `private/whatsapp-status/<companyId>/<uuid>.<ext>` (via `config/privateFiles.ts`), servida só por rota autenticada que confere `companyId`.
- `statusJidList` não é gravado. O post guarda `audienceMode` (`connection_contacts | contact_list`), `contactListId` e `audienceCount`; a lista de JIDs é resolvida no worker e descartada.
- Lista vazia de audiência é erro (`ERR_STATUS_AUDIENCE_EMPTY`), nunca "todos".
- Função desligada por padrão para toda empresa (`whatsappStatusEnabled=false`); só super admin altera.
- Backend: depois de editar, `npx eslint --fix src/**/*.ts`. Frontend: `npx prettier --write` nos arquivos alterados. Erros de API são códigos `ERR_STATUS_*`; textos de UI via `i18n.t`, com chaves em `pt.js` e `en.js` (demais idiomas caem no fallback `en`).
- Testes automatizados nunca publicam Status reais: o socket é sempre mock.

## Review Focus

1. **Job repetido depois de timeout** (worker caiu após `sendMessage` sem gravar o resultado): ninguém espera ver o mesmo Status duas vezes no aparelho. Esperado: o post fica `failed` com `ERR_STATUS_OUTCOME_UNKNOWN`, sem novo envio. Teste na Task 7.
2. **Conexão trocada de empresa ou desconectada entre agendar e publicar**: esperado `failed` com `ERR_STATUS_CONNECTION_UNAVAILABLE` (desconectada, após as tentativas) ou `ERR_STATUS_CONNECTION_MISMATCH` (sem retry). Teste na Task 7.
3. **Empresa desligada pelo super admin com posts já agendados**: ninguém espera que um Status agendado saia depois de a função ser desligada. Esperado: worker marca `cancelled` com `ERR_STATUS_FEATURE_DISABLED`. Teste na Task 7.
4. **Arquivo com extensão de imagem mas conteúdo de outro tipo, ou acima do limite**: esperado 400 `ERR_STATUS_MEDIA_INVALID`/`ERR_STATUS_MEDIA_TOO_LARGE` e arquivo apagado do disco. Teste na Task 4.
5. **ID de post, conexão, lista de contatos ou mídia de outra empresa** em qualquer rota: esperado 404, sem revelar existência. Testes nas Tasks 6 e 8.

---

## Mapa de arquivos

Backend (`backend/src/`):
- `scripts/whatsappStatusSpike.ts` — experimento isolado (Task 1).
- `database/migrations/20261019120000-add-whatsapp-status-enabled-to-companies.ts`, `models/Company.ts` — flag por tenant (Task 2).
- `services/WhatsappStatusServices/StatusFeatureService.ts`, `middleware/isWhatsappStatusEnabled.ts`, `controllers/WhatsappStatusAdminController.ts` — liga/desliga (Task 2).
- `database/migrations/20261019121000-create-whatsapp-status-posts.ts`, `models/WhatsappStatusPost.ts`, `database/index.ts` — tabela (Task 3).
- `services/WhatsappStatusServices/StatusMediaService.ts` — mídia (Task 4).
- `services/WhatsappStatusServices/StatusAudienceService.ts` — audiência (Task 5).
- `services/WhatsappStatusServices/providers/{types,BaileysStatusProvider,OfficialStatusProvider,index}.ts` — adapters (Task 6).
- `services/WhatsappStatusServices/StatusPostService.ts`, `services/WhatsappStatusServices/StatusSocket.ts` — regras de negócio (Task 6).
- `queues/whatsappStatus.ts`, `queues.ts` — worker (Task 7).
- `controllers/WhatsappStatusController.ts`, `routes/whatsappStatusRoutes.ts`, `routes/index.ts` — API (Task 8).

Frontend (`frontend/src/`):
- `components/Settings/WhatsappStatusTenants.js`, `components/Settings/CentralConfiguracoes.js`, `pages/SettingsCustom/index.js` — tela do super admin (Task 2).
- `components/WhatsappStatus/{useWhatsappStatus.js,StoriesStrip.js,NewStoryModal.js,StoryViewer.js,storyState.js}` e integração em `components/TicketsManagerTabs/index.js` (Tasks 9 e 10).
- `translate/languages/pt.js`, `translate/languages/en.js`.

---

### Task 1: Experimento controlado no modo QR (manual, com aparelho de teste)

Prova exigida pela spec antes de ligar a publicação. Usa um **segundo aparelho vinculado** com credenciais próprias numa pasta temporária, para não disputar a sessão do backend. Roda no Mac, fora do Docker.

**Files:**
- Create: `backend/src/scripts/whatsappStatusSpike.ts`
- Create: `docs/whatsapp-status-spike.md` (resultado)

**Interfaces:**
- Produces: a lista `VERIFIED_LIBZAPITU_VERSIONS` usada na Task 6 (vazia se o experimento falhar) e o formato exato das opções de envio.

- [ ] **Step 1: Escrever o script**

`npx ts-node --transpile-only src/scripts/whatsappStatusSpike.ts --auth /tmp/ew-status-spike --to 55689XXXXXXXX[,…] --kind text|image|video [--file caminho]`. Usa `useMultiFileAuthState(authDir)` e `makeWASocket` do `libzapitu-rf` com `version` de `src/waversion.json`, imprime o QR com `qrcode-terminal`, espera `connection === "open"` e chama:

```ts
await sock.sendMessage("status@broadcast", content, {
  broadcast: true,
  statusJidList: [jidNormalizedUser(sock.user.id), ...destinos],
  ...(kind === "text" ? { backgroundColor: "#024BF4", font: 1 } : {})
});
```

com `content` = `{ text }`, `{ image: { url }, caption }` ou `{ video: { url }, caption }`. Imprime `key.id`, a versão lida de `node_modules/libzapitu-rf/package.json` e todo evento `messages.upsert`/`messages.update`/`message-receipt.update` com `remoteJid === "status@broadcast"` por 60 s. Recusa rodar se `NODE_ENV=production`.

- [ ] **Step 2: Rodar com o Guilherme (conta de teste + 1 destinatário de teste)**

Rodar texto, imagem JPEG e vídeo MP4 curto. Para cada um, conferir no app do aparelho de teste **e** no do destinatário se o Status aparece. Desvincular o aparelho no fim e apagar `/tmp/ew-status-spike`.

- [ ] **Step 3: Testar o próprio JID fora da lista**

Repetir o texto sem o próprio JID em `statusJidList` e anotar se o Status some do próprio aparelho. Decide se o adapter sempre acrescenta o próprio JID (padrão do plano: acrescenta).

- [ ] **Step 4: Registrar em `docs/whatsapp-status-spike.md`**

Versão do fork, opções exatas, resultado por tipo (aparece no aparelho / no destinatário / erro), eventos observados. Se algum evento de recibo (`message-receipt.update` ou `messages.update` com `status >= 3`) chegar de forma consistente, anotar o formato: só então a Task 7 pode marcar "Confirmado". Sem isso, o estado final visível é "Enviado à sessão".

- [ ] **Step 5: Commit**

```bash
git add backend/src/scripts/whatsappStatusSpike.ts docs/whatsapp-status-spike.md
git commit -m "chore(status): add isolated WhatsApp status spike and results"
```

**Gate:** se texto não aparecer no aparelho, `VERIFIED_LIBZAPITU_VERSIONS` fica `[]`, e as Tasks seguintes são implementadas igualmente (rascunho, agenda, UI), mas todo publish termina em `unsupported`. Tipo que falhar (ex.: vídeo) entra em `UNVERIFIED_KINDS` na Task 6.

---

### Task 2: Liga/desliga por tenant na Central de Configurações

**Files:**
- Create: `backend/src/database/migrations/20261019120000-add-whatsapp-status-enabled-to-companies.ts`
- Modify: `backend/src/models/Company.ts` (junto de `whatsappMode`, ~linha 96)
- Create: `backend/src/services/WhatsappStatusServices/StatusFeatureService.ts`
- Create: `backend/src/middleware/isWhatsappStatusEnabled.ts`
- Create: `backend/src/controllers/WhatsappStatusAdminController.ts`
- Create: `backend/src/routes/whatsappStatusRoutes.ts` (só as rotas desta task; a Task 8 acrescenta o resto) e registrar em `backend/src/routes/index.ts`
- Create: `frontend/src/components/Settings/WhatsappStatusTenants.js`
- Modify: `frontend/src/components/Settings/CentralConfiguracoes.js:76-85`, `frontend/src/pages/SettingsCustom/index.js:301-334`, `frontend/src/translate/languages/{pt,en}.js`
- Test: `backend/src/services/WhatsappStatusServices/__tests__/StatusFeatureService.spec.ts`, `frontend/src/components/Settings/WhatsappStatusTenants.test.js`

**Interfaces:**
- Produces:
  - `Company.whatsappStatusEnabled: boolean` (coluna `BOOLEAN NOT NULL DEFAULT false`).
  - `isStatusEnabled(companyId: number): Promise<boolean>`
  - `setStatusEnabled(companyId: number, enabled: boolean): Promise<{ id: number; name: string; whatsappStatusEnabled: boolean }>` — 404 `ERR_COMPANY_NOT_FOUND`; ao desligar, chama `cancelPendingForCompany(companyId)` de `StatusPostService.ts`. Nesta task, crie `StatusPostService.ts` só com esse export como stub vazio; a Task 6 o implementa.
  - `listCompaniesWithStatusFlag({ searchParam?: string; pageNumber?: number }): Promise<{ companies: {id,name,whatsappMode,whatsappStatusEnabled}[]; hasMore: boolean }>` (20 por página, ordem por `name`).
  - Middleware `isWhatsappStatusEnabled` — 403 `ERR_STATUS_FEATURE_DISABLED` se `!isStatusEnabled(req.user.companyId)`.
  - Rotas: `GET /whatsapp-status/availability` (isAuth) → `{ enabled }`; `GET /whatsapp-status/admin/companies` e `PUT /whatsapp-status/admin/companies/:companyId` `{ enabled: boolean }` (isAuth + isSuper).
  - Socket: ao alterar, emitir `company-<id>-whatsapp-status-availability` `{ enabled }` para `company-<id>-mainchannel`.

- [ ] **Step 1: Testes que falham** (models mockados, padrão de `src/__tests__/services/PartnerCompanyWhatsAppMode.spec.ts`)

```ts
it("treats missing company or false flag as disabled", …)            // findByPk → null / {whatsappStatusEnabled:false} ⇒ false
it("enables a company and emits availability to its channel only", …) // update({whatsappStatusEnabled:true}); emit("company-7-whatsapp-status-availability",{enabled:true})
it("cancels pending posts when disabling", …)                         // cancelPendingForCompany chamado com 7
it("rejects unknown company with ERR_COMPANY_NOT_FOUND", …)
```

- [ ] **Step 2:** `cd backend && npx jest src/services/WhatsappStatusServices/__tests__/StatusFeatureService.spec.ts` → FAIL (módulo inexistente).
- [ ] **Step 3:** Migration (`addColumn` / `removeColumn`), campo no model com `@Default(false)`, serviço, middleware, controller e rotas acima.
- [ ] **Step 4:** Rodar o mesmo teste → PASS.
- [ ] **Step 5: Frontend — teste que falha** (`@testing-library/react`, `api` mockado como em `AgentAvailability.test.js`)

```js
it("lists companies with their status flag", …)        // GET /whatsapp-status/admin/companies ⇒ switch "Empresa A" marcado
it("toggles a company and shows the saved state", …)   // clique ⇒ PUT /whatsapp-status/admin/companies/3 {enabled:false}; switch desmarcado
it("reverts the switch and shows an error when saving fails", …)
it("shows the Cloud API note for meta companies", …)   // whatsappMode "meta" ⇒ texto i18n whatsappStatusTenants.metaNote
```

- [ ] **Step 6:** `cd frontend && CI=true npm test -- src/components/Settings/WhatsappStatusTenants.test.js` → FAIL.
- [ ] **Step 7:** `WhatsappStatusTenants.js`: busca por nome, lista paginada ("Carregar mais"), um `<Switch>` com `<label>` por empresa, nota "Conexões Cloud API só terão rascunho e download" para `whatsappMode === "meta"`. Na Central: item `{ chave: "statusWhatsapp", icone: CircleDot, aba: "whatsappStatus" }` no grupo `administracao`; `TabPanel name="whatsappStatus"` dentro do `OnlyForSuperUser`. Chaves `centralConfig.itens.statusWhatsapp.titulo/descricao` e `whatsappStatusTenants.*` em `pt.js`/`en.js`.
- [ ] **Step 8:** Teste → PASS; `npx prettier --write` nos arquivos; `cd backend && npx eslint --fix src/**/*.ts`.
- [ ] **Step 9: Commit** `feat(status): per-tenant WhatsApp status toggle for super admins`

---

### Task 3: Tabela `WhatsappStatusPosts`

**Files:**
- Create: `backend/src/database/migrations/20261019121000-create-whatsapp-status-posts.ts`
- Create: `backend/src/models/WhatsappStatusPost.ts`
- Modify: `backend/src/database/index.ts` (import + array de models, como `AgentTenantPolicy` nas linhas 72/81)
- Test: `backend/src/services/WhatsappStatusServices/__tests__/WhatsappStatusPostModel.spec.ts`

**Interfaces:**
- Produces: model `WhatsappStatusPost` com colunas

| coluna | tipo | notas |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `companyId` | FK Companies, NOT NULL, ON DELETE CASCADE | |
| `whatsappId` | FK Whatsapps, NOT NULL, ON DELETE CASCADE | |
| `createdByUserId` | FK Users, NULL, ON DELETE SET NULL | |
| `kind` | STRING(10) NOT NULL | `text\|image\|video` |
| `body` | TEXT NULL | texto ou legenda, ≤ 700 |
| `mediaPath` | STRING NULL | relativo a `privateFiles.directory` |
| `mediaMime` | STRING(50) NULL | |
| `backgroundColor` | STRING(9) NULL | `#RRGGBB` |
| `font` | INTEGER NULL | 0–5 |
| `audienceMode` | STRING(30) NOT NULL | `connection_contacts\|contact_list` |
| `contactListId` | FK ContactLists NULL, ON DELETE SET NULL | |
| `audienceCount` | INTEGER NULL | snapshot mostrado ao operador |
| `scheduledAt` | DATE NULL | |
| `state` | STRING(20) NOT NULL DEFAULT `draft` | |
| `remoteMessageId` | STRING NULL | |
| `attemptStartedAt` | DATE NULL | marca o início do envio ao socket |
| `publishedAt`, `expiresAt` | DATE NULL | `expiresAt = publishedAt + 24 h` |
| `failureCode` | STRING(60) NULL | `ERR_STATUS_*` |
| `idempotencyKey` | STRING(80) NOT NULL | |
| `createdAt`, `updatedAt` | DATE | |

Índices: único `(companyId, idempotencyKey)`; `(companyId, state)`; `(whatsappId, state)`; `(companyId, scheduledAt)`; `(companyId, expiresAt)`. Exporta também `type StatusPostState` e `type StatusKind`.

- [ ] **Step 1:** Teste que falha: `it("registers WhatsappStatusPost with the unique company/idempotency index")` — importa o model, confere `getAttributes()` contém as colunas acima e `options.indexes` contém `{ unique: true, fields: ["companyId","idempotencyKey"] }`.
- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Migration + model. **Step 4:** Rodar → PASS.
- [ ] **Step 5:** No Docker local: `docker compose -f docker-compose-local.yaml -f docker-compose.localruntime.yaml up -d --build backend` e conferir no log que as duas migrations rodaram; `\d "WhatsappStatusPosts"` no Postgres (:5433) mostra os índices.
- [ ] **Step 6: Commit** `feat(status): add WhatsappStatusPosts table`

---

### Task 4: Mídia (upload validado, isolado por empresa, limpeza)

**Files:**
- Create: `backend/src/services/WhatsappStatusServices/StatusMediaService.ts`
- Test: `backend/src/services/WhatsappStatusServices/__tests__/StatusMediaService.spec.ts`

**Interfaces:**
- Produces:
  - `sniffMime(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | null` — JPEG `FF D8 FF`; PNG `89 50 4E 47 0D 0A 1A 0A`; WEBP `RIFF....WEBP`; MP4 `ftyp` nos bytes 4–7.
  - `storeStatusMedia(companyId: number, kind: "image"|"video", tmpFilePath: string): Promise<{ mediaPath: string; mediaMime: string }>` — lê os primeiros 16 bytes, confere tipo×kind e tamanho (`WHATSAPP_STATUS_MAX_IMAGE_MB`/`_VIDEO_MB`), converte imagem para JPEG (`sharp(...).rotate().jpeg({ quality: 85 })`), grava em `whatsapp-status/<companyId>/<uuid>.<jpg|mp4>` e **sempre** apaga o temporário. Erros: `ERR_STATUS_MEDIA_INVALID` (400), `ERR_STATUS_MEDIA_TOO_LARGE` (413).
  - `resolveStatusMediaPath(companyId: number, mediaPath: string): string` — caminho absoluto; lança `ERR_STATUS_NOT_FOUND` (404) se não começar por `whatsapp-status/<companyId>/` ou sair de `privateFiles.directory` após `path.resolve`.
  - `removeStatusMedia(companyId, mediaPath): Promise<void>` (ignora ENOENT).
  - `cleanupOrphanStatusMedia(now = new Date()): Promise<number>` — apaga arquivos com mais de 24 h em `whatsapp-status/*/` cujo caminho não está em nenhum `WhatsappStatusPost.mediaPath`, e mídia de posts `published` com `expiresAt` há mais de 7 dias, `cancelled` ou `failed` há mais de 7 dias (zera `mediaPath`).
  - Upload no controller via `multer({ storage: diskStorage em os.tmpdir(), limits: { fileSize: max(_IMAGE_MB,_VIDEO_MB) } })`.

- [ ] **Step 1: Testes que falham** (`privateFiles` mockado para uma pasta em `os.tmpdir()`, como em `AgentDocuments.spec.ts:13`)

```ts
it("accepts a real PNG and stores it as JPEG under the company folder")   // mediaPath casa /^whatsapp-status\/7\/[0-9a-f-]+\.jpg$/, mediaMime "image/jpeg"
it("rejects a text file renamed to .jpg with ERR_STATUS_MEDIA_INVALID and deletes the temp file")
it("rejects a video sent as kind image")
it("rejects files above WHATSAPP_STATUS_MAX_IMAGE_MB with ERR_STATUS_MEDIA_TOO_LARGE")
it("refuses to resolve another company's media or a ../ path")          // resolveStatusMediaPath(8, "whatsapp-status/7/x.jpg") ⇒ ERR_STATUS_NOT_FOUND
it("removes orphan files older than 24h and keeps referenced ones")
```

- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** Rodar → PASS.
- [ ] **Step 5: Commit** `feat(status): validated per-company status media storage`

---

### Task 5: Audiência

**Files:**
- Create: `backend/src/services/WhatsappStatusServices/StatusAudienceService.ts`
- Test: `backend/src/services/WhatsappStatusServices/__tests__/StatusAudienceService.spec.ts`

**Interfaces:**
- Produces:
  - `type AudienceInput = { companyId: number; whatsappId: number; audienceMode: "connection_contacts" | "contact_list"; contactListId?: number | null }`
  - `resolveAudienceJids(input: AudienceInput): Promise<string[]>` —
    - `connection_contacts`: contatos da empresa, `isGroup=false`, com pelo menos um `Ticket` dessa `whatsappId` (`companyId` igual), número convertido com `getJidOf(contact)` (`services/WbotServices/getJidOf.ts`); contatos que lançam erro em `getJidOf` são ignorados.
    - `contact_list`: `ContactListItem` com `contactListId` **e** `companyId` iguais e `isWhatsappValid=true`, JID via `getJidOf(item.number)`; lista de outra empresa ⇒ `ERR_STATUS_NOT_FOUND`.
    - Remove duplicados; vazia ⇒ `ERR_STATUS_AUDIENCE_EMPTY` (400); acima de `WHATSAPP_STATUS_MAX_AUDIENCE` ⇒ `ERR_STATUS_AUDIENCE_TOO_LARGE` (400).
  - `previewAudience(input): Promise<{ count: number; sample: string[] }>` — `sample` = até 5 nomes (não números), para o operador ver antes de publicar.

- [ ] **Step 1: Testes que falham** (models mockados)

```ts
it("builds JIDs only from contacts that talked to this connection")      // where inclui companyId e whatsappId do Ticket
it("uses only WhatsApp-valid items of a contact list of the same company")
it("throws ERR_STATUS_AUDIENCE_EMPTY instead of treating empty as everyone")
it("throws ERR_STATUS_NOT_FOUND for another company's contact list")
it("deduplicates JIDs and caps at WHATSAPP_STATUS_MAX_AUDIENCE")
it("previews count and up to five names")
```

- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(status): resolve status audience from connection contacts or a contact list`

---

### Task 6: Adapters e serviço de posts

**Files:**
- Create: `backend/src/services/WhatsappStatusServices/providers/types.ts`, `BaileysStatusProvider.ts`, `OfficialStatusProvider.ts`, `index.ts`
- Create: `backend/src/services/WhatsappStatusServices/StatusPostService.ts`, `StatusSocket.ts`
- Modify: `backend/src/services/WbotServices/wbotMessageListener.ts:1060` (só `export` em `isValidMsg`)
- Test: `__tests__/BaileysStatusProvider.spec.ts`, `__tests__/StatusPostService.spec.ts`, `src/__tests__/services/StatusBroadcastIgnored.spec.ts`

**Interfaces:**
- Consumes: Tasks 2–5. Crie também `backend/src/queues/whatsappStatus.ts` só com a fila e `enqueueStatusPost`/`removeStatusJob` (assinaturas na Task 7); a Task 7 acrescenta o processamento. Nos testes desta task o módulo é mockado.
- Produces (`providers/types.ts`):

```ts
export type StatusCapabilities = {
  publishStatus: boolean;
  kinds: StatusKind[];               // tipos publicáveis
  reason: null | "OFFICIAL_API" | "LIB_NOT_VERIFIED" | "DISCONNECTED";
  manualExport: boolean;             // true no modo official
  ownPostsSync: false;               // getOwnPosts não implementado (spec: só após prova)
};
export class StatusPublishError extends Error {
  constructor(public code: string, public permanent: boolean) { super(code); }
}
export interface StatusProvider {
  capabilities(connection: Whatsapp): StatusCapabilities;
  publish(post: WhatsappStatusPost, connection: Whatsapp, audience: string[]): Promise<{ remoteMessageId: string }>;
}
```

- `providers/index.ts`: `getStatusProvider(connection: Whatsapp): StatusProvider` (`apiMode === "official"` ⇒ Official, senão Baileys).
- `BaileysStatusProvider`: `export const VERIFIED_LIBZAPITU_VERSIONS: string[]` e `UNVERIFIED_KINDS: StatusKind[]` (valores da Task 1); versão lida uma vez de `require("libzapitu-rf/package.json").version`. `publish` usa `getWbot(connection.id)` e chama `sendMessage("status@broadcast", content, { broadcast: true, statusJidList: [jidNormalizedUser(wbot.user.id), ...audience], backgroundColor?, font? })`; mídia por `{ image: { url: absPath } }`/`{ video: { url: absPath } }` com `caption`. Sem `key.id` no retorno ⇒ `StatusPublishError("ERR_STATUS_NO_CONFIRMATION", true)`. `ERR_WAPP_NOT_INITIALIZED` ⇒ `StatusPublishError("ERR_STATUS_CONNECTION_UNAVAILABLE", false)`.
- `OfficialStatusProvider`: `capabilities` ⇒ `{ publishStatus:false, kinds:[], reason:"OFFICIAL_API", manualExport:true, ownPostsSync:false }`; `publish` lança `StatusPublishError("ERR_STATUS_UNSUPPORTED", true)` sem tocar em rede.
- `StatusSocket.emitStatusPost(companyId, action: "create"|"update"|"delete", post)` — `getIO().to(\`company-${companyId}-mainchannel\`).emit(\`company-${companyId}-whatsapp-status-post\`, { action, post: serialize(post) })`. `serialize` nunca inclui `mediaPath` absoluto nem JIDs.
- `StatusPostService`:
  - `listPosts(companyId, { whatsappId?, active?: boolean }): Promise<WhatsappStatusPost[]>` — `active` = `published` com `expiresAt > now` **ou** `queued/publishing/failed/unsupported` criados nas últimas 24 h; ordem `createdAt` asc.
  - `getCapabilities(companyId, whatsappId): Promise<StatusCapabilities>` — conexão precisa ser da empresa (404).
  - `createPost(companyId, userId, input: { whatsappId; kind; body?; backgroundColor?; font?; audienceMode; contactListId?; idempotencyKey; media?: { mediaPath; mediaMime } }): Promise<WhatsappStatusPost>` — valida conexão da empresa, `body` ≤ 700 e obrigatório em `text`, mídia obrigatória em `image|video`, cor `^#[0-9A-F]{6}$`i; mesmo `(companyId,idempotencyKey)` devolve o post existente sem criar outro; grava `audienceCount` via `previewAudience`; estado `draft`; emite `create`.
  - `updatePost(companyId, id, patch)` — só em `draft`/`failed`/`unsupported`; volta para `draft`.
  - `publishPost(companyId, id, { scheduledAt?: Date | null }): Promise<WhatsappStatusPost>` — `scheduledAt` no passado ou > 30 dias ⇒ `ERR_STATUS_SCHEDULE_INVALID`; se `capabilities.publishStatus` falso ou `kind` fora de `kinds` ⇒ estado `unsupported` com `failureCode` = `ERR_STATUS_<reason>` e retorna (sem fila); senão estado `queued` e `enqueueStatusPost(post)` (Task 7).
  - `cancelPost(companyId, id)` — de `draft|queued` (ainda não iniciado) para `cancelled`, remove job (`removeStatusJob(id)`), apaga mídia; em `publishing`/`published` ⇒ `ERR_STATUS_INVALID_STATE` (409).
  - `cancelPendingForCompany(companyId)` — todos os `queued` da empresa ⇒ `cancelled` com `failureCode="ERR_STATUS_FEATURE_DISABLED"` (substitui o stub da Task 2).
  - Toda busca por `id` usa `where: { id, companyId }`; ausência ⇒ `ERR_STATUS_NOT_FOUND` (404).

- [ ] **Step 1: Testes que falham — provider**

```ts
it("reports LIB_NOT_VERIFIED when the installed version is not in VERIFIED_LIBZAPITU_VERSIONS")
it("reports DISCONNECTED for a baileys connection that is not CONNECTED")
it("reports OFFICIAL_API with manualExport for official connections and never calls getWbot")
it("sends to status@broadcast with broadcast, own JID first in statusJidList, and text styling in the third argument")
it("maps a send without key.id to ERR_STATUS_NO_CONFIRMATION (permanent)")
it("maps ERR_WAPP_NOT_INITIALIZED to ERR_STATUS_CONNECTION_UNAVAILABLE (transient)")
```

- [ ] **Step 2: Testes que falham — serviço** (`it("…")` com os nomes: `"returns the existing post for a repeated idempotency key"`, `"rejects a connection of another company with ERR_STATUS_NOT_FOUND"`, `"rejects text over 700 characters"`, `"marks the post unsupported on official connections without enqueuing"`, `"queues with delay when scheduledAt is in the future"`, `"rejects scheduledAt in the past"`, `"cancels a queued post and removes its job and media"`, `"refuses to cancel a post that is publishing"`, `"cancels all queued posts of a company when the feature is disabled"`).
- [ ] **Step 3: Teste de regressão do filtro:** `it("ignores status@broadcast messages so they never create tickets")` — `isValidMsg({ key: { remoteJid: "status@broadcast" }, message: { conversation: "x" } })` ⇒ `false`.
- [ ] **Step 4:** Rodar os três arquivos → FAIL. **Step 5:** Implementar. **Step 6:** PASS + `npx eslint --fix src/**/*.ts`.
- [ ] **Step 7: Commit** `feat(status): status providers and post service with capability checks`

---

### Task 7: Worker Bull (publicação, agenda, retry seguro)

**Files:**
- Create: `backend/src/queues/whatsappStatus.ts`
- Modify: `backend/src/queues.ts` (chamar `startWhatsappStatusQueue()` junto de `startProspeccaoQueue()`, ~linha 898)
- Test: `backend/src/services/WhatsappStatusServices/__tests__/WhatsappStatusQueue.spec.ts`

**Interfaces:**
- Consumes: `getStatusProvider`, `resolveAudienceJids`, `resolveStatusMediaPath`, `isStatusEnabled`, `emitStatusPost`, `cleanupOrphanStatusMedia`.
- Produces:
  - `enqueueStatusPost(post: WhatsappStatusPost): Promise<void>` — `queue.add("Publish", { postId }, { jobId: \`status-post-${post.id}\`, delay: max(0, scheduledAt - now), attempts: 3, backoff: { type: "exponential", delay: 30000 }, removeOnComplete: true })`. O `jobId` fixo faz o Bull ignorar duplicatas.
  - `removeStatusJob(postId: number): Promise<void>`
  - `handlePublishStatus(job: Job<{ postId: number }>): Promise<void>` (exportado para teste)
  - `startWhatsappStatusQueue(): Promise<void>` — `queue.process("Publish", 4, handlePublishStatus)`; job repetível `"Cleanup"` diário às 04:00 chamando `cleanupOrphanStatusMedia`; na partida, reenfileira posts `queued` sem job (com `runtimeCompanyWhere()` para runtimes dedicados).
  - Fila: `new Queue("WhatsappStatusPublish", process.env.REDIS_URI || "", runtimeQueueOptions())`.

Ordem dentro de `handlePublishStatus` (algoritmo que os testes não determinam sozinhos):

```
post = findByPk(postId); sai se ausente ou state ∉ {queued, publishing}
se state == publishing && attemptStartedAt != null:
    failed, ERR_STATUS_OUTCOME_UNKNOWN; emite; return          // nunca reenviar sem saber se saiu
se !isStatusEnabled(post.companyId): cancelled, ERR_STATUS_FEATURE_DISABLED; return
connection = Whatsapp.findOne({ where: { id: post.whatsappId, companyId: post.companyId } })
se ausente: failed, ERR_STATUS_CONNECTION_MISMATCH; return
caps = provider.capabilities(connection)
se reason == DISCONNECTED: lança StatusPublishError(ERR_STATUS_CONNECTION_UNAVAILABLE, false)   // retry do Bull
se !caps.publishStatus || kind ∉ caps.kinds: unsupported; return
audience = resolveAudienceJids(...)                             // erro ⇒ failed com o código
mutex(whatsappId).runExclusive:                                 // serializa por conexão (async-mutex)
    update(state=publishing, attemptStartedAt=now); emite
    { remoteMessageId } = provider.publish(post, connection, audience)
    update(state=published, remoteMessageId, publishedAt=now, expiresAt=now+24h, failureCode=null); emite
erro StatusPublishError permanente, ou última tentativa: failed + code; emite; não relança
erro transitório antes de attemptStartedAt: volta state=queued e relança (Bull tenta de novo)
```

Erro lançado **depois** de `attemptStartedAt` (dentro de `publish`) que não seja `StatusPublishError` transitório de sessão indisponível ⇒ `failed` com `ERR_STATUS_OUTCOME_UNKNOWN`, sem retry.

- [ ] **Step 1: Testes que falham** (Bull, provider e models mockados; `new Date` controlado com `jest.useFakeTimers().setSystemTime`)

```ts
it("publishes a queued post and stores remoteMessageId, publishedAt and expiresAt = +24h")
it("never resends a post that was already handed to the session (ERR_STATUS_OUTCOME_UNKNOWN)")
it("cancels when the company feature was disabled after scheduling")
it("fails with ERR_STATUS_CONNECTION_MISMATCH when the connection now belongs to another company")
it("rethrows while disconnected so Bull retries, then fails on the last attempt")
it("marks unsupported when the connection became official")
it("serializes two posts of the same connection")                // segundo publish só começa após o primeiro resolver
it("uses jobId status-post-<id> and delay from scheduledAt")
it("requeues queued posts without a job on startup")
```

- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat(status): Bull worker with per-connection serialization and safe retries`

---

### Task 8: API REST

**Files:**
- Create: `backend/src/controllers/WhatsappStatusController.ts`
- Modify: `backend/src/routes/whatsappStatusRoutes.ts`
- Test: `backend/src/__tests__/controllers/WhatsappStatusRoutes.spec.ts` (supertest num `express()` com `isAuth` mockado, como `src/__tests__/services/MobileAuthRoutes.spec.ts`)

**Interfaces:**
- Consumes: `StatusPostService`, `StatusMediaService`, `StatusAudienceService`.
- Produces (todas com `isAuth` + `isWhatsappStatusEnabled`; `companyId` sempre de `req.user`):

| Método e rota | Corpo / query | Resposta |
| --- | --- | --- |
| `GET /whatsapp-status/connections` | — | `[{ id, name, number, apiMode, status, capabilities }]` só da empresa |
| `GET /whatsapp-status/connections/:whatsappId/capabilities` | — | `StatusCapabilities` |
| `GET /whatsapp-status/audience-preview` | `whatsappId, audienceMode, contactListId?` | `{ count, sample }` |
| `GET /whatsapp-status/posts` | `whatsappId?, active?` | posts serializados |
| `POST /whatsapp-status/posts` | multipart: campos de `createPost` + `media?` | 201 post |
| `PUT /whatsapp-status/posts/:id` | idem | post |
| `POST /whatsapp-status/posts/:id/publish` | `{ scheduledAt?: ISO }` | post |
| `POST /whatsapp-status/posts/:id/cancel` | — | post |
| `GET /whatsapp-status/posts/:id/media` | — | stream do arquivo (`Content-Type` = `mediaMime`, `Content-Disposition: attachment` quando `?download=1`) |

`idempotencyKey` vem do header `Idempotency-Key` (obrigatório em `POST /posts`, 400 `ERR_STATUS_IDEMPOTENCY_REQUIRED`).

- [ ] **Step 1: Testes que falham**

```ts
it("returns 403 ERR_STATUS_FEATURE_DISABLED for a tenant that is switched off")
it("returns 404 for a post id of another company on publish, cancel and media")
it("requires Idempotency-Key on create")
it("streams media only for the owner company with its mime type")
it("lists only connections of the user's company with capabilities")
```

- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** PASS; `npx eslint --fix src/**/*.ts`; `npm run build` sem erros.
- [ ] **Step 5: Commit** `feat(status): authenticated status API`

---

### Task 9: Frontend — faixa "Meus stories" e visualizador

Implementa as partes do design sem redesenhar: faixa acima das abas de atendimento com avatar e anel segmentado por conexão (azul `#024BF4` não visto, cinza `#C4C4CC` visto; segmentos separados quando há mais de um story), botão "Novo story", visualizador com navegação anterior/próximo entre stories e conexões, painel "Detalhes do story" e toast "Story publicado no WhatsApp da conexão X".

**Files:**
- Create: `frontend/src/components/WhatsappStatus/useWhatsappStatus.js`, `storyState.js`, `StoriesStrip.js`, `StoryViewer.js`
- Modify: `frontend/src/components/TicketsManagerTabs/index.js` (render da faixa acima do primeiro `<Paper>`, ~linha 306)
- Modify: `frontend/src/translate/languages/{pt,en}.js`
- Test: `frontend/src/components/WhatsappStatus/StoriesStrip.test.js`, `storyState.test.js`

**Interfaces:**
- Consumes: rotas da Task 8; `GET /whatsapp-status/availability`; eventos `company-<id>-whatsapp-status-post` e `company-<id>-whatsapp-status-availability` (padrão de socket de `TicketsManagerTabs/index.js:225-248`).
- Produces:
  - `useWhatsappStatus(companyId)` → `{ enabled, connections, postsByConnection, reload }`. `enabled` começa `false` e só vira `true` após `availability` confirmar (como `AgentAvailability.js`). Posts vêm de `GET /posts?active=true`.
  - `storyStateLabel(post, now)` → chave i18n: `whatsappStatus.state.scheduled|sending|sent|failed|unsupported|draft|cancelled` (regra da seção Global Constraints).
  - "Visto" é local por usuário (`localStorage` `ew-status-seen-<userId>` com IDs vistos, com try/catch), só para a cor do anel.
  - `StoryViewer` props `{ connections, postsByConnection, start: { connIndex, postIndex }, onClose, onNew }`; imagem/vídeo carregados por `api.get(…/media, { responseType: "blob" })` + `URL.createObjectURL`, revogado ao fechar. Painel mostra conexão, publicado (`publishedAt` ou "—"), expira em (`expiresAt` relativo), publicado por, quem pode ver (`audienceMode` + `audienceCount`), **estado** (`storyStateLabel`) e, se `failed`, a mensagem do `failureCode`. "Excluir este story" aparece só para `draft|queued` e chama `cancel`; para `published` o botão não aparece (remover do WhatsApp não foi provado na Task 1).

- [ ] **Step 1: Testes que falham**

```js
it("renders nothing until availability confirms the tenant is enabled")
it("shows one ring per connection with one segment per active story")
it("labels a future queued post as scheduled and a published one as sent")
it("opens the viewer on the clicked connection and shows the state in details")
it("hides delete for published stories")
it("never shows view counts")                     // nenhum texto casando /visualiza(ç|c)(ões|oes)\s*\d/
```

- [ ] **Step 2:** `cd frontend && CI=true npm test -- src/components/WhatsappStatus` → FAIL. **Step 3:** Implementar seguindo cores, textos e espaçamentos da prancheta. **Step 4:** PASS; `npx prettier --write src/components/WhatsappStatus src/components/TicketsManagerTabs/index.js src/translate/languages/pt.js src/translate/languages/en.js`.
- [ ] **Step 5: Commit** `feat(status): stories strip and viewer in the tickets screen`

---

### Task 10: Frontend — modal "Novo story" (rascunho, audiência, publicar ou agendar)

**Files:**
- Create: `frontend/src/components/WhatsappStatus/NewStoryModal.js`
- Modify: `StoriesStrip.js`, `translate/languages/{pt,en}.js`
- Test: `frontend/src/components/WhatsappStatus/NewStoryModal.test.js`

**Interfaces:**
- Consumes: `GET /connections`, `GET /audience-preview`, `GET /contact-lists` (rota existente), `POST /posts`, `POST /posts/:id/publish`, `GET /posts/:id/media?download=1`.
- Produces: modal do design — Conexão; Tipo (Texto/Imagem/Vídeo); Texto com contador "N / 700 caracteres" e as 6 cores (Azul `#024BF4`, Verde `#15803D`, Roxo `#6D28D9`, Laranja `#C2410C`, Rosa `#BE185D`, Grafite `#27272A`); área "Arraste … aqui" com "Selecionar arquivo" e dica ("Formato MP4. Vídeos curtos funcionam melhor." / "Formatos JPG ou PNG…"); Legenda (opcional); "Quem pode ver" (Todos os contatos da conexão / Uma lista de contatos + seletor de lista); pré-visualização; aviso de visualizações; "Cancelar"/"Publicar story".

Acréscimos mínimos exigidos pela spec, no mesmo estilo visual do modal (não existem na prancheta):
  - Linha de audiência abaixo de "Quem pode ver": "Será visto por N contatos (Ana, João, …)" a partir de `audience-preview`; erro `ERR_STATUS_AUDIENCE_EMPTY` desabilita publicar.
  - Campo "Quando" com duas opções: "Agora" (padrão) e "Agendar" + `<input type="datetime-local">`; com agendamento o botão vira "Agendar story".
  - Conexão sem `publishStatus`: botão publicar desabilitado com o motivo (`OFFICIAL_API` ⇒ "Esta conexão usa a API oficial da Meta, que não publica Status. Salve o rascunho e baixe o arquivo para publicar pelo aplicativo."; `LIB_NOT_VERIFIED` ⇒ "Publicação de Status ainda não liberada para esta conexão."; `DISCONNECTED` ⇒ "Conexão desconectada."). Botões "Salvar rascunho" e, com mídia e `manualExport`, "Baixar arquivo".
  - Um `Idempotency-Key` (`crypto.randomUUID()`) gerado quando o modal abre e reutilizado em reenvios do mesmo formulário.

- [ ] **Step 1: Testes que falham**

```js
it("counts characters up to 700 and blocks publishing above it")
it("shows the audience count before publishing and blocks an empty audience")
it("sends the same Idempotency-Key when the user clicks publish twice")
it("disables publish with the Cloud API reason and offers draft and download")
it("schedules with the chosen date and labels the button Agendar story")
it("shows the success toast with the connection name after publishing")
```

- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** PASS; prettier.
- [ ] **Step 5: Commit** `feat(status): new story modal with audience, scheduling and honest capability`

---

### Task 11: Validação local de ponta a ponta (com o Guilherme)

**Files:**
- Create: `docs/whatsapp-status-local-test.md` (checklist preenchido com resultado)

- [ ] **Step 1:** `cd backend && npm run lint && npm run build && npx jest src/services/WhatsappStatusServices src/__tests__/controllers/WhatsappStatusRoutes.spec.ts src/__tests__/services/StatusBroadcastIgnored.spec.ts` → tudo verde. `cd frontend && CI=true npm test -- src/components/WhatsappStatus src/components/Settings/WhatsappStatusTenants.test.js && npm run build` → verde.
- [ ] **Step 2:** Subir o Docker local (comando das Global Constraints) e entrar como `admin@ticketz.host` / `123456`.
- [ ] **Step 3:** Criar duas empresas de teste (A e B). Na Central de Configurações › Administração › Status do WhatsApp, ligar só A. Conferir: B não vê a faixa e `GET /whatsapp-status/posts` com usuário de B dá 403.
- [ ] **Step 4:** Em A, conectar por QR o **aparelho de teste** (nunca número de cliente). Publicar texto, imagem e vídeo para uma lista de contatos com só o destinatário de teste. Conferir no aparelho e no destinatário; anotar o estado mostrado na UI.
- [ ] **Step 5:** Agendar um texto para +3 min e conferir que sai no horário; agendar outro e desligar A na Central antes do horário ⇒ estado cancelado, nada publicado.
- [ ] **Step 6:** Derrubar a conexão (desconectar no aparelho) com um post agendado ⇒ após as tentativas, "Falhou" com motivo de conexão. Reconectar e publicar de novo pelo mesmo rascunho.
- [ ] **Step 7:** Mudar a empresa B para `whatsappMode="meta"`, ligar a função, criar conexão oficial: modal mostra o motivo da Cloud API, salva rascunho e baixa a mídia; nenhuma chamada à Graph API aparece no log.
- [ ] **Step 8:** Pelo destinatário de teste, publicar um Status no aparelho dele e mandar mensagem normal: só a mensagem vira ticket.
- [ ] **Step 9:** Registrar resultados em `docs/whatsapp-status-local-test.md` e commitar `docs(status): local end-to-end validation results`.

**Aceite (spec):** Status de teste aparece no aparelho no modo QR, ligado só à empresa e conexão certas; Cloud API mostra a indisponibilidade; nenhum caminho usa mensagem privada no lugar do Status.

---

## Fora deste plano (decisões registradas)

- Importar Status publicados pelo telefone (`getOwnPosts`): `ownPostsSync=false` até uma prova própria; não usar `fetchStatus(jid)`.
- Excluir um Status já publicado do WhatsApp: não provado; o botão só cancela rascunho/agendado.
- Idiomas além de `pt` e `en`: caem no fallback `en`.
- Deploy em produção: só depois da Task 11 e de revisão do diff.
