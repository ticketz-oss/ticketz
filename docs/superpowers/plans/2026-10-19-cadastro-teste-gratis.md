# Cadastro pelo site com 7 dias grátis — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o visitante da landing (`espacowhats.com.br`) conseguir criar o próprio tenant em `/assinar` e usar 7 dias grátis, sem cartão.

**Architecture:** O fluxo já existe e funciona ponta a ponta quando o cadastro está liberado (testado em 2026-10-19 num backend local: `POST /companies/cadastro` cria empresa, admin e marca; login com `slug` funciona; `/tickets` responde 200 durante o teste). O que impede a conversão em produção é a liberação do cadastro: a página lê `allowSignup` da empresa master definida por `MASTER_COMPANY_ID`, variável que o `docker-compose.dokploy.yml` não passa ao backend, então a resposta é `null` e todo visitante vê "Cadastro pelo site fechado no momento". O backend, por sua vez, lê `allowSignup` da empresa 1 fixa e devolve 404 quando a linha não existe. O plano unifica as duas leituras, passa a variável no deploy, muda o teste para 7 dias e fecha dois buracos de validação no formulário.

**Tech Stack:** Backend Node/Express/TypeScript, Sequelize, Jest (`ts-jest`). Frontend React 17 em JavaScript, CRA 5, Jest do `react-scripts`.

**Spec:** Pedido do Guilherme no projeto (2026-10-19): "a ideia é o tenant ser criado lá dentro facilmente, dando 7 dias de teste grátis para o usuário". Documento atual do fluxo: `backend/docs/self-service-onboarding.md`.

## Evidências coletadas (2026-10-19)

- `GET https://espacowhats.com.br/backend/public-settings/allowSignup` → `null`. `appName` e `primaryColorLight` na raiz também → `null`; no subdomínio `teste.espacowhats.com.br` o `appName` volta preenchido. Conclusão: a raiz não resolve empresa master, o que bate com `GetPublicSettingService.getMasterCompanyId()` sem `MASTER_COMPANY_ID`.
- `docker-compose.dokploy.yml`, serviço `backend`, bloco `environment`: não há `MASTER_COMPANY_ID`.
- `CompanyController.signup` usa `CheckSettings("allowSignup")`, que lê `companyId: 1` e lança `ERR_NO_SETTING_FOUND` (404) se a linha não existe. Banco novo não tem essa linha (nenhum seed cria). Reproduzido localmente: 404 antes de inserir a linha, 201 depois.
- `/plans/listpublic` em produção devolve 3 planos públicos (ids 1, 2, 4). Subdomínio curinga responde. Esses pontos não bloqueiam.

## Global Constraints

- Teste grátis do cadastro pelo site: **7 dias**, sem cartão, nenhuma fatura durante o teste.
- Empresas já criadas mantêm o `trialDays` que têm hoje; a mudança vale só para cadastros novos.
- Teste de parceiro (`PartnerCompanyService`, 3 dias) não muda.
- Textos de interface usam o i18n do frontend (`i18n.t`); códigos de erro da API continuam como chave (`ERR_...`).
- Backend: depois de editar, `npx eslint --fix` nos arquivos alterados. Frontend: `npx prettier --write` nos arquivos alterados.
- Commits e PR em inglês, seguindo o padrão do repositório (`fix(...)`, `feat(...)`).

## Review Focus

1. `MASTER_COMPANY_ID` ausente: landing e backend precisam concordar que o cadastro está fechado, e o backend responde 403 com `ERR_SIGNUP_DISABLED`, nunca 404/500. (Task 1)
2. Linha `allowSignup` inexistente na empresa master: tratada como `disabled`, não como erro. (Task 1)
3. Nome de empresa que vira slug reservado (ex.: "App", "Admin", "Public"): o formulário mostra o erro no campo endereço antes de enviar, em vez da mensagem genérica no último passo. (Task 3)
4. Cadastro perto da meia-noite UTC: `trialExpiresAt` fica exatamente 7×24h depois de `trialStartedAt`, e o resumo do checkout mostra a mesma data que o backend grava. (Task 2)
5. `MASTER_COMPANY_ID` com valor inválido (`"abc"`, `"0"`): mesmo comportamento do item 1. (Task 1)

---

### Task 1: Uma única regra de "cadastro liberado" no backend

**Files:**
- Create: `backend/src/helpers/masterCompany.ts`
- Create: `backend/src/services/CompanyService/SignupGateService.ts`
- Modify: `backend/src/services/SettingServices/GetPublicSettingService.ts` (remover o `getMasterCompanyId` local e importar o do helper)
- Modify: `backend/src/controllers/CompanyController.ts:155-157` (função `signup`)
- Test: `backend/src/__tests__/services/SignupGateService.spec.ts`

**Interfaces:**
- Produces: `getMasterCompanyId(): number | null` em `helpers/masterCompany.ts`. Mesma regra que existe hoje no `GetPublicSettingService`: inteiro positivo de `process.env.MASTER_COMPANY_ID`, senão `null`.
- Produces: `isSignupAllowed(): Promise<boolean>` (export default) em `SignupGateService.ts`. `false` se não há master; senão `Setting.findOne({ where: { companyId: master, key: "allowSignup" } })` e `true` só para o valor `"enabled"`.

- [ ] **Step 1: Escrever o teste que falha**

Em `SignupGateService.spec.ts`, mockar `../../models/Setting` como no `GetPublicLoginBranding.spec.ts` (`findOne: jest.fn()`), salvar e restaurar `process.env.MASTER_COMPANY_ID`.

```ts
it("is closed when MASTER_COMPANY_ID is missing", async () => {
  delete process.env.MASTER_COMPANY_ID;
  await expect(isSignupAllowed()).resolves.toBe(false);
  expect(Setting.findOne).not.toHaveBeenCalled();
});
it.each(["abc", "0", "-3"])("is closed for invalid MASTER_COMPANY_ID %s", async raw => {
  process.env.MASTER_COMPANY_ID = raw;
  await expect(isSignupAllowed()).resolves.toBe(false);
});
it("is closed when the master has no allowSignup row", async () => {
  process.env.MASTER_COMPANY_ID = "1";
  (Setting.findOne as jest.Mock).mockResolvedValue(null);
  await expect(isSignupAllowed()).resolves.toBe(false);
});
it("reads allowSignup from the configured master company", async () => {
  process.env.MASTER_COMPANY_ID = "7";
  (Setting.findOne as jest.Mock).mockResolvedValue({ value: "enabled" });
  await expect(isSignupAllowed()).resolves.toBe(true);
  expect(Setting.findOne).toHaveBeenCalledWith({
    where: { companyId: 7, key: "allowSignup" }
  });
});
it("is closed when allowSignup is disabled", async () => {
  process.env.MASTER_COMPANY_ID = "1";
  (Setting.findOne as jest.Mock).mockResolvedValue({ value: "disabled" });
  await expect(isSignupAllowed()).resolves.toBe(false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npx jest src/__tests__/services/SignupGateService.spec.ts`
Expected: FAIL, módulo `SignupGateService` não encontrado.

- [ ] **Step 3: Implementar `getMasterCompanyId` e `isSignupAllowed`**

Mover o `getMasterCompanyId` de `GetPublicSettingService.ts` para `helpers/masterCompany.ts` (com o comentário que explica por que não há padrão), importar de volta no serviço. Criar `SignupGateService.ts` conforme Interfaces.

- [ ] **Step 4: Trocar a checagem no controller**

Em `CompanyController.signup`, substituir o `CheckSettings("allowSignup")` por:

```ts
if (!(await isSignupAllowed())) {
  throw new AppError("ERR_SIGNUP_DISABLED", 403);
}
```

Remover o import de `CheckSettings` se ficar sem uso.

- [ ] **Step 5: Rodar os testes do backend afetados**

Run: `cd backend && npx jest src/__tests__/services/SignupGateService.spec.ts src/__tests__/services/GetPublicLoginBranding.spec.ts src/services/CompanyService`
Expected: PASS em todas as suítes.

- [ ] **Step 6: Lint e commit**

```bash
cd backend && npx eslint --fix src/helpers/masterCompany.ts src/services/CompanyService/SignupGateService.ts src/services/SettingServices/GetPublicSettingService.ts src/controllers/CompanyController.ts src/__tests__/services/SignupGateService.spec.ts
git add -A backend/src
git commit -m "fix(signup): read allowSignup from the same master company as the landing page"
```

### Task 2: Teste grátis de 7 dias

**Files:**
- Modify: `backend/src/services/CompanyService/CreateSelfServiceCompanyService.ts:14` e `:27`
- Modify: `backend/src/services/CompanyService/__tests__/CreateSelfServiceCompanyService.spec.ts:56-72`
- Modify: `frontend/src/pages/Checkout/setup.js:1`
- Modify: `frontend/src/pages/Checkout/Summary.test.js:51-54`
- Modify: `frontend/src/translate/languages/pt.js:1292, 1362, 1428`
- Modify: `frontend/src/translate/languages/landingMotion.js:185, 187, 244`
- Modify: `backend/docs/self-service-onboarding.md` (tabela: `trialDays = 7`, "exatamente 7 dias depois")

**Interfaces:**
- Produces: `SELF_SERVICE_TRIAL_DAYS = 7` (backend) e `TRIAL_DAYS = 7` (frontend `setup.js`). Os dois valores precisam ser iguais.

- [ ] **Step 1: Ajustar os testes para 7 dias**

No spec do backend: renomear para `"forces self-service and 7 days, ignoring privileged client fields"` e esperar `trialDays: 7`. Acrescentar um teste para o `dueDay` padrão:

```ts
it("defaults dueDay to the day the 7-day trial ends", () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-28T23:59:00Z"));
  expect(normalizeSignupData({ ...valid, dueDay: undefined }).dueDay).toBe(4);
  jest.useRealTimers();
});
```

No `Summary.test.js`, caso `"charges the first invoice on the last trial day..."` (relógio em `2026-10-08T18:00Z`, dia de vencimento 5, plano de R$ 1.000), os valores com 7 dias, conferidos rodando `trialEndPreview`, `firstBillingPreview` e `prorataCents` com `TRIAL_DAYS = 7`:

```js
// 2026-10-08 + 7 days = 15/10; prorated up to the due day 05/11.
expect(html).toContain('<time dateTime="2026-10-15">15/10/2026</time>');
expect(html).toContain("Proporcional a 21 dias de uso");
expect(html).toContain("R$ 681,72");
```

Acrescentar em `setup.test.js`:

```js
it("ends the trial 7 days after signup", () => {
  expect(trialEndPreview(new Date("2026-10-28T23:59:00Z")).toISOString())
    .toBe("2026-11-04T00:00:00.000Z");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npx jest src/services/CompanyService/__tests__/CreateSelfServiceCompanyService.spec.ts`
Run: `cd frontend && CI=true npx react-scripts test src/pages/Checkout --watchAll=false`
Expected: FAIL nos casos de 7 dias.

- [ ] **Step 3: Trocar as constantes e o padrão do `dueDay`**

`SELF_SERVICE_TRIAL_DAYS = 7`; em `normalizeSignupData`, `add(SELF_SERVICE_TRIAL_DAYS, "days")` no lugar do `14` literal. `TRIAL_DAYS = 7` em `setup.js`.

- [ ] **Step 4: Trocar os textos**

Substituir "14 dias" por "7 dias" nas seis linhas listadas em Files, sem mudar o resto da frase. Atualizar `backend/docs/self-service-onboarding.md`.

- [ ] **Step 5: Rodar os testes de novo**

Mesmos comandos do Step 2. Expected: PASS. Confirmar com `grep -rn "14 dias" frontend/src/translate` que não sobrou nenhum texto de teste com 14.

- [ ] **Step 6: Formatar e commit**

```bash
cd backend && npx eslint --fix src/services/CompanyService/CreateSelfServiceCompanyService.ts src/services/CompanyService/__tests__/CreateSelfServiceCompanyService.spec.ts
cd ../frontend && npx prettier --write src/pages/Checkout/setup.js src/pages/Checkout/setup.test.js src/pages/Checkout/Summary.test.js src/translate/languages/pt.js src/translate/languages/landingMotion.js
cd .. && git add -A backend frontend
git commit -m "feat(signup): shorten the self-service free trial to 7 days"
```

### Task 3: Erros do formulário de cadastro que o visitante entende

**Files:**
- Modify: `frontend/src/pages/Checkout/setup.js` (novo export)
- Modify: `frontend/src/pages/Checkout/index.js:842-862` (`validate` e `errorMessage`)
- Modify: `frontend/src/translate/languages/pt.js` (bloco `landing.checkout.errors`, perto da linha 1414)
- Test: `frontend/src/pages/Checkout/setup.test.js`

**Interfaces:**
- Consumes: código `ERR_SIGNUP_DISABLED` (Task 1).
- Produces: `isReservedSlug(slug: string): boolean` em `setup.js`, com a mesma lista do backend `helpers/normalizeSlug.ts`: `www, api, app, admin, backend, frontend, static, assets, public`.

- [ ] **Step 1: Escrever o teste que falha**

```js
it.each(["app", "admin", "public", "www"])("flags %s as reserved", slug => {
  expect(isReservedSlug(slug)).toBe(true);
});
it("accepts a normal company address", () => {
  expect(isReservedSlug("loja-da-ana")).toBe(false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd frontend && CI=true npx react-scripts test src/pages/Checkout/setup.test.js --watchAll=false`
Expected: FAIL, `isReservedSlug is not a function`.

- [ ] **Step 3: Implementar e usar no formulário**

Exportar `isReservedSlug` de `setup.js`. Em `validate`, quando o formato do slug estiver certo mas `isReservedSlug(form.slug)`, colocar `errors.slug = t("errors.ERR_COMPANY_SLUG_RESERVED")`. Isso faz o erro aparecer no passo de dados, junto do campo.

- [ ] **Step 4: Mensagem para cadastro fechado**

Acrescentar em `landing.checkout.errors` do `pt.js`:

```js
ERR_SIGNUP_DISABLED:
  "O cadastro pelo site está fechado agora. Fale com a gente para assinar.",
```

O `errorMessage` atual já mapeia `data.error` para essa chave; nada a mudar nele.

- [ ] **Step 5: Rodar os testes do checkout**

Run: `cd frontend && CI=true npx react-scripts test src/pages/Checkout src/pages/LandingPage --watchAll=false`
Expected: PASS.

- [ ] **Step 6: Formatar e commit**

```bash
cd frontend && npx prettier --write src/pages/Checkout/setup.js src/pages/Checkout/setup.test.js src/pages/Checkout/index.js src/translate/languages/pt.js
cd .. && git add -A frontend
git commit -m "fix(checkout): catch reserved addresses before submitting signup"
```

### Task 4: Liberar o cadastro em produção

**Files:**
- Modify: `docker-compose.dokploy.yml` (serviço `backend`, bloco `environment`, ao lado de `APP_BASE_DOMAIN`)

**Interfaces:**
- Consumes: `getMasterCompanyId()` (Task 1) passa a receber o valor.

- [ ] **Step 1: Passar a variável no compose**

Acrescentar `MASTER_COMPANY_ID: ${MASTER_COMPANY_ID:-1}` no `environment` do `backend`. Confirmar com o Guilherme que a empresa dona da plataforma em produção é a 1 (é a que `CheckCompanyCompliant` e `CheckSettings` já tratam como master).

- [ ] **Step 2: Validar o arquivo**

Run: `docker compose -f docker-compose.dokploy.yml config --quiet` (com as variáveis do `.env` de produção, ou `POSTGRES_USER=x ... ` de mentira só para validar a sintaxe).
Expected: sai sem erro.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.dokploy.yml
git commit -m "fix(deploy): pass MASTER_COMPANY_ID so the landing page can read signup settings"
```

- [ ] **Step 4: Depois do deploy (feito pelo Guilherme)**

1. Entrar como super admin na empresa master, em Configurações → Opções, e colocar "Permitir cadastro" em **Habilitado**.
2. Conferir: `curl https://espacowhats.com.br/backend/public-settings/allowSignup` → `"enabled"`.
3. Abrir `https://espacowhats.com.br/assinar` numa janela anônima, criar uma conta de teste e entrar pelo botão da tela de sucesso. Esperado: login em `https://<slug>.espacowhats.com.br/login` e aviso de teste terminando em 7 dias.
