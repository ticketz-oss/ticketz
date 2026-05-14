# Fork: Integração Asaas (PIX + Boleto + NFS-e)

**Repositório original:** [ticketz-oss/ticketz](https://github.com/ticketz-oss/ticketz)  
**Fork:** [lanaparadinha/ticketz](https://github.com/lanaparadinha/ticketz)  
**Autor das alterações:** Leandro Lana — leandro.lana@migrati.com.br  
**Data:** Maio de 2026

---

## Objetivo

Adicionar suporte completo ao gateway de pagamento **Asaas** com:

- Geração de **PIX** com QR Code
- Geração de **Boleto Bancário**
- Emissão de **NFS-e (Nota Fiscal de Serviço Eletrônica)** via Asaas
- Validação de webhook com token de autenticação
- Cadastro de dados fiscais da empresa diretamente na plataforma
- Submenu "Financeiro" separando Faturas de Configurações

---

## Arquivos Modificados

### Backend

#### `backend/src/models/Company.ts`
Adicionadas colunas para dados fiscais e integração Asaas:

```
+ address: string
+ addressNumber: string
+ province: string
+ city: string
+ state: string
+ municipalRegistration: string   // Inscrição Municipal
+ stateRegistration: string       // Inscrição Estadual
+ fiscalEmail: string
+ asaasCustomerId: string         // Cache do ID do cliente no Asaas
```

#### `backend/src/database/migrations/20260511130000-add-address-fields-to-companies.ts`
**Novo arquivo.** Migration que adiciona `addressNumber` e `province` à tabela `Companies` com verificação de existência prévia (`addIfMissing`) para idempotência.

#### `backend/src/controllers/CompanyController.ts`
Adicionados dois endpoints para gerenciamento dos dados fiscais da empresa logada:

```
GET  /companies/fiscal/me   → retorna campos fiscais da empresa
PUT  /companies/fiscal/me   → atualiza campos fiscais da empresa
```

`FISCAL_FIELDS` exportado inclui: `name`, `document`, `postalCode`, `address`, `addressNumber`, `province`, `city`, `state`, `municipalRegistration`, `stateRegistration`, `fiscalEmail`.

#### `backend/src/controllers/InvoicesController.ts`
Adicionados dois endpoints:

```
POST /invoices/:id/nfse           → emite ou consulta NFS-e no Asaas
POST /invoices/:id/check-payment  → verifica pagamento no Asaas em tempo real
```

Lógica do `emitNfse`:
1. Valida que a fatura está paga
2. Restringe emissão ao mês corrente do pagamento
3. Se `nfseId` já existe: consulta status no Asaas
   - `ERROR` / `CANCELLED` → limpa e reemite
   - `AUTHORIZED` → retorna URL do PDF
   - `SCHEDULED` → retorna status "em processamento"
4. Se não existe: emite nova NFS-e

#### `backend/src/routes/invoicesRoutes.ts`
```
+ POST /invoices/:id/nfse
+ POST /invoices/:id/check-payment
```

#### `backend/src/services/PaymentGatewayServices/AsaasServices.ts`
**Arquivo mais extensamente modificado.** Implementação completa da integração Asaas:

| Função | Descrição |
|--------|-----------|
| `getAsaasApi()` | Cria instância Axios com baseURL e `access_token` configuráveis (sandbox/produção) |
| `buildCustomerPayload(c)` | Monta payload do cliente Asaas com todos os dados fiscais |
| `findOrCreateCustomer(api, company)` | Busca cliente por CPF/CNPJ, cria se não existe, sempre faz PUT para atualizar dados; retry automático em conflito de duplicata |
| `asaasCreatePix(req, res)` | Gera cobrança PIX e retorna QR Code; valida CPF/CNPJ antes da chamada; propaga erro específico do Asaas |
| `asaasCreateBoleto(req, res)` | Gera boleto bancário; valida CPF/CNPJ; propaga erro específico do Asaas |
| `asaasWebhook(req, res)` | Recebe notificações do Asaas; **valida token** via header `asaas-access-token` |
| `asaasCheckStatus(invoice)` | Consulta status de pagamento no Asaas (`/payments/:id`) |
| `asaasPollStatus(invoice)` | Polling em background a cada 2 min por até 48h (fallback sem webhook) |
| `asaasEmitNfse(invoice, company)` | Emite NFS-e: busca serviço pré-cadastrado no Asaas (`GET /invoices/services`) para evitar duplicatas; cria cliente; associa pagamento; busca URL do PDF após emissão |
| `asaasFetchNfseUrl(nfseId)` | Consulta `GET /invoices/:id` e retorna `{ url, status }` |

**Decisão de design — serviço NFS-e:** O Asaas exige um "serviço" cadastrado para emissão de nota. Em vez de criar um novo serviço a cada emissão (causando duplicatas), o código busca o serviço marcado como `isDefault` no painel do Asaas e usa seu `id`. Fallback para campos inline se nenhum serviço estiver configurado.

**Segurança do webhook:** A validação do token é condicional — se `_asaasWebhookToken` não estiver configurado nas super settings, o webhook aceita qualquer requisição (retrocompatibilidade). Quando configurado, rejeita com `401` qualquer chamada sem o token correto.

---

### Frontend

#### `frontend/src/pages/Financeiro/index.js`
Simplificado para exibir apenas a tabela de faturas. Removido formulário de dados fiscais (movido para página dedicada). Adicionados botões:

- **EMITIR NOTA** → chama `POST /invoices/:id/nfse`; abre PDF se disponível
- **VER NOTA** → abre URL da NFS-e diretamente
- **VER BOLETO** → abre PDF do boleto
- **VERIFICAR PGTO** → chama `POST /invoices/:id/check-payment` para forçar verificação no Asaas (aparece apenas para faturas Asaas em aberto com `txId`)

#### `frontend/src/pages/FinanceiroConfig/index.js`
**Novo arquivo.** Página de configuração fiscal da empresa com campos:

- Nome / Razão Social
- CPF / CNPJ
- CEP (com auto-preenchimento via ViaCEP)
- Rua, Número, Bairro, Cidade, UF
- Inscrição Municipal, Inscrição Estadual
- E-mail para NF

Consome `GET /companies/fiscal/me` e `PUT /companies/fiscal/me`.

#### `frontend/src/layout/MainListItems.js`
Substituído link único `/financeiro` por submenu expansível (padrão idêntico ao submenu Campanhas):

```
▾ Financeiro
    Faturas           → /financeiro
    Configurações     → /financeiro-config
```

#### `frontend/src/routes/index.js`
```
+ <Route exact path="/financeiro-config" component={FinanceiroConfig} isPrivate />
```

#### `frontend/src/components/CheckoutPage/CheckoutPage.js`
Removido campo CPF/CNPJ do fluxo de checkout (passo "Revisar"). O backend usa `company.document` diretamente dos dados fiscais cadastrados. Substituído por texto informativo orientando o usuário a cadastrar em Financeiro → Configurações.

#### `frontend/src/components/PaymentGateways/Asaas/AsaasSettings.js`
Adicionados campos de configuração:

- **Token do Webhook** (`_asaasWebhookToken`) — token gerado no painel Asaas para validar requisições
- **Descrição do Serviço** (`_asaasNfseServiceDesc`)
- **Código do Serviço LC116** (`_asaasNfseServiceCode`)
- **Alíquota ISS (%)** (`_asaasNfseIssRate`)

---

## Super Settings Utilizadas

| Chave | Descrição |
|-------|-----------|
| `_paymentGateway` | Gateway ativo (`asaas`) |
| `_asaasApiKey` | API Key do Asaas (`$aact_prod_...`) |
| `_asaasSandbox` | `"true"` para sandbox, `"false"` para produção |
| `_asaasWebhookToken` | Token de autenticação do webhook (`whsec_...`) |
| `_asaasNfseServiceDesc` | Descrição do serviço para NFS-e |
| `_asaasNfseServiceCode` | Código LC116 do serviço |
| `_asaasNfseIssRate` | Alíquota ISS em % |

---

## Como Propor Merge ao Projeto Original

### 1. Sincronizar fork com upstream

```bash
git remote add upstream https://github.com/ticketz-oss/ticketz.git
git fetch upstream
git checkout main
git merge upstream/main
# resolver conflitos se houver
```

### 2. Criar branch temática

```bash
git checkout -b feat/asaas-payment-gateway
```

### 3. Organizar os commits

Os commits desta feature estão em `main`. Para um PR limpo, faça squash ou cherry-pick dos commits relevantes:

```bash
git log --oneline | grep -E 'asaas|nfse|fiscal|invoice|boleto|pix|webhook'
```

### 4. Abrir Pull Request

No GitHub, abra PR de `lanaparadinha/ticketz:feat/asaas-payment-gateway` para `ticketz-oss/ticketz:main` com:

**Título:** `feat: Asaas payment gateway (PIX + Boleto + NFS-e)`

**Descrição sugerida:**

> Adiciona suporte completo ao Asaas como gateway de pagamento:
>
> - PIX com QR Code
> - Boleto Bancário
> - Emissão de NFS-e com busca do serviço pré-cadastrado (sem criar duplicatas)
> - Validação de webhook via token (`asaas-access-token`)
> - Cadastro de dados fiscais da empresa em tela dedicada
> - Submenu Financeiro (Faturas / Configurações)
> - Botão "Verificar Pagamento" para confirmação manual pós-restart
>
> **Breaking changes:** nenhum. Todos os gateways existentes (Efí, PixTicketz) continuam funcionando sem alterações.
>
> **Migration:** `20260511130000-add-address-fields-to-companies.ts` — adiciona `addressNumber` e `province` na tabela `Companies`.

### 5. Checklist antes do PR

- [ ] `npm run build` sem erros no backend
- [ ] `npm run build` sem erros no frontend
- [ ] Migration idempotente testada (rodar duas vezes não causa erro)
- [ ] Webhook testado com token configurado e sem token
- [ ] PIX e Boleto testados em sandbox Asaas
- [ ] NFS-e emitida com sucesso e PDF acessível
